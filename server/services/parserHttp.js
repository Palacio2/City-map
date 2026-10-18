import https from 'node:https';
import axios from 'axios';
import { resolvePublicIPv4 } from './outboundPolicy.js';

const hosts = new Set([
    'api.waqi.info', 'bdl.stat.gov.pl', 'overpass-api.de',
    'lz4.overpass-api.de', 'z.overpass-api.de', 'overpass.kumi.systems',
]);

export function publicLookup(hostname, options, callback) {
    resolvePublicIPv4(hostname).then(address => {
        if (options?.all) callback(null, [{ address, family: 4 }]);
        else callback(null, address, 4);
    }, callback);
}

export function assertParserApiUrl(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.has(url.hostname)) {
        throw new Error('Unsupported parser API destination');
    }
    return url.href;
}

const client = axios.create({
    proxy: false,
    maxRedirects: 0,
    timeout: 15000,
    maxContentLength: 16 * 1024 * 1024,
    httpsAgent: new https.Agent({ lookup: publicLookup, maxSockets: 16 }),
});

export const parserHttp = {
    get: (url, options) => client.get(assertParserApiUrl(url), options),
    post: (url, data, options) => client.post(assertParserApiUrl(url), data, options),
};
