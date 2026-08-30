import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import { useStyles } from '../lib/useStyles';
import { spacing, type Colors } from '../lib/theme';


export type Field = {
    key: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    numeric?: boolean;
    autoFocus?: boolean;
};

type Props = {
    visible: boolean;
    title: string;
    fields: Field[];
    error?: string | null;
    saveLabel?: string;
    destructive?: { label: string; onPress: () => void };
    onSave: () => void;
    onCancel: () => void;
};

export default function FormModal({
                                      visible, title, fields, error, saveLabel = 'Zapisz',
                                      destructive, onSave, onCancel,
                                  }: Props) {

    const s = useStyles(makeStyles);
    const { colors } = useTheme();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <KeyboardAvoidingView
                style={s.backdrop}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={s.card}>
                    <Text style={s.title}>{title}</Text>

                    {fields.map((f) => (
                        <View key={f.key} style={s.field}>
                            <Text style={s.label}>{f.label}</Text>
                            <TextInput
                                style={s.input}
                                value={f.value}
                                onChangeText={f.onChange}
                                placeholder={f.placeholder}
                                placeholderTextColor={colors.muted}
                                keyboardType={f.numeric ? 'decimal-pad' : 'default'}
                                autoFocus={f.autoFocus}
                            />
                        </View>
                    ))}

                    {error ? <Text style={s.error}>{error}</Text> : null}

                    <View style={s.actions}>
                        <Pressable onPress={onCancel} style={s.button}>
                            <Text style={s.buttonText}>Anuluj</Text>
                        </Pressable>
                        <Pressable onPress={onSave} style={s.button}>
                            <Text style={[s.buttonText, s.save]}>{saveLabel}</Text>
                        </Pressable>
                    </View>

                    {destructive ? (
                        <Pressable onPress={destructive.onPress} style={s.destructive}>
                            <Text style={s.destructiveText}>{destructive.label}</Text>
                        </Pressable>
                    ) : null}
                </View>
            </KeyboardAvoidingView>
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
        padding: spacing.lg, gap: spacing.md,
        borderWidth: 1, borderColor: c.border,
    },
    title: { fontSize: 17, fontWeight: '600' as const, color: c.text },
    field: { gap: spacing.xs },
    label: { fontSize: 13, color: c.muted },
    input: {
        borderWidth: 1, borderColor: c.border, borderRadius: 8,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        fontSize: 16, color: c.text, backgroundColor: c.surface,
    },
    error: { color: c.danger, fontSize: 13 },
    actions: { flexDirection: 'row' as const, justifyContent: 'flex-end' as const, gap: spacing.lg },
    button: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
    buttonText: { fontSize: 16, color: c.muted },
    save: { color: c.accent, fontWeight: '600' as const },
    destructive: {
        borderTopWidth: 1, borderTopColor: c.border,
        paddingTop: spacing.md, alignItems: 'center' as const,
    },
    destructiveText: { color: c.danger, fontSize: 15 },
});