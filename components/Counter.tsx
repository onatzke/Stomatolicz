import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../lib/theme';

type Props = {
    quantity: number;
    onIncrement: () => void;
    onDecrement: () => void;
};

export default function Counter({ quantity, onIncrement, onDecrement }: Props) {
    function tap(action: () => void) {
        Haptics.selectionAsync();
        action();
    }

    return (
        <View style={s.wrap}>
            {quantity > 0 ? (
                <Pressable hitSlop={8} style={s.button} onPress={() => tap(onDecrement)}>
                    <Text style={s.symbol}>−</Text>
                </Pressable>
            ) : (
                <View style={s.button} />
            )}

            <Text style={[s.count, quantity === 0 && s.zero]}>{quantity}</Text>

            <Pressable hitSlop={8} style={s.button} onPress={() => tap(onIncrement)}>
                <Text style={[s.symbol, s.plus]}>+</Text>
            </Pressable>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    symbol: { fontSize: 24, color: colors.muted },
    plus: { color: colors.accent },
    count: { fontSize: 17, minWidth: 24, textAlign: 'center', color: colors.text },
    zero: { color: colors.border },
});