import { Modal, Pressable, Text, View } from 'react-native';
import { useStyles } from '../lib/useStyles';
import { spacing, type Colors } from '../lib/theme';

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
    const s = useStyles(makeStyles);

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

const makeStyles = (c: Colors) => ({
    backdrop: {
        flex: 1, justifyContent: 'flex-end' as const,
        padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.35)',
    },
    card: { backgroundColor: c.bg, borderRadius: 14, overflow: 'hidden' as const },
    title: {
        fontSize: 13, color: c.muted, textAlign: 'center' as const,
        paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    item: {
        paddingVertical: spacing.lg, alignItems: 'center' as const,
        borderBottomWidth: 1, borderBottomColor: c.border,
    },
    label: { fontSize: 16, color: c.text },
    destructive: { color: c.danger },
    cancel: { color: c.muted },
});