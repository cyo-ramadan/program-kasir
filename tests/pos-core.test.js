import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AccountingIntegrationPort, addProductToCart, calculateCartTotals, calculateChange,
  createEmptyCart, createSale, createSnapshot, findProductByBarcode, restoreSnapshot,
  updateCartLineQuantity, upsertProduct
} from '../src/pos-core.js';


const tea = { productId: 'PRD-001', productName: 'Vanilla Tea', barcodeValue: '899001', unitPriceAmount: 6000 };


test('merges duplicate product into one cart line', () => {
  let cart = addProductToCart(createEmptyCart(), tea, 1);
  cart = addProductToCart(cart, tea, 2);
  assert.equal(cart.lines.length, 1);
  assert.equal(cart.lines[0].quantity, 3);
});


test('calculates subtotal, capped discount, total, and change deterministically', () => {
  const cart = { ...addProductToCart(createEmptyCart(), tea, 2), discountAmount: 2000 };
  assert.deepEqual(calculateCartTotals(cart), { subtotalAmount: 12000, discountAmount: 2000, totalAmount: 10000 });
  assert.equal(calculateChange(10000, 15000), 5000);
});


test('removes a cart line when quantity becomes zero', () => {
  const cart = addProductToCart(createEmptyCart(), tea, 1);
  assert.equal(updateCartLineQuantity(cart, tea.productId, 0).lines.length, 0);
});


test('finds exact normalized barcode and returns null for unknown barcode', () => {
  assert.equal(findProductByBarcode([tea], ' 899001 ')?.productId, tea.productId);
  assert.equal(findProductByBarcode([tea], 'missing'), null);
});


test('creates a completed local sale and rejects insufficient payment', () => {
  const cart = addProductToCart(createEmptyCart(), tea, 2);
  const sale = createSale({ saleId: 'SALE-1', businessDate: '2026-08-01', cart, paymentMethod: 'cash', paymentAmount: 15000 });
  assert.equal(sale.totalAmount, 12000);
  assert.equal(sale.changeAmount, 3000);
  assert.throws(() => createSale({ saleId: 'SALE-2', businessDate: '2026-08-01', cart, paymentMethod: 'cash', paymentAmount: 1000 }), /INSUFFICIENT_PAYMENT/);
});


test('restores a valid snapshot and safely rejects incompatible data', () => {
  const state = { products: [tea], sales: [] };
  assert.deepEqual(restoreSnapshot(createSnapshot(state), {}), state);
  assert.deepEqual(restoreSnapshot('{"snapshotVersion":99}', state), state);
});


test('accounting integration is explicitly disabled until an approved adapter exists', () => {
  assert.deepEqual(new AccountingIntegrationPort().enqueueSale({}), { isConfigured: false });
});


test('upserts products immutably for both create and update', () => {
  const products = [{ ...tea, categoryName: 'Minuman', emoji: '🥤' }];
  const addedProduct = { productId: 'PRD-002', productName: 'Pentol', categoryName: 'Makanan', barcodeValue: '899002', unitPriceAmount: 5000, emoji: '🍢' };
  const afterAdd = upsertProduct(products, addedProduct);
  assert.equal(products.length, 1);
  assert.equal(afterAdd.length, 2);
  assert.notEqual(afterAdd, products);
  assert.deepEqual(afterAdd[1], addedProduct);
  const updatedProduct = { ...addedProduct, productName: 'Pentol Cabe', unitPriceAmount: 7000 };
  const afterUpdate = upsertProduct(afterAdd, updatedProduct);
  assert.equal(afterAdd[1].productName, 'Pentol');
  assert.equal(afterUpdate.length, 2);
  assert.deepEqual(afterUpdate[1], updatedProduct);
  assert.equal(afterUpdate[0], afterAdd[0]);
});
test('rejects a barcode already used by another product', () => {
  const products = [{ ...tea, categoryName: 'Minuman', emoji: '🥤' }];
  const duplicateBarcodeProduct = { productId: 'PRD-002', productName: 'Produk Baru', categoryName: 'Lainnya', barcodeValue: tea.barcodeValue, unitPriceAmount: 1000, emoji: '📦' };
  assert.throws(() => upsertProduct(products, duplicateBarcodeProduct), /DUPLICATE_BARCODE/);
});
