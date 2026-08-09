import puppeteerCore from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PARSER_CONFIG } from '../config/parserConfig.js';

const puppeteer = addExtra(puppeteerCore);
puppeteer.use(StealthPlugin());

export async function launchBrowser() {
    return await puppeteer.launch({
        headless: "new", // Виправлено згідно з попередженням у логах
        protocolTimeout: PARSER_CONFIG.TIMEOUTS.PROTOCOL || 240000,
        timeout: 120000, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--single-process',
            '--no-zygote',
            '--disable-http2',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-ipc-flooding-protection',
            `--window-size=${PARSER_CONFIG.BROWSER.WINDOW_WIDTH},${PARSER_CONFIG.BROWSER.WINDOW_HEIGHT}`,
            `--js-flags="--max-old-space-size=${PARSER_CONFIG.BROWSER.RAM_LIMIT_MB}"`
        ]
    });
}