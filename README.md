# MIA

**MIA** is an open-source home for tiny, joyful learning games. The first game is **Animal Express**. It is a prototype: the content has not yet had a teacher review, and the animal sounds are synthesized placeholders.

An offline-first PWA of tiny games for children aged 6 to 7. Drive the truck, open the crate, deliver each animal to where it lives. Built so a new pack (animals, plants, food, family) is mostly data. Full plan: [docs/PLAN.md](docs/PLAN.md).

## Privacy promise
No accounts, no ads, no analytics, no network calls after install. Progress and settings stay on the device (local storage). Nothing leaves it.

## Quick start
```
npm install
npm run dev        # dev server (http://localhost:5173)
npm test           # unit tests (vitest)
npm run validate   # check data + locales
npm run build      # type-check and production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
npm run size       # gzip budgets for dist/ (run build first)
npm run bake       # bake emoji art into the atlas
npm run audio:pack # build the core and per-language audio packs
```
Recording booth: open `tools/booth/recording-booth.html` from `localhost` or an https page (the microphone, `getUserMedia`, needs a secure context), record, then run `npm run audio:pack`.

## Contribute content (data, not code)
Add animals, levels, zones, languages and Wonder facts by editing JSON in `src/data/` and `src/locales/`. See [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) and [CONTRIBUTING.md](CONTRIBUTING.md). `npm run validate` tells you what is wrong, by file and id.

## Project structure
```
src/types.ts      generic data model (Entity, Zone, LevelConfig)
src/data/         entities, zones, levels (JSON)
src/locales/      en.json (keys of truth), hi.json (stub)
src/engine, game, ui   canvas engine, Deliver mechanic, screens
src/audio/        audio manifest and player
src/gen/          generated art atlas
sounds/           sources and SOURCES.csv
tools/            validator, size check, bake, audio pack, recording booth
docs/             plan, animals, content guide
tests/            vitest tests
```

## Scripts
| Script | What it does |
|---|---|
| `dev` / `preview` | Vite dev server / serve the build |
| `build` | `tsc --noEmit` then `vite build` |
| `test` | `vitest run` |
| `validate` | `tools/validate-pack.mjs` |
| `size` | `tools/check-size.mjs` against `tools/size-budget.json` |
| `bake` | `tools/bake-emoji.mjs` |
| `audio:pack` | `tools/audio-pack.mjs` |
| `check:sources` | `tools/check-sources.mjs` (sound licences) |
| `ci` | validate, check:sources, test, build, size |

## Accessibility
Captions for every sound (off, on, auto; three sizes), always-visible visual cues for audio hooks, high-contrast mode, reduced-motion support, large touch targets, mute, optional vibration, and no time pressure or failure screens. Details in PLAN section 9.

## Licence
MIT, see [LICENSE](LICENSE). Third-party art and sound credits, which keep their own licences: [CREDITS.md](CREDITS.md).
