// Explicit opt-in: requires the installed Chromium binary, never starts parser jobs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { launchBrowser } from './browser.js';
import { protectScraperPage } from './scraperPagePolicy.js';

test('real Chromium routes loopback through the restrictive proxy and enforces page policy', { timeout: 30000 }, async t => {
    let hits = 0;
    const local = http.createServer((_req, res) => { hits++; res.end('must not be reached'); });
    await new Promise(resolve => local.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => local.close(resolve)));
    const browser = await launchBrowser();
    t.after(() => browser.close());
    assert.ok(!browser.process().spawnargs.includes('--no-sandbox'));
    const context = await browser.createBrowserContext();
    const otherContext = await browser.createBrowserContext();
    await context.setCookie({ name: 'isolation', value: 'first', domain: 'www.otodom.pl', path: '/' });
    assert.equal((await context.cookies()).some(cookie => cookie.name === 'isolation'), true);
    assert.equal((await otherContext.cookies()).some(cookie => cookie.name === 'isolation'), false);
    const page = await context.newPage();
    const localUrl = `http://127.0.0.1:${local.address().port}/`;
    // Test proxy enforcement without page interception masking a direct connection.
    const response = await page.goto(localUrl, { timeout: 5000 });
    assert.equal(response.status(), 403);
    assert.equal(hits, 0);
    await assert.rejects(page.goto('https://127.0.0.1/', { timeout: 5000 }));
    const remove = await protectScraperPage(page);
    await assert.rejects(page.goto(localUrl, { timeout: 5000 }), /ERR_BLOCKED_BY_CLIENT/);
    await assert.rejects(page.goto('https://example.com/', { timeout: 5000 }), /ERR_BLOCKED_BY_CLIENT/);
    assert.equal(hits, 0);
    await remove();
    await page.close();
    await context.close();
    await otherContext.close();
});
