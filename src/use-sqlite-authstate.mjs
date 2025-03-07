import { initAuthCreds, BufferJSON, WAProto } from 'baileys';
export const useSqliteAuthState = (database, config = {}) => {
    database.exec(`
        CREATE TABLE IF NOT EXISTS session (
            name TEXT NOT NULL,  -- 'creds' or key type (e.g., 'app-state-sync-key')
            id TEXT NOT NULL,    -- Unique identifier for the data (e.g., key ID or 'default' for creds)
            value TEXT NOT NULL, -- JSON-encoded data
            PRIMARY KEY (name, id)
        ) WITHOUT ROWID;
    `);
    if (config.enableWAL ?? true) {
        database.exec('PRAGMA journal_mode = WAL;');
    }
    let creds;
    const credsStmt = database.prepare('SELECT value FROM session WHERE name = ? AND id = ?');
    const credsRow = credsStmt.get('creds', 'default');
    if (credsRow) {
        creds = JSON.parse(credsRow.value, BufferJSON.reviver);
    }
    else {
        creds = initAuthCreds();
        const insertCreds = database.prepare('INSERT INTO session (name, id, value) VALUES (?, ?, ?)');
        insertCreds.run('creds', 'default', JSON.stringify(creds, BufferJSON.replacer));
    }
    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const data = {};
                    const stmt = database.prepare(`SELECT id, value FROM session 
                         WHERE name = ? AND id IN (${ids.map(() => '?').join(',')})`);
                    const rows = stmt.all(type, ...ids);
                    for (const row of rows) {
                        let value = JSON.parse(row.value, BufferJSON.reviver);
                        if (type === 'app-state-sync-key' && value) {
                            value = WAProto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[row.id] = value;
                    }
                    return data;
                },
                set: (data) => {
                    database.exec('BEGIN TRANSACTION');
                    try {
                        const insertStmt = database.prepare('INSERT OR REPLACE INTO session (name, id, value) VALUES (?, ?, ?)');
                        const deleteStmt = database.prepare('DELETE FROM session WHERE name = ? AND id = ?');
                        for (const category of Object.keys(data)) {
                            for (const id of Object.keys(data[category])) {
                                const value = data[category][id];
                                if (value) {
                                    insertStmt.run(category, id, JSON.stringify(value, BufferJSON.replacer));
                                }
                                else {
                                    deleteStmt.run(category, id);
                                }
                            }
                        }
                        database.exec('COMMIT');
                    }
                    catch (error) {
                        database.exec('ROLLBACK');
                        throw error;
                    }
                },
            },
        },
        saveCreds: () => {
            const stmt = database.prepare('INSERT OR REPLACE INTO session (name, id, value) VALUES (?, ?, ?)');
            stmt.run('creds', 'default', JSON.stringify(creds, BufferJSON.replacer));
        },
    };
};
