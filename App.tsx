import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getDb } from './db';

type Row = { id: number; name: string; price_cents: number };

export default function App() {
  const [workplace, setWorkplace] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const wp = await db.getFirstAsync<{ name: string }>(
            'SELECT name FROM workplaces LIMIT 1',
        );
        const list = await db.getAllAsync<Row>(`
          SELECT p.id, p.name, wp.price_cents
          FROM workplace_procedures wp
          JOIN procedures p ON p.id = wp.procedure_id
          ORDER BY p.id
        `);
        setWorkplace(wp?.name ?? '(brak)');
        setRows(list);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, []);

  return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>{workplace}</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <ScrollView>
            {rows.map((r) => (
                <View key={r.id} style={styles.row}>
                  <Text style={styles.name}>{r.name}</Text>
                  <Text style={styles.price}>{r.price_cents}</Text>
                </View>
            ))}
          </ScrollView>
          <Text style={styles.footer}>Procedur: {rows.length}</Text>
        </SafeAreaView>
      </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', paddingVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  name: { fontSize: 15, flex: 1 },
  price: { fontSize: 15, color: '#888' },
  footer: { paddingVertical: 12, color: '#888' },
  error: { color: 'crimson', paddingVertical: 8 },
});