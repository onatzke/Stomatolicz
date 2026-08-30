export type ThemeName = 'light' | 'dark';

export type Colors = {
    bg: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    accentSoft: string;
    highlight: string;
    overlay: string;
    minus: string;
    danger: string;
};

export const themes: Record<ThemeName, Colors> = {
    light: {
        bg: '#ffffff',
        surface: '#f1f5fa',
        border: '#dde5ee',
        text: '#0f1b2a',
        muted: '#856691',
        accent: '#773fbc',
        accentSoft: '#ecd8f7',
        highlight: '#eee4f5',
        overlay: 'rgba(241,245,250,0.93)',
        minus: '#c82d80',
        danger: '#bf2c7b',
    },
    dark: {
        bg: '#1e1423',
        surface: '#3e2a47',
        border: '#31274a',
        text: '#e4ecf5',
        muted: '#9983ae',
        accent: '#a66eda',
        accentSoft: 'rgba(76,43,90,0.94)',
        highlight: '#43324a',
        overlay: 'rgba(62,42,71,0.93)',
        minus: '#8f0f53',
        danger: '#aa1a5b',
    },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const tabular = { fontVariant: ['tabular-nums' as const] };

