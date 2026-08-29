
export function formatPLN(cents: number): string {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
    }).format(cents / 100);
}

export function parsePLN(input: string): number | null {
    const normalized = input.replace(/\s/g, '').replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
    return Math.round(parseFloat(normalized) * 100);
}

export function calculateShare(
    quantity: number,
    unitPriceCents: number,
    sharePercent: number,
): number {
    return Math.round((quantity * unitPriceCents * sharePercent) / 100);
}

export function parsePercent(input: string): number | null {
    const normalized = input.replace(/\s/g, '').replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
    const value = parseFloat(normalized);
    return value >= 0 && value <= 100 ? value : null;
}