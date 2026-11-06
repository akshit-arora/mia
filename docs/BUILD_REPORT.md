# Build report: Milestone 0 and Milestone 1 (first playable)

Date: 2026-11-05. Everything below was run on this Mac (Node 20.20, Chrome-based Browser pane at a 900x500 viewport). Nothing was tested on a real phone, with real children, or with recorded voices.

## What was built

- Vite 8 + TypeScript PWA, `vite-plugin-pwa` (generateSW, autoUpdate), zero runtime dependencies. Relative `base`, no router needed.
- Plain-canvas micro-engine in `src/engine` (logical canvas short side 135, long side 240 to 300, integer scaling, pixelated, 30 fps with 60 fps while dragging, dirty-flag render with a 4 fps idle redraw, tweens, pointer capture, baked-atlas sprites, 5x5 pixel glyphs). No Phaser, no Kaplay.
- Generic data: `src/data/{entities,zones,levels}.json`, types in `src/types.ts`. Level configs carry only generic fields. The cow rule is data (`accepts: ["farm"]`, `noGag`); the validator greps `src/engine` and `src/game` for "cow" and fails if found.
- Deliver mechanic and Animal Express (`src/game`): first-launch intro (lion to Jungle, cow to Farm, dog to Home, only the right place accepts so a wrong drop is impossible), levels 1 to 8 (1, 2, 5 are replay pools), 14 animals, mystery crate (animal sound plays, crate shakes, pop, reveal), poke reactions for all 14, Wonder Bubbles for 6 animals (about one drop in three, tap reveals an action, spoken fact, picture sticker), silent per-animal confidence, hint fade (ghost hand at 3 s, hop at 6 s; faster in the intro), tap-then-tap, keyboard play (Enter, arrows, 1 to 3, Escape), session arc (one review level, one new level, sunset with fireflies and a sealed "?" crate), persistent park, local progress in localStorage with in-memory fallback, optional backup code (`AE1-...` with checksum).
- Parent corner (`src/ui/parent.ts`): real HTML buttons in a dialog with focus trap: captions Off/On/Auto, size, sound, high contrast, vibration, reduced motion, language, backup make/restore, reset with confirm, about. Opens by 1 s press-and-hold, keyboard/assistive click, or three quick taps.
- i18n: `src/locales/en.json` (all 45 script keys plus `cc.*`, `wonder.q.*`, `ui.*`, `parent.*`), `hi.json` stub (about 40 keys, unreviewed, falls back to English). Language switch verified live.
- Captions (`src/ui/captions.ts`): Off/On/Auto, real HTML text over the canvas, opaque pill, Bholu truck and Chiku bird icons, sound-description captions, at least 2 s on screen, captions also appear when audio is unavailable, three sizes, separate screen-reader live region. Reduced motion (phone setting or parent corner) disables animations, shakes, firefly flicker.
- Audio (`src/audio`, by the audio sub-agent): one facade, synthesized effects and 14 synthesized placeholder animal sounds, speech fallback chain (recorded pack, then speech synthesis only for a matching voice, then caption), limiter, ducking, ambience. No downloads.
- Tools: `tools/validate-pack.mjs`, `check-size.mjs`, `bake-emoji.mjs`, `audio-pack.mjs` (ffmpeg detected; manual steps printed if missing), `check-sources.mjs` + `sounds/SOURCES.csv` scaffold, `tools/booth/recording-booth.html` (generated from the script by `build-booth.mjs`), CI and deploy workflows in `.github/workflows` (written, not run), README, CONTRIBUTING, CREDITS, `LICENSE-TODO.md` (no licence chosen, no LICENSE file), `docs/CONTENT_GUIDE.md`.

## Measured sizes vs budget (npm run build, then node tools/check-size.mjs)

| Category | Gzip | Budget |
|---|---|---|
| App code (js, css, html) | 25.8 KB | 150 KB |
| Art (atlas.png) | 3.5 KB (3,603 B raw) | 40 KB |
| Audio core pack | 0 KB (no real recordings yet) | 100 KB |
| Audio game/language | 0 KB | 80 KB |
| Icons, manifest, SW, workbox | 10.0 KB | 40 KB |
| Total first install | 39.3 KB | 400 KB |

Micro-engine alone (`src/engine`, minified lib build, es2017): 5,154 B raw, 1,847 B gzip. Whole game bundle `main-*.js`: 67.7 KB raw, 22.9 KB gzip (about 15 KB of this is the two locale JSON files and synth recipes inside the audio module). Service worker precaches 9 files. The total will grow by roughly the 100 KB core audio pack plus voice lines once real recordings exist; the plan's 400 KB budget still has large headroom. D12 (micro-engine) is confirmed on size grounds: about 2 KB gzip against an estimate of 10 to 15 KB.

## Milestone 0 findings

- Baked 6 animals (lion, tiger, cat, cow, elephant, peacock) through the pipeline (Twemoji SVG, 4x supersample, shared 32-colour palette, 1 px outline) at 24 and 32 px. Contact sheets: `docs/prototype/contact-sheet.png` (plain) and `contact-sheet-boost.png` (contrast 1.25, saturation 1.2, light sharpen; now the default, costs about 650 B).
- Legibility, by visual inspection by one agent plus my own look at the in-game render: lion OK at 24 px (face-only reads fine), tiger OK but stripes marginal at 24, cat vs tiger separable by silhouette (tall upright cat, long low tiger) but close by colour and very close in greyscale, cow and peacock good, elephant reads by shape (face lines faint).
- What looks bad: tiger stripes at 24 px, peacock eye-spots turn to noise, elephant detail faint, buffalo is a dark blob close to the cow, bear is plain. Hand-pixel priority: tiger, buffalo, bear, elephant.
- In the running game the park shows animals at 24 px (pre-scaled with smoothing) and the carried animal at 32 px; both are clearly recognisable on screen. Cat vs tiger was not shown side by side in play.
- All 14 codepoints exist in the package. No wrong codepoints.
- Engine size measured (above). NOT done: drag test on a real old Android phone, and recording 5 sample lines for a phone speaker. Both need a human and a device.

## Test and verification evidence

- `npx vitest run`: 7 files, 58 tests pass (rules, level generation winnability, cow farm-only, backup code, locale coverage, audio recipes and facade in node, source check, booth zip including `unzip -t`, validator with bad fixtures).
- `npx tsc --noEmit`: clean. `npm run build`: succeeds. `node tools/validate-pack.mjs`: 14 entities, 3 zones, 11 levels, 0 errors, 1 warning (Hindi stub incomplete). `node tools/check-sources.mjs`: OK on empty folders. `node tools/check-size.mjs`: within budget (table above).
- Browser (Vite dev server, Browser pane): title screen with Go truck; first launch intro played through; real pointer drag of the lion into the Jungle; real tap-then-tap delivering a goat; real keyboard (Enter, ArrowRight, Enter) delivering a hen; Wonder Bubble drawn and a real click on the goat triggered the reveal and created the goat sticker; poke reaction on a resident; wrong-drop path exercised by script; sunset screenshot (night sky, sleeping animals with z, fireflies); a second session started with park persisted from localStorage and a review level; parent corner opened, language switched to Hindi stub, captions on showed speaker and sound captions.
- Production build served by `vite preview`: service worker active, 9 files precached; the preview server was then stopped and the page reloaded and still loaded (offline works, tested on this machine only).
- Network grep: the only fetches are the optional relative audio pack files; no analytics, trackers or external URLs in `src`.
- Independent review (Reality Checker, code reading only) found real issues, which I fixed and rebuilt: `globalThis`, `Promise.finally` and `flatMap` (old-Chrome crashers) replaced; separate pointercancel path; try/catch around the session loop; keyboard guard; ghost and hop hint tokens; reset of world state per session; focus back to the canvas after the parent corner closes; `prefers-contrast` support; HUD buttons 56 px; non-hold way to open the parent corner. After these fixes I re-ran tests, build and a full scripted playthrough (intro, level 3, sunset, second session) with no exceptions (only Chrome's console note that vibrate needs a user gesture, from scripted clicks).

## Assumptions

- Zones `targets` in a level mean "places that exist"; in intro levels only the entity's own place accepts a drop, so wrong drops are impossible as designed.
- After the intro, first launch continues with a short free-flow run of level 3 (4 crates), then sunset. Later sessions: one review level (random earlier level, up to 5 crates), one new level, sunset.
- A level unlocks after its prerequisite has two clean runs (a clean run has zero wrong drops).
- Park cap: 2 of each animal; the park never shrinks. Wonder facts at most 8 words (validated).
- Chiku's visual question per Wonder (`wonder.q.*`) is shown as caption text only; it is not in the recording script, so it has no voice line.
- 44 of the 45 script keys are triggered in play; `discover.again` is not yet used.
- Twemoji via `@twemoji/svg` 15.0.0 (the package has no CC BY file; licence attribution text is recorded in CREDITS with a TODO-VERIFY).
- Chrome 60 as device floor cannot be met: module scripts need Chrome 61. The known newer APIs were removed from the code, but no polyfills are included and no old device was tested. Realistic floor is about Chrome 61+.
- No colour-blind or greyscale simulation check exists in CI yet.

## Needs human

Blocking (before children can use it):
- Record the English voice using `docs/RECORDING_SCRIPT.md` and `tools/booth/recording-booth.html`, then run `npm run audio:pack`. Until then speech is live speech synthesis if the phone has an English voice, otherwise captions only.
- Source and license-check 13 animal sounds into `sounds/animals` with rows in `sounds/SOURCES.csv`. Current sounds are synthesized placeholders and have never been heard by a person; they may not sound like the animals.
- Teacher review of zones, cow = Farm, all 6 Wonder facts and the animal list.
- Choose the licence (`LICENSE-TODO.md`) and project name.
- Test on one real 2 GB Android phone (drag feel, performance, sound loudness, budgets) and with 3 to 5 children.

Non-blocking:
- Verify Twemoji copyright line upstream, then update CREDITS.
- Native-speaker review of the Hindi stub and a Hindi caption length dry run.
- Hand-pixel the weakest animals (tiger, buffalo, bear, elephant).
- Deaf or hard-of-hearing reviewer trial of a whole muted session.
- Enable GitHub Pages and confirm the workflows (not run here).

## Known defects

- Auto captions hide whenever any speech-synthesis voice matches the language, even if that voice speaks poorly; if audio output silently fails, captions will not appear in Auto.
- Screen-reader live region announces every line even when captions are off.
- Game timers (hints) keep running while the tab is hidden.
- `discover.again` and some script keys are not triggered in play yet; the Wonder bubble offers no replay prompt.
- The Go button after sunset appears over the park scene; the sealed crate moment is brief.
- Park layout overlaps sprites when a zone holds more than about six animals.
- Hindi stub captions fall back to English for most keys (by design).
- Hit-box size of 56 px for HUD buttons is below the plan's worst-case 64 CSS px; animals are large but not measured on a real phone.
- Audio WebAudio playback path, ducking, ambience, Opus-in-WebM decoding and the recording booth microphone and zip download were never exercised by a person or in a real browser session beyond the booth page loading.
- Old iPhones, Safari and Firefox were not tested at all.
- npm audit reported warnings on dev dependencies; not reviewed.

## Next steps

1. Record voices; run the audio pack; listen on a phone speaker (Milestone 0 sample-line check).
2. Source animal sounds; fill SOURCES.csv; replace placeholders.
3. Real-device test (old Android) for drag, 30 fps, memory and loudness; test with children against the Milestone 1 done criteria.
4. Add a greyscale and colour-blind palette check to CI; add tests for the Game class using a fake stage.
5. Hand-pixel the weak animals and recheck cat vs tiger in play.
6. Teacher review; pick licence and name; verify credits.
