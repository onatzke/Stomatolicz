import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import { useStyles } from '../lib/useStyles';
import { spacing, tabular, type Colors } from '../lib/theme';

type Props = {
    quantity: number;
    onIncrement: () => void;
    onDecrement: () => void;
};

export default function Counter({ quantity, onIncrement, onDecrement }: Props) {
    const s = useStyles(makeStyles);
    const { colors } = useTheme();

    function tap(action: () => void) {
        Haptics.selectionAsync();
        action();
    }

    return (
        <View style={s.wrap}>
            {quantity > 0 ? (
                <Pressable hitSlop={8} style={s.button} onPress={() => tap(onDecrement)}>
                    <Minus size={16} color={colors.minus} strokeWidth={2.5} />
                </Pressable>
            ) : (
                <View style={s.button} />
            )}

            <Text style={[s.count, quantity === 0 && s.zero]}>{quantity}</Text>

            <Pressable hitSlop={8} style={s.button} onPress={() => tap(onIncrement)}>
                <Plus size={16} color={colors.accent} strokeWidth={2.5} />
            </Pressable>
        </View>
    );
}

const makeStyles = (c: Colors) => ({
    wrap: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.xs },
    button: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        backgroundColor: c.surface,
    },
    count: {
        fontSize: 17, minWidth: 26, textAlign: 'center' as const,
        color: c.text, ...tabular,
    },
    zero: { color: c.border },
});