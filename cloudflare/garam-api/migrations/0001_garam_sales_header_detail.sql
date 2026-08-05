PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS saleHeaders (
  saleId TEXT PRIMARY KEY NOT NULL,
  businessDate TEXT NOT NULL CHECK (businessDate GLOB '????-??-??'),
  occurredAt TEXT NOT NULL,
  sourceApp TEXT NOT NULL CHECK (sourceApp = 'garam-pos'),
  subtotalAmountMinor INTEGER NOT NULL CHECK (subtotalAmountMinor >= 0),
  discountAmountMinor INTEGER NOT NULL CHECK (discountAmountMinor >= 0),
  totalAmountMinor INTEGER NOT NULL CHECK (totalAmountMinor >= 0),
  saleStatus TEXT NOT NULL CHECK (saleStatus IN ('COMPLETED', 'REFUNDED')),
  idempotencyKey TEXT NOT NULL UNIQUE,
  integrationStatus TEXT NOT NULL DEFAULT 'PENDING' CHECK (integrationStatus IN ('PENDING', 'BLOCKED_CONTRACT', 'DISPATCHED', 'FAILED')),
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saleDetails (
  saleLineId TEXT PRIMARY KEY NOT NULL,
  saleId TEXT NOT NULL,
  lineNumber INTEGER NOT NULL CHECK (lineNumber > 0),
  productId TEXT NOT NULL,
  productNameSnapshot TEXT NOT NULL CHECK (length(trim(productNameSnapshot)) > 0),
  quantity TEXT NOT NULL CHECK (quantity GLOB '[1-9]*'),
  unitOfMeasureId TEXT,
  unitPriceAmountMinor INTEGER NOT NULL CHECK (unitPriceAmountMinor >= 0),
  lineTotalAmountMinor INTEGER NOT NULL CHECK (lineTotalAmountMinor >= 0),
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (saleId) REFERENCES saleHeaders(saleId) ON DELETE RESTRICT,
  UNIQUE (saleId, lineNumber)
);
CREATE INDEX IF NOT EXISTS saleDetails_saleId_index ON saleDetails (saleId);
CREATE INDEX IF NOT EXISTS saleDetails_productId_index ON saleDetails (productId);

CREATE TABLE IF NOT EXISTS salePayments (
  salePaymentId TEXT PRIMARY KEY NOT NULL,
  saleId TEXT NOT NULL,
  paymentMethodId TEXT NOT NULL CHECK (length(trim(paymentMethodId)) > 0),
  paymentAmountMinor INTEGER NOT NULL CHECK (paymentAmountMinor >= 0),
  changeAmountMinor INTEGER NOT NULL CHECK (changeAmountMinor >= 0),
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (saleId) REFERENCES saleHeaders(saleId) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS salePayments_saleId_index ON salePayments (saleId);

CREATE TABLE IF NOT EXISTS integrationOutbox (
  eventId TEXT PRIMARY KEY NOT NULL,
  aggregateType TEXT NOT NULL CHECK (aggregateType = 'SALE'),
  aggregateId TEXT NOT NULL,
  eventType TEXT NOT NULL,
  contractVersion TEXT NOT NULL,
  idempotencyKey TEXT NOT NULL UNIQUE,
  payloadJson TEXT NOT NULL CHECK (json_valid(payloadJson)),
  dispatchStatus TEXT NOT NULL DEFAULT 'PENDING' CHECK (dispatchStatus IN ('PENDING', 'BLOCKED_CONTRACT', 'DISPATCHED', 'FAILED')),
  attemptCount INTEGER NOT NULL DEFAULT 0 CHECK (attemptCount >= 0),
  lastErrorCode TEXT,
  dispatchedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aggregateId) REFERENCES saleHeaders(saleId) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS integrationOutbox_dispatch_index ON integrationOutbox (dispatchStatus, createdAt);
