import { isMediaMessage, Module } from '../../src/index.mjs';
Module({
    name: 'bio',
    fromMe: true,
    desc: 'Change your WA Bio',
    type: 'whatsapp',
    function: async (message, match) => {
        if (!match) {
            return message.send('Give me your new bio!');
        }
        await message.updateProfileStatus(match);
        return message.send('Bio Updated');
    },
});
Module({
    name: 'waname',
    fromMe: true,
    desc: 'Change your WA Profile Name',
    type: 'whatsapp',
    function: async (message, match) => {
        if (!match) {
            return message.send('Provide a new Profile Name');
        }
        await message.updateProfileName(match);
        return message.send('Profile Name Updated');
    },
});
Module({
    name: 'block',
    fromMe: true,
    desc: 'Block a user from Messaging you',
    type: 'whatsapp',
    function: async (message, match) => {
        const jid = message.user(match);
        if (!jid)
            return message.send('Provide someone to block!');
        if (!(await message.onWhatsApp(jid)))
            return message.send('Not A WhatsApp User');
        await message.send('Blocked!');
        return message.updateBlockStatus(jid, 'block');
    },
});
Module({
    name: 'unblock',
    fromMe: true,
    desc: 'Unblock a user to allow Messaging',
    type: 'whatsapp',
    function: async (message, match) => {
        const jid = message.user(match);
        if (!jid)
            return message.send('Provide someone to unblock!');
        await message.send('Unblocked!');
        return message.updateBlockStatus(jid, 'unblock');
    },
});
Module({
    name: 'pp',
    fromMe: true,
    desc: 'Update Your Profile Image',
    type: 'whatsapp',
    function: async (message) => {
        if (!message.quoted) {
            return message.send('Reply an Image');
        }
        if (!message.quoted.message.imageMessage) {
            return message.send('Reply an Image');
        }
        const media = await message.downloadM(message.quoted);
        if (!media)
            return message.send('Failed to Process Image!');
        await message.updateProfilePicture(message.owner, media);
        return message.send('Profile Picture Updated!');
    },
});
Module({
    name: 'vv',
    fromMe: true,
    desc: 'Forwards a viewonce message',
    type: 'whatsapp',
    function: async (message) => {
        if (!message.quoted ||
            (!message.quoted.message.imageMessage?.viewOnce &&
                !message.quoted.message.videoMessage?.viewOnce &&
                !message.quoted.message.audioMessage?.viewOnce)) {
            return message.send('Reply a viewonce message');
        }
        const msgTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
        const quotedMsg = message.quoted.message;
        for (const type of msgTypes) {
            if (quotedMsg[type]?.viewOnce) {
                quotedMsg[type].viewOnce = false;
                await message.forward(message.owner, message.quoted, {
                    quoted: message.quoted,
                });
                break;
            }
        }
        return message.send('View once message forwarded!');
    },
});
Module({
    name: 'tovv',
    fromMe: true,
    desc: 'Converts a message to viewonce',
    type: 'whatsapp',
    function: async (message) => {
        if (!message.quoted ||
            (!message.quoted.message.imageMessage &&
                !message.quoted.message.videoMessage &&
                !message.quoted.message.audioMessage)) {
            return message.send('Reply to an image, video, or audio message');
        }
        const msgTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
        const quotedMsg = message.quoted.message;
        for (const type of msgTypes) {
            if (quotedMsg[type]) {
                quotedMsg[type].viewOnce = true;
                await message.forward(message.owner, message.quoted, {
                    quoted: message.quoted,
                });
                break;
            }
        }
        return message.send('Message converted to view-once');
    },
});
Module({
    name: 'edit',
    fromMe: true,
    desc: 'Edit your own message',
    type: 'whatsapp',
    function: async (message, match) => {
        if (!message.quoted) {
            return message.send('Reply a message from you.');
        }
        if (!message.quoted.key.fromMe) {
            return message.send('That Message is not fromMe');
        }
        if (!match) {
            return message.send(`Usage: ${message.prefix}edit hello there`);
        }
        return message.edit(match);
    },
});
Module({
    name: 'dlt',
    fromMe: false,
    desc: 'Delete a message for ourselves and from other participants if the bot is an admin',
    type: 'whatsapp',
    function: async (message) => {
        if (!message.quoted) {
            return message.send('Reply a message');
        }
        const quoted = message.quoted;
        const notfromMe = {
            deleteMedia: isMediaMessage(quoted),
            key: quoted.key,
            timestamp: Date.now(),
        };
        const fromMe = message.isGroup
            ? (await message.isBotAdmin()) || quoted.key.fromMe === true
            : quoted.key.fromMe;
        if (fromMe) {
            await message.delete(quoted);
        }
        else {
            await message.chatModify({ deleteForMe: notfromMe }, message.jid);
        }
    },
});
