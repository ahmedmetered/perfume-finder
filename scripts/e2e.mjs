// Headless end-to-end drive: real-time analysis, full quiz, 3D stage, themes.
// Run: node scripts/e2e.mjs  (uses the machine's Playwright install)
import { chromium } from 'playwright';

const BASE = 'http://localhost:8790';
let failures = 0;
const check = (name, cond, extra = '') => {
  if (!cond) { failures++; console.error(`FAIL: ${name} ${extra}`); }
  else console.log(`ok: ${name}`);
};

const browser = await chromium.launch({
  executablePath: 'C:/Users/asusz/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });

const consoleErrors = [];
const badRequests = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
page.on('requestfailed', r => badRequests.push(`${r.url()} :: ${r.failure()?.errorText}`));

await page.goto(BASE, { waitUntil: 'networkidle' });

check('hero visible', await page.isVisible('h1'));
check('live panel has 3 rows', (await page.locator('#live-rows .live-row').count()) === 3);
check('library line mentions 40', (await page.textContent('.kicker')).includes('40'));

// free text drives the shelf before any click
await page.click('#start-btn');
await page.fill('#free-text', 'sweet cozy vanilla for winter nights');
await page.waitForTimeout(500);
const firstName = await page.textContent('#live-rows .live-row:first-child .live-name');
check('free text reorders live top-1', firstName && firstName !== '–', firstName);
check('live tags picked up keywords', (await page.locator('#live-tags .tag').count()) >= 2);

// walk the whole quiz
const picks = [
  async () => { await page.fill('#free-text', ''); await page.click('.option[data-v="2"]'); },
  async () => { await page.click('.option[data-v="winter"]'); },
  async () => { await page.click('.option[data-v="f"]'); },
  async () => { await page.click('.option[data-v="gourmand"]'); },
  async () => { await page.click('.option[data-v="evening"]'); await page.click('.option[data-v="date"]'); },
  async () => { await page.click('.option[data-v="3"]'); }
];
for (let i = 0; i < picks.length; i++) {
  await picks[i]();
  await page.waitForTimeout(120);
  if (i < picks.length - 1) await page.click('#next-btn');
}
const nameBefore = await page.textContent('#live-rows .live-row:first-child .live-name');
check('quiz answers reorder live top-1', nameBefore && nameBefore !== '–', nameBefore);
check('progress shows 6 of 6 answered', (await page.textContent('#live-count')).startsWith('6'));

await page.click('#next-btn'); // See my scent
await page.waitForTimeout(900);
check('results shown', await page.isVisible('#results'));
check('hero match % filled', /\d+%/.test(await page.textContent('#match-big')));
const heroName = await page.textContent('#r-name');
check('hero name filled', heroName.length > 1, heroName);
check('hero why-chips populated', (await page.locator('#r-whys .tag').count()) >= 2);
check('runners rendered', (await page.locator('#runners .runner').count()) === 2);
check('shelf has 40 rows', (await page.locator('#shelf .shelf-row').count()) === 40);
check('pyramid rendered', (await page.locator('#r-pyramid .pyr-col').count()) === 3);
check('no 3D failure banner', (await page.locator('#stage.no-3d').count()) === 0);

// webgl actually alive on the hero canvas
const gl = await page.evaluate(() => {
  const c = document.querySelector('#bottle-canvas');
  if (!c) return 'no-canvas';
  const ctx = c.getContext('webgl2') || c.getContext('webgl');
  if (!ctx) return 'no-context';
  return `gl-ok ${c.width}x${c.height}`;
});
check('hero canvas has live GL context', String(gl).startsWith('gl-ok'), String(gl));

// wait for a few frames of rendering, then screenshot the stage only
await page.waitForTimeout(1200);
await page.locator('#stage').screenshot({ path: '/tmp/pf-stage-light.png' });
await page.screenshot({ path: '/tmp/pf-results-light.png', fullPage: false });

// click a shelf row -> hero swaps
await page.click('#shelf .shelf-row:nth-child(9)');
await page.waitForTimeout(600);
const swapped = await page.textContent('#r-name');
check('clicking shelf row swaps hero', swapped !== heroName, `${heroName} -> ${swapped}`);

// dark mode
await page.click('#theme-toggle');
await page.waitForTimeout(400);
await page.locator('#stage').screenshot({ path: '/tmp/pf-stage-dark.png' });
check('dark mode applied', (await page.getAttribute('html', 'data-theme')) === 'dark');

// runner card swap
await page.click('#runners .runner');
await page.waitForTimeout(400);

// retake returns to quiz
await page.click('#retake-btn');
await page.waitForTimeout(300);
check('retake shows quiz again', await page.isVisible('#quiz'));
check('retake resets live panel', (await page.textContent('#live-count')).startsWith('0'));

const realErrors = consoleErrors.filter(e => !e.includes('favicon'));
check('no console errors', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
const fatalRequests = badRequests.filter(u => !u.includes('favicon'));
check('no failed requests', fatalRequests.length === 0, fatalRequests.join(' | ').slice(0, 300));

await browser.close();
console.log(failures ? `\n${failures} E2E FAILURES` : '\nall E2E checks passed');
process.exit(failures ? 1 : 0);
