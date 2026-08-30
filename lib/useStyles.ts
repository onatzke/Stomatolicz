import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';
import type { Colors } from './theme';

export function useStyles<T extends StyleSheet.NamedStyles<T>>(
    factory: (c: Colors) => T,
): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
}