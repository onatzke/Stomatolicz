export type DialogButton = {
    label: string;
    onPress?: () => void;
    destructive?: boolean;
    cancel?: boolean;
};

export type DialogRequest = {
    title: string;
    message?: string;
    buttons: DialogButton[];
};

type Handler = (request: DialogRequest) => void;

// Natywny Alert nie zna motywu aplikacji, więc okna dialogowe rysujemy sami.
// Ten moduł celowo nie importuje niczego — dzięki temu może z niego korzystać
// także ThemeContext, bez cyklu importów przez DialogHost.
let handler: Handler | null = null;

export function setDialogHandler(next: Handler | null): void {
    handler = next;
}

export function showDialog(request: DialogRequest): void {
    handler?.(request);
}
