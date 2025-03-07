import { Module } from '../../src/index.mjs';
import { voxnews, wabetanews, technews } from '../scraper.mjs';
Module({
    name: 'news',
    fromMe: false,
    desc: 'Get News from Vox',
    type: 'news',
    function: async (message) => {
        const news = await voxnews();
        if (!news)
            return message.send('No news avaliable');
        return await message.send(news);
    },
});
Module({
    name: 'wabeta',
    fromMe: false,
    desc: 'Get WABeta News',
    type: 'news',
    function: async (message) => {
        const wabetaInfo = await wabetanews();
        if (!wabetaInfo)
            return message.send('No WA updates avaliable');
        return await message.send(wabetaInfo);
    },
});
Module({
    name: 'technews',
    fromMe: false,
    desc: 'Get Tech News',
    type: 'news',
    function: async (message) => {
        const techInfo = await technews();
        if (!techInfo)
            return message.send('No tech news updates!');
        return await message.send(techInfo);
    },
});
