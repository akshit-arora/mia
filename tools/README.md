# tools/

| File | npm script | Purpose |
|---|---|---|
| `validate-pack.mjs` | `npm run validate` | Checks `src/data` and `src/locales` (ids, zones, winnable levels, locale keys, fact length, no entity-specific code). Exit 1 on error. |
| `validate-lib.mjs` | | Pure `validatePack(pack, locales, opts)`, unit-tested in `tests/validate.test.ts`. |
| `check-size.mjs` | `npm run size` | Gzip size budgets for `dist/` (`size-budget.json`). Needs a prior `npm run build`. Exit 2 if `dist/` is missing. `--json` for machine output. |
| `bake-emoji.mjs` | `npm run bake` | Bakes emoji art to the pixel atlas. |
| `bake-emoji.mjs --entities src/data/card-icons.json` | `npm run bake:cards` | Bakes the card atlas (food, home, star icons) into `src/gen/card-atlas.png`. Canvas-drawn icons live in `src/cards/icons.ts`. || `audio-pack.mjs` | `npm run audio:pack` | Packs audio into the core and per-language packs. |
| `check-sources.mjs` | `npm run check:sources` | Checks `sounds/SOURCES.csv` licences. |
| `booth/recording-booth.html` | | Browser page to record voices. Microphone needs `localhost` or https. |
