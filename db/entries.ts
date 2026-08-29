import { getDb } from './index';

export type CustomRow = {
  entryId: number;
  priceCents: number;
  sharePercent: number;
  quantity: number;
};

export type DayRow = {
  procedureId: number;
  name: string;
  priceCents: number;      // cena z cennika
  sharePercent: number;    // procent dla ceny z cennika
  entryId: number | null;  // wpis po cenie cennikowej
  quantity: number;
  custom: CustomRow[];     // wpisy po innej cenie lub innym procencie
  removed?: boolean;       // procedura zniknęła z cennika, ale ma wpisy tego dnia
};


export async function loadOrder(workplaceId: number): Promise<number[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ procedure_id: number }>(
    `SELECT p.id AS procedure_id, COALESCE(SUM(e.quantity), 0) AS uses
     FROM workplace_procedures wp
     JOIN procedures p ON p.id = wp.procedure_id
     LEFT JOIN entries e
            ON e.procedure_id = wp.procedure_id
           AND e.workplace_id = wp.workplace_id
           AND e.date >= date('now', '-90 days')
     WHERE wp.workplace_id = ? AND wp.is_active = 1 AND p.is_archived = 0
     GROUP BY p.id
     ORDER BY uses DESC, p.name COLLATE NOCASE`,
    [workplaceId],
  );
  return rows.map((r) => r.procedure_id);
}

export async function loadDay(workplaceId: number, date: string): Promise<DayRow[]> {
  const db = await getDb();

  const pricing = await db.getAllAsync<{
    procedure_id: number;
    name: string;
    price_cents: number;
    share_percent: number | null;
    default_share: number;
  }>(
    `SELECT p.id AS procedure_id, p.name, wp.price_cents, wp.share_percent, w.default_share
     FROM workplace_procedures wp
     JOIN procedures p ON p.id = wp.procedure_id
     JOIN workplaces w ON w.id = wp.workplace_id
     WHERE wp.workplace_id = ? AND wp.is_active = 1 AND p.is_archived = 0`,
    [workplaceId],
  );

  const entries = await db.getAllAsync<{
    id: number;
    procedure_id: number;
    name: string;
    quantity: number;
    unit_price_cents: number;
    share_percent: number;
  }>(
    `SELECT e.id, e.procedure_id, p.name, e.quantity, e.unit_price_cents, e.share_percent
     FROM entries e
     JOIN procedures p ON p.id = e.procedure_id
     WHERE e.workplace_id = ? AND e.date = ?`,
    [workplaceId, date],
  );

  const map = new Map<number, DayRow>();

  for (const r of pricing) {
    map.set(r.procedure_id, {
      procedureId: r.procedure_id,
      name: r.name,
      priceCents: r.price_cents,
      sharePercent: r.share_percent ?? r.default_share,
      entryId: null,
      quantity: 0,
      custom: [],
    });
  }

  for (const e of entries) {
    let row = map.get(e.procedure_id);
    if (!row) {
      row = {
        procedureId: e.procedure_id,
        name: e.name,
        priceCents: e.unit_price_cents,
        sharePercent: e.share_percent,
        entryId: null,
        quantity: 0,
        custom: [],
        removed: true,
      };
      map.set(e.procedure_id, row);
    }

    const matchesCatalog =
      e.unit_price_cents === row.priceCents && e.share_percent === row.sharePercent;

    if (matchesCatalog) {
      row.entryId = e.id;
      row.quantity = e.quantity;
    } else {
      row.custom.push({
        entryId: e.id,
        priceCents: e.unit_price_cents,
        sharePercent: e.share_percent,
        quantity: e.quantity,
      });
    }
  }

  return [...map.values()];
}

export async function increment(input: {
  workplaceId: number;
  date: string;
  procedureId: number;
  priceCents: number;
  sharePercent: number;
  isCustom: boolean;
}): Promise<number> {
  const db = await getDb();
  const { workplaceId, date, procedureId, priceCents, sharePercent, isCustom } = input;

  await db.runAsync(
    `INSERT INTO entries
       (date, workplace_id, procedure_id, quantity,
        unit_price_cents, share_percent, is_custom, created_at)
     VALUES (?, ?, ?, 1, ?, ?, ?, datetime('now'))
     ON CONFLICT(date, workplace_id, procedure_id, unit_price_cents, share_percent)
     DO UPDATE SET quantity = quantity + 1`,
    [date, workplaceId, procedureId, priceCents, sharePercent, isCustom ? 1 : 0],
  );

  const row = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM entries
     WHERE date = ? AND workplace_id = ? AND procedure_id = ?
       AND unit_price_cents = ? AND share_percent = ?`,
    [date, workplaceId, procedureId, priceCents, sharePercent],
  );
  return row!.id;
}

export async function decrement(entryId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ? AND quantity <= 1', [entryId]);
  await db.runAsync('UPDATE entries SET quantity = quantity - 1 WHERE id = ?', [entryId]);
}