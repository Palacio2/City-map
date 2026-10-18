import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import net from 'node:net';
import { assertPropertyUrl, isPublicIPv4, resolvePublicIPv4 } from './outboundPolicy.js';
import { assertParserApiUrl } from './parserHttp.js';
import { startScraperProxy } from './scraperProxy.js';
import { protectScraperPage } from './scraperPagePolicy.js';
import { RunParserSchema } from '../schemas/parserSchema.js';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

test('property URLs reject host confusion, local IPs, protocols, credentials and ports', () => {
    for (const url of ['http://otodom.pl/', 'https://otodom.pl.evil.test/', 'https://evil.test/?otodom.pl',
        'https://otodom.pl@localhost/', 'https://user:pass@otodom.pl/', 'https://otodom.pl:444/',
        'file:///etc/passwd', 'https://127.1/', 'https://2130706433/', 'https://[::1]/', 'https://otodom.pl./']) {
        assert.throws(() => assertPropertyUrl(url), undefined, url);
        assert.equal(RunParserSchema.safeParse({ cityName: 'Warsaw', propertyUrls: { id: url } }).success, false);
    }
    assert.equal(assertPropertyUrl('https://www.otodom.pl/pl/wyniki?x=1'), 'https://www.otodom.pl/pl/wyniki?x=1');
});

test('outbound DNS fails closed for private, mixed, reserved and IPv6 answers', async () => {
    for (const address of ['0.0.0.0', '10.1.2.3', '100.64.0.1', '127.0.0.1', '169.254.169.254',
        '172.16.1.1', '192.168.1.1', '192.0.2.1', '198.18.0.1', '198.51.100.1', '203.0.113.1',
        '224.0.0.1', '255.255.255.255', '::1', '::ffff:127.0.0.1']) {
        assert.equal(isPublicIPv4(address), false, address);
        await assert.rejects(resolvePublicIPv4('www.otodom.pl', async () => ['8.8.8.8', address]));
    }
    assert.equal(await resolvePublicIPv4('www.otodom.pl', async () => ['8.8.8.8']), '8.8.8.8');
    await assert.rejects(resolvePublicIPv4('www.otodom.pl', async () => []));
    await assert.rejects(resolvePublicIPv4('www.otodom.pl', async () => { throw new Error('DNS unavailable'); }));
    await assert.rejects(resolvePublicIPv4('127.0.0.1', () => assert.fail('must not resolve')));
});

test('fixed parser APIs reject arbitrary hosts and non-HTTPS URLs', () => {
    for (const url of ['https://evil.test/', 'https://api.waqi.info@127.0.0.1/', 'http://bdl.stat.gov.pl/',
        'https://overpass-api.de:8443/', 'https://api.waqi.info.evil.test/']) {
        assert.throws(() => assertParserApiUrl(url));
    }
    assert.equal(assertParserApiUrl('https://overpass-api.de/api/interpreter'), 'https://overpass-api.de/api/interpreter');
});

test('API transport disables redirects/proxy environment and installs validated socket lookup', async () => {
    const result = await build({ entryPoints: [fileURLToPath(new URL('./parserHttp.js', import.meta.url))],
        bundle: true, write: false, format: 'esm', platform: 'node', plugins: [{ name: 'fake-http', setup(b) {
            b.onResolve({ filter: /^axios$/ }, () => ({ path: 'axios', namespace: 'fake' }));
            b.onLoad({ filter: /.*/, namespace: 'fake' }, () => ({ contents: `export default {create(options) {
                return {get(url) { return {url, options}; }, post(url) { return {url, options}; }};
            }};` }));
        } }] });
    const { parserHttp } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
    for (const method of ['get', 'post']) {
        assert.throws(() => parserHttp[method]('https://localhost/'));
        const { options } = parserHttp[method]('https://api.waqi.info/');
        assert.equal(options.proxy, false);
        assert.equal(options.maxRedirects, 0);
        assert.equal(typeof options.httpsAgent.options.lookup, 'function');
        assert.ok(options.timeout > 0 && options.maxContentLength > 0);
        options.httpsAgent.destroy();
    }
});

test('page policy blocks external redirects and non-HTTPS resources, and removes its listener', async () => {
    const page = new EventEmitter();
    const setup = [];
    page.setBypassServiceWorker = async value => setup.push(['worker', value]);
    page.setRequestInterception = async value => setup.push(['interception', value]);
    const cleanup = await protectScraperPage(page);
    assert.deepEqual(setup, [['worker', true], ['interception', true]]);
    for (const [url, navigation, expected] of [
        ['https://www.otodom.pl/rent', true, 'allow'], ['https://evil.test/redirect', true, 'deny'],
        ['http://169.254.169.254/', false, 'deny'], ['file:///secret', false, 'deny'],
        ['https://cdn.example.com/app.js', false, 'allow'],
    ]) {
        let decision;
        page.emit('request', { isInterceptResolutionHandled: () => false, url: () => url,
            isNavigationRequest: () => navigation,
            continue: async () => { decision = 'allow'; }, abort: async () => { decision = 'deny'; } });
        assert.equal(decision, expected);
    }
    await cleanup();
    assert.deepEqual(setup.at(-1), ['interception', false]);
    assert.equal(page.listenerCount('request'), 0);
});

async function requestProxy(proxy, request) {
    const { hostname, port } = new URL(proxy.url);
    return new Promise((resolve, reject) => {
        const socket = net.connect({ host: hostname, port: Number(port) }, () => socket.write(request));
        socket.setTimeout(2000, () => socket.destroy(new Error('fixture timeout')));
        socket.on('error', reject);
        socket.once('data', data => { socket.destroy(); resolve(data.toString()); });
    });
}

test('real proxy socket rejects HTTP, bad ports, credentials and blocked DNS without connecting', async t => {
    const proxy = await startScraperProxy({ resolve: async () => { throw new Error('blocked DNS'); },
        connect: () => assert.fail('forbidden outbound connection') });
    t.after(() => proxy.close());
    for (const request of ['GET http://localhost/ HTTP/1.1\r\nHost: localhost\r\n\r\n',
        ...['localhost:80', 'user@www.otodom.pl:443', '[::1]:443', 'www.otodom.pl:443'].map(target =>
            `CONNECT ${target} HTTP/1.1\r\nHost: ${target}\r\n\r\n`)]) {
        assert.match(await requestProxy(proxy, request), /403/);
    }
});

test('proxy pins DNS result to socket and closes tunnel resources', async t => {
    const target = net.createServer(socket => socket.end('fixture'));
    await new Promise(resolve => target.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => target.close(resolve)));
    let options;
    const proxy = await startScraperProxy({ resolve: async () => '8.8.8.8', connect: received => {
        options = received;
        // Only this test adapter routes the validated address to a local fixture.
        return net.connect({ host: '127.0.0.1', port: target.address().port });
    } });
    t.after(() => proxy.close());
    assert.match(await requestProxy(proxy, 'CONNECT www.otodom.pl:443 HTTP/1.1\r\nHost: www.otodom.pl\r\n\r\n'), /200 Connection Established/);
    assert.deepEqual(options, { host: '8.8.8.8', port: 443, family: 4 });
    await proxy.close();
    await proxy.close();
});
