# DESIGN.md — Perfume Finder ("the deep dive")

World: choosing a scent is a descent. The page starts at the bright surface
and every answered question deepens the water (`--depth` 0..1 drives a
multi-stop background gradient from #3E98B8-lit surface water down to the
#070B14 abyss). The only saturated light is bioluminescent: `--glow` carries
the current best match's juice color and tints the ambient gradient, the wall
bars, and the 3D scene's accent light. Lamp-gold (#E4C88A) is reserved for the
focused bottle and the primary action.

## Tokens

- Depth strata: `--abyss #070B14` · `--deep #0C1524` · `--stratum #12203A` · `--surface #101A2C`
- Ink `#EDF2F8` · muted `#9AB0C4` · faint `#5E7488` · line `rgba(140,180,220,.14)`
- Lamp `#E4C88A` (focused-object only) · `--glow` dynamic (juice of current leader)
- Family hues come from the fragrances themselves (`FAMILIES[*].juice`)

## Type

- Display: **Bodoni Moda** (hairline fashion serif) — headline, question titles,
  result name, rank numerals, depth labels.
- UI/data: **Hanken Grotesk** 400–700 — everything else, kept clear of the
  glowing object (Riley-gallery donation).
- Display tracking ~0; UI slightly negative on big numerals only.

## Components

- Top bar: fixed, quiet, carries the live depth read (`surface · 0 m` →
  `3,700 m · your scent`) with a glow bead.
- Descent rail: desktop-only vertical wire with a gold bead that travels as
  the dive deepens.
- Question card: sub-surface glass (`color-mix` 86%), stratum options that
  glow in `--glow` when selected, free-text input under a hairline divider.
- The wall: live top-3 ribbon; bars ease with ballistic overshoot
  (VU-bridge donation), each row lit in its own juice color.
- Results: the abyss. Bodoni Moda name with a glow shadow, count-up match,
  the bottle lit by a warm lamp key plus a juice-colored accent light,
  note pyramid as a specimen plate.
- Motes: seven drifting specks (marine snow), opacity falls with depth.

## Motion

One authored arc: the descent. Step entrances rise once; bars are ballistic;
the reveal counts up while the water reaches full depth. `prefers-reduced-motion`
disables all of it.

## 3D bottles

Each of the 40 has a bespoke spec (`DESIGNS` in js/data.js) echoing the real
bottle: ten lathe/extrude forms (column, slab, flask, torso, orb, urn, taper,
ribbed, extruded star for Angel, beveled ingot for 1 Million), four glass
finishes (clear, frosted, tinted, opaque), gradient juices, speckled caps,
and canvas-baked labels in Bodoni Moda. Juice meshes are fully opaque by design:
transmissive shells render in a depth-writing pass and would otherwise
depth-reject a transparent liquid (the white-blowout bug).
