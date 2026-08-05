# Module Context


Program Kasir owns the local cashier workflow: browsing products, building a cart, applying a transaction discount, accepting a local payment, calculating change, storing a completed sale, and displaying local history.


It does not own accounting journals, account mapping, stock valuation, official stock movement, cross-program mapping, retries, deduplication, or reconciliation. Barcode hardware and Accounting connectivity use explicit ports. Their adapters remain disabled until approved contracts and mappings exist.


The UI follows Program Ikan's compact device shell, dark gradient top bar, pill tabs, white cards, bottom-sheet dialogs, floating action treatment, and responsive full-screen mobile behavior. State changes pass through deterministic core functions and a versioned local snapshot.
