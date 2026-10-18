import puppeteer from 'puppeteer';
import { PARSER_CONFIG } from '../config/parserConfig.js';
import { startScraperProxy } from './scraperProxy.js';

export async function launchBrowser() {
    const proxy = await startScraperProxy();
    try {
        const browser = await puppeteer.launch({
            executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
            headless: true,
            protocolTimeout: PARSER_CONFIG.TIMEOUTS.PROTOCOL || 240000,
            timeout: 120000,
            args: [
                `--proxy-server=${proxy.url}`,
                '--proxy-bypass-list=<-loopback>',
                '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
                '--disable-quic',
                '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--disable-http2',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                `--window-size=${PARSER_CONFIG.BROWSER.WINDOW_WIDTH},${PARSER_CONFIG.BROWSER.WINDOW_HEIGHT}`,
                `--js-flags="--max-old-space-size=${PARSER_CONFIG.BROWSER.RAM_LIMIT_MB}"`
            ]
        });
        const close = browser.close.bind(browser);
        browser.close = async () => { try { await close(); } finally { await proxy.close(); } };
        browser.once('disconnected', () => { void proxy.close(); });
        return browser;
    } catch (error) {
        await proxy.close();
        throw error;
    }
}
