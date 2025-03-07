import { getDb } from './database.mjs';
function Antilink() {
    const db = getDb();
    db.exec(`CREATE TABLE IF NOT EXISTS antilink (
        id TEXT PRIMARY KEY,
        mode TEXT CHECK(mode IN ('kick', 'delete') OR mode IS NULL),
        status INTEGER NOT NULL DEFAULT 0
    )`);
}
function Antiword() {
    const db = getDb();
    db.exec(`
        CREATE TABLE IF NOT EXISTS antiword (
            id TEXT PRIMARY KEY,
            status INTEGER CHECK (status IN (0, 1)),
            words TEXT
        )
    `);
}
export function setAntilink(id, status, mode) {
    Antilink();
    const db = getDb();
    const stmt = db.prepare(`INSERT OR REPLACE INTO antilink (id, mode, status) VALUES (?, ?, ?)`);
    stmt.run(id, mode ?? null, status ? 1 : 0);
    return true;
}
export function getAntilink(id) {
    Antilink();
    const db = getDb();
    const stmt = db.prepare(`SELECT mode, status FROM antilink WHERE id = ?`);
    const result = stmt.get(id);
    return result ? { mode: result.mode, status: !!result.status } : null;
}
export function delAntilink(id) {
    Antilink();
    const db = getDb();
    const stmt = db.prepare(`DELETE FROM antilink WHERE id = ?`);
    const result = stmt.run(id);
    return (result.changes ?? 0) > 0;
}
export function setAntiword(id, status, words) {
    Antiword();
    const db = getDb();
    const stmtGet = db.prepare('SELECT words FROM antiword WHERE id = ?');
    const existing = stmtGet.get(id);
    const existingWords = existing?.words ? JSON.parse(existing.words) : [];
    const uniqueWords = [...new Set([...existingWords, ...words])];
    const added = uniqueWords.length - existingWords.length;
    const stmtRun = db.prepare('INSERT OR REPLACE INTO antiword (id, status, words) VALUES (?, ?, ?)');
    stmtRun.run(id, status, JSON.stringify(uniqueWords));
    return { success: true, added };
}
export function delAntiword(id) {
    Antiword();
    const db = getDb();
    const stmt = db.prepare('DELETE FROM antiword WHERE id = ?');
    const result = stmt.run(id);
    return (result.changes ?? 0) > 0;
}
export function getAntiword(id) {
    Antiword();
    const db = getDb();
    const stmt = db.prepare('SELECT status, words FROM antiword WHERE id = ?');
    const result = stmt.get(id);
    if (!result)
        return null;
    return { status: Boolean(result.status), words: JSON.parse(result.words) };
}
