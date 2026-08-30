import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { formatPLN } from '../lib/money';
import {
    endOfMonth, endOfWeek, formatDate, formatMonth, formatRange,
    shiftDate, shiftMonth, startOfMonth, startOfWeek, todayISO,
} from '../lib/date';
import {
    totalsByDay, totalsByProcedure, totalsByWorkplace, totalsInRange,
    type ProcedureTotals, type Totals, type WorkplaceTotals,
} from '../db/summary';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../lib/ThemeContext';
import { useStyles } from '../lib/useStyles';
import { reportError } from '../lib/reportError';
import { spacing, tabular, type Colors } from '../lib/theme';

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

    const s = useStyles(makeStyles);
    const { colors } = useTheme();

    const load = useCallback(async () => {
        try {
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
        } catch (error) {
            reportError(error);
        }
    }, [from, to]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

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
                    <ChevronLeft size={24} color={colors.muted} />
                </Pressable>
                <Pressable onPress={() => setAnchor(todayISO())}>
                    <Text style={s.period}>{label}</Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => shift(1)}>
                    <ChevronRight size={24} color={colors.muted} />
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
    const s = useStyles(makeStyles);
    return (
        <View style={s.section}>
            <Text style={s.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function Row({ name, detail, value }: { name: string; detail: string; value: string }) {
    const s = useStyles(makeStyles);
    return (
        <View style={s.row}>
            <Text style={s.rowName} numberOfLines={1}>{name}</Text>
            <Text style={s.rowDetail}>{detail}</Text>
            <Text style={s.rowValue}>{value}</Text>
        </View>
    );
}

const makeStyles = (c: Colors) => ({
    container: { flex: 1, backgroundColor: c.bg },
    content: { paddingBottom: spacing.xl },
    tabs: {
        flexDirection: 'row' as const, margin: spacing.lg, borderRadius: 8,
        backgroundColor: c.surface, padding: 3,
    },
    tab: {
        flex: 1, paddingVertical: spacing.sm,
        alignItems: 'center' as const, borderRadius: 6,
    },
    tabActive: { backgroundColor: c.accentSoft },
    tabText: { fontSize: 14, color: c.muted },
    tabTextActive: { color: c.accent, fontWeight: '600' as const },
    nav: {
        flexDirection: 'row' as const, alignItems: 'center' as const,
        justifyContent: 'center' as const, gap: spacing.lg, paddingBottom: spacing.md,
    },
    period: { fontSize: 16, color: c.text, minWidth: 150, textAlign: 'center' as const },
    hero: { alignItems: 'center' as const, paddingVertical: spacing.lg },
    heroValue: { fontSize: 36, fontWeight: '600' as const, color: c.text, ...tabular },
    heroLabel: { fontSize: 13, color: c.muted, marginTop: spacing.xs },
    empty: { textAlign: 'center' as const, color: c.muted, paddingVertical: spacing.xl },
    section: { marginTop: spacing.lg },
    sectionTitle: {
        fontSize: 11, color: c.muted, letterSpacing: 1,
        textTransform: 'uppercase' as const,
        paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row' as const, alignItems: 'center' as const,
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderTopWidth: 1, borderTopColor: c.border,
    },
    rowName: { flex: 1, fontSize: 15, color: c.text, paddingRight: spacing.sm },
    rowDetail: { fontSize: 13, color: c.muted, minWidth: 58, textAlign: 'right' as const, ...tabular },
    rowValue: { fontSize: 15, color: c.text, minWidth: 90, textAlign: 'right' as const, ...tabular },
});