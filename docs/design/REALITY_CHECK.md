# Reality Check: "Try It" redesign and the Bholu story layer

Reviewer: Reality Checker. Date: 2026-11-06. Status: review of two proposals, no code or design file changed.
Inputs read in full: STORY_PUZZLES.md (the Designer), STORY_CHARACTERS.md (the Narrator), PLAN.md, ANIMALS.md, BUILD_REPORT.md, BACKLOG.md (top), src/types.ts, src/game/game.ts, src/game/world.ts, src/game/reactions.ts, src/engine/stage.ts, src/audio/index.ts (headings), src/data/entities.json (head).

What I did NOT do, so you can weigh this: I ran nothing, tested no phone, watched no child, and did no web search. Research claims below come from memory. Each carries a tag: **[E]** well-established and widely replicated or textbook, **[S]** a specific study I am confident exists but whose size or scope is limited, **[J]** my judgement or designer folklore, not a clean finding. Verify any [S] citation before you quote it outside this repo.

---

## 0. Verdict at a glance

| Question | Verdict |
|---|---|
| Are the two documents ready to build as written? | **NO. NEEDS WORK.** |
| Build a playable prototype of ONE scene? | **GO WITH CHANGES** (section 7). |
| Commit to the full redesign (3 scenes, town, 7-night Jugnu arc, Moon Mela)? | **NO-GO** until a 5-child test passes. |
| Does the design beat the current Deliver game on "workbook feel"? | Probably yes on first impression, **not proven**. |
| Does the design give the child a transferable WHY? | Only in Tuck-in Night, and only partly. Stuck Truck is weak. Snack Stakeout is close to none. |
| Does it cover wild, pets, domestic, food, homes? | Food and homes yes. Domestic partly. **Wild and pets effectively no.** |
| Is it one-person buildable and tiny? | The 400 KB budget is not the risk. Animation clips, hand-drawn props and device feel are. |

Quality as design documents: Designer B-, Narrator B (better tone work, and its own risk table is the more honest of the two). Quality as evidence of learning: C. Neither document contains a single observation of a child.

The Designer's section 9 marks six of eight anti-patterns "Pass by construction". An author grading their own homework is the pattern I distrust most. I re-graded them in section 1.

---

## 1. Failure-pattern audit

### 1.1 The patterns, the evidence, and where the documents land

| # | Pattern | Strength of evidence | Where it bites here | My grade |
|---|---|---|---|---|
| P1 | **Chocolate-covered broccoli**: a game wrapped around unrelated drill (term from Amy Bruckman, "Can educational be fun?", GDC 1999) | [E] as a concept; folklore for how often it kills engagement | Deliver was exactly this (BUILD_REPORT: "labelled zones, correct/wrong, praise"). Try It removes the praise-then-sticker wrapper but keeps the underlying act: *pick the card whose trait fits the target*. | Improved, not solved. See F1. |
| P2 | **Intrinsic vs extrinsic integration** (Habgood and Ainsworth 2011, J. Learning Sciences; children about 7 to 11, fractions; the intrinsic version produced more learning and more voluntary play) | [S] one well-known study, small, one topic, but consistent with Lepper and Malone 1987 [E-ish] | Try It is **more intrinsic than Deliver**: the animal's trait IS the game's physics (strong animal, stones light). That is a real step up and the best idea in both documents. But the *skill the game requires* is not the knowledge: trial and error beats thinking (F2). | Mid. |
| P3 | **Edutainment collapse of the 1990s** (Reader Rabbit, Math Blaster, JumpStart era; The Learning Company was bought by Mattel in 1999 and sold in 2000 at a large loss) | [E] the business facts; the *causes* are argued ([J]: shovelware, drill with an arcade skin, thin content per title, no replay) | The lesson to take is "content depth per unit of effort", not "pedagogy". Fourteen clips and about nine situations is thin for a child who wants the 40th play (F11). | Risk, medium. |
| P4 | **Reward-driven apps** (stars, coins, streaks). Overjustification: tangible contingent rewards can reduce later interest (Lepper, Greene and Nisbett 1973, preschoolers) | [E] for the effect in that setting; weaker for in-game stickers [J] | The Designer bans counters (section 4.4). But a sticker for **every distinct outcome** is a collection loop, and the Narrator's lit windows and "trail of lanterns" (N5) are a progress bar with nicer paint. | Risk, medium. See F3. |
| P5 | **"Wrong is funnier"**: children choose the failure that gets the laugh and skip the lesson | [J] designer folklore, no clean study I can cite. Closest research: seductive details (Harp and Mayer 1998, adults) and the 2015 meta-analysis on interactive storybooks (Takacs, Swart and Bus: animation that is *congruent* with the content helps, decorative or distracting hotspots hurt) [S] | The Designer says funny misses are "as shiny as solves" and collectible (4.4). That deliberately makes the laugh the reward. It is congruent only if the gag *shows the reason*. The lion nap and cat wash show a joke, not a cause (F6). | **Highest risk after P6.** |
| P6 | **Card mashing / gaming the system**: cheap retries let a learner skip thinking (Baker, Corbett and Koedinger 2004, tutoring software, older students) | [S] for older students; extrapolation to 6-year-olds is [J] | The Designer's own rules make mashing optimal: every drop runs, runs are skippable (rule 4), the card returns, nothing is lost (rule 1). Five cards take about 15 to 30 s to cycle un-skipped and under 10 s skipped. | **High risk.** F2. |
| P7 | **Unassisted discovery** (Kirschner, Sweller and Clark 2006) vs **assisted discovery with feedback and explanation** (Alfieri et al. 2011 meta-analysis) | [E] that unguided discovery underperforms; [S] for the meta-analysis | Try It has feedback (the Run) but no step that makes the child commit to a reason first or compare two cases. That is "feedback only", the weaker end. | Gap. F7. |
| P8 | **Four pillars of apps that teach** (Hirsh-Pasek et al. 2015, Psychological Science in the Public Interest): active, engaged, meaningful, socially interactive | [S] review paper, widely cited | Active yes, engaged likely, meaningful in the story, **socially interactive no** (single player, silent, no adult prompt). | Gap, cheap to fix. |
| P9 | **Predict-observe-explain** and self-explanation (White and Gunstone 1992; Chi et al. 1994) | [E] in science education | Absent. The Designer calls the thesis "what will happen if...?" (STORY_PUZZLES 1) but nothing in the mechanic makes the child *predict*. The prediction exists only if the child volunteers it. | Missing core beat. |
| P10 | **Adult-pleasing design**: we like the idea more than the child does | [J] | The 7-night Jugnu arc, Moon Mela, Panchatantra framing, scrapbook. The Narrator admits it ("Adult-pleasing story: Medium"). A 6-year-old's likely wants: splash, silly sounds, surprise, my favourite animal. | Risk. |

### 1.2 What is genuinely better than the current game (credit where due)

- The first screen is a character in trouble, not a question (NARRATIVE 1.3). This directly attacks the "Ohh, educational game?" reaction, though one reaction from one child is thin evidence for what caused it. It may have been the three labelled zones and the animal grid, not the mechanic.
- Consequence instead of verdict is the right direction (P2).
- The Narrator's tone rules (5.1 to 5.3, "Oh no is not a buzzer") are specific and sound.
- Tags drive outcomes ("swap the facts" test, STORY_PUZZLES 1.1) is a good authoring discipline for a one-person project.
- The Designer's own kill criteria (10.4) exist. Most proposals have none.

### 1.3 Specific defects, with passages

**F1. It is still a multiple-choice question with animated feedback.** STORY_PUZZLES 3 defines three outcomes: SOLVED, HELPED, FUNNY, "problem unchanged; card hops back to the tray". To a 6-year-old, "truck is still stuck and my animal hopped back" is *wrong*, delivered kindly. The doc says "There is no verdict" (1). There is: the truck is free or it is not. Calling failure funny does not make it not failure. That is fine (failure as play is a good design) but the doc should stop claiming it is not a quiz, because that claim is what stops the team from designing against the quiz reflex.

**F2. Cards are free to try, so knowledge is optional.** Rules 1 and 4 (section 3): every drop runs, runs are cheap and skippable, the card returns. With 4 to 5 cards the cheapest strategy is "try them all left to right". The Designer lists this as a kill signal (10.4) but nothing in the *mechanic* prevents it. This is P6.

**F3. The sticker book rewards enumeration, not understanding.** Section 4.4: "A sticker for every distinct thing the child discovered", plus "a single blank frame for 'the next one'". Tuck-in alone is 5 guests x 5 homes = 25 distinct combinations; Stuck Truck about 9; Snack Stakeout 8 or more. Over 45 stickers, and a visible "next blank". That is Pokemon-style completionism, and the cheapest way to complete is cycling every card (F2). The stated protection (no counters) is undone by the blank frame. R3 ("house chasing") was spotted; "sticker chasing" was not.

**F4. Reward and reaction asymmetry.** "Hooray!" on solve, giggle-honk on miss (NARRATIVE C9 flags this). Children read praise by asymmetry within one or two plays.

**F5. Snack Stakeout hides its own rule.** Section 5.2: a snack brings a *random* animal "weighted to animals the child has not met yet". Grass can bring cow, buffalo, goat, horse or elephant. So the same input gives different outputs, and the weighting is by novelty, not by anything the child can see. A child cannot form "grass -> cow" (false anyway) nor see "grass -> things that eat grass" (the true rule) from one trial. Also, **any snack produces someone**, so the child never has a reason to think (no wish set means no stake). The only prediction in the scene is Wish mode, which the Designer lists as an optional extra (Q7).

**F6. Reasons are given by gag, not by cause.** The cat "bats the rope, climbs on the truck and washes"; the lion "yawns and sleeps". These show *what the animal does*, not *why it cannot pull*. The data even encodes lion as `power:0` (5.0 table) while the picture says "heavy". A child can come away with "lions are weak" (the data), "lions are lazy" (Narrator T3 worries about this), "lions are heavy" (the picture), or "wild animals do not take orders" (the intent). Four readings from one clip. The only run that carries a true visible cause is dog/horse (more stones for more strength).

**F7. No assistance beyond feedback.** No predict step, no side-by-side contrast, no explanation prompt, no transfer in the loop. See P7 and P9.

**F8. The numbers in the spec do not add up.** Using STORY_PUZZLES 5.1: need 3 stones; horse 3, buffalo 4, dog 1, cat 1 (table 5.0) but the cat's Run is "FUNNY (0 stones)"; hen 0.5.
- "Dog plus cat plus hen: 2.5, not enough" yet the text says "the child works out that many small ones can add up". On a 3-stone mud they never can. A half-stone cannot be drawn.
- Visit 2, mud 5: "must combine (horse plus dog, or buffalo plus cat)". Horse 3 + dog 1 = 4, **not 5**. Buffalo 4 + cat 1 = 5 only if the cat helps, which its clip says it does not.
- Visit 1 has `slots: 1`, but HELPED says "try adding another"; it is unspecified whether the dog stays on the rope.
- The lion "sinks the truck one stone deeper", so the target silently changes from 3 to 4.
Fix: integers only, helpers persist on the rope, slot count stated per visit (section 7 gives a consistent set).

**F9. The hint ladder gives the answer and starts too early.** Step 1 fires after about 6 s of idle (section 8). A 6-year-old watching, thinking or laughing for 6 s is not stuck (PLAN 4.4 itself says "hesitation is treated as curiosity"). Step 3 "the horse card hops once and the ground shakes" is the answer at about 18 s. Start the ladder at 10 s or later, and keep it attention-first.

**F10. The story layer is a third motivation system.** The goal "light the town and find Jugnu" (NARRATIVE 7.2) adds lit windows, a Moon Lantern, Jugnu stages over 7 sessions and a Mela. A 6-year-old's likely recall of a story across sessions is weak; sessions are 2 to 3 minutes. It is the largest unproven asset in the plan and it has the highest build cost.

**F11. Content depth does not match the retention ambition.** The honest depth is: 3 scenes, about 9 situations, 14 clips, about 30 to 45 stickers. A child who loves it will exhaust it in 2 or 3 sessions. That is acceptable for a free open-source tool *if you say so out loud*; it is a fantasy if the plan leans on 7-night arcs.

**F12. No person on screen for a concept that is about people.** Domestic and pet mean "lives with and is cared for by people". N7 leaves humans out "to avoid gender, class and skin cues". Without a hand, a bowl, a collar, a barn or a lantern-keeper silhouette, the one thing that defines the category has no picture. See section 3.

**F13. Decision D3 is an owner decision.** PLAN D3 says "first mechanic is Deliver" and the Designer proposes superseding it (Q1). Deliver is built, tested (58 tests) and deployed. Do not delete it. See section 7.

---

## 2. The biggest risk, tested: fun without understanding

### 2.1 The test

For each scene: *What could a 6-year-old explain or do on a NEW animal afterward that they could not before?* I also state what a typical Indian 6-to-7-year-old already knows, because a scene that re-teaches known facts adds nothing no matter how funny. (My assumption, [J]: they already know horses pull carts, cats do not, lions eat meat, monkeys like bananas, rabbits live in holes, buffaloes like mud. A teacher should confirm.)

### 2.2 Scene by scene

#### Stuck Truck: rating **WEAK**

| | |
|---|---|
| Already known | Horses and buffaloes pull; dogs and cats do not; lions do not work for people. |
| New after play | Small helpers add up (only if the arithmetic is fixed, F8). Bigger and stronger pulls more. |
| New animal, what can the child do? | Pick elephant for a very stuck truck. That is a "big = strong" heuristic, which works and transfers (camel, ox) but was mostly known. |
| Where the why is | Horse versus dog versus (nothing): *magnitude* is visible (stones). That is a real, visible, comparable cause. The cat and lion clips are jokes with no cause (F6). |
| Wild/domestic | Not carried. The lion/horse contrast exists in the data but nothing visible says what differs between them. |

Smallest changes that lift it to MODERATE:
1. **Hold beat before the Run.** After the drop, the animal steps to the rope, the rope goes taut, and the world waits about 0.8 s (no sound, wheel stops). This is the cheapest possible "what will happen?" moment, and it is where the child forms a guess. Costs a tween.
2. **Integer stones and helpers that stay.** Horse 3, elephant 4, dog 1, rabbit 1, cat 0, lion 0. A second slot from round 2 so "horse + dog" is a real, discoverable, 2-card solve (section 7 table).
3. **Contrast pair on screen:** after any Run, leave the lit stones visible so the next drop is compared to them. Costs nothing; the doc already draws stones.
4. **Transfer round last.** A third stuck-truck with an animal the child has never dropped (elephant) beside one they have seen fail (cat) and one partial (dog). The first pick is the evidence (section 7.4).
5. Make the lion's data `helps:false` rather than `power:0`, so "does not take orders" is not the same field as "weak".

#### Snack Stakeout: rating **NONE** as designed (WEAK in Wish mode)

| | |
|---|---|
| Already known | Almost all of it: monkey-banana, rabbit-carrot, lion-meat, cow-grass. |
| New after play | Possibly bear-honey, peacock-grain, elephant-banana. These are facts, i.e. rote lookup, which is what the owner said we must not build. |
| New animal, what can the child do? | Nothing inferable. The animal's diet cannot be read from a 24 px emoji. |
| Where the why is | Nowhere. No tooth, no plant/meat contrast, no cause. "Many eat grass, few eat meat" (STORY_PUZZLES 2) is never made visible. |

Smallest changes: (a) make **Wish the default**, not an extra: "I want the tiger" is the only moment a prediction exists; (b) deterministic: one food -> one *kind* of visitor with the same body cue (all grass-eaters arrive chewing sideways), or show the other candidates as silhouettes waiting; (c) drop it from the prototype entirely (section 7) because of the content problem in section 6, item S1.

#### Tuck-in Night: rating **STRONG for two ideas, WEAK for the rest**

| | |
|---|---|
| Already known | Rabbits live in holes; a roof keeps rain off. |
| New after play | (1) A home has to fit the body: big animal, small door -> stuck (visible, inferable, transferable). (2) Different things bother different animals: rain (wet), sun (hot), noise/echo. |
| New animal, what can the child do? | For door fit: predict a goat or horse will not fit a burrow. For rain: pick something with a roof. For animal-specific needs (`cool`, `high`, `hide`): nothing, unless the animal *shows* it. |
| Where the why is | **This is the only scene with a visible cause chain**: need -> cue (drip, fan, wobble, stuck rump) -> missing part. That is the design's best asset. |
| Flaw | Needs like `high` for a hen and `hide` for a rabbit (5.0 table) cannot be read from the animal, so unseen-guest transfer (5.3 "Unseen guest") degrades to memorising 14 rows. |

Smallest change that lifts it to STRONG: **cue-first.** The guest shows its need *before* the child chooses (rain drips on its nose and it shivers; panting and fanning; looking up at branches), and each home visibly offers a remedy (a roof drawn, water, shade, height). The consequence then confirms, not reveals. The child maps cue -> remedy, and that transfers to an animal never seen (a shivering goat). Limit each guest to at most 2 needs, keep door size as the always-visible one, and drop the `hide`/owl gag (section 6, S5).

### 2.3 Four cross-cutting changes (these are the ones that matter)

1. **Hold beat** in every Run (predict). Cost: about 0.5 day once.
2. **First Run per card is unskippable.** Skipping only after a card has been seen once. Cheap anti-mash. A child who wants the laugh again can skip the second time.
3. **Stickers per reason, not per combination.** One sticker per distinct clip (about 12 total in the first release): "stuck in the door", "drip on the nose", "heave". The sticker shows the *cue* (drip, door), not the animal. It rewards noticing a reason, can be completed in one sitting, and has no "next blank" pressure.
4. **Transfer round with an unseen animal** at the end of every scene, with a local-only first-pick log the owner can read in the parent corner during playtests (device-only, never sent; consistent with PLAN principle 6).

### 2.4 Honest limit

Even with all of this, a 6-year-old's *verbal* explanation is unreliable. Test with pointing, picking and acting-out, not "why?". And a clean learning claim needs more than 5 children. The design goal that is testable at this scale is: "most children, shown a new setup, choose sensibly more often than chance".

---

## 3. Coverage of the chapter topics

| Topic | Which scene carries it | Does the child gain *clarity*? | Gap |
|---|---|---|---|
| 1 Wild | Lion/tiger "do not help" (Truck); visitors at dusk (Snack); natural homes (Tuck-in) | **No.** Nothing shows what wild means. The only visible contrast is "this one ignores the rope". | A visible difference between "needs people" and "does fine alone". |
| 2 Pets | Dog partial, cat washes (Truck); rabbit in a **burrow** (Tuck-in) | **No, and Tuck-in contradicts it.** The pet rabbit's snug home is a wild-style burrow. Dog and cat never appear as Tuck-in guests in visit 1 (guests: rabbit, buffalo, monkey, bear, hen), although section 2 of the Designer's doc lists them under Tuck-in. | Pet homes (basket, hutch, kennel) and any sign of companionship or care. |
| 3 Domestic | Horse and buffalo pull (Truck) | **Partly.** "Strong helpers" is one meaning of domestic. Milk, eggs, wool, farm barns are absent. **The cow appears in none of the three scenes** (D6, noGag), and goat barely. | Gives/yields and care; a farm shelter. |
| 4 Food | Snack Stakeout | Weakly; fact lookup (section 2.2) | See change list. |
| 5 Homes | Tuck-in Night | **Yes, the strongest.** But only wild-style homes: burrow, cave, pond, tree, hut. | Human-built homes for farm and pet animals. |

Two of five topics are covered, one partly, two not. The Designer says this honestly (STORY_PUZZLES 2: "topics 1 to 3 ... are the hardest to teach as consequences") and parks the fix in an undesigned fourth scene ("Who Comes When I Call?"). That scene, as sketched (pets to the door, farm animals to the barn, wild to the trees), is **a sorting task again**, with the sort hidden in an animation.

### The minimum extra

Do not add a fourth full scene yet. Two small data extensions of Tuck-in, which already works as a cause-and-cue scene:

1. **Add three human-built home parts and the guests that use them**: barn/shed (cow, goat, buffalo), coop (hen), basket or hutch (cat, rabbit, dog). Guests: cow, dog, cat added. The consequence is the same engine (door, roof, warmth). The *contrast* appears when the child tries a cave for the cow (dark, echo, cold wind, nobody to bring hay) and a barn for the lion (the lion walks out and is fine under a tree, it does not want it). Parts get a tag `made-by:people` and animals a flag `needs-people:true/false`.
2. **One "Rain Night" variant**: at dusk the rain comes and some animals call or shiver and some are already fine. Wild animals are already tucked into cave/tree/pond; farm and pet animals wait at the door. The child taps those who need help. "Who needs us tonight, and who is fine?" *is* the wild/domestic/pet distinction expressed as a consequence. Cost: a flag and a reuse of the shiver/drip clip.

And one cheap representation fix: show a **hand, a bowl or a lantern-keeper silhouette** (no face, no gender) when a person-made home is placed, so the "people" half of the idea exists on screen. N7 can stay deferred as a character decision; a hand is not a character.

Also: **keep Deliver as an optional "Sort" mode (Q8).** Naming animals as wild, pet or domestic is what a class test asks, and it is vocabulary by nature. It is a legitimate quick mode and a parent-facing reassurance. It is wrong as the front door. It already exists.

---

## 4. Build reality

### 4.1 What the existing code is, honestly

`src/game/game.ts` is 378 lines of a sequential async script: truck arrives, crate shakes, reveal, wait for drop, success, next. It is not a scene runner. `world.ts` hard-wires zone rectangles. Roughly 2,100 lines in `src/` total. The Game class has no tests (BUILD_REPORT next steps, item 4).

| Reuse as-is | Reuse with edits | Throw away (for the new scene) |
|---|---|---|
| `src/engine/stage.ts` (loop, tweens, input, 30/60 fps rule) | `src/game/reactions.ts`: a `Reaction` is already `{dur, motion(t), prop(g,x,y,t), sfx}`. **This is already a clip format.** Make it two-actor and replayable and the 14 poke tricks and the sticker replays come free. | Deliver loop in `game.ts` (crate, reveal, success, wrongDrop, wonder, sunset arc) |
| `src/engine/sprites.ts` (baked atlas, glyph text) | `src/game/world.ts`: truck drawing, sparkles, fireflies, night tween. Zone layout is dead weight. | `rules.ts` (planSession, confidence, accepts), `levels.json`, `zones.json` for this scene (keep them for Deliver) |
| `src/audio` facade, limiter, ducking, `say()`, `sfx()`, `animal()` | `game.ts` input block (down/pickUp/move/up/finishDrop/putBack/key, about 100 lines): tap-then-tap and keyboard are valuable and fiddly. Lift and generalise. | Wonder Bubbles and `discover.*` lines for these scenes |
| `src/ui/captions.ts`, `src/i18n.ts`, locales | `types.ts`: add optional `traits` object. Do not encode numbers in string tags like `power:3`; the proposed namespaced-string form needs parsing and a validator rewrite. | `Progress.confidence`, `cleanRuns` (new scene uses neither) |
| `src/ui/parent.ts`, `src/storage.ts` | `storage.ts`: `Progress.v` is the literal `1`. Give the prototype its own localStorage key; do not migrate in the first pass. | |
| Hint-timer and ghost-hand pattern | `tools/validate-pack.mjs` and tests: extend; existing Deliver tests stay valid because Deliver is not touched | |

### 4.2 Estimate: Stuck Truck + sticker book (first playable)

Unit: one focused day = about 5 to 6 productive hours with AI doing first drafts. AI speeds code a lot; it speeds **feel tuning, device testing and sound choices** very little. Ranges are plus or minus 50%.

| Step | Days |
|---|---|
| 0. Profile the current build on the old phone (Chrome remote debugging, one session) and fix the top cause | 0.5 to 1.5 |
| 1. Scene art in canvas: mud patch, 3 to 4 stone slots, rope, truck with spinning wheel and sunk/free states, tray frame. Almost all hand-coded rects, no new emoji | 1 to 1.5 |
| 2. Clip runner and 6 clips (heave, tug-and-flop, wash, nap, too-strong, tiny-peek) built on `reactions.ts`, each pure `t -> draw` so it can replay in the sticker book | 2 to 3 |
| 3. Scene state machine, hold beat, 3 rounds, slots, persisted helpers, hint step | 1 to 1.5 |
| 4. New synth sfx and listening on a phone speaker: squelch, wheel whirr, rope creak, splash, yawn, giggle-honk | 0.5 to 1 |
| 5. Input: adapt drag, tap-then-tap, keyboard | 0.5 to 1 |
| 6. Sticker book: about 12 slots on one page, live-composited from sprite + prop, persists, tap replays the clip, "fly to book" animation | 1.5 to 2.5 |
| 7. Captions and 5 new cc keys, 3 voice lines wired | 0.25 |
| 8. On-device perf pass and bug fixing | 1 to 2 |
| 9. Paper-and-toy Tuck-in kit for the test (printed cards, a shoebox) | 0.1 |
| **Total** | **about 9 to 14 focused days** (best guess 11), **about 3 calendar weeks part-time** |
| Then: test with children (recruiting + sessions) | 1 plus calendar time |

For comparison, the Designer's full vision (generic scene runner, 3 scenes, signposts, novelty scenario picker, town, scrapbook) plus the Narrator's layer (13 new lines, 13 sfx, Jugnu thread, Moon Mela) is, honestly, **8 to 12 weeks** for one person. A generic runner should wait until a second scene exists; PLAN section 5 already says "rule of three: no abstraction before three games use it". Hard-code Stuck Truck.

The generic data model (`scenes.json`, rule lists, tag-driven outcomes) is attractive but is exactly the work to not do first. With one scene it has one data row and no test of generality.

### 4.3 Size budget: is it a problem?

- Measured today (BUILD_REPORT): 39.3 KB gzip total, with the PLAN budget of 400 KB.
- Estimated additions for the prototype: scene code and clips about 8 to 12 KB gzip; new synth recipes about 2 to 3 KB; sticker book about 2 KB; any new emoji props about 1 to 2 KB (food and hut emoji; **burrow, cave, pond, mud and rope have no emoji and must be hand-drawn**).
- The only thing that can threaten the budget is recorded audio. My arithmetic: speech at 24 kbps Opus is about 3 KB per second, so a 1.2 s line is about 3 to 4 KB. 13 new lines = about 40 to 50 KB. The 9 verdict lines the Narrator retires (correct.*, wrong.*, drag.prompt, zone.*) are about 30 KB. Net about +15 KB. The audio budget (core 100 + game 80) holds if the 9 lines are actually retired and the recorded animal sounds stay at 13.
- **Nothing needs to be cut for size.** The cut list below is for effort and frame rate, not bytes.

### 4.4 30 fps on an old low-end Android phone

The unknown is large: nothing has run on a real phone (BUILD_REPORT: "NOT done: drag test on a real old Android phone"), and the owner already reported lag. I cannot say what caused it; these are **hypotheses to check in step 0**, in order of my suspicion:

1. **Speech synthesis fallback.** Until real recordings exist, speech is live `speechSynthesis` (BUILD_REPORT "Needs human"). On cheap Android this can stall the main thread and delay or drop audio. Check first.
2. **WebAudio graph per sfx** (oscillators built on each call in `recipes.ts`). Fine on desktop, uncertain on a 2 GB phone.
3. **CSS upscaling of the 135 px canvas** with pixelated rendering at 2 to 3x on a weak GPU.
4. **Autoplay and audio unlock** adding perceived lag at the first tap.
5. Draw-side costs are probably *not* the cause: at 240 x 135 logical there are about 32,000 pixels and the loop already caps at 30 fps (60 only while dragging) and idles at 4 fps.

Rules for the prototype so it does not make this worse: at most 3 moving sprites plus 24 particles per clip; no per-frame allocation; no alpha full-screen overlays other than the existing night fade; pre-scale sprites once; clips are pure functions of `t`; no recorded sfx (synth only); at most one screen shake; no `speechSynthesis` in the test build (record 3 to 5 lines instead); keep the tray at 4 cards of 32 px (about 64 CSS px on a 2x scale, adequate).

### 4.5 What must be cut to hit the target

Nothing in the technical budget forces a cut. Effort forces these cuts (section 5): generic runner, town, signposts, scenario picker, Wish mode, Snack Stakeout, Tuck-in code (use paper), Jugnu, Mela, cosmetics, 7 of 13 voice lines.

---

## 5. Complexity creep

| Item (where) | Cost | Decision for the first version |
|---|---|---|
| Stuck Truck, 4 to 6 cards, 3 rounds | Core | **BUILD** |
| Hold (predict) beat, unskippable first run, transfer round, local first-pick log | Small | **BUILD** (these are the learning beats) |
| Sticker book, about 12 stickers, per reason | Medium | **BUILD, minimal** (this is the visible reward the owner asked for) |
| Bholu's 3 lines: "Oh no!", "Help me?", "Hooray!" (recorded) | Small | **BUILD** |
| Tuck-in Night as software | Large (25 outcome combos) | **DEFER; test on paper first** |
| Snack Stakeout | Medium + content problem | **DEFER** (section 6, S1) |
| Generic `scenes.json` scene runner, tag/trait rule engine | Large | **CUT** until scene 2 |
| Hint ladder steps 2 to 4 | Small | **CUT**; keep step 1 at 10 s |
| Wish mode, mystery-mode, two-snack plates, weather, two slots beyond round 2 | Medium each | **CUT** |
| Town that grows, signposts, sunset arc, 3-scene sessions | Large | **CUT** for prototype (keep existing sunset only if free) |
| Novelty-based scenario picker | Medium | **CUT** (hand-pick rounds) |
| Animal tricks replay in the town | Free if clips replayable | **DEFER**; comes out of the sticker book replay |
| Cosmetic unlocks, truck paints | Medium | **CUT** |
| Jugnu 7-night thread, Moon Lantern, Moon Mela, 7 + 1 stages | Large | **CUT**; keep one blink at the end only if it takes under an hour |
| "Sleepy friends waiting" retention bubble | Small | **CUT** (guilt risk, N4) |
| Web Share (Q9) | Small | **DEFER** (privacy question) |
| 13 new voice lines, 64 total | Large for the owner (recording is already unfinished: 51 lines not yet recorded) | **CUT to 3** for the prototype |
| 13 new sfx + 13 caption keys | Medium | **CUT to about 6** |
| Hindi lines, "Arre!" | Medium | **DEFER** |
| Parent-facing "what they found today" list | Small, builds on the stickers | **DEFER, but cheap and worth it** (parents choose the app; the child's reaction is not the only one that matters) |

**Smallest slice worth testing with a child:** three rounds of one problem (a truck stuck in mud) with six animals, a hold beat before each Run, a book that fills with about 8 to 12 moment-stickers, and a transfer round with an unseen animal. Everything else waits for the result.

---

## 6. Content safety and cultural check

| ID | Item | Concern | Severity | Action |
|---|---|---|---|---|
| **S1** | **Snack Stakeout: put out food at dusk and a lion, tiger, bear or elephant walks into your garden to eat** | This rehearses the opposite of the safety lesson parents and forest departments give: do not feed wild animals, do not approach them. India has real human-wildlife conflict (tigers and leopards near villages, sloth bears, elephants raiding crops for banana and sugarcane, monkeys harassing people over food). The premise is cute and also a miseducation. PLAN section 10 already bans hunting and predator-prey; it did not consider invitation. | **High** | Do not ship as designed. If the scene returns: child is a quiet observer from a watch-tower or hide, food is already in nature (a grass patch, a banana tree, a beehive), nobody is lured to a house. Needs teacher review. |
| S2 | Meat card, bone for the dog, "serve meat" to the tiger | D5 allows meat as plain fact. A tray card the child *places* is a different act from a fact on a page. Many Indian households are vegetarian; some will not mind a fact but dislike serving meat. Twemoji's meat-on-bone at 24 px may look graphic. | Medium | Teacher and parent review (T6). If kept, show it only when a carnivore is the subject, not as a default tray item. |
| S3 | Lion naps on the truck; tiger yawns | Fine as comedy. Risk: tame cartoon wild animals can lower a child's caution around real ones. | Low to medium | Lion stays at the road or tree, never in the child's home or town. Pair with the Rain Night contrast (wild animals are fine on their own). |
| S4 | Owl in the `hide` need (STORY_PUZZLES 5.3) | Owls carry mixed meaning in India (ill omen, foolishness, and a divine vehicle). The Narrator already caught this (C3). | Medium | Remove, as the Narrator said. Use a frog or a leaf. |
| S5 | Lantern in every window; Moon Lantern; night fair | "Mela" is a plain word for a fair and Narrator T1 flags it; the lanterns (akash kandil) and the Moon could also read as festival or Eid imagery. The intent to stay neutral is good. | Low | One teacher glance. Keep "Moon Mela" out of the first release anyway (scope). |
| S6 | Hut as the "dry, high" home; roof sags under the buffalo | A straw hut can read as poverty; a collapsing roof is a small cruelty to a "home". | Low to medium | Draw it cosy, give it a lantern. Make the buffalo gag a door, not a collapse. Also a hen's real home is a coop, not a person's hut. |
| S7 | Rabbit snug in a **burrow** under the Pets topic | Content contradiction: a pet rabbit lives in a hutch or home. | Medium (accuracy) | Add the hutch part (section 3) and make the rabbit's burrow a "wild rabbit" or drop the claim. |
| S8 | Tiger swims, cat climbs, elephant swims, dog eats meat (5.0 table), buffalo "cool" | Mostly true, some arguable. Indian street dogs mostly eat roti and scraps. | Low | Teacher fact review (already requested R4). Use roti for the dog (NARRATIVE C4). |
| S9 | Elephant "pulls too hard and sends Bholu into the flowers" | Elephants are revered; the slapstick is on the truck, not the elephant. | Low | Fine. Teacher check T4. |
| S10 | "Bholu" | "Bhola" can mean naive or simple. Affectionate, fits a rushing truck, but a Hindi speaker may hear "simpleton". | Low | Keep; ask two parents. |
| S11 | "Jugnu" | Firefly recognition differs between city and village children (Narrator T2). | Low | Defer with the arc. |
| S12 | "Great job" in `day.done` | Praise for performance (Narrator C10). | Low | Change it. |
| S13 | No humans at all | Avoids gender and caste cues but erases the concept of care (F12). | Medium (design) | A hand, a bowl, a lantern-keeper silhouette. |
| S14 | Cow excluded from every gag (D6) | Right call. But the cow is also absent from the whole scene set, which is itself a coverage gap. | Low | Put the cow in the barn (section 3), calm and respected. |
| S15 | Startle audio and flashing | Yawn that pops a bubble, honk, splash: loudness and the 3-per-second flash limit in PLAN section 9 | Low | Limiter exists; check on a phone speaker. |

---

## 7. Verdict

**GO WITH CHANGES for a one-scene playable prototype. NO-GO for the story arc and the full redesign.**
The documents are a good brief for a prototype and an unsafe brief for a product.

### 7.1 Required changes (before or while building)

1. **Do not supersede D3.** Leave Deliver as shipped, build the prototype on its own route (`#truck`) in a branch, and keep Deliver as the optional Sort mode (Q8 -> keep). The owner decides D3 after the test.
2. **Add a hold beat** to every Run, and make **the first Run of each card unskippable**.
3. **Fix the spec arithmetic** (F8): integer stones; helpers persist; slots stated per round. Use the table in 7.2.
4. **Replace "sticker per outcome" with sticker per reason clip**, cap about 12, show the cue not the animal, remove the "next blank" frame.
5. **Add a transfer round** with an unseen animal in the scene, and a local first-pick log visible in the parent corner during playtests.
6. **Snack Stakeout: remove from the first release** and rewrite its premise before it returns (S1). When it does, Wish is the default and arrival is deterministic.
7. **Tuck-in: redesign cue-first, at most 2 needs per guest**, drop `hide`/owl, add human-built homes (barn, coop, basket/hutch) and guests cow, dog, cat, and a person cue (hand/bowl).
8. **Start the hint ladder at 10 s** and keep it attention-first.
9. **Cut the Jugnu thread, Moon Lantern, Moon Mela, weather, Wish mode, signposts, scenario picker, cosmetics, generic runner** from the first build. Record 3 lines, not 13.
10. **Profile the current build on the old phone first** (step 0 in 4.2) before adding any per-frame work.
11. **Change lion data to `helps:false`**, not `power:0`; keep the cow out of gags.
12. **Teacher check** on the animal facts, the carnivore card, and "wild/pet/domestic" wording before anything ships to children beyond the test.

### 7.2 Minimal prototype to build first (scope)

A single hash route `#truck` in the existing app: Bholu rolls in and sticks in the mud; his eyes look at the child; tapping him honks and unlocks audio ("Oh no! Help me?"). The child drops one of four animal cards onto the rope; after a **0.8 s hold beat** the animal's clip plays (about 3 s). Three rounds, whole-number stones: **Round 1** (need 3, one slot; tray horse, dog, cat, lion): horse frees it alone, dog lights 1 and stays, cat washes, lion naps on the truck bed. **Round 2** (need 4, two slots, same tray): the only solve is horse + dog; horse + cat stays short. **Round 3, transfer** (need 4, one slot; tray elephant [never seen], rabbit [never seen], cat, dog): elephant frees it too well and Bholu lands in flowers; rabbit and dog help 1 each. Every distinct clip adds a sticker (about 8 to 10) to a one-page book (tap a sticker to replay its clip). A local log records first card per round, time to first drop, Run skips, and total drops, shown only in the parent corner. No town, no sunset arc, no new recorded sfx, no speech synthesis. **Alongside it, a paper-and-toy Tuck-in** (printed animals and homes, the adult plays the world) for the learning probe. Build cost: about 9 to 14 focused days (best guess 11).

| Round | Need | Slots | Tray | Whole-number outcomes |
|---|---|---|---|---|
| 1 | 3 | 1 | horse, dog, cat, lion | horse 3 (free), dog 1 (stays, truck not free), cat 0, lion 0 |
| 2 | 4 | 2 | horse, dog, cat, lion | horse + dog = 4 free; horse + cat = 3 short; dog + cat = 1 |
| 3 | 4 | 1 | elephant, rabbit, cat, dog | elephant 4 free; rabbit 1; dog 1; cat 0 |

### 7.3 The 10-minute child test

Run it with at least 5 children aged 6 to 7, **including children who have never seen the old game**. Do not make your son the only subject: he has seen the old build, knows you, and wants to please. Use him as a within-subject comparison (old vs new), with order counterbalanced across children. The Designer's protocol (STORY_PUZZLES 10.2) is a good base. Changes: a built-in transfer round, a toy Tuck-in probe, and a chance baseline.

| Minute | Step | Observe |
|---|---|---|
| 0:00 | Hand over the phone. Say nothing about "game", "learn" or "animals". | First words and face. Does the child use school words ("is this a test?", "a quiz?", "homework")? |
| 0:30 to 4:30 | Rounds 1 and 2, free play. Adult silent. | Hover before dropping; first card; watched vs skipped Runs; laughter; "again"; calling you over. |
| 4:30 to 5:30 | Round 3, the transfer round. | First pick. The tray has 4 cards and one unseen strong animal, so **chance is 25%** (Designer's "2 of 5 sensible" is at or below chance for a 3-card tray; do not use it). |
| 5:30 to 8:00 | Toy Tuck-in: a goat is shivering and rain is coming; show 3 homes, one with a roof and a small door. Ask the child to put it somewhere. Then a big cow and a tiny burrow. | Is the choice sensible, and does the child say or gesture a reason (roof, door, "too big")? |
| 8:00 to 10:00 | Three prompts: "Show me who you would call if Bholu is stuck in even deeper mud." "Why did the cat not help? (show me, or act it out)." "Do you want this one or the other one again?" | Choice, gesture, any reason. |
| Next day | The parent asks, "Do you remember Bholu? What happened?" | Free recall, one-line report back to you. |

### 7.4 Pass and fail signals (n = 5 is a smoke test, not a statistic)

| Signal | Pass | Fail |
|---|---|---|
| Wanting more | 3 or more of 5 ask for more, again or another before 10 minutes | Fewer than 3, or "I'm done" before 3 minutes |
| Not a workbook | 4 or more of 5 use no school words in the first 30 s | More than 1 says quiz, test, school, homework |
| Watching vs mashing | 4 or more of 5 watch at least half the Runs; some pause before dropping | 3 or more cycle the cards left to right and skip every Run |
| Transfer (unseen animal) | 4 or more of 5 pick the elephant first (P = 0.016 if guessing at 25%) | 2 or fewer pick it |
| Toy Tuck-in | 4 or more of 5 choose the roof or the right size and give any gesture or word for why | Mostly random, no reason |
| Reasons | At least 3 of 5 can show or say something for the cat or the lion | No one can |
| Delight not distress | No child upset at a funny miss | Any visibly distressed child (re-tune the gag; if two, stop) |
| Preference vs Deliver | 3 or more of 5 prefer the new one | Fewer than 3 |
| Next-day recall | 2 or more of 5 recall Bholu and something that happened | None |

### 7.5 Kill and pivot criteria

Stop the Try It direction (keep Deliver, keep the story as a small decoration) if, over 5 children:
- Fewer than 3 want more **and** 3 or more mash without watching; or
- Fewer than 3 pick the unseen strong animal first **and** the toy Tuck-in shows no reasons (fun but no clarity: the pivot is the cue-first Tuck-in as the only scene, or a Toca-style sandbox with honest "toy, not lesson" framing); or
- More than 1 child says the equivalent of "is this school?" in the first 30 seconds (the mechanic did not cure the first impression; the problem is the look, the tray or the animals, not the logic); or
- The prototype takes more than **15 focused days**, or the phone cannot hold a steady frame rate after the step-0 fix (the redesign is not affordable for one person on this hardware); or
- The owner himself repeats the "bored in 5 minutes" reaction on the third play. His own boredom is a valid signal.

Decision rules: fun passes and learning fails -> keep slapstick, rebuild around cue-first Tuck-in. Learning passes and fun fails -> redo the look and pacing, not the mechanic. Both pass -> then, and only then, build scene two and the generic runner.

---

## Appendix: assumptions I could not verify

- That a typical 6-to-7-year-old in the target group already knows the facts in section 2.1 (needs a teacher).
- That the owner's lag report refers to the current Deliver build.
- That a 24 px emoji for rabbit versus dog versus cat reads in motion (BUILD_REPORT shows cat/tiger still close).
- All research items tagged [S]: single studies from memory. [J] items are judgement.
- Estimates are plus or minus 50% and assume the owner is the only engineer, recording voice himself, with AI-assisted coding.

Files referenced: /Users/akshitarora/Sites/MIA/November/docs/design/STORY_PUZZLES.md, /Users/akshitarora/Sites/MIA/November/docs/design/STORY_CHARACTERS.md, /Users/akshitarora/Sites/MIA/November/docs/PLAN.md, /Users/akshitarora/Sites/MIA/November/docs/BUILD_REPORT.md, /Users/akshitarora/Sites/MIA/November/src/game/game.ts, /Users/akshitarora/Sites/MIA/November/src/game/reactions.ts, /Users/akshitarora/Sites/MIA/November/src/engine/stage.ts.
