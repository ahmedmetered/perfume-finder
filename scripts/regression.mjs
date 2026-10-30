import { buildProfile, rank, profileSummary } from '../js/scoring.js';
import { analyzeText } from '../js/keywords.js';

// his exact complaint: under-50 + citrus + for him, then free text with compromising words
const t = analyzeText('something designer and classic for the office');
const p = buildProfile({ budget: '1', family: 'citrus', audience: 'm', occasions: ['casual'], intensity: 2 }, [t]);
console.log('ceiling stays 1:', p.tierCeiling === 1, '| intensity stays 2:', p.intensityTarget === 2);
const r = rank(p);
console.log('top3:', r.slice(0, 3).map(x => `${x.frag.id} t${x.frag.tier} ${x.pct}%`).join(' | '));
console.log('no over-ceiling in top3:', r.slice(0, 3).every(x => !x.overBudget));

// text fills silence when the buttons are quiet
const p2 = buildProfile({}, [analyzeText('expensive niche splurge')]);
console.log('text fills budget when silent:', p2.tierCeiling === 3);

// pure MC case still sane
const p3 = buildProfile({ budget: '1', season: 'summer', audience: 'm', family: 'citrus', occasions: ['casual'], intensity: 1 }, []);
const r3 = rank(p3);
console.log('pure MC top1:', r3[0].frag.id, r3[0].frag.tier, r3[0].pct + '%', '| over-ceiling in top5:', r3.slice(0, 5).filter(x => x.overBudget).length);
console.log('summary:', profileSummary(p3).join(' | '));
