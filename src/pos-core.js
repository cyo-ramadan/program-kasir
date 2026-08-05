import { buildSaleCommand } from '../cloudflare/shared/sale-contract.js';

export const SNAPSHOT_VERSION = 1;
export function createEmptyCart() { return { lines: [], discountAmount: 0 }; }

export function addProductToCart(cart, product, quantity = 1) {
  const parsedQuantity = Number(quantity);
  if (!product?.productId || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) throw new Error('INVALID_CART_LINE');
  const lines = cart.lines.map(line => ({ ...line }));
  const existingLine = lines.find(line => line.productId === product.productId);
  if (existingLine) existingLine.quantity += parsedQuantity;
  else lines.push({ productId: product.productId, productName: product.productName, quantity: parsedQuantity, unitPriceAmount: Number(product.unitPriceAmount) });
  return { ...cart, lines };
}

export function updateCartLineQuantity(cart, productId, quantity) {
  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedQuantity)) throw new Error('INVALID_QUANTITY');
  const lines = parsedQuantity <= 0 ? cart.lines.filter(line => line.productId !== productId) : cart.lines.map(line => line.productId === productId ? { ...line, quantity: parsedQuantity } : line);
  return { ...cart, lines };
}

export function calculateCartTotals(cart) {
  const subtotalAmount = cart.lines.reduce((sum, line) => sum + Number(line.unitPriceAmount) * Number(line.quantity), 0);
  const discountAmount = Math.min(Math.max(Number(cart.discountAmount) || 0, 0), subtotalAmount);
  return { subtotalAmount, discountAmount, totalAmount: subtotalAmount - discountAmount };
}
export function calculateChange(totalAmount, paymentAmount) { return Math.max(Number(paymentAmount) - Number(totalAmount), 0); }

export function validateProduct(products, newProduct) {
  const productId = String(newProduct?.productId || '').trim();
  const productName = String(newProduct?.productName || '').trim();
  const categoryName = String(newProduct?.categoryName || '').trim();
  const barcodeValue = String(newProduct?.barcodeValue || '').trim();
  const unitPriceAmount = Number(newProduct?.unitPriceAmount);
  if (!Array.isArray(products) || !productId || !productName || !categoryName || !Number.isFinite(unitPriceAmount) || unitPriceAmount < 0) throw new Error('INVALID_PRODUCT_DATA');
  let existingIndex = -1;
  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    if (product?.productId === productId) existingIndex = index;
    if (barcodeValue && product?.productId !== productId && String(product?.barcodeValue || '').trim() === barcodeValue) throw new Error('DUPLICATE_BARCODE');
  }
  return { product: { productId, productName, categoryName, barcodeValue, unitPriceAmount, emoji: newProduct?.emoji }, existingIndex };
}

export function upsertProduct(products, newProduct) {
  const { product, existingIndex } = validateProduct(products, newProduct);
  if (existingIndex < 0) return [...products, product];
  const nextProducts = products.slice();
  nextProducts[existingIndex] = product;
  return nextProducts;
}

export function findProductByBarcode(products, barcodeValue) {
  const normalizedBarcode = String(barcodeValue || '').trim();
  if (!normalizedBarcode) return null;
  return products.find(product => String(product.barcodeValue || '').trim() === normalizedBarcode) || null;
}

export function createSale({ saleId, businessDate, cart, paymentMethod, paymentAmount }) {
  const totals = calculateCartTotals(cart);
  if (!cart.lines.length) throw new Error('EMPTY_CART');
  if (Number(paymentAmount) < totals.totalAmount) throw new Error('INSUFFICIENT_PAYMENT');
  return { saleId, businessDate, saleLines: cart.lines.map(line => ({ ...line })), ...totals, paymentMethod, paymentAmount: Number(paymentAmount), changeAmount: calculateChange(totals.totalAmount, paymentAmount) };
}

export function createSnapshot(state) { return JSON.stringify({ snapshotVersion: SNAPSHOT_VERSION, state }); }
export function restoreSnapshot(serializedSnapshot, fallbackState) {
  try { const snapshot = JSON.parse(serializedSnapshot); return snapshot?.snapshotVersion === SNAPSHOT_VERSION && snapshot.state ? snapshot.state : fallbackState; }
  catch { return fallbackState; }
}

export class BarcodeScannerPort { connect() { throw new Error('BARCODE_ADAPTER_NOT_CONFIGURED'); } disconnect() {} }

export class GaramIntegrationPort {
  constructor({ baseUrl, bearerToken, fetchImpl, now } = {}) {
    const runtimeConfig = globalThis.window?.MAXI_RUNTIME_CONFIG || {};
    this.baseUrl = String(baseUrl ?? runtimeConfig.garamApiBaseUrl ?? '').replace(/\/$/, '');
    this.bearerToken = String(bearerToken ?? runtimeConfig.garamApiBearerToken ?? '');
    this.fetchImpl = fetchImpl ?? globalThis.fetch;
    this.now = now ?? (() => new Date().toISOString());
  }
  get isConfigured() { return Boolean(this.baseUrl && this.bearerToken && this.fetchImpl); }
  enqueueSale(sale) {
    if (!this.isConfigured) return { isConfigured: false };
    const syncPromise = this.sendSale(sale);
    return { isConfigured: true, syncStatus: 'PENDING', syncPromise };
  }
  async sendSale(sale) {
    const command = buildSaleCommand({ ...sale, occurredAt: sale?.occurredAt || this.now() });
    const idempotencyKey = `garam-pos:${command.saleHeader.saleId}:completed`;
    const response = await this.fetchImpl(`${this.baseUrl}/api/v1/sales`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.bearerToken}`, 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
      body: JSON.stringify(command)
    });
    const result = await response.json();
    if (!response.ok) { const error = new Error(result?.errorCode || 'GARAM_SYNC_FAILED'); error.code = result?.errorCode || 'GARAM_SYNC_FAILED'; throw error; }
    return result;
  }
}

// Backward-compatible alias. It sends business facts to Garam, never directly to Accounting.
export class AccountingIntegrationPort extends GaramIntegrationPort {}
