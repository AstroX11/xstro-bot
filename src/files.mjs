import { pathToFileURL, fileURLToPath } from 'url';
import { join, extname, dirname } from 'path';
import { readdir } from 'fs/promises';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function loadPlugins() {
    const pluginsDir = join(__dirname, '../scripts/commands');
    const files = await readdir(pluginsDir, { withFileTypes: true });
    await Promise.all(files.map(async (file) => {
        const fullPath = join(pluginsDir, file.name);
        if (extname(file.name) === '.mjs') {
            try {
                const fileUrl = pathToFileURL(fullPath).href;
                await import(fileUrl);
            }
            catch (err) {
                console.log('ERROR', `${file.name}: ${err.message}`);
            }
        }
    }));
    console.log('Plugins Synced');
}
