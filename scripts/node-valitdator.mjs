import { delay } from 'baileys';
export async function checkNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    if (majorVersion !== 23) {
        console.error('Please use Node.js version 23 in order to use this software');
        await delay(60000);
        process.exit(1);
    }
}
