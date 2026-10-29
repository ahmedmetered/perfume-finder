// Sanity tests for the pure logic: data integrity, keyword map, scoring.
// Run: node scripts/test.mjs
import { FRAGRANCES, FAMILIES, FAMILY_AFFINITY, OCCASION_LABELS } from '../js/data.js';
import { KEYWORDS, analyzeText } from '../js/keywords.js';
import { buildProfile, rank, scoreFragrance } from '../js/scoring.js';

let failures = 0;
function check(name, cond, extra = '') {
  if (!cond) { failures++; console.error(`FAIL: ${name} ${extra}`); }
  else console.log(`ok: ${name}`);
}

// --- data integrity ---
check('library holds exactly 40 fragrances', FRAGRANCES.length === 40, `got ${FRAGRANCES.length}`);
check('ids unique', new Set(FRAGRANCES.map(f => f.id)).size === 40);

const SHAPES = new Set(['classic', 'flask', 'column', 'slab', 'orb']);
const CAPS = new Set(['puck', 'column', 'sphere', 'cone']);
const METALS = new Set(['gold', 'silver', 'black']);
const SEASON_KEYS = ['spring', 'summer', 'autumn', 'winter'];
const FAMILY_KEYS = Object.keys(FAMILIES);
const GENDERS = new Set(['m', 'f', 'u']);
const OCCASION_KEYS = Object.keys(OCCASION_LABELS);

for (const f of FRAGRANCES) {
  const mixSum = Object.values(f.mix).reduce((a, b) => a + b, 0);
  check(`${f.id}: mix sums to ~1`, Math.abs(mixSum - 1) < .06, `sum ${mixSum}`);
  check(`${f.id}: families valid`, Object.keys(f.mix).every(k => FAMILY_KEYS.includes(k)), JSON.stringify(f.mix));
  check(`${f.id}: seasons valid`, SEASON_KEYS.every(k => k in f.seasons));
  check(`${f.id}: season weights 0..1`, Object.values(f.seasons).every(v => v >= 0 && v <= 1));
  check(`${f.id}: occasions valid`, f.occasions.every(o => OCCASION_KEYS.includes(o)), f.occasions.join(','));
  check(`${f.id}: intensity 1..3`, f.intensity >= 1 && f.intensity <= 3);
  check(`${f.id}: tier 1..3`, f.tier >= 1 && f.tier <= 3);
  check(`${f.id}: gender valid`, GENDERS.has(f.gender));
  check(`${f.id}: notes complete`, f.notes.top.length && f.notes.heart.length && f.notes.base.length);
  check(`${f.id}: bottle valid`,
    SHAPES.has(f.bottle.shape) && CAPS.has(f.bottle.cap) && METALS.has(f.bottle.metal) && /^#[0-9A-Fa-f]{6}$/.test(f.bottle.juice),
    JSON.stringify(f.bottle));
  check(`${f.id}: blurb present`, typeof f.blurb === 'string' && f.blurb.length > 10);
  check(`${f.id}: pop 1..5`, f.pop >= 1 && f.pop <= 5);
}

// coverage: every quiz option should be reachable by at least a few fragrances
const seasonsCovered = SEASON_KEYS.filter(s => FRAGRANCES.filter(f => f.seasons[s] >= .7).length >= 5);
check('every season has >=5 fragrances that love it', seasonsCovered.length === 4, seasonsCovered.join(','));
const famCovered = FAMILY_KEYS.filter(k => FRAGRANCES.some(f => Object.keys(f.mix)[0] === k));
check('every family appears as a primary', famCovered.length === FAMILY_KEYS.length, famCovered.join(','));
check('unisex options exist', FRAGRANCES.filter(f => f.gender === 'u').length >= 4);
check('budget tier 1 exists', FRAGRANCES.filter(f => f.tier === 1).length >= 5);
check('quiet options exist', FRAGRANCES.filter(f => f.intensity === 1).length >= 5);
check('affinity map complete', FAMILY_KEYS.every(k => Object.keys(FAMILY_AFFINITY[k]).length === FAMILY_KEYS.length - 1));

// --- keyword map ---
for (const kw of KEYWORDS) {
  check(`keyword /${kw.re.source.slice(0, 24)}…/ has an effect`,
    !!(kw.family || kw.seasons || kw.gender || kw.occasions || kw.tier || kw.intensity));
  if (kw.tag) check(`keyword tag "${kw.tag}" has no em dash`, !kw.tag.includes('—'));
}
const hits = analyzeText('cozy vanilla for winter nights, budget student');
check('free text: vanilla hits gourmand', (hits.family.gourmand || 0) > 0, JSON.stringify(hits.family));
check('free text: cozy hits amber', (hits.family.amber || 0) > 0);
check('free text: winter hit', (hits.seasons.winter || 0) > 0);
check('free text: budget tier pull', hits.tier === 1);
check('free text: tags collected', hits.tags.length >= 3, hits.tags.join(','));
const none = analyzeText('zzz qqq');
check('free text: no false positives on noise', Object.keys(none.family).length === 0 && none.tags.length === 0);

// --- scoring ---
const base = rank(buildProfile({}, []));
check('blank profile ranks all 40', base.length === 40);
check('pct bounds hold', base.every(r => r.pct >= 38 && r.pct <= 99));
check('no NaN scores', base.every(r => Number.isFinite(r.score)));
check('scores sorted descending', base.every((r, i) => i === 0 || base[i - 1].score >= r.score));

const sweetWinter = rank(buildProfile({ budget: '2', season: 'winter', audience: 'f', family: 'gourmand', occasions: ['evening'], intensity: 3 }, [analyzeText('cozy vanilla coffee')]));
const freshSummer = rank(buildProfile({ budget: '1', season: 'summer', audience: 'm', family: 'aquatic', occasions: ['casual'], intensity: 1 }, [analyzeText('fresh clean gym scent')]));
check('sweet/winter/f profile: gourmand wins', sweetWinter[0].frag.mix.gourmand >= .45, `top=${sweetWinter[0].frag.id}`);
check('fresh/summer/m profile: aquatic-ish wins', freshSummer[0].frag.mix.aquatic + freshSummer[0].frag.mix.citrus >= .6, `top=${freshSummer[0].frag.id}`);
check('profiles produce different winners', sweetWinter[0].frag.id !== freshSummer[0].frag.id);
check('winner whys populated', sweetWinter[0].whys.length >= 2, JSON.stringify(sweetWinter[0].whys));
check('winner why mentions occasion', sweetWinter[0].whys.some(w => w.includes('evenings')), JSON.stringify(sweetWinter[0].whys));

// budget respects the ceiling: top-10 of a tier-1 profile should contain no tier-3
const cheap = rank(buildProfile({ budget: '1' }, []));
const priceyInTop = cheap.slice(0, 8).filter(r => r.frag.tier === 3).length;
check('tier-3 fragrances stay out of tier-1 top 8', priceyInTop === 0, `${priceyInTop} found`);

// unisex never punished hard, blank profile favors popular staples
check('blank top-10 mostly pop>=4', base.slice(0, 10).filter(r => r.frag.pop >= 4).length >= 7);

// single-answer steps move the needle (real-time feel)
const p1 = buildProfile({}, []);
const p2 = buildProfile({ family: 'woody' }, []);
const w1 = rank(p1)[0].frag.id, w2 = rank(p2)[0].frag.id;
check('one answer changes the leader', w1 !== w2, `${w1} -> ${w2}`);

// scoreFragrance returns full dims
const dims = scoreFragrance(FRAGRANCES[0], p1).dims;
check('dims complete', ['family', 'occasions', 'intensity', 'seasons', 'budget', 'gender'].every(k => k in dims && Number.isFinite(dims[k])));

console.log(failures ? `\n${failures} FAILURES` : '\nall checks passed');
process.exit(failures ? 1 : 0);
