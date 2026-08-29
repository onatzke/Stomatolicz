import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FormModal from '../components/FormModal';
import { colors, spacing } from '../lib/theme';
import { confirmDelete } from '../lib/confirm';
import { getDb } from '../db';
import { formatPLN, parsePLN, parsePercent } from '../lib/money';
import {
    addProcedure, listPricing, removeProcedure, updatePricing, type PricingRow,
} from '../db/catalog';
import { deleteProcedureEverywhere } from '../db/catalog';

export default function PricingScreen({ route }: any) {
    const { workplaceId } = route.params;

    const [rows, setRows] = useState<PricingRow[]>([]);
    const [editing, setEditing] = useState<PricingRow | 'new' | null>(null);
    const [price, setPrice] = useState('');
    const [share, setShare] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(() => {
        listPricing(workplaceId).then(setRows);
    }, [workplaceId]);

    useFocusEffect(reload);

    function open(target: PricingRow | 'new') {
        setEditing(target);
        setError(null);
        if (target === 'new') {
            setName('');
            setPrice('');
            setShare('');
        } else {
            setPrice(target.price_cents ? String(target.price_cents / 100) : '');
            setShare(target.share_percent === null ? '' : String(target.share_percent));
        }
    }

    async function save() {
        if (editing === 'new') {
            const trimmed = name.trim();
            if (!trimmed) return setError('Podaj nazwę procedury.');
            await addProcedure(workplaceId, trimmed);
            setEditing(null);
            return reload();
        }
        if (!editing) return;

        const cents = price.trim() ? parsePLN(price) : 0;
        if (cents === null) return setError('Kwota musi być liczbą, np. 350 lub 350,50.');

        let percent: number | null = null;
        if (share.trim()) {
            percent = parsePercent(share);
            if (percent === null) return setError('Procent musi być liczbą od 0 do 100.');
        }

        await updatePricing(workplaceId, editing.procedure_id, cents, percent);
        setEditing(null);
        reload();
    }

    async function remove() {
        if (editing === 'new' || !editing) return;
        const target = editing;

        const db = await getDb();
        const used = await db.getFirstAsync<{ n: number }>(
            'SELECT COUNT(*) AS n FROM entries WHERE procedure_id = ?',
            [target.procedure_id],
        );
        const elsewhere = await db.getFirstAsync<{ n: number }>(
            'SELECT COUNT(*) AS n FROM workplace_procedures WHERE procedure_id = ? AND workplace_id != ?',
            [target.procedure_id, workplaceId],
        );

        const entries = used?.n ?? 0;
        const others = elsewhere?.n ?? 0;

        const details = [
            others > 0 ? `Używana w innych miejscach pracy: ${others}.` : null,
            entries > 0 ? `Wpisy w historii (${entries}) zostaną zachowane.` : null,
        ]
            .filter(Boolean)
            .join(' ');

        async function run(action: () => Promise<void>) {
            await action();
            setEditing(null);
            reload();
        }

        Alert.alert(
            target.name,
            `Jak usunąć tę procedurę? ${details}`.trim(),
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Tylko tutaj',
                    onPress: () => run(() => removeProcedure(workplaceId, target.procedure_id)),
                },
                {
                    text: 'Wszędzie',
                    style: 'destructive',
                    onPress: () => run(() => deleteProcedureEverywhere(target.procedure_id)),
                },
            ],
        );
    }

    return (
        <View style={s.container}>
            <FlatList
                data={rows}
                keyExtractor={(r) => String(r.procedure_id)}
                renderItem={({ item }) => (
                    <Pressable
                        style={[s.row, !item.is_active && s.inactive]}
                        onPress={() => open(item)}
                    >
                        <Text style={s.name}>{item.name}</Text>
                        <View style={s.right}>
                            <Text style={item.price_cents ? s.price : s.unset}>
                                {item.price_cents ? formatPLN(item.price_cents) : 'ustaw cenę'}
                            </Text>
                            {item.share_percent !== null && (
                                <Text style={s.override}>{item.share_percent}%</Text>
                            )}
                        </View>
                    </Pressable>
                )}
                ListFooterComponent={
                    <>
                        <Pressable style={s.add} onPress={() => open('new')}>
                            <Text style={s.addText}>+ Dodaj procedurę</Text>
                        </Pressable>
                        <Text style={s.hint}>
                            Puste pole procentu oznacza, że obowiązuje domyślny procent miejsca pracy.
                        </Text>
                    </>
                }
            />

            <FormModal
                visible={editing !== null}
                title={editing === 'new' ? 'Nowa procedura' : (editing?.name ?? '')}
                fields={
                    editing === 'new'
                        ? [{ key: 'name', label: 'Nazwa', value: name, onChange: setName, autoFocus: true }]
                        : [
                            {
                                key: 'price', label: 'Kwota', value: price,
                                onChange: setPrice, numeric: true, placeholder: '350', autoFocus: true,
                            },
                            {
                                key: 'share', label: 'Procent (opcjonalnie)', value: share,
                                onChange: setShare, numeric: true, placeholder: 'domyślny',
                            },
                        ]
                }
                error={error}
                destructive={
                    editing !== 'new' && editing
                        ? { label: 'Usuń procedurę', onPress: remove }
                        : undefined
                }
                saveLabel={editing === 'new' ? 'Dodaj' : 'Zapisz'}
                onSave={save}
                onCancel={() => setEditing(null)}
            />
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    inactive: { opacity: 0.4 },
    name: { fontSize: 15, color: colors.text, flex: 1, paddingRight: spacing.md },
    right: { alignItems: 'flex-end' },
    price: { fontSize: 15, color: colors.text },
    unset: { fontSize: 15, color: colors.accent },
    override: { fontSize: 12, color: colors.muted },
    add: { padding: spacing.lg },
    addText: { fontSize: 16, color: colors.accent },
    hint: { paddingHorizontal: spacing.lg, fontSize: 13, color: colors.muted },
});