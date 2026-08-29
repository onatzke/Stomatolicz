import { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Counter from '../components/Counter';
import FormModal from '../components/FormModal';
import { colors, spacing } from '../lib/theme';
import { calculateShare, formatPLN, parsePLN, parsePercent } from '../lib/money';
import { formatDate, shiftDate, todayISO } from '../lib/date';
import { listWorkplaces, updatePricing, type Workplace } from '../db/catalog';
import {
    decrement, increment, loadDay, loadOrder, type DayRow,
} from '../db/entries';

export default function DayScreen({ navigation }: any) {
    const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
    const [workplace, setWorkplace] = useState<Workplace | null>(null);
    const [date, setDate] = useState(todayISO());
    const [rows, setRows] = useState<DayRow[]>([]);
    const [query, setQuery] = useState('');
    const [focusToken, setFocusToken] = useState(0);

    const [customFor, setCustomFor] = useState<DayRow | null>(null);
    const [priceFor, setPriceFor] = useState<DayRow | null>(null);
    const [price, setPrice] = useState('');
    const [share, setShare] = useState('');
    const [error, setError] = useState<string | null>(null);

    const orderRef = useRef<number[] | null>(null);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            listWorkplaces().then((list) => {
                if (cancelled) return;
                setWorkplaces(list);
                setWorkplace((prev) => {
                    const found = prev && list.find((w) => w.id === prev.id);
                    return found ?? list[0] ?? null;
                });
                setFocusToken((n) => n + 1);
            });
            return () => {
                cancelled = true;
            };
        }, []),
    );

    // Zmiana miejsca pracy lub dnia unieważnia zamrożoną kolejność.
    useEffect(() => {
        orderRef.current = null;
    }, [workplace?.id, date]);

    const reload = useCallback(async () => {
        if (!workplace) return setRows([]);
        const data = await loadDay(workplace.id, date);
        if (!orderRef.current) orderRef.current = await loadOrder(workplace.id);
        const order = orderRef.current;
        const rank = (id: number) => {
            const i = order.indexOf(id);
            return i === -1 ? Number.MAX_SAFE_INTEGER : i;
        };
        setRows([...data].sort((a, b) => rank(a.procedureId) - rank(b.procedureId)));
    }, [workplace, date]);

    useEffect(() => {
        reload();
    }, [reload, focusToken]);

    async function add(row: DayRow, priceCents: number, sharePercent: number) {
        if (!workplace) return;
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

        const entryId = await increment({
            workplaceId: workplace.id,
            date,
            procedureId: row.procedureId,
            priceCents,
            sharePercent,
            isCustom,
        });

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

        await decrement(entryId);
    }

    function openCustom(row: DayRow) {
        setCustomFor(row);
        setPrice(row.priceCents ? String(row.priceCents / 100) : '');
        setShare(String(row.sharePercent));
        setError(null);
    }

    async function saveCustom() {
        if (!customFor) return;
        const cents = parsePLN(price);
        if (cents === null) return setError('Kwota musi być liczbą, np. 350 lub 350,50.');
        const percent = parsePercent(share);
        if (percent === null) return setError('Procent musi być liczbą od 0 do 100.');

        const target = customFor;
        setCustomFor(null);
        await add(target, cents, percent);
    }

    async function savePrice() {
        if (!priceFor || !workplace) return;
        const cents = parsePLN(price);
        if (cents === null) return setError('Kwota musi być liczbą, np. 350.');
        await updatePricing(workplace.id, priceFor.procedureId, cents, null);
        setPriceFor(null);
        reload();
    }

    const visible = query.trim()
        ? rows.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
        : rows;

    const total = rows.reduce(
        (sum, r) =>
            sum +
            calculateShare(r.quantity, r.priceCents, r.sharePercent) +
            r.custom.reduce(
                (s, c) => s + calculateShare(c.quantity, c.priceCents, c.sharePercent),
                0,
            ),
        0,
    );

    const count = rows.reduce(
        (n, r) => n + r.quantity + r.custom.reduce((s, c) => s + c.quantity, 0),
        0,
    );

    function cycleWorkplace() {
        if (workplaces.length < 2 || !workplace) return;
        const i = workplaces.findIndex((w) => w.id === workplace.id);
        setWorkplace(workplaces[(i + 1) % workplaces.length]);
    }

    if (!workplace) {
        return (
            <View style={s.empty}>
                <Text style={s.emptyText}>Najpierw dodaj miejsce pracy.</Text>
                <Pressable onPress={() => navigation.navigate('Workplaces')}>
                    <Text style={s.link}>Przejdź do ustawień</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Pressable hitSlop={8} onPress={() => setDate(shiftDate(date, -1))}>
                    <Text style={s.arrow}>‹</Text>
                </Pressable>
                <Pressable onPress={() => setDate(todayISO())}>
                    <Text style={s.date}>{formatDate(date)}</Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => setDate(shiftDate(date, 1))}>
                    <Text style={s.arrow}>›</Text>
                </Pressable>
                <View style={s.spacer} />
                <Pressable onPress={cycleWorkplace} onLongPress={() => navigation.navigate('Workplaces')}>
                    <Text style={s.workplace}>{workplace.name}</Text>
                </Pressable>
            </View>

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
                            style={s.row}
                            onLongPress={() => openCustom(item)}
                            delayLongPress={350}
                        >
                            <View style={s.info}>
                                <Text style={s.name}>{item.name}</Text>
                                <Text style={s.price}>
                                    {item.priceCents ? formatPLN(item.priceCents) : '—'} · {item.sharePercent}%
                                </Text>
                            </View>

                            {item.priceCents === 0 && !item.removed ? (
                                <Pressable
                                    onPress={() => {
                                        setPriceFor(item);
                                        setPrice('');
                                        setError(null);
                                    }}
                                >
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
                                    <Text style={s.price}>
                                        ↳ {formatPLN(c.priceCents)} · {c.sharePercent}%
                                    </Text>
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
                ListEmptyComponent={
                    <Text style={s.hint}>
                        {query ? 'Brak pasujących procedur.' : 'Cennik tego miejsca jest pusty.'}
                    </Text>
                }
            />

            <View style={s.footer}>
                <Text style={s.footerCount}>
                    {count} {count === 1 ? 'zabieg' : 'zabiegów'}
                </Text>
                <Text style={s.total}>{formatPLN(total)}</Text>
            </View>

            <FormModal
                visible={customFor !== null}
                title={customFor?.name ?? ''}
                fields={[
                    {
                        key: 'price', label: 'Kwota za 1 procedurę', value: price,
                        onChange: setPrice, numeric: true, autoFocus: true,
                    },
                    {
                        key: 'share', label: 'Mój procent', value: share,
                        onChange: setShare, numeric: true,
                    },
                ]}
                error={error}
                saveLabel="Dodaj"
                onSave={saveCustom}
                onCancel={() => setCustomFor(null)}
            />

            <FormModal
                visible={priceFor !== null}
                title={priceFor?.name ?? ''}
                fields={[
                    {
                        key: 'price', label: 'Kwota z cennika', value: price,
                        onChange: setPrice, numeric: true, autoFocus: true,
                    },
                ]}
                error={error}
                onSave={savePrice}
                onCancel={() => setPriceFor(null)}
            />
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    },
    arrow: { fontSize: 26, color: colors.muted },
    date: { fontSize: 17, fontWeight: '600', color: colors.text, minWidth: 90, textAlign: 'center' },
    spacer: { flex: 1 },
    workplace: { fontSize: 14, color: colors.accent },
    search: {
        marginHorizontal: spacing.lg, marginBottom: spacing.sm,
        borderWidth: 1, borderColor: colors.border, borderRadius: 8,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        fontSize: 15, color: colors.text,
    },
    block: { borderBottomWidth: 1, borderBottomColor: colors.border },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingLeft: spacing.lg, paddingRight: spacing.sm, paddingVertical: spacing.xs,
    },
    sub: { paddingLeft: spacing.xl, backgroundColor: colors.surface },
    info: { flex: 1, paddingRight: spacing.sm },
    name: { fontSize: 15, color: colors.text },
    price: { fontSize: 13, color: colors.muted },
    setPrice: { fontSize: 14, color: colors.accent, padding: spacing.md },
    footer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    footerCount: { fontSize: 14, color: colors.muted },
    total: { fontSize: 19, fontWeight: '600', color: colors.text },
    hint: { padding: spacing.lg, color: colors.muted, fontSize: 14 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    emptyText: { fontSize: 15, color: colors.muted },
    link: { fontSize: 16, color: colors.accent },
});