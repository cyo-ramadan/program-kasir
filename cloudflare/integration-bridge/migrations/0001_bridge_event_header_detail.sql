PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS integrationEventHeaders (
  eventId TEXT PRIMARY KEY NOT NULL,
  eventType TEXT NOT NULL,
  contractVersion TEXT NOT NULL,
  sourceApp TEXT NOT NULL,
  transactionId TEXT NOT NULL,
  occurredAt TEXT NOT NULL,
  businessDate TEXT NOT NULL CHECK (businessDate GLOB '????-??-??'),
  correlationId TEXT NOT NULL,
  idempotencyKey TEXT NOT NULL UNIQUE,
  payloadJson TEXT NOT NULL CHECK (json_valid(payloadJson)),
  processingStatus TEXT NOT NULL CHECK (processingStatus IN ('RECEIVED', 'NEEDS_MAPPING', 'PARTIALLY_PROCESSED', 'PROCESSED', 'FAILED')),
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS integrationEventHeaders_transaction_index ON integrationEventHeaders (sourceApp, transactionId);
CREATE INDEX IF NOT EXISTS integrationEventHeaders_status_index ON integrationEventHeaders (processingStatus, createdAt);

CREATE TABLE IF NOT EXISTS integrationEventDetails (
  eventDetailId TEXT PRIMARY KEY NOT NULL,
  eventId TEXT NOT NULL,
  lineNumber INTEGER NOT NULL CHECK (lineNumber > 0),
  sourceProductId TEXT NOT NULL,
  productNameSnapshot TEXT NOT NULL,
  quantity TEXT NOT NULL,
  sourceUnitOfMeasureId TEXT,
  unitPriceAmountMinor INTEGER NOT NULL CHECK (unitPriceAmountMinor >= 0),
  lineTotalAmountMinor INTEGER NOT NULL CHECK (lineTotalAmountMinor >= 0),
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eventId) REFERENCES integrationEventHeaders(eventId) ON DELETE RESTRICT,
  UNIQUE (eventId, lineNumber)
);
CREATE INDEX IF NOT EXISTS integrationEventDetails_event_index ON integrationEventDetails (eventId);

CREATE TABLE IF NOT EXISTS integrationEventTargets (
  eventTargetId TEXT PRIMARY KEY NOT NULL,
  eventId TEXT NOT NULL,
  targetSystem TEXT NOT NULL CHECK (targetSystem IN ('ACCOUNTING', 'WAREHOUSE')),
  targetStatus TEXT NOT NULL CHECK (targetStatus IN ('NEEDS_MAPPING', 'READY', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER')),
  targetReferenceId TEXT,
  attemptCount INTEGER NOT NULL DEFAULT 0 CHECK (attemptCount >= 0),
  lastErrorCode TEXT,
  lastAttemptAt TEXT,
  processedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eventId) REFERENCES integrationEventHeaders(eventId) ON DELETE RESTRICT,
  UNIQUE (eventId, targetSystem)
);
CREATE INDEX IF NOT EXISTS integrationEventTargets_status_index ON integrationEventTargets (targetSystem, targetStatus, createdAt);

CREATE TABLE IF NOT EXISTS externalMappings (
  mappingId TEXT PRIMARY KEY NOT NULL,
  sourceApp TEXT NOT NULL,
  mappingType TEXT NOT NULL CHECK (mappingType IN ('PRODUCT', 'PAYMENT_METHOD', 'BRANCH', 'WAREHOUSE', 'UNIT_OF_MEASURE', 'ACCOUNTING_RULE')),
  sourceValue TEXT NOT NULL,
  targetSystem TEXT NOT NULL CHECK (targetSystem IN ('ACCOUNTING', 'WAREHOUSE')),
  targetValue TEXT NOT NULL,
  mappingStatus TEXT NOT NULL CHECK (mappingStatus IN ('ACTIVE', 'INACTIVE')),
  approvedBy TEXT NOT NULL,
  approvedAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (sourceApp, mappingType, sourceValue, targetSystem)
);
