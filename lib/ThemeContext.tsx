import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getSetting, setSetting } from '../db/settings';
import { reportError } from './reportError';
import { themes, type Colors, type ThemeName } from './theme';

type ThemeValue = {
    name: ThemeName;
    colors: Colors;
    ready: boolean;
    toggle: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Motyw systemowy to wstępny strzał, żeby nie mignąć jasnym tłem,
    // zanim z bazy wczyta się wybór użytkownika.
    const system = useColorScheme();
    const [name, setName] = useState<ThemeName>(system === 'dark' ? 'dark' : 'light');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        getSetting('theme')
            .then((stored) => {
                if (stored === 'dark' || stored === 'light') setName(stored);
            })
            .catch(reportError)
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
                setSetting('theme', next).catch(reportError);
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