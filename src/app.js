import {
  AccountingIntegrationPort, addProductToCart, calculateCartTotals, calculateChange,
  createEmptyCart, createSale, createSnapshot, findProductByBarcode, restoreSnapshot,
  updateCartLineQuantity, upsertProduct
} from './pos-core.js';


const STORAGE_KEY = 'maxi.pos.snapshot.v1';
const rupiah = amount => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
const today = () => new Date().toISOString().slice(0, 10);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character]));


const seedState = {
  products: [
    { productId:'PRD-001', productName:'Es Teh Vanilla', categoryName:'Minuman', barcodeValue:'899100001', unitPriceAmount:6000, emoji:'🥤' },
    { productId:'PRD-002', productName:'Es Teh Jasmine', categoryName:'Minuman', barcodeValue:'899100002', unitPriceAmount:6000, emoji:'🧋' },
    { productId:'PRD-003', productName:'Leci Tea', categoryName:'Minuman', barcodeValue:'899100003', unitPriceAmount:8000, emoji:'🍹' },
    { productId:'PRD-004', productName:'Pentol Kecil', categoryName:'Makanan', barcodeValue:'899200001', unitPriceAmount:5000, emoji:'🍢' },
    { productId:'PRD-005', productName:'Pentol Besar Cabe', categoryName:'Makanan', barcodeValue:'899200002', unitPriceAmount:8000, emoji:'🌶️' },
    { productId:'PRD-006', productName:'Air Mineral', categoryName:'Minuman', barcodeValue:'899300001', unitPriceAmount:4000, emoji:'💧' }
  ],
  sales: [],
  register: { isOpen: true, openedDate: today() }
};


let state = restoreSnapshot(localStorage.getItem(STORAGE_KEY), structuredClone(seedState));
let cart = createEmptyCart();
let selectedCategory = 'Semua';
let selectedPaymentMethod = 'cash';
const accountingIntegration = new AccountingIntegrationPort();


const $ = id => document.getElementById(id);
const persist = () => localStorage.setItem(STORAGE_KEY, createSnapshot(state));
const makeSaleId = () => `SALE-${Date.now()}`;


function showToast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $('toast').classList.remove('show'), 1800);
}


function renderCategoryFilters() {
  const categories = ['Semua', ...new Set(state.products.map(product => product.categoryName))];
  $('categoryFilters').innerHTML = categories.map(category => `<button class="chip ${category === selectedCategory ? 'active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
}


function renderProducts() {
  const query = $('productSearch').value.trim().toLowerCase();
  const products = state.products.filter(product =>
    (selectedCategory === 'Semua' || product.categoryName === selectedCategory) &&
    (!query || `${product.productName} ${product.barcodeValue}`.toLowerCase().includes(query))
  );
  $('productGrid').innerHTML = products.length ? products.map(product => `
    <button class="product-card" data-product-id="${product.productId}">
      <span class="product-emoji">${escapeHtml(product.emoji || '📦')}</span>
      <strong>${escapeHtml(product.productName)}</strong><small>${escapeHtml(product.categoryName)}</small>
      <div class="product-price">${rupiah(product.unitPriceAmount)}</div><span class="product-add">+</span>
    </button>`).join('') : '<div class="empty">Barang nggak ketemu. Coba keyword lain.</div>';
}


function addProduct(product) {
  cart = addProductToCart(cart, product);
  renderCart();
  showToast(`${product.productName} masuk keranjang`);
}


function renderCart() {
  const totals = calculateCartTotals(cart);
  const itemCount = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  $('cartCount').textContent = itemCount;
  $('cartTotal').textContent = rupiah(totals.totalAmount);
  $('cartBar').hidden = itemCount === 0 || !document.querySelector('[data-page="cashier"]').classList.contains('active');
  $('cartLines').innerHTML = cart.lines.length ? cart.lines.map(line => `
    <div class="cart-line"><div><strong>${escapeHtml(line.productName)}</strong><small>${rupiah(line.unitPriceAmount)} × ${line.quantity}</small></div>
    <div class="quantity"><button data-quantity="${line.quantity - 1}" data-line-id="${line.productId}">−</button><b>${line.quantity}</b><button data-quantity="${line.quantity + 1}" data-line-id="${line.productId}">+</button></div></div>`).join('') : '<div class="empty">Keranjang masih kosong.</div>';
  $('discountInput').value = cart.discountAmount;
  $('cartSummary').innerHTML = `<div class="summary-line"><span>Subtotal</span><b>${rupiah(totals.subtotalAmount)}</b></div><div class="summary-line"><span>Diskon</span><b>− ${rupiah(totals.discountAmount)}</b></div><div class="summary-line total"><span>Total</span><span>${rupiah(totals.totalAmount)}</span></div>`;
  $('paymentButton').disabled = !cart.lines.length;
}


function openSheet(sheetId) {
  document.querySelectorAll('.sheet.open').forEach(sheet => sheet.classList.remove('open'));
  $('sheetBackdrop').hidden = false;
  requestAnimationFrame(() => $(sheetId).classList.add('open'));
}


function closeSheets() {
  document.querySelectorAll('.sheet.open').forEach(sheet => sheet.classList.remove('open'));
  setTimeout(() => { $('sheetBackdrop').hidden = true; }, 220);
}


function openPayment() {
  const totals = calculateCartTotals(cart);
  if (!cart.lines.length) return;
  $('paymentTotal').textContent = rupiah(totals.totalAmount);
  $('paymentAmount').value = totals.totalAmount;
  renderChangePreview();
  openSheet('paymentSheet');
}


function renderChangePreview() {
  const total = calculateCartTotals(cart).totalAmount;
  const payment = Number($('paymentAmount').value) || 0;
  $('changePreview').textContent = payment < total ? `Kurang: ${rupiah(total - payment)}` : `Kembalian: ${rupiah(calculateChange(total, payment))}`;
}


function completeSale() {
  try {
    const sale = createSale({ saleId: makeSaleId(), businessDate: today(), cart, paymentMethod: selectedPaymentMethod, paymentAmount: $('paymentAmount').value });
    state.sales.unshift(sale);
    persist();
    accountingIntegration.enqueueSale(sale);
    cart = createEmptyCart();
    closeSheets();
    renderAll();
    renderReceipt(sale);
    openSheet('receiptSheet');
    showToast('Transaksi berhasil disimpan');
  } catch (error) {
    showToast(error.message === 'INSUFFICIENT_PAYMENT' ? 'Nominal pembayaran masih kurang' : 'Transaksi belum bisa disimpan');
  }
}


function renderReceipt(sale) {
  $('receiptContent').innerHTML = `<article class="receipt"><h3>MAXI PROGRAM KASIR</h3><p>${escapeHtml(sale.saleId)} · ${escapeHtml(sale.businessDate)}</p>
  ${sale.saleLines.map(line => `<div class="receipt-line"><span>${escapeHtml(line.productName)} × ${line.quantity}</span><span>${rupiah(line.quantity * line.unitPriceAmount)}</span></div>`).join('')}
  <div class="receipt-line"><span>Subtotal</span><span>${rupiah(sale.subtotalAmount)}</span></div><div class="receipt-line"><span>Diskon</span><span>-${rupiah(sale.discountAmount)}</span></div>
  <div class="receipt-line total"><span>Total</span><span>${rupiah(sale.totalAmount)}</span></div><div class="receipt-line"><span>Bayar (${escapeHtml(sale.paymentMethod)})</span><span>${rupiah(sale.paymentAmount)}</span></div><div class="receipt-line"><span>Kembali</span><span>${rupiah(sale.changeAmount)}</span></div></article>`;
}


function renderHistory() {
  const query = $('historySearch').value.trim().toLowerCase();
  const sales = state.sales.filter(sale => !query || `${sale.saleId} ${sale.saleLines.map(line => line.productName).join(' ')}`.toLowerCase().includes(query));
  $('historyCount').textContent = state.sales.length;
  $('historyList').innerHTML = sales.length ? sales.map(sale => `<article class="list-card" data-sale-id="${sale.saleId}"><div><strong>${escapeHtml(sale.saleId)}</strong><p>${escapeHtml(sale.businessDate)} · ${sale.saleLines.reduce((sum,line)=>sum+line.quantity,0)} item · ${escapeHtml(sale.paymentMethod)}</p></div><div class="amount">${rupiah(sale.totalAmount)}<p>Tap nota</p></div></article>`).join('') : '<div class="empty">Belum ada transaksi tersimpan.</div>';
}


function renderMasterProducts() {
  $('masterProductList').innerHTML = state.products.map(product => `<article class="list-card"><div><strong>${escapeHtml(product.productName)}</strong><p>${escapeHtml(product.categoryName)} · ${escapeHtml(product.barcodeValue || 'Barcode kosong')}</p></div><div><div class="amount">${rupiah(product.unitPriceAmount)}</div><div class="list-actions"><button class="mini-btn" data-edit-product="${product.productId}">Edit</button></div></div></article>`).join('');
}


function renderDashboard() {
  const todaySales = state.sales.filter(sale => sale.businessDate === today());
  $('dashboardRevenue').textContent = rupiah(todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0));
  $('dashboardSales').textContent = todaySales.length;
  $('dashboardItems').textContent = todaySales.reduce((sum, sale) => sum + sale.saleLines.reduce((lineSum, line) => lineSum + line.quantity, 0), 0);
}


function openProductForm(productId = '') {
  const product = state.products.find(entry => entry.productId === productId);
  $('productTitle').textContent = product ? 'Edit Barang' : 'Tambah Barang';
  $('editingProductId').value = product?.productId || '';
  $('productNameInput').value = product?.productName || '';
  $('productCategoryInput').value = product?.categoryName || '';
  $('productBarcodeInput').value = product?.barcodeValue || '';
  $('productPriceInput').value = product?.unitPriceAmount || '';
  openSheet('productSheet');
}


function saveProduct(event) {
  event.preventDefault();
  const productId = $('editingProductId').value;
  const product = {
    productId: productId || `PRD-${Date.now()}`,
    productName: $('productNameInput').value.trim(),
    categoryName: $('productCategoryInput').value.trim(),
    barcodeValue: $('productBarcodeInput').value.trim(),
    unitPriceAmount: Number($('productPriceInput').value),
    emoji: '📦'
  };


  try {
    state.products = upsertProduct(state.products, product);
    persist();
    closeSheets();
    renderAll();
    showToast('Master barang disimpan');
  } catch (error) {
    if (error.message === 'DUPLICATE_BARCODE') return showToast('Barcode sudah dipakai barang lain');
    showToast('Data barang belum valid');
  }
}


function renderAll() {
  renderCategoryFilters(); renderProducts(); renderCart(); renderHistory(); renderMasterProducts(); renderDashboard();
}


document.querySelector('.tabs').addEventListener('click', event => {
  const tab = event.target.closest('.tab'); if (!tab) return;
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button === tab));
  document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === `${tab.dataset.page}Page`));
  renderCart();
});
$('categoryFilters').addEventListener('click', event => { const chip = event.target.closest('.chip'); if (!chip) return; selectedCategory = chip.dataset.category; renderCategoryFilters(); renderProducts(); });
$('productGrid').addEventListener('click', event => { const card = event.target.closest('[data-product-id]'); if (card) addProduct(state.products.find(product => product.productId === card.dataset.productId)); });
$('productSearch').addEventListener('input', renderProducts);
$('barcodeForm').addEventListener('submit', event => { event.preventDefault(); const product = findProductByBarcode(state.products, $('barcodeInput').value); if (product) { addProduct(product); $('barcodeInput').value = ''; } else showToast('Barcode belum terdaftar'); });
$('cartBar').addEventListener('click', () => openSheet('cartSheet'));
$('cartLines').addEventListener('click', event => { const button = event.target.closest('[data-line-id]'); if (!button) return; cart = updateCartLineQuantity(cart, button.dataset.lineId, Number(button.dataset.quantity)); renderCart(); });
$('discountInput').addEventListener('input', () => { cart = { ...cart, discountAmount: Number($('discountInput').value) || 0 }; renderCart(); });
$('paymentButton').addEventListener('click', openPayment);
$('paymentAmount').addEventListener('input', renderChangePreview);
document.querySelector('.method-grid').addEventListener('click', event => { const method = event.target.closest('.method'); if (!method) return; selectedPaymentMethod = method.dataset.method; document.querySelectorAll('.method').forEach(button => button.classList.toggle('active', button === method)); });
$('completeSaleButton').addEventListener('click', completeSale);
$('historySearch').addEventListener('input', renderHistory);
$('historyList').addEventListener('click', event => { const card = event.target.closest('[data-sale-id]'); const sale = card && state.sales.find(entry => entry.saleId === card.dataset.saleId); if (sale) { renderReceipt(sale); openSheet('receiptSheet'); } });
$('addProductButton').addEventListener('click', () => openProductForm());
$('masterProductList').addEventListener('click', event => { const button = event.target.closest('[data-edit-product]'); if (button) openProductForm(button.dataset.editProduct); });
$('productForm').addEventListener('submit', saveProduct);
$('sheetBackdrop').addEventListener('click', closeSheets);
document.querySelectorAll('[data-close-sheet]').forEach(button => button.addEventListener('click', closeSheets));
$('resetDataButton').addEventListener('click', () => { if (!confirm('Reset seluruh data lokal Program Kasir?')) return; state = structuredClone(seedState); cart = createEmptyCart(); persist(); renderAll(); showToast('Demo data sudah di-reset'); });


renderAll();
