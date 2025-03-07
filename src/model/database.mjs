import { DatabaseSync } from 'node:sqlite';
let database = null;
export const getDb = () => {
    if (!database) {
        database = new DatabaseSync('database.db', {
            enableForeignKeyConstraints: true,
            open: true,
        });
    }
    return database;
};
