// Weighted scoring engine. Pure functions, no DOM: runs in the browser and
// under plain node for tests.
//
// Each quiz answer (and every keyword hit from free text) feeds one shared
// profile. The profile is a set of weighted vectors; each fragrance is scored
// against it dimension by dimension, and the strongest matching dimensions
// become the "why" lines shown with every result.

import { FRAGRANCES, FAMILIES, FAMILY_AFFINITY, OCCASION_LABELS } from './data.js';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const DIM_WEIGHTS = { family: .30, occasions: .18, intensity: .15, seasons: .15, budget: .12, gender: .10 };
const TIER_LABEL = { 1: 'under €50', 2: 'under €120', 3: 'splurge tier' };

// answers: { budget, season, audience, family, occasions[], intensity }
// textHits: array of analyzeText() outputs
export function buildProfile(answers = {}, textHits = []) {
  const family = {}, seasons = {}, gender = {}, occasions = {};
  let tierCeiling = null, intensityTarget = null;

  if (answers.family && FAMILIES[answers.family]) {
    family[answers.family] = (family[answers.family] || 0) + 1;
    for (const [k, v] of Object.entries(FAMILY_AFFINITY[answers.family])) family[k] = (family[k] || 0) + v * .35;
  }
  if (answers.season && answers.season !== 'all') seasons[answers.season] = (seasons[answers.season] || 0) + 1;
  if (answers.audience) gender[answers.audience] = (gender[answers.audience] || 0) + 1;
  if (answers.budget && answers.budget !== 'any') tierCeiling = Number(answers.budget);
  if (answers.intensity) intensityTarget = answers.intensity;
  for (const occ of answers.occasions || []) occasions[occ] = (occasions[occ] || 0) + 1;

  for (const t of textHits) {
    for (const [k, v] of Object.entries(t.family)) family[k] = (family[k] || 0) + v * .6;
    for (const [k, v] of Object.entries(t.seasons)) seasons[k] = (seasons[k] || 0) + v * .6;
    for (const [k, v] of Object.entries(t.gender)) gender[k] = (gender[k] || 0) + v * .6;
    for (const [k, v] of Object.entries(t.occasions)) occasions[k] = (occasions[k] || 0) + v * .6;
    if (t.tier) { const tt = t.tier; if (tierCeiling === null || tt > tierCeiling) tierCeiling = tt; }
    if (t.intensity) intensityTarget = t.intensity;
  }

  const tags = textHits.flatMap(t => t.tags);
  const answered = ['budget', 'season', 'audience', 'family', 'intensity'].filter(k => answers[k]).length
    + ((answers.occasions && answers.occasions.length) ? 1 : 0) + (tags.length ? 1 : 0);

  return { family, seasons, gender, occasions, tierCeiling, intensityTarget, tags, answered };
}

function dot(user, vec) {
  let s = 0, w = 0;
  for (const [k, u] of Object.entries(user)) { w += u; s += u * (vec[k] || 0); }
  return w ? s / w : 0;
}

function budgetScore(tier, ceiling) {
  if (ceiling === null || ceiling === undefined) return .75;
  if (tier > ceiling) return tier - ceiling >= 2 ? .05 : .35;  // over budget must lose even against pop tiebreaks
  return tier === ceiling ? 1 : .85;
}

function intensityScore(frag, target) {
  if (!target) return .6;
  return 1 - Math.abs(frag.intensity - target) / 2;
}

function seasonScore(frag, profile) {
  if (!Object.keys(profile.seasons).length) return .6;
  return dot(profile.seasons, frag.seasons);
}

function occasionScore(frag, profile) {
  const keys = Object.keys(profile.occasions);
  if (!keys.length) return .6;
  let s = 0, w = 0;
  for (const [k, u] of Object.entries(profile.occasions)) { w += u; s += u * (frag.occasions.includes(k) ? 1 : 0); }
  return s / w;
}

function genderScore(frag, profile) {
  if (!Object.keys(profile.gender).length) return .6;
  const vec = frag.gender === 'u' ? { u: 1, m: .6, f: .6 }
    : frag.gender === 'm' ? { m: 1, u: .35, f: .1 }
    : { f: 1, u: .35, m: .1 };
  return dot(profile.gender, vec);
}

function familyScore(frag, profile) {
  if (!Object.keys(profile.family).length) return .6;
  return dot(profile.family, frag.mix);
}

export function scoreFragrance(frag, profile) {
  const dims = {
    family: familyScore(frag, profile),
    occasions: occasionScore(frag, profile),
    intensity: intensityScore(frag, profile.intensityTarget),
    seasons: seasonScore(frag, profile),
    budget: budgetScore(frag.tier, profile.tierCeiling),
    gender: genderScore(frag, profile)
  };
  let score = 0;
  for (const [k, w] of Object.entries(DIM_WEIGHTS)) score += dims[k] * w;
  return { dims, score: score + frag.pop * .002 };
}

function whyLines(frag, dims, profile) {
  const lines = [];
  const topFamily = Object.entries(frag.mix).sort((a, b) => b[1] - a[1])[0];
  if (profile.family && Object.keys(profile.family).length && dims.family >= .55) {
    lines.push(FAMILIES[topFamily[0]].label.toLowerCase());
  }
  if (profile.occasions && Object.keys(profile.occasions).length) {
    for (const occ of Object.keys(profile.occasions)) {
      if (frag.occasions.includes(occ) && dims.occasions >= .5) lines.push(`made for ${OCCASION_LABELS[occ]}`);
    }
  }
  if (profile.seasons && Object.keys(profile.seasons).length && dims.seasons >= .6) {
    const top = SEASONS.filter(s => frag.seasons[s] >= .7).sort((a, b) => frag.seasons[b] - frag.seasons[a])[0];
    if (top) lines.push(`shines in ${top}`);
  }
  if (profile.intensityTarget && dims.intensity >= .75) {
    lines.push({ 1: 'a quiet skin scent', 2: 'a polite presence', 3: 'fills the room' }[frag.intensity]);
  }
  if (profile.tierCeiling !== null && profile.tierCeiling !== undefined) {
    if (frag.tier <= profile.tierCeiling) lines.push(TIER_LABEL[profile.tierCeiling]);
  } else if (frag.tier === 3) {
    lines.push('a true splurge');
  }
  if (frag.gender === 'u' && dims.gender >= .5) lines.push('unisex');
  return [...new Set(lines)].slice(0, 4);
}

export function rank(profile, fragrances = FRAGRANCES) {
  return fragrances
    .map(frag => {
      const { dims, score } = scoreFragrance(frag, profile);
      return {
        frag, dims, score,
        pct: Math.max(38, Math.min(99, Math.round(35 + 65 * score))),
        whys: whyLines(frag, dims, profile)
      };
    })
    .sort((a, b) => b.score - a.score);
}
