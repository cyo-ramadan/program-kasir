import { buildSaleCompletedEvent, validateSaleCommand } from '../../shared/sale-contract.js';

const MAX_REQUEST_BYTES = 1_000_000;
const DISPATCH_BATCH_SIZE = 25;

function jsonResponse(body, status = 200, request, env) {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  const origin = request?.headers.get('origin');
  if (origin && env?.ALLOWED_ORIGIN && origin === env.ALLOWED_ORIGIN) {
    headers.set('access-control-allow-origin', origin);
    headers.set('access-control-allow-headers', 'authorization, content-type, idempotency-key');
    headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
    headers.set('vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(error, request, env) {
  const statusByCode = {
    AUTH_NOT_CONFIGURED: 503, UNAUTHORIZED: 401, INVALID_JSON: 400, REQUEST_TOO_LARGE: 413,
    IDEMPOTENCY_KEY_REQUIRED: 400, SALE_NOT_FOUND: 404, ROUTE_NOT_FOUND: 404,
    INVALID_REQUIRED_TEXT: 400, INVALID_INTEGER: 400, INVALID_BUSINESS_DATE: 400,
    INVALID_UTC_TIMESTAMP: 400, INVALID_QUANTITY: 400, EMPTY_SALE_DETAILS: 400,
    SALE_SUBTOTAL_MISMATCH: 422, SALE_TOTAL_MISMATCH: 422, PAYMENT_TOTAL_MISMATCH: 422
  };
  const errorCode = error?.code || 'INTERNAL_ERROR';
  const status = statusByCode[errorCode] || 500;
  console.error(JSON.stringify({ level: 'error', service: 'garam-api', errorCode, message: error?.message, details: error?.details }));
  return jsonResponse({ errorCode, message: status >= 500 ? 'Internal service error' : error.message }, status, request, env);
}

async function timingSafeTextEqual(left, right) {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  if (leftBytes.byteLength !== rightBytes.byteLength) return false;
  return crypto.subtle.timingSafeEqual(leftBytes, rightBytes);
}

async function requireAuthorization(request, env) {
  if (!env.API_BEARER_TOKEN) throw Object.assign(new Error('API bearer token is not configured'), { code: 'AUTH_NOT_CONFIGURED' });
  const authorization = request.headers.get('authorization') || '';
  if (!(await timingSafeTextEqual(authorization, `Bearer ${env.API_BEARER_TOKEN}`))) {
    throw Object.assign(new Error('Unauthorized request'), { code: 'UNAUTHORIZED' });
  }
}

async function readJson(request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) throw Object.assign(new Error('Request body exceeds the supported size'), { code: 'REQUEST_TOO_LARGE' });
  try { return await request.json(); }
  catch { throw Object.assign(new Error('Request body must contain valid JSON'), { code: 'INVALID_JSON' }); }
}

async function findSaleByIdempotencyKey(env, idempotencyKey) {
  return env.GARAM_DB.prepare('SELECT saleId, saleStatus, integrationStatus FROM saleHeaders WHERE idempotencyKey = ?1').bind(idempotencyKey).first();
}

async function persistSale(env, command, event, idempotencyKey) {
  const { saleHeader, saleDetails, salePayments } = command;
  const statements = [env.GARAM_DB.prepare(`
    INSERT INTO saleHeaders (
      saleId, businessDate, occurredAt, sourceApp, subtotalAmountMinor,
      discountAmountMinor, totalAmountMinor, saleStatus, idempotencyKey, integrationStatus
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'PENDING')
  `).bind(
    saleHeader.saleId, saleHeader.businessDate, saleHeader.occurredAt, saleHeader.sourceApp,
    saleHeader.subtotalAmountMinor, saleHeader.discountAmountMinor, saleHeader.totalAmountMinor,
    saleHeader.saleStatus, idempotencyKey
  )];

  for (let index = 0; index < saleDetails.length; index += 1) {
    const line = saleDetails[index];
    statements.push(env.GARAM_DB.prepare(`
      INSERT INTO saleDetails (
        saleLineId, saleId, lineNumber, productId, productNameSnapshot,
        quantity, unitOfMeasureId, unitPriceAmountMinor, lineTotalAmountMinor
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `).bind(
      line.saleLineId, saleHeader.saleId, index + 1, line.productId, line.productNameSnapshot,
      line.quantity, line.unitOfMeasureId, line.unitPriceAmountMinor, line.lineTotalAmountMinor
    ));
  }

  for (const payment of salePayments) {
    statements.push(env.GARAM_DB.prepare(`
      INSERT INTO salePayments (salePaymentId, saleId, paymentMethodId, paymentAmountMinor, changeAmountMinor)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(payment.salePaymentId, saleHeader.saleId, payment.paymentMethodId, payment.paymentAmountMinor, payment.changeAmountMinor));
  }

  statements.push(env.GARAM_DB.prepare(`
    INSERT INTO integrationOutbox (
      eventId, aggregateType, aggregateId, eventType, contractVersion,
      idempotencyKey, payloadJson, dispatchStatus
    ) VALUES (?1, 'SALE', ?2, ?3, ?4, ?5, ?6, 'PENDING')
  `).bind(event.eventId, saleHeader.saleId, event.eventType, event.contractVersion, event.idempotencyKey, JSON.stringify(event)));

  await env.GARAM_DB.batch(statements);
}

async function dispatchOutbox(env, limit = DISPATCH_BATCH_SIZE) {
  const contractAccepted = env.INTEGRATION_CONTRACT_STATUS === 'ACCEPTED';
  const pending = await env.GARAM_DB.prepare(`
    SELECT eventId, aggregateId, payloadJson FROM integrationOutbox
    WHERE dispatchStatus IN ('PENDING', 'FAILED', 'BLOCKED_CONTRACT')
    ORDER BY createdAt ASC LIMIT ?1
  `).bind(limit).all();
  const results = [];

  for (const row of pending.results ?? []) {
    if (!contractAccepted) {
      await env.GARAM_DB.batch([
        env.GARAM_DB.prepare(`UPDATE integrationOutbox SET dispatchStatus='BLOCKED_CONTRACT', lastErrorCode='CONTRACT_NOT_ACCEPTED', updatedAt=CURRENT_TIMESTAMP WHERE eventId=?1`).bind(row.eventId),
        env.GARAM_DB.prepare(`UPDATE saleHeaders SET integrationStatus='BLOCKED_CONTRACT', updatedAt=CURRENT_TIMESTAMP WHERE saleId=?1`).bind(row.aggregateId)
      ]);
      results.push({ eventId: row.eventId, dispatchStatus: 'BLOCKED_CONTRACT' });
      continue;
    }
    try {
      await env.INTEGRATION_QUEUE.send(JSON.parse(row.payloadJson), { contentType: 'json' });
      await env.GARAM_DB.batch([
        env.GARAM_DB.prepare(`UPDATE integrationOutbox SET dispatchStatus='DISPATCHED', dispatchedAt=CURRENT_TIMESTAMP, lastErrorCode=NULL, updatedAt=CURRENT_TIMESTAMP WHERE eventId=?1`).bind(row.eventId),
        env.GARAM_DB.prepare(`UPDATE saleHeaders SET integrationStatus='DISPATCHED', updatedAt=CURRENT_TIMESTAMP WHERE saleId=?1`).bind(row.aggregateId)
      ]);
      results.push({ eventId: row.eventId, dispatchStatus: 'DISPATCHED' });
    } catch (error) {
      await env.GARAM_DB.prepare(`UPDATE integrationOutbox SET dispatchStatus='FAILED', attemptCount=attemptCount+1, lastErrorCode='QUEUE_SEND_FAILED', updatedAt=CURRENT_TIMESTAMP WHERE eventId=?1`).bind(row.eventId).run();
      console.error(JSON.stringify({ level: 'error', service: 'garam-api', operation: 'dispatchOutbox', eventId: row.eventId, message: error?.message }));
      results.push({ eventId: row.eventId, dispatchStatus: 'FAILED' });
    }
  }
  return results;
}

async function createSale(request, env, ctx) {
  await requireAuthorization(request, env);
  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!idempotencyKey) throw Object.assign(new Error('Idempotency-Key header is required'), { code: 'IDEMPOTENCY_KEY_REQUIRED' });

  const existing = await findSaleByIdempotencyKey(env, idempotencyKey);
  if (existing) return jsonResponse({ ...existing, idempotentReplay: true }, 200, request, env);

  const command = validateSaleCommand(await readJson(request));
  const event = buildSaleCompletedEvent(command, {
    eventId: crypto.randomUUID(), correlationId: crypto.randomUUID(), idempotencyKey
  });
  try { await persistSale(env, command, event, idempotencyKey); }
  catch (error) {
    const duplicate = await findSaleByIdempotencyKey(env, idempotencyKey);
    if (duplicate) return jsonResponse({ ...duplicate, idempotentReplay: true }, 200, request, env);
    throw error;
  }
  ctx.waitUntil(dispatchOutbox(env, 1));
  return jsonResponse({ saleId: command.saleHeader.saleId, saleStatus: command.saleHeader.saleStatus, integrationStatus: 'PENDING', idempotentReplay: false }, 201, request, env);
}

async function getSale(request, env, saleId) {
  await requireAuthorization(request, env);
  const saleHeader = await env.GARAM_DB.prepare('SELECT * FROM saleHeaders WHERE saleId=?1').bind(saleId).first();
  if (!saleHeader) throw Object.assign(new Error('Sale was not found'), { code: 'SALE_NOT_FOUND' });
  const [saleDetails, salePayments] = await Promise.all([
    env.GARAM_DB.prepare('SELECT * FROM saleDetails WHERE saleId=?1 ORDER BY lineNumber').bind(saleId).all(),
    env.GARAM_DB.prepare('SELECT * FROM salePayments WHERE saleId=?1 ORDER BY createdAt').bind(saleId).all()
  ]);
  return jsonResponse({ saleHeader, saleDetails: saleDetails.results, salePayments: salePayments.results }, 200, request, env);
}

async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true }, 204, request, env);
  if (request.method === 'GET' && url.pathname === '/health') return jsonResponse({ service: 'garam-api', status: 'ok', contractStatus: env.INTEGRATION_CONTRACT_STATUS || 'STAGED' }, 200, request, env);
  if (request.method === 'POST' && url.pathname === '/api/v1/sales') return createSale(request, env, ctx);
  if (request.method === 'POST' && url.pathname === '/internal/outbox/dispatch') {
    await requireAuthorization(request, env);
    return jsonResponse({ results: await dispatchOutbox(env) }, 200, request, env);
  }
  const saleMatch = url.pathname.match(/^\/api\/v1\/sales\/([^/]+)$/);
  if (request.method === 'GET' && saleMatch) return getSale(request, env, decodeURIComponent(saleMatch[1]));
  throw Object.assign(new Error('Route was not found'), { code: 'ROUTE_NOT_FOUND' });
}

export default {
  async fetch(request, env, ctx) {
    try { return await handleRequest(request, env, ctx); }
    catch (error) { return errorResponse(error, request, env); }
  },
  async scheduled(_controller, env, ctx) { ctx.waitUntil(dispatchOutbox(env)); }
};

export { dispatchOutbox, handleRequest };
