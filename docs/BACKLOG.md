# Backlog: Milestones 0, 1, 2

Source of truth for scope: PLAN.md, ANIMALS.md, RECORDING_SCRIPT.md. All tasks start as `todo`.

**Owner key**
- `ORCH`: the Orchestrator and its agents can do it alone.
- `ORCH+H`: the Orchestrator prepares it, a human must finish, check or approve it.
- `HUMAN`: only the product owner (or a person they find). Details in HUMAN_TASKS.md (H-ids).

**Standing rules for every task:** no push, no account creation and no downloads without the owner's yes. Content changes cascade to PLAN.md, ANIMALS.md, RECORDING_SCRIPT.md and locale strings in the same task. A task is done only when its acceptance check passes.

---

## Epic M0: Prototype checks (gate before the build)

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| M0-01 | Local Vite + TypeScript scratch scaffold (no repo, no push) | ORCH | none | `build` runs offline; output is plain static files | todo |
| M0-02 | Emoji bake script: lion, tiger, cat, cow, elephant, peacock at 24 and 32 px with 1 px outline, from both candidate sets (Twemoji, OpenMoji) | ORCH | M0-01 | One contact sheet image at 1x and 4x per set; licences noted | todo |
| M0-03 | Owner reviews contact sheet (cat vs tiger, face-only lion and bear) | HUMAN (H3) | M0-02 | Verdict per animal and a hand-pixel list; emoji set chosen | todo |
| M0-04 | Micro-engine spike: loop, integer scaling, pointer drag, dirty flag, 30 fps cap | ORCH | M0-01 | Engine gzipped size measured and reported (target 10 to 15 KB) | todo |
| M0-05 | Phone test page: shows fps, touch events, drag lag, served on the local network | ORCH | M0-04 | Opens on desktop emulation; drag works with `touch-action: none` | todo |
| M0-06 | Audio spike: Opus WebM sprite playback, ZzFX effect, unlock-on-tap, speaker icon | ORCH | M0-01 | Plays in desktop Chrome; per-line size at 20 to 24 kbps measured | todo |
| M0-07 | Owner records 5 sample lines (`app.tap_truck`, `name.lion`, `crate.open`, `correct.1`, `wrong.gentle`) | HUMAN (H2) | none | 5 WAV or M4A files, named by key | todo |
| M0-08 | Real old Android phone test: drag, size and speaker playback of samples | HUMAN (H4) | M0-05, M0-06, M0-07 | Written notes: model, Android and Chrome version, drag feel, audio clarity | todo |
| M0-09 | M0 findings report (engine size, atlas verdict, device floor, audio size) with a go or no-go on D12 | ORCH | M0-03, M0-04, M0-08 | One-page report; D12 and device floor recommendation stated | todo |
| M0-10 | Owner confirms D12, device floor and emoji set | HUMAN (H5) | M0-09 | Answer recorded in DECISIONS_NEEDED.md | todo |

---

## Epic F: Foundation and delivery (Milestone 1)

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| F-01 | Real project scaffold: `base` path for Pages, hash routing, conservative build target, no heavy polyfills | ORCH | M0-10 | Build passes an ES-target check; no runtime network calls | todo |
| F-02 | Size-budget script per pack (shell 150 KB, core audio 100 KB, game 130 KB, total 400 KB) | ORCH | F-01 | Script fails when a pack is over budget (proved with a fake oversize file) | todo |
| F-03 | CI workflow files authored: typecheck, tests, build, size gate, pack validator, `SOURCES.csv` gate | ORCH | F-01, F-02 | Same steps pass locally via one script; workflow YAML lints | todo |
| F-04 | PWA: manifest, icons, landscape lock, service worker precache, quiet update | ORCH | F-01 | Installable in local audit; reload works offline (devtools offline) | todo |
| F-05 | Licence files, CREDITS, About page text, licence folders (code vs art/audio/text) | ORCH+H | decisions N1, N2 | Files exist; every asset type has a licence row | todo |
| F-06 | CONTRIBUTING, content schema guide, "new pack in 30 minutes" guide, code of conduct, child-safety policy | ORCH+H | F-05 | Owner approves wording and supplies a contact address | todo |
| F-07 | Create GitHub repo, enable Pages (source: Actions), first push | HUMAN (H12) | F-03, F-05, N1 | Public URL loads the shell | todo |
| F-08 | Verify deploy pipeline end to end (Actions run green, installable from the URL) | ORCH+H | F-07 | Green run; URL installs on a phone | todo |

---

## Epic G: Engine and Deliver mechanic

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| G-01 | Engine core: loop, integer scaling, atlas blitter, dirty-flag render, 30 fps (60 while dragging) | ORCH | F-01 | Idle scene uses near-zero redraws; no `ctx.filter`, `shadowBlur` or `getImageData` (lint rule) | todo |
| G-02 | Scene manager, hash router, game-state store | ORCH | G-01 | Scene switch and back-button work | todo |
| G-03 | Particle pool (64), tween helpers, reduced-motion switch, flash cap (3 per second) | ORCH | G-01 | Test proves cap holds; reduced motion removes shake and bounce | todo |
| G-04 | Deliver mechanic: drag, generous snap, hit boxes 32 logical px or more, tap-then-tap, keyboard (arrows and enter) | ORCH | G-02 | Unit tests plus scripted drag and tap runs both complete a delivery | todo |
| G-05 | Hint fading: ghost hand at 3 s, animal hops halfway at 6 s | ORCH | G-04 | Timer test; no hint ever blocks or scores | todo |
| G-06 | Dev playground and pack validator (add a pack, see it run) | ORCH | C-01, G-04 | Validator rejects a pack with a missing key or a missing sound source | todo |

---

## Epic C: Content data and progress

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| C-01 | Entity, level-config and locale schemas (generic fields only, per PLAN section 5) | ORCH | F-01 | JSON schema plus types; zero animal-specific fields in the engine | todo |
| C-02 | Entity data for 14 animals (zones, accepts, tags, poke, optional fact; cow accepts Farm only) | ORCH | C-01 | Validator passes; matches ANIMALS.md table row by row | todo |
| C-03 | Level configs: intro, replay pools 1, 2, 5, levels 3 to 8 | ORCH | C-02 | Each level matches ANIMALS.md section 3 pools | todo |
| C-04 | English locale: prompts, names, zones, `cc.*` sound captions, facts (text keys = audio keys) | ORCH | C-01 | Coverage report: every audio key has a caption string and vice versa | todo |
| C-05 | Teacher review of zones, cow = Farm, animal list and 6 Wonder facts | HUMAN (H6) | C-02, C-04 | Written yes or edits per row | todo |
| C-06 | Apply teacher edits and cascade to all docs and strings | ORCH | C-05 | Diff shows every touched file; no stale fact anywhere | todo |
| C-07 | Adaptation engine: hidden confidence per animal (first-try drops only), two-clean-runs unlock, review plus new level per session | ORCH | C-03, G-04 | Simulated sessions show no speed input and no "retry" screens | todo |
| C-08 | Local progress storage with safe fallback if storage is blocked | ORCH | G-02 | Game still plays with storage disabled | todo |
| C-09 | Optional backup code or file export and import | ORCH | C-08 | Round-trip restores park and stickers | todo |

---

## Epic A: Art

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| A-01 | Atlas bake pipeline: 14 animals from the chosen emoji set, outline, packed atlas | ORCH | M0-10 | Atlas under about 32 KB; codepoints verified against the set | todo |
| A-02 | Hand-pixel replacements for the worst offenders (lion, bear, possibly cat or tiger) | ORCH+H | A-01, M0-03 | Owner approves each at 24 px | todo |
| A-03 | Scene art: Bholu, Chiku, crates, Jungle, Farm, Home zones, tree, bird, day and night sky, fireflies, UI icons | ORCH | G-01 | All within the art budget; one palette | todo |
| A-04 | Poke animation for 14 animals (one unique reaction each, per ANIMALS.md section 4) | ORCH | A-01 | 14 reactions play; none mocks an animal | todo |
| A-05 | Colour-blind and greyscale CI check; optional high-contrast mode | ORCH | A-03 | CI simulation passes; meaning never colour-only | todo |
| A-06 | App icon and maskable icon with the final name | ORCH | N1 | Passes installability audit | todo |

---

## Epic U: Audio

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| U-01 | Audio engine: unlock on first tap, resume after interruption, limiter, ducking, speech never interrupted | ORCH | M0-06 | Scripted checks; no loud startle (peak limit asserted) | todo |
| U-02 | Synthesized effects: truck, crate, chimes, wobble, hop, sparkle, rabbit hop-and-nibble, quiet ambience | ORCH | U-01 | Zero asset bytes; each effect has a `cc.*` description | todo |
| U-03 | Audio build script: trim, loudness match, mono Opus WebM, sprite packing, coverage report | ORCH | U-01 | Report lists missing keys; output under core pack budget | todo |
| U-04 | Source and licence-check 13 animal sounds, fill `SOURCES.csv` | HUMAN (H7) | none | 13 rows with URL, author, licence, date; none NC | todo |
| U-05 | Candidate shortlist and `SOURCES.csv` template (only if owner allows web search) | ORCH+H | none | Template plus candidate links; nothing downloaded | todo |
| U-06 | Trim and master the 13 sounds (0.5 to 0.8 s) and wire to entities | ORCH | U-03, U-04 | Each clip plays on its animal and has a row in the CSV | todo |
| U-07 | Owner records the 51 English lines (3 takes each) | HUMAN (H9) | H6 for the 6 fact lines | 51 keys by filename, 3 takes each | todo |
| U-08 | Owner picks best takes and approves processed audio on a phone speaker | HUMAN (H10) | U-03, U-07 | Approved set; coverage report shows 51 of 51 | todo |
| U-09 | Speech fallback chain: recorded, then speech synthesis only for a matching language, then caption | ORCH | U-01 | Test with no voices installed shows caption only | todo |
| U-10 | Per-language audio manifest and sprite loader | ORCH | U-03 | Missing language falls back cleanly | todo |

---

## Epic CC: Captions

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| CC-01 | Caption renderer: real text overlay, Off, On, Auto, Small, Medium, Large, speaker icons, 4.5:1 contrast, 2 s minimum | ORCH | C-04 | Contrast and duration tests pass | todo |
| CC-02 | Sound-description captions for animals, truck, crate, chime; show even if audio fails to load | ORCH | CC-01, U-02 | Disable audio files: captions still appear | todo |
| CC-03 | Auto mode: detect mute or missing voice | ORCH | CC-01, U-09 | Mute shows captions; unmute hides them | todo |
| CC-04 | Mute-only full session run and a longer-text (+40 percent) layout dry run | ORCH | CC-02 | Scripted run completes; no overlap with drag path | todo |
| CC-05 | Deaf or hard-of-hearing reviewer plays on mute | HUMAN (H14) | CC-04 | Written feedback; defects logged | todo |

---

## Epic P: Accessibility and parent corner

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| P-01 | Parent corner in real HTML buttons with labels; long-press plus a plain alternative | ORCH | G-02 | Keyboard and assistive-tool reachable; child cannot reach by accident | todo |
| P-02 | Settings: captions, sizes, sound, vibration, high contrast, reduced motion, reset, backup, About | ORCH | P-01, CC-01 | Each setting persists and takes effect live | todo |
| P-03 | Reduced-motion and flashing audit | ORCH | G-03 | Automated check; no flash above 3 per second | todo |
| P-04 | Known-limit note on screen readers in About | ORCH | P-01 | Text present | todo |

---

## Epic L: Game flow (Milestone 1)

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| L-01 | First launch: truck, "Go", intro steps 1 to 3 (lion, cow, dog) with ghost hand | ORCH | G-04, A-03, C-03 | Scripted run completes unaided with no wrong drop possible | todo |
| L-02 | Levels 3 to 8 runtime, replay pools, ten-animal level with guests | ORCH | L-01, C-07 | Every level reachable; unlock after two clean runs | todo |
| L-03 | Mystery crate (sound first) with caption and visible shake; wrong drop as gentle experiment | ORCH | L-02, U-02 | Silent run still readable; no wrong-drop reaction for the cow | todo |
| L-04 | Sunset ending, sealed "?" crate, no score shown | ORCH | L-02 | No number, star or counter anywhere (text scan) | todo |
| L-05 | Park persistence, one new arrival per session, picture sticker book without counter | ORCH | C-08, L-02 | Park reopens as left | todo |
| L-06 | Poke reactions wired for all 14 animals | ORCH | A-04 | Each animal reacts once per tap | todo |
| L-07 | Wonder Bubbles for 6 animals, about 1 drop in 3, behind a feature flag until review | ORCH | C-06, L-06 | Flag off by default until C-05 is yes; never every time | todo |
| L-08 | Surprise guests, about 1 crate in 12, every third session | ORCH | L-02 | Rate verified over 1000 simulated crates | todo |

---

## Epic Q: Quality, tools and release (Milestone 1)

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| Q-01 | Recording booth page (record, preview, export by key, coverage list) | ORCH | U-03 | Works in a mobile browser; exports correctly named files | todo |
| Q-02 | Automated tests: schema, adaptation, scripted playthrough, offline reload | ORCH | L-02 | All green in the one local script and in CI | todo |
| Q-03 | Performance pass: CPU throttled run, memory, final size measurement vs budgets | ORCH | L-08, U-08 | Measured figures replace estimates in a report | todo |
| Q-04 | Full device check on a 2 GB Android phone: size, frame rate, drag, audio, offline | HUMAN (H13) | Q-03, F-08 | Checklist signed; budgets met | todo |
| Q-05 | Playtest kit: script, observation sheet, consent note, success measures | ORCH | L-04 | One-page kit ready to print | todo |
| Q-06 | Playtest with 3 to 5 children | HUMAN (H15) | Q-04, Q-05 | Notes per child; unaided tutorial completion and replay-without-asking recorded | todo |
| Q-07 | Fix list from playtest, then re-verify | ORCH | Q-06 | Each defect closed or consciously deferred | todo |
| Q-08 | Release approval and tag | HUMAN (H17) | Q-07, CC-05 | Owner says yes in chat | todo |
| Q-09 | M1 closeout: docs sync, decision log update, handoff notes | ORCH | Q-08 | PLAN.md, ANIMALS.md, RECORDING_SCRIPT.md consistent with what shipped | todo |

---

## Epic M2: Milestone 2

| ID | Task | Owner | Depends on | Acceptance check | Status |
|---|---|---|---|---|---|
| M2-01 | Book wording check for wild, domestic, pet (dog, hen, goat) | HUMAN (H8) | Q-09 | Owner states accepted answers per animal | todo |
| M2-02 | Double-yes support (primary plus also), "Both!" sticker, levels 10 and 11 | ORCH | M2-01 | Dog accepted at Home or Farm from level 10; cow still Farm only | todo |
| M2-03 | Silhouette reveal for sound-only crates (level 9) | ORCH | L-03 | Works with captions as main channel | todo |
| M2-04 | Level 12 Helpers, level 13 lens twist, level 14 conveyor (no timer penalty), level 15 Park Party | ORCH | M2-02 | Configs only; no engine animal-specific code | todo |
| M2-05 | Hungry Tummies (Kitchen Stall) with eats relations; human food vegetarian | ORCH+H | M2-04 | Teacher approves relations; cow never in a food context (PLAN section 10) | todo |
| M2-06 | Nest Lane (animal homes) with home relations | ORCH+H | M2-04 | Teacher approves relations | todo |
| M2-07 | Larger caption sizes and translated sound descriptions | ORCH | CC-01 | Layout holds at the largest size | todo |
| M2-08 | Portrait layout | ORCH | Q-09 | Playable at 360 x 640 without clipping | todo |
| M2-09 | Hindi strings (draft) and font and length check with system fonts | ORCH | C-04 | No font download; no clipped text | todo |
| M2-10 | Native-speaker and teacher review of Hindi strings and names | HUMAN (H16) | M2-09 | Written sign-off | todo |
| M2-11 | Hindi voice recording via the booth (a Hindi speaker) | HUMAN (H16) | M2-10, Q-01 | All keys covered in the coverage report | todo |
| M2-12 | M2 device check, short playtest and release | HUMAN (H13, H15, H17) | M2-11 | Same gates as Q-04, Q-06, Q-08 | todo |

---

## What the Orchestrator can do alone vs what waits

- **Alone:** every ORCH task: engine, schemas, data, CI authoring, PWA, synthesized audio, captions, parent corner, game flow, tests.
- **Waits on the human:** M0-03, M0-07, M0-08, M0-10 (M0 gate); F-07 (repo); C-05; U-04, U-07, U-08; CC-05; Q-04, Q-06, Q-08; M2-01, M2-10, M2-11.
- **Can run in parallel while the human is busy:** all of Epics G, C (except C-05), A, P, U-01 to U-03, CC-01 to CC-04. Use mocked audio and placeholder voice lines until U-08.
