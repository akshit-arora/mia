# REDESIGN: one good game, not three tap toys

Status: proposal v1, 2026-11-07. No code changed. Written from a read of `src/games/*`, `src/cards/*`, `src/engine`, `src/style.css` and the existing design/reality-check docs.

---

## 0. The verdict in one page

The problem is not that the games are educational. It is that they are **polite**.

Every action succeeds. Every route ends with the same reward. The animal arrives whether or not the child understood anything. A six-year-old does not read that as "easy"; they read it as "for a baby". The fix is not harder questions or a timer. It is **agency, mastery and surprise** inside the no-fail promise.

Three sentences to keep:

- **The child is doing a job for a friend, not answering a question for a reward.**
- **The fact is the rule of the game, not the caption after it.**
- **The cards are partners you play with, not trophies you count.**

What I would change first, in order:

1. **Flip the goal.** The child picks the animal they want to help; the food is the clue, not the multiple-choice answer. The animal is visible and waiting, not a crate payout.
2. **Give every trail a skill.** Basket capacity + item behaviour + route choice. Missing is a funny setback, not a non-event.
3. **Make the card playable.** Every animal has one ability that opens an optional shortcut or badge on the next run. Choose a buddy before you go.
4. **Kill the 8-second reveal.** Three seconds, child-driven, the animal meets you where you are.
5. **Pick one art language.** The current mix of auto-baked 32 px emoji, smooth vector scenery and pill-shaped DOM text is why it reads "low-res", not "retro".

Then the three doors: **Jungle is the flagship** (deepen it). **Farm becomes a routing/herding game**. **House becomes a physics/tricks toy**. If you can only ship one, ship Jungle + cards. Do not polish all three at once.

---

## 1. Why it feels like a workbook (and a toddler)

Map each current mechanic to the school pattern it repeats.

| Current thing | What the child actually does | Why it reads as workbook / toddler |
|---|---|---|
| Fork with three food signs | Picks one of three pictures; the food-to-animal rule is hidden (`animalFor()` in `forage/logic.ts`) | Multiple choice with no feedback. A wrong pick costs nothing and still ends in an animal. |
| Collect eight identical items | Switches lanes to touch the highlighted item (`need: 8`, `SAME_LANE_P: 0.25`) | Counting drill. 75% of items spawn outside your lane, but missing has no consequence. |
| Farm chores | Taps a glowing ring ten times (`doTap()` in `farm/index.ts`) | Tap-N worksheet. The pips fill like a progress bar. |
| House pantry | Picks food, the pet runs out (`choose()` in `house/index.ts`) | A matching question, then fetch play unrelated to the fact. |
| Reveal | Watches name, food, home, type, stats (`cards/reveal.ts`, 7-8 s) | A flashcard page, on rails. |
| Card levels 1-4 | Repeats the same run for a star | Sticker chart / grind. |
| Glow ring, hand, arrow | Follows the only lit thing | The game does the thinking. No initiative needed. |

The deeper issue: **nothing the child knows changes what happens next.** A child can finish all 14 animals without ever using a fact to make a decision. That is the definition of chocolate-covered broccoli, and it is also why the game feels young.

The no-fail rule is not the problem. The problem is that "no fail" was implemented as "no stakes, no skill, no surprise". Those are different things.

---

## 2. Design thesis

**"Easy to do, hard to master, impossible to fail."**

- **Easy to do**: one thumb, one action, no reading, no timer. A six-year-old can start in five seconds.
- **Hard to master**: route, timing, capacity, a secret. A nine-year-old can still chase all three badges.
- **Impossible to fail**: a mistake costs seconds and a laugh; progress and cards are never lost. Keep this promise.

Pillars:

1. **A job, not a quiz.** The animal is a character with a need; the child is the one who can meet it.
2. **The fact is the mechanic.** Food changes how you move. Home changes the terrain. Body changes the ability.
3. **Your friends change the game.** Cards are loadout, not score.
4. **A world that surprises.** Weather, secrets, animal behaviour, a friend you did not expect.
5. **Cool, not cute.** The child is competent. No baby talk, no constant praise, no reward for breathing.

---

## 3. The new core loop (90 seconds)

```
Shelf: pick a friend  ->  Prep: pick food + buddy  ->  Trail: run, choose, collect
      ->  Meet: feed / brush / play  ->  Card stamp  ->  Shelf: who is next
```

**0-10 s - The ask.**
The waiting animal is on screen, not a silhouette in a crate. It looks at an empty bowl. Three food icons appear. The child picks one. This is the only "question", and a wrong pick is not marked wrong: it starts a different trail and you meet a different animal, while your friend stays on the shelf. Curiosity is rewarded; the goal is never lost.

**10-60 s - The trail.**
A three-lane path. The child moves the basket/cart/character. The food they chose changes the rules:

- **fruit** bounces ahead: chase and catch it on the rebound
- **honey** is sticky: you slow down while carrying it; bees chase (comedy, no sting)
- **sugarcane** is heavy: slower, but it knocks obstacles out of the way
- **seeds** scatter: tap/peck to gather them before they roll off
- **meal** is a covered bowl: a quiet approach past a sleeping animal (no loud noises)

The basket has a **capacity** (say five). The trail has more than five things worth taking: food, a gift, a lost item. **Choose what to carry.** That is a real decision every run.

**60-75 s - The meet.**
The animal is at the end, in its home (hive tree, riverbank, barn, living room). The child **does the thing**: holds the food out, brushes, throws the toy. The animal reacts. The "why" is a two-second body animation, not a text card: trunk reaches the high branch; teeth tear the meal; beak cracks the seed. The child caused it.

**75-90 s - Home.**
The animal follows the child back. No crate. The card is stamped in three seconds: picture, name, food, home, ability. The child places the card on the shelf; the animal waves. The shelf then shows who is waiting next.

No 22-second warm-up. First choice at 10 s, first pickup at 20 s, first laugh at 30 s, friend at 70 s.

---

## 4. Mastery without punishment: the three badges

Every run can earn up to three stamps, shown as small marks on the card. None are required to progress. They unlock **cosmetics and route variants**, never power.

1. **Full basket**: collect the target amount without spilling.
2. **Clean trail**: no bumps or spills (or "quiet paws" for shy animals).
3. **Secret**: find the hidden shortcut, lost item or new friend.

Why this works:

- Replay is motivated by *doing it differently*, not by repeating the same run for a star.
- A child who just wants to meet animals can ignore badges entirely.
- The badge is a conversation starter with a parent ("how did you get the leaf stamp?"), not a score.

---

## 5. The cards are partners (the meta loop)

This is the biggest structural change and the one that makes the collection matter.

Every card gets **one ability**, derived from a real trait. Before a trail, the child picks **one buddy** to bring. The buddy's ability opens an **optional** shortcut or badge, never the main path, so no card can soft-lock a run.

| Animal | Ability | What it does in play | Trait it teaches |
|---|---|---|---|
| Elephant | Trunk | reach high fruit / lift a log | trunk |
| Monkey | Climb | take the high vine path / swing a gap | hands, tail |
| Horse | Gallop | dash through mud without slowing | legs |
| Rabbit | Hop | cross a gap / rock step | hind legs |
| Bear | Sniff | reveal hidden honey in fog | nose |
| Peacock | Fan | calm a nervous animal / reveal a hidden path | display |
| Hen | Peck | find seeds buried in the path | beak |
| Goat | Balance | walk a narrow ledge | hooves |
| Buffalo | Plough | push through deep mud | strength |
| Cow | Bell | call a lost calf / open a gate | domestic |
| Dog | Dig | find a buried item | paws |
| Cat | Sneak | pass a sleeping animal without waking it | quiet |
| Lion | Roar | roll a boulder / open a cave (not hunt) | voice |
| Tiger | Pounce | leap a wide gap | spring |

This solves four problems at once:

- **Collection has a use** beyond a shelf and a stat comparison.
- **Replay is different** because the buddy changes the route.
- **Facts are learned through use**: "trunk reaches high" is a verb you needed.
- **The child forms a team**, which is the Pokemon feeling you want, without combat.

It also gives Card clash a reason to exist later: abilities, not just numbers.

---

## 6. The three doors

### 6.1 Jungle - flagship: "Forage Trail 2.0"

Keep the lane runner. Add:

- **Capacity + item behaviour** (above).
- **Real forks**: short/safe vs long/risky, shown with footprints and a food icon, not a quiz. The child sees the trade-off.
- **A visible friend**: the animal appears at the start (small, in a bubble at the end of the path) and reacts as you collect. It is not a mystery box.
- **Terrain**: mud slows, vines block a lane, a river needs timing, a dark cave needs the lion's roar or the cat's eyes.
- **Three route variants per animal**: day, rain (slippery), night (limited visibility; fireflies). Same animal, different run.
- **Badges** + buddy ability.

Remove: 22 s warm-up, eight identical pickups, the glowing ring on every item, the crate.

### 6.2 Farm - "Morning Round" as a routing game

The farm fantasy is *a route well run*, not *tap the glowing thing*.

- You drive Bholu with one thumb; the cart has a **load** (feed, eggs, milk).
- Animals are loose; **call** them (tap/honk a rhythm) and they follow; guide them into the right home.
- **Stops** are decided by what is in the cart. Wrong feed: the animal sniffs and walks away (funny), you can turn around. No fail.
- **Trade-off**: the short cut through the mud is faster but breaks eggs; the long way is clean. The child chooses.
- Facts: the animal's body and food tell you which pen; no sign quiz.
- Badges: all home, no broken eggs, found the shortcut.

If this is too big for v1, **cut it to one route** (hen) and ship it later. Do not ship ten taps.

### 6.3 House - "Play Yard" as a physics toy

The house fantasy is *play with your friend*.

- Throw with aim: the ball bounces off the wall, the pet anticipates, you can bank it into a basket.
- **Trick chain**: catch, spin, jump through a hoop; three in a row is a combo. The pet's mood changes the trick.
- **Hide-and-seek**: hide the food or toy; the dog sniffs, the cat stalks, the rabbit digs. The fact is the search mechanic.
- **Ownership**: name the pet (three choices), paint the home, teach a trick. This is the "my pet" feeling.
- Badges: longest catch, trick chain, secret trick.

If this is too big, cut it to the fetch toy plus one trick. Do not ship "tap anywhere = heart".

---

## 7. The reveal, fixed

Current: 7-8 s, non-interactive, ends in a crate then a shelf. It is the most "flashcard" moment and the most slot-machine grammar.

New: **three seconds, and the child is holding the controls.**

- The animal is already there, not delivered.
- The child feeds/brushes/throws (one input); the animal reacts; the food/home icon stamps onto the card with a *thunk*.
- The card flips once; the child drags it to the shelf (or taps the shelf); the animal walks there.
- First time: 3.5 s. Repeat: 1.2 s, just the new stamp or badge.
- The "why" is the animal's body doing the thing, not a text panel.

This also removes the crate (animals as goods) and the loot-box anticipation. The animal is a friend who chooses to come home, not a prize dispensed.

---

## 8. Art direction: why the "pixel" looks wrong

**Diagnosis (from the code): three art systems are mixed.**

1. Animals and food are **Twemoji SVGs auto-downsampled to 32 px**, quantized to a 32-colour palette, auto-outlined (`tools/bake-emoji.mjs`, `src/gen/atlas.png` is 128x128). That is a *filter*, not pixel art.
2. Scenery is **smooth vector canvas**: gradients (`createLinearGradient`), antialiased `arc`/`ellipse`, `lineJoin = 'round'` (`src/cards/scenes.ts`, `src/games/*/art.ts`).
3. UI is **DOM text** in system font with 999 px pill radii and 3 px borders (`src/style.css`, `.rv-name`, `.cardname`).

At 32 px an emoji has too much detail; downsampling turns it muddy. At 2-3x it looks like a low-res image of an emoji, not a sprite. The smooth scenery and pill UI then make the pixel sprites look like stickers from a different game. That is the "low pixelated" feeling.

**Pick one language. Do not split the difference.**

### Option A - authentic 16-bit (best if you can get an artist)

- Fixed logical resolution: 240x135 (or 320x180 if the phone test holds 30 fps). Letterbox with a themed border; stop varying `W` 240-300 so composition is deliberate.
- One 16-colour palette for world and cards; three shade ramps per material; 1 px dark outline (`#181020`); no gradients (dither skies if needed); hard 1 px shadows.
- Sprites: 16x16 or 24x24, hand-authored. 14 animals plus about 20 props. Not auto-baked emoji. At 24 px a lion needs four colours and a silhouette, not a face.
- Animation: two-frame idle, three to four frame action, stepped at 8-12 fps. **Snappy** beats smooth: two-frame anticipation, one-frame impact hold, squash/stretch, 2 px shake, 3x3 particles.
- Typography: a pixel font for in-world labels (8/16 px); system font only for captions. DOM pill text is fine for accessibility but should not be the game's voice.
- UI: 9-slice chunky panels, 2 px hard shadow, square corners. No 999 px pills in-world.

### Option B - flat vector storybook (best if there is no artist)

- Drop the pixel pretense. Bold shapes, eight-colour palette, thick consistent outlines, no gradients, no textures. Toca Boca / Sago Mini energy.
- Same limited palette across cards, world and UI. This can be drawn procedurally in canvas and look intentional.
- This is the safer choice for a one-person team; a half-done pixel style will always look cheaper than a confident vector style.

**Either way:** one palette page, one outline rule, one shadow rule, one animation frame rate. Put it in `docs/design/ART_BIBLE.md` and make every new sprite pass it.

### If you keep pixel art, the minimum viable fix (1-2 days, no artist)

- Stop baking animals at 32 px. Hand-pixel the six jungle animals at 24 px first; they are the flagship.
- Remove gradients from `farLayer`, `groundLayer`, `yardScene`, `worldScene`; replace with two flat bands plus dither.
- Replace the pill name plate with a pixel-font plate; keep the DOM caption pill for accessibility.
- Add a two-frame idle and a three-frame action to each animal; step them on a 100 ms clock.
- Add hitstop on pickup (two frames), a 2 px shake on bump, and 3x3 particles. Motion sells retro more than resolution.

---

## 9. Onboarding: the first 10 minutes

Current first run: 22 s warm-up, a fork, eight pickups, then a 7.5 s reveal. That is a long time before the child *does* anything meaningful, and the hand/arrow does the thinking.

New:

- **0:00-0:10** shelf: three silhouettes, one animal visible and hungry. A single hand tap hint, then never again.
- **0:10-0:20** pick the friend, then three food icons, then one.
- **0:20-1:00** trail: first pickup at 25 s, first obstacle at 35 s, first fork at 45 s. One badge is achievable on the first run (full basket) so the child feels competent.
- **1:00-1:10** meet, feed, card stamp.
- **1:10-1:30** back to the shelf; the friend waves; a new silhouette is waiting.
- **1:30-4:00** two more friends, one from each shelf.
- **4:00-6:00** the buddy prompt: "bring Balu next time; his nose finds secrets." The child replays a trail with a buddy and gets a different route. This is the "one more".
- **6:00-10:00** free play; a rain or night variant is visible; a new animal is waiting.

Teach by affordance, not arrows: an empty bowl, a footprint trail, the animal's gaze, a food icon over a bush. One hint maximum, then trust the child.

---

## 10. What to cut (ruthlessly)

- The crate and the loot-box reveal grammar.
- The 7-8 s reveal; the long-press skip is no longer needed at three seconds.
- The 22 s warm-up.
- `need: 8` identical pickups; use four or five with different behaviours.
- The four-level card grind; replace with badges and route variants.
- The glow ring, arrow and hand on every action; teach once.
- One of the three games in v1, if time is tight. **Jungle + cards is the product.** Farm and House are chapters two and three.
- Card clash as a stat comparison; either give it abilities later or keep it as a side toy.
- The 14-animal completion checklist as the main goal; the goal is "who is waiting today", not "fill 14 slots".

---

## 11. Build plan (one developer + AI, part-time)

**Stage A - Trail 2.0 vertical slice (1 week).** One animal (bear), one biome, three food behaviours, capacity, two route variants, three badges, interactive meet, three-second card. No farm or house. Test with three children.

**Stage B - Buddies (1 week).** Three abilities (elephant trunk, monkey climb, rabbit hop), choose-a-buddy, optional shortcuts, card stamp. Test.

**Stage C - Art pass (1-2 weeks).** Pick A or B; fixed resolution; palette; six jungle animals hand-pixel or vector; motion polish; pixel font or plate; remove gradients.

**Stage D - Chapter 2 (1-2 weeks).** Farm herding prototype behind a flag. If it is not fun in two days of tuning, cut it. Same for House tricks.

**Stage E - Content + audio + accessibility (1-2 weeks).** Six jungle animals, three variants each, voice lines, captions, reduced motion, one-handed play, phone test.

Realistic: 6-8 weeks part-time to a strong v1. Art is the long pole, not the code.

### Repo mapping

- `src/games/forage/logic.ts`: `Round` gains capacity, item behaviours, route variant and badges; `pickFork` becomes a route choice, not a food quiz; `animalFor` is no longer the reward logic.
- `src/games/forage/index.ts`: start at the animal, not the warm-up; three-second meet; remove the crate; add hitstop and shake.
- `src/cards/data.ts` + `cards.json`: add `ability`; `src/cards/reveal.ts`: shorten and add one input.
- `src/games/farm/*`: replace the `doTap()` tap-N loop with route/herd state.
- `src/games/house/logic.ts`: extend the existing `throwAt` physics into trick chains.
- `src/engine/stage.ts`: fixed aspect/letterbox; frame-stepped animation helper; palette constants.
- `src/gen/*` and `tools/bake-emoji.mjs`: stop using auto-baked animals for the game; keep the atlas only for cards if needed.
- `src/style.css`: one UI language; pixel or 9-slice in-world, system font for captions only.

---

## 12. Playtest and kill criteria

Five children, age six to seven, ten minutes, no help.

Observe: time to first action; do they choose or wait for a glow; do they replay; do they lean in or laugh; do they name the animal; do they ask "what do I do?"; do they try a second route; do they hand it back.

**The only learning test that matters:** show a *new* animal (giraffe) with three food icons and ask them to help it. Can they infer from the body (long neck, high leaves)? That is transfer. Do not ask "what does a bear eat?"; that is recall.

Pass: four of five play three or more runs; three of five make a sensible choice for the unseen animal; three of five ask for one more; none need help twice.

Kill: children wait for the glow, or only tap the highlighted thing, or play one run and wander. If that happens, the game is still doing the thinking; remove more hints and add a real choice.

---

## 13. Decisions for the owner

1. One flagship (Jungle + cards) or three equal doors? (Recommend: flagship first.)
2. Pixel art or flat vector? (Recommend: vector unless you can budget an artist; do not fake pixel.)
3. Cards as buddies with abilities? (Recommend: yes; this is the product.)
4. Keep Farm and House in v1 as-is, rebuild, or mark "coming soon"? (Recommend: rebuild one, cut the rest.)
5. Keep Card clash? (Recommend: side toy; do not let it define the cards.)
