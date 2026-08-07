# MAXI Program Kasir v0.1.0

Source code Program Kasir dengan UI/UX yang mengikuti pola visual Program Ikan.

## Repository boundary

Source of truth untuk scope modul `maxi.pos` adalah `docs/MODULE_MANIFEST.md`, `docs/MODULE_CONTEXT.md`, dan `docs/CURRENT_STATE.md`.

Direktori automation/transport seperti `source-payloads/`, `*-requests/`, `*-results/`, serta workflow publisher khusus bukan bagian dari runtime, ownership, contract, database, atau arsitektur Program Kasir kecuali dokumen modul secara eksplisit menyatakannya.

Khusus Prototype Leker, source of truth berada di repository `cyo-ramadan/prototype-leker`. Artefak bernama `prototype-leker` yang ada di repository ini hanya tooling untuk publish/sinkronisasi dan tidak boleh dipakai sebagai bukti bahwa Leker adalah fitur atau dependency `maxi.pos`.

## Menjalankan

Gunakan static web server dari folder ini, misalnya `python3 -m http.server 4173`, lalu buka `http://localhost:4173`. JavaScript modules tidak boleh dibuka langsung melalui `file://`.

## Validasi

```bash
npm test
npm run check
```

## Integration spaces

- Barcode: `BarcodeScannerPort` di `src/pos-core.js`.
- Accounting: `AccountingIntegrationPort` di `src/pos-core.js`.

Keduanya sengaja belum dikonfigurasi. Adapter, event, mapping, retry, dan reconciliation baru boleh dibuat setelah contract MAXI terkait disetujui.
