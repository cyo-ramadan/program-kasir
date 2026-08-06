CREATE TABLE IF NOT EXISTS products (
  productId TEXT PRIMARY KEY NOT NULL,
  productName TEXT NOT NULL CHECK (length(trim(productName)) > 0),
  categoryName TEXT NOT NULL CHECK (length(trim(categoryName)) > 0),
  barcodeValue TEXT NOT NULL,
  unitPriceAmount INTEGER NOT NULL CHECK (unitPriceAmount >= 0),
  emoji TEXT,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS products_barcodeValue_unique
  ON products (barcodeValue)
  WHERE length(trim(barcodeValue)) > 0;
