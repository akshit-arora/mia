# Reality Check: THREE_GAMES (Forage Trail, Morning Round, Play Yard + animal cards)

Reviewer: Reality Checker. Date: 2026-11-06. Reviewed: `docs/design/THREE_GAMES.md` (v1 draft). Compared against: `REALITY_CHECK.md` (earlier review of the story-puzzle "Try It" design), `src/engine/stage.ts`, `src/game/game.ts`. No code or other documents were changed. No child has played anything yet; every learning claim below is a prediction.

Tags used: **[E]** well-established (replicated or widely accepted), **[S]** single or limited study, **[J]** my judgement. Citations are from memory, not re-fetched in this run (no web search was done). Verify before you quote any of them anywhere public. I invent none, but I may have details slightly off.

---

## 0. Verdict at a glance

| Question | Verdict |
|---|---|
| Is THREE_GAMES ready to build as written? | **NO. NEEDS WORK.** |
| Build a playable prototype of the smallest slice (section 6)? | **GO WITH CHANGES** (section 7) |
| Build all three games + levels + Trump + "?" stories? | **NO-GO** until a child test passes |
| Does the exposure arithmetic hold? | **No.** It contains a counting error and counts passive glances as contacts (section 2) |
| Does it deliver "clarity, not rote"? | **Not as written.** The doc admits it teaches recognition and association (its section 1). The "Why?" tap is mostly dead weight (section 3) |
| Is it more fun-first than the old game? | Very probably yes. Not proven |
| Is it one-person buildable? | One game + reveal + shelf: yes, but 15 to 22 focused days, not 11 to 14 (section 5) |

Quality as a design document: **B-**. It is honest about its limits (rare, credit due), and the "child's trail choice decides the animal" rule is a good call. As evidence of learning: **C-**. Same as last time: no child has been observed.

---

## 1. Failure audit

### 1.1 Against known history

| # | Pattern | Evidence level | Where THREE_GAMES lands | Rating |
|---|---|---|---|---|
| A1 | **Chocolate-covered broccoli** (game wrapped round unrelated drill; Bruckman, "Can educational be fun?", GDC 1999) | [E] as concept | The core games are deliberately unrelated to the facts, and the facts arrive on a card after. That is literally a wrapper, only with the chocolate first. The doc's own thesis (section 1) says "the card then says what the hands already did" - true for Forage Trail (the child carries honey for the bear) and for Morning Round (grain for the hen). **False for Play Yard**: fetching a ball has nothing to do with dog food or home; the only fact moment is "tap the bowl" at second 55 of 72 | Mixed: wild/farm OK, house = broccoli |
| A2 | **Intrinsic vs extrinsic integration** (Habgood and Ainsworth 2011; Lepper and Malone 1987) | [S], consistent | Forage Trail is intrinsic (the thing gathered IS the fact). That is the best idea in the document and the reason to prototype it. But integration is only on the *food* fact. Name, home, type, stats are all extrinsic (shown on a card) | Half good |
| A3 | **Edutainment decline** (1990s: low content per title, drill with arcade skin; The Learning Company sold at a loss in 2000) | [E] business facts, causes [J] | 14 animals and about 4 to 5 hours (doc section 7) is thin content but honest. The sin to avoid is shovelware: three games x 14 animals is a lot of *reskins* of three loops. The doc itself says the content "will end" | Acceptable if said out loud |
| A4 | **Reward-chasing that ignores content** (overjustification: Lepper, Greene and Nisbett 1973; tangible contingent rewards in preschoolers) | [E] in that setting, [J] for apps | The animal IS the reward and the content, so there is no separate sticker/coin. That is a real design strength. The weakness: the child can win the reward without looking at anything on the card. Nothing in the loop *requires* attention to food or home (A6) | Risk |
| A5 | **Compulsion loops and slot-machine mechanics** (Schull, "Addiction by Design", 2012; Radesky et al., JAMA Network Open 2022, manipulative design in children's apps) | [E] for the mechanism; [S] for children's apps | No randomness, no timers, no streaks, no loss: good (doc section 4). **But the reveal is a loot-box ritual**: crate shakes, rumble, lid pops, silhouette fills with colour (doc section 3). The *visual grammar* trains the same anticipation circuit even when the outcome is deterministic. The cameo chance ("a small chance of a cameo guest") is a random bonus - the doc says "never add random crate" then adds a random cameo. And levels 2 to 4 per animal ("fourth crate: baby") are a *grind to complete*, i.e. the Pokemon/Trump completion loop, not the clarity goal | Medium risk. Fix: no crate (section 7) |
| A6 | **Collectible games where kids ignore the text** | [J] (designer lore; plenty of observation, no clean citation I can give) | The doc's own anti-pattern row: "Facts are decoration: Risk". Correct. For a non-reader the "text" is icons and voice, which is better. But the kid who knows Pokemon stats knew them because of years of re-looking, a peer swapping cards, and *needing* the stat to win (Trump) | High risk, see section 2 |
| A7 | **Incidental vs direct instruction.** Incidental learning from repeated exposure is real but slow and works best when the child has interest and an adult talks about it. (Chi and Koeske 1983: a 4-year-old dinosaur expert organises knowledge by interest; Hirsh-Pasek et al. 2015 "Putting education in educational apps", PSPI: learning needs active, engaged, meaningful, socially interactive) | [S] and [E] respectively | Doc leans on "incidental exposure". Fair for *vocabulary and association*, weak for *concepts*. The doc's own list "what it does not teach" is correct. Interest research supports the Pokemon claim, but those experts had weeks to years and 150 creatures, not one week and 14 | Honest, but sets low ceiling |
| A8 | **Seductive details** (Harp and Mayer 1998, adults) and congruent-vs-decorative animation in interactive books (Takacs, Swart and Bus 2015 meta-analysis) | [S] / [E-ish] | The funny action per animal (14 gags), hats, cameos, babies are seductive details unless they show the fact. Sheru's "yawn then sneezes a leaf" is a joke, not a food or home fact | Medium risk |
| A9 | **Mashing / gaming the system** (Baker, Corbett and Koedinger 2004) | [S] older students | Here the cheapest route to the reward is "play whichever trail, ignore everything else", which still yields an animal. The only decision is *which silhouette*, not *what it eats*. So nothing can be gamed, but nothing can be learned by deciding either | Neutral |
| A10 | **Unassisted discovery** (Kirschner, Sweller and Clark 2006) vs assisted (Alfieri et al. 2011) | [E] | The "?" tap is unassisted discovery of a *reason*, not tied to any child action | Gap, section 3 |

### 1.2 Specific defects, with passages

**D1. Internal contradiction in the arithmetic (section 3).** The doc says Trump mode "is the main repeated exposure to the stats, **not to food or home**" (section 5, last paragraph). Yet the section 3 totals add Trump's 2.6 showings to *both* the food total (about 21) and the home total (about 6.6). Remove Trump (it is not in the prototype and is not a food/home exposure): food about 19, home **about 4.0**. And "4.0" counts a card view as one contact even if the child only watched the funny action.

**D2. "In-game food contact" counts a lane-run's pickups as 8 contacts.** The doc: "gathering 8 pickups of that food (8) = 9 contacts of this animal wants this food". That is 8 repetitions of *one fact in one 75 s sitting*, not 8 learning opportunities. The first one or two bring the association; the rest are motor tasks. Cognitive science on spacing (Cepeda et al. 2006 meta-analysis [E]) says massed repetition within one sitting is weak compared to spacing across days. The honest count is **association events per round**: bubble (1), first pickup (1), feeding munch (1), reveal food beat (1), shelf return (0 to 1). About **4**, not 9.

**D3. Not every round has 8 pickups.** Lion/tiger: one closed basket, **0 pickups of meat, one reveal**. Hen route: 3 grain taps. Dog: one bowl tap at second 55. So "9 contacts per round" is wrong for 8 of the 14 animals (6 wild trails have it only for monkey, bear, elephant, peacock; none for lion/tiger).

**D4. 216 / 14 = 15.4 assumes a child plays 24 rounds a week spread evenly over 14 animals.** Round 1 to 14 will indeed be "guaranteed new" (doc section 7), so spread is plausible, but 24 rounds x about 100 s = 40 minutes a week of a 6-year-old on a phone. It is [J] that this is realistic for a household with limited screen time; many Indian households limit under-8s to 20 to 30 min a day, so 40 per week is not crazy, but it is not "typical" either. Fine as a scenario, not as a baseline.

**D5. Names are not facts.** The card's biggest field is the personal name (Sheru, Bholu...), which is not in any curriculum. The child will learn "Sheru" more strongly than "lion eats meat" because the name is the thing they will say to a parent (doc says so). The reward bonds to the *name*, not the animal's biology.

**D6. Type and home are the same fact.** wild = jungle shelf = jungle icon; farm = barn; pet = house. So four fields on the card (type, home, shelf, background strip) carry **one** independent fact, "which of three groups". The honest card has three independent facts: name, food, group. The claim of "home" as a separate fact with 6.6 contacts is double counting.

**D7. The "?" unlock is contradicted by its own intro.** Section 1: "never prompted, never required... the child taps it only if curious". Section 4: the "?" story is unlocked at **card level 3**, i.e. the third crate of the same animal. In a one-week scenario with 24 rounds over 14 animals (the doc's own arithmetic), almost no animal reaches level 3. So most children see **zero "?" stories in week one**, and the whole reasoning component is hidden behind a 3x grind. See section 3.

**D8. Canvas size mismatch.** The doc assumes "480x270 logical canvas" (section 6). The engine is 240x135 (up to 300x135 by aspect; `src/engine/stage.ts` lines 14 to 15 and 69 to 70). 480x270 = **4x the pixels** and a rewrite of the art scale. This is the single largest hidden cost and performance risk (section 5).

**D9. The crate itself.** Animals arriving from a crate (leaf crate, hay crate, "gift basket") conveys "animals are delivered goods". Lions in a crate evokes wildlife trade; the owner's rule is "no hunting or harm". It is also the loot-box grammar (A5). The cheapest fix removes it (the animal walks out of the trees, section 7).

**D10. Meat icon and egg/hen in the same app.** The Forage Trail meat icon is described as "drumstick-shaped" (section 6.1). A drumstick is a chicken leg, shown a few screens from Kuku the hen who lays an egg. Many Indian families are vegetarian or Jain; a drumstick next to a named, voiced hen is the exact thing a parent will notice. See section 4.

---

## 2. Does the child actually learn?

### 2.1 Contacts, recounted

Assumptions kept from the doc: 4 sessions/week of 10 min, 6 rounds per session, 14 animals, rounds spread evenly, each reveal watched. Scoring: **attended** means the child's eyes and mind are plausibly on the fact (voice line plays, animal-food animation is the focus of the screen, or the child chose it). **Passive** means it was on screen.

| Source | Doc's count (food) | Doc's count (home) | Attended (my estimate) |
|---|---|---|---|
| In-game pickups | about 15 per animal | 0 | **about 1 to 2 attended association events per round** (first pickup, feed); that is about 3 per animal per week if 24 rounds over 14 animals give 1.7 rounds each |
| Reveal food beat (1.7 per animal) | 1.7 | 0 | 1.7 x (probability the child watches the munch, [J] 0.7) = **1.2** |
| Reveal home beat | 0 | 1.7 | **0.7 x 1.7 = 1.2** (and the home *is* the shelf name, voice "goes to the Jungle") |
| Shelf visits (2.3 views per animal) | 2.3 | 2.3 | A view = tap the animal to see the gag. The food/home are visible but not the target of attention. Attended **about 0.5 each** |
| Trump | 2.6 | 2.6 | Stats only, **0 food, 0 home** (the doc's own statement) |
| **Total, food** | about 21 | | **about 5** attended events per animal per week (3 from play, 1.2 reveal, 0.5 shelf) |
| **Total, home** | | about 6.6 | **about 1.7 to 2** (1.2 reveal + 0.5 shelf), plus passive position |

So the honest food figure is about 5, not 21 (a 4x overstatement); the honest home figure is about 2, not 6.6 (a 3x overstatement), and home is the same fact as "which shelf". Whether 5 attended contacts in a week produces durable recall of a *new* food-animal pair for a 6-year-old: **[J] probably yes for cued recognition ("show me what Bholu eats"), probably no for free recall** after a week.

### 2.2 The ceiling problem nobody in the document states

A 6- to 7-year-old in India already knows lion, tiger, elephant, monkey, cow, dog, cat, hen, goat, and that "monkey eats banana", "dog eats roti or bone", "cow gives milk and eats grass". [J] I would bet at least 9 of 14 food pairs and 12 of 14 names are *already known* to most kids this age (peacock food, bear honey, buffalo, horse gram, rabbit carrot are the less certain). So the measurable learning from this game is largely **confirmation of known facts**. The things a 6-year-old does NOT yet have are exactly the things the doc says it cannot teach: *why* a group is a group, how a farm/pet/wild animal differs in who looks after it, and what to predict for an unseen animal. This is the clarity gap (section 3). The owner should know before the test: if the test shows "children know all of it already", that is not a design failure; it is a ceiling that implies the goal needs reasoning, not more repetition.

### 2.3 Honest expected outcome after one week (typical 6-year-old, about 40 minutes of play in 4 sessions) [J, to be tested]

| Item | Likely outcome | Confidence |
|---|---|---|
| **Names** of the animals (lion, cow...) | Already known. New: the child says "Sheru" and "Bholu" (pet names) readily | High |
| **Personal names** | Remembered for the 3 to 5 animals the child liked | High |
| **Category** (wild / farm / pet) as a group label | Recognises that the three shelves exist and which animals are on which. Can *sort* the animals they own. May not generalise to a new animal (a giraffe) | Medium-high for recognition, low for transfer |
| **Food** (cued recognition) | Correct for animals whose food was gathered (honey, banana, grain). Weak for the meat-eaters (never gathered) | Medium |
| **Food** (free recall, "what does a bear eat?") | Mostly already known if common; honey for the bear remembered because of the funny pop | Low-medium |
| **Home** | "Lion lives in the jungle": already known. "Hen lives in the farm": fine. Pet: "dog lives in the house": known | High, but it was known |
| **Why** (reason food or home fits the animal) | Almost nothing. Maybe a handful of kids tap "?" and notice the tooth icon | Very low |

### 2.4 Small design changes that raise ATTENDED contacts without a quiz

All keep the "no questions" rule. Ordered by value per effort.

1. **Keep the target animal and its food icon on screen for the whole run** (HUD: animal at the end of the path in a speech-bubble outline plus a persistent food icon, not a 6 s intro bubble). The child then sees the pair *while acting*. Cost: about 0.3 days.
2. **Put the feeding spot AT the animal's home scene.** The honey tree has hives; the elephant's spot is a riverbank with tall grass. The path background changes with the animal. The "home" fact then becomes something walked through, not a badge. Cost: art, about 1 day for 3 trails.
3. **Make the animal react to the food in the child's basket as they carry it** (it turns its head toward the basket at the end; a thought bubble pulses with the food icon when the basket is more than half full). This puts the pairing into the animal's body language. Cost: small.
4. **Voice the pair, not just the name.** "Bholu eats honey" played once, during the munch (the doc has it as a voice line already; make it unskippable the first two times per animal, then skippable). Constant phrase, constant order.
5. **Pre-reveal prediction by choosing the path** (the minimal reasoning step, section 3). This is the single strongest attention lever.
6. **Remove the crate and the Trump stat noise from the first test**. Fewer fields compete for the child's eye. The card in the first test shows only: picture, name, food, group.

---

## 3. The clarity gap

### 3.1 Is the optional "Why?" tap enough?

**No.** It is a button that, per the doc, never prompts and is not even available until card level 3 (D7). Sustained evidence from interactive-book research (Takacs et al. 2015 [E-ish]) is that optional hotspots that are not tied to the story tend to be tapped for the effect, and non-readers tap them in bursts, then ignore. I estimate [J] fewer than a third of children tap an unlabelled "?" at all in the first sessions and fewer than one in ten watch more than the first 2 seconds. The "tooth + drumstick" story is also a statement of cause shown to a child who did not ask, i.e. a mini-lecture with the same weakness as any "instruction after the fact". It also carries a possible misconception: "teeth for meat" is a tidy cause that is partly true, but a six-year-old may read it as "lions have teeth to eat drumsticks".

### 3.2 Minimum changes that make some reasoning happen (no quiz)

In order of cost-effectiveness:

**R1. The child's choice links food to home (the best candidate).** At the start of Forage Trail show **two or three signposts at a fork, each with a food icon** (banana, honey, grain). The silhouette they want (Bholu) sits at the top with its bubble. The child walks one path. Wrong path: they still get an animal, but a different one (Bunty), and the persistent food icon shows "Bunty - banana". No failure, no reset. The doc already contemplates this as "food-mission" (section 6.1, last paragraph) and defers it. **Pull it into the first test.** The reason it works as a minimum: it is the first place the child *uses* the fact (prediction) rather than receives it, and the cost of a wrong guess is a whole 60 to 75 s round, so random cycling is expensive, unlike the 3-second retries in the old Try-It flow. Caveat: a 6-year-old who wanted Bholu and got Bunty may be annoyed; the persistent silhouette keeps it visible, the wrong animal is still a reward, and the shelf shows the missing silhouette still waiting. Risk to test: "children choose the path by colour or position, not by food". The log (path chosen vs food icon) will show it.

**R2. A visible habitat in the game.** The path scenery is the animal's home (hives and a tree for the bear, banana plants for the monkey). The child physically walks to where the animal lives. This replaces the abstract "home badge". It costs about 1 day and removes the weakest fact from the card entirely.

**R3. One auto-played, 2-second "because" beat** on the **first** reveal of each animal only, skippable by tap: the animal opens its mouth and the food icon pair slides in (for the elephant: trunk reaches a high leaf). It is part of the beat sequence (not a button). This is the "?" story but made *unmissable and short*, and tied to the attended moment. Shows one icon pair, never more. Cost: about 0.5 day for 3 animals.

**R4. Comparison, free and no new game:** after the second and third animals are owned, **tap two shelf animals and they stand side by side with their food icons** (one tap on each). Contrast (banana vs honey) is the cheapest known aid to noticing a feature (Gentner's structure-mapping work on comparison [S]). Cost: about 0.5 day. Optional for the first test.

Not recommended: any "pick the food" screen after the fact. That is the quiz in a skin (the doc's own anti-pattern row says so).

### 3.3 What clarity can honestly be claimed after R1 to R3

The child can *predict* "bear goes with honey" before seeing it and sees that the guess had a consequence. It does not yet explain *why* (digestive, teeth). For 6- and 7-year-olds, "why" at the level of "bears like honey, it's in the trees where they live" is acceptable; deeper causal reasoning is for a later design. Say it plainly to the owner: this direction can bring **prediction and association with consequences**, not explanation.

---

## 4. Content and coverage

### 4.1 Coverage of the chapter (wild, pets, domestic, food, homes)

| Topic | Covered by | Rating |
|---|---|---|
| Wild animals | 6 animals, Forage Trail | Good (but see lion/tiger below) |
| Domestic (farm) animals | 5 animals, Morning Round | Good. The farm game is also the only one with a human world (cart, farmyard), so "who looks after them" is implicitly there |
| Pets | **3 animals** (dog, cat, rabbit), Play Yard | **Thin.** Also the fetch game does not carry facts (A1). Only food and "lives in the house" |
| Food | Per animal, icon | Good |
| Homes | One icon per group (jungle, farm, house) | **Shallow and redundant** (D6). No animal-specific homes (nest, den, shed, burrow, kennel). The chapter's "homes" topic (hive, nest, burrow, kennel, shed) is missing |
| Difference between pet and farm animal | By shelf only | The reason (what we keep them for; who feeds them; whether they live in the house) is never shown. The game never shows a person caring |
| Why wild animals live in the wild | Not covered | Gap |
| Persons | Ranger's jeep (no person) and a cart | F12 from the earlier check is repeated: the concept of "domestic/pet" is about being looked after by people, and the games show no hand, bowl, or child. Add a hand carrying the bowl to Moti; a small hand-feeding gesture in Play Yard |

### 4.2 Facts flagged and cultural or safety problems

| Item | Problem | Recommendation |
|---|---|---|
| **Lion/tiger fed from a "ranger's basket"** | Teaches "wild lions are fed by people", which the doc admits is false. It also contradicts "wild". The second fallback ("clear the way to a den; food never shown") hides the food, which defeats the card's food fact | Defer lion and tiger to after the first test. For the first slice use animals whose food can be *gathered* (monkey, bear, elephant). When added: show the meat-eater's food as **something the animal itself brings** (a cub scene, a deer far in the distance running away is a hunting image - no), or **show the food only as an icon on the card and never as game play**. Decide with the owner and a teacher |
| **Drumstick for "meat"** | Chicken leg icon next to a hen character (D10). Offends vegetarian and Jain families and hens | Use a generic, non-species food icon (a plain bone, or a "meat" tile without a leg shape), or omit "meat" visuals from the first test |
| **"Bear eats honey"** | The Indian bear is the sloth bear: termites, fruit, honey. The emoji is a generic brown bear. Honey is the classic child belief and harmless | Keep, flag for teacher; tell parents in the corner |
| **Cow, Gauri** | Sacred to many families. Milking "no anatomical detail drawn: pail sits under, abstract" is the right call. The cow, Gauri, as a named *collectible card with 3 stats (Size 6 / Speed 3 / Strength 4)* ranks cows against other animals in a Trump battle where it can *lose* | Keep cow out of Trump mode and out of the "sad wobble" on loss. Name is fine |
| **Buffalo named Kalu** | Kalu means "black one" and is a common nickname, but pairing it with a dark buffalo in a child's app can read as colourism | Use a neutral name (Bhura, Moti is taken; "Mohan"? teacher to confirm) |
| **Hen** | Eggs pop out as a gag. Many families are vegetarian-no-egg. Eggs are also a core farm-product fact | Fine for age; parent corner note |
| **Horse as farm animal** | A simplification (working/riding). Fine | Keep, note |
| **Pet cat and milk** | Common belief; vets say many cats cannot digest cow's milk well. A teacher/parent may flag it | Use fish or just a "bowl" for the cat; keep milk only if the owner wants the cultural truth |
| **Dog bone/roti** | Fine. Street dogs are a cultural reality | Keep as doc says |
| **Stats (Size/Speed/Strength)** | Peacock 3/4/1, hen 1/3/1, rabbit 1/6/1 teach "weak" as a value. Hen at Strength 1 beside a lion at 8 makes the farm and the pet the "losers". Not true biology (a hen is not a 1) and children treat numbers as facts | Cut Trump from the first slice. If kept later, label as "fun scores" in the parent corner, avoid a numeric 1, and avoid ranking the cow |
| **Names** | Sheru, Veeru, Gajju, Bunty, Bholu, Neelu, Gauri, Chintu, Kuku, Chetak, Moti, Mini, Chiku are common and warm. "Chetak" is also a famous horse and a scooter brand; "Moti" can mean "fat" | Teacher/parent review; low priority |
| **Crate** | See D9 | Replace with the animal arriving (section 7) |

---

## 5. Build reality (recommended first prototype: Forage Trail + reveal + Jungle shelf)

### 5.1 Reusable vs new (from the repo, which I read only as needed)

| Reusable as-is | Reusable with edits | New |
|---|---|---|
| `stage.ts` loop/tweens/input; atlas; audio facade and synthesized sfx; captions; parent corner; storage | `reactions.ts` (a `Reaction` is already a replayable clip: `dur`, `motion(t)`, `prop`, `sfx`) for the funny actions; `entities.json` model (add personalName, food, group); `storage.ts` (add `owned` set; give the prototype its own key, as last time) | Lane scene state machine (basket, 3 lanes, spawner, hazards, bridge); path parallax; card renderer; reveal sequencer; shelf screen; trail data; about 12 to 20 sprites/props; 3 to 5 sfx recipes; voice lines |

`game.ts` is a sequential async script (378 lines), not a scene runner. The lane scene is a **new real-time loop**; nothing existing helps with spawn/collide/scroll. Input: the existing drag/tap code (`down/move/up/key`) can be lifted.

### 5.2 Days (one developer, AI-assisted, one focused day = 5 to 6 productive hours)

THREE_GAMES says 11 to 14 days. My estimate: **15 to 22 focused days (best guess 18), about 4 calendar weeks part-time.** Why higher:

| Piece | Doc | Mine |
|---|---|---|
| Step 0: profile the current build on the old phone | not mentioned | 0.5 to 1.5 |
| Card renderer + data | 1.5 | 1.5 to 2 |
| Reveal sequencer (7 beats, 7.5 s) | 2 to 3 | 2 to 3 (drops to about 1.5 if crate and flights are cut) |
| Shelf with silhouettes + storage | 2 to 3 | 2 to 3 |
| Forage Trail (lanes, pickups, hazards, bridge, 3 trails) | 4 to 5 | 6 to 8. Lane games are feel-tuning heavy; AI drafts fast, tuning on a phone does not accelerate |
| Fork/signpost choice (R1) | not in doc | 1 |
| Sounds, captions, tuning | 1 to 2 | 1.5 to 2.5 |
| On-device perf pass | not mentioned | 1.5 to 3 |
| **Total** | **11 to 14** | **15 to 22** |

AI speeds first drafts of data, card layout, and sequencers. It speeds feel, device testing, art taste, and audio mixing very little.

### 5.3 Performance on an old low-end Android at 30 fps

The owner reported lag already (cause unproven; see my earlier hypothesis list: speechSynthesis, per-call WebAudio graphs, CSS upscaling). The only measured number I have is **about 0.16 ms per draw call on a desktop**. I treat it as the owner's figure and do not know what it covers. For a 2 GB, low-clock phone, 2D canvas is CPU-bound; a realistic multiplier is **5x to 10x** (lower bound for CPU speed, upper bound if raster is software). So:

| Frame content | Draw calls | Desktop | Phone at 5x | Phone at 10x |
|---|---|---|---|---|
| Doc's cap "about 40 sprites" + 3 to 4 background bands + trees + HUD + particles | about 70 | 11 ms | 56 ms (about 18 fps) | 112 ms (about 9 fps) |
| Disciplined: background pre-rendered to two offscreen canvases and scrolled with 2 `drawImage` calls; 3 lanes, at most 6 pickups, basket, animal, HUD, 12 particles | about 25 | 4 ms | 20 ms | 40 ms (borderline) |
| Aggressive budget | at most 15 | 2.4 ms | 12 ms | 24 ms |

The 33 ms frame budget at 30 fps leaves little once audio and the browser's own work are counted. **Rule: at most 15 to 25 draw calls per frame in the lane run. The doc's "40 sprites" would likely miss 30 fps on the target hardware** if the 0.16 ms figure holds. Other risks:

- **Pixel fill at 480x270** is 4x the 240x135 the engine uses today (D8). Keep 240x135. 32 px animals on a 135 px tall screen are fine; lanes can be 3 x 32 px.
- Reveal: a 3x scaled sprite is one call but a bigger fill; keep smoothing off.
- `stage.ts` idles at 4 fps unless dirty or boosted (lines 98 to 115). The lane run needs a continuous 30 fps and must set boost for the whole round; battery cost is real.
- Shaking the camera (a doc feature) forces redraw of everything; keep it to one small shake per reveal and make it reducible.
- Audio: 3 to 5 synthesized sfx per round is fine; avoid `speechSynthesis` (it is still in `src/audio/index.ts` lines 250 to 260) in the test build; record 3 to 5 voice lines.

**First action before any new code: profile the current game on the old phone** with Chrome remote debugging; if the existing game already misses 30 fps, nothing here will pass.

### 5.4 Size (400 KB gzip)

Current build is about 39 KB gzip (earlier BUILD_REPORT). Estimates for the prototype: JS +15 to 25 KB, atlas +4 to 6 KB, sfx recipes +2 KB, 3 to 5 voice lines at 3 to 4 KB each = +15 KB. **No size problem.** The doc's "14 name voice lines 40 to 55 KB" also fits. Size is not the risk.

---

## 6. Complexity creep, and the smallest slice

### 6.1 Too much for a first test

| Item in THREE_GAMES | Verdict |
|---|---|
| Morning Round and Play Yard (2 more games) | Cut. 6 to 10 more days, and Play Yard does not carry facts |
| Trump mode | Cut. Teaches stats, not food or home (by the doc's own statement); fun scores are shaky; ranks the cow |
| Card levels 1 to 4, hats, babies, second action, shelf decorations | Cut. A grind that the doc's anti-pattern table calls out; no evidence a child wants it |
| "?" stories x 14 | Cut. Replace by the 2-second auto "because" beat (R3) for 3 animals |
| Crate and reveal ritual (7.5 s, 7 beats) | Shrink to about 4 s: the animal walks out after being fed, name voice, food munch with voice line, "goes to the Jungle", animal sits on the shelf. No crate, no cameo, no skins |
| Cameo chance, three entry variants, pitch variation | Cut (random reward, dishonest "no randomness") |
| Hazards, stepping-stone river, meat-eater "ranger's basket" | Cut the river and the basket. Keep one soft hazard (log) |
| Name voice lines recorded | Captions + 3 recorded lines only |
| Rename animal | Cut |
| Food-mission variants | **Keep a minimal fork (R1)**; it is the core of the clarity test |
| Shelves with 14 slots/3 shelves | One Jungle shelf, 3 slots + 3 dark silhouettes shown but not obtainable yet (or 3 slots only) |
| 14 funny actions | 3 (reuse `reactions.ts`) |

### 6.2 The smallest slice worth putting in front of a child

See section 7.3.

---

## 7. VERDICT

### 7.1 Verdict

**GO WITH CHANGES** to build a playable prototype of the smallest slice. **NO-GO** for anything beyond (farm, house, Trump, levels, "?" stories) until a child test passes. THREE_GAMES is a good brief for a prototype and an unsafe plan for a product, for the same reason the earlier one was: the arithmetic oversells, and no child has been observed.

### 7.2 Required changes (before or while building)

1. **Correct the exposure maths** (D1 to D6): count attended association events, not pickups; drop Trump from food/home totals; treat home and type as one fact. Expect about 5 food and about 2 home events per animal per week.
2. **Pull the fork choice (R1) into the first prototype**: signposts with food icons, the child walks one path, a wrong path gives a different animal and the pair is shown. This is the minimum for any reasoning.
3. **Persistent target and food icon during the run** (section 2.4 item 1) and a **habitat as scenery** (R2). Remove the "home badge" as a separate fact.
4. **Replace the crate with the animal walking out** once fed. No rumble, no lid pop. Removes the loot-box grammar and "animals in boxes" (D9, A5).
5. **No random elements**: remove the cameo. Keep reward deterministic.
6. **Keep logical resolution at 240x135** (D8). Rewrite perf rules as at most 15 to 25 draw calls, pre-rendered scrolling background.
7. **Drop lion/tiger and the Ranger's Basket from the first slice** (section 4.2); use monkey (fruit), bear (honey), elephant (sugarcane/leaf), all gatherable.
8. **Replace the drumstick** with a non-species meat icon or omit meat from the test.
9. **Add a 2-second auto "because" beat** on first reveal of each animal (R3), skippable by tap after the first time.
10. **Cut** Trump, levels, babies, "?" button, Farm/House games, river, cameo, 14 gags, voice recordings beyond 3.
11. **Step 0 profile on an old phone first**, and add a parent-corner log: trail chosen vs the food icon on the sign, round count, reveal taps, shelf taps, time to first pick-up.
12. **Teacher check** on facts (bear honey, cat milk, buffalo name, "goes to the Jungle" for lion-habitat nuance) before any child outside the test sees it.

### 7.3 Minimal prototype scope (one paragraph)

One hash route `#forage` in the existing app, 240x135 canvas, Jungle shelf only. Three animals: Bunty the monkey (banana), Balu the bear (honey), Gajju the elephant (sugarcane). Start on the shelf with three silhouettes, one of which pulses. Tap it: a hungry animal bubble with its food icon. A fork with two or three signposts showing food icons; the child walks one trail (a lane path with scenery that matches the animal's home); the target silhouette and its food icon stay in a corner. About 6 pickups of the correct food, one soft log hazard, no failure. At the end the animal is fed (munch plus voice "Bholu eats honey"), the animal walks to the child, name voice line, one 2-second because beat on the first reveal only, then it hops onto the Jungle shelf ("Bholu goes to the Jungle"). A wrong fork gives a different animal of the three. Three rounds, shelf full. Local log in the parent corner. Captions on; 3 recorded voice lines; synthesized sfx. No Trump, levels, crate, "?", Farm, House, or lion/tiger. Estimated 12 to 16 focused days (best guess 14), because the reveal shrinks, river and basket go, and the fork is added.

### 7.4 The 10-minute observation test (no quiz questions)

Test with at least 5 children aged 6 to 7, including children who never saw the old game. Do not use your own son as the only subject (he knows you and the old build; use him as a within-subject comparison).

| Minute | Step | Observe |
|---|---|---|
| 0:00 | Hand over the phone. Say nothing about animals, learning, or goals. | First words; school words ("is this a test?", "homework") |
| 0:30 to 6:00 | Free play. Adult silent, no pointing, no hints | Moves the basket in 10 s without help; which signpost is chosen on the first fork (and whether the child looks at the sign before moving); laughs at the munch; looks at the food icon in the corner; says or points at the animal name |
| 6:00 to 8:00 | Rounds 2 and 3, the other animals | Does the choice change after the wrong-path surprise? (e.g. second fork pick matches the food, or the child hesitates and looks at the signs). This is the one real learning signal |
| 8:00 | Say only: "You can play more or stop." | Plays on or stops |
| After | Do **not** ask about facts. Ask only "Do you want to play it again tomorrow?" The next day, the parent shows the shelf and says nothing, or asks "who is this?" with no pressure | Does the child name them unprompted; does the child ask for the game |

**Pass signals:** plays 3 or more rounds in 10 min unprompted; at least 3 of 5 children glance at the food signs before choosing the fork (observable head and eye movement) in round 2 or 3; after a wrong-path surprise, at least 2 of 5 change strategy in the next fork; the child says "Bholu" or "Bunty" or names the food unprompted; taps shelf animals; says "again" or reaches for the phone.

**Fail signals:** asks "what do I do?" more than twice; skips the reveal; chooses the fork by position or colour only (log); frustration at the wrong animal; plays 1 round and wanders; lags on the test phone (below 24 fps); parents' reactions to drumstick or cow content.

**Kill criteria:** (a) two of three to five children play fewer than 2 rounds; (b) lane run below 24 fps on a real old Android after the draw-call fixes; (c) no child looks at a sign before choosing (the food link is invisible, so the card is decoration - redesign the card/fork, do not add games); (d) all children know every food already and nobody changes behaviour (the game confirms the known; then the goal must move to reasoning and the story-puzzle approach deserves more weight).

### 7.5 Comparison with the other two directions

| | Original sorting game ("Deliver", built, 58 tests, shipped) | Story-puzzle "Try It" (STORY_PUZZLES, my earlier verdict GO WITH CHANGES) | THREE_GAMES (this review) |
|---|---|---|---|
| Fun first | Low (a workbook, owner's report) | Medium, unproven | **Highest** on paper (animals as friends, fetch, run) |
| Reasoning | Low | **Highest**: Stuck Truck's visible cause (more stones for a stronger animal) and Tuck-in are real causal mechanics | Low unless the fork (R1) is added; then low-medium |
| Coverage of the chapter | Wild/pet/domestic/food/homes by sorting zones | Food and homes yes; wild and pets effectively no (earlier finding) | Wild and farm good; pets thin; homes shallow |
| Learning risk | Rote sorting | Fun without understanding in two of three scenes (rated WEAK/NONE) | Confirmation of known facts; reasoning missing |
| Build cost | Done | 9 to 14 days | 15 to 22 for the full slice; 12 to 16 for my cut |
| Perf risk | Low | Low-medium (static scenes, small clips) | **Medium-high** (real-time lane run on an old phone) |
| Content/culture risk | Low | Medium | Medium (meat, cow, names) |

**Plain words: which is the best bet?** None of the three is proven. If the question is "will a 6-year-old *want* to play this twice?" THREE_GAMES (cut down) has the best chance, because the animal is a friend and the verbs are physical. If the question is "will the child *understand* something new?" the story-puzzle is the stronger design, because its mechanic shows a cause the child can see (strength moves the stones), but it risked being fun without understanding and said little about wild and pets. THREE_GAMES, as written, is **not better than the story-puzzle on clarity**; it is better on appeal. With the fork (R1), habitat (R2) and because beat (R3) it reaches parity on "a first prediction with a consequence", though it still falls short of the story-puzzle's visible physical cause. My recommendation: **build the cut Forage Trail slice (12 to 16 days) only after the Step 0 phone profile, and run the paper Tuck-in probe from the earlier review in parallel, since it costs almost nothing.** If children love the forage slice but all foods are known, the reasoning scene from the story-puzzle becomes the next build and the shelf/animals become its reward frame, not a separate game. Keep Deliver as shipped until then.

---

## Appendix: assumptions I could not verify

- The 0.16 ms desktop draw-call figure is the owner's; I did not measure it. The 5x to 10x phone multiplier is my judgement for 2 GB, low-clock Android; the real cause of the reported lag is still unknown.
- "Typical 6-year-old already knows most food pairs" is my judgement for children in India; the test can check it cheaply (watch whether the child predicts correctly without learning).
- The 24 rounds a week and 100 s per round usage figures come from the document; I have no data on real session lengths.
- Citations given from memory without fetching: Bruckman 1999; Habgood and Ainsworth 2011; Lepper, Greene and Nisbett 1973; Takacs, Swart and Bus 2015; Baker, Corbett and Koedinger 2004; Kirschner, Sweller and Clark 2006; Alfieri et al. 2011; Hirsh-Pasek et al. 2015; Radesky et al. 2022; Schull 2012; Cepeda et al. 2006; Chi and Koeske 1983; Gentner on comparison; Harp and Mayer 1998. Verify details before reuse.
