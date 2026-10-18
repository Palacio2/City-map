import fs from 'node:fs/promises';
import path from 'node:path';

// A file name, never a caller-supplied path (including Windows paths on Linux).
export function isPbfFileName(value) {
    return typeof value === 'string' && value.length <= 255 &&
        /^[\p{L}\p{N}][\p{L}\p{N} ._-]*\.pbf$/u.test(value) &&
        !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value);
}

export async function resolvePbfFile(dataDirectory, fileName) {
    if (!isPbfFileName(fileName)) throw new Error('Invalid PBF file name');
    const root = await fs.realpath(dataDirectory);
    const candidate = path.resolve(root, fileName);
    if (path.dirname(candidate) !== root) throw new Error('Invalid PBF file path');
    // The data directory must be writable only by the server/operator, not API users.
    const info = await fs.lstat(candidate);
    if (info.isSymbolicLink() || !info.isFile()) throw new Error('PBF must be a regular file');
    const resolved = await fs.realpath(candidate);
    if (path.dirname(resolved) !== root) throw new Error('PBF file is outside data directory');
    return resolved;
}

export async function listPbfFiles(dataDirectory) {
    await fs.mkdir(dataDirectory, { recursive: true });
    const entries = await fs.readdir(dataDirectory, { withFileTypes: true });
    return entries.filter(entry => entry.isFile() && !entry.isSymbolicLink() &&
        isPbfFileName(entry.name)).map(entry => entry.name).sort();
}
