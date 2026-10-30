// App orchestration: the dive. Quiz state, real-time local analysis, results.
// Every answer deepens the page's water and retints its glow toward the
// current best match. All scoring runs in the browser; nothing leaves the page.

import { FRAGRANCES, FAMILIES, OCCASION_LABELS } from './data.js';
import { analyzeText } from './keywords.js';
import { buildProfile, rank, profileSummary } from './scoring.js';
import { BottleViewer, snapshotBottle } from './bottles.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// depth of each stage of the dive, for the meter
const DEPTHS = ['surface · 0 m', '12 m · shaded', '40 m · the thermocline', '130 m · twilight', '800 m · midnight', '2,400 m · the abyssal plain', '3,700 m · your scent'];

// ---------- quiz definition ----------

const ORDINALS = ['Question one', 'Question two', 'Question three', 'Question four', 'Question five', 'Question six'];

const STEPS = [
  {
    key: 'budget', title: 'What are we spending?',
    sub: 'Tiers are rough bands across the whole shelf, not quotes.',
    options: [
      { v: '1', label: 'Under €50', hint: 'drugstore and entry designer' },
      { v: '2', label: '€50 to €120', hint: 'most designer bottles' },
      { v: '3', label: '€120 to €250', hint: 'high-end designer and entry niche' },
      { v: 'any', label: 'No ceiling', hint: 'show me the good stuff' }
    ],
    placeholder: 'e.g. student budget, dupes welcome'
  },
  {
    key: 'season', title: 'When will it be worn?',
    sub: 'Heat amplifies everything. Cold air hides the quiet ones.',
    options: [
      { v: 'spring', label: 'Spring', hint: 'mild and blooming' },
      { v: 'summer', label: 'Summer', hint: 'hot days, light clothes' },
      { v: 'autumn', label: 'Autumn', hint: 'sweaters, wet leaves' },
      { v: 'winter', label: 'Winter', hint: 'cold air, heavy coats' },
      { v: 'all', label: 'All year', hint: 'one bottle, any weather' }
    ],
    placeholder: 'e.g. european summer, beach evenings'
  },
  {
    key: 'audience', title: 'Who is it for?',
    sub: 'Fragrance has no rules here, only leanings.',
    options: [
      { v: 'm', label: 'For him', hint: 'masculine lean' },
      { v: 'f', label: 'For her', hint: 'feminine lean' },
      { v: 'u', label: 'Unisex', hint: 'shared bottle' }
    ],
    placeholder: 'e.g. a gift for my girlfriend'
  },
  {
    key: 'family', title: 'Pick a scent family',
    sub: 'The strongest signal in the whole quiz. You can describe it instead.',
    options: Object.entries(FAMILIES).map(([v, f]) => ({ v, label: f.label })),
    placeholder: 'e.g. something sweet like vanilla and coffee'
  },
  {
    key: 'occasions', title: 'Where will it live?',
    sub: 'Pick up to three. This shapes the why-lines later.',
    multi: true, max: 3,
    options: Object.entries(OCCASION_LABELS).map(([v, l]) => ({ v, label: cap(l), hint: occHint(v) })),
    placeholder: 'e.g. office in the week, dates on friday'
  },
  {
    key: 'intensity', title: 'How loud should it be?',
    sub: 'Projection and presence, from a whisper to a room.',
    options: [
      { v: '1', label: 'A whisper', hint: 'close skin scent' },
      { v: '2', label: 'Noticeable', hint: 'polite presence' },
      { v: '3', label: 'Fills the room', hint: 'they smell you leave' }
    ],
    placeholder: 'e.g. subtle, my office is scent-sensitive'
  }
];

function cap(s) { return s[0].toUpperCase() + s.slice(1); }
function occHint(v) {
  return { office: 'meetings, elevators', evening: 'bars, dinners out', date: 'close distance', casual: 'errands, weekends', special: 'weddings, events' }[v];
}

// ---------- state ----------

const state = {
  step: 0,
  answers: {},
  texts: {},
  finished: false,
  viewer: null,
  heroViewer: null,
  heroTimer: 0
};

let profile = buildProfile({}, []);
let ranking = rank(profile);

// ---------- analysis core ----------

function analyze() {
  return analyzeText(Object.values(state.texts).join(' '));
}

function updateAnalysis() {
  profile = buildProfile(state.answers, [analyze()]);
  ranking = rank(profile);
  const juice = typeof ranking[0].frag.bottle.juice === 'string'
    ? ranking[0].frag.bottle.juice : ranking[0].frag.bottle.juice.from;
  document.documentElement.style.setProperty('--glow', juice);
  renderLive();
  if (state.finished) renderResults(false);
}

function setDepth(i) {
  const d = Math.min(1, i / (DEPTHS.length - 1));
  document.body.style.setProperty('--depth', d.toFixed(3));
  $('#depth-read').textContent = DEPTHS[Math.min(i, DEPTHS.length - 1)];
  $('#rail-bead').style.transform = `translateY(${(d * 190).toFixed(0)}px)`;
}

// ---------- live shelf (the wall) ----------

function renderLive() {
  const top = ranking.slice(0, 3);
  const rows = $$('#live-rows .live-row');
  top.forEach((r, i) => {
    const row = rows[i];
    const juice = typeof r.frag.bottle.juice === 'string' ? r.frag.bottle.juice : r.frag.bottle.juice.from;
    $('.live-name', row).textContent = r.frag.name;
    $('.live-house', row).textContent = r.frag.house;
    $('.live-pct', row).textContent = r.pct + '%';
    $('.live-bar', row).style.setProperty('--lc', juice);
    $('.live-bar i', row).style.width = r.pct + '%';
    row.style.setProperty('--lc', juice);
  });
  const tags = profile.tags;
  $('#live-tags').innerHTML = tags.length
    ? tags.map(t => `<span class="tag">${t}</span>`).join('')
    : '<span class="live-empty">type or answer to steer the shelf</span>';
}

// ---------- quiz rendering ----------

const quizEl = $('#quiz');
const stepCard = $('#step-card');

function startQuiz() {
  stopHero();
  quizEl.hidden = false;
  $('#hero-cta').innerHTML = '<button class="btn" id="resume-note">The dive is on — the shelf is below</button>';
  renderStep();
  setDepth(1);
  quizEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderStep() {
  const step = STEPS[state.step];
  $('#step-kicker').textContent = ORDINALS[state.step];
  $('#step-count').textContent = `${state.step + 1} of ${STEPS.length}`;
  $('#depthbar-fill').style.width = `${(state.step / STEPS.length) * 100}%`;
  setDepth(state.step + 1);

  const multi = !!step.multi;
  stepCard.classList.remove('step-anim');
  void stepCard.offsetWidth; // restart the entrance animation
  stepCard.classList.add('step-anim');

  stepCard.innerHTML = `
    <h3 class="step-title">${step.title}</h3>
    <p class="step-sub">${step.sub}</p>
    <div class="options" role="${multi ? 'group' : 'radiogroup'}" aria-label="${step.title}">
      ${step.options.map(o => `
        <button type="button" class="option${isSelected(step, o.v) ? ' on' : ''}" data-v="${o.v}"
          aria-pressed="${isSelected(step, o.v)}">
          <span class="opt-label">${o.label}</span>
          ${o.hint ? `<span class="opt-hint">${o.hint}</span>` : ''}
        </button>`).join('')}
    </div>
    <div class="freeform">
      <label for="free-text">or describe it in your own words</label>
      <input id="free-text" type="text" autocomplete="off" placeholder="${step.placeholder}"
        value="${(state.texts[step.key] || '').replace(/"/g, '&quot;')}">
      <p class="freeform-note">What you pick above always wins; typed words only fill the gaps.</p>
    </div>
    <div class="step-nav">
      <button type="button" class="btn" id="back-btn" ${state.step === 0 ? 'disabled' : ''}>Back</button>
      <button type="button" class="btn primary" id="next-btn">
        ${state.step === STEPS.length - 1 ? 'See my scent' : 'Deeper'}
      </button>
    </div>`;

  $$('.option', stepCard).forEach(btn => btn.addEventListener('click', () => {
    const v = btn.dataset.v;
    if (multi) {
      const list = state.answers[step.key] || [];
      const i = list.indexOf(v);
      if (i >= 0) list.splice(i, 1); else { if (list.length >= step.max) list.shift(); list.push(v); }
      if (list.length) state.answers[step.key] = list; else delete state.answers[step.key];
    } else {
      if (state.answers[step.key] === v) delete state.answers[step.key]; else state.answers[step.key] = v;
    }
    updateAnalysis();
    renderStep();
  }));

  const text = $('#free-text', stepCard);
  let deb;
  text.addEventListener('input', () => {
    clearTimeout(deb);
    deb = setTimeout(() => {
      const v = text.value.trim();
      if (v) state.texts[step.key] = v; else delete state.texts[step.key];
      updateAnalysis();
    }, 140);
  });

  $('#back-btn', stepCard).addEventListener('click', () => { if (state.step > 0) { state.step--; renderStep(); } });
  $('#next-btn', stepCard).addEventListener('click', () => {
    if (state.step === STEPS.length - 1) finish();
    else { state.step++; renderStep(); quizEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
}

function isSelected(step, v) {
  const a = state.answers[step.key];
  return Array.isArray(a) ? a.includes(v) : a === v;
}

// ---------- results: the abyss ----------

function finish() {
  state.finished = true;
  quizEl.hidden = true;
  const results = $('#results');
  results.hidden = false;
  setDepth(6);
  renderResults(true);
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  queueSnapshots();
}

function initViewer() {
  if (state.viewer) return;
  try {
    state.viewer = new BottleViewer($('#bottle-canvas'));
    $('#bottle-wrap').classList.add('live-3d');
  } catch {
    $('#bottle-wrap').innerHTML = '<div class="no3d-note">3D preview unavailable on this browser. The shelf below still works.</div>';
    state.viewer = null;
  }
}

function countUp(el, to) {
  if (reducedMotion) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 1300;
  const tick = now => {
    const k = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(e * to);
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function fillHero(r, withViewer) {
  const f = r.frag;
  countUp($('#match-num'), r.pct);
  $('#match-note').textContent = r.overBudget ? ' · over your budget, shown lower' : '';
  $('#r-name').textContent = f.name;
  $('#r-house').innerHTML = `<b>${f.house}</b> · ${f.year} · ${FAMILIES[mainFamily(f)].label}`;
  $('#r-whys').innerHTML = r.whys.map(w => `<span class="tag">${w}</span>`).join('');
  $('#r-tags').innerHTML = profileSummary(profile).map(c => `<span class="tag">${c}</span>`).join('')
    || '<span class="tag">blank quiz, so this is the crowd favorite</span>';
  $('#r-blurb').textContent = f.blurb;
  $('#r-tier').textContent = ['under €50', '€50 to €120', '€120 to €250'][f.tier - 1];
  $('#r-intensity').innerHTML = '●'.repeat(f.intensity) + '<span class="dim-dots">' + '●'.repeat(3 - f.intensity) + '</span>';
  $('#r-depth').innerHTML = `Arrived at <b>3,700 m</b>`;
  const pyr = [['Top', f.notes.top], ['Heart', f.notes.heart], ['Base', f.notes.base]];
  $('#r-pyramid').innerHTML = pyr.map(([t, notes]) => `
    <div class="pyr-col"><h5>${t}</h5><p>${notes.join(', ')}</p></div>`).join('');
  if (withViewer) {
    initViewer();
    if (state.viewer) {
      state.viewer.resize();
      state.viewer.setFrag(f);
      state.viewer.setAutoRotate(!reducedMotion);
    }
  } else if (state.viewer) state.viewer.setFrag(f);
}

function mainFamily(frag) {
  return Object.entries(frag.mix).sort((a, b) => b[1] - a[1])[0][0];
}

function renderResults(withViewer) {
  const top = ranking[0];
  fillHero(top, withViewer);

  $('#runners').innerHTML = ranking.slice(1, 3).map((r, i) => `
    <button type="button" class="runner" data-id="${r.frag.id}" style="--i:${i}">
      <img alt="${r.frag.name} bottle" data-snap="${r.frag.id}">
      <div class="runner-info">
        <span class="match-num">${r.pct}%</span>
        <h4>${r.frag.name}</h4>
        <p>${r.frag.house}</p>
        <div class="r-whys">${r.whys.slice(0, 2).map(w => `<span class="tag">${w}</span>`).join('')}</div>
      </div>
    </button>`).join('');
  $$('#runners .runner').forEach(btn => btn.addEventListener('click', () => {
    focusFrag(btn.dataset.id);
    $('#hero-result').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));

  $('#shelf').innerHTML = ranking.map((r, i) => `
    <button type="button" class="shelf-row${i === 0 ? ' top1' : ''}" data-id="${r.frag.id}">
      <span class="shelf-rank">${i + 1}</span>
      <img alt="" data-snap="${r.frag.id}">
      <span class="shelf-name">${r.frag.name}<em>${r.frag.house}</em></span>
      <span class="tag shelf-fam">${FAMILIES[mainFamily(r.frag)].label}</span>
      <span class="shelf-bar"><i style="width:${r.pct}%"></i></span>
      <span class="shelf-pct">${r.pct}%</span>
    </button>`).join('');
  $$('#shelf .shelf-row').forEach(btn => btn.addEventListener('click', () => {
    focusFrag(btn.dataset.id);
    $('#hero-result').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));

  hydrateSnaps();
  observeReveals();
}

function focusFrag(id) {
  const r = ranking.find(x => x.frag.id === id);
  if (!r) return;
  fillHero(r, !state.viewer);
}

function hydrateSnaps() {
  $$('img[data-snap]').forEach(img => {
    const frag = FRAGRANCES.find(f => f.id === img.dataset.snap);
    if (!frag) return;
    try { img.src = snapshotBottle(frag, img.closest('.runner') ? 300 : 180); }
    catch { img.replaceWith(fallbackGlyph(frag)); }
  });
}
function queueSnapshots() { hydrateSnaps(); }

function fallbackGlyph(frag) {
  const d = document.createElement('div');
  d.className = 'glyph-fallback';
  d.style.background = `linear-gradient(160deg, ${frag.bottle.juice}, transparent)`;
  d.textContent = frag.name[0];
  return d;
}

function retake() {
  state.step = 0;
  state.answers = {};
  state.texts = {};
  state.finished = false;
  updateAnalysis();
  setDepth(0);
  $('#results').hidden = true;
  quizEl.hidden = false;
  renderStep();
  quizEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- landing hero: a slow tour of the shelf ----------

const TOUR = ['br540', 'bleu-de-chanel', 'le-male', 'sauvage', 'la-vie-est-belle'];
let tourIdx = 0;

function startHero() {
  if (reducedMotion) return;
  try {
    state.heroViewer = new BottleViewer($('#hero-canvas'));
    state.heroViewer.setFrag(FRAGRANCES.find(f => f.id === TOUR[0]));
    state.heroViewer.resize();
    state.heroTimer = setInterval(() => {
      tourIdx = (tourIdx + 1) % TOUR.length;
      state.heroViewer.setFrag(FRAGRANCES.find(f => f.id === TOUR[tourIdx]));
    }, 6500);
  } catch { /* hero bottle is decoration; the quiz works without it */ }
}

function stopHero() {
  clearInterval(state.heroTimer);
  if (state.heroViewer) { state.heroViewer.dispose(); state.heroViewer = null; }
}

// ---------- staggered reveals ----------

let io = null;
function observeReveals() {
  if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(el => el.classList.add('in')); return; }
  if (!io) {
    io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: .15 });
  }
  $$('.reveal:not(.in)').forEach((el, i) => { el.style.setProperty('--i', i % 6); io.observe(el); });
}

// ---------- boot ----------

$('#start-btn').addEventListener('click', startQuiz);
$('#retake-btn').addEventListener('click', retake);
$('#nav-quiz')?.addEventListener('click', e => e.preventDefault());
startHero();
renderLive();
observeReveals();

// labels bake the display face into canvas textures; redraw the tour once the
// webfont has actually landed so the first bottles aren't set in the fallback
document.fonts.ready.then(() => {
  if (state.heroViewer && !reducedMotion) {
    state.heroViewer.setFrag(FRAGRANCES.find(f => f.id === TOUR[tourIdx]));
  }
});

// test hook for the headless e2e drive; harmless in production
window.__pf = {
  get state() { return state; },
  get profile() { return profile; },
  get ranking() { return ranking; }
};
