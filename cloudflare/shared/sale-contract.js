export const SALE_COMPLETED_EVENT_TYPE = 'sale.completed.v1';
export const SALE_CONTRACT_VERSION = '1.0.0';
export const GARAM_SOURCE_APP = 'garam-pos';

export class ContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
    this.details = details;
  }
}

function requireText(value, fieldName) {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new ContractError('INVALID_REQUIRED_TEXT', `${fieldName} is required`, { fieldName });
  return normalized;
}

function requireInteger(value, fieldName, minimum = 0) {
  const normalized = Number(value);
  if (!Number.isSafeInteger(normalized) || normalized < minimum) {
    throw new ContractError('INVALID_INTEGER', `${fieldName} must be a safe integer >= ${minimum}`, { fieldName, value });
  }
  return normalized;
}

function requireDate(value, fieldName) {
  const normalized = requireText(value, fieldName);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new ContractError('INVALID_BUSINESS_DATE', `${fieldName} must use YYYY-MM-DD`, { fieldName, value });
  }
  return normalized;
}

function requireTimestamp(value, fieldName) {
  const normalized = requireText(value, fieldName);
  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp) || !normalized.endsWith('Z')) {
    throw new ContractError('INVALID_UTC_TIMESTAMP', `${fieldName} must be an ISO 8601 UTC timestamp`, { fieldName, value });
  }
  return normalized;
}

function normalizeQuantity(value, fieldName) {
  const normalized = String(value ?? '').trim();
  if (!/^[1-9]\d*$/.test(normalized)) {
    throw new ContractError('INVALID_QUANTITY', `${fieldName} must be a positive integer string for contract v1`, { fieldName, value });
  }
  return normalized;
}

export function buildSaleCommand(localSale) {
  const saleId = requireText(localSale?.saleId, 'saleId');
  const businessDate = requireDate(localSale?.businessDate, 'businessDate');
  const occurredAt = requireTimestamp(localSale?.occurredAt, 'occurredAt');
  const saleLines = Array.isArray(localSale?.saleLines) ? localSale.saleLines : [];
  if (!saleLines.length) throw new ContractError('EMPTY_SALE_DETAILS', 'saleDetails must contain at least one line');

  const saleDetails = saleLines.map((line, index) => {
    const quantity = normalizeQuantity(line?.quantity, `saleDetails[${index}].quantity`);
    const unitPriceAmountMinor = requireInteger(line?.unitPriceAmount, `saleDetails[${index}].unitPriceAmountMinor`);
    return {
      saleLineId: `${saleId}:line:${index + 1}`,
      productId: requireText(line?.productId, `saleDetails[${index}].productId`),
      productNameSnapshot: requireText(line?.productName, `saleDetails[${index}].productNameSnapshot`),
      quantity,
      unitOfMeasureId: null,
      unitPriceAmountMinor,
      lineTotalAmountMinor: unitPriceAmountMinor * Number(quantity)
    };
  });

  const subtotalAmountMinor = requireInteger(localSale?.subtotalAmount, 'subtotalAmountMinor');
  const discountAmountMinor = requireInteger(localSale?.discountAmount, 'discountAmountMinor');
  const totalAmountMinor = requireInteger(localSale?.totalAmount, 'totalAmountMinor');
  const paymentAmountMinor = requireInteger(localSale?.paymentAmount, 'paymentAmountMinor');
  const changeAmountMinor = requireInteger(localSale?.changeAmount, 'changeAmountMinor');
  const calculatedSubtotal = saleDetails.reduce((sum, line) => sum + line.lineTotalAmountMinor, 0);

  if (calculatedSubtotal !== subtotalAmountMinor) {
    throw new ContractError('SALE_SUBTOTAL_MISMATCH', 'sale detail totals do not match sale header subtotal', { calculatedSubtotal, subtotalAmountMinor });
  }
  if (subtotalAmountMinor - discountAmountMinor !== totalAmountMinor) {
    throw new ContractError('SALE_TOTAL_MISMATCH', 'sale header total is inconsistent', { subtotalAmountMinor, discountAmountMinor, totalAmountMinor });
  }
  if (paymentAmountMinor - changeAmountMinor !== totalAmountMinor) {
    throw new ContractError('PAYMENT_TOTAL_MISMATCH', 'payment and change are inconsistent with total', { paymentAmountMinor, changeAmountMinor, totalAmountMinor });
  }

  return {
    saleHeader: {
      saleId,
      businessDate,
      occurredAt,
      sourceApp: GARAM_SOURCE_APP,
      subtotalAmountMinor,
      discountAmountMinor,
      totalAmountMinor,
      saleStatus: 'COMPLETED'
    },
    saleDetails,
    salePayments: [{
      salePaymentId: `${saleId}:payment:1`,
      paymentMethodId: requireText(localSale?.paymentMethod, 'paymentMethodId').toUpperCase(),
      paymentAmountMinor,
      changeAmountMinor
    }]
  };
}

export function validateSaleCommand(command) {
  return buildSaleCommand({
    saleId: command?.saleHeader?.saleId,
    businessDate: command?.saleHeader?.businessDate,
    occurredAt: command?.saleHeader?.occurredAt,
    subtotalAmount: command?.saleHeader?.subtotalAmountMinor,
    discountAmount: command?.saleHeader?.discountAmountMinor,
    totalAmount: command?.saleHeader?.totalAmountMinor,
    paymentMethod: command?.salePayments?.[0]?.paymentMethodId,
    paymentAmount: command?.salePayments?.[0]?.paymentAmountMinor,
    changeAmount: command?.salePayments?.[0]?.changeAmountMinor,
    saleLines: (command?.saleDetails ?? []).map(line => ({
      productId: line?.productId,
      productName: line?.productNameSnapshot,
      quantity: line?.quantity,
      unitPriceAmount: line?.unitPriceAmountMinor
    }))
  });
}

export function buildSaleCompletedEvent(command, { eventId, correlationId, idempotencyKey }) {
  const normalizedCommand = validateSaleCommand(command);
  const saleId = normalizedCommand.saleHeader.saleId;
  return {
    eventId: requireText(eventId, 'eventId'),
    eventType: SALE_COMPLETED_EVENT_TYPE,
    contractVersion: SALE_CONTRACT_VERSION,
    sourceApp: GARAM_SOURCE_APP,
    transactionId: saleId,
    occurredAt: normalizedCommand.saleHeader.occurredAt,
    businessDate: normalizedCommand.saleHeader.businessDate,
    correlationId: requireText(correlationId, 'correlationId'),
    idempotencyKey: requireText(idempotencyKey, 'idempotencyKey'),
    payload: normalizedCommand
  };
}

export function validateEventEnvelope(event) {
  if (event?.eventType !== SALE_COMPLETED_EVENT_TYPE) {
    throw new ContractError('UNSUPPORTED_EVENT_TYPE', 'eventType is not supported', { eventType: event?.eventType });
  }
  if (event?.contractVersion !== SALE_CONTRACT_VERSION) {
    throw new ContractError('UNSUPPORTED_CONTRACT_VERSION', 'contractVersion is not supported', { contractVersion: event?.contractVersion });
  }
  const normalized = buildSaleCompletedEvent(event?.payload, {
    eventId: event?.eventId,
    correlationId: event?.correlationId,
    idempotencyKey: event?.idempotencyKey
  });
  if (requireText(event?.sourceApp, 'sourceApp') !== GARAM_SOURCE_APP) {
    throw new ContractError('UNAUTHORIZED_SOURCE_APP', 'sourceApp is not registered for this contract');
  }
  if (requireText(event?.transactionId, 'transactionId') !== normalized.transactionId) {
    throw new ContractError('TRANSACTION_ID_MISMATCH', 'transactionId does not match the payload saleId');
  }
  return normalized;
}
