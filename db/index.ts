import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { migrate } from './schema';

let instance: SQLiteDatabase | null = null;
let opening: Promise<SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLiteDatabase> {
    if (instance) return Promise.resolve(instance);
    if (!opening) {
        opening = (async () => {
            const db = await SQLite.openDatabaseAsync('stomatolicz.db');
            await migrate(db);
            instance = db;
            return db;
        })();
    }
    return opening;
}