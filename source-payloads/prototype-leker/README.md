# Prototype Leker

Prototype self-ordering kiosk untuk produk leker. Customer memilih menu di UI kiosk, mengirim order ke kasir, lalu kasir mengubah status pesanan dari **NEW → PREPARING → READY → COMPLETED**.

## UI

- `/customer` — self-order UI customer
- `/cashier` — dashboard kasir

## Prototype scope

- 20 varian leker + harga
- Cart, quantity, item note, general note
- Nomor pesanan harian otomatis
- Shared multi-device order state via Cloudflare D1
- Customer status polling sampai READY
- Green READY notification/button
- Cashier queue dan status update
- No payment yet

## Runtime architecture

- GitHub: source code
- Cloudflare Worker: HTTP API + static UI
- Cloudflare D1: relational persistence melalui binding `env.DB`
- Target D1: `maxi-db` (`363b2f8d-f036-4def-bd9b-f04b0d20dc1f`)

Worker dan D1 harus dideploy pada Cloudflare account yang memiliki database `maxi-db`.

## Database schema

Migration `migrations/0001_leker_order_schema.sql` membuat dan mengindeks:

- `products`
- `orders`
- `order_items`
- `order_status_history`

Migration juga seed 20 produk leker dan memasang trigger untuk mencatat perubahan status ke history.

Apply migration ke database remote sebelum menjalankan Worker:

```bash
npx wrangler d1 migrations apply maxi-db --remote
```

Lalu deploy:

```bash
npx wrangler deploy
```

## API

- `GET /api/menu`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `POST /api/reset` (prototype/test only)

## DOC-IMPACT

**REQUIRED** — backend persistence berubah dari Durable Object menjadi D1 SQL, entrypoint dipisah menjadi modul, dan migration database ditambahkan.

## Known deployment constraint

Worker `prototype-leker` yang sebelumnya berada di account **Daily Napkin** tidak dapat memakai D1 binding milik account **Dwicahya** secara langsung. Deploy source ini dari account **Dwicahya** agar binding `env.DB` mengarah ke `maxi-db` milik account tersebut.
