import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { DatabaseSync } from 'node:sqlite';
import { BufferJSON, WAProto } from 'baileys';
export async function cfaSqliteMigrator(location, databasePath) {
    const db = new DatabaseSync(databasePath);
    db.exec(`
        CREATE TABLE IF NOT EXISTS session (
            name TEXT NOT NULL,
            id TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (name, id)
        ) WITHOUT ROWID;
    `);
    db.exec('PRAGMA journal_mode = WAL;');
    const files = await readdir(location);
    const insertStmt = db.prepare('INSERT OR REPLACE INTO session (name, id, value) VALUES (?, ?, ?)');
    db.exec('BEGIN TRANSACTION');
    try {
        for (const file of files) {
            try {
                const filePath = join(location, file);
                const content = await readFile(filePath, 'utf-8');
                if (file === 'creds.json') {
                    const creds = JSON.parse(content, BufferJSON.reviver);
                    insertStmt.run('creds', 'default', JSON.stringify(creds, BufferJSON.replacer));
                }
                else {
                    const [type, ...idParts] = file.replace(/\.json$/, '').split('-');
                    if (!type || idParts.length === 0) {
                        console.warn(`Skipping invalid file: ${file}`);
                        continue;
                    }
                    const id = idParts.join('-');
                    let value = JSON.parse(content, BufferJSON.reviver);
                    if (type === 'app-state-sync-key' && value) {
                        value = WAProto.Message.AppStateSyncKeyData.fromObject(value);
                    }
                    insertStmt.run(type, id, JSON.stringify(value, BufferJSON.replacer));
                }
            }
            catch (error) {
                console.error(`Failed to process ${file}:`, error);
                throw error;
            }
        }
        db.exec('COMMIT');
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
    finally {
        db.close();
    }
    return;
}
