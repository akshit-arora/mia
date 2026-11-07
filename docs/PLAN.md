# Plan v3: tiny educational games PWA

> **Direction changed on 2026-11-07, see D17.** The product is now MIA, a toy box of games that earn animal cards, not a sorting quiz. Sections marked *superseded by D17* below describe the first direction (Animal Express, Deliver) and are kept for history; the sorting game still runs at `sort.html`. For what exists now read README.md, docs/design/THREE_GAMES.md and docs/BUILD_REPORT.md.

Status: planning only, no code yet. Last updated 2026-11-05.
Working names (all changeable): game = **Animal Express**, town = **Chhotu-Nagar**, guides = **Bholu** (truck) and **Chiku** (sparrow).

Companion files: [ANIMALS.md](ANIMALS.md) (content for Milestone 1), [RECORDING_SCRIPT.md](RECORDING_SCRIPT.md) (voice lines with mood and tone).

---

## 1. Vision

An open-source, offline-first PWA of tiny, joyful games for children (first target: about 6 to 7 years, English medium, India). Games are built from **topics**, not from a school board or class. The framework is translatable into other Indian languages.

- Hosted on **GitHub Pages only**. No backend, no accounts, no analytics, no remote database.
- Progress lives on the device. An optional backup code or file moves it between phones.
- Not branded as CBSE or NCERT. Topics are written in our own words. No book text or illustrations are copied.

## 2. Product principles

1. **Never academic.** The child never sees a subject name. Learning is the tool for reaching a game goal. Test for every game: would a child still enjoy it with the learning removed?
2. **Audio-first, reading-optional.** Many children cannot read yet. Every prompt is spoken and every spoken line is also available as a caption.
3. **No failure.** No score, no stars, no streaks, no timers, no buzzers. Wrong drops are gentle and funny.
4. **Short.** Sessions are 2 to 3 minutes. The park is the reward and it never shrinks.
5. **Light.** Cheap, old Android phones are the primary device.
6. **Private.** Nothing about the child leaves the device.
7. **Contributor-friendly.** Adding content means editing data, not engine code.

## 3. Decision log

| # | Decision | Source |
|---|---|---|
| D1 | GitHub Pages only, open source, no remote database | Owner |
| D2 | Games organised by **age band and capability**, not by class or book | Owner |
| D3 | First mechanic is **Deliver** (drag an item onto a target); first game is Animal Express | Owner |
| D4 | Content is generic **entities** with tags and relations (not "animal records") | Owner |
| D5 | Meat-eating animals are included in the food chapter, shown plainly (no hunting). Human food shown is vegetarian | Owner (2026-11-05) |
| D6 | Cow is accepted at **Farm only** | Owner (2026-11-05) |
| D7 | Shared audio core pack is budgeted separately from each game's own files (see section 6) | Owner (2026-11-05) |
| D8 | Old Android phones are supported; **old iPhones (before iOS 17) are skipped** | Owner (2026-11-05) |
| D9 | **Landscape-first**; portrait layout deferred | Owner (2026-11-05) |
| D10 | Owner records the English voice, guided by a mood and tone script | Owner (2026-11-05) |
| D11 | **Closed captions** are a first-class feature (Off / On / Auto, default Auto) | Owner (2026-11-05) |
| D12 | Plain-canvas micro-engine (about 10 to 15 KB) instead of Kaplay or Phaser | Proposed, pending a size check |
| D13 | Animal sounds and effects: CC0 preferred, CC-BY with credit, never non-commercial | Proposed default, to confirm |
| D14 | The pets zone is called **Home**; the later "animal homes" game is renamed **Nest Lane** to avoid a clash | Proposed |
| D15 | Wonder Bubbles (tap to reveal a fact) replace a per-zone "?" fact button | Proposed |
| D16 | Project name **MIA** (first game: Animal Express); licence **MIT** | Owner (2026-11-05) |
| D17 | **Direction change: from a sorting quiz to games that earn collectible cards.** MIA is a toy box of three door games (Jungle: Forage Trail, Farm: Morning Round, House: Play Yard) plus Card clash. Each game ends with an animal card the child earned by playing; cards sit on three shelves; Card clash uses them like Pokemon or wrestling Trump cards. The sorting game is kept as the classic game in the Grown-ups corner. D3 (Deliver as the first mechanic) and the level ladder in 4.5 are superseded; D1, D2, D4 to D11, D13 to D16 stand | Owner (2026-11-07) |

### D17 in full: why the direction changed
- **The first direction (Animal Express, Deliver).** Drag each animal to its place. It worked as software but felt like a workbook with a truck: the correct answer is always one place, the child is asked "where does it live" a hundred times, and a child can finish it without wanting anything. It is a quiz in a game skin.
- **Rejected direction 1: "Try It" puzzles** (`docs/design/STORY_PUZZLES.md`). Replace Deliver with try-a-helper puzzles in three scenes. The Reality Checker's review (`docs/design/REALITY_CHECK.md`) found a risk of the same "game skin on a quiz" pattern, weak transfer for wild animals and pets, and a large animation and content cost for one person. Verdict: needs work; no-go on the full redesign.
- **Rejected direction 2: the Bholu story layer** (`docs/design/STORY_CHARACTERS.md`, "Oh No, Bholu!", the town of Chhotu-Nagar, a seven-night arc, Moon Mela). A story with recurring characters around the puzzles. Rejected with direction 1 for the same review (scope, no evidence from any child, a rail that a child can finish and leave). Bholu the truck survives as a small helper in the Farm game and as the captions' narrator.
- **The chosen direction** (`docs/design/THREE_GAMES.md`, reviewed in `REALITY_CHECK_THREE_GAMES.md`). The owner asked for games that are fun first and not educational on the surface: the animals are the reward, cards work like Pokemon or Trump cards, three shelves, no questions, no tests. The facts (name, type, food, home, three powers) ride on the card and are repeated every time the card is shown, and the food or the home is part of the game that earned it. It teaches recognition and association, not reasoning; that limit is accepted and written down.
- **Why now:** the owner's own direction, and a cheaper build (three small games sharing one shell, one reveal and one card store, all data driven).
- **What stays:** captions, no failure, offline, privacy, the micro-engine (D12), the voice plan (D10), the sound licence rule (D13).
- **How it is judged:** by the observation protocol in `docs/PHONE_TEST.md`, with kill and revise criteria. No child has played MIA yet.


## 4. The experience

*Superseded by D17: sections 4.1 to 4.7 describe the first direction, the Animal Express town and Deliver levels. The current experience is in README.md and docs/design/THREE_GAMES.md.*

### 4.1 Home screen: a one-screen town
Each chapter is a **place with a verb**, never a subject label. The town grows visibly as the child plays (a lamp, a flag, flowers).

- Park Gate: Animal Express (deliver animals).
- Kitchen Stall: Hungry Tummies (feed animals). Milestone 2.
- Nest Lane: animal homes. Milestone 2.
- Dimmed "?" silhouettes (Garden, Bazaar, Well, Family House) for later chapters.

### 4.2 Guides
- **Bholu the truck** (pixel truck with big round eyes): the doer. Cheerful, brief, never says "no" or "wrong".
- **Chiku the sparrow**: the wonderer. Asks "I wonder why?" and lets the child find out. A peer, not a teacher.
- Neither has a gender. Names are working names and need native-speaker review per language.

### 4.3 First launch, minute by minute

| Time | What happens |
|---|---|
| 0:00 | A tiny truck drives across. One giant "Go" truck button. Voice: "Tap the truck!" The first tap unlocks audio. No menus, no settings. |
| 0:10 | **Intro, step 1.** A crate shakes and the child hears a roar before seeing anything. A lion jumps out, "Lion!" is spoken. Only the Jungle exists, so a wrong drop is impossible. A ghost hand shows the drag. The lion runs in; a tree and a bird appear. |
| 0:40 | **Step 2.** The Farm appears with a "Moo!" A cow arrives. Still no wrong drop possible. |
| 1:10 | **Step 3.** Home appears. A dog arrives. Now three places exist and mixed animals start to come, easiest first. |
| 1:40 | Free flow. About one drop in three, Chiku shows a "?" over the animal. The child taps; the animal does something (the elephant picks up a ball) and a short fact is spoken. It becomes a picture sticker. |
| 2:30 | Sunset. Fireflies, the animals fall asleep. A sealed crate rattles with a "?". "See you tomorrow!" No score. |

The intro compresses the single-target levels (1, 2 and 5) into the first minute and a half. The ladder proper continues from level 3.

### 4.4 Later sessions
- The park opens exactly as it was left. Animals only join by being delivered; none appears on its own.
- Each session is one review level plus one new level. A level unlocks after two clean runs. Missed animals return quietly later, never as a "retry".
- Every third session ends with a surprise guest.
- Silent adaptation: a hidden per-animal confidence (based on first-try drops, never speed) picks the next animals. Hesitation is treated as curiosity and triggers an invitation to poke the park, not a hint.
- Hints fade: after 3 seconds a ghost hand, after 6 seconds the animal hops halfway. A tap-then-tap alternative to dragging is always available.

### 4.5 Level ladder *(superseded by D17: the sorting game is now the classic game)* (15 levels; Milestone 1 builds the intro plus levels 3 to 8; levels 1, 2 and 5 are single-target replay pools)

| # | Targets | New idea |
|---|---|---|
| 1 | Farm | The drag verb |
| 2 | Jungle | Same verb, new place |
| 3 | Farm, Jungle | First choice, strongly contrasting animals |
| 4 | Farm, Jungle | Six animals, same choice |
| 5 | Home | Third place |
| 6 | Home, Jungle | Pets versus wild |
| 7 | Farm, Jungle, Home | Three targets |
| 8 | Farm, Jungle, Home | Fluency, faster truck, ten animals |
| 9 | Farm, Jungle, Home | Sound-only crates (silhouette when captions are the main channel) |
| 10 | Farm, Jungle, Home | "Double-yes": the dog is accepted at Home or Farm; "Both!" sticker |
| 11 | Farm, Jungle, Home | More double-yes (check hen and goat against the book first) |
| 12 | Farm, Jungle, Home | "Helpers" level: elephant, horse, camel, ox. The elephant is accepted at Jungle **or** Farm here, because it works with people |
| 13 | With people / Far away | Lens twist: who lives with people? |
| 14 | Farm, Jungle, Home | Conveyor rush with no timer penalty |
| 15 | Farm, Jungle, Home | Park Party: free build, no wrong answer |

The cow is strictly Farm (D6). Under the "where does it live?" lens the dog is Home or Farm from level 10 onward.

### 4.6 Curiosity hooks (required, not extras)
1. **Mystery crate:** hear the sound first, guess, then the reveal. With captions on, a caption and a visible shake carry the same hook silently.
2. **Wrong drop as experiment:** a short, gentle reaction, then the animal hops back. No gags that mock an animal, and none at all for the cow.
3. **Poke the park:** each resident has one unique tap reaction.
4. **Wonder Bubbles:** about one drop in three, never every time. A question first, then a reveal through an action. One fact per animal visit, at most 8 words, always about what the animal **does**, always true everywhere. Teacher review required.
5. **Surprise guests:** rare crates (about 1 in 12) with an ambiguous or unusual animal.

### 4.7 Rewards
Cosmetic only and earned by play, not accuracy or speed: a living park, a picture sticker book with no "3/30" counter, truck paints, animal hats, fence styles, day and night sky. No currency, no shop, no limited-time items.

## 5. Framework

```
entities (data)  ->  level configs  ->  mechanic (Deliver)  ->  game
      ^                    ^                                      |
 locales (strings)   audio manifest (per language)         art atlas (baked)
```

- **Entities:** each has an id, a name key, an emoji codepoint, tags, relations (livesAt, eats, home), a sound, a poke reaction and optional Wonder fact. Plants, foods or family members use the same model later.
- **Level config (generic, no animal-specific fields):** `id`, `mechanic`, `order`, `prereq`, `lens`, `targets[]`, `itemQuery`, `count`, `distractors`, `accept` (strict or primary plus also), `reveal` (full, silhouette, sound-only), `hintProfile`, `pace`, `introEntities`, `surpriseSlot`, `teaches[]`, `estDuration`, `unlockRule`, `reward`, `promptId`.
- **Mechanics:** Deliver first. Listen and Pick is next. Rule of three: no abstraction before three games use it.
- **Dev playground and pack validator** in CI so a contributor can add a pack and see it run.

## 6. Technical targets and budgets

- Plain HTML canvas, TypeScript, Vite, `vite-plugin-pwa`. Hash routing, `base` path set for GitHub Pages, deployed by GitHub Actions.
- Logical canvas: short side 135, long side 240 to 300, integer scaling in device pixels, pixelated rendering. Landscape only for v1 (manifest orientation locked, with an icon-only "turn your phone" hint in a browser tab).
- Device floor (to verify on one real old phone): **Chrome 61 or newer** (module scripts need it; the earlier "Chrome 60" was not achievable without a legacy build), 2 GB RAM or less. Conservative JavaScript build target, no heavy polyfills. Whether to add a legacy build for older browsers is an open decision (see DECISIONS_NEEDED.md).
- Frame cap 30 fps (60 only while dragging), dirty-flag rendering, particle pool of 64, no `ctx.filter`, `shadowBlur` or `getImageData`.

| Part | Estimate | Note |
|---|---|---|
| Shell plus engine | up to 150 KB | Engine about 10 to 15 KB |
| Shared core audio pack | about 100 KB | Animal sounds, names, area names, common phrases (D7) |
| Animal Express (art, own lines, code) | about 100 to 130 KB | Art about 32 KB |
| Total first install | under about 400 KB | Budget. Estimates are ±30 to 50% until measured on a real phone |

**Measured 2026-11-05 (gzip, before any real audio):** app code 26 KB, art atlas 3.5 KB, icons/manifest/service worker 10 KB, total 39.6 KB. The micro-engine alone is about 1.9 KB. The core audio pack is 0 KB until real recordings exist and will add roughly 100 KB or more.

CI enforces size budgets per pack and fails when over.

## 7. Audio

- **Synthesized** (ZzFX or WebAudio, zero asset bytes): truck, crate, chimes, wobble, hop, sparkle.
- **Recorded animal sounds:** 13 short clips, CC0 preferred (D13). Every file has a row in `sounds/SOURCES.csv` and CI fails without it. Rabbits are nearly silent, so the rabbit gets a synthesized hop-and-nibble sound.
- **Spoken lines:** recorded by the owner in English (see [RECORDING_SCRIPT.md](RECORDING_SCRIPT.md)). Each line is a **complete, separate recording**; no name is spliced into a sentence. Prompts are a name clip followed by a generic clip.
- **Codec:** mono Opus in WebM, about 20 to 24 kbps for speech, 24 to 32 kbps for animal sounds, packed into a few sprite files. No iOS fallback (D8).
- **Fallback chain per line:** recorded clip, then live speech synthesis if the phone has a voice for the language, then a caption. A voice for the wrong language is never used.
- **Mixing:** speech is never interrupted; effects duck under speech; limiter on the master bus; no loud startles. No music in v1, only a quiet synthesized ambience that grows as the park fills.
- **Audio unlock** on the first tap; resume after interruptions; a visible speaker icon so parents notice a muted phone.

## 8. Closed captions (Milestone 1)

**Modes:** Off, On, **Auto** (default). Auto shows captions when sound is muted or no voice is available for the language. Setting lives in the parent corner, and a small "CC" icon sits next to the speaker. Sizes: Small, Medium, Large.

**What is captioned**
- Every spoken line, with a small speaker icon (truck for Bholu, bird for Chiku). Speakers are told apart by icon and position, never by colour alone.
- Meaningful sounds with a short description: animal sounds ("Lion roars"), truck, crate, happy chime. Not drag ticks or UI taps.
- A caption stays for the length of the audio and at least 2 seconds, and appears even if audio fails to load.

**How**
- Text comes from the same locale strings as the audio keys, plus `cc.*` keys for sound descriptions (for example `cc.animal.lion`). No new assets. Translators write language-specific wording.
- Rendered as **real text over the canvas**, not in the pixel font, so Indic scripts stay crisp with system fonts and no font download.
- Fixed position in the upper band, away from the drag path and the targets. Opaque pill, contrast at least 4.5:1, no bounce when reduced motion is on.
- Allow 30 to 40 percent longer text in other languages.

**Knock-on rules**
- Sound-only levels switch to silhouette reveals when captions are the main channel.
- The mystery crate gets a caption and a visible shake.
- Test: play a whole session on mute with captions only; have a deaf or hard-of-hearing reviewer try it; do a Hindi length dry run.

## 9. Accessibility (all of Milestone 1 unless noted)

- **Motor:** tap-then-tap alternative to dragging, large hit boxes (at least 32 logical px, 64 CSS px at worst), generous snap distance, no timers, keyboard play with arrows and enter.
- **Vision:** palette checked for colour blindness (greyscale and simulation in CI), meaning never carried by colour alone, strong outlines, optional high-contrast mode.
- **Hearing:** captions (section 8), a visual cue for every sound, optional vibration.
- **Cognitive:** predictable layout, fading hints, nothing punishing, calm pacing, no reading required.
- **Safety:** reduced-motion support, no flashing faster than 3 times a second (confetti and shake capped), master limiter.
- **Parent corner** is built from real HTML buttons with labels so assistive tools work; the long-press that opens it has a plain alternative.
- **Known limit:** a canvas game is not fully usable with a screen reader. Full screen-reader support is a later milestone.

## 10. Content and cultural rules

- Animals Indian children know come first. Global ones are labelled neutrally.
- No festival, religious greeting or dress by default; "Hello" is universal. Seasonal decor is neutral.
- Cows are shown with respect and never as food (feeding a cow grass is fine). Pigs and beef are avoided. Dogs are friendly but never forced on the child.
- No gendered roles, caste, class or skin-tone cues. Animals keep natural colours.
- No death, hunting or predator-and-prey scenes. A plain fact such as a lion eating meat is allowed (D5).
- Every language pack gets native-speaker and teacher review before release.

## 11. Open-source and licensing

- Everything we write (code, text, data, our own voice recordings): **MIT** (decided 2026-11-05; see `LICENSE`). Third-party material such as the Twemoji art and any sourced sounds keeps its own licence, with attribution in `CREDITS.md`.
- Emoji art: baked at build time from one set only (Twemoji CC-BY 4.0 or OpenMoji CC-BY-SA 4.0). Attribution in `CREDITS` and the in-app About page.
- Do not use CC-BY-NC sounds or text-to-speech voice models with restrictive licences.
- Repo basics: contribution guide, content schema, "new pack in 30 minutes" guide, code of conduct, child-safety policy.
- The recording booth page (a tool in the repo) lets teachers and relatives record other languages.

## 12. Milestones

**Milestone 0: Prototype checks (before the build)**
- Bake 6 emoji animals into the pixel pipeline and check they stay recognisable at 24 px (cat vs tiger is the worry).
- Measure the micro-engine size and a drag test on a real old Android phone.
- Record 5 sample lines and play them on a phone speaker.

**Milestone 1: Animal Express, first playable**
- Installable PWA on GitHub Pages, works offline, updates quietly.
- Intro sequence plus levels 3 to 8, 14 animals ([ANIMALS.md](ANIMALS.md)).
- Mystery crate, poke reactions for all animals, Wonder Bubbles for 6 animals.
- English voice, synthesized effects, animal sounds, **captions (Off / On / Auto)**.
- Accessibility basics (section 9), local progress, parent corner, recording booth page.
- Done means (a qualitative check with 3 to 5 real children, not a statistic): they finish the intro without help, they replay without being asked, and budgets are met on a real 2 GB Android phone.

**Milestone 2**
- Levels 9 to 15, double-yes, Hungry Tummies, Nest Lane, silhouette reveal for sound-only levels, translated sound descriptions, portrait layout, Hindi voice pack (using the recording booth).

**Milestone 3**
- Listen and Pick mechanic, a second chapter, Play Store wrapper (optional).

## 13. Risks

| Risk | Mitigation |
|---|---|
| Feels like a sorting worksheet with a truck skin | The five hooks are requirements. Cut any hook children ignore. |
| Pixelated emoji look muddy (face-only lion and bear, similar cat and tiger) | Prototype first, 1 px outline, hand-pixel the worst offenders |
| Audio budget creep | CI size gate, cut list (fewer praise variants, lower bitrate, fewer animals) |
| Licence contamination | `SOURCES.csv` gate, own recordings preferred |
| Wrong or inaccurate facts | Action-only facts, teacher review, data-driven so fixes are one-line |
| Drag is janky on cheap phones | Pointer events, `touch-action: none`, tap-then-tap fallback |
| Solo-maintainer burnout | Small milestones, content as data, contributor tooling |
| Old iPhones get no sound | Accepted (D8); captions and visuals still work |

## 14. Open items for the owner

1. Confirm D12 (micro-engine) after the size check, and D13 (sound licences).
2. Confirm D14 (pets zone "Home", later game "Nest Lane").
3. Check the book's wording for wild, domestic and pet before levels 10 and 11 (hen, goat, dog).
4. Review the 6 Wonder facts and the animal list with a teacher.
5. Decide the project name and licence.
