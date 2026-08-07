const MENU = [
  { id: 1, name: 'Leker Cokelat', price: 8000, category: 'Classic', emoji: '🍫' },
  { id: 2, name: 'Leker Keju', price: 9000, category: 'Classic', emoji: '🧀' },
  { id: 3, name: 'Leker Cokelat Keju', price: 11000, category: 'Classic', emoji: '🍫' },
  { id: 4, name: 'Leker Pisang Cokelat', price: 11000, category: 'Classic', emoji: '🍌' },
  { id: 5, name: 'Leker Pisang Keju', price: 12000, category: 'Classic', emoji: '🍌' },
  { id: 6, name: 'Leker Pisang Cokelat Keju', price: 14000, category: 'Premium', emoji: '🍌' },
  { id: 7, name: 'Leker Oreo', price: 11000, category: 'Premium', emoji: '🍪' },
  { id: 8, name: 'Leker Oreo Keju', price: 13000, category: 'Premium', emoji: '🍪' },
  { id: 9, name: 'Leker Milo', price: 10000, category: 'Premium', emoji: '🥛' },
  { id: 10, name: 'Leker Milo Keju', price: 12000, category: 'Premium', emoji: '🥛' },
  { id: 11, name: 'Leker Tiramisu', price: 12000, category: 'Premium', emoji: '☕' },
  { id: 12, name: 'Leker Matcha', price: 12000, category: 'Premium', emoji: '🍵' },
  { id: 13, name: 'Leker Strawberry', price: 10000, category: 'Fruity', emoji: '🍓' },
  { id: 14, name: 'Leker Blueberry', price: 10000, category: 'Fruity', emoji: '🫐' },
  { id: 15, name: 'Leker Kacang Cokelat', price: 11000, category: 'Classic', emoji: '🥜' },
  { id: 16, name: 'Leker Jagung Keju', price: 12000, category: 'Savory', emoji: '🌽' },
  { id: 17, name: 'Leker Sosis', price: 12000, category: 'Savory', emoji: '🌭' },
  { id: 18, name: 'Leker Sosis Keju', price: 14000, category: 'Savory', emoji: '🌭' },
  { id: 19, name: 'Leker Telur Mayo', price: 13000, category: 'Savory', emoji: '🥚' },
  { id: 20, name: 'Leker Special Maxi', price: 15000, category: 'Signature', emoji: '👑' }
];

const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const sanitizeText = (value, max = 240) => String(value || '').trim().slice(0, max);

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const normalized = [];
  for (const item of items) {
    const product = MENU.find(m => m.id === Number(item.menuId));
    if (!product) return null;
    const qty = Math.max(1, Math.min(20, Number(item.qty) || 1));
    normalized.push({
      menuId: product.id,
      name: product.name,
      price: product.price,
      qty,
      note: sanitizeText(item.note, 120)
    });
  }
  return normalized;
}

export class OrderStore {
  constructor(state) {
    this.state = state;
  }

  async getOrders() {
    return (await this.state.storage.get('orders')) || [];
  }

  async putOrders(orders) {
    await this.state.storage.put('orders', orders);
  }

  orderNumber(orders) {
    const today = new Date().toISOString().slice(0, 10);
    const count = orders.filter(order => order.createdAt.slice(0, 10) === today).length + 1;
    return `LKR-${String(count).padStart(3, '0')}`;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const orders = await this.getOrders();

    if (request.method === 'GET' && pathname === '/api/menu') return json(MENU);
    if (request.method === 'GET' && pathname === '/api/orders') {
      return json([...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }

    const orderMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
    const statusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);

    if (request.method === 'GET' && orderMatch) {
      const order = orders.find(item => item.id === orderMatch[1]);
      return order ? json(order) : json({ error: 'Order not found' }, 404);
    }

    if (request.method === 'POST' && pathname === '/api/orders') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Payload JSON tidak valid.' }, 400); }
      const items = validateItems(body.items);
      if (!items) return json({ error: 'Pesanan harus memiliki item menu yang valid.' }, 400);
      const now = new Date().toISOString();
      const order = {
        id: `ord_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
        orderNo: this.orderNumber(orders),
        customerName: sanitizeText(body.customerName, 60) || 'Customer',
        tableLabel: sanitizeText(body.tableLabel, 40) || 'Kiosk',
        generalNote: sanitizeText(body.generalNote, 240),
        items,
        total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
        status: 'NEW',
        createdAt: now,
        updatedAt: now,
        readyAt: null,
        completedAt: null
      };
      orders.push(order);
      await this.putOrders(orders);
      return json(order, 201);
    }

    if (request.method === 'PATCH' && statusMatch) {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Payload JSON tidak valid.' }, 400); }
      const allowed = ['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
      if (!allowed.includes(body.status)) return json({ error: 'Status tidak valid.' }, 400);
      const order = orders.find(item => item.id === statusMatch[1]);
      if (!order) return json({ error: 'Order not found' }, 404);
      const now = new Date().toISOString();
      order.status = body.status;
      order.updatedAt = now;
      if (body.status === 'READY') order.readyAt = now;
      if (body.status === 'COMPLETED') order.completedAt = now;
      await this.putOrders(orders);
      return json(order);
    }

    if (request.method === 'POST' && pathname === '/api/reset') {
      await this.putOrders([]);
      return json({ ok: true });
    }

    return json({ error: 'Not found' }, 404);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const id = env.ORDER_STORE.idFromName('prototype-leker-global');
      return env.ORDER_STORE.get(id).fetch(request);
    }

    const routes = {
      '/': '/customer.html',
      '/customer': '/customer.html',
      '/cashier': '/cashier.html'
    };
    const assetPath = routes[url.pathname] || url.pathname;
    const assetUrl = new URL(request.url);
    assetUrl.pathname = assetPath;
    return env.ASSETS.fetch(new Request(assetUrl, request));
  }
};
