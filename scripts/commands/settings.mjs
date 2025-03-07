import { editConfig, getConfig, Module } from '../../src/index.mjs';
Module({
    name: 'setprefix',
    fromMe: true,
    desc: 'Configure a custom prefix',
    type: 'settings',
    function: async (message, match) => {
        if (!match) {
            return message.send(`Usage: ${message.prefix}setprefix .,/*`);
        }
        editConfig({ prefix: Array.from(match) });
        return message.send('Prefix Updated');
    },
});
Module({
    name: 'setmode',
    fromMe: true,
    desc: 'Configure the bot to be public or private',
    type: 'settings',
    function: async (message, match) => {
        if (!match) {
            return message.send(`Usage: ${message.prefix}setmode private | public`);
        }
        if (match.includes('private')) {
            editConfig({ mode: true });
            return message.send('Bot is now private.');
        }
        else if (match.includes('public')) {
            editConfig({ mode: false });
            return message.send('Bot is now public.');
        }
        return message.send(`Usage: ${message.prefix}setmode private | public`);
    },
});
Module({
    name: 'setsudo',
    fromMe: true,
    desc: 'Sudo a number',
    type: 'settings',
    function: async (message, match) => {
        const jid = message.user(match);
        if (!jid)
            return message.send('tag, reply or provide the user number');
        const config = getConfig();
        if (config.sudo.includes(jid))
            return message.send('Already a sudo');
        const updatedSudos = [...config.sudo, jid];
        editConfig({ sudo: updatedSudos });
        return message.send(`@${jid.split('@')[0]} is now sudo`, { mentions: [jid] });
    },
});
Module({
    name: 'delsudo',
    fromMe: true,
    desc: 'Remove sudo from a number',
    type: 'settings',
    function: async (message, match) => {
        const jid = message.user(match);
        if (!jid)
            return message.send('tag, reply or provide the user number');
        const config = getConfig();
        if (!config.sudo.includes(jid))
            return message.send('User is not a sudo');
        const updatedSudos = config.sudo.filter((sudo) => sudo !== jid);
        editConfig({ sudo: updatedSudos });
        return message.send(`@${jid.split('@')[0]} is no longer sudo`, { mentions: [jid] });
    },
});
Module({
    name: 'getsudo',
    fromMe: true,
    desc: 'List all sudo users',
    type: 'settings',
    function: async (message) => {
        const config = getConfig();
        if (!config.sudo || config.sudo.length === 0) {
            return message.send('No sudo users found');
        }
        const sudoList = config.sudo.map((jid) => `@${jid.split('@')[0]}`).join('\n');
        return message.send(`Sudo users:\n${sudoList}`, { mentions: config.sudo });
    },
});
Module({
    name: 'ban',
    fromMe: true,
    desc: 'Ban a user from using commands',
    type: 'settings',
    function: async (message, match) => {
        const jid = message.user(match);
        if (!jid)
            return message.send('tag, reply or provide a number');
        const db = getConfig();
        if (db.sudo.includes(jid) || jid === message.owner)
            return message.send('You cannot ban a sudo user.');
        if (db.banned.includes(jid))
            return message.send('Already banned from using bot.');
        const users = new Set([...db.banned, jid]);
        editConfig({ banned: Array.from(users) });
        return message.send(`@${jid.split('@')[0]} has been banned from using bot commands, indefinetly`, {
            mentions: [jid],
        });
    },
});
Module({
    name: 'unban',
    fromMe: true,
    desc: 'Unban a user from using commands',
    type: 'settings',
    function: async (message, match) => {
        const jid = message.user(match);
        if (!jid)
            return message.send('tag, reply or provide a number');
        const db = getConfig();
        if (!db.banned.includes(jid))
            return message.send('User is not banned');
        const updatedBanned = db.banned.filter((bannedJid) => bannedJid !== jid);
        editConfig({ banned: updatedBanned });
        return message.send(`@${jid.split('@')[0]} has been unbanned and can now use bot commands`, {
            mentions: [jid],
        });
    },
});
Module({
    name: 'getban',
    fromMe: true,
    desc: 'List all banned users',
    type: 'settings',
    function: async (message) => {
        const db = getConfig();
        if (!db.banned || db.banned.length === 0) {
            return message.send('No banned users found');
        }
        const banList = db.banned.map((jid) => `@${jid.split('@')[0]}`).join('\n');
        return message.send(`Banned users:\n${banList}`, { mentions: db.banned });
    },
});
