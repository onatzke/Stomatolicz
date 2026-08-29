import { Alert } from 'react-native';

export function confirmDelete(
    message: string,
    onConfirm: () => void,
    confirmLabel = 'Usuń',
): void {
    Alert.alert('Na pewno?', message, [
        { text: 'Anuluj', style: 'cancel' },
        { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
}