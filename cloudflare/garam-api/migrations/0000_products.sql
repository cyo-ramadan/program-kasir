CREATE TABLE IF NOT EXISTS products (
  productId TEXT PRIMARY KEY NOT NULL,
  productName TEXT NOT NULL CHECK (length(trim(productName)) > 0),
  categoryName TEXT NOT NULL CHECK (length(trim(categoryName)) > 0),
  barcodeValue TEXT NOT NULL,
  unitPriceAmountMinor INTEGER NOT NULL CHECK (unitPriceAmountMinor >= 0),
  emoji TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS products_barcodeValue_unique
  ON products (barcodeValue)
  WHERE length(trim(barcodeValue)) > 0;
