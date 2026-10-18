import http from 'node:http';
import net from 'node:net';
import { resolvePublicIPv4 } from './outboundPolicy.js';

// TLS remains end-to-end: CONNECT only, no interception of cookies or content.
export async function startScraperProxy({ resolve = resolvePublicIPv4, connect = net.connect } = {}) {
    const sockets = new Set();
    let closed = false;
    let closePromise;
    const track = socket => {
        sockets.add(socket);
        socket.on('error', () => socket.destroy());
        socket.once('close', () => sockets.delete(socket));
        socket.setTimeout(60000, () => socket.destroy());
        return socket;
    };
    const server = http.createServer((req, res) => {
        res.writeHead(403, { Connection: 'close' });
        res.end('HTTPS required');
    });
    server.maxConnections = 128;
    server.headersTimeout = 10000;
    server.on('connection', track);
    server.on('clientError', (_error, socket) => socket.destroy());
    server.on('upgrade', (_req, socket) => socket.destroy());
    server.on('connect', async (req, client, head) => {
        client.pause();
        try {
            const match = /^([a-z0-9.-]+):443$/i.exec(req.url || '');
            if (!match) throw new Error('Invalid CONNECT target');
            const address = await resolve(match[1]);
            if (closed || client.destroyed) return;
            // Pass a numeric address, never the hostname: no second DNS lookup.
            const upstream = track(connect({ host: address, port: 443, family: 4 }));
            const connectTimer = setTimeout(() => { upstream.destroy(); client.destroy(); }, 10000);
            upstream.once('close', () => { clearTimeout(connectTimer); client.destroy(); });
            client.once('close', () => { clearTimeout(connectTimer); upstream.destroy(); });
            upstream.once('connect', () => {
                clearTimeout(connectTimer);
                if (closed || client.destroyed) { upstream.destroy(); return; }
                client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                if (head.length) upstream.write(head);
                client.pipe(upstream);
                upstream.pipe(client);
                client.resume();
            });
        } catch {
            client.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
        }
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    return {
        url: `http://127.0.0.1:${server.address().port}`,
        async close() {
            if (closed) return closePromise;
            closed = true;
            for (const socket of sockets) socket.destroy();
            closePromise = new Promise(resolve => server.close(resolve));
            return closePromise;
        },
    };
}
