// Headless end-to-end drive: real-time analysis, full quiz, 3D stage, results.
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

check('hero headline visible', await page.isVisible('.display'));
check('hero 3D canvas alive', await page.evaluate(() => {
  const c = document.querySelector('#hero-canvas');
  return !!(c && (c.getContext('webgl2') || c.getContext('webgl')));
}));
await page.waitForTimeout(1500);
await page.locator('.stage').screenshot({ path: 'C:/tmp/pf2-hero-stage.png' });

// free text drives the shelf before any click
await page.click('#start-btn');
await page.fill('#free-text', 'sweet cozy vanilla for winter nights');
await page.waitForTimeout(500);
const firstName = await page.textContent('#live-rows .live-row:first-child .live-name');
check('free text reorders live top-1', firstName && firstName !== '–', firstName);
check('live tags picked up keywords', (await page.locator('#live-tags .tag').count()) >= 2);

// walk the whole quiz — the budget compromise case from the bug report:
// buttons say under-€50 + citrus; step texts try to push designer/woody
const picks = [
  async () => { await page.fill('#free-text', 'something designer and classic'); await page.click('.option[data-v="1"]'); },
  async () => { await page.click('.option[data-v="summer"]'); },
  async () => { await page.click('.option[data-v="m"]'); },
  async () => { await page.click('.option[data-v="citrus"]'); },
  async () => { await page.click('.option[data-v="casual"]'); },
  async () => { await page.click('.option[data-v="2"]'); }
];
for (let i = 0; i < picks.length; i++) {
  await picks[i]();
  await page.waitForTimeout(120);
  if (i < picks.length - 1) await page.click('#next-btn');
}
await page.waitForTimeout(250);
const top1 = await page.evaluate(() => window.__pf.ranking[0].frag.id);
const tier1 = await page.evaluate(() => window.__pf.ranking[0].frag.tier);
check('BUGFIX: budget respected despite compromising text', tier1 === 1, `top1=${top1} tier=${tier1}`);
check('BUGFIX: top3 all in budget', await page.evaluate(() => window.__pf.ranking.slice(0, 3).every(r => !r.overBudget)));
check('BUGFIX: ceiling cannot be raised by text', await page.evaluate(() => window.__pf.profile.tierCeiling === 1));

await page.click('#next-btn'); // See my scent
await page.waitForTimeout(1600); // count-up + viewer init
check('results shown', await page.isVisible('#results'));
check('descent reached the abyss', await page.evaluate(() => document.body.style.getPropertyValue('--depth')) === '1.000');
check('match number counted up', parseInt(await page.textContent('#match-num')) > 50, await page.textContent('#match-num'));
const heroName = await page.textContent('#r-name');
check('hero name filled', heroName.length > 1, heroName);
check('summary chips populated', (await page.locator('#r-tags .tag').count()) >= 3);
check('hero why-chips populated', (await page.locator('#r-whys .tag').count()) >= 2);
check('runners rendered', (await page.locator('#runners .runner').count()) === 2);
check('shelf has 40 rows', (await page.locator('#shelf .shelf-row').count()) === 40);
check('pyramid rendered', (await page.locator('#r-pyramid .pyr-col').count()) === 3);
check('no 3D failure banner', (await page.locator('.no3d-note').count()) === 0);

const gl = await page.evaluate(() => {
  const c = document.querySelector('#bottle-canvas');
  const ctx = c && (c.getContext('webgl2') || c.getContext('webgl'));
  return ctx ? 'gl-ok' : 'no-gl';
});
check('results canvas has live GL context', gl === 'gl-ok', gl);

await page.waitForTimeout(1200);
await page.locator('#bottle-wrap').screenshot({ path: 'C:/tmp/pf2-stage-results.png' });
await page.screenshot({ path: 'C:/tmp/pf2-results.png', fullPage: false });

await page.click('#shelf .shelf-row:nth-child(9)');
await page.waitForTimeout(600);
check('clicking shelf row swaps hero', (await page.textContent('#r-name')) !== heroName);

await page.click('#retake-btn');
await page.waitForTimeout(300);
check('retake shows quiz again', await page.isVisible('#quiz'));
check('retake resets profile', await page.evaluate(() => window.__pf.profile.answered) === 0);

const realErrors = consoleErrors.filter(e => !e.includes('favicon'));
check('no console errors', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
const fatalRequests = badRequests.filter(u => !u.includes('favicon'));
check('no failed requests', fatalRequests.length === 0, fatalRequests.join(' | ').slice(0, 300));

// mobile pass
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
mob.on('pageerror', e => consoleErrors.push('mob: ' + e.message));
await mob.goto(BASE, { waitUntil: 'networkidle' });
await mob.click('#start-btn');
await mob.waitForTimeout(300);
await mob.click('.option[data-v="2"]');
await mob.screenshot({ path: 'C:/tmp/pf2-mobile-quiz.png' });
await mob.close();

await browser.close();
console.log(failures ? `\n${failures} E2E FAILURES` : '\nall E2E checks passed');
process.exit(failures ? 1 : 0);
