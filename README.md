# Perfume Finder

A quiz-based fragrance recommender with procedurally generated 3D bottles. Six multiple-choice questions, each with a free-text alternative that is analyzed locally in real time, then a ranked shelf with a 3D bottle built for the top match.

**Live: https://ahmedmetered.github.io/perfume-finder/**

## What it does

- **Quiz with real-time local analysis.** Six steps: budget, season, audience, scent family, occasion, intensity. Every step also takes free text ("cozy vanilla for winter nights"), which is read against a small keyword map in the browser. The top-3 panel recomputes on every answer and every keystroke. No API, nothing sent anywhere.
- **Weighted scoring.** Answers build one profile across family, season, occasion, presence, budget, and audience. The 40-fragrance library is scored against it on every change, and the strongest matching dimensions become the "why" lines shown with each result.
- **Procedural 3D bottles.** Every bottle is generated at runtime with three.js: a lathe-turned glass silhouette (MeshPhysicalMaterial transmission), juice colored by scent family, a metal cap, and a label drawn onto a canvas texture at runtime. Auto-rotate plus drag to inspect. No 3D models, no product photography.
- **Design system carried over from my portfolio** (ahmedmetered.github.io): the same tokens, the liquid-glass capsule, pill geometry, and light/dark modes, extended with the quiz, the live analysis panel, and the 3D stage.

## The data

The library is a **curated shelf of 40 well-known fragrances**, summarized from public note pyramids. It is not a database and makes no claim to be one. Price tiers are rough bands, seasons and occasions are consensus impressions, and there are no affiliate links or commerce of any kind.

## Running it

No build step and no dependencies:

```
node scripts/serve.mjs        # http://localhost:8790
```

or any static file server pointed at the folder. three.js loads from a pinned jsdelivr CDN version through an import map, so an internet connection is needed for the 3D part; the quiz and scoring degrade gracefully without it.

Scoring (`js/scoring.js`) and the keyword map (`js/keywords.js`) are pure functions with no DOM access, so they run under plain node for tests.

## Structure

```
index.html          markup + import map
style.css           design system tokens + components
js/data.js          the 40-fragrance curated library
js/keywords.js      free-text keyword map
js/scoring.js       weighted scoring + why-lines (pure)
js/bottles.js       procedural bottle builder, viewer, snapshots
js/app.js           quiz flow, live panel, results
scripts/serve.mjs   zero-dependency static server
```

## License

MIT.
