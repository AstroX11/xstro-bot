import { getDb } from './database.mjs';
function initMetadataDb() {
    const db = getDb();
    db.exec(`
    CREATE TABLE IF NOT EXISTS group_metadata (
      jid TEXT PRIMARY KEY,
      metadata JSON
    );
  `);
}
export const groupSave = (jid, metadata) => {
    const db = getDb();
    initMetadataDb();
    const jsonMetadata = JSON.stringify(metadata);
    const stmt = db.prepare(`
    INSERT INTO group_metadata (jid, metadata)
    VALUES (?, ?)
    ON CONFLICT(jid) DO UPDATE SET metadata = excluded.metadata;
  `);
    stmt.run(jid, jsonMetadata);
};
export const groupMetadata = (jid) => {
    const db = getDb();
    initMetadataDb();
    const stmt = db.prepare(`SELECT metadata FROM group_metadata WHERE jid = ?;`);
    const result = stmt.get(jid);
    return result && result.metadata ? JSON.parse(result.metadata) : undefined;
};
