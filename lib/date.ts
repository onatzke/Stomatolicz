const MONTHS = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

const pad = (n: number) => String(n).padStart(2, '0');

export function todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDate(iso: string, days: number): string {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d + days);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDate(iso: string): string {
    if (iso === todayISO()) return 'Dzisiaj';
    if (iso === shiftDate(todayISO(), -1)) return 'Wczoraj';
    if (iso === shiftDate(todayISO(), 1)) return 'Jutro';
    const [, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]}`;
}

export function isFuture(iso: string): boolean {
    return iso > todayISO();
}

export function toDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function fromDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfWeek(iso: string): string {
    const d = toDate(iso);
    const offset = (d.getDay() + 6) % 7; // niedziela (0) → 6
    return shiftDate(iso, -offset);
}

export function endOfWeek(iso: string): string {
    return shiftDate(startOfWeek(iso), 6);
}

export function startOfMonth(iso: string): string {
    return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso: string): string {
    const [y, m] = iso.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return `${iso.slice(0, 7)}-${String(last).padStart(2, '0')}`;
}

export function shiftMonth(iso: string, months: number): string {
    const [y, m] = iso.split('-').map(Number);
    const d = new Date(y, m - 1 + months, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

const MONTHS_NOMINATIVE = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

export function formatMonth(iso: string): string {
    const [y, m] = iso.split('-').map(Number);
    return `${MONTHS_NOMINATIVE[m - 1]} ${y}`;
}

export function formatRange(from: string, to: string): string {
    const [, m1, d1] = from.split('-').map(Number);
    const [, m2, d2] = to.split('-').map(Number);
    return m1 === m2 ? `${d1}–${d2}.${String(m1).padStart(2, '0')}` : `${d1}.${m1} – ${d2}.${m2}`;
}