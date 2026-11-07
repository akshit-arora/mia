# Story Puzzles: redesigning the core mechanic

Status: design proposal v0.1, 2026-11-06. No code changes. All numbers marked `[PLACEHOLDER]` are hypotheses until a child plays them.
Supersedes decision D3 ("first mechanic is Deliver") in PLAN.md if the owner accepts it. Companion to PLAN.md, ANIMALS.md.
Working title for the mechanic: **Try It** (the child tries a helper, a snack or a home, and the world answers). Working title for the game: unchanged (Animal Express) or "Chhotu-Nagar Stories". Names are changeable.

---

## 1. Design thesis

**The child is not answering a question. The child is the person in the story who can fix the problem.**
Every scene is a small problem with a visible cause (a truck stuck in mud, a hungry shadow in the garden, a sleepy guest in the rain). The child picks something from a tray of 3 to 5 picture cards and drops it into the scene. The world then **runs**: the thing happens, in a short animation, according to the traits of what was dropped. There is no verdict, no "correct" or "wrong". There is only what happened, and what happened is always interesting. The reason is visible inside the consequence (the lion is too sleepy to pull and lies down on the truck; the elephant squeezes into the burrow door and is stuck). The lesson is how the world works, not something the game says.

**Why it is not a workbook.** A workbook asks "which one is right?" and the answer is a tick. Here the child asks "what will happen if...?" and the answer is a show. Choosing the "wrong" card is a good way to get a funny clip, and the funny clip is collectible.

### 1.1 The "swap the facts" test, applied

If we change the facts in the data, does the play change? It must, visibly.

| Scene | Fact we swap | What changes in play |
|---|---|---|
| Stuck Truck | Mud depth 3 stones becomes 5 stones | Horse alone no longer frees the truck. Child must combine two helpers. Dog plus cat plus hen suddenly matters. |
| Stuck Truck | Swap "mud" for "river" (tag need `can:swim` instead of `can:pull`) | Horse and dog and tiger wade in; cat refuses; elephant swims. Same template, new answer set. |
| Snack Stakeout | Say the tiger ate carrots instead of meat | Child must now put carrots out to get the tiger; meat brings nobody they want. The whole scene plays differently. |
| Tuck-in Night | Buffalo needs `warm` instead of `cool` | The mud pond (its snug home today) now makes it shiver; the child must pick hut or cave. |
| Tuck-in Night | Tonight is hot, not rainy | Roof stops mattering; shade and water matter; the best home for the same rabbit changes. |

If a scene fails this test it is a quiz in costume and is cut.

---

## 2. What the child learns (clarity, not lists)

We want a child to be able to explain and transfer, not recite. For each topic, the transferable sentence the child can *act out* with an animal they have never seen in the scene:

| Chapter topic | The idea (transferable) | Where the child discovers it |
|---|---|---|
| 5 Homes | A home fits the animal's body and what it needs (dry, cool, hidden, high, roomy). | Tuck-in Night |
| 4 Food | Animals eat different things. Many eat grass, few eat meat; some eat only certain foods. | Snack Stakeout |
| 3 Domestic | Some animals live with people, are cared for, and can help with work. | Stuck Truck |
| 1 Wild | Wild animals live free and do their own thing; they do not take orders. | Stuck Truck (lion, tiger), Snack Stakeout (shadow visitors) |
| 2 Pets | Pets live in our home and are small and gentle enough for it; they keep us company. | Tuck-in Night (rabbit, cat, dog homes); Snack Stakeout (dog, cat, rabbit) |

Honest note: topics 1 to 3 (wild, domestic, pets) are the hardest to teach as *consequences*. They are mostly social categories, not physical ones. Stuck Truck covers them only partly (see risks). A fourth scene seed for them is in section 6.

Never on screen as words: "wild", "domestic", "pet", "habitat", "herbivore". The child sees and hears "Horse is a good helper!", not categories.

---

## 3. The mechanic in one page (Try It)

```
Problem (visible, with a cause)      e.g. truck wheel spinning in mud
   |
Tray of 3-5 picture cards            animals, foods or home parts
   |  child drags / taps one into the Slot (or two, if the scene has two)
Run (3-6 s animation, no text)       world applies the traits
   |
Outcome: one of
   - SOLVED        problem gone, town gets a permanent change
   - HELPED        problem smaller (a stone lights up), not gone, try adding another
   - FUNNY         the card did its own thing; problem unchanged; card hops back to the tray
   |
Discovery stamp (always)             a tiny sticker of what just happened goes to the scrapbook
```

Rules of the mechanic:
1. Every drop produces a **Run**. There is never a refusal, a buzz or a "try again" screen.
2. Every card has a **different** Run in a scene. No two cards give the same clip.
3. At least **two cards solve** or help in every scene (different ways), and at least one gives a funny miss. This avoids "one obviously right button".
4. A Run is **cheap**: 3 to 6 seconds, skippable by tapping, and the card is back in the tray at the end. The child can try everything.
5. The Run reveals the reason with a **visible trait cue** (a drip on a nose, a stone lighting, the animal wedged in a door). Reasons are never spoken as sentences.

The old Deliver mechanic is a special case (slot = zone, tray = animals, outcome = accepted). It can stay as an optional "sort" mini-activity, but it should not be the front door. See open question Q8.

---

## 4. Core loop

### 4.1 First 10 seconds
- Screen opens directly on a scene, no menu. Bholu the truck rolls in, stops, and his wheel spins in a mud patch. Wheel sound (synthesized), mud splats, a short voice line: "Stuck!" (caption: "Bholu is stuck!").
- Two animal cards slide in at the bottom: horse and buffalo, both big and friendly. A ghost hand shows one drag.
- **Child's first action:** drag a card to the rope. Whatever they choose works, in a different style: the horse trots and pops the truck out in a quick tug; the buffalo pulls slowly and mud flies in a big arc. Bholu honks happily. This first beat cannot fail but is a real choice between two different shows.

This is the opposite of "Ohh, educational game?": the first screen is a character in trouble, not a question.

### 4.2 First minute
| Time | Beat | New idea | Can the child miss? |
|---|---|---|---|
| 0:00 | **Stuck Truck**, horse or buffalo | Drag a helper onto the rope | No |
| 0:25 | The truck drives to a garden at dusk; a shadow with two eyes peeks from a bush; a snack plate appears with 2 foods (grass, meat). Whatever is placed, someone comes | Put out a snack; a shadow is revealed | No (meat brings tiger, grass brings cow) |
| 0:50 | **Tuck-in Night**, a sleepy rabbit arrives; 2 home cards (burrow, mud pond) | Pick a home | **Yes, gently**: the pond makes the rabbit cold and wet (shiver, hops out). It hops back to the card, and the burrow works. This is the first "oops, so that is why". |
| 1:20 | The sun sets on a tiny town with the three things the child made, lit. One first scrapbook sticker flies to the book | The town keeps what the child made | n/a |

### 4.3 One five-minute session
| Time | What happens |
|---|---|
| 0:00 | Town opens exactly as left. Three **signposts** show a tiny picture of today's three problems (a stuck wheel, a pair of eyes in a bush, a sleepy face). The child chooses the order. This is the first real agency: which story first. |
| 0:15 | **Scene 1** (about 60 to 90 s, 2 to 4 tries). |
| 1:45 | **Scene 2**, usually a different type, with one new twist (a changed fact, an extra card, a new guest). |
| 3:15 | **Scene 3**, with the highest twist of the session, or a **free-play** option: the child picks any resident from the town and runs a scene of their own choice (Wish mode). |
| 4:30 | **Sunset**: the town dims, windows light for every home the child built, residents tuck in or wander to a campfire. A scrapbook page turns and shows today's new stickers. A sealed crate rattles with a "?": tomorrow's guest. No score. |

The session never requires 5 minutes; each scene ends cleanly, so a child can stop after any one.

### 4.4 Rewards: intrinsic, visible, never for correctness
| What | What the child sees | Why it is intrinsic |
|---|---|---|
| **The town remembers** | Each solved problem leaves something permanent: the rope post where the helper waits; a feeder table in the garden; a built burrow or hut with a name sign-less sleeper; a lit window at night. Residents who arrive (the snack visitors, the guests) join the town as before. | The reward is the *consequence of the child's own idea*, visible and theirs. It is not paid out for being right; it exists because the thing happened. |
| **The scrapbook (sticker book)** | A sticker for **every distinct thing the child discovered**, including funny misses (elephant stuck in the burrow door, lion napping on the truck, rabbit in the cold pond). Stickers are tiny live-composited pictures (2 to 3 emoji sprites plus a one-word caption), so zero extra image assets. | The child collects *moments*, not scores. Funny misses are as shiny as solves, so there is no stigma in trying them. |
| **Animal "tricks" in the town** | Poke any resident and it replays the trait it showed (horse trots, buffalo rolls in mud, rabbit hops into the burrow). Residents show tricks only after the child has seen them in a scene. | The child can *show someone*: "Look, my buffalo does this!" |
| **Cosmetic unlocks** (truck paints, hats, fences) | Appear as props found in scenes (e.g. a paint can in a puddle). | Cosmetic and found, not bought; already in PLAN 4.7. |

Hard rules: no counters ("3/30"), no stars, no badges, no streaks, no "perfect". The scrapbook shows only what was found plus a single blank frame for "the next one".

**Weakness (honest):** the town building rewards *solving* a scene in the sense that only solved scenes leave a structure. That is a mild outcome reward. We accept it because the structure is the direct physical result of the solution, but we should watch in playtests whether children start choosing cards "to get the house". See risk R3.

---

## 5. The three scenes

Common to all scenes: no text on screen needed; every Run has a one-line caption; spoken lines are 2 to 5 words; Bholu speaks, Chiku wonders. All outcomes follow rule 2 above (every card a different clip).

### 5.0 Trait vocabulary (shared by all scenes)

New namespaced tags on entities. These extend `Entity.tags`; the existing flat tags (`wild`, `domestic`) stay.

| Prefix | Meaning | Examples |
|---|---|---|
| `eats:` | foods it eats | `eats:grass`, `eats:meat`, `eats:banana`, `eats:grain`, `eats:carrot`, `eats:honey` |
| `can:` | abilities | `can:pull`, `can:climb`, `can:swim`, `can:dig` |
| `size:` | body size for door fit | `size:s`, `size:m`, `size:l`, `size:xl` |
| `needs:` | what a good sleeping place gives it | `needs:dry`, `needs:cool`, `needs:hide`, `needs:high`, `needs:space` |
| `power:` | pull strength as a small integer (a number the child never sees; they see stones light up) | `power:1` ... `power:6` |
| `life:` | social category (never shown as a word) | `life:wild`, `life:farm`, `life:pet` |

Proposed values for the 14 animals (all `[PLACEHOLDER]`, all need teacher and fact review):

| Animal | eats | can | size | needs (sleep) | power | life |
|---|---|---|---|---|---|---|
| lion | meat | | l | dry, hide, space | 0 (will not help) | wild |
| tiger | meat | swim | l | dry, hide, space | 0 (will not help) | wild |
| elephant | grass, banana | pull, swim | xl | cool, space | 6 | wild (see Q5) |
| monkey | banana | climb | s | high, hide | 1 (tugs, then climbs the rope) | wild |
| bear | honey | climb | l | dry, space | 0 (will not help) | wild |
| peacock | grain | | m | high | 0 (will not help) | wild |
| cow | grass | | l | dry, space | 2 | farm |
| buffalo | grass | pull, swim | l | cool, space | 4 | farm |
| goat | grass | climb | m | dry, high | 1 | farm |
| hen | grain | | s | dry, high | 0.5 (flaps, feathers fly) | farm |
| horse | grass, carrot | pull | l | dry, space | 3 | farm |
| dog | meat (bone) | swim | m | dry | 1 | pet |
| cat | (milk, fish) | climb | s | dry, hide | 1 | pet |
| rabbit | carrot, grass | dig | s | dry, hide | 0.5 | pet |

Foods used as bait in Scene B: grass, banana, grain, carrot, honey, meat. Home parts used in Scene C: burrow, hut, tree, mud pond, cave. Each of the 14 appears in at least one scene, and about 6 animals appear as guests per scene.

---

### 5.1 Scene 1: Stuck Truck (abilities; domestic helpers versus wild)

**The problem and why a child cares.** Bholu, the friendly truck the child already knows, is stuck in the mud with a full load. A child loves a character in trouble and loves making a big splashy thing happen. The payoff is a big, loud, funny pull.

**What it tests.** Trait: `can:pull` plus `power` (strong enough). Idea of clarity: *animals that live with people (farm animals) are strong and used to helping; strength fits the job; wild animals do their own thing; small animals can still help together.*

**Setup.** The mud has **3 stones** to cross (`[PLACEHOLDER]`). A rope hangs from Bholu. Slot: the rope (1 helper, or 2 in later visits). Tray: 5 cards.

**Cards offered (visit 1):** horse, buffalo, dog, cat, lion.

| Card dropped | What happens (the Run) | Result | What it shows |
|---|---|---|---|
| Horse | Hooves dig in, quick "heave!", 3 stones light up, truck pops out with a splash. | SOLVED (fast) | A farm animal made to pull. |
| Buffalo | Slow, huge heave, mud flies in a fan, truck oozes out. Buffalo needs a roll in the puddle afterwards. | SOLVED (strong, slow) | Strong in a different style. |
| Dog | Tugs hard, tail wagging, **1 stone** lights; truck moves a little, dog flops, pants, then wags at Bholu, who laughs. | HELPED | Willing, but small. A friend could join. |
| Cat | Looks at the rope. Bats at it. Climbs onto the truck and starts to wash. | FUNNY (0 stones) | Pets are not for pulling; cats do cat things. |
| Lion | Walks up, sniffs the rope, yawns, curls up on the truck bed and sleeps. The truck sinks **one stone deeper** (more weight). Bholu: "Um... heavy!" Tap the lion and it ambles back to its card. | FUNNY (worse, funny) | A wild animal does not work for people; it does its own thing. |

**Why both right and wrong are fun and informative.** Horse and buffalo are two different good shows. The dog's partial result invites the child to try two cards ("let me add the cat too": cat adds 1 stone; dog plus cat does 2, not enough; add the hen: 2.5; each addition is a different tiny gag; the child works out that many small ones can add up). The cat and lion misses are jokes with a reason.

**Hint ladder (never gives the answer outright; each step only after the previous one and 6 s of no action).**
1. Bholu spins the wheel again and the **rope swings** (look at the rope).
2. Chiku circles the tray; the **lion card** wobbles sleepily (sets its place as a card that will not help).
3. The **horse card** hops once and the ground shakes (strong things shake the ground).
4. The horse walks halfway to the rope; the child taps it to finish. The scene never completes itself.

**How a failed attempt teaches.** The lion's nap and the cat's wash are visible, specific reasons ("this animal doesn't do this"), then the card hops back to the tray. A child who tried the cat first has now *seen* that pets are not pulling animals, and does not need to be told.

**Second visit.** Mud is now **5 stones**. Horse alone lights 3 and Bholu stays stuck. The child must combine (horse plus dog, or buffalo plus cat). Elephant (power 6) is now a card: he solves it in one go, but pulls too hard and sends Bholu flying into the flowers (the "oops, too strong" sticker). On the third visit the same template runs as **River Crossing** with `can:swim`: the data change, the scene does not.

**What we need in data.**
```
scene: stuck-truck
stage: mud            (art: mud patch, 3-6 stone slots, truck, rope)
need:  { kind: "pull", stones: 3 }
slots: 1               (later 2)
tray:  [horse, buffalo, dog, cat, lion]
outcomes: rule list, first match wins
  - when item.life == wild and item.power == 0  -> clip "nap-on-truck", stones -1, sticker "lion-nap"
  - when item.can has pull                      -> clip "heave", stones += item.power, sticker per item
  - otherwise (small power)                     -> clip "tug-and-flop", stones += item.power
  - when item.id == cat                         -> override clip "wash-on-truck"
solved when: stones >= need.stones
```
The `power` field is the only number; `stones` is a visual unit.

---

### 5.2 Scene 2: Snack Stakeout (food; who eats what)

**The problem and why a child cares.** It is dusk in the garden. Something is rustling in the bush: two glowing eyes, a shadow. The child wants to *know who it is*, and wants *a particular animal to come* (the child's favourite). The child puts out a snack and waits; the shadow steps into the light. The reveal is the reward. Whoever comes joins the town.

**What it tests.** Trait: `eats:*`. Clarity: *animals eat different things; many animals eat grass, only a few eat meat; one food brings some animals and not others.* The child discovers this by *predicting who will come*.

**Setup.** A plate on a table, a bush with a shadow, a moon. Slot: the plate. Tray: 6 food cards: grass, banana, grain, carrot, honey, meat.
Two ways to play:
- **Open**: put out any snack; see who comes (every snack brings *someone*).
- **Wish**: tap a resident in the town ("I want the tiger") then choose a snack. A silhouette of the wished animal peeks from the bush.

**The Run (every card, with the Wish animal in mind).**

| Snack | Who may arrive (weighted to animals the child has not met yet) | Run |
|---|---|---|
| Grass | cow, buffalo, goat, horse, elephant | Sniff, munch, contented sigh, tail swish; a **different** animal each time. |
| Banana | monkey, elephant | Peel (monkey) or curl-trunk grab (elephant). |
| Grain | hen, peacock | Peck-peck; hen clucks, peacock fans (poke reaction). |
| Carrot | rabbit, horse | Nibble, nibble. |
| Honey | bear | Honey on the nose. |
| Meat | lion, tiger | Slow approach, eats plainly (D5), then yawns. No hunting. |

**If it is not the wished animal (the "miss").** The wished silhouette stays in the bush, **sniffs the air**, tilts its head, and slinks away. The arrival eats happily instead. Chiku wonders: "Who is that?" (caption). The child has met a new animal (a sticker) *and* seen that their wished animal ignored this food. Nothing is "wrong"; the wanted animal simply wanted something else.

**Hint ladder.**
1. The wished silhouette **sniffs the tray** (its nose points to the tray, not any card).
2. Its head **turns toward one card**; that card gets a faint shimmer.
3. Two cards that would not attract it **slide off** the tray (fewer choices).
4. The silhouette walks to the plate and waits; the child taps the matching card to place it. Never auto-completes.

**How a failed attempt teaches.** The wished animal's reaction to a non-matching food (sniff, head tilt, walk off) shows *the animal does not eat that*, and the arrival of a *different* animal shows who does. The child is not corrected; they are intrigued.

**Second visit.**
- **Mystery mode (reverse)**: no wish. Evidence is left on the table at dawn: half a carrot, banana peels, hay strands, empty grain dish. The child taps the animal they think was here (from 3 silhouettes) and then it is revealed with a "Look!" grin by Chiku. (This is the *inverse* of the first mode, still tag-driven.)
- **Two snacks at once** (plate has 2 slots): both can attract; two guests meet and sit together. Tiger and cow share a garden: the "no hunting, plain facts" rule holds.
- **Shadow clue**: the shadow's silhouette shows body clues (long ears, trunk).

**What we need in data.**
```
scene: snack-stakeout
stage: garden-dusk
slots: 1           (later 2)
tray:  [grass, banana, grain, carrot, honey, meat]    # entities with tag food:*
arrival: pick an entity where entity.tags include "eats:" + item.food ; weight by not-yet-in-town
wish: optional entity id; if wish.eats has item.food -> that one arrives
miss: if wish set and wish does not eat item -> clip "sniff-and-leave" for wish, arrival normal
```
Everything about *who eats what* is `eats:` tags. Add a new animal with one tag and it appears in this scene with no new code.

---

### 5.3 Scene 3: Tuck-in Night (homes; the night concept lands)

**The problem and why a child cares.** A sleepy animal arrives at dusk with a yawn and a blanket-like cloud rolling in. It has nowhere to sleep tonight. The child is the one who can make it a home. Everyone has felt sleepy; the reward is a **warm lit window and a snoring friend**. Rain is part of the story: a cloud will drop rain on the plot once the animal tries to sleep.

**What it tests.** Traits: `needs:*` (what the animal needs), `size:*` (door fit) versus the part's `provides` and `door`. Clarity: *a home fits the animal's body (door size) and what it needs (dry, cool, hidden, high, roomy). The same home is right for one animal and wrong for another because of its body and needs, not because of a label.*

**Setup.** An empty plot, a guest, tray of 5 home parts: **burrow** (provides dry, hide; door small), **hut** (provides dry, high; door medium), **tree** (provides high, hide; open), **mud pond** (provides cool, space; open), **cave** (provides dry, hide, space; door large). Slot: the plot. The guest tries it for the night; a rain cloud passes.

**Guests (visit 1):** rabbit, buffalo, monkey, bear, hen. Each has exactly one snug home among the 5, and at least one partial home.

**Resolution rule (pure function, all data).**
1. **Door fit**: if the animal's size is bigger than the part's door, the Run is "stuck in door" (head or rump sticks out; plop; a pop of dust). The part remains.
2. Else compute unmet needs. If none: **SNUG** (zzz, lit window, hearts).
3. Else show the **first unmet need's gag**, visibly: `dry` unmet gives a drip on the nose and shivering; `cool` unmet gives sweat and fanning ears; `hide` unmet gives a startled peek (an owl blinks at it); `high` unmet gives a wobble because it cannot roost; `space` unmet gives a squeeze.
4. The animal does its own fix when it can ("monkey climbs out and sleeps in the tree anyway"). The Run ends with the animal looking at the child; the child can swap the part; the old part vanishes with a puff and the new part appears.

**Example outcomes (visit 1).**

| Guest | Snug choice | Visible misses |
|---|---|---|
| Rabbit | Burrow | Pond: cold, wet, shivers, hops out. Hut: roomy but exposed to wind, curls up scared. Cave: "Echo!" startles it. |
| Buffalo | Mud pond (rain on cool mud, happy wallow) | Burrow: head stuck, rump out. Hut: roof sags. Cave: fits, dry, but pants and fans ears (no cool). |
| Monkey | Tree | Burrow: stuck. Hut: sleeps, but swings from the rafters (works, slight). Pond: climbs out. |
| Bear | Cave | Hut: does not fit through the door (stuck). Burrow: stuck. Tree: climbs up, slips down in the rain. |
| Hen | Hut | Burrow: fits, dry, but nowhere to perch (wobbly). Tree: perched, rained on, fluffed. |

**Hint ladder.**
1. The cloud rumbles and a **raindrop falls on the guest** (the need appears: dry).
2. The guest **sniffs one part** and its card shimmers.
3. Two parts that clearly do not fit **tip over** and go to the corner.
4. The guest walks halfway to the right part; the child taps it. Never auto-completes.

**How a failed attempt teaches.** The gag **names the need**: a drip means "no roof", fanning means "too hot", a stuck rump means "door too small". Children see *why this home is not right for this animal*, then fix it.

**Second visit.**
- **Tonight's weather changes**: hot night, cold night, windy night. The best home for the same rabbit changes; this is the swap-the-facts moment *inside* the game.
- **Two slots**: add hay (adds warm) or a pond-side shade; the child makes homes with two parts.
- **Unseen guest**: an animal never seen here (goat, horse) so the child applies the idea, not memory.

**The night concept.** See section 7.

**What we need in data.**
```
scene: tuck-in-night
stage: plot-dusk
slots: 1             (later 2)
tray:  [burrow, hut, tree, pond, cave]    # entities tagged part:*, with provides[] and door
guest: entity with needs:[...] and size:*
weather: rain | hot | cold | windy        # changes which provides satisfy which need
rules:  door-fit first, then unmet-need gag by need id
```

---

## 6. Content scaling (why this is not a one-use mechanic)

After the three scenes ship, **new scenes are new data**: a stage, a need, a tray, a list of tag-based rules and outcome clips from the shared clip library (about 14 clips: heave, tug, nap, stuck, snug, sniff, munch, shiver, fan, peek, splash, wobble, squeeze, hop-back). Seeds already designed (not specified):

| Scene seed | Problem | Trait | Topic |
|---|---|---|---|
| River Crossing | Wide river, a basket to carry across | `can:swim`, `size` | Abilities |
| High Fruit | Mango high in a tree | `can:climb`, `size:xl` and "reach" | Abilities, food |
| Broken Bridge | A log to carry | `can:pull`, `power` | Abilities, domestic |
| Who Comes When I Call? | Whistle at dusk; pets come to the door, farm animals to the barn, wild animals watch from the trees | `life:*` | Wild, pets, domestic |
| Milk and Eggs Morning | Breakfast needs milk and eggs: who gives what | `gives:*` | Domestic |
| Hot Day | Heat wave; where to cool off | `needs:cool` | Homes |
| Lost Chick | A chick calls; who answers | hen, `sound` | Pets/domestic |
| Night Visitors | Who is awake at night | traits | Wild |

"Who Comes When I Call?" is the best seed for topics 1 to 3 (wild, pets, domestic) and should be the fourth scene if the first three work, because those topics are only partly carried by Stuck Truck.

---

## 7. Session chaining, difficulty and the night concept

### 7.1 How scenes chain
- A session is **three scenes** chosen from the signposts; the child picks the order; the game guarantees variety (never three of the same type).
- Within a scene **instance**, the system picks a scenario (guest, mud depth, wished animal, weather) that includes **something the child has not yet seen** (a discovery not yet in the scrapbook). Selection is by novelty, not by error history. This replaces the hidden confidence meter for these scenes.
- A scene ends when the problem is solved, or when the child leaves via the home button. A scene has no time limit.

### 7.2 Difficulty rises by adding traits or distractors, never speed
| Level of challenge | What is added |
|---|---|
| 1 | One trait; two solving cards; clear misses (visit 1) |
| 2 | One more need (e.g. dry **and** cool) or a bigger problem (5 stones); a card that **partially** helps |
| 3 | The world fact changes (hot night, deep mud, river) so the old answer fails |
| 4 | Two slots: combinations (dog plus cat plus hen) |
| 5 | An animal the child has never met in this scene (transfer) |

No timers, no speed, no counting of mistakes. "Harder" means the child must think about one more thing.

### 7.3 Across sessions
- The town accumulates (homes, feeders, rope posts). Sunset shows it all lit.
- Every third session adds a surprise guest as in PLAN 4.6 (a crate with a "?" that rattles).
- Unseen combinations are held back until the child has seen the basics (a progression of unlock rules by discovered stickers, not by accuracy).

### 7.4 The night concept
Today the "night" ends the session: the park dims, animals sleep. In this design it is **meaningful**, not decoration:
- **Tuck-in Night is the night scene.** Night is when the home is tested, so the existing sunset becomes the story's consequence.
- At session end every resident with a built home goes in and the window lights. Residents without a home curl up under the moon with a small blanket and a "zzz" (cozy, **not** sad). Next session the first Tuck-in guests are those animals, with a soft "sleepy" bubble. This gives a gentle pull to come back without guilt.
- Snack Stakeout takes place at dusk, so the stakeout shadows are tied to night as well.
- If the night scene tests poorly, night goes back to decoration and the ending animation remains (nothing is lost).

---

## 8. Hint ladder (general rules, all scenes)

1. **Never auto-solve.** The final step needs a tap or drag from the child.
2. **Slow ramp**: step 1 after about 6 s idle `[PLACEHOLDER]`; each next step after 6 s more.
3. **Attention first, answer last**: look at the problem, narrow the choices, show the trait, then offer to help.
4. **Wrong tries do not trigger hints**; only idleness does. A child exploring is not "stuck".
5. **Tap-then-tap** (tap card, tap slot) and keyboard are always available.
6. After a funny miss the card hops back and the world resets; the child never needs to press a button to retry.

---

## 9. Anti-pattern check

Pass means the design addresses it by construction. Risk means it passes on paper but must be verified in play.

| # | Anti-pattern | Verdict | Note |
|---|---|---|---|
| 1 | Chocolate-covered broccoli | **Pass, with risk** | There is no question. The first screen is a problem, not a prompt. Risk: if the consequences are weak or the card choice feels like "pick the right one", it is a quiz again. We test this directly (section 10). |
| 2 | Drill-and-kill | **Pass** | Scenes change stage, guest and fact each time; no repeated identical question; no points, stars, streaks. Rewards are town changes and moments. Risk: the novelty-selected scenario generator must truly vary. |
| 3 | Lecturing | **Pass** | No stated morals, no cutscenes. Spoken lines are 2 to 5 words ("Stuck!", "Heave!", "Zzz."). Reasons are shown as visible cues. ~14 new tiny lines, all captioned; zero reading needed. |
| 4 | Failure punishment | **Pass** | No lives, timers, buzzers, "wrong" screens or losses. Misses are funny and collectible. Child is never stuck: 4-step hint ladder; card always returns. Watch the lion nap making the truck "sink one stone": keep it comic, no sad sound. |
| 5 | Fake choice | **Pass, with risk** | At least two cards work in every scene (in different ways) and every card has a distinct Run. Risk: in Stuck Truck, lion and cat are *obvious* misses to some children; vary which animals are offered, and add partial helpers. |
| 6 | Content-light novelty | **Pass** | One mechanic, three scenes, ~14 shared clips, tag-driven outcomes; section 6 lists 8 further scenes as data. Risk: the clip library is the real cost (each clip is animation code), see risk R2. |
| 7 | Over-scoping | **Risk** | Three scenes plus shared clips plus scrapbook is much more than the old Deliver game. Cap: first release = 3 scenes, 14 clips, 6 to 8 new emoji props (burrow, hut, cave, pond, rope, food items), all drawn from the baked Twemoji set or simple canvas shapes. Estimated art addition about 8 to 15 KB gzip, audio synth only plus the 14 animal sounds already planned. Verify by measurement. |
| 8 | Adults-pleasing design | **Risk** | Child wishes served: make something happen (pull, splash), be funny (nap, stuck), a surprise (shadow reveal), feel clever (combine animals; predict the shadow), collect (stickers, residents), show someone (tricks, scrapbook). The risk is that *we* find the "learning" appealing while children only want the splash. If children repeat only the funniest misses and never solve, the learning is not happening (see R1). |

Additional checks against the PLAN principles: audio-first and reading-optional (pass); no score (pass); 2 to 3 minute sessions (scenes are 60 to 90 s each; pass); private and offline (pass: no new network use).

---

## 10. What to prototype and how to test with a 6-year-old in 10 minutes

### 10.1 What to prototype first (smallest that tests the bet)
**Stuck Truck only**, with 5 cards, 3 outcome types, hint ladder step 1 only, no town, no scrapbook. It has the biggest laugh, the clearest trait, and tests the whole thesis (does a consequence beat a verdict?). If the child loves Stuck Truck, add Snack Stakeout (tests prediction and the wish). Tuck-in Night comes last (most authoring, most rules). A paper or spreadsheet version is allowed first: the adult plays "the world" and acts out the clips with toys.

### 10.2 10-minute test protocol
1. **0:00** Hand over the device with no explanation. Do not say "game", "learn", or "animals". Note the first words (the original "Ohh, educational game?" reaction is the baseline to beat).
2. **0:00 to 4:00** Free play of Stuck Truck. Adult stays quiet. Note taps and words.
3. **4:00 to 7:00** Adult offers Snack Stakeout (or the toy version).
4. **7:00 to 9:00** **Transfer probe**: change the setup (deeper mud, or a new animal) and ask nothing; watch what the child tries first.
5. **9:00 to 10:00** Ask three questions: "What was your favourite?", "Why didn't the cat help?", "Who would you bring next time?".

### 10.3 Observable signals

| Signal | "One more" (good) | Boredom or no-learning (bad) |
|---|---|---|
| Behaviour | Asks "again", "another one"; re-drops the same card to see it twice; laughs and points; calls a parent over ("Look!") | Taps without watching the Run; skips every animation; looks away; asks "how many more?" |
| Prediction | Pauses with a card in hand, says "this one's strong"; hand hovers over a card before choosing | Tries cards in order left to right |
| Talk | Narrates reasons ("he's too small", "lion sleepy") | Silent or says "is this right?" (the quiz reflex) |
| Choice | Chooses a *funny* miss on purpose, then goes for the solve | Only chases the house/town reward |
| Transfer | In the changed setup picks a sensible new card first time | Falls back to trying cards in order |
| Exit | Asks for the scene again, or wants to show someone | Hands the device back, says "I'm done" in under 3 minutes |

### 10.4 Kill and pivot criteria
Abandon or heavily rework the idea if, over 5 children aged 6 to 7:
- Fewer than **3 of 5** ask for another scene unprompted within 10 minutes.
- **3 or more of 5** cycle through the cards in order without watching the Runs.
- **Fewer than 2 of 5** choose a sensible card first in the transfer probe (so the Runs entertain but do not teach).
- The first reaction is still "Ohh, educational?" from more than 1 of 5.
- A child is visibly distressed at a funny miss (we mis-tuned the gag).

Pivot options: (a) make the thing more toy-like (a sandbox where you place animals and watch, with problems as optional goals), (b) keep the Deliver mechanic but as a free-form town builder with traits shown only as consequences, (c) cut to a pure "stories" app with one scene per day.

---

## 11. Risks (honest)

| ID | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | **Fun without understanding**: the child cycles cards for the laughs and never forms the "why". (The inverse of chocolate-covered broccoli: all chocolate, no broccoli. We cannot measure it without analytics.) | High | Visible trait cues inside each Run; transfer probe in testing; second-visit "world changes" forces reasoning; hint ladder narrows choices. Tested only with observation. **Biggest risk.** |
| R2 | The outcome clips (about 14 animation behaviours) are the real engineering cost; each is code, not data | Medium | Reuse across scenes by design; cut scenes before cutting clip quality. |
| R3 | The town building mildly rewards solving over trying | Medium | Scrapbook gives equal credit to misses; watch for "house chasing". |
| R4 | Content accuracy: tigers do swim; elephants do work with people; cats can swim; bears vary; peacock roosting | Medium | Every trait is a `[PLACEHOLDER]`; teacher review; show only well-known, safe traits; avoid mockery (PLAN: no gags that mock an animal). |
| R5 | Topics 1 to 3 (wild, pets, domestic) are only weakly served | High | Fourth scene "Who Comes When I Call?"; accept honest limits in the first release. |
| R6 | Stuck Truck's lion/cat misses are too obvious, so some choices feel fake | Medium | Rotate the tray; add partial helpers; test. |
| R7 | Scope creep: three scenes plus clips plus scrapbook for one maintainer | Medium | Prototype one scene first; cut Tuck-in Night if needed. |
| R8 | 135 px logical canvas is tiny for 3 to 5 cards plus a scene on a phone | Medium | Cards 32 px sprites; max 5; test on a cheap phone. |

---

## 12. What is reused from what is built

Reuse: canvas micro-engine, Twemoji atlas, drag and tap-then-tap input, ghost-hand hint, captions, synthesized sfx, poke reactions (they become the "trick" replays), park (becomes the town), stickers, sunset tween, parent corner, progress model.
New: a generic scene runner (slot, tray, rule list, clip player), a clip library, a scenario picker (novelty-based), a scrapbook of live-composited stickers, signposts.
Retired or demoted: the correct/wrong verdict path and the confidence-based item picker for these scenes.
Data: `entities.json` gains namespaced tags and a `power`/`size`/`needs` set; a new `scenes.json` holds stages, trays, rules and sticker ids; `levels.json` becomes optional (the sort activity, Q8).

Voice lines (about 14, 2 to 5 words each, all captioned) `[PLACEHOLDER]`: "Stuck!", "Heave!", "Hooray!", "Who is that?", "Munch munch.", "Zzz.", "Brrr!", "Too small!", "Too big!", "Yawn.", "Hello, friend!", "Night night.", "Oh my!", "Look!".

---

## 13. Open questions for the product owner

| # | Question | Why it matters |
|---|---|---|
| Q1 | Do we accept superseding D3 (Deliver as the first mechanic) and make Try It the front door? | Decides everything below. |
| Q2 | Are **funny misses** that earn a sticker acceptable to you, or should only solves be collected? | Core to the "no failure" principle and to R3. |
| Q3 | May the town reward (a built home, a feeder) appear only on solves, or should every attempt leave a mark? | Outcome-based reward versus pure play. |
| Q4 | Is it fine that a wild animal "does not help" (the lion naps on the truck)? Some parents may see it as a gag on a wild animal. | PLAN says no gags that mock an animal. |
| Q5 | Elephants: shown as a strong helper (works with people in India) or kept as wild? Teacher to decide. | Affects Stuck Truck and ANIMALS.md zones. |
| Q6 | Meat as bait (lion, tiger): acceptable as plain fact under D5? Is a bone for the dog fine? | Snack Stakeout uses meat and honey and carrots. |
| Q7 | Should "Wish mode" (pick a favourite animal to invite) be in the first release or later? | It is the best hook for children, but adds scope. |
| Q8 | Keep the old sort activity as a side game, or retire it? | Saves or costs maintenance. |
| Q9 | Share a picture of the town or a sticker (Web Share API from the canvas, no backend)? | "Show someone" without accounts. Small code, privacy question. |
| Q10 | Which child do we test with first (your son, plus 4 others)? And are we willing to cancel the mechanic on the kill criteria in section 10.4? | Commitment to evidence. |
| Q11 | Are you comfortable with no numbers or counters at all, including no "found stickers" count? | Conflicts with typical collection loops; PLAN 4.7 says none. |
