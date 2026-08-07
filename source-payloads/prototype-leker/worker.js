import { DurableObject } from "cloudflare:workers";

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

const json = (payload, status = 200) => Response.json(payload, {
  status,
  headers: { 'cache-control': 'no-store' }
});

const sanitizeText = (value, max = 240) => String(value || '').trim().slice(0, max);

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const normalized = [];
  for (const item of items) {
    const product = MENU.find(menuItem => menuItem.id === Number(item.menuId));
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

export class OrderStore extends DurableObject {
  async getOrders() {
    return (await this.ctx.storage.get('orders')) || [];
  }

  async listOrders() {
    const orders = await this.getOrders();
    return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getOrder(orderId) {
    const orders = await this.getOrders();
    return orders.find(order => order.id === orderId) || null;
  }

  async createOrder(payload) {
    const items = normalizeItems(payload?.items);
    if (!items) {
      return { ok: false, status: 400, error: 'Pesanan harus memiliki item menu yang valid.' };
    }

    const orders = await this.getOrders();
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const dailyCount = orders.filter(order => order.createdAt.slice(0, 10) === today).length + 1;
    const order = {
      id: `ord_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
      orderNo: `LKR-${String(dailyCount).padStart(3, '0')}`,
      customerName: sanitizeText(payload?.customerName, 60) || 'Customer',
      tableLabel: sanitizeText(payload?.tableLabel, 40) || 'Kiosk',
      generalNote: sanitizeText(payload?.generalNote, 240),
      items,
      total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
      status: 'NEW',
      createdAt: now,
      updatedAt: now,
      readyAt: null,
      completedAt: null
    };

    await this.ctx.storage.put('orders', [...orders, order]);
    return { ok: true, order };
  }

  async updateStatus(orderId, nextStatus) {
    const allowed = ['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!allowed.includes(nextStatus)) {
      return { ok: false, status: 400, error: 'Status tidak valid.' };
    }

    const orders = await this.getOrders();
    const index = orders.findIndex(order => order.id === orderId);
    if (index === -1) {
      return { ok: false, status: 404, error: 'Order not found' };
    }

    const now = new Date().toISOString();
    const order = { ...orders[index], status: nextStatus, updatedAt: now };
    if (nextStatus === 'READY') order.readyAt = now;
    if (nextStatus === 'COMPLETED') order.completedAt = now;
    orders[index] = order;
    await this.ctx.storage.put('orders', orders);
    return { ok: true, order };
  }

  async resetOrders() {
    await this.ctx.storage.delete('orders');
    return { ok: true };
  }
}

async function readJson(request) {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === 'GET' && pathname === '/api/menu') {
      return json(MENU);
    }

    if (pathname.startsWith('/api/')) {
      const store = env.ORDER_STORE.getByName('prototype-leker-store-01');

      if (request.method === 'GET' && pathname === '/api/orders') {
        return json(await store.listOrders());
      }

      const orderMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
      const statusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);

      if (request.method === 'GET' && orderMatch) {
        const order = await store.getOrder(orderMatch[1]);
        return order ? json(order) : json({ error: 'Order not found' }, 404);
      }

      if (request.method === 'POST' && pathname === '/api/orders') {
        const body = await readJson(request);
        if (!body.ok) return json({ error: 'Payload JSON tidak valid.' }, 400);
        const result = await store.createOrder(body.value);
        return result.ok ? json(result.order, 201) : json({ error: result.error }, result.status);
      }

      if (request.method === 'PATCH' && statusMatch) {
        const body = await readJson(request);
        if (!body.ok) return json({ error: 'Payload JSON tidak valid.' }, 400);
        const result = await store.updateStatus(statusMatch[1], body.value?.status);
        return result.ok ? json(result.order) : json({ error: result.error }, result.status);
      }

      if (request.method === 'POST' && pathname === '/api/reset') {
        return json(await store.resetOrders());
      }

      return json({ error: 'Not found' }, 404);
    }

    const routes = {
      '/': '/customer.html',
      '/customer': '/customer.html',
      '/cashier': '/cashier.html'
    };
    const assetPath = routes[pathname] || pathname;
    const assetUrl = new URL(request.url);
    assetUrl.pathname = assetPath;
    return env.ASSETS.fetch(new Request(assetUrl, request));
  }
};
