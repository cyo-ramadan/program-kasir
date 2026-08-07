# Known Pitfalls

- Never send journal lines or account mappings from POS. Accounting owns interpretation.
- Never treat the local product quantity as official stock. Inventory owns authoritative stock and valuation.
- Do not implement a barcode SDK inside UI handlers. Supply an adapter implementing `BarcodeScannerPort`.
- Do not rename or publish integration fields until a versioned contract is approved.
- Keep money arithmetic in whole IDR amounts for this local prototype; contract representation will follow the approved integration contract.
- Do not infer Program Kasir ownership or runtime scope from automation transport directories such as `source-payloads/`, `*-requests/`, `*-results/`, or specialized publisher workflows. Validate scope against `MODULE_MANIFEST.md`, `MODULE_CONTEXT.md`, and `CURRENT_STATE.md`.
- Do not treat `prototype-leker` artifacts in this repository as POS source or architecture. Prototype Leker has its own source-of-truth repository: `cyo-ramadan/prototype-leker`.
