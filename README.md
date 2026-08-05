# MAXI Program Kasir v0.1.0


Source code Program Kasir dengan UI/UX yang mengikuti pola visual Program Ikan.


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
