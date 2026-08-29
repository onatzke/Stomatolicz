import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 2;

const DEFAULT_PROCEDURES = [
    'Badanie stomatologiczne',
    'Znieczulenie nasiękowe',
    'Znieczulenie przewodowe',
    'Wypełnienie ząb stały – 1 powierzchnia',
    'Wypełnienie ząb stały – 2 powierzchnie',
    'Wypełnienie ząb stały – 3 powierzchnie',
    'Wypełnienie tymczasowe',
    'Wypełnienie glasjonomerowe',
    'Opatrunek w zębie stałym',
    'Leczenie endodontyczne – 1 kanał',
    'Leczenie endodontyczne – 2 kanały',
    'Leczenie endodontyczne – 3 kanały',
    'Ekstrakcja zęba 1-korzeniowego',
    'Ekstrakcja zęba 2-korzeniowego',
    'Ekstrakcja zęba zatrzymanego',
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
    await db.execAsync('PRAGMA journal_mode = WAL');
    await db.execAsync('PRAGMA foreign_keys = ON');

    const row = await db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version',
    );
    const version = row?.user_version ?? 0;

    if (version < 1) {
        await migrateToV1(db);
        await db.execAsync(`PRAGMA user_version = 1`);
    }

    if (version < 2) {
        await migrateToV2(db);
        await db.execAsync('PRAGMA user_version = 2');
    }

    // Kolejne migracje dopisujemy tutaj:
    // if (version < 2) { await migrateToV2(db); await db.execAsync('PRAGMA user_version = 2'); }
}

async function migrateToV1(db: SQLiteDatabase): Promise<void> {
    await db.execAsync(`
    CREATE TABLE workplaces (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      default_share REAL    NOT NULL DEFAULT 0,
      is_archived   INTEGER NOT NULL DEFAULT 0,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL
    );

    CREATE TABLE procedures (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL COLLATE NOCASE,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL
    );

    CREATE UNIQUE INDEX idx_procedures_name
      ON procedures(name COLLATE NOCASE);

    CREATE TABLE workplace_procedures (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      workplace_id  INTEGER NOT NULL REFERENCES workplaces(id),
      procedure_id  INTEGER NOT NULL REFERENCES procedures(id),
      price_cents   INTEGER NOT NULL DEFAULT 0,
      share_percent REAL,
      is_active     INTEGER NOT NULL DEFAULT 1,
      UNIQUE(workplace_id, procedure_id)
    );

    CREATE INDEX idx_wp_workplace ON workplace_procedures(workplace_id);

    CREATE TABLE entries (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      date             TEXT    NOT NULL,
      workplace_id     INTEGER NOT NULL REFERENCES workplaces(id),
      procedure_id     INTEGER NOT NULL REFERENCES procedures(id),
      quantity         INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      unit_price_cents INTEGER NOT NULL,
      share_percent    REAL    NOT NULL,
      is_custom        INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT    NOT NULL
    );

    CREATE UNIQUE INDEX idx_entries_slot ON entries(
      date, workplace_id, procedure_id, unit_price_cents, share_percent
    );

    CREATE INDEX idx_entries_date      ON entries(date);
    CREATE INDEX idx_entries_wp_date   ON entries(workplace_id, date);
    CREATE INDEX idx_entries_procedure ON entries(procedure_id);
  `);

    await seedInitialData(db);
}

async function migrateToV2(db: SQLiteDatabase): Promise<void> {
    await db.execAsync(`
    CREATE TABLE settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

async function seedInitialData(db: SQLiteDatabase): Promise<void> {
    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `INSERT INTO workplaces (name, default_share, sort_order, created_at)
       VALUES (?, 0, 0, datetime('now'))`,
            ['Moje miejsce pracy'],
        );

        for (const name of DEFAULT_PROCEDURES) {
            await db.runAsync(
                `INSERT INTO procedures (name, created_at) VALUES (?, datetime('now'))`,
                [name],
            );
        }

        await db.execAsync(`
      INSERT INTO workplace_procedures (workplace_id, procedure_id, price_cents, share_percent)
      SELECT 1, id, 0, NULL FROM procedures
    `);
    });
}