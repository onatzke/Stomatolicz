import { getDb } from './index';

export type Totals = {
    quantity: number;
    grossCents: number;
    shareCents: number;
};

export type WorkplaceTotals = Totals & {
    workplaceId: number;
    name: string;
};

export type ProcedureTotals = Totals & {
    procedureId: number;
    name: string;
};

const SUMS = `
  COALESCE(SUM(e.quantity), 0) AS quantity,
  COALESCE(SUM(e.quantity * e.unit_price_cents), 0) AS grossCents,
  COALESCE(SUM(ROUND(e.quantity * e.unit_price_cents * e.share_percent / 100)), 0) AS shareCents
`;

export async function totalsInRange(from: string, to: string): Promise<Totals> {
    const db = await getDb();
    const row = await db.getFirstAsync<Totals>(
        `SELECT ${SUMS} FROM entries e WHERE e.date BETWEEN ? AND ?`,
        [from, to],
    );
    return row ?? { quantity: 0, grossCents: 0, shareCents: 0 };
}

export async function totalsByWorkplace(from: string, to: string): Promise<WorkplaceTotals[]> {
    const db = await getDb();
    return db.getAllAsync<WorkplaceTotals>(
        `SELECT w.id AS workplaceId, w.name, ${SUMS}
     FROM entries e
     JOIN workplaces w ON w.id = e.workplace_id
     WHERE e.date BETWEEN ? AND ?
     GROUP BY w.id
     ORDER BY shareCents DESC`,
        [from, to],
    );
}

export async function totalsByProcedure(from: string, to: string): Promise<ProcedureTotals[]> {
    const db = await getDb();
    return db.getAllAsync<ProcedureTotals>(
        `SELECT p.id AS procedureId, p.name, ${SUMS}
     FROM entries e
     JOIN procedures p ON p.id = e.procedure_id
     WHERE e.date BETWEEN ? AND ?
     GROUP BY p.id
     ORDER BY quantity DESC, shareCents DESC`,
        [from, to],
    );
}

export async function totalsByDay(from: string, to: string): Promise<(Totals & { date: string })[]> {
    const db = await getDb();
    return db.getAllAsync<Totals & { date: string }>(
        `SELECT e.date, ${SUMS}
     FROM entries e
     WHERE e.date BETWEEN ? AND ?
     GROUP BY e.date
     ORDER BY e.date DESC`,
        [from, to],
    );
}