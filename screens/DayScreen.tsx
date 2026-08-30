import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { useFocusEffect } from '@react-navigation/native';
import ActionSheet from '../components/ActionSheet';
import Counter from '../components/Counter';
import FormModal from '../components/FormModal';
import { calculateShare, formatPLN, parsePLN, parsePercent } from '../lib/money';
import { formatDate, fromDate, isFuture, shiftDate, toDate, todayISO } from '../lib/date';
import {
    addProcedure, deleteProcedureEverywhere, getWorkplace,
    removeProcedure, updatePricing, type Workplace,
} from '../db/catalog';
import { getDb } from '../db';
import { decrement, increment, loadDay, loadOrder, type DayRow } from '../db/entries';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../lib/ThemeContext';
import { useStyles } from '../lib/useStyles';
import { reportError } from '../lib/reportError';
import { showDialog } from '../lib/dialog';
import { spacing, tabular, type Colors } from '../lib/theme';


type Dialog =
    | { kind: 'custom'; row: DayRow }
    | { kind: 'price'; row: DayRow }
    | { kind: 'new' }
    | null;

export default function DayScreen({ route }: any) {
    const { workplaceId } = route.params;

    const [workplace, setWorkplace] = useState<Workplace | null>(null);
    const [date, setDate] = useState(todayISO());
    const [rows, setRows] = useState<DayRow[]>([]);
    const [query, setQuery] = useState('');

    const [menuFor, setMenuFor] = useState<DayRow | null>(null);
    const [dialog, setDialog] = useState<Dialog>(null);
    const [price, setPrice] = useState('');
    const [share, setShare] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const orderRef = useRef<number[] | null>(null);

    const [showPicker, setShowPicker] = useState(false);

    const s = useStyles(makeStyles);
    const { colors } = useTheme();

    useFocusEffect(
        useCallback(() => {
            getWorkplace(workplaceId).then(setWorkplace).catch(reportError);
        }, [workplaceId]),
    );

    useEffect(() => {
        orderRef.current = null;
    }, [date]);

    const reload = useCallback(async () => {
        try {
            const data = await loadDay(workplaceId, date);
            if (!orderRef.current) orderRef.current = await loadOrder(workplaceId);
            const order = orderRef.current;
            const rank = (id: number) => {
                const i = order.indexOf(id);
                return i === -1 ? Number.MAX_SAFE_INTEGER : i;
            };
            setRows([...data].sort((a, b) => rank(a.procedureId) - rank(b.procedureId)));
        } catch (error) {
            reportError(error);
        }
    }, [workplaceId, date]);

    useEffect(() => {
        if (workplace) reload();
    }, [workplace, reload]);

    async function add(row: DayRow, priceCents: number, sharePercent: number) {
        const isCustom = priceCents !== row.priceCents || sharePercent !== row.sharePercent;

        setRows((prev) =>
            prev.map((r) => {
                if (r.procedureId !== row.procedureId) return r;
                if (!isCustom) return { ...r, quantity: r.quantity + 1 };
                const existing = r.custom.find(
                    (c) => c.priceCents === priceCents && c.sharePercent === sharePercent,
                );
                return existing
                    ? {
                        ...r,
                        custom: r.custom.map((c) =>
                            c === existing ? { ...c, quantity: c.quantity + 1 } : c,
                        ),
                    }
                    : {
                        ...r,
                        custom: [...r.custom, { entryId: -1, priceCents, sharePercent, quantity: 1 }],
                    };
            }),
        );

        let entryId: number;
        try {
            entryId = await increment({
                workplaceId, date, procedureId: row.procedureId,
                priceCents, sharePercent, isCustom,
            });
        } catch (error) {
            // optymistyczna zmiana jest już na ekranie — wracamy do stanu z bazy
            reportError(error);
            return reload();
        }

        setRows((prev) =>
            prev.map((r) => {
                if (r.procedureId !== row.procedureId) return r;
                if (!isCustom) return { ...r, entryId };
                return {
                    ...r,
                    custom: r.custom.map((c) =>
                        c.priceCents === priceCents && c.sharePercent === sharePercent
                            ? { ...c, entryId }
                            : c,
                    ),
                };
            }),
        );
    }

    async function subtract(row: DayRow, entryId: number | null, custom?: number) {
        if (entryId === null || entryId < 0) return;

        setRows((prev) =>
            prev.map((r) => {
                if (r.procedureId !== row.procedureId) return r;
                if (custom === undefined) return { ...r, quantity: Math.max(0, r.quantity - 1) };
                return {
                    ...r,
                    custom: r.custom
                        .map((c, i) => (i === custom ? { ...c, quantity: c.quantity - 1 } : c))
                        .filter((c) => c.quantity > 0),
                };
            }),
        );

        try {
            await decrement(entryId);
        } catch (error) {
            reportError(error);
            await reload();
        }
    }

    function openDialog(next: Dialog) {
        setMenuFor(null);
        setError(null);
        if (next?.kind === 'custom') {
            setPrice(next.row.priceCents ? String(next.row.priceCents / 100) : '');
            setShare(String(next.row.sharePercent));
        } else if (next?.kind === 'price') {
            setPrice(next.row.priceCents ? String(next.row.priceCents / 100) : '');
        } else if (next?.kind === 'new') {
            setName('');
        }
        setDialog(next);
    }

    async function confirmRemove(row: DayRow) {
        setMenuFor(null);

        let entries = 0;
        let others = 0;
        try {
            const db = await getDb();
            const used = await db.getFirstAsync<{ n: number }>(
                'SELECT COUNT(*) AS n FROM entries WHERE procedure_id = ?',
                [row.procedureId],
            );
            const elsewhere = await db.getFirstAsync<{ n: number }>(
                'SELECT COUNT(*) AS n FROM workplace_procedures WHERE procedure_id = ? AND workplace_id != ?',
                [row.procedureId, workplaceId],
            );
            entries = used?.n ?? 0;
            others = elsewhere?.n ?? 0;
        } catch (error) {
            return reportError(error);
        }

        const details = [
            others > 0 ? `Używana w ${others} innych miejscach pracy.` : null,
            entries > 0 ? `Wpisy w historii (${entries}) zostaną zachowane.` : null,
        ].filter(Boolean).join(' ');

        async function run(action: () => Promise<void>) {
            try {
                await action();
            } catch (error) {
                return reportError(error);
            }
            orderRef.current = null;
            reload();
        }

        showDialog({
            title: row.name,
            message: `Jak usunąć tę procedurę? ${details}`.trim(),
            buttons: [
                {
                    label: 'Tylko tutaj',
                    onPress: () => run(() => removeProcedure(workplaceId, row.procedureId)),
                },
                {
                    label: 'Wszędzie',
                    destructive: true,
                    onPress: () => run(() => deleteProcedureEverywhere(row.procedureId)),
                },
                { label: 'Anuluj', cancel: true },
            ],
        });
    }

    async function save() {
        if (!dialog) return;

        if (dialog.kind === 'new') {
            const trimmed = name.trim();
            if (!trimmed) return setError('Podaj nazwę procedury.');
            try {
                await addProcedure(workplaceId, trimmed);
            } catch (error) {
                return reportError(error);
            }
            setDialog(null);
            orderRef.current = null;
            return reload();
        }

        const cents = parsePLN(price);
        if (cents === null) return setError('Kwota musi być liczbą, np. 350 lub 350,50.');

        if (dialog.kind === 'price') {
            try {
                await updatePricing(workplaceId, dialog.row.procedureId, cents, null);
            } catch (error) {
                return reportError(error);
            }
            setDialog(null);
            return reload();
        }

        const percent = parsePercent(share);
        if (percent === null) return setError('Procent musi być liczbą od 0 do 100.');
        const target = dialog.row;
        setDialog(null);
        await add(target, cents, percent);
    }

    const visible = query.trim()
        ? rows.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
        : rows;

    const total = rows.reduce(
        (sum, r) =>
            sum +
            calculateShare(r.quantity, r.priceCents, r.sharePercent) +
            r.custom.reduce((s, c) => s + calculateShare(c.quantity, c.priceCents, c.sharePercent), 0),
        0,
    );

    const count = rows.reduce(
        (n, r) => n + r.quantity + r.custom.reduce((s, c) => s + c.quantity, 0),
        0,
    );

    const fields =
        dialog?.kind === 'new'
            ? [{ key: 'name', label: 'Nazwa', value: name, onChange: setName, autoFocus: true }]
            : dialog?.kind === 'price'
                ? [{
                    key: 'price', label: 'Kwota z cennika', value: price,
                    onChange: setPrice, numeric: true, autoFocus: true,
                }]
                : [
                    {
                        key: 'price', label: 'Kwota za sztukę', value: price,
                        onChange: setPrice, numeric: true, autoFocus: true,
                    },
                    { key: 'share', label: 'Mój procent', value: share, onChange: setShare, numeric: true },
                ];

    const dialogTitle =
        dialog?.kind === 'new' ? 'Nowa procedura' : dialog ? dialog.row.name : '';

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Pressable hitSlop={8} onPress={() => setDate(shiftDate(date, -1))}>
                    <ChevronLeft size={24} color={colors.muted} />
                </Pressable>
                <Pressable
                    onPress={() => setShowPicker(true)}
                    onLongPress={() => setDate(todayISO())}
                >
                    <Text style={[s.date, isFuture(date) && s.future]}>{formatDate(date)}</Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => setDate(shiftDate(date, 1))}>
                    <ChevronRight size={24} color={colors.muted} />
                </Pressable>
                <View style={s.spacer} />
                <Text style={s.share}>{workplace?.default_share ?? 0}%</Text>
            </View>

            {date !== todayISO() && (
                <Pressable onPress={() => setDate(todayISO())}>
                    <Text style={s.backToday}>← wróć do dzisiaj</Text>
                </Pressable>
            )}

            <TextInput
                style={s.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Szukaj procedury"
                placeholderTextColor={colors.muted}
            />

            <FlatList
                data={visible}
                keyExtractor={(r) => String(r.procedureId)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <View style={s.block}>
                        <Pressable
                            style={[s.row, (item.quantity > 0 || item.custom.length > 0) && s.rowActive]}
                            onLongPress={() => setMenuFor(item)}
                            delayLongPress={350}
                        >
                            <View style={s.info}>
                                <Text style={s.name}>{item.name}</Text>
                                <Text style={s.price}>
                                    {item.priceCents ? formatPLN(item.priceCents) : '—'} · {item.sharePercent}%
                                </Text>
                            </View>

                            {item.priceCents === 0 && !item.removed ? (
                                <Pressable onPress={() => openDialog({ kind: 'price', row: item })}>
                                    <Text style={s.setPrice}>ustaw cenę</Text>
                                </Pressable>
                            ) : (
                                <Counter
                                    quantity={item.quantity}
                                    onIncrement={() => add(item, item.priceCents, item.sharePercent)}
                                    onDecrement={() => subtract(item, item.entryId)}
                                />
                            )}
                        </Pressable>

                        {item.custom.map((c, i) => (
                            <View key={`${c.priceCents}-${c.sharePercent}`} style={[s.row, s.sub]}>
                                <View style={s.info}>
                                    <Text style={s.price}>↳ {formatPLN(c.priceCents)} · {c.sharePercent}%</Text>
                                </View>
                                <Counter
                                    quantity={c.quantity}
                                    onIncrement={() => add(item, c.priceCents, c.sharePercent)}
                                    onDecrement={() => subtract(item, c.entryId, i)}
                                />
                            </View>
                        ))}
                    </View>
                )}
                ListFooterComponent={
                    <Pressable style={s.add} onPress={() => openDialog({ kind: 'new' })}>
                        <Text style={s.addText}>+ Dodaj procedurę</Text>
                    </Pressable>
                }
                ListEmptyComponent={
                    query ? <Text style={s.hint}>Brak pasujących procedur.</Text> : null
                }
            />

            <View style={s.footer}>
                <Text style={s.footerCount}>{count} {count === 1 ? 'zabieg' : 'zabiegów'}</Text>
                <Text style={s.total}>{formatPLN(total)}</Text>
            </View>

            {showPicker && (
                <DateTimePicker
                    value={toDate(date)}
                    mode="date"
                    display="calendar"
                    onChange={(event, selected) => {
                        setShowPicker(false);
                        if (event.type === 'set' && selected) setDate(fromDate(selected));
                    }}
                />
            )}

            <ActionSheet
                visible={menuFor !== null}
                title={menuFor?.name ?? ''}
                onCancel={() => setMenuFor(null)}
                actions={
                    menuFor
                        ? [
                            {
                                label: 'Dodaj z inną kwotą',
                                onPress: () => openDialog({ kind: 'custom', row: menuFor }),
                            },
                            {
                                label: 'Zmień cenę w cenniku',
                                onPress: () => openDialog({ kind: 'price', row: menuFor }),
                            },
                            {
                                label: 'Usuń procedurę',
                                destructive: true,
                                onPress: () => confirmRemove(menuFor),
                            },
                        ]
                        : []
                }
            />

            <FormModal
                visible={dialog !== null}
                title={dialogTitle}
                fields={fields}
                error={error}
                saveLabel={dialog?.kind === 'custom' ? 'Dodaj' : dialog?.kind === 'new' ? 'Dodaj' : 'Zapisz'}
                onSave={save}
                onCancel={() => setDialog(null)}
            />
        </View>
    );
}

const makeStyles = (c: Colors) => ({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md,
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    },
    date: {
        fontSize: 17, fontWeight: '600' as const, color: c.text,
        minWidth: 100, textAlign: 'center' as const,
    },
    future: { color: c.accent },
    backToday: {
        paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
        fontSize: 13, color: c.accent,
    },
    spacer: { flex: 1 },
    share: { fontSize: 14, color: c.muted, ...tabular },
    search: {
        marginHorizontal: spacing.lg, marginBottom: spacing.sm,
        borderWidth: 1, borderColor: c.border, borderRadius: 8,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        fontSize: 15, color: c.text, backgroundColor: c.surface,
    },
    block: { borderBottomWidth: 1, borderBottomColor: c.border },
    row: {
        flexDirection: 'row' as const, alignItems: 'center' as const,
        paddingLeft: spacing.lg, paddingRight: spacing.sm, paddingVertical: spacing.xs,
        borderLeftWidth: 3, borderLeftColor: 'transparent',
    },
    rowActive: { borderLeftColor: c.accent },
    sub: { paddingLeft: spacing.xl, backgroundColor: c.surface },
    info: { flex: 1, paddingRight: spacing.sm },
    name: { fontSize: 15, color: c.text },
    removedName: { color: c.muted, fontStyle: 'italic' as const },
    price: { fontSize: 13, color: c.muted, ...tabular },
    setPrice: { fontSize: 14, color: c.accent, padding: spacing.md },
    add: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    addText: { fontSize: 16, color: c.accent },
    footer: {
        flexDirection: 'row' as const, alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bg,
    },
    footerCount: { fontSize: 14, color: c.muted },
    total: { fontSize: 22, fontWeight: '600' as const, color: c.text, ...tabular },
    hint: {
        paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
        fontSize: 13, color: c.muted, lineHeight: 19,
    },
});