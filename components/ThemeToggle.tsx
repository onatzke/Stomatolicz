import { Pressable } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../lib/ThemeContext';

export default function ThemeToggle() {
    const { name, colors, toggle } = useTheme();
    const Icon = name === 'dark' ? Sun : Moon;

    return (
        <Pressable onPress={toggle} hitSlop={12} accessibilityLabel="Zmień motyw">
            <Icon size={22} color={colors.accent} strokeWidth={2} />
        </Pressable>
    );
}