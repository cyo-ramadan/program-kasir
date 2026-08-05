import test from 'node:test';
import assert from 'node:assert/strict';
import { GaramIntegrationPort } from '../src/pos-core.js';

const sale = {
  saleId: 'SALE-PORT-001', businessDate: '2026-08-05',
  saleLines: [{ productId: 'PRD-001', productName: 'Es Teh Vanilla', quantity: 1, unitPriceAmount: 6000 }],
  subtotalAmount: 6000, discountAmount: 0, totalAmount: 6000,
  paymentMethod: 'cash', paymentAmount: 10000, changeAmount: 4000
};

test('stays fail-closed when Garam runtime configuration is absent', () => {
  assert.deepEqual(new GaramIntegrationPort().enqueueSale(sale), { isConfigured: false });
});

test('sends canonical header-detail payload with a stable idempotency key', async () => {
  let captured;
  const port = new GaramIntegrationPort({
    baseUrl: 'https://garam.example.test', bearerToken: 'test-token', now: () => '2026-08-05T15:30:00.000Z',
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({ saleId: 'SALE-PORT-001', integrationStatus: 'PENDING' }), { status: 201, headers: { 'content-type': 'application/json' } });
    }
  });
  const result = await port.enqueueSale(sale).syncPromise;
  assert.equal(result.saleId, 'SALE-PORT-001');
  assert.equal(captured.init.headers['idempotency-key'], 'garam-pos:SALE-PORT-001:completed');
  const body = JSON.parse(captured.init.body);
  assert.equal(body.saleHeader.totalAmountMinor, 6000);
  assert.equal(body.saleDetails[0].saleLineId, 'SALE-PORT-001:line:1');
});
