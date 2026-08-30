import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { setDialogHandler, type DialogButton, type DialogRequest } from '../lib/dialog';
import { useStyles } from '../lib/useStyles';
import { spacing, type Colors } from '../lib/theme';

export default function DialogHost() {
    const [request, setRequest] = useState<DialogRequest | null>(null);
    const s = useStyles(makeStyles);

    useEffect(() => {
        setDialogHandler(setRequest);
        return () => setDialogHandler(null);
    }, []);

    function press(button: DialogButton) {
        setRequest(null);
        button.onPress?.();
    }

    return (
        <Modal
            visible={request !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setRequest(null)}
        >
            <View style={s.backdrop}>
                <View style={s.card}>
                    <View style={s.head}>
                        <Text style={s.title}>{request?.title}</Text>
                        {request?.message ? <Text style={s.message}>{request.message}</Text> : null}
                    </View>

                    {request?.buttons.map((b) => (
                        <Pressable key={b.label} style={s.button} onPress={() => press(b)}>
                            <Text
                                style={[s.label, b.destructive && s.destructive, b.cancel && s.cancel]}
                            >
                                {b.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        </Modal>
    );
}

const makeStyles = (c: Colors) => ({
    backdrop: {
        flex: 1, justifyContent: 'center' as const,
        padding: spacing.xl, backgroundColor: 'rgba(0,0,0,0.45)',
    },
    card: {
        backgroundColor: c.bg, borderRadius: 12,
        borderWidth: 1, borderColor: c.border, overflow: 'hidden' as const,
    },
    head: { padding: spacing.lg, gap: spacing.sm },
    title: { fontSize: 17, fontWeight: '600' as const, color: c.text },
    message: { fontSize: 14, color: c.muted, lineHeight: 20 },
    button: {
        paddingVertical: spacing.lg, alignItems: 'center' as const,
        borderTopWidth: 1, borderTopColor: c.border,
    },
    label: { fontSize: 16, color: c.accent },
    destructive: { color: c.danger },
    cancel: { color: c.muted },
});
