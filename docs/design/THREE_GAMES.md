# THREE GAMES: collect the animals, meet the facts

Status: design draft v1, for owner decision. No code changed. All numbers are `[PLACEHOLDER]` until a child plays them. All animal facts are drafts for teacher or parent review.

Direction chosen by the product owner: games that are fun first and not educational on the surface; the animals are the reward; cards work like Pokemon or wrestling Trump cards; three shelves (Jungle, Farm, House); no questions, no tests.

Sources skimmed: ANIMALS.md, REALITY_CHECK.md (verdict and anti-patterns), entities.json, reactions.ts. Three lessons carried over from the reality check, because they apply here too: (1) "it is not a quiz" is not enough, design against the quiz reflex; (2) a reward that can be had by cycling everything teaches nothing (F2, F3); (3) a random reward with a hidden rule teaches nothing (F5). So in this design the crate is never random: the child's own play decides which animal comes.

---

## 1. Design thesis

A child of 6 knows every detail of a Pokemon or a Trump card because the card is shown again and again, in the same layout, attached to something the child wants. Nobody quizzed them. Repetition alone gives labels ("Tiger: 9 strength"); labels alone are brittle. Clarity comes when the label is attached to an experience the child lived. So each fact is shown twice: on the card (constant layout, same icon, same place, every time) and inside the game the child just played (the food the child physically gathered is the food on the card; the farm the child walked is the home on the card). The card then says what the hands already did.

The "Why?" tap. On a revealed card there is a small round "?" button, never prompted, never required. The child taps it only if curious. It plays a 4-6 second picture story with no words: for example Sheru the lion, a tooth icon, a drumstick: "teeth for meat". Or Gajju the elephant, a long trunk reaching a high branch: "trunk reaches up". Reasons are icons (tooth, trunk, wing, water drop, house, hand), at most three frames. It asks nothing. It exists so a curious child can find a reason, and so a parent sitting beside the child has something to point at.

What this teaches, honestly:
- Recognition: this picture is a lion, it sounds like this, its name card looks like this.
- Association: lion goes with meat and jungle; cow goes with grass and farm; dog goes with house.
- Categories: wild, farm, pet as three groups, with colour and shelf as the handle.
- A first, weak sense of cause through the "?" stories (tooth, trunk), only for children who tap.

What it does not teach:
- Reasoning. A child can finish every shelf and still not be able to say why a cow is a farm animal. They will know that it is.
- Transfer to a new animal (what would a giraffe eat?). The "?" stories hint at it; nothing here tests or trains it.
- Anything about all pets or all farm animals beyond the 14. The categories are "the ones I collected", not a concept.

That limit is accepted: the aim is a child who has seen the facts so often that they are obvious, and who feels the animals are friends. Where the owner later wants reasoning, the food-mission version (section 6) is the place to add it.

---

## 2. The card

### 2.1 Fields and how a non-reader sees each

| Field | Shows as | Sound / voice | Notes |
|---|---|---|---|
| Picture | Twemoji sprite 32 px, scaled 3x in the reveal, pixel crisp | animal sound (existing) with caption | Frame colour = type |
| Personal name | Big name plate, letters 1.5x the body size, plus first letter in a coloured circle | Voice: "Sheru!" (1 word) | The name is what the child will say to a parent. Name plate shows on every card view |
| Type | Badge top-left: tree = wild (green), barn roof = farm (yellow), house = pet (pink); frame colour matches | Shelf jingle (3 different tiny jingles) | No word on the badge; the shelf itself is the label |
| Food | Food icon with a small munch animation when the card opens (the animal chews it) | Crunch/slurp sfx; caption "eats meat" | One main food, shown as an icon; a second food optional for later |
| Home | Little scene icon bottom-right: tree-and-leaf (jungle), barn (farm), house with door (home); the card background strip shows that scene | none on the card; on the shelf: "Oh, Sheru went to the Jungle." | Cow shows Farm only |
| Trump stats | 3 rows, each an icon and a bar of 10 pips: Size (big/small footprint icon), Speed (running shoe icon or wind lines), Strength (arm muscle icon) | tick-tick as pips fill on first view | The "fun scores", not science. Marked for review |
| Funny action | 1.2 s animation on tap of the picture (reuses the reaction system) | animal sound | Every card tap replays it. This is the "poke" already built |
| "?" | Round button, bottom-centre | Silent picture story, captions optional | Never auto-opens |

Voice lines (2-6 words, always with captions, recorded later; synthesized speech is avoided for performance): "Sheru the lion!", "Sheru goes to the Jungle.", "Sheru eats meat." The first is in the reveal, the second on shelving, the third only when the food-munch plays.

### 2.2 The 14 animals

Stats are Size / Speed / Strength on 1-10, deliberately exaggerated for play and all flagged. Names are common Indian pet or story names; teacher to confirm none is awkward in a region. Food and home are draft facts.

| Animal | Name | Type | Food icon | Home icon | Size / Speed / Strength | Funny reveal action | Review flags |
|---|---|---|---|---|---|---|---|
| Lion | Sheru | wild | meat | jungle | 6 / 7 / 8 | Yawns a huge yawn, then sneezes a leaf | Lions live in grassland and forest (Gir); "jungle" is the child's word. Fine for age, note |
| Tiger | Veeru | wild | meat | jungle | 7 / 8 / 9 | Stretches like a cat, tail wags then catches itself | Same |
| Elephant | Gajju | wild | grass / leaves (sugarcane as 2nd) | jungle | 10 / 3 / 10 | Sprays water, a rainbow pops | Food is mainly grass, leaves, bark, fruit; icon "leaf" |
| Monkey | Bunty | wild | fruit (banana) | jungle | 2 / 6 / 3 | Scratches head, then peels a banana wrong way | Banana is the child's icon; wild monkeys eat many fruits. Fine |
| Bear | Balu | wild | honey | jungle | 6 / 4 / 8 | Rubs back on a tree, hums | Emoji is a brown bear; Indian sloth bear eats termites, fruit, honey. Honey kept as the icon; teacher review |
| Peacock | Neelu | wild | grain / seeds | jungle | 3 / 4 / 1 | Fans tail with a sparkle | Peacocks also eat insects; seed icon is a simplification |
| Cow | Gauri | farm | grass / hay | farm | 6 / 3 / 4 | Chews, then a tiny "moo" bubble | Farm only, as agreed. Sensitive: cow is sacred to many families, keep respectful, no jokes at cow's expense |
| Buffalo | Kalu | farm | grass / hay | farm | 7 / 3 / 6 | Flops into a mud puddle, splash | Mud-wallowing is real and funny |
| Goat | Chintu | farm | leaves | farm | 3 / 5 / 2 | Jumps twice, headbutts a bucket | Goat eats leaves and grass |
| Hen | Kuku | farm | grain | farm | 1 / 3 / 1 | Clucks, an egg pops out | |
| Horse | Chetak | farm | grass / gram | farm | 7 / 9 / 6 | Rears and neighs, dust puff | Horse as farm animal is a simplification (also working animal) |
| Dog | Moti | pet | roti / bone (bone icon) | house | 3 / 7 / 3 | Wags so hard it spins | Many Indian dogs are street dogs; later content question |
| Cat | Mini | pet | milk / fish (milk icon) | house | 2 / 7 / 1 | Washes face with paw, then falls off the shelf edge softly | "Cats drink milk" is the common child belief; adults may flag it |
| Rabbit | Bittu | pet | carrot | house | 1 / 6 / 1 | Hops three times, nose twitch | |

Ties on a stat are allowed and handled in Trump mode (section 5). Peacock, hen and rabbit sit at 1 on Strength; this is a feature, a lowly animal can still win on its other stat.

---

## 3. The reveal moment

Always plays after a round (and when a duplicate levels up). About 7.5 seconds; after the first three times a tap on the screen skips ahead to the shelf fly-in only (never skips the name and food beats).

| Time | Beat | What the child sees and hears |
|---|---|---|
| 0.0-0.8 | Crate | A crate shakes and bounces (leaf crate for Jungle, hay crate for Farm, gift basket for House). Rumble sfx. The crate is the one the child earned |
| 0.8-1.5 | Pop | Lid pops, a silhouette rises, fills with colour |
| 1.5-2.2 | Sound | Animal sound with caption ("Tiger growls") |
| 2.2-3.2 | Name | Name plate slides in, voice "Veeru!" |
| 3.2-5.0 | Card facts | Card flips. The food flies in, the animal munches (1.0). Then the home strip slides behind it and the type badge stamps (0.8). Stats pips fill the first time only |
| 5.0-6.2 | Funny action | The animal does its action |
| 6.2-7.5 | Shelf | Card shrinks, flies to its shelf. Voice: "Veeru goes to the Jungle." The shelf glows, the animal sits |

Constant (so facts stick): beat order; food then home then badge; icon positions; the three type colours; the shelf jingle; the line "[Name] goes to the [Shelf]". The same four things every time is exactly how a Trump card works.

Varies (so it stays fun): crate skin by game; the entry (three variants: pop up, drop in, slide); the funny action (per animal, 14 total); a small chance (hand-authored, not random gambling) of a cameo guest peeking in from the crate (a bird, a butterfly); camera shake size; music sting pitch.

Exposure arithmetic (assumptions flagged: a 10-minute session is about 6 rounds of 75 s play plus 7.5 s reveal plus about 15 s picking and shelf glance = about 100 s per round; a child plays 4 sessions a week):

| Source | 10 minutes | One week (4 sessions, 40 min) |
|---|---|---|
| Reveals | 6 reveals. Each shows one animal's name, sound, food, home, type once. If the child picks 6 different animals: each fact of those animals seen 1 time. The category pattern (badge + colour + home) is seen 6 times | 24 reveals over 14 animals = 1.7 per animal |
| In-game food contact | Per round: food icon in the animal's hunger bubble (1) plus gathering 8 pickups of that food (8) = 9 contacts of "this animal wants this food". 6 rounds = 54 contacts (9 per animal on the animals played) | 24 rounds x 9 = 216 contacts, about 15 per animal |
| Shelf visits | Child opens the shelf after each reveal and taps 3 cards: 3 card views. Seeing the animal sitting under the right shelf = the home fact, every visit | 4 x 8 taps = 32 card views, 2.3 per animal; home fact visible on all 4 sessions for every owned animal |
| Trump mode | Not in first 10 min | 3 plays x 6 hands x 2 cards = 36 card showings, 2.6 per animal, stats each time |
| Total for one animal, one week (food) | about 10 in 10 minutes for played animals | about 15 (play) + 1.7 (reveal) + 2.3 (shelf) + 2.6 (Trump) = about 21 |
| Total for one animal, one week (home) | 1 | 1.7 + 2.3 + 2.6 = about 6.6, plus the passive shelf position on every visit |

Honest reading: food is the best-supported fact (it is played, not only shown). Home is the weakest-practiced fact; it relies on the shelf and the card background strip. The Farm and House games carry the home fact by being set in it (the farm game is played on the farm).

---

## 4. Shelves

Look. Three horizontal wooden shelves in one screen (landscape): Jungle top (green back wall, leaves), Farm middle (yellow, hay, a barn roof), House bottom (pink, a window, a lamp). Each shelf has slots for its animals: 6 Jungle, 5 Farm, 3 House = 14. Slots with animals you own show the sprite with a tiny idle animation. A tap shows the card and plays the funny action.

Missing animals show as dark silhouettes with a "?" shaped hint of the food icon in a small bubble (so they are also the goal signpost, see section 6). Silhouettes are shown on the shelf from day one, so the child sees the collection to be had without a counter or a percentage.

Duplicates. A second crate of an animal does not give a second sprite. It raises the card level:

| Level | What the child gets | Why it is not a grind |
|---|---|---|
| 1 | The animal, the card | First reveal |
| 2 (second crate) | A second funny action unlocked (replaces the single action with two to choose from) and a gold card edge | Visible, immediate |
| 3 (third crate) | The "?" story is unlocked for this animal (the "why" picture story) and a tiny hat or accessory on the shelf sprite | The reason arrives as a reward, not as a lesson |
| 4 (fourth crate) | Baby of the animal sits beside it on the shelf | Last item; further crates give a small new background item on that shelf |

Cap: no more levels after 4, because the child should reach the end of "things to get" within a few weeks and then play for fun.

Why the child returns: the animals are friends who live on the shelf (they do idle animations, wave when the app opens, sleep at the end of a session); there are silhouettes the child wants; each animal has a second action and a baby to earn; Trump mode lets them show a sibling; the child has a favourite they want to level. No streaks, no loss, no timers, no ads, no energy, no "come back tomorrow or lose". A crate is earned only by play, never purchased and never dropped as a random daily gift.

Slot-machine check: the animal in the crate is chosen by the child's choice of trail (sections 6-7); the child sees the silhouette before playing. Nothing is hidden. The only chance element is a cameo or a funny action variant, which has no reward value.

---

## 5. Trump mode

A small separate screen. Two players on one phone (take turns holding, or just tapping), or one child against the phone. No reading: icons and bars only.

Setup: each side gets 3 cards drawn from the child's shelf. The phone side draws from the full 14 (so a child with 3 animals can still play). Cards face-down on both sides, the top card flips.

Round:
1. The active player sees their card with three stat rows: Size, Speed, Strength, each with its icon and a bar of 10 pips. The phone's card is face-down.
2. The player taps a row to pick it. Phone picks the highest of its own three (easy mode) or random (kid mode, default for first plays, so the child often wins).
3. Both cards flip. The two bars slide side by side with a tick-tick count; the bigger bar glows; the winning animal does its funny action; the losing animal does a little sad-but-funny wobble (it shrugs). The winning card takes both cards to the bottom of its pile.
4. Tie: both bars flash, both animals hop, "Draw!" icon (two equal bars); both cards stay; flip the next.
5. Finish: when one side has all six cards, or after 6 rounds, whoever has more cards wins. The loser gets the same "fireworks" (shorter) and a small friendly sound. No fail screen.

Cost and risk: stat tables are data; layout is the card layout already built for reveal. About 2-3 days. Risk: the numbers are "fun scores". A child may learn that horse is stronger than a cow; that is mostly true and not harmful, but flagged. Trump mode is the main repeated exposure to the stats, not to food or home, so it adds replay without teaching the weak fact (home); a later variant "pick Food" (wild/farm/pet match) is a possible addition but is a quiz in a game skin and is not recommended.

---

## 6. The three games

All three share: landscape, 480x270 logical canvas scaled up, tap or drag with one hand, big targets (at least 48 px in logical units), a hunger bubble at the start showing the target animal and its food, and no failure. Each round ends in a crate. Pick-a-trail: the child chooses which silhouette to earn from the shelf (or a signpost with 2-3 silhouettes). First sessions default to a guaranteed new animal.

Shared mistake feel: the basket wobbles and a leaf falls on the child's "hat"; a puddle splash; an item bounces away and the animal looks at it and sneezes. Everything comedic; nothing is lost except one item that is replaced a moment later. There are no lives.

Shared difficulty (gentle): the round speed starts slow; after three clean rounds the lanes get a little denser; after bumping three times in a row the speed eases back. Never a visible number.

### 6.1 WILD: "Forage Trail" (and "Basket Bridge" for meat-eaters)

Core idea: a friendly basket on a forest path. The child gathers the food a wild animal likes and walks it to the animal's feeding spot. The animal is not hunted and nothing is harmed.

First 10 seconds: the shelf's silhouette (say Balu) is shown with a bubble of honey. The screen cuts to a sunny forest path. A cute basket with eyes ("Tokri") stands at the left; the honey tree's honey icons glow ahead. A hand cursor wiggles near the basket for 2 s, then fades. The child moves the basket and picks up the first honey.

First minute: the child has learned: move the basket into the glowing items; they pop into the basket with a sparkle and a tick. The first obstacle (a rolling log, or a puddle) arrives at 20 s; bumping it just makes the basket spin and the items hop back in. By 40 s the child has got 4-5 items; the path ends at a feeding spot at 50-60 s.

Controls:
- Touch: drag left/right anywhere on the screen to slide the basket; or hold on the left/right half of the screen. Lanes: 3, the basket snaps to the lane; this makes it forgiving.
- Tap alternative: tap the left, middle or right lane to jump there (this suits children with tremor or one finger).
- Keyboard: Left/Right arrows (A/D), Space = middle lane.
- Landscape, one hand, thumb distance within half the screen.

A 75 s round, second by second:
- 0-6: bubble intro (animal, food); the path scrolls in.
- 6-20: easy pickups (3 lanes, one item at a time, 1 per 1.5 s, never an obstacle).
- 20-45: pickups and soft hazards. Hazards: a log (basket bonk, items bounce and return), puddle (splash, small slow). Two items at once in different lanes.
- 45-55: a stepping-stone river: 3 lanes of stones, the basket hops stone to stone (tap lane = hop). A missed stone = splash and the basket floats back to the last stone laughing. No drowning, no loss.
- 55-65: last pickups; the basket is nearly full (the child needs 8 items; gets them by 60 s on average).
- 65-75: feeding spot: the animal waits behind a log. The basket tips its food; the animal munches (the food-munch animation used on the card); crate falls from a tree.
- 75-82: reveal.

Meat-eaters (lion, tiger): the design solution is a "Ranger's Basket" trail: the child does not gather meat or see any hunting or any prey. The ranger's jeep (distant, no person drawn, just a green jeep icon and a flag) has left a closed wicker basket with a meat icon on its lid at the start. The child carries that basket (as Tokri, with the lid closed) along the path and across the stepping-stone river to a feeding rock where the lion or tiger waits. At the rock the lid pops open for a moment, a drumstick-shaped meat icon appears, the animal sniffs, munches (cartoon, no bones, no blood), and sits happily. The card says "eats meat" with the meat icon. What the child gets from the reveal: lion goes with meat; the ranger's basket says "someone looks after them" and avoids hunting.

Honest caveats: (a) wild lions are not fed in the wild; this is a game convention (a protected-forest feeding spot) and the card must not say "gets meat from baskets"; (b) it makes meat-eaters slightly less "wild"; (c) the gathering for four of the six wild animals (fruit, leaves, honey, seeds) is the stronger game, so the meat trail has less pickup play and more carry-and-hop. If a teacher thinks it teaches that lions are fed by people, replace with a "rocks and river" trail where the child only clears the way (rolls logs) to a meat-eater's den and the food is not shown being gathered at all. Fallback listed in open questions.

Trails (data):

| Trail | Pickups | Target | Hazard |
|---|---|---|---|
| Fruit trail | banana, mango, jamun | Bunty (monkey) | log |
| Honey tree | honey pots | Balu (bear) | puddle |
| Sugarcane and leaves | sugarcane, leaf bunches | Gajju (elephant) | log, rolling coconut |
| Seed path | grain, seeds | Neelu (peacock) | puddle |
| Ranger's basket (bridge) | single closed basket | Sheru (lion) / Veeru (tiger) | river stones |

Ending and crate: always a crate with the target animal. If the target is already owned, the crate levels the card (duplicates). A round with many bumps still gives the crate; the only difference is a funnier ending animation (items fall in a heap).

The later "food-mission" version: the child picks a silhouette on the shelf; the bubble asks nothing, only shows the food; the child chooses which trail to walk by looking at food icons on signposts: a first, soft food-to-animal prediction with no wrong choice (a wrong trail yields a different animal, delightful, never a failure). Food mission also allows a "gather two foods for two animals" round. This is where reasoning can later enter, not in v1.

Art: Twemoji 32 px sprites for animals, items (banana, mango, honey pot, leaf, sugarcane, grain: 16-24 px, in the existing atlas), basket drawn with canvas rectangles and circles, path as 3-4 tiled bands, trees as canvas triangles and rectangles, parallax of 2 layers. River: a blue band with 2-3 animated highlight pixels.

Sounds (all synthesized from `recipes.ts` unless noted): pickup tick (rising pitch per item), bump boing, splash, munch crunch, crate rumble, shelf jingle, animal sounds (existing recorded plus captions).

Data shape (new content is mostly data):

```json
{ "trail": "honey", "target": "bear", "food": "honey",
  "pickups": ["honey"], "hazards": ["puddle"], "bridge": false,
  "bubble": "food.honey", "spawnRate": 1.4 }
```

### 6.2 FARM: "Morning Round" (tap chores on a cart ride)

Choice: a tap-based chain on a gently moving cart (no steering). It is a different verb from the wild game (move) so the three games feel different, uses only taps (the easiest input), is tactile, and is funny (squirting, popping eggs). Alternatives considered: egg catching (too close to Forage Trail, same verb), ploughing (slow), harvesting alone (no animals present).

First 10 seconds: a signpost with a silhouette (Kuku the hen) and a grain bubble. The cart starts rolling along a farm lane with a ding. A wiggling nest ahead glows.

First minute: the child learns "tap the glowing thing". Stations arrive about every 12 s: each station pauses the cart until finished, so there is never a timer.

Controls: tap or press Space/Enter on the glowing thing; hold-and-drag is never required; a second tap anywhere also works (accessibility "tap anywhere" setting for those with tremor).

A 75 s round (hen route):
- 0-5: bubble and cart starts.
- 5-18: Station 1, Grain: tap grain sacks to scatter grain on the ground (3 taps). Grain flies, hens run in and peck.
- 18-35: Station 2, Eggs: nests glow; tap each to pop an egg into the basket (4 eggs; pop sfx, egg wobbles, one egg is a tiny chick that peeks).
- 35-55: Station 3, Coop: tap the coop door to open it; hens walk in one by one; the last one is the target.
- 55-65: cart trundles to the farmyard and a crate drops.
- 65-75: reveal.

Other routes (data):

| Route | Stations | Target |
|---|---|---|
| Hen yard | grain, eggs, coop | Kuku (hen) |
| Dairy | cut grass, milking (tap alternating left/right: pail fills, foam), cowshed | Gauri (cow) / Kalu (buffalo) (two routes: different bucket, same flow) |
| Goat path | leaf bundles, bucket headbutt (a funny tap), pen | Chintu (goat) |
| Stable | gram bags, brush (tap to brush; dust), stable door | Chetak (horse) |

Milking is the only station with a held rhythm: it is two taps, and the same rhythm a child can do with two fingers or one. No anatomical detail drawn: the pail sits under, abstract.

Ending: always a crate; if the animal is already owned, the card levels up.

Mistakes feel: tap a station out of order and nothing happens except a gentle "nope" wiggle of the glowing thing; tap the wrong place and a hen runs in a circle. No penalty.

Gentle difficulty: stations require 3 taps early, 4-5 later; one extra station appears at higher levels; speed never increases.

Later food-mission: "Dairy needs grass": the child picks which farm tool station (hay, grain, leaves) goes with which waiting animal by feeding it. Same cart.

Art: Twemoji 32 px for animals; eggs, sacks, pails, hay bales as 16 px atlas sprites; cart, fences, barn, sun as canvas shapes. Sounds: tap pops, cluck, moo, milk squirt, cart rumble, rooster jingle.

Data shape:

```json
{ "route": "hen", "target": "hen",
  "stations": [ {"type":"tapN","item":"grain","n":3},
                {"type":"tapN","item":"egg","n":4},
                {"type":"door","item":"coop"} ],
  "bubble": "food.grain" }
```

### 6.3 HOUSE / PETS: "Play Yard" (fetch and fun)

Choice: toy play. Pets are about company and play; fetch gives instant, big, joyful feedback for one tap. Bath and feeding are used as short bookends, not the game.

First 10 seconds: a living room with a rug, a window, and a bed. The silhouette (Moti the dog) is shown with a bone bubble; the dog sits, tail wagging, and a ball floats into the child's hand (the tap point).

First minute: the child taps anywhere: the ball flies there; Moti runs, grabs it, and brings it back with a wag. After 3 throws the first silly mishap happens (Moti brings a slipper instead).

Controls: tap anywhere to throw toward that point (or flick). For the cat: drag a feather on a string. For the rabbit: tap carrots to drop them on the rug. Keyboard: arrows move an aiming cursor, Space throws.

A 75 s round (dog):
- 0-8: intro; first throw.
- 8-55: 8-10 throws; each throw has 1 of 5 comedic outcomes: normal return, slipper return, runs round the sofa, digs the cushion, brings back a leaf. A heart fills with each success (no failure: any outcome fills a heart). Each throw ~4-5 s.
- 55-65: the dog gets tired; the bed; the child taps the food bowl and Moti eats his roti/bone (food fact); the dog curls up and sleeps; a basket crate lands by the bed.
- 65-72: reveal.

Ending: always a crate. If already owned, the card levels. The crate for pets is a gift basket.

Mistakes feel: throw out of the window and Moti stops, looks, sneezes; the ball comes back in a bouncy arc anyway.

Gentle difficulty: more toys (balls, sticks, slippers) as rounds progress; an item that blocks the throw (a box) the dog jumps over.

Later food-mission: choose the bowl (milk, roti, carrot) for a hungry waiting pet; any choice gets a reaction (a rabbit sniffing roti and walking away is funny, not wrong); the pet eats the right one and gets the crate.

Art: Twemoji sprites for pets, toys 16 px atlas sprites (ball, slipper, bone, feather, carrot, bowl), room as canvas rectangles (floor, wall, window, rug, bed, lamp). Sounds: bark, meow, rabbit hop (synth), pop, boing, munch, snore.

Data shape:

```json
{ "pet": "dog", "target": "dog",
  "toys": ["ball","stick","slipper"],
  "outcomes": ["return","slipper","circle","dig","leaf"],
  "food": "bone", "hearts": 8 }
```

---

## 7. Session loop, long-term loop, first session, "one more"

Session loop (5-15 min): open on the shelves (animals wave). Tap a silhouette (or follow the glowing default) to see a bubble of its food. Play a 60-90 s round, always ends in a crate, reveal, shelving, then either one more silhouette or Trump mode. Close any time: nothing is lost mid-round (a round restarts clean; collected cards are saved immediately).

Long-term loop (weeks): 14 animals, 4 card levels, baby unlock, shelf decoration items, Trump mode, new animals added as data in later releases, seasonal-free (no seasons, no events). Honestly the content is short: 14 animals at one new animal per round is about 14 rounds (25 minutes) to fill the shelves; levels extend this to about 14 x 3 = 42 extra crates. Total ~4-5 hours of play. That is fine for a free offline game but it will end; the open question is how many animals the owner wants.

First session path (guaranteed new each time):
1. Minute 0-1: shelf with three empty shelves and glowing Sheru silhouette. Tap it.
2. Minute 1-3: Forage Trail (honey for Balu is easier than the basket bridge; first animal is Balu or Bunty). Reveal.
3. Minute 3-5: the shelf shows one animal and two glowing silhouettes, one per other shelf. Child picks Farm (Kuku). Reveal.
4. Minute 5-7: House (Moti). Reveal. Three animals, one per shelf.
5. Minute 7-10: free play; Trump mode unlocks (3 cards: a fun first match with the phone). End on the shelf with a sleeping animal and a new glowing silhouette: the "one more" hook.

What makes a child ask for "one more": the visible silhouette they want; the funny reveal; a favourite getting a second action or a baby; a sibling to challenge in Trump mode; each round is short enough to end before boredom. Not used: timers, streaks, loss, daily gifts, notifications.

---

## 8. Anti-pattern table

| Anti-pattern | Verdict | Note |
|---|---|---|
| Quiz in a game skin | Pass | No questions anywhere. Risk: the signpost choice in food-mission could become matching; keep wrong choices rewarded with a different animal |
| Reward-chasing that ignores the cards | Risk | A child may rush through games just for crates. Mitigation: the card is the reward; the card is always shown with food and home; reveal cannot be skipped the first three times |
| Gambling-like randomness | Pass, watch | Crate is deterministic (child's trail choice). The only random items are cosmetic. Never add "random crate" |
| Reading dependence | Pass | Icons, colour, voice, captions. The name plate has letters but is not required to understand anything |
| Punishment | Pass | No lives, no fail screen, no timers; mistakes are comic |
| Fake choice | Risk | Choosing a trail is a real choice (different animal, different play). Station order in the farm is fixed, so it is not a choice; do not pretend it is |
| Over-scoping | Fail unless cut | Three games, a reveal, shelves, Trump mode, levels, "?" stories is a lot for one developer. Section 10 cuts it to one game first |
| Designed for parents not children | Pass | The facts are on the card, not in a parent text; the "?" is child-started. Parent corner stays as is |
| Violence or hunting | Pass | No hunting, no prey, no capture. Meat-eaters fed by a closed basket at a feeding rock (caveat in 6.1) |
| "Facts are decoration" | Risk | If the child never looks at the card and only watches the funny action, the facts are decoration. Mitigation: food is played (not only shown); stats are used in Trump mode; the card is the way to the shelf |

---

## 9. Build reality

Reusable (exists today, per the repo): the engine (stage, sprites, atlas), the audio facade and sfx recipes, captions, parent corner, storage (add card levels and ownership), entities.json model (add fields for card: personalName, type, food, home, stats, revealAction), reactions.ts (pokes become funny actions; props banana, egg, ball, carrot, water, mud already exist; add honey, milk, slipper, bone).

New: the card renderer; the reveal sequencer (a timeline of 7 beats); the shelf screen with silhouettes and card levels; the three game scenes; Trump mode; the "?" story player; name voice lines and 14 names; atlas additions (about 25 small sprites); data files for trails, routes, toys.

Rough days for ONE developer with AI help (estimates, not promises):

| Piece | Days |
|---|---|
| Card renderer and card data | 1.5 |
| Reveal sequencer (crate, name, facts, fly-to-shelf) | 2-3 |
| Shelves with silhouettes and storage | 2-3 |
| ONE game (Forage Trail, with lanes, pickups, bridge, hazards) | 4-5 |
| Sounds, captions and tuning | 1-2 |
| Total: one game plus reveal and shelves | about 11-14 |
| Each additional game | 3-5 |
| Trump mode | 2-3 |
| "?" story player and 14 stories | 3-4 |

Performance on old low-end Android (the owner saw lag): fixed 480x270 canvas scaled by CSS; 30 fps cap; draw only sprites from the atlas (no per-frame allocation, objects pooled); at most about 40 sprites on screen; no shadowBlur or filters; two parallax layers only; audio decoded once; avoid speechSynthesis (the earlier suspected cause of lag) by using recorded lines or captions only; reduced-motion removes shakes and parallax. The per-frame cost of a lane game is small (3 lanes, up to 6 items); the first measurement is a real old phone before anything else.

Size budget (400 KB gzip first install): atlas +about 6 KB; JS for card, reveal, shelves, one game +about 20-25 KB gzip; 14 name voice lines at about 3-4 KB each = 40-55 KB if recorded (can be deferred: captions and a synthesized chime first); sfx are synthesized (0 KB). The budget holds with margin.

---

## 10. Recommended first prototype

Build: Forage Trail with three trails only (Fruit for Bunty, Honey for Balu, Ranger's Basket for Sheru), the reveal sequence, and the Jungle shelf with six silhouettes, storage of ownership. No Farm, House, Trump mode, "?" stories, levels, or names recorded (captions only). About 11-14 days.

Why wild first: it carries the hardest design problem (feeding meat-eaters), the biggest set of animals (6), and the lane-run performance risk; if it does not work, the whole direction is in doubt. Fallback: if the lane run feels flat or laggy, switch to the Farm cart (tap only, cheapest to run) and keep the reveal and shelves.

10-minute observation test with a 6-year-old (one adult observer, no help, no quiz, no "why" questions, no "what is this animal"):
1. Hand over the phone with no explanation (0 min).
2. Observe silently, noting: does the child move the basket without help in 10 s? Do they smile at the first reveal? Do they point to or name the animal? Do they say the animal's name? Do they tap the card again? Do they ask to play again?
3. At 8 min, tell the child only "you can play more or stop"; note which.
4. Afterwards, ask only "Do you want to play it again tomorrow?" and nothing about the facts.

Pass signals: the child plays the first round without help; laughs or points at the reveal; plays at least 3 rounds in 10 minutes; says "one more" or reaches for the phone after; taps a shelf animal to watch its action; says the name Sheru or Balu to a parent unprompted.

Fail signals: the child asks "what do I do?" more than twice; looks bored at the reveal; skips the reveal; plays one round then wanders; frustration at obstacles; the lane run lags on the test phone (below 24 fps).

Kill criteria: if two of three children (age 6-7) play fewer than 2 rounds in 10 minutes, or if the game lags on a real old Android phone after the obvious fixes, stop the lane-run and switch to the Farm cart; if that also fails, the "game plus collection" idea needs rethinking before more building. If children play but never look at the card (no one names an animal or points at the shelf), the facts are decoration and the card layout must change before building more games.

---

## 11. Open questions for the owner

1. How many animals do you want in total? 14 give about 4-5 hours; more animals (giraffe, deer, sheep, pig, parrot, fish) would prolong it. Which regions' animals first?
2. Are you comfortable with the Ranger's Basket for lion and tiger, or prefer the "clear the way to the den" alternative where food is never shown being obtained?
3. Which names do you want for the animals (Sheru, Balu, etc. are guesses)? Should a child be able to rename their favourite (typing is reading and writing; maybe a pick-from-a-list of 3 names)?
4. Should Trump mode ship in the first release, or after the shelves and one game?
5. Is it acceptable that the dog and cat live in the House shelf while many Indian dogs are street dogs? Do you want a stray-dog card later?
6. Who reviews the facts (a teacher or parent) and when? Which facts are blockers (bear honey, cat milk, horse as farm animal)?
7. May I use a hand-pixelled replacement for the face-only lion and bear emojis in the reveal (3x scale shows their weakness)?
8. Is "the animals are rewards" acceptable if the first prototype shows that children play for the crate and ignore the card? Which would you rather adjust: the card or the crate?
