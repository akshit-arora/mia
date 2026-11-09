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

### Contradictions

| # | Result | Evidence |
|---|---|---|
| C1 6 animals | DONE | `V1_ANIMALS` (bear, monkey, elephant, peacock) drives `pickWaiting`, the Ask board and the shelf strip. Lion/tiger card data is untouched, not offered. Giraffe absent (`forage-v1.test.ts`). |
| C2 6 buddies / 3 badges | DONE (buddies); PARTIAL (badges) | `EFFECT_OF` yields only `trunk` (elephant) and `climb` (monkey); roar/pounce/sniff/fan map to `none` and their trail code is removed. The 3 badges (clean/full/secret) are unchanged: the brief says "1 badge + 1 secret", which is not enforced. |
| C3 basket 5 / offers 6 | DONE (code) | `RoundOpts.offer = 6`; `pickup()` returns false when full; the run waits in Meet until `feed()`; Meet spawns the owed 6th food if none is on screen; leaving it only counts `left`. Tests in `forage.test.ts` and `forage-v1.test.ts`. Human: does the child hesitate. |
| C4 no food choice | OPEN (owner sign-off) | Unchanged: the friend fixes the food. The brief criterion 3 still says "picking one of three foods". The brief was not edited, so criterion 3 stays PARTIAL. |
| C5 giraffe | DONE | Unchanged; facilitator props only. |
| C6 Farm/House | DONE | Closed doors, not imported (tested). |
| C7 rain | OPEN (accepted as deferred) | Brief lists the rain variant under "Deferred if time runs out", but the In-scope table still says "day + rain". |
| C8 fixed 240x135, integer scale | DONE | `stage.ts` `fitScale` is `floor(s)` for s >= 1. Only a viewport smaller than 240x135 gets a fractional scale (the picture would not fit). Phone landscape (manifest is landscape-only): 844x390 -> 2x (480x270, 69% of height), 932x430 -> 3x, 667x375 -> 2x. Judged usable, so the fractional fallback was removed. Human: confirm on the target phone at 1x/2x. |
| C9 captions for every sound | DONE | Unchanged from Round 1. A new `cc.forage.shortcut` caption covers the shortcut sound. |
| C10 meet pulse | DONE (code) | The pulse over the friend now shows only on run one for a first-time player; no glow after run one. Human: criterion 8. |
| C11 buddy not a shortcut | DONE (code); Human: do children name it | Elephant: a branch gate in the top lane; monkey: a vine gate in the bottom lane. Taking it lays a row (trunk) or a diagonal climb (vine) of the wanted food, which no other trail has. Never required: null-buddy and ignore-the-gate completion tests for every friend, route and buddy. |
| C12 card levels | OPEN | `progress.ts` unchanged; level UI not hidden. |

### Must ship

| Item | Status |
|---|---|
| Step 1 Friend-first + capacity + food behaviours | DONE (code); human: do behaviours read |
| Step 2 Meet + ~3 s stamp | PARTIAL (timing, body-explains not verified) |
| Step 3 Buddy pick + 2 abilities + optional shortcut | DONE (code); buddy offered from run 1 as a guest (not owned, no card granted) |
| Step 5 Art pass, fixed 240x135 | PARTIAL: no `createLinearGradient` in `cards/scenes.ts` or forage (flat bands, tested); integer scale done. Not done: palette audit of `index.ts` `PCOL`/`#ffffff`, 1x/2x phone check. Gradients remain in `games/farm` and `games/house` art (not imported in v1). |
| Captions | DONE incl. Hindi stub (`hi.json` has every `forage.*` and `cc.forage.*` key; `reviewed:false`). |
| 3 animals | DONE (4) |
| Doors Farm/House closed | DONE |
| Card clash out of v1 | DONE: `main.ts` no longer imports `games/trump`, `home.ts` has no clash button; files kept. |

### Acceptance criteria

| # | Status | Note |
|---|---|---|
| 1 Starts alone | PARTIAL (human) | Hint arrow and meet pulse limited to run one. |
| 2 Buddy | PARTIAL (human) | Buddy tile offered on run one (guests); different route when the buddy is Gajju or Bunty; child must name it. |
| 3 Food choice | PARTIAL | See C4. |
| 4 Choose what to carry | DONE in code, human to confirm | Basket 5, a 6th food on screen, leaving it costs nothing. |
| 5 Mistake is funny | DONE in code, human to confirm | |
| 6 Feed + stamp | PARTIAL (human) | Feed is now a tap on the friend or basket (a tap elsewhere only moves the basket); Space/Enter also feed. |
| 7 Giraffe | MISSING by design | Facilitator props. |
| 8 No waiting for glow | PARTIAL (human) | |
| 9 One more | human only | |

### Remaining before kids touch it
1. Phone test at 1x/2x on the target device (draw budget, 48 px targets, reduced motion, integer-scale readability).
2. Owner sign-off on C4 (criterion 3 wording), and decide C12 (hide level UI) and the "1 badge" limit.
3. Palette audit of the forage `index.ts` hexes.
4. Playtest feed discovery: with no glow after run one, a child must find "tap the friend or basket". If 2+ wait, the stop rule applies.

## 6. Farm Dash (Farm door)

Added after the Jungle cut-down; the Jungle trail is unchanged in behaviour (the only edit under `src/games/forage/` is that six drawing helpers in `sprites.ts` are now `export`ed so Farm Dash reuses them). Product decisions: a Chrome-dino-style single-lane runner; the child picks the runner on an Ask board (hen, cow, goat); tap = hop, hold or swipe down = duck; no game-over, timer, lives or fail screen. Files: `src/games/dash/{logic,sprites,art,sounds,index}.ts`, `tests/dash.test.ts`.

| Area | Status | Evidence / note |
|---|---|---|
| Body differs per animal | DONE (code) | `BODIES` in `logic.ts`: jump height, air time, rise share (gravity feel), hit-box, run-cycle frame timing. Hen short and quick, cow high and slow with a thump, goat highest and springy. Tested. |
| Every obstacle clearable by every animal at any speed in range | DONE (code) | Numeric hop-window test (>= 80 ms) for every animal x LOW obstacle x speed 56-92; HIGH obstacles need a duck (stand and hop both hit); spacing = jump time + 400 ms reaction; a calm autopilot (and one 30 ms early/late) runs 70 s for 3 animals x 6 seeds with zero hits, including hop-then-duck and duck-then-hop pairs. Reduced motion slows game time as a whole (x0.75), so winnability does not change. |
| No fail state | DONE (code) | `Ph` has four phases; a stumble slows the world, drops at most one item, never changes phase (tested; a never-acting runner keeps running). |
| Only the runner's own food counts | DONE (code) | Own food = `card.food` (hen seeds, cow grass, goat leaves); decoys are the other two animals' foods, never collected. Foods float at hop height (arc over LOW obstacles) and duck height (under HIGH ones); every food sits on a paper plate so it reads on any background. |
| Basket 5, feed, card, badges | DONE (code), browser-checked | Basket fills at 5 -> Meet (the animal stops and goes happy, the basket sits beside it) -> tap the animal or basket (or Space/Enter) -> `api.reveal(animal,{quick:true})` -> badges (clean = no stumbles, full = no spills, secret = golden star at a rare height) -> Ask. A 6th own food is guaranteed on screen and only counted as left. Run seen end to end in the dev pane: Farm door, pick, hop (Space and a synthetic tap), duck (ArrowDown, swipe, hold), stumble, collect, fill, feed, reveal, back to Ask, badges stored, no console errors. |
| Registration | DONE | `id: 'dash'`, `shelf: 'farm'`, imported in `main.ts`; House stays "Not open yet!" (tested and clicked); the old farm tap game files are untouched and unimported. Earned animals are Farm shelf cards (tested). |
| Captions, a11y | DONE (code) | Every sound plays through a caption cue (`cc.dash.*`, 2-6 words), English plus Hindi stubs (`reviewed:false`); no bare `audio.sfx`. 48 px targets (Ask tiles, feed taps), fixed 240x135 letterbox from the shared stage, hints (arrows, food pulse) only on run one of a first-time player. |
| Art | DONE (code), looks checked at desktop size only | Hen, cow, goat: 3 run frames, jump, duck, stumble, happy; barn/silo/fence/field bands; puddle, hay, fence, branch, crate. Flat vector, <= 6 tokens per sprite (tested with a recording context), one INK contour, no gradients (grep-tested), pre-rendered once. Gzip total 96.0 KB of 400 KB. |

Not verified (be honest before kids touch it):
- No child has played it. Run length, ramp (60 to 92 px/s over about 55 s), how many own foods appear (about 0.7 per obstacle) and the 180 ms hold-to-duck / 10 px swipe thresholds are tuned by reasoning and simulation, not by a six-year-old. A perfect autopilot fills the basket in about 20 s; real children will take longer.
- Hop is triggered on finger RELEASE of a quick tap (so a hold can become a duck); that adds roughly the press length to hop latency. Playtest it.
- Not tried on a phone at 1x/2x, with real reduced-motion settings, or with sound audibly checked (the recipes are synthesized; captions were not read aloud). The dev pane draws at about 1 fps, so timing was driven with `?debug` hooks (`window.__dash`: `go`, `fill`, `feed`, `sim`, `setAuto`, `bring`) rather than real-time play; smoothness of the run cycle is unseen.
- Grass and leaves are the closest-looking foods (both green); the paper plate and different shapes separate them, but check that a child can tell the cow's grass tuft from the goat's leaf.
- Hindi stubs are machine-written and unreviewed. Draw budget (about 25 calls per frame) is counted in `?debug` (`state.maxCalls`) but not profiled on a device.
- Buffalo and horse are Farm shelf cards but not runners yet (the Farm shelf has 5; the Ask board and the shelf strip show only the 3 playable ones). Card levels (C12) and the "1 badge" limit are unchanged.
