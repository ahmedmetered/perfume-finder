# PRODUCT.md — Perfume Finder

## What this is

A quiz-based fragrance recommender: six questions (or free-typed words) match you against a curated library of 40 famous fragrances, and the winner is presented as a procedurally generated 3D bottle that echoes the real bottle's iconic design.

## Who it is for

People who know nothing about perfume and want one good recommendation without jargon; the audience is also anyone Ahmed sends it to as a portfolio piece, so the presentation itself is the product's proof of craft.

## The mechanism (unique thing)

Every answer literally lights the room: the interface's ambient color is the juice color of the current best match, so you watch your scent emerge as color before you see the result. Bottles are the hero object — each of the 40 has its own recognizable silhouette, cap, and glass treatment built in three.js, never stock photos.

## Success

- The visitor's first instinct is to play with the bottle.
- The result feels like unwrapping something, not reading a report.
- Ahmed is proud to put this in front of recruiters as his craft.

## Constraints

- Static site, no build step, no API; all scoring local. Three.js via CDN import map.
- Curated library framing: not a database, rough price bands, no commerce.
- Light and dark both exist; dark is the natural scene (evening, boutique, choosing a scent).
- Plain-English copy; no hype.
