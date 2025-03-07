import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as P from 'node:path';
import { fetchJson } from '../src/index.mjs';
export async function fetchSessionfromServer(url, opts) {
    const data = await fetchJson(url);
    if (!data)
        return undefined;
    const sessionInfo = JSON.parse(data);
    const value = JSON.parse(sessionInfo.data);
    if (opts?.decode) {
        return decryptSession(value, opts.folder ?? 'session');
    }
    return data;
}
function decryptSession(source, savefile) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(source.key, 'hex');
    console.log(key);
    const iv = Buffer.from(source.iv, 'hex');
    console.log(iv);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    console.log(decipher);
    let decrypted;
    decrypted = decipher.update(source.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    let data;
    data = JSON.parse(decrypted);
    console.log(data);
    fs.mkdirSync(savefile, { recursive: true });
    if (data.creds) {
        fs.writeFileSync(P.join(savefile, 'creds.json'), JSON.stringify(data.creds));
    }
    if (data.syncKey && data.creds?.myAppStateKeyId) {
        fs.writeFileSync(P.join(savefile, `app-state-sync-key-${data.creds.myAppStateKeyId}.json`), JSON.stringify(data.syncKey));
    }
    return data;
}
