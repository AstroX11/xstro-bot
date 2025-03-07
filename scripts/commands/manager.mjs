import { delAntilink, getAntilink, getAntiword, Module, setAntilink, setAntiword, } from '../../src/index.mjs';
Module({
    name: 'antilink',
    fromMe: false,
    isGroup: true,
    desc: 'Manage and Setup Antilink',
    type: 'group',
    function: async (message, match) => {
        const prefix = message.prefix;
        if (!match) {
            return message.send(`Usage:\n${prefix}antilink on\n${prefix}antilink off\n${prefix}antilink set kick\n${prefix}antilink set delete`);
        }
        const cmd = match.split(' ');
        const mode = cmd[0].toLowerCase();
        if (mode === 'on') {
            if (getAntilink(message.jid)?.status)
                return message.send('Antilink is already enabled');
            setAntilink(message.jid, true, 'delete');
            return message.send('Antilink is now enabled');
        }
        if (mode === 'off') {
            if (!getAntilink(message.jid)?.status)
                return message.send('Antilink is already disabled');
            delAntilink(message.jid);
            return message.send('Antilink is now disabled');
        }
        if (mode === 'set') {
            if (!getAntilink(message.jid))
                return message.send(`Antilink must be enabled first, use ${prefix}antilink on`);
            if (cmd[1] === 'kick') {
                setAntilink(message.jid, true, 'kick');
                return message.send('Antilink mode is now set to kick');
            }
            if (cmd[1] === 'delete') {
                setAntilink(message.jid, true, 'delete');
                return message.send('Antilink mode is now set to delete');
            }
        }
    },
});
Module({
    name: 'antiword',
    fromMe: false,
    isGroup: true,
    desc: 'Manage and Setup Antiword',
    type: 'group',
    function: async (message, match) => {
        const prefix = message.prefix;
        if (!match) {
            return message.send(`Usage:\n${prefix}antiword on\n${prefix}antiword off\n${prefix}antiword set badword1, badword2, badword3`);
        }
        const cmd = match.split(' ');
        const mode = cmd[0].toLowerCase();
        if (mode === 'on') {
            if (getAntiword(message.jid)?.status)
                return message.send('Antiword is already enabled');
            setAntiword(message.jid, 1, ['nobadwordshereuntiluserputsone']);
            return message.send('Antiword is now enabled');
        }
        if (mode === 'off') {
            if (!getAntiword(message.jid)?.status)
                return message.send('Antiword is already disabled');
            delAntilink(message.jid);
            return message.send('Antiword is now disabled');
        }
        if (mode === 'set') {
            if (!getAntiword(message.jid)?.status)
                return message.send(`Antiword must be enabled first, use ${prefix}antiword on`);
            if (!cmd[1])
                return message.send(`Usage:\n${prefix}antiword set badword1, badword2, badword3`);
            const m = setAntiword(message.jid, 1, cmd[1].split(','));
            return message.send(`Added ${m.added} badwords to list.`);
        }
    },
});
