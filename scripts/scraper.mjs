import * as cheerio from 'cheerio';
import { Boom } from '@hapi/boom';
import { fetchJson } from '../src/index.mjs';
export async function voxnews() {
    try {
        const html = await fetchJson('https://www.vox.com/');
        const $ = cheerio.load(html);
        const newsItems = [];
        const seenTitles = new Set();
        const seenUrls = new Set();
        $('a.qcd9z1.hd0te9s').each((i, element) => {
            const $element = $(element);
            const title = $element.text().trim();
            const url = $element.attr('href');
            const absoluteUrl = url ? (url.startsWith('http') ? url : `https://www.vox.com${url}`) : '';
            if (title && absoluteUrl && !seenTitles.has(title) && !seenUrls.has(absoluteUrl)) {
                newsItems.push({ title, url: absoluteUrl });
                seenTitles.add(title);
                seenUrls.add(absoluteUrl);
            }
        });
        return newsItems.map((data) => `${data.title}\n${data.url}\n`).join('\n');
    }
    catch (error) {
        throw new Boom(error);
    }
}
export const wabetanews = async () => {
    try {
        const html = await fetchJson('https://wabetainfo.com/');
        const $ = cheerio.load(html);
        const articles = [];
        $('h2.entry-title.mb-half-gutter.last\\:mb-0').each((i, element) => {
            const $element = $(element);
            const title = $element.find('a.link').text().trim();
            const link = $element.find('a.link').attr('href') || '';
            const description = $element
                .parent()
                .find('div.entry-excerpt.mb-gutter.last\\:mb-0')
                .text()
                .trim();
            articles.push({
                title,
                description,
                link,
            });
        });
        return articles
            .map((data) => `${data.title}\n\n${data.description}\n\n${data.link}\n\n`)
            .join('\n');
    }
    catch (error) {
        throw new Boom(error);
    }
};
export const technews = async () => {
    try {
        const html = await fetchJson('https://gizmodo.com/tech');
        const $ = cheerio.load(html);
        const newsItems = [];
        $('a.block').each((index, element) => {
            const $article = $(element);
            const title = $article.find('h2.font-bold').text().trim();
            const description = $article.find('p.font-serif').text().trim();
            const postLink = $article.attr('href') || '';
            const newsItem = {
                title,
                description,
                postLink,
            };
            if (title && description && postLink) {
                newsItems.push(newsItem);
            }
        });
        return newsItems
            .map((posts) => `${posts.title}\n${posts.description}\n${posts.postLink}\n`)
            .join('\n');
    }
    catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
    }
};
