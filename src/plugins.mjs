import { Boom } from '@hapi/boom';
export const commands = [];
export function Module(cmd) {
    const fullCmd = {
        name: new RegExp(`^\\s*(${cmd.name})(?:\\s+([\\s\\S]+))?$`, 'i'),
        function: cmd.function,
        fromMe: cmd.fromMe || false,
        isGroup: cmd.isGroup || false,
        desc: cmd.desc,
        type: cmd.type,
        dontAddCommandList: cmd.dontAddCommandList || false,
    };
    commands.push(fullCmd);
    return fullCmd;
}
export async function runCommand(message) {
    if (!message.text)
        return;
    for (const cmd of commands) {
        const handler = message.prefix.find((p) => message?.text?.startsWith(p));
        const match = message.text.slice(handler?.length || 0).match(cmd.name);
        try {
            if (handler && match) {
                if (!message.sudo && (message.mode || cmd.fromMe))
                    return;
                if (cmd.isGroup && !message.isGroup)
                    return;
                const args = match[2] ?? '';
                await message.react('⏳');
                await cmd.function(message, args);
            }
        }
        catch (err) {
            const cmdName = cmd.name.toString().toLowerCase().split(/\W+/)[2];
            await message.send(`\`\`\`─━❲ ERROR REPORT ❳━─\n\nFrom: ${cmdName}\nDetails: ${err.message}\`\`\``, {
                jid: message.owner,
            });
            console.error(new Boom(err));
        }
    }
}
