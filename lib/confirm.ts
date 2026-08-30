import { showDialog } from './dialog';

export function confirmDelete(
    message: string,
    onConfirm: () => void,
    confirmLabel = 'Usuń',
): void {
    showDialog({
        title: 'Na pewno?',
        message,
        buttons: [
            { label: confirmLabel, destructive: true, onPress: onConfirm },
            { label: 'Anuluj', cancel: true },
        ],
    });
}
