import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSetting, setSetting } from '../db/settings';
import { themes, type Colors, type ThemeName } from './theme';

type ThemeValue = {
    name: ThemeName;
    colors: Colors;
    ready: boolean;
    toggle: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [name, setName] = useState<ThemeName>('light');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        getSetting('theme')
            .then((stored) => {
                if (stored === 'dark' || stored === 'light') setName(stored);
            })
            .finally(() => setReady(true));
    }, []);

    const value = useMemo<ThemeValue>(
        () => ({
            name,
            colors: themes[name],
            ready,
            toggle: () => {
                const next: ThemeName = name === 'light' ? 'dark' : 'light';
                setName(next);
                setSetting('theme', next);
            },
        }),
        [name, ready],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
    const value = useContext(ThemeContext);
    if (!value) throw new Error('useTheme musi być wywołane wewnątrz ThemeProvider.');
    return value;
}