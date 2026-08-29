import { getDb } from './index';

export type Workplace = {
    id: number;
    name: string;
    default_share: number;
};

export type PricingRow = {
    procedure_id: number;
    name: string;
    price_cents: number;
    share_percent: number | null;
    is_active: number;
};

export async function listWorkplaces(): Promise<Workplace[]> {
    const db = await getDb();
    return db.getAllAsync<Workplace>(
        `SELECT id, name, default_share FROM workplaces
     WHERE is_archived = 0 ORDER BY sort_order, id`,
    );
}

export async function createWorkplace(name: string, share: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `INSERT INTO workplaces (name, default_share, sort_order, created_at)
     VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM workplaces), datetime('now'))`,
        [name, share],
    );
}

export async function updateWorkplace(id: number, name: string, share: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `UPDATE workplaces SET name = ?, default_share = ? WHERE id = ?`,
        [name, share, id],
    );
}

export async function archiveWorkplace(id: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(`UPDATE workplaces SET is_archived = 1 WHERE id = ?`, [id]);
}

export async function listPricing(workplaceId: number): Promise<PricingRow[]> {
    const db = await getDb();
    return db.getAllAsync<PricingRow>(
        `SELECT p.id AS procedure_id, p.name, wp.price_cents, wp.share_percent, wp.is_active
     FROM workplace_procedures wp
     JOIN procedures p ON p.id = wp.procedure_id
     WHERE wp.workplace_id = ?
     ORDER BY wp.is_active DESC, p.name COLLATE NOCASE`,
        [workplaceId],
    );
}

export async function updatePricing(
    workplaceId: number,
    procedureId: number,
    priceCents: number,
    sharePercent: number | null,
): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `UPDATE workplace_procedures SET price_cents = ?, share_percent = ?
     WHERE workplace_id = ? AND procedure_id = ?`,
        [priceCents, sharePercent, workplaceId, procedureId],
    );
}


export async function addProcedure(workplaceId: number, name: string): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `INSERT OR IGNORE INTO procedures (name, created_at) VALUES (?, datetime('now'))`,
            [name],
        );
        const row = await db.getFirstAsync<{ id: number }>(
            `SELECT id FROM procedures WHERE name = ? COLLATE NOCASE`,
            [name],
        );
        if (!row) return;
        await db.runAsync(
            `INSERT INTO workplace_procedures (workplace_id, procedure_id, price_cents, share_percent)
       VALUES (?, ?, 0, NULL)
       ON CONFLICT(workplace_id, procedure_id) DO UPDATE SET is_active = 1`,
            [workplaceId, row.id],
        );
    });
}


export async function removeProcedure(workplaceId: number, procedureId: number): Promise<void> {
    const db = await getDb();
    const used = await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM entries WHERE procedure_id = ?`,
        [procedureId],
    );

    if ((used?.n ?? 0) === 0) {
        await db.withTransactionAsync(async () => {
            await db.runAsync(`DELETE FROM workplace_procedures WHERE procedure_id = ?`, [procedureId]);
            await db.runAsync(`DELETE FROM procedures WHERE id = ?`, [procedureId]);
        });
    } else {
        await db.runAsync(
            `UPDATE workplace_procedures SET is_active = 0
       WHERE workplace_id = ? AND procedure_id = ?`,
            [workplaceId, procedureId],
        );
    }
}