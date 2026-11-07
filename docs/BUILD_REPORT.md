# Stage 3 addendum (2026-11-07): Card clash, polish, docs

**Card clash (Trump mode)**: `src/games/trump/` (`index.ts` screen and frame loop, `logic.ts` pure rules, `art.ts` pre-rendered art, `sounds.ts` synth recipes), registered as game `trump` with no shelf (`GameDef.shelf` is now optional; `gameById()` added to the registry); a picture button (two crossed cards) on the home screen between the truck and the corner buttons. The three doors are unchanged. Tests: `tests/trump.test.ts` (11).
- Menu: two pictures, a phone with a card (play with the phone) and two children (pass the phone). Fewer than 4 owned cards: a padlock over the owned cards and "?" slots, the three doors below (wordless "go and get more friends"; tap them to go home).
- Round: hand of 5 per side drawn only from owned cards (distinct when the collection allows; the two cards of a round are different animals from 6 cards up). Five rounds. The picker alternates. Powers: the stats both cards store (size, speed, strength) plus a shared "cuddly" fun score every card has (`CUDDLY` table, draft), so every number shown is visible on both cards (2 or 3 choices; the one thing not done is a number the other card does not display). The chosen row is outlined on both cards, two bars grow with ticks, the bigger one flashes gold. Tie: both sparkle. Winner: hop, star burst, its own funny reaction and animal sound. Other card: a little tilted shrug and a soft "bwomp". Nothing is lost: hands and owned cards are never modified (tested).
- Phone side: it chooses which of its unplayed cards to show and, on its own turn, which power to pick, aiming at a coin flip (55 percent child wins) it never explains. Seeded win rates over 400 matches: a child picking at random 39 to 44 percent, a child always picking the best power 49 to 59 percent (4, 6, 9 and 14 cards). A child who always picks the worst power still wins about 26 to 31 percent (that case is bounded only above 20 percent). `?seed=N` fixes the draw.
- Friend mode: a coloured "pass the phone" screen before each round (blue left, orange right); the picker sees their card, the other card is face down. Voice: card name when a card is shown, "Pick a power!" once in the first round, win/lose/tie/pass/done/locked lines (Scene R, 7 keys; the booth was regenerated: 115 keys, 18 scenes).
- Real buttons: stat tiles, menu pictures, pass screen, end screen (keys 1 to 3 pick); Escape returns to the menu.

**Polish**
- Corner buttons (sound, captions, grown-ups): while a game is open (`body.ingame`) they are 40 px, 55 percent opaque and in the top right; on home, shelves and cards they stay bottom right. Forage Trail and Morning Round move their food badge (and the farm sun) left of the buttons by measuring them. Checked on 812x375 and 900x405 for all three games and Card clash; the house game has nothing in that corner.
- Morning Round: the stable's hay bale was at the canvas edge (clipped at every width) and is now left of the stable; the coop fence is light wood. A pair of eyes peeks through a crack in the door on each chore tap (4 fills, never shows which animal; the animal still appears only at the end); the max stayed at 23 calls.
- `src/games/demo.ts` is imported only when `import.meta.env.DEV`, so it is not in the production bundle (verified: no demo chunk, no reference in `main-*.js`).
- `?fps` overlay (`src/ui/fps.ts`, a probe in `Stage`): all pages and games, fps, worst tick gap, draw ms (average, max) and canvas calls (latest, max); nothing runs without `?fps` apart from one regex and a null check per frame.
- First run: with no cards a white glove bobs over the Jungle door; it never shows once a card is owned (all three doors were already open).
- "Start again" in the Grown-ups corner already needs two taps (the button turns into a confirm button) before it clears cards and settings progress; left as is. The two-tap state does not time out; a child who taps the corner button twice in a row after opening the dialog would still erase everything, but the dialog itself needs a one-second hold or three quick taps to open.
- Names: the English locale and the design docs now say Balu and Bittu everywhere; hi.json had the old Hindi names (Bholu, Chiku) and was changed to Balu and Bittu in Devanagari (unreviewed). Bholu the truck and Chiku the sparrow (captions) remain, as intended.
- Offline: `dist/sw.js` was inspected, not run. It precaches 16 entries: `index.html`, `sort.html`, `main-*.js`, `sort-*.js`, the preload helper (js and css), the register and workbox-window scripts, both atlases, icons and manifest. `navigateFallback: index.html` with `navigateFallbackDenylist: [/sort\.html/]` so the classic game page is served from its own precache entry. `globPatterns` include `webm` and `json`, which covers the audio packs (`speech.webm`, `animals.webm`) when they exist. Not exercised in a browser (the Browser pane will not register service workers).

**Measured** (dev server, Browser pane 812x375 and 900x405, timer-driven frames, `?fps`): canvas calls per frame, maximum: home 10, shelves 1, card view 16, Forage Trail 22, Morning Round 23, Play Yard 22, Card clash 22 (limit 25). Draw time: average 0.1 to 0.6 ms, max 2.5 ms (desktop only). Size: total first install 90.7 KB gzip (app code 74.9, art 5.7, icons and service worker 10.1) of the 400 KB budget; the main script is 45.6 KB gzip. `npm run ci` green (146 tests: 135 before plus 11 for Card clash).

**Not verified**: a real phone or touch, sound by ear (every sound is synthesized or a caption), the service worker and offline in a browser, Safari and Firefox, screen readers, Card clash with two real children, whether children understand the pass-the-phone picture, the Hindi names.

**Shortcuts and open decisions**
- Card clash does not let the child choose which card of the hand to play (cards come in hand order; the phone chooses its own). The hand is shown only as the five round dots.
- The "cuddly" score and the numbers are drafts for the owner (H21). A stat a card does not store is never compared (the logic still has a made-up fallback for tests and safety).
- The pass screen tints half the screen; the picker's card back wobbles; no voice names the player.
- The end screen shows the child's five cards and confetti for about five seconds and then returns to the menu by itself (tap anywhere to leave sooner).
- `GameDef.shelf` is optional now: a game without a shelf does not open from a door.

---

# Stage 2b-FARM addendum (2026-11-07): Morning Round, the Farm door's game

`src/games/farm/` (`index.ts` game and frame loop, `logic.ts` pure rules, `art.ts` pre-rendered art, `sounds.ts` synth recipes), registered as game `farm` on shelf `farm`; one import line in `src/main.ts`; tests in `tests/farm.test.ts` (14).
- Tap only. Bholu pulls a hay trailer along the farm lane (tap the cart to honk) for a 16 s warm-up, then a fork of three picture signposts: grass, leaves, seeds (the only three foods the farm cards use; shared icon kit). Tap a sign: the cart rolls into that animal's home yard (hen coop, cow barn, buffalo thatch shed, goat rock pen, horse stable). Four chores, 10 taps: feed the card's food, two helpers (hen: eggs, water; cow: milk pail, water; buffalo: mud, water; goat: stepping rock, hay; horse: brush, hay), then tap the door. The animal walks out to the cart, then `api.reveal`. About 60 to 90 s with the reveal. A missed tap only pulses the glow. No timers, lives, scores, random rewards.
- Grass leads to cow, buffalo or horse (an unowned one first, taking turns); leaves to goat; seeds to hen. The fork always shows all three foods in a changing order, so every animal is always reachable. The cow is farm only.
- Real `<button>` hotspots (46 logical px, at least 56 CSS px) over the picture: Tab, Enter, Space, keys 1 to 3 at the fork. Reduced motion removes bobbing, particles and shakes.
- New locale keys: `farm.pick`, `farm.tap`, `farm.look` (voice lines, Scene P in the recording script), `farm.door` (caption for the door creak), `farm.aria`.
- Measured (production build, Browser pane, 812x375, timer-driven frames): draw time average 0.11 ms, max 1.6 ms; at most 23 canvas calls per frame (every drawImage and fill counted by patching the context; limit 25). Total first install 83.1 KB gzip with the house game present.
- Not verified: a real phone or touch, sound by ear, swipe (not used), Safari and Firefox, high contrast and reduced motion by eye, the service worker.
- Shortcuts: the animal is hidden behind a closed door until the end (the reactions per tap are on the props and the door, not the animal); chore buttons share one aria label ("Tap the glowing thing!"); the fork imports `signBoard`, `foodBadge`, `shelfStrip`, `butterflies` from `src/games/forage/art.ts`; the horse has no treat (its card food is grass); hi.json has no farm keys (falls back to English).

# Stage 2b-HOUSE addendum (2026-11-07): Play Yard, the House door's game

`src/games/house/` (`index.ts` game and frame loop, `logic.ts` pure rules and timeline, `art.ts` pre-rendered art, `sounds.ts` synth recipes, `store.ts` the `mia.house.v1` save), registered as game `house` on shelf `house`. Tests: `tests/house.test.ts`.
- Round: the pantry (a shelf with three food pictures: bone, milk, carrot; no text) -> the chosen food flies into the bowl and its pet runs from its own home (dog from the kennel, cat from the basket, rabbit from the hutch) -> tap anywhere (or Space/Enter/arrows) to throw the pet's own toy (ball, yarn, leaf ball), 4 to 6 throws, each fills one heart and nothing can fail; funny mishaps per pet (dog fetches, skids past, digs; cat pounces, gets tangled in the yarn, bats it away; rabbit hops, wanders sideways, nibbles the toy) -> the pet eats the food from the bowl in three munches, walks home and curls up -> the child paints the home and the toy in one of three colours (red, blue dots, yellow stripes; saved per pet in `mia.house.v1`) -> `api.reveal(pet)` (repeat = shared star level-up). The food and the home are the play, not decoration (the Reality Check's chocolate-covered-broccoli objection).
- Pantry: all three pets are always on offer (each food brings a different pet, no wrong choice). The suggested pet (unowned first, least played, not the one just played) sits in the middle with the bobbing/hand hint, and on every third pantry on the left or right, so a child who always taps one slot still meets every pet.
- Touch note kept from Stage 2a: pointers are read from the overlay `container`. Pantry and paint choices are real HTML buttons (keyboard, screen readers, 56 px minimum); a 450 ms guard ignores a double tap that opened the door.
- Shared edits: one import line in `src/main.ts`, 8 locale keys (`house.*`, 4 spoken + 3 decoration names + aria), Scene Q in the recording script (4 spoken lines). The booth was NOT regenerated.

# Stage 2a addendum (2026-11-07): Forage Trail, the Jungle door's game

`src/games/forage/` (`index.ts` game and frame loop, `logic.ts` pure rules, `art.ts` pre-rendered art, `sounds.ts` synth recipes), registered as game `forage` on shelf `jungle`. The throwaway prototype (`src/proto`, `forage.html`, its vite input, denylist entry, the design note) is deleted and its own shelf key `mia.forage.shelf.v1` is gone: the HUD shelf is the real Jungle shelf from the shared card progress.
- Round: 22 s warm-up run (sparkles, flowers), a fork of three signposts (one food each, never a duplicate, at least one leads to an animal not yet owned, least-shown foods rotate so every animal is reachable within a few rounds), about 8 pickups of the chosen food, a short "something is coming" beat (rustling bush), then `api.reveal(animal)`. Repeats give the shared level-up star. No timers, lives, scores or fail states; only 25 percent of items spawn in the basket's lane.
- Foods: fruit (monkey), honey (bear), sugarcane (elephant), seeds (peacock), the plain covered meal bowl (lion or tiger, whichever is not owned, else alternating). Lion and tiger: the bowl is carried to a feeding rock; no meat, prey or hunting is shown. Scenery changes by food (banana trees, hives, cane field, seed bushes, savannah). Gags: a monkey swinging by, two butterflies.
- Small shared edits: `audio.play(recipe)` (a game plays its own synthesized sounds), `setCaptionStyle` in `captions.ts` (this game hides sfx captions the picture already shows and the speaker icon on spoken captions; reset on exit), 4 locale keys (`forage.*`), Scene O in the recording script (3 spoken lines; booth regenerated, 101 keys, 15 scenes), elephant card food changed from leaves to sugarcane (data, line `card.food.elephant`) so the reveal and the game show the same food.
- Overlay note for game authors: the game's `.game-root` overlay covers the canvas, so `stage.onDown` never fires; read pointer events from `container` (see `index.ts`).

# Stage 1 addendum (2026-11-07): the card-game foundation

Stage 1 of the "complete game": the shared foundation that the three Stage 2 games (Forage Trail, Morning Round, Play Yard) plug into. Verified on this Mac in the Browser pane only (812x375 viewport, scale 2); nothing was run on a phone or heard by ear.

**What changed**
- `index.html` + `src/main.ts` are now MIA (home screen, shelves, card view, reveal). The old sorting game is unchanged in behaviour at `sort.html` + `src/sort-main.ts`, linked from the Grown-ups corner as "Classic sorting game" (and the sorting game's corner gets a "Back to MIA" link). Manifest name is "MIA Toy Box" (short name "MIA"). Both pages are precached so each loads its own entry offline; `sort.html` is on `navigateFallbackDenylist`. (`forage.html`, the throwaway prototype, was deleted in Stage 2a.)
- Data: `src/data/cards.json` (14 cards), `src/data/card-icons.json` (icon registry: id, group, emoji or canvas-drawn, shape, colour), locale keys (`card.*`, `food.*`, `home.*`, `type.*`, `stat.*`; Hindi stub has names, places, foods), baked card atlas `src/gen/card-atlas.{png,json}` (`npm run bake:cards`), canvas-drawn icons in `src/cards/icons.ts`.
- Code: `src/cards/` (data, progress, kit, scenes, icons, reveal), `src/app/` (shell, registry, home, shelves + card view), `src/games/demo.ts` (debug only).
- Storage: new key `mia.cards.v1` (`{v:1, cards:{id:level}}`), in-memory fallback, newer-version data is never overwritten. Settings still use the old progress key, so the Grown-ups corner works as before. "Start again" in the corner now also empties the shelves.
- Recording script: new section 4b (scenes K to N, 47 new keys). The booth was regenerated; `tests/audio-booth.test.ts` expectations went from 51 to 98 keys and 10 to 14 scenes (the test compares the booth with the script, so the count must change when keys are added).

**Plug-in interface for Stage 2** (`src/app/registry.ts`): `registerGame({ id, shelf, start(container, api) })`, import the game file in `src/main.ts`. `api` gives `stage`, `kit` (pre-rendered animals, icons, scenes), `audio`, `caption()`, `reveal(animalId)` (earns the card and plays the reveal; do not also call `earn()`), `earn()`, `owned()`, `levelOf()`, `exitButton()`, `exit()`, `onExit()`, `isRevealing()`. A registered game turns its home door from "wobbling closed door" into an open door. Try it with `?demo` (three stand-in games: tap the picture, get the next animal of that shelf).

**Debug URL flags**: `?unlock=all` (fills shelves, writes nothing), `?debug` (exposes `window.__mia`, counts draw time), `?timerraf` (timer-driven frames for hidden browser panes), `?demo`, `?screen=shelves`, `?card=lion`, `?reveal=tiger`.

**Measured (Browser pane, desktop Chrome, production code under Vite dev server)**
- Reveal, first earn: 7.6 to 8.1 s before the final timing trim; after it the two longest actions (hen 1.8 s, peacock 1.7 s) measured 7.74 s and 7.65 s; repeat earn 2.65 s; reduced motion 5.15 s first, 2.26 s repeat. Frame rate about 29 fps (30 fps cap).
- Canvas calls per frame (every fill, stroke, drawImage counted by patching the context): home 9, shelves 1, card view 16 (peacock fan), reveal peak 17 (peacock) and 13 for the others; limit is 25.
- Draw time: average 0.1 to 0.2 ms, one-off 7.7 ms hitch seen once in the first peacock reveal (before pre-warming art; after it the max over 10 reveals was 0.7 to 1.5 ms). These are desktop numbers and say little about an old Android phone.
- Size (`npm run size`): total first install 67.4 KB gzip (was 47.8), app code 50.0 KB of 150, art 7.2 KB of 40, total budget 400 unchanged. Nothing raised.

**Not verified**: a real phone (touch targets are at least 56 CSS px at the tested scale; at scale 1 the CSS min size enlarges them), sound by ear (every line is caption plus synthetic or live speech until recorded), the service worker and offline loading (the Browser pane refuses to register service workers, so only the generated `dist/sw.js` precache list was inspected: it lists `index.html`, `sort.html` and all assets), Safari, Firefox, screen readers, high-contrast mode by eye, the Hindi stub by a speaker.

**Shortcuts taken**
- Reactions (`src/game/reactions.ts`) allocate one small object per frame during the 1.3 to 1.8 s funny action; everything else in the frame loops is allocation-free.
- Drawn icons are my own simple flat art (grass, sugarcane, seeds, meal bowl, milk, barn, three type badges); they have not been looked at by a designer or a child.
- Homes are only Jungle, Farm, House (no kennel or coop): the home fact is therefore nearly the same as the shelf. Adding a 4th and 5th home needs two icons and `cards.json` edits only.
- The demo games and `?` flags ship in the production bundle (0.4 KB).
- The parent-corner backup code covers only the old progress (settings and sorting game), not the cards.
- (Stage 1 left the prototype Forage Trail separate; Stage 2a folded it in, see the next section.)

**Open decisions for the owner**
1. The 14 names (Sheru, Veeru, Gajju, Bunty, Bholu, Neelu, Gauri, Kalu, Chintu, Kuku, Chetak, Moti, Mini, Chiku). Clash: the bear is "Bholu" like the truck, the rabbit is "Chiku" like the sparrow. Both are flagged `review` in `cards.json`.
2. The two stats per animal (all draft, deliberately exaggerated) and the stat kinds (loudness is allowed but unused).
3. Carnivores: lion and tiger show a plain covered bowl (`food.meal`) and the voice line says "Lions eat meat!". The validator enforces that this icon stays canvas-drawn (never an emoji) and the animals stay flagged `review`.
4. "Cats love milk" and "Dogs love bones" are common beliefs that adults may flag (teacher review).
5. Whether the reveal's 7 to 8 seconds is too long for a child who has seen it many times (repeat earns are 2.6 s; the long-press skip exists).

---

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
