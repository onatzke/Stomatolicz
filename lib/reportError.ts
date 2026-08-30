import { showDialog } from './dialog';

export function reportError(error: unknown): void {
    console.error(error);
    showDialog({
        title: 'Coś poszło nie tak',
        message: 'Nie udało się odczytać lub zapisać danych. Spróbuj ponownie.',
        buttons: [{ label: 'OK', cancel: true }],
    });
}
