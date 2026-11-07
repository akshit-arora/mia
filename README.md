# MIA

**MIA** is a toy box for children aged about 6 to 7: little games that give you animal friends to collect. It is a prototype. The names, the card numbers and the facts have not had a teacher review, and every sound is synthesized until the voice lines are recorded.

Pick a door on the home screen and play:

- **Jungle door: Forage Trail.** A basket with eyes runs down a forest path. Choose a food sign, gather it, and a wild friend (monkey, bear, elephant, peacock, lion or tiger) comes out of the bushes.
- **Farm door: Morning Round.** Bholu the truck takes a hay cart to a farm home. Do the chores, open the door, meet a farm friend (cow, buffalo, goat, hen or horse).
- **House door: Play Yard.** Feed a pet, throw its toy, paint its home, meet a pet (dog, cat or rabbit).
- **Card clash** (the crossed-cards picture on the home screen). Every friend you have won is a card with an animal, a name, a type badge, a food and a home, and three powers. Play five rounds against the phone, or pass the phone between two children: pick a power, the bigger number wins. Nothing is ever taken away, there is no score and no timer. You need four cards to play.
- **Shelves** (the shelf picture, bottom left). Fourteen slots in three rows. Won cards sit there; tap one to hear the animal. A repeat win adds a star to the card.

The old sorting game ("Animal Express: drop each animal where it lives") is kept: it lives at `sort.html` and opens from the Grown-ups corner (hold the gear for a second, or tap it three times).

An offline-first PWA, plain canvas, no runtime dependencies. Plan and decisions: [docs/PLAN.md](docs/PLAN.md) (see D17 for the change of direction). Game designs: [docs/design/THREE_GAMES.md](docs/design/THREE_GAMES.md). What is built and what is not verified: [docs/BUILD_REPORT.md](docs/BUILD_REPORT.md). Testing on a phone: [docs/PHONE_TEST.md](docs/PHONE_TEST.md).

## Privacy promise
No accounts, no ads, no analytics, no network calls after install. Cards, progress and settings stay on the device (local storage). Nothing leaves it.

## Quick start
```
npm install
npm run dev -- --host   # dev server at http://localhost:5173 (and on your Wi-Fi, for a phone)
npm test                # unit tests (vitest)
npm run validate        # check data and locales
npm run build           # type-check and production build into dist/
npm run preview         # serve dist/ at http://localhost:4173
npm run size            # gzip budgets for dist/ (run build first)
npm run ci              # validate, source check, tests, build, size
```
Recording booth: open `tools/booth/recording-booth.html` from `localhost` or an https page (the microphone needs a secure context), record, then run `npm run audio:pack`. The booth is generated from `docs/RECORDING_SCRIPT.md` with `node tools/booth/build-booth.mjs`.

## Debug URL flags (development and phone testing)
`?fps` shows a small frame-rate overlay on every page and game (fps, worst frame, draw time, canvas calls). `?debug` exposes `window.__mia` and per-game helpers. `?unlock=all` shows every card as owned and saves nothing. `?timerraf` drives frames with timers (hidden browser panes). `?demo` (dev server only) adds three stand-in games for the plug-in interface. `?seed=N` fixes Card clash's random draw. `?screen=shelves`, `?card=lion`, `?reveal=tiger` jump to a screen.

## Contribute content (data, not code)
Animals, foods, homes, powers and names are data: `src/data/cards.json` and `src/data/card-icons.json`, with text in `src/locales/`. See [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) and [CONTRIBUTING.md](CONTRIBUTING.md). `npm run validate` tells you what is wrong, by file and id. A new game is one file that calls `registerGame()` (see `src/app/registry.ts`).

## Project structure
```
index.html, src/main.ts   MIA: home, shelves, card view, reveal, games
sort.html, src/sort-main.ts   the classic sorting game (Grown-ups corner)
src/app/          shell (screens, overlay buttons), registry (game plug-ins), home, shelves and card view
src/cards/        card data, progress store (mia.cards.v1), art kit, scenes, icons, the reveal
src/games/        forage/ farm/ house/ (one per door), trump/ (Card clash); each has index, logic (pure), art, sounds
src/engine/       plain-canvas micro-engine (logical canvas, integer scaling, 30 fps, tweens)
src/audio/        synthesized sounds, speech pack player, captions hooks
src/ui/           captions, Grown-ups corner, ?fps overlay
src/data/         cards.json, card-icons.json (and the sorting game's entities, zones, levels)
src/locales/      en.json (keys of truth), hi.json (stub)
src/gen/          generated art atlases
tools/            validator, size check, bake, audio pack, recording booth
docs/             plan, designs, build report, phone test, human tasks, recording script
tests/            vitest tests (rules, cards, each game's pure logic, audio, booth)
```

## Scripts
| Script | What it does |
|---|---|
| `dev` / `preview` | Vite dev server / serve the build |
| `build` | `tsc --noEmit` then `vite build` |
| `test` | `vitest run` |
| `validate` | `tools/validate-pack.mjs` |
| `size` | `tools/check-size.mjs` against `tools/size-budget.json` |
| `bake` / `bake:cards` | `tools/bake-emoji.mjs` (animal atlas / card icon atlas) |
| `audio:pack` | `tools/audio-pack.mjs` |
| `check:sources` | `tools/check-sources.mjs` (sound licences) |
| `ci` | validate, check:sources, test, build, size |

## Accessibility
Captions for every sound (off, on, auto; three sizes), always-visible visual cues for audio, high-contrast mode, reduced-motion support, large touch targets, real buttons over the pictures (keyboard and screen reader), mute, optional vibration, and no time pressure, scores that punish, or failure screens. The corner buttons (sound, captions, grown-ups) fade and move to the top right while a game is open.

## Licence
MIT, see [LICENSE](LICENSE). Third-party art and sound credits, which keep their own licences: [CREDITS.md](CREDITS.md).
