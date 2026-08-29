import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FormModal from '../components/FormModal';
import { colors, spacing } from '../lib/theme';
import { parsePercent } from '../lib/money';
import { confirmDelete } from '../lib/confirm';
import {
    archiveWorkplace, createWorkplace, listWorkplaces, updateWorkplace, type Workplace,
} from '../db/catalog';


export default function WorkplacesScreen({ navigation }: any) {
    const [items, setItems] = useState<Workplace[]>([]);
    const [editing, setEditing] = useState<Workplace | 'new' | null>(null);
    const [name, setName] = useState('');
    const [share, setShare] = useState('');
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(() => {
        listWorkplaces().then(setItems);
    }, []);

    useFocusEffect(reload);

    function open(target: Workplace | 'new') {
        setEditing(target);
        setName(target === 'new' ? '' : target.name);
        setShare(target === 'new' ? '' : String(target.default_share));
        setError(null);
    }

    async function save() {
        const trimmed = name.trim();
        if (!trimmed) return setError('Podaj nazwę miejsca pracy.');

        const percent = parsePercent(share || '0');
        if (percent === null) return setError('Procent musi być liczbą od 0 do 100.');

        if (editing === 'new') await createWorkplace(trimmed, percent);
        else if (editing) await updateWorkplace(editing.id, trimmed, percent);

        setEditing(null);
        reload();
    }

    function remove() {
        if (editing === 'new' || !editing) return;
        const target = editing;
        confirmDelete(
            `Miejsce pracy „${target.name}" zniknie z listy. Historia zarobków zostanie zachowana.`,
            async () => {
                await archiveWorkplace(target.id);
                setEditing(null);
                reload();
            },
        );
    }

    return (
        <View style={s.container}>
            <FlatList
                data={items}
                keyExtractor={(w) => String(w.id)}
                renderItem={({ item }) => (
                    <Pressable
                        style={s.row}
                        onPress={() =>
                            navigation.navigate('Pricing', { workplaceId: item.id, title: item.name })
                        }
                        onLongPress={() => open(item)}
                    >
                        <Text style={s.name}>{item.name}</Text>
                        <Text style={s.share}>{item.default_share}%</Text>
                    </Pressable>
                )}
                ListFooterComponent={
                    <>
                        <Pressable style={s.add} onPress={() => open('new')}>
                            <Text style={s.addText}>+ Dodaj miejsce pracy</Text>
                        </Pressable>
                        <Text style={s.hint}>
                            Dotknij, aby ustawić cennik. Przytrzymaj, aby zmienić nazwę lub procent.
                        </Text>
                    </>
                }
            />

            <FormModal
                visible={editing !== null}
                title={editing === 'new' ? 'Nowe miejsce pracy' : 'Edycja miejsca pracy'}
                fields={[
                    { key: 'name', label: 'Nazwa', value: name, onChange: setName, autoFocus: true },
                    {
                        key: 'share', label: 'Mój procent', value: share,
                        onChange: setShare, numeric: true, placeholder: '40',
                    },
                ]}
                error={error}
                destructive={
                    editing !== 'new' && editing
                        ? { label: 'Usuń miejsce pracy', onPress: remove }
                        : undefined
                }
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
        paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    name: { fontSize: 16, color: colors.text, flex: 1 },
    share: { fontSize: 16, color: colors.muted },
    add: { padding: spacing.lg },
    addText: { fontSize: 16, color: colors.accent },
    hint: { paddingHorizontal: spacing.lg, fontSize: 13, color: colors.muted },
});