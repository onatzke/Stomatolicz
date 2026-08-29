import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../lib/theme';

export type Action = {
    label: string;
    onPress: () => void;
    destructive?: boolean;
};

type Props = {
    visible: boolean;
    title: string;
    actions: Action[];
    onCancel: () => void;
};

export default function ActionSheet({ visible, title, actions, onCancel }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <Pressable style={s.backdrop} onPress={onCancel}>
                <Pressable style={s.card} onPress={(e) => e.stopPropagation()}>
                    <Text style={s.title}>{title}</Text>
                    {actions.map((a) => (
                        <Pressable key={a.label} style={s.item} onPress={a.onPress}>
                            <Text style={[s.label, a.destructive && s.destructive]}>{a.label}</Text>
                        </Pressable>
                    ))}
                    <Pressable style={s.item} onPress={onCancel}>
                        <Text style={[s.label, s.cancel]}>Anuluj</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1, justifyContent: 'flex-end',
        padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.35)',
    },
    card: { backgroundColor: colors.bg, borderRadius: 14, overflow: 'hidden' },
    title: {
        fontSize: 13, color: colors.muted, textAlign: 'center',
        paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    item: {
        paddingVertical: spacing.lg, alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    label: { fontSize: 16, color: colors.text },
    destructive: { color: colors.danger },
    cancel: { color: colors.muted },
});