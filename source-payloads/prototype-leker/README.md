# Prototype Leker

Prototype self-ordering kiosk untuk produk leker. Customer memilih menu di UI kiosk, mengirim order ke kasir, lalu kasir mengubah status pesanan dari **NEW → PREPARING → READY → COMPLETED**.

## UI

- `/customer` — self-order UI customer
- `/cashier` — dashboard kasir

## Prototype scope

- 20 varian leker + harga
- Cart, quantity, item note, general note
- Nomor pesanan otomatis
- Shared multi-device order state via Cloudflare Durable Object
- Customer status polling sampai READY
- Green READY notification/button
- Cashier queue dan status update
- No payment yet

## Cloudflare

`worker.js` + `wrangler.jsonc` menyediakan deployment Cloudflare Worker dengan Durable Object.

## DOC-IMPACT

**REQUIRED** — README dan deployment documentation dibuat karena prototype memperoleh runtime Cloudflare dan multi-device shared state.
