import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSaleCommand, buildSaleCompletedEvent, validateEventEnvelope } from '../cloudflare/shared/sale-contract.js';

const localSale = {
  saleId: 'SALE-001', businessDate: '2026-08-05', occurredAt: '2026-08-05T15:16:00.000Z',
  saleLines: [
    { productId: 'PRD-001', productName: 'Es Teh Vanilla', quantity: 2, unitPriceAmount: 6000 },
    { productId: 'PRD-004', productName: 'Pentol Kecil', quantity: 1, unitPriceAmount: 5000 }
  ],
  subtotalAmount: 17000, discountAmount: 2000, totalAmount: 15000,
  paymentMethod: 'cash', paymentAmount: 20000, changeAmount: 5000
};

test('builds deterministic sale header and detail records', () => {
  const command = buildSaleCommand(localSale);
  assert.equal(command.saleHeader.totalAmountMinor, 15000);
  assert.equal(command.saleDetails.length, 2);
  assert.equal(command.saleDetails[0].saleLineId, 'SALE-001:line:1');
  assert.equal(command.saleDetails[0].quantity, '2');
  assert.equal(command.salePayments[0].paymentMethodId, 'CASH');
});

test('rejects a sale when header and detail totals differ', () => {
  assert.throws(() => buildSaleCommand({ ...localSale, subtotalAmount: 16000 }), error => error.code === 'SALE_SUBTOTAL_MISMATCH');
});

test('builds and validates a versioned sale.completed event', () => {
  const event = buildSaleCompletedEvent(buildSaleCommand(localSale), {
    eventId: 'evt-sale-001', correlationId: 'corr-sale-001', idempotencyKey: 'garam-pos:SALE-001:completed'
  });
  assert.equal(event.eventType, 'sale.completed.v1');
  assert.equal(validateEventEnvelope(event).transactionId, 'SALE-001');
});

test('rejects an unsupported source application', () => {
  const event = buildSaleCompletedEvent(buildSaleCommand(localSale), {
    eventId: 'evt-sale-001', correlationId: 'corr-sale-001', idempotencyKey: 'garam-pos:SALE-001:completed'
  });
  assert.throws(() => validateEventEnvelope({ ...event, sourceApp: 'unknown-pos' }), error => error.code === 'UNAUTHORIZED_SOURCE_APP');
});
