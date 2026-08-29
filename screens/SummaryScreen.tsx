import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../lib/theme';
import { formatPLN } from '../lib/money';
import {
    endOfMonth, endOfWeek, formatDate, formatMonth, formatRange,
    shiftDate, shiftMonth, startOfMonth, startOfWeek, todayISO,
} from '../lib/date';
import {
    totalsByDay, totalsByProcedure, totalsByWorkplace, totalsInRange,
    type ProcedureTotals, type Totals, type WorkplaceTotals,
} from '../db/summary';

type Mode = 'week' | 'month';

export default function SummaryScreen() {
    const [mode, setMode] = useState<Mode>('month');
    const [anchor, setAnchor] = useState(todayISO());

    const [totals, setTotals] = useState<Totals>({ quantity: 0, grossCents: 0, shareCents: 0 });
    const [byWorkplace, setByWorkplace] = useState<WorkplaceTotals[]>([]);
    const [byProcedure, setByProcedure] = useState<ProcedureTotals[]>([]);
    const [byDay, setByDay] = useState<(Totals & { date: string })[]>([]);

    const from = mode === 'week' ? startOfWeek(anchor) : startOfMonth(anchor);
    const to = mode === 'week' ? endOfWeek(anchor) : endOfMonth(anchor);

    const load = useCallback(async () => {
        const [t, w, p, d] = await Promise.all([
            totalsInRange(from, to),
            totalsByWorkplace(from, to),
            totalsByProcedure(from, to),
            totalsByDay(from, to),
        ]);
        setTotals(t);
        setByWorkplace(w);
        setByProcedure(p);
        setByDay(d);
    }, [from, to]);

    useFocusEffect(useCallback(() => { load(); }, [load]));
    useEffect(() => { load(); }, [load]);

    function shift(direction: number) {
        setAnchor(mode === 'week' ? shiftDate(anchor, direction * 7) : shiftMonth(anchor, direction));
    }

    function switchMode(next: Mode) {
        setMode(next);
        setAnchor(todayISO());
    }

    const label = mode === 'week' ? formatRange(from, to) : formatMonth(from);

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
            <View style={s.tabs}>
                {(['week', 'month'] as Mode[]).map((m) => (
                    <Pressable
                        key={m}
                        style={[s.tab, mode === m && s.tabActive]}
                        onPress={() => switchMode(m)}
                    >
                        <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                            {m === 'week' ? 'Tydzień' : 'Miesiąc'}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <View style={s.nav}>
                <Pressable hitSlop={8} onPress={() => shift(-1)}>
                    <Text style={s.arrow}>‹</Text>
                </Pressable>
                <Pressable onPress={() => setAnchor(todayISO())}>
                    <Text style={s.period}>{label}</Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => shift(1)}>
                    <Text style={s.arrow}>›</Text>
                </Pressable>
            </View>

            <View style={s.hero}>
                <Text style={s.heroValue}>{formatPLN(totals.shareCents)}</Text>
                <Text style={s.heroLabel}>
                    {totals.quantity} {totals.quantity === 1 ? 'zabieg' : 'zabiegów'}
                    {' · obrót '}{formatPLN(totals.grossCents)}
                </Text>
            </View>

            {totals.quantity === 0 ? (
                <Text style={s.empty}>Brak wpisów w tym okresie.</Text>
            ) : (
                <>
                    <Section title="Miejsca pracy">
                        {byWorkplace.map((w) => (
                            <Row
                                key={w.workplaceId}
                                name={w.name}
                                detail={`${w.quantity} zab.`}
                                value={formatPLN(w.shareCents)}
                            />
                        ))}
                    </Section>

                    <Section title="Procedury">
                        {byProcedure.map((p) => (
                            <Row
                                key={p.procedureId}
                                name={p.name}
                                detail={`×${p.quantity}`}
                                value={formatPLN(p.shareCents)}
                            />
                        ))}
                    </Section>

                    <Section title="Dni">
                        {byDay.map((d) => (
                            <Row
                                key={d.date}
                                name={formatDate(d.date)}
                                detail={`${d.quantity} zab.`}
                                value={formatPLN(d.shareCents)}
                            />
                        ))}
                    </Section>
                </>
            )}
        </ScrollView>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={s.section}>
            <Text style={s.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function Row({ name, detail, value }: { name: string; detail: string; value: string }) {
    return (
        <View style={s.row}>
            <Text style={s.rowName} numberOfLines={1}>{name}</Text>
            <Text style={s.rowDetail}>{detail}</Text>
            <Text style={s.rowValue}>{value}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: spacing.xl },
    tabs: {
        flexDirection: 'row', margin: spacing.lg, borderRadius: 8,
        backgroundColor: colors.surface, padding: 2,
    },
    tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: 6 },
    tabActive: { backgroundColor: colors.bg },
    tabText: { fontSize: 14, color: colors.muted },
    tabTextActive: { color: colors.text, fontWeight: '600' },
    nav: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.lg, paddingBottom: spacing.md,
    },
    arrow: { fontSize: 26, color: colors.muted },
    period: { fontSize: 16, color: colors.text, minWidth: 140, textAlign: 'center' },
    hero: { alignItems: 'center', paddingVertical: spacing.lg },
    heroValue: { fontSize: 34, fontWeight: '700', color: colors.text },
    heroLabel: { fontSize: 13, color: colors.muted, marginTop: spacing.xs },
    empty: { textAlign: 'center', color: colors.muted, paddingVertical: spacing.xl },
    section: { marginTop: spacing.lg },
    sectionTitle: {
        fontSize: 12, color: colors.muted, textTransform: 'uppercase',
        paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    rowName: { flex: 1, fontSize: 15, color: colors.text, paddingRight: spacing.sm },
    rowDetail: { fontSize: 13, color: colors.muted, minWidth: 56, textAlign: 'right' },
    rowValue: { fontSize: 15, color: colors.text, minWidth: 88, textAlign: 'right' },
});