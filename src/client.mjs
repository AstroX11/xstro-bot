import { Boom } from '@hapi/boom';
import { makeWASocket, makeCacheableSignalKeyStore, DisconnectReason, Browsers } from 'baileys';
import { EventEmitter } from 'events';
import { DatabaseSync } from 'node:sqlite';
import * as P from 'pino';
import * as CacheStore from './store.mjs';
import { useSqliteAuthState } from './use-sqlite-authstate.mjs';
import { XMsg } from './message.mjs';
import { groupMetadata, Store, saveContact, upsertM, groupSave } from './model/index.mjs';
import { upsertsM } from './upserts.mjs';
import { runCommand } from './plugins.mjs';
EventEmitter.defaultMaxListeners = 10000;
process.setMaxListeners(10000);
export const logger = P.pino({
    level: process.env.DEBUG ? 'info' : 'silent',
});
export const client = async (database) => {
    Store();
    const { state, saveCreds } = useSqliteAuthState(new DatabaseSync(database ? database : 'database.db'), {
        enableWAL: true,
    });
    const conn = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger, new CacheStore.default()),
        },
        printQRInTerminal: true,
        logger,
        browser: Browsers.macOS('Desktop'),
        emitOwnEvents: true,
        cachedGroupMetadata: async (jid) => groupMetadata(jid),
    });
    conn.ev.process(async (events) => {
        const event = events;
        if (event['connection.update']) {
            const { connection, lastDisconnect } = event['connection.update'];
            if (connection === 'connecting') {
                console.log('connecting...');
            }
            if (connection === 'close')
                lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut
                    ? process.exit(1)
                    : client(database);
            if (connection === 'open') {
                await conn.sendMessage(conn?.user?.id, { text: '```Bot is online now!```' });
                console.log(`Connected!`);
            }
        }
        if (event['creds.update'])
            saveCreds();
        if (event['messages.upsert']) {
            const { messages, type, requestId } = event['messages.upsert'];
            upsertM({ messages, type, requestId });
            if (type === 'notify') {
                for (const upserts of messages) {
                    const msg = await XMsg(conn, upserts);
                    Promise.all([runCommand(msg), upsertsM(msg)]);
                }
            }
        }
        if (event['contacts.update']) {
            const update = event['contacts.update'];
            if (update) {
                saveContact(update);
            }
        }
    });
    setInterval(async () => {
        try {
            if (!conn.authState?.creds?.registered)
                return;
            const groups = await conn.groupFetchAllParticipating();
            for (const [id, metadata] of Object.entries(groups))
                groupSave(id, metadata);
        }
        catch (error) {
            throw new Boom(error.message);
        }
    }, 300 * 1000);
    conn.ev.flush();
    return conn;
};
