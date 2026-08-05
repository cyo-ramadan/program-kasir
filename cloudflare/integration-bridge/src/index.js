import { ContractError, validateEventEnvelope } from '../../shared/sale-contract.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

async function timingSafeTextEqual(left, right) {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  if (leftBytes.byteLength !== rightBytes.byteLength) return false;
  return crypto.subtle.timingSafeEqual(leftBytes, rightBytes);
}

async function requireAuthorization(request, env) {
  if (!env.BRIDGE_API_BEARER_TOKEN) throw Object.assign(new Error('Bridge API bearer token is not configured'), { code: 'AUTH_NOT_CONFIGURED' });
  const expected = `Bearer ${env.BRIDGE_API_BEARER_TOKEN}`;
  const actual = request.headers.get('authorization') || '';
  if (!(await timingSafeTextEqual(actual, expected))) throw Object.assign(new Error('Unauthorized request'), { code: 'UNAUTHORIZED' });
}

async function eventExists(env, eventId) {
  return env.BRIDGE_DB.prepare('SELECT eventId, processingStatus FROM integrationEventHeaders WHERE eventId=?1').bind(eventId).first();
}

async function persistEvent(env, event) {
  const normalized = validateEventEnvelope(event);
  const existing = await eventExists(env, normalized.eventId);
  if (existing) return { duplicate: true, processingStatus: existing.processingStatus };

  const statements = [env.BRIDGE_DB.prepare(`
    INSERT INTO integrationEventHeaders (
      eventId, eventType, contractVersion, sourceApp, transactionId,
      occurredAt, businessDate, correlationId, idempotencyKey, payloadJson, processingStatus
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'NEEDS_MAPPING')
  `).bind(
    normalized.eventId, normalized.eventType, normalized.contractVersion, normalized.sourceApp,
    normalized.transactionId, normalized.occurredAt, normalized.businessDate,
    normalized.correlationId, normalized.idempotencyKey, JSON.stringify(normalized.payload)
  )];

  for (let index = 0; index < normalized.payload.saleDetails.length; index += 1) {
    const line = normalized.payload.saleDetails[index];
    statements.push(env.BRIDGE_DB.prepare(`
      INSERT INTO integrationEventDetails (
        eventDetailId, eventId, lineNumber, sourceProductId, productNameSnapshot,
        quantity, sourceUnitOfMeasureId, unitPriceAmountMinor, lineTotalAmountMinor
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `).bind(
      `${normalized.eventId}:detail:${index + 1}`, normalized.eventId, index + 1,
      line.productId, line.productNameSnapshot, line.quantity, line.unitOfMeasureId,
      line.unitPriceAmountMinor, line.lineTotalAmountMinor
    ));
  }

  for (const targetSystem of ['ACCOUNTING', 'WAREHOUSE']) {
    statements.push(env.BRIDGE_DB.prepare(`
      INSERT INTO integrationEventTargets (eventTargetId, eventId, targetSystem, targetStatus, lastErrorCode)
      VALUES (?1, ?2, ?3, 'NEEDS_MAPPING', 'MAPPING_NOT_CONFIGURED')
    `).bind(`${normalized.eventId}:${targetSystem.toLowerCase()}`, normalized.eventId, targetSystem));
  }

  try {
    await env.BRIDGE_DB.batch(statements);
    return { duplicate: false, processingStatus: 'NEEDS_MAPPING' };
  } catch (error) {
    const duplicate = await eventExists(env, normalized.eventId);
    if (duplicate) return { duplicate: true, processingStatus: duplicate.processingStatus };
    throw error;
  }
}

async function handleQueue(batch, env) {
  for (const message of batch.messages) {
    try {
      const outcome = await persistEvent(env, message.body);
      console.log(JSON.stringify({ level: 'info', service: 'integration-bridge', eventId: message.body?.eventId, ...outcome }));
      message.ack();
    } catch (error) {
      const errorCode = error instanceof ContractError ? error.code : 'BRIDGE_PERSISTENCE_FAILED';
      console.error(JSON.stringify({ level: 'error', service: 'integration-bridge', eventId: message.body?.eventId, errorCode, message: error?.message }));
      if (error instanceof ContractError) message.ack();
      else message.retry({ delaySeconds: 60 });
    }
  }
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/health') return jsonResponse({ service: 'integration-bridge', status: 'ok', routingStatus: 'NEEDS_MAPPING' });
  await requireAuthorization(request, env);
  const eventMatch = url.pathname.match(/^\/internal\/events\/([^/]+)$/);
  if (request.method === 'GET' && eventMatch) {
    const eventId = decodeURIComponent(eventMatch[1]);
    const eventHeader = await env.BRIDGE_DB.prepare('SELECT * FROM integrationEventHeaders WHERE eventId=?1').bind(eventId).first();
    if (!eventHeader) return jsonResponse({ errorCode: 'EVENT_NOT_FOUND' }, 404);
    const [eventDetails, eventTargets] = await Promise.all([
      env.BRIDGE_DB.prepare('SELECT * FROM integrationEventDetails WHERE eventId=?1 ORDER BY lineNumber').bind(eventId).all(),
      env.BRIDGE_DB.prepare('SELECT * FROM integrationEventTargets WHERE eventId=?1 ORDER BY targetSystem').bind(eventId).all()
    ]);
    return jsonResponse({ eventHeader, eventDetails: eventDetails.results, eventTargets: eventTargets.results });
  }
  return jsonResponse({ errorCode: 'ROUTE_NOT_FOUND' }, 404);
}

export default {
  async fetch(request, env) {
    try { return await handleRequest(request, env); }
    catch (error) {
      const errorCode = error?.code || 'INTERNAL_ERROR';
      const status = errorCode === 'UNAUTHORIZED' ? 401 : errorCode === 'AUTH_NOT_CONFIGURED' ? 503 : 500;
      console.error(JSON.stringify({ level: 'error', service: 'integration-bridge', errorCode, message: error?.message }));
      return jsonResponse({ errorCode, message: status >= 500 ? 'Internal service error' : error.message }, status);
    }
  },
  async queue(batch, env) { await handleQueue(batch, env); }
};

export { handleQueue, persistEvent };
