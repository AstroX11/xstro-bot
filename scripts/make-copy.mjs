import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { createReadStream, createWriteStream } from 'fs';
class FileTransferManager extends EventEmitter {
    currentPath;
    futurePath;
    activeTransfers;
    isPaused;
    chunkSize;
    constructor(current, future, chunkSize = 64 * 1024) {
        super();
        this.currentPath = path.resolve(current);
        this.futurePath = path.resolve(future);
        this.activeTransfers = new Map();
        this.isPaused = false;
        this.chunkSize = chunkSize;
        this.initializeDirectories().catch((err) => {
            this.emit('error', err);
        });
    }
    async initializeDirectories() {
        await Promise.all([
            fs.mkdir(this.currentPath, { recursive: true }),
            fs.mkdir(this.futurePath, { recursive: true }),
        ]);
    }
    async transferFile(fileName, options = {}) {
        const { overwrite = false, retryAttempts = 3, retryDelay = 1000 } = options;
        const sourcePath = path.join(this.currentPath, fileName);
        const destPath = path.join(this.futurePath, fileName);
        const transferId = `${fileName}-${Date.now()}`;
        const transferPromise = this.executeTransferWithRetry(sourcePath, destPath, transferId, {
            overwrite,
            retryAttempts,
            retryDelay,
        });
        this.activeTransfers.set(transferId, transferPromise);
        try {
            await transferPromise;
            this.emit('transferComplete', { fileName, sourcePath, destPath });
        }
        catch (error) {
            this.emit('error', error);
        }
        finally {
            this.activeTransfers.delete(transferId);
        }
    }
    async executeTransferWithRetry(sourcePath, destPath, transferId, options) {
        let attempts = 0;
        let stats;
        try {
            stats = await fs.stat(sourcePath);
        }
        catch (error) {
            throw new Error(`Source file not found: ${sourcePath}`);
        }
        if (!options.overwrite && (await this.fileExists(destPath))) {
            throw new Error(`Destination file already exists: ${destPath}`);
        }
        while (attempts < options.retryAttempts) {
            try {
                await this.streamFile(sourcePath, destPath, stats.size, transferId);
                return;
            }
            catch (error) {
                attempts++;
                if (attempts === options.retryAttempts) {
                    throw new Error(`Failed to transfer ${sourcePath} after ${attempts} attempts: ${error.message}`);
                }
                await new Promise((resolve) => setTimeout(resolve, options.retryDelay));
            }
        }
    }
    async streamFile(sourcePath, destPath, totalSize, transferId) {
        const readStream = createReadStream(sourcePath, { highWaterMark: this.chunkSize });
        const writeStream = createWriteStream(destPath);
        let transferred = 0;
        return new Promise((resolve, reject) => {
            readStream
                .on('data', (chunk) => {
                if (this.isPaused) {
                    readStream.pause();
                    return;
                }
                transferred += chunk.length;
                const progress = (transferred / totalSize) * 100;
                this.emit('progress', { transferId, progress, transferred, totalSize });
            })
                .on('error', reject)
                .pipe(writeStream)
                .on('error', reject)
                .on('finish', resolve);
        });
    }
    async transferMultiple(files, options = {}) {
        const { concurrency = 3, ...transferOptions } = options;
        const queue = [...files];
        const executeTransfer = async () => {
            while (queue.length > 0 && !this.isPaused) {
                const file = queue.shift();
                if (file) {
                    await this.transferFile(file, transferOptions);
                }
            }
        };
        await Promise.all(Array(Math.min(concurrency, files.length)).fill(null).map(executeTransfer));
    }
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    pause() {
        this.isPaused = true;
        this.emit('paused');
    }
    resume() {
        this.isPaused = false;
        this.emit('resumed');
    }
    async cancel() {
        this.isPaused = true;
        for (const [id, transfer] of this.activeTransfers) {
            this.emit('cancelled', { transferId: id });
        }
        this.activeTransfers.clear();
    }
    getStatus() {
        return {
            activeTransfers: this.activeTransfers.size,
            isPaused: this.isPaused,
            sourcePath: this.currentPath,
            destinationPath: this.futurePath,
        };
    }
}
export { FileTransferManager };
export default FileTransferManager;
