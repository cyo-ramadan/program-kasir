from pathlib import Path
import sqlite3

MIGRATIONS = [
    Path('cloudflare/garam-api/migrations/0000_products.sql'),
    Path('cloudflare/garam-api/migrations/0001_garam_sales_header_detail.sql'),
    Path('cloudflare/integration-bridge/migrations/0001_bridge_event_header_detail.sql'),
]

for migration in MIGRATIONS:
    connection = sqlite3.connect(':memory:')
    connection.executescript(migration.read_text(encoding='utf-8'))
    integrity = connection.execute('PRAGMA integrity_check').fetchone()[0]
    if integrity != 'ok':
        raise SystemExit(f'{migration}: integrity_check={integrity}')
    connection.close()
    print(f'PASS {migration}')
