import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { chromium } from 'playwright';
import { advance, enterChapter, newGame, playMove, saveKey, startCombat } from '../src/game/state.ts';

const url = process.env.JOURNEY_PREVIEW_URL ?? 'http://127.0.0.1:4180/legacy.html';
const assets = await readdir('dist/assets');
const assetSizes = await Promise.all(assets.map(async name => [name, (await stat(`dist/assets/${name}`)).size]));
const total = assetSizes.reduce((sum, [, bytes]) => sum + bytes, 0)
  + (await stat('dist/index.html')).size + (await stat('dist/_headers')).size;

let prologueEnd = startCombat(advance(advance(newGame(), 'compassion')));
for (const move of ['skill', 'attack', 'attack']) prologueEnd = playMove(prologueEnd, move);
prologueEnd = advance(prologueEnd);
const nextChapter = enterChapter(prologueEnd);

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
const readTransfers = page => page.evaluate(() => {
  const entries = performance.getEntriesByType('resource');
  return {
    bytes: entries.reduce((sum, entry) => sum + entry.transferSize, 0)
      + (performance.getEntriesByType('navigation')[0]?.transferSize ?? 0),
    files: entries.map(entry => ({ url: new URL(entry.name).pathname, bytes: entry.transferSize })),
  };
});
const browserCdp = await browser.newBrowserCDPSession();
async function rendererPssKiB() {
  try {
    const { processInfo } = await browserCdp.send('SystemInfo.getProcessInfo');
    const renderers = processInfo.filter(process => process.type === 'renderer');
    if (!renderers.length) return null;
    const stats = await Promise.all(renderers.map(process => readFile(`/proc/${process.id}/smaps_rollup`, 'utf8')));
    return stats.reduce((sum, text) => sum + Number(text.match(/^Pss:\s+(\d+)/m)?.[1] ?? 0), 0);
  } catch {
    return null;
  }
}

const data = [];
try {
  for (const quality of ['low', 'medium', 'high']) {
    for (const state of [newGame(), nextChapter]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.addInitScript(({ quality, saveKey, state }) => {
        localStorage.setItem('thien-menh.quality', quality);
        localStorage.setItem(saveKey, JSON.stringify(state));
      }, { quality, saveKey, state });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const menu = await readTransfers(page);
      const start = performance.now();
      await page.getByRole('button', { name: 'Tiếp tục hành trình' }).click();
      const canvas = page.locator('canvas');
      await canvas.waitFor();
      const scene = page.locator('#world[data-quality]');
      await scene.waitFor();
      const loadingMs = Math.round(performance.now() - start);
      await page.waitForLoadState('networkidle');
      const playable = await readTransfers(page);
      const fps = [];
      for (let i = 0; i < 3; i++) {
        await page.waitForTimeout(1100);
        fps.push(Number(await scene.getAttribute('data-fps')));
      }
      const cdp = await context.newCDPSession(page);
      await cdp.send('HeapProfiler.collectGarbage');
      const heap = await cdp.send('Runtime.getHeapUsage');
      data.push({
        chapter: state.chapter, quality, menuBytes: menu.bytes, playableBytes: playable.bytes,
        sceneDeltaBytes: playable.bytes - menu.bytes, loadingMs, fps,
        renderer: await scene.getAttribute('data-renderer'),
        textures: Number(await scene.getAttribute('data-textures')),
        heapBytes: heap.usedSize,
        rendererPssKiB: await rendererPssKiB(),
        art: [...new Set(playable.files.filter(file => file.url.endsWith('.webp')).map(file => file.url))],
      });
      await context.close();
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(({ state, saveKey }) => {
    localStorage.setItem(saveKey, JSON.stringify(state));
    localStorage.setItem('thien-menh.quality', 'low');
  }, { state: prologueEnd, saveKey });
  await page.goto(url);
  await page.getByRole('button', { name: 'Tiếp tục hành trình' }).click();
  const transitionStart = performance.now();
  await page.getByRole('button', { name: 'Đến Tàng Phong' }).click();
  await page.locator('#world[data-disposed="1"] canvas').waitFor();
  await page.getByRole('button', { name: 'Đến mục tiêu' }).waitFor();
  const transitionMs = Math.round(performance.now() - transitionStart);
  const scene = page.locator('#world');
  await page.locator('#world[data-disposed="1"][data-fps]').waitFor();
  const cdp = await context.newCDPSession(page);
  await cdp.send('HeapProfiler.collectGarbage');
  const before = (await cdp.send('Runtime.getHeapUsage')).usedSize;
  let midpoint;
  for (let i = 0; i < 8; i++) {
    await page.getByRole('button', { name: 'Thiết lập', exact: true }).click();
    await page.getByLabel('Chất lượng đồ họa').selectOption(i % 2 ? 'low' : 'high');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await page.locator(`#world[data-disposed="${i + 2}"][data-fps]`).waitFor();
    assert.equal(await page.locator('canvas').count(), 1);
    if (i === 3) {
      await cdp.send('HeapProfiler.collectGarbage');
      midpoint = (await cdp.send('Runtime.getHeapUsage')).usedSize;
    }
  }
  await cdp.send('HeapProfiler.collectGarbage');
  const after = (await cdp.send('Runtime.getHeapUsage')).usedSize;
  console.log(JSON.stringify({
    chromium: browser.version(), buildBytes: total,
    javascript: assetSizes.filter(([name]) => name.endsWith('.js')),
    data,
    teardown: { before, midpoint, after, transitionMs, disposed: Number(await scene.getAttribute('data-disposed')),
      canvases: await page.locator('canvas').count(), textures: Number(await scene.getAttribute('data-textures')) },
  }, null, 2));
  await context.close();
} finally {
  await browser.close();
}
