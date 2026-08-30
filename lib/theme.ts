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
        minus: '#c8372d',
        danger: '#c8372d',
    },
    dark: {
        bg: 'rgba(30,20,35,0.79)',
        surface: '#3e2a47',
        border: '#31274a',
        text: '#e4ecf5',
        muted: '#9983ae',
        accent: '#a66eda',
        accentSoft: 'rgba(76,43,90,0.94)',
        highlight: '#43324a',
        minus: '#ef6b5e',
        danger: '#ef6b5e',
    },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const tabular = { fontVariant: ['tabular-nums' as const] };

