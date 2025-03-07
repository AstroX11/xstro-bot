import { getDb } from './database.mjs';
function initSessionDb() {
    const db = getDb();
    db.exec(`
        CREATE TABLE IF NOT EXISTS session_id (
            id TEXT PRIMARY KEY
        )
    `);
}
export const getSessionId = () => {
    const db = getDb();
    initSessionDb();
    const stmt = db.prepare('SELECT id FROM session_id LIMIT 1');
    const row = stmt.get();
    return row ? row.id : null;
};
export const setSessionId = (id) => {
    const db = getDb();
    initSessionDb();
    const stmtDelete = db.prepare('DELETE FROM session_id');
    stmtDelete.run();
    const stmtInsert = db.prepare('INSERT INTO session_id (id) VALUES (?)');
    stmtInsert.run(id);
};
