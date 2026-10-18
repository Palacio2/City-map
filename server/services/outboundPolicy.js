import { resolve4 } from 'node:dns/promises';
import { isIP } from 'node:net';

export function assertPropertyUrl(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        !['otodom.pl', 'www.otodom.pl'].includes(url.hostname)) {
        throw new Error('Only HTTPS Otodom property URLs are supported');
    }
    return url.href;
}

export function isPropertyUrl(value) {
    try { assertPropertyUrl(value); return true; } catch { return false; }
}

// IPv4-only egress deliberately avoids IPv6 transition/mapped-address bypasses.
export function isPublicIPv4(address) {
    if (isIP(address) !== 4) return false;
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && (b === 0 || b === 168 || (b === 88 && c === 99))) ||
        (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
        (a === 203 && b === 0 && c === 113));
}

export async function resolvePublicIPv4(hostname, resolve = resolve4) {
    if (typeof hostname !== 'string' || hostname.length > 253 || isIP(hostname) ||
        !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(hostname)) {
        throw new Error('Invalid outbound hostname');
    }
    let timer;
    try {
        const addresses = await Promise.race([
            resolve(hostname),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('DNS timeout')), 5000); }),
        ]);
        if (!Array.isArray(addresses) || !addresses.length || !addresses.every(isPublicIPv4)) {
            throw new Error('Outbound destination is not public IPv4');
        }
        return addresses[0];
    } finally { clearTimeout(timer); }
}
