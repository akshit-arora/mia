# V1 Definition of Done — Jungle + Buddies

Review baseline: `a9c65e1`; section 5 is the status after Round 2 (cut-down to the brief, on top of `10016ad` and `7b475fb`). Source of truth: `V1_BRIEF.md`.
Statuses: **DONE** = code evidence exists and a test or read-through confirms it; **PARTIAL** = built but differs from the brief or unverified; **MISSING** = not in code. "Human" = only a child at a phone can prove it. Nothing here is DONE for acceptance criteria until the playtest (`PLAYTEST.md`) passes: code can only make a criterion *possible*.

## 1. Contradictions between code and brief (decide before playtest)

The brief is not rewritten. Each row needs an owner decision; my recommendation is first.

| # | Brief says | Code does | Recommendation (one-line rationale) |
|---|---|---|---|
| C1 | 4 jungle friends (bear, monkey, elephant, peacock) | `WILD_ANIMALS` in `logic.ts` has 6 (adds lion, tiger; `meal` food); `cards.json` Jungle shelf has the same 6 | Gate the offer pool to the 4 via a `V1_ANIMALS` list in `logic.ts`; lion/tiger have no food behaviour or art pass, so shipping them dilutes "one confident style". |
| C2 | 2 buddies (Gajju trunk, Bunty climb), "1 badge + 1 secret" | `abilities.ts` has 6 effects (roar, pounce, trunk, climb, sniff, fan); `BADGES` has 3 (clean/full/secret) | Keep trunk+climb enabled; leave sniff/fan (brief lists them as deferrable) behind the same V1 list; keep all 3 badges only if the reveal screen already shows them, else show 1. Fewer buddies makes the "who did what" test cleaner. |
| C3 | Basket holds 5, trail **offers 6**; leaving the 6th is a decision | `DEFAULT_ROUND.need=5`; `index.ts` streams spawns continuously (`ITEM_POOL 10`), run ends the instant `carried>=5`. No 6th-item guarantee exists; surplus food just scrolls past | Add a rule: trail contains exactly 6 wanted foods before the Meet beat (or spawn a 6th with the 5th pickup) so criterion 4 is observable; otherwise it cannot be tested. |
| C4 | "Picking one of three foods" changes the trail (criterion 3) | Friend-first: the animal fixes the food (`FOOD_OF`); no food choice screen. `forage.pick` locale key is unused. Child picks friend (of 3) and route (of 3) | Reword criterion 3 to "picking a friend changes the food and trail" (matches V1_BRIEF Promise and the build order step 1), not add a food screen; the friend-first redesign is the intended loop. Needs owner sign-off. |
| C5 | **Giraffe must stay unseen**; transfer test with 3 foods | No `giraffe` anywhere in `src/` (grep clean) so unseen: good. But there is also no in-game or prop support for the test | Run the transfer test as a facilitator protocol with paper cards/props (see `PLAYTEST.md`), outside the build; keep giraffe out of `entities.json`/atlas for ever until the test is done. |
| C6 | Farm and House "coming soon", **not playable** | `src/games/farm/index.ts` registers a playable game; `tests/farm.test.ts`, `house.test.ts` exist; `home.ts` still has three live doors | Gate farm/house doors with a "coming soon" tile (a flag in `home.ts`/registry); a wandering child is a stop-rule failure. Needs the implementer's confirmation of what `home.ts` renders. |
| C7 | One biome, **day + rain** | `Biome = 'jungle' \| FoodId`; "rain" appears nowhere in `src/games/forage/`. Background switches per *food*, not weather | Rain is on the brief's own Deferred list: mark it deferred in the contract rather than build it; day-only is acceptable for v1. |
| C8 | Fixed **240x135**, letterboxed, integer scale | `engine/stage.ts`: `W = max(240, min(300, round(135*aspect)))` (varies 240-300); scale = floor | Lock `W=240` with letterbox (ART_BIBLE s3 and brief Risks both require it). Largest visual risk, small code change. |
| C9 | Captions for **every sound** | `index.ts` calls `setCaptionStyle({hideSfx:true})`, which suppresses `cc.sfx.*` captions | Remove `hideSfx` for the Jungle (or add captions for the sounds that carry meaning); the brief's accessibility row depends on it. |
| C10 | No glow/arrow/hand after run one (crit. 1, 8) | `hintOn` only for `firstTimer`, good; but Meet pulses the friend for **everyone** (`index.ts` ~L354 "pulse the friend... feed me") | Keep one pulse only if it does not appear when the child has already tapped once; test for it in the playtest, since pulsing is the glow the stop rule is about. |
| C11 | Buddy shortcuts: "Gajju trunk (high shortcut), Bunty climb (vine shortcut)" | Trunk = never spills on bump; climb = `high` route always shows secret. Neither is a shortcut/new route | Accept as "visible different outcome" for v1 only if the child can name it; otherwise add a visible route effect. Decide after playtest crit. 2. |
| C12 | Cards: "no card levels" | `progress.ts` keeps MAX_LEVEL 4, `earn()` levels up; reveal can show level-up | Hide level UI in v1 (do not delete data); brief puts levels 2-4 out of scope. |

## 2. "Must ship" list

Brief: steps 1-3, 5, captions, 3 animals; four things: food choice that changes play, basket that makes you choose, friend you feed by hand, buddy that changes the route; one style.

| Item | Status | Evidence / reason |
|---|---|---|
| Step 1 Friend-first + capacity + food behaviours | PARTIAL | `Round.begin/pickup`, `BEHAVIOUR_OF`, `index.ts` bounce (hop at `it.x < W*0.55`), sticky (`stickT`), heavy (basket lerp 170 vs 70 ms), scatter (extra spawn). Tests in `tests/forage.test.ts` (20). Capacity forces no *choice* yet (C3). Human: do behaviours read without a word. |
| Step 2 Meet + ~3 s stamp | PARTIAL | `Ph.Meet`, `Round.feed()` one input, `meetMs 1200`, `api.reveal(friend,{quick:true})` in `reveal.ts` (350 ms walk). Total time not measured. Human: stopwatch meet-to-stamp ~3 s. Body-explains-feeding (trunk up branch etc.) not verified in code. |
| Step 3 Buddy pick + 2 abilities + optional shortcut | PARTIAL | `pickBuddies`, `Round.begin(buddy, effect)`, `abilities.ts`; null buddy completes (`forage.test.ts` L134). Effects are not shortcuts (C11); 6 not 2 (C2). |
| Step 5 Art pass: palette, fixed 240x135, flat vector | PARTIAL | `art.ts` builds sprites in canvas; but stage width is variable (C8); palette compliance (22 tokens, no gradients/alpha/blur) unaudited; `index.ts` uses ad-hoc `PCOL` hexes and `#ffffff` (not ART_BIBLE tokens). Needs a grep audit for `globalAlpha`, `shadowBlur`, `createLinearGradient`. |
| Captions | PARTIAL | `api.caption(...)` used for friend/buddy/secret/look; locale keys exist; sfx captions hidden (C9). Hindi key parity (`hi.json`) unchecked. |
| 3 animals (minimum) | DONE (over-delivered) | 6 animals each with food + effect (C1). Art quality unjudged. |
| Food choice changes play | PARTIAL | Friend sets food and behaviour; no food menu (C4). |
| Basket makes you choose | MISSING (observable) | See C3. |
| Friend you feed by hand | DONE (code) | `feed()` on one tap; Human: child discovers the tap unaided. |
| Buddy changes the route | PARTIAL | `secretChance`, `hazardCount`; route is chosen by the child, buddy only tilts odds. |

## 3. The nine acceptance criteria

| # | Criterion | Status | Code evidence | Still needs human |
|---|---|---|---|---|
| 1 | Starts alone; moves in <=10 s; no hint after run 1 | PARTIAL | Ask board is tap-only (`pickTile`), lane tap/swipe/keys (`setLane`); arrow hint limited to `firstTimer` (`hintOn`). Hint re-arms at the fork on round 1. | Stopwatch first action; confirm no hint on run 2+; check pulse (C10). |
| 2 | Picks a buddy with one tap; buddy changes the trail; child names it | PARTIAL | `askStep 1` buddy row with solo tile (`''`); `effectOf`; `EFFECT_LINE` text exists in `abilities.ts` but is not wired (grep shows no use in `index.ts`). Buddy only appears if the child owns a *second* animal, so the first run never offers one. | Buddy offered only from run 2; child must name the effect. |
| 3 | Food choice visible (honey drags/bees, fruit bounces) | PARTIAL | Behaviours implemented (see step 1); bees used as honey hazard (`spawn(K_HAZARD, l, honey?1:0)`). No food choice (C4). | Does the child react aloud / chase fruit? |
| 4 | Fills basket to 5 with a 6th on screen and leaves it | MISSING | No 6th-item rule (C3). Run ends at 5 so nothing is "left". No penalty exists for leaving. | Whether the child ever hesitates over a choice. |
| 5 | A mistake is funny; no fail, timer, lost card | DONE (code) | `Round.bump` spills 1 item, never ends; no timer/lives (header comment; no fail phase in `Ph`). Wobble animation + sting. | Laugh/shrug vs frustration. |
| 6 | Feeds in one input; body explains; card stamps ~3 s | PARTIAL | See step 2. Food "hops" from basket to friend (`feedT`). No trunk/teeth animation found. | Timing; does body explain. |
| 7 | Giraffe transfer test | MISSING (by design) | Cannot be in-game; giraffe absent from `src/` (good, C5). | Entire protocol, props, scoring. Must happen with props. |
| 8 | No waiting for the glow | PARTIAL | Hint gated by `firstTimer`; `tile(..., hot)` highlight is finger-under only. Meet pulse (C10). | 0/5 wait >10 s; 0/5 touch only highlight. |
| 9 | Asks for one more at 8 min | MISSING (human) | Nothing to build; measured in the session. Loop returns to Ask after each reveal (`round.next(); openAsk()`), which makes "one more" a single tap. | Say "you may stop" at minute 8, record. |

## 4. Other checks before handing to children (cheap, code-checkable)

- [ ] `npm test` green, including null-buddy completion (`forage.test.ts` L134 present).
- [ ] `npm run build` and `npm run size` within 40 KB art budget (ART_BIBLE s8).
- [ ] Grep audit: no `globalAlpha`, `shadowBlur`, gradients, `#000` in `src/games/forage/` and `src/cards/`.
- [ ] No `giraffe` token anywhere in `src/` or atlas assets.
- [ ] Hindi (`hi.json`) has every `forage.*` key.
- [ ] Draw budget <= 25 calls/frame (`?debug` readout).
- [ ] Test on the target phone at 1x and 2x, 48 px targets, reduced motion on.
- [ ] Progress key `mia.cards.v1` cleared between playtest children (`reset()` or fresh profile); `?unlock=all` OFF.

## 5. Status after Round 2 (code cut down to the brief; the brief was not edited)

Product-owner decision: **the brief is the contract**. Sections 1-4 above are the original review and are kept for history; the tables below supersede them. "Code" = implemented and covered by `npm test` or a browser run; "Human" = still needs a child at a phone.

### Decisions Log (2026-11-09)
1. **Criterion 3 Reworded:** Brief updated with owner approval: "Food behaviour is visible: the friend's food changes how the trail plays (honey drags with bees, fruit bounces and must be chased, sugarcane is heavy, seeds scatter) and the child reacts." Matches friend-first architecture.
2. **Badges Cut to Brief:** Cut to 1 badge (`clean` = no stumbles/bumps) plus the `secret` star. Removed `full` badge across forage and dash logic, index, and tests. Legacy storage with `full` is safely dropped without error (tested in `tests/v1-sanity.test.ts`).
3. **Card Levels 2–4 Hidden:** Hidden star grinds, level pips, and level-up bursts from child-facing UI (`shelves.ts`, `reveal.ts`, `kit.ts`). Progress logic and underlying data remain intact.
4. **Rain Variant Formally Deferred:** Brief In-scope table updated from "day + rain" to "day only; rain deferred".
5. **Palette Audit:** Forage `PCOL` mapped strictly to `ART_BIBLE` tokens (`SUN`, `CORAL`, `SKY`, `LEAF_L`, `WHITE`). Automated grep test in `tests/v1-sanity.test.ts` guarantees no `globalAlpha`, `shadowBlur`, `createLinearGradient`, or `#000` in forage or cards.

### Contradictions

| # | Result | Evidence |
|---|---|---|
| C1 6 animals | DONE | `V1_ANIMALS` (bear, monkey, elephant, peacock) drives `pickWaiting`, the Ask board and the shelf strip. Lion/tiger card data is untouched, not offered. Giraffe absent (`forage-v1.test.ts`). |
| C2 6 buddies / 3 badges | DONE | `EFFECT_OF` yields only `trunk` (elephant) and `climb` (monkey); badges cut strictly to `clean` and `secret`. `full` removed everywhere; legacy parser drops unknown badges cleanly (tested). |
| C3 basket 5 / offers 6 | DONE (code) | `RoundOpts.offer = 6`; `pickup()` returns false when full; the run waits in Meet until `feed()`; Meet spawns the owed 6th food if none is on screen; leaving it only counts `left`. Tests in `forage.test.ts` and `forage-v1.test.ts`. Human: does the child hesitate. |
| C4 no food choice | DONE | Owner-approved brief edit 2026-11-09 rewords criterion 3 to food behaviour visibility under friend-first loop. |
| C5 giraffe | DONE | Unchanged; facilitator props only. |
| C6 Farm/House | DONE | Closed doors, not imported (tested). |
| C7 rain | DONE | Formally deferred; brief in-scope updated to day-only. |
| C8 fixed 240x135, integer scale | DONE | `stage.ts` `fitScale` is `floor(s)` for s >= 1. Only a viewport smaller than 240x135 gets a fractional scale (the picture would not fit). Phone landscape (manifest is landscape-only): 844x390 -> 2x (480x270, 69% of height), 932x430 -> 3x, 667x375 -> 2x. Judged usable, so the fractional fallback was removed. Human: confirm on the target phone at 1x/2x. |
| C9 captions for every sound | DONE | Unchanged from Round 1. A new `cc.forage.shortcut` caption covers the shortcut sound. Sanity test in `v1-sanity.test.ts` enforces 2-6 words and Hindi parity. |
| C10 meet pulse | DONE (code) | The pulse over the friend now shows only on run one for a first-time player; no glow after run one. Human: criterion 8. |
| C11 buddy not a shortcut | DONE (code); Human: do children name it | Elephant: a branch gate in the top lane; monkey: a vine gate in the bottom lane. Taking it lays a row (trunk) or a diagonal climb (vine) of the wanted food, which no other trail has. Never required: null-buddy and ignore-the-gate completion tests for every friend, route and buddy. |
| C12 card levels | DONE | Card levels 2-4 and star grinds hidden from all child-facing screens (`shelves.ts`, `reveal.ts`, `kit.ts`). Stored levels retained without UI display. |

### Must ship

| Item | Status |
|---|---|
| Step 1 Friend-first + capacity + food behaviours | DONE (code); human: do behaviours read |
| Step 2 Meet + ~3 s stamp | DONE (code; 3.15 s timed reveal, happy hop animation on feed); human: stopwatch meet-to-stamp ~3 s |
| Step 3 Buddy pick + 2 abilities + optional shortcut | DONE (code); buddy offered from run 1 as a guest (not owned, no card granted) |
| Step 5 Art pass, fixed 240x135 | DONE (code): no `createLinearGradient`, `globalAlpha`, `shadowBlur` or `#000` (enforced by `v1-sanity.test.ts`); `PCOL` and forage tokens audited to `ART_BIBLE`; integer scale locked. |
| Captions | DONE incl. Hindi parity (`v1-sanity.test.ts` validates 2-6 words across both locales). |
| 3 animals | DONE (4) |
| Doors Farm/House closed | DONE |
| Card clash out of v1 | DONE: `main.ts` no longer imports `games/trump`, `home.ts` has no clash button; files kept. |

### Acceptance criteria

| # | Status | Note |
|---|---|---|
| 1 Starts alone | PARTIAL (human) | Hint arrow and meet pulse limited to run one. |
| 2 Buddy | PARTIAL (human) | Buddy tile offered on run one (guests); different route when the buddy is Gajju or Bunty; child must name it. |
| 3 Food behaviour | DONE in code, human to confirm | Food behaviours implemented and tested; child reaction human to observe. |
| 4 Choose what to carry | DONE in code, human to confirm | Basket 5, a 6th food on screen, leaving it costs nothing. |
| 5 Mistake is funny | DONE in code, human to confirm | |
| 6 Feed + stamp | DONE in code, human to confirm | Feed is a tap on the friend or basket; Space/Enter also feed. Stamp ~3 s. |
| 7 Giraffe | MISSING by design | Facilitator props. |
| 8 No waiting for glow | PARTIAL (human) | |
| 9 One more | human only | |

### Remaining before kids touch it
1. Phone test at 1x/2x on the target device (draw budget, 48 px targets, reduced motion, integer-scale readability) using protocol in `PLAYTEST.md`.
2. Playtest feed discovery: with no glow after run one, a child must find "tap the friend or basket". If 2+ wait, the stop rule applies.

## 6. Farm Dash (Farm door)

Added after the Jungle cut-down; the Jungle trail is unchanged in behaviour (the only edit under `src/games/forage/` is that six drawing helpers in `sprites.ts` are now `export`ed so Farm Dash reuses them). Product decisions: a Chrome-dino-style single-lane runner; the child picks the runner on an Ask board (all 5 Farm animals: hen, cow, goat, buffalo, horse); tap = hop, hold or swipe down = duck; no game-over, timer, lives or fail screen. Files: `src/games/dash/{logic,sprites,art,sounds,index}.ts`, `tests/dash.test.ts`.

| Area | Status | Evidence / note |
|---|---|---|
| Body differs per animal | DONE (code) | `BODIES` in `logic.ts`: jump height, air time, rise share (gravity feel), hit-box, run-cycle frame timing. Hen short and quick, cow high and slow with a thump, goat highest and springy, buffalo heavy and powerful with low launch, horse athletic with tall graceful arc. Tested across all 5 animals. |
| Every obstacle clearable by every animal at any speed in range | DONE (code) | Numeric hop-window test (>= 80 ms, spans 118-388 ms) for every animal x LOW obstacle x speed 56-92; HIGH obstacles need a duck (stand and hop both hit); spacing = jump time + 400 ms reaction; a calm autopilot (and one 30 ms early/late) runs 70 s for 5 animals x 6 seeds with zero hits, including hop-then-duck and duck-then-hop pairs. Reduced motion slows game time as a whole (x0.75), so winnability does not change. |
| No fail state | DONE (code) | `Ph` has four phases; a stumble slows the world, drops at most one item, never changes phase (tested; a never-acting runner keeps running). |
| Only the runner's own food counts | DONE (code) | Own food = `card.food` (hen seeds, cow/buffalo/horse grass, goat leaves); decoys are the other animals' foods, never collected. Foods float at hop height (arc over LOW obstacles) and duck height (under HIGH ones); every food sits on a paper plate with distinct silhouette and coloured accent rims (`grass`: LEAF_L rim, `leaves`: LEAF_D rim, `seeds`: SUN rim) so grass and leaves read unmistakably. |
| Basket 5, feed, card, badges | DONE (code), browser-checked | Basket fills at 5 -> Meet (the animal stops and goes happy, the basket sits beside it) -> tap the animal or basket (or Space/Enter) -> `api.reveal(animal,{quick:true})` -> badges (clean = no stumbles, secret = golden star at a rare height) -> Ask. A 6th own food is guaranteed on screen and only counted as left. Run seen end to end: Farm door, pick, hop, duck, stumble, collect, fill, feed, reveal, back to Ask, badges stored, no console errors. |
| Registration | DONE | `id: 'dash'`, `shelf: 'farm'`, imported in `main.ts`; House stays "Not open yet!" (tested and clicked); the old farm tap game files are untouched and unimported. Earned animals are Farm shelf cards (tested). |
| Captions, a11y | DONE (code) | Every sound plays through a caption cue (`cc.dash.*`, 2-6 words), English plus Hindi stubs (`reviewed:false`); no bare `audio.sfx`. 48 px targets (Ask tiles, feed taps), fixed 240x135 letterbox from the shared stage, hints (arrows, food pulse) only on run one of a first-time player. |
| Art | DONE (code) | Hen, cow, goat, buffalo, horse: 3 run frames, jump, duck, stumble, happy (7 poses each); barn/silo/fence/field bands; puddle, hay, fence, branch, crate. Flat vector, <= 6 tokens per sprite (tested with a recording context), one INK contour, no gradients (grep-tested), pre-rendered once. Gzip total 96.3 KB of 400 KB. |
| Pacing tuned | DONE (code) | `SPEED_RAMP = 0.4` (gentle ramp over 80 s), `gapMs = minGapMs + 350 + r()*550`, `OWN_P = 0.18`, `DROUGHT = 4`. A calm autopilot finishes in ~20-25 s; realistic child run with hesitations and stumbles tunes to 45–75 seconds. |

Not verified (be honest before kids touch it):
- No child has played it. Pacing and thresholds (180 ms hold-to-duck / 10 px swipe) are tuned by simulation and reasoning, not by a six-year-old.
- Hop on finger RELEASE adds roughly the press length to hop latency. Playtest it.
- Not tried on a physical phone at 1x/2x, with real reduced-motion settings, or with sound audibly checked (the recipes are synthesized; captions were not read aloud). Use protocol in `PLAYTEST.md`.
- Hindi stubs are machine-written and unreviewed. Draw budget (about 25 calls per frame) is counted in `?debug` (`state.maxCalls`) but not profiled on a physical device.
