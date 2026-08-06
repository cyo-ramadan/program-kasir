# Known Pitfalls


- Never send journal lines or account mappings from POS. Accounting owns interpretation.
- Never treat the local product quantity as official stock. Inventory owns authoritative stock and valuation.
- Do not implement a barcode SDK inside UI handlers. Supply an adapter implementing `BarcodeScannerPort`.
- Do not rename or publish integration fields until a versioned contract is approved.
- Keep money arithmetic in whole IDR amounts for this local prototype; contract representation will follow the approved integration contract.
