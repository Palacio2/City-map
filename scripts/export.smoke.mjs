// Requires server's installed Chromium; no application server, accounts or network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

// Run npm run build first: this exercises the actual generated application CSS.
const root = new URL('../', import.meta.url);
const builtHtml = await readFile(new URL('dist/index.html', root), 'utf8');
const cssPaths = [...builtHtml.matchAll(/href="(\/assets\/[^" ]+\.css)"/g)].map(match => match[1]);
assert.ok(cssPaths.length, 'Build the frontend before running the export/style smoke test');
// External font imports are excluded: this offline test checks layout/colors, not font delivery.
const applicationCss = (await Promise.all(cssPaths.map(path => readFile(new URL(`dist${path}`, root), 'utf8'))))
  .join('\n').replace(/@import\s*(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;/g, '');

const serverRequire = createRequire(new URL('../server/package.json', import.meta.url));
const { default: puppeteer } = await import(pathToFileURL(serverRequire.resolve('puppeteer')).href);

test('real browser captures modern colors and exports a two-page PDF', { timeout: 30000 }, async t => {
  const { outputFiles } = await build({
    stdin: {
      contents: `import capture from 'html2canvas-pro';
        import { exportToPDF } from './src/shared/utils/pdfExport.ts';
        window.exportTest = { capture, exportToPDF };`,
      resolveDir: fileURLToPath(new URL('..', import.meta.url)),
    },
    bundle: true, write: false, format: 'iife', platform: 'browser',
    alias: { html2canvas: 'html2canvas-pro' },
  });
  const browser = await puppeteer.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', request => request.abort());
  await page.setContent(`<style>
    body { margin: 0; }
    .pdf-page { width: 100px; height: 100px; background: white; }
    #color { width: 40px; height: 40px; background: oklch(0.62796 0.25768 29.23); }
    #mix { width: 40px; height: 40px; background: color-mix(in oklab, red 50%, white); }
  </style><div id="report"><div class="pdf-page"><div id="color"></div></div>
    <div class="pdf-page"><div id="mix"></div></div></div>`);
  await page.addStyleTag({ content: applicationCss });
  await page.addScriptTag({ content: outputFiles[0].text });
  const result = await page.evaluate(async () => {
    const pixels = [];
    for (const id of ['color', 'mix']) {
      const canvas = await window.exportTest.capture(document.getElementById(id), { logging: false, scale: 1 });
      pixels.push([...canvas.getContext('2d').getImageData(20, 20, 1, 1).data]);
    }
    const downloads = [];
    URL.createObjectURL = blob => { downloads.push(blob); return 'blob:captured-for-test'; };
    HTMLAnchorElement.prototype.click = () => {};
    HTMLAnchorElement.prototype.dispatchEvent = () => true;
    const success = await window.exportTest.exportToPDF('report', 'Report', 'city.pdf');
    return { pixels, success, pdf: await downloads[0]?.text() };
  });
  assert.deepEqual(result.pixels[0], [255, 0, 0, 255]);
  assert.ok(result.pixels[1][0] > 240 && result.pixels[1][1] > 100 && result.pixels[1][1] < 240);
  assert.equal(result.success, true);
  assert.match(result.pdf, /^%PDF-/);
  assert.match(result.pdf, /\/Count 2\b/);
  assert.match(result.pdf, /\/Subtype \/Image/);
  await page.setRequestInterception(false);
  await page.close();
});

test('production styles preserve theme, responsive spacing, radii and control borders', { timeout: 30000 }, async t => {
  const browser = await puppeteer.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', request => request.abort());
  await page.setViewport({ width: 390, height: 844 });
  await page.setContent(`<div id="card" class="bg-surface text-textMain p-4 sm:p-6 rounded-md shadow-xs">
    <button id="button" class="border border-borderClient px-4 py-2 rounded-xl">Button</button>
    <div id="dark" class="bg-surface dark:bg-[#14110f]">Dark theme</div>
    <div id="effect" class="backdrop-blur-xs"></div>
  </div>`);
  await page.addStyleTag({ content: applicationCss });
  const readStyles = () => page.evaluate(() => {
    const card = getComputedStyle(document.getElementById('card'));
    const button = getComputedStyle(document.getElementById('button'));
    return { padding: card.padding, radius: card.borderRadius, background: card.backgroundColor,
      shadow: card.boxShadow, color: card.color, buttonPadding: button.padding,
      buttonBorder: button.borderTopWidth, buttonRadius: button.borderRadius,
      dark: getComputedStyle(document.getElementById('dark')).backgroundColor,
      blur: getComputedStyle(document.getElementById('effect')).backdropFilter };
  });
  const light = await readStyles();
  assert.equal(light.padding, '16px');
  assert.equal(light.radius, '6px');
  assert.equal(light.background, 'rgb(255, 255, 255)');
  assert.equal(light.color, 'rgb(18, 24, 32)');
  assert.equal(light.buttonPadding, '8px 16px');
  assert.equal(light.buttonBorder, '1px');
  assert.equal(light.buttonRadius, '12px');
  assert.equal(light.dark, 'rgb(255, 255, 255)');
  assert.equal(light.blur, 'blur(4px)');
  assert.match(light.shadow, /0px 1px 2px/);
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const dark = await readStyles();
  assert.equal(dark.padding, '24px');
  assert.equal(dark.background, 'rgb(30, 41, 59)');
  assert.equal(dark.color, 'rgb(240, 246, 252)');
  assert.equal(dark.dark, 'rgb(20, 17, 15)');
  await page.setRequestInterception(false);
  await page.close();
});
