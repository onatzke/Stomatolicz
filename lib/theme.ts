export type ThemeName = 'light' | 'dark';

export type Colors = {
    bg: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    accentSoft: string;
    minus: string;
    danger: string;
};

export const themes: Record<ThemeName, Colors> = {
    light: {
        bg: '#ffffff',
        surface: '#f1f5fa',
        border: '#dde5ee',
        text: '#0f1b2a',
        muted: '#667a91',
        accent: '#15568c',
        accentSoft: '#d8e8f7',
        minus: '#c8372d',
        danger: '#c8372d',
    },
    dark: {
        bg: '#111c2a',
        surface: '#1a2736',
        border: '#27374a',
        text: '#e4ecf5',
        muted: '#8397ae',
        accent: '#6fb4e8',
        accentSoft: '#1d3346',
        minus: '#ef6b5e',
        danger: '#ef6b5e',
    },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const tabular = { fontVariant: ['tabular-nums' as const] };

