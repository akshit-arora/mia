# Story and Characters: the world the "Try It" scenes live in

Status: narrative proposal v0.1, 2026-11-06. No code. Companion to STORY_PUZZLES.md (Game Designer), PLAN.md, ANIMALS.md, RECORDING_SCRIPT.md.
I respect the Game Designer's mechanics (Try It, tray, Run, hint ladder, tags). Where the story needs something different I list it in section 9 as a **conflict to resolve**, not as a change.

---

## 0. The story in one breath

Tonight, little Bholu the truck has to bring lanterns to every window in the town of Chhotu-Nagar, but he keeps getting into trouble. The child is the helper who sorts each trouble out. Every lantern that gets lit makes the town glow a little more, and somewhere in the dusk a very shy little light called **Jugnu** is watching, and is slowly getting brave enough to come close.

**What the child would say if you asked them what they do:** "I help Bholu light up the town, and I find Jugnu."

No lesson is stated anywhere. The knowledge (who pulls, who eats what, who sleeps where) is simply how this town works, as in a Panchatantra tale: a character with a trait meets a problem, the trait decides what happens, and nobody explains it.

---

## 1. First impression

### 1.1 Name options

| # | Name | Why it works for a 6-year-old | Watch out |
|---|---|---|---|
| 1 | **Oh No, Bholu!** | A catchphrase a child can shout. It names a character in trouble, not a subject. Funny before they know what the game is. Works as a spoken phrase and a Hindi twin ("Arre, Bholu!"). | "Oh no" must never become the game's failure buzzer (see 5.3 and risk N1). |
| 2 | **Bholu's Moon Mela** | Mela (fair) means noise, lights, treats. The moon promises the night. It points at the long goal (the Moon Mela is the night-7 payoff, section 7). | "Mela" is a secular fair word but is a festival-adjacent word; check with a parent reviewer (section 6). |
| 3 | **Tiny Town, Big Night** | Rhythmic, sounds like a picture book. Names the world and the night. | Least character-led; weaker as a thing a child says out loud. |

My pick: **Oh No, Bholu!** as the title, with **Chhotu-Nagar** as the name of the town inside it. Keep "Moon Mela" as the name of the night-7 event.

### 1.2 What to avoid in the name (and the store blurb, and the icon)

- Subject words: animals, learn, fun with, kids, ABC, quiz, explore, discover, school, smart, brain, "edu".
- Delivery or sorting words: Express, Sort, Match, Park (that is the old Deliver mechanic speaking, and "Animal Express" names the subject).
- Adult-marketing words: "adventure of learning", "play and learn".
- A title that is a command to the child ("Help the animals!") because that sounds assigned.
- Store blurb that lists topics. Write: "Bholu the truck is stuck again. Can you help?"

### 1.3 The first 10 seconds (what the child sees)

| Time | On screen | Sound | Words |
|---|---|---|---|
| 0.0 | Home-screen icon was Bholu with a muddy nose and huge eyes. The game opens straight on a golden afternoon path. A small signboard stands in the mud with the title drawn as a picture: Bholu's face and a big "!" (3 to 4 letters of text at most; the child need not read it). Chiku sits on the board. | Silent for a moment (browsers block sound until a tap), a gentle visual only | none |
| 0.5 | Bholu rolls in from the left, bells on his bumper swinging. He hits the mud: **squelch**. The signboard topples with a splash and Chiku flies up with a mud hat. Bholu's wheels spin and spin, mud sprays on his own face. His eyes turn and **look straight at the child**. | Squelch, wheel whirr, jingle of bells (captioned) | none yet |
| 3.0 | The rope hangs down, swinging. A ghost hand taps Bholu's nose. **The first tap is on Bholu** (this is also the audio-unlock tap): he honks and says his line. | Honk, then the voice | "Oh no! ... Help me?" |
| 5.0 | Two helper cards slide in (horse, buffalo), the ghost hand drags one to the rope. | Soft whoosh | none |
| 8.0 | The child drops a card; the Run starts (3 to 6 s, tappable to skip). | Clip-specific | see 3.1 |

**Why a child picks it rather than being assigned it.** The first thing on screen is a character in trouble who looks at them and asks for help, not a menu, a prompt or a question with a right answer. The invitation is the character's face, not a button. The first action is a tap on the truck, which is a toy-like thing to do.

First spoken line: **"Oh no! ... Help me?"** (two short clips). The pause between the two is where the child acts.

Conflict: the browser will not play sound until a tap, so the first line cannot play on arrival. See section 9, C1. The existing `app.tap_truck` and `app.welcome` lines would also be blocked before a tap; I suggest they are not needed.

---

## 2. The cast

### 2.1 Rules for the cast
- Three named recurring characters only (Bholu, Chiku, Jugnu). Every animal guest keeps its species name (the 14 existing `name.*` clips), so there are no new name recordings except Jugnu.
- Animals do not talk. They make their own sounds and do their own things. Only Bholu and Chiku speak, and only in tiny lines.
- All three are "it" (no gender), as in PLAN.md 4.2.
- Nobody is a teacher. Nobody explains.

### 2.2 Bholu the truck (keep, with a sharper flaw)

| | |
|---|---|
| Looks | A small Indian truck painted like real truck art: flowers, tassels, bells on the bumper, and "Horn OK Please" on the back (everyday sight for Indian children). Big round eyes in the windscreen. |
| Want | To bring a lantern to every window in Chhotu-Nagar tonight, and to be useful. |
| Flaw | **Rushes in.** Drives straight into mud, parks where it will rain, never looks first. This flaw is what makes the problems appear, so the problems never feel like worksheet questions: they are Bholu being Bholu. |
| Voice | Bouncy, short. Max **4 words** a line, always an exclamation or a gentle question. Never explains, never says "no", "wrong", "correct". |
| Catchphrase | "Oh no!" It is about **Bholu's own trouble** (the mud, the rain), never about the child's choice (see 5.3). |
| Signature reactions | 1) Wheels spin faster and eyes cross when stuck. 2) A giggle-honk ("toot-hee-hee") at anything silly, same energy whether the child's choice solved the problem or not. 3) Headlights dim to a sleepy glow when someone falls asleep. |

Why keep Bholu: already built, already recorded as a concept, and a vehicle is the right shape for a hub that travels between scenes. Revision: Bholu was "the doer"; he is now "the doer who rushes", which is the engine of the whole story.

### 2.3 Chiku the sparrow (keep, but Chiku asks and never tells)

| | |
|---|---|
| Looks | A house sparrow (chidiya), the bird every Indian child has seen on a windowsill. |
| Want | To know what is inside, behind and under everything. |
| Flaw | **Too nosy.** Pokes its head into everything: gets a mud hat, a pot on its head, a fright. Easily startled, then curious again in one second. |
| Voice | A whisper. Max **4 words**, **questions only**. Never answers its own question, never states a fact (see risk N3 about the old Wonder fact lines). |
| Signature reactions | 1) Head tilt and a rising "chirp?" 2) Hops onto whatever it is curious about, usually the guest's back or head, and the guest lets it. 3) Fluffs up into a round ball when cold or startled and rolls a little. |

Revision: in PLAN.md Chiku "wonders why" and then facts are spoken ("Hens keep chicks warm!"). In the Try It scenes Chiku only asks and the Run answers. The existing six `fact.*` lines stay in Wonder Bubbles if that mode stays; they are not used here.

### 2.4 Jugnu the little light (new, the recurring mystery)

| | |
|---|---|
| Looks | A tiny glow with two dot eyes, a firefly (jugnu). Drawn in canvas, no emoji sprite, so almost no art cost. |
| Want | To glow in a place where everyone is not looking at it. |
| Flaw | **Shy.** Hides the moment it is watched. |
| Voice | No words. Soft chime notes ("tink"). Captioned "Jugnu tinks." |
| Signature reactions | 1) Blink-blink when curious. 2) Slips behind a leaf, lantern or ear when looked at. 3) A bright spin and a happy ring when the child is gentle (taps once, then waits). |

Why a firefly: familiar in India (jugnu, in songs and village evenings), gentle, instantly connected to the night, and it needs no face art or voice. Fireflies are seasonal and less seen in big cities; a teacher or parent should confirm children recognise the word (section 6).

### 2.5 The guests (animals, in the scenes)

They are not recurring characters in the story sense; each carries one trait that creates a funny problem. Quirks never mock the animal (see 5.4).

| Animal | Want | Trait that makes the problem | Signature funny |
|---|---|---|---|
| Horse | To trot | Strong and willing | Pulls so hard it gallops past the rope |
| Buffalo | A cool wallow | Strong but slow, loves mud | Pulls in a big slow fan of mud, then rolls in the puddle |
| Dog | To help, always | Willing but small | Tail wags hard, tugs, flops and pants, then licks Bholu |
| Cat | Cat things | Pets do not pull carts | Bats the rope, climbs on the truck and washes |
| Lion | A nap (it is lion nap time) | Does its own thing | Yawns, curls on the truck bed, truck sinks, lion purrs |
| Elephant | To help, a lot | Very strong | Pulls too well and sends Bholu into the flowers |
| Monkey | Everything shiny | Climber | Tugs the rope, then climbs it instead |
| Hen | To fuss | Tiny but loud | Flaps, feathers fly, truck wobbles once |
| Rabbit | Snug and quiet | Small, shy, a digger | Hops into the burrow; squeaks at its own echo in the cave |
| Bear | Honey | Big, wants a big roomy dry place | Wedged in a small door with a plop |
| Tiger | A snack, a stretch | Plain, not scary | Stretches, tail flick, yawns |
| Cow, goat, peacock | Calm, climb, show off | As in ANIMALS.md poke reactions | Reuse poke reactions |

---

## 3. The three scenes as tiny stories

Notation: **Child's act** is the drop. Every spoken line has a caption (the same text) and a visual cue. Lines marked **(drop)** can be replaced by sound, animation or silence.

### 3.1 Scene 1: Stuck Truck (afternoon, golden light)

**Setup.** Bholu, carrying a basket of lanterns, drove into the mud (his flaw). The child sees the cause: a rope, a mud patch with stones, a spinning wheel.
**Child's act.** Drops a helper card on the rope.
**Payoff.** The helper's trait runs. The truck pops out with a splash. Chiku, nosing too close, is covered in mud and wears it like a hat.
**Funny miss.** A different clip per card (Designer's table): the cat washes itself on the truck; the lion curls up and the truck sinks one stone; the dog pulls, flops and wags. Each is a joke about what that animal does, never about being "wrong".
**Warm moment.** The helper rides on the truck bed to the next place with its ears blowing, and Bholu rings his bumper bells for it.

| Beat | Visual cue | Sound | Line key |
|---|---|---|---|
| Arrive and get stuck | Wheel spins, mud on face, eyes at the child | Squelch, whirr, bells | `bholu.ohno`, `bholu.helpme` |
| Helper pulls | Stones light up one by one | Heave, rope creak | `bholu.pull` (drop) |
| Cat or lion (fun miss) | Cat washes / lion curls on the truck | Lick; big yawn; truck groans | lion: `bholu.heavy` |
| Dog helps a bit | Tail wag, one stone lights, flop | Pant, wag | none (giggle-honk) |
| Truck pops free | Splash on Chiku's head | Pop, splash, giggle-honk | `bholu.hooray` |
| Helper rides along | Helper on truck bed, bells ring | Jingle | `bholu.thanks` |

Example in play (horse): Bholu: "Oh no! ... Help me?" The child drops the horse. Horse trots, heaves, three stones glow, **pop**, mud on Chiku's head. Bholu: "Hooray!" Horse hops on the truck, Bholu: "Thank you!"
Example in play (lion): lion strolls over, sniffs the rope, yawns, curls up on the truck. Truck sinks one stone. Bholu: "Um... heavy!" and a giggle-honk. The lion purrs in its sleep. Tap it and it ambles back to the tray. The lion was never "wrong": it was nap time.

### 3.2 Scene 2: Snack Stakeout (dusk, purple and orange)

**Setup.** Bholu stops for a rest in a garden and a bush rustles. Two round, glowing eyes. They duck when Chiku looks (peekaboo, repeated). It is curious, not scary: soft pizzicato notes, no growl.
**Child's act.** Puts a snack on the plate. (Wish mode, if kept: tap a town resident first.)
**Payoff.** Out steps a guest into the lantern light. The guest's name is spoken with the existing clip. The guest eats; Chiku lands on its back; a lantern on the garden table lights.
**Funny miss (wish mode).** The wished-for animal peeks, sniffs the air, tilts its head, and its tail waves goodbye from the bush. A different animal arrives instead and eats happily. Chiku looks back and forth between the two.
**Warm moment.** The guest lowers its head so Chiku can hop on; Chiku falls asleep on it, stays in the picture all through the sunset.

| Beat | Visual cue | Sound | Line key |
|---|---|---|---|
| Rustle | Eyes blink in the bush, duck down | Leaf rustle, 2 soft notes | `chiku.who` |
| Snack lands | Plate glows, shadow edges forward | Plop, sniff | none |
| Reveal | Guest steps into the lantern light | Animal sound + name | `name.<animal>` (existing) |
| Eating | Munch, tail swish | Munch (sound) | none |
| Wish miss | Sniff, head tilt, tail waves bye | Sniff, tiny "hm" | `chiku.gone` (drop) |
| Chiku perches | Chiku hops on the guest | Soft chirp | none |

Silly-word set for the Run captions: "munch", "crunch", "slurp", "plop", "nibble nibble".
Example in play: child puts out a banana. Eyes blink. The shadow's long arms reach the plate. Out steps a monkey, peels it and puts the peel on its head. Name clip: "Monkey!" A sticker flies to the book.

### 3.3 Scene 3: Tuck-in Night (night, deep blue, lanterns on)

**Setup.** A guest arrives yawning so big that the yawn pops the "zzz" bubble before it forms. Bholu: "Oh no!" at the rain cloud rolling in over the empty plot (his own mishap: he parked the plot in the rain's path).
**Child's act.** Drops a home part on the plot (burrow, hut, tree, pond, cave).
**Payoff (snug).** Window glows, a lantern from Bholu's basket hangs on the door, "zzz" floats up, a heart pops. Bholu dims his headlights.
**Funny miss.** The gag shows the **need** (rain drip = no roof; fanning ears = too hot; wedged in the door = the door is small; echo = wide empty cave). The guest looks at the child, not sad: ready to try again. Gags are about **doors, roofs and echoes, never about bodies** (no "too big", no "too fat").
**Warm moment.** Bholu, whispering: "Night night." Chiku tucks under a wing on his roof.

| Beat | Visual cue | Sound | Line key |
|---|---|---|---|
| Sleepy guest arrives | Giant yawn pops the zzz bubble | Yawn | none (sound) |
| Rain cloud | Cloud over the plot, first drip | Rumble, drip | `bholu.ohno` ; `chiku.brr` (drop) |
| Home placed | Part pops in with a puff | Pop | none |
| Snug | Lantern, window glow, zzz, heart | Soft chime | `bholu.nightnight` |
| Door too small | Rump sticks out, wriggle, plop | Plop, giggle-honk | none |
| Echo in cave | Rabbit's squeak comes back three times, smaller | Echo | none |
| Not snug | Drip, fan, wobble, guest looks at child | Drip / flap | none |

Example in play (buffalo): child picks the burrow. The buffalo pushes in head first, **pop**, head in, rump out, tail swishing. Bholu giggle-honks. The buffalo wriggles out. The child tries the pond. The buffalo lies down, mud up to its chin, sighs. The rain falls on its back. Window glows. Bholu: "Night night."

---

## 4. Voice lines (all new lines, for the owner's recording)

Hard limits met: every line is 2 to 4 words (cap 6), has a caption identical to the text, and has a visual cue. Energy 1 = sleepy, 5 = very excited. Speakers are recorded by the owner as in RECORDING_SCRIPT.md: Bholu bright and bouncy, Chiku soft and breathy.

| # | Key | Text | Who | Mood | Energy | Visual cue | Drop? |
|---|---|---|---|---|---|---|---|
| 1 | `bholu.ohno` | Oh no! | Bholu | Comic dismay, never fear; a smile in it | 4 | Eyes go wide, wheels spin | no |
| 2 | `bholu.helpme` | Help me? | Bholu | Hopeful, looking at the child | 3 | Eyes at the child, rope swings | no |
| 3 | `bholu.pull` | Pull, pull, pull! | Bholu | Cheering, rhythmic, repeating | 5 | Stones light up one by one | **drop** (rope creak and rhythm sound) |
| 4 | `bholu.heavy` | Um... heavy! | Bholu | Strained but laughing | 3 | Truck sinks one stone, lion asleep on it | no |
| 5 | `bholu.hooray` | Hooray! | Bholu | Big joy | 5 | Truck pops free, splash | no |
| 6 | `bholu.thanks` | Thank you! | Bholu | Warm, sincere | 3 | Helper hops on the truck bed | no |
| 7 | `chiku.who` | Who is that? | Chiku | Whispered, wide-eyed, rise at the end | 3 | Eyes blink in the bush | no |
| 8 | `chiku.gone` | Where did it go? | Chiku | Puzzled, head tilt | 2 | Empty bush, tail waves bye | **drop** (head tilt alone) |
| 9 | `chiku.light` | Ooh, a little light! | Chiku | Hushed delight | 3 | Jugnu blinks | no |
| 10 | `name.jugnu` | Jugnu! | Bholu | Proud reveal, same as other names | 4 | Jugnu pulses when named | no |
| 11 | `bholu.nightnight` | Night night. | Bholu | Whisper-smile, very soft | 1 | Headlights dim, window glows | no |
| 12 | `chiku.brr` | Brrr! | Chiku | Cold shiver, funny | 3 | Chiku fluffs into a ball | **drop** (synth shiver) |
| 13 | `bholu.more` | One more? | Bholu | Playful invitation | 3 | Next signpost glows | **drop** (existing `discover.again` or a glowing signpost) |

**Count.** 13 new lines. Four are droppable (3, 8, 12, 13), so the floor is **9 new lines**. Against the existing 51 in RECORDING_SCRIPT.md that is 51 -> 64 at most, or 51 -> 60 at least.

**Existing lines reused with no new recording:** all 14 `name.*` (guest reveal), `sticker.new`, `idle.nudge`, `truck.honk`, the `day.*` set at sunset.

**Existing lines that stop being needed in the Try It scenes** (if the Designer's mechanic replaces Deliver as the front door): `correct.1` to `correct.3`, `wrong.gentle`, `wrong.hint`, `drag.prompt`, `zone.jungle`, `zone.farm`, `zone.home`. That is 9. The owner could skip these, making the net recordings 51 - 9 + 13 = **55**, or 51 - 9 + 9 = **51** at the floor.

**Sounds, not lines (no recording of a script needed).** These are synthesized or animal clips, each with a caption key `cc.sfx.*`:

| Sound | Caption |
|---|---|
| Mud squelch | Mud squelches |
| Wheel spin | Wheels spin |
| Rope strain | Rope creaks |
| Truck pops free | Truck pops out |
| Bumper bells | Bells jingle |
| Bush rustle | Something rustles |
| Munch | Munch munch |
| Big yawn | Big yawn |
| Rain drips | Rain drips |
| Echo | Echo |
| Snoring | Soft snoring |
| Jugnu | Jugnu tinks |
| Giggle-honk | Bholu giggles |

That is 13 new caption keys with no audio recording except what the engine makes (giggle-honk is a short synthesized toot pattern). Captions stay under 4 words.

Not added: "Too small!", "Too big!" (the Designer's proposed lines). They read as a verdict on the animal and explain what the Run already shows. See C2.

---

## 5. Tone rules

### 5.1 The words we never use
- Verdicts: correct, wrong, right, good job on a choice, try again, no, not that one.
- Morals: "that's why", "because", "remember that", "you should", "it is important".
- Mockery: lazy, fat, silly (about an animal), scary, dangerous.

### 5.2 The tone checklist (every scene must pass all)
1. After any drop, the world does something interesting. Nothing is ever refused.
2. No line is a reaction to the child's choice; lines react to what happens to Bholu or the world.
3. The reason is in the picture (a drip, a stuck door), not in a sentence.
4. No animal runs away in fear. Predators are plain: a tiger eats a piece of meat at the garden table and yawns.
5. No hunting, no chasing, no "eaten by".
6. Bholu's and Chiku's trouble is the joke, never the child's mistake.
7. One warm moment per scene (listed above).
8. Equal energy for every outcome: the funny miss gets the same size of reaction as the solve.

### 5.3 "Oh no" is not a buzzer
Bholu says "Oh no!" at his own trouble: stuck in mud, rain over an empty plot. If it played after a child's "wrong" card it would become a buzzer in a costume. Rule: it plays once at the start of Stuck Truck and once at the rain cloud in Tuck-in Night, whatever the child does. Funny misses get a **giggle-honk**, not words.

### 5.4 What a 6-year-old finds funny (and the gags I use)

| Type | Gag |
|---|---|
| Slapstick | Mud hat on Chiku; rump stuck in the burrow door; elephant sends Bholu into the flowers |
| Sound | Squelch, plop, pop, boing, the giggle-honk, a huge yawn that pops a bubble |
| Repetition | "Pull, pull, pull!"; the cave echo coming back three times smaller; the shadow ducking back into the bush each time Chiku looks |
| Surprise | You expect a tiger and out comes a cow; the monkey peel on its head |
| Silly words | Squelch, plop, munch, crunch, slurp |
| Reversal | The lion that the truck needed to pull... is asleep on it |

### 5.5 Gags I deliberately did not use
- Anything that makes a body the joke (big, fat, small).
- A cow in any gag (PLAN.md 4.6 and D6): the cow is calm and respected.
- Falling, crying or being scared as a reaction to a choice.
- An owl blinking in the dark for the `hide` need (C3).

---

## 6. Indian context, and what a teacher or parent should review

### 6.1 What is authentic and natural
| Element | Use | Why |
|---|---|---|
| Names | Bholu, Chiku, Jugnu, Chhotu-Nagar | Everyday nicknames and a word for a firefly. Not tokenistic: nothing in them is a costume. |
| Truck | Bholu is a painted truck with bells and "Horn OK Please" | Truck art is a normal sight on Indian roads. |
| Sounds | Bumper bells (ghungroo), a musical truck horn, crickets and frogs at dusk | Sounds children know. |
| Light | Lanterns (lalten) in windows, not diyas | Diyas can read as religious. A lantern is neutral. |
| Food | Grass or hay (chara), banana (kela), carrot (gajar), grain (dana), honey (shahad) | All everyday. Meat is plain for tiger and lion only. |
| Homes | A straw-roof hut, a mud wallow pond (as in village ponds), a burrow, a tree, a cave | The hut should look charming and cosy, not poor. |
| Animals | The 14 in ANIMALS.md | All familiar. |
| Event | Moon Mela (a fair) | A secular, everyday kind of event. |

### 6.2 Flag for a teacher or parent review

| # | Item | Concern |
|---|---|---|
| T1 | "Mela" and the idea of a night fair | Secular, but check no regional or religious reading. |
| T2 | Jugnu / firefly | Are city children familiar with the word? Have a teacher check. |
| T3 | Lion napping in the afternoon | True (lions sleep much of the day), but check a teacher agrees it reads as "sleepy", not "lazy". |
| T4 | Elephant sending Bholu into the flowers | Elephants are revered and also work with people; ok as a funny "too strong"? (Matches Q5 in STORY_PUZZLES.md.) |
| T5 | Dog in a scene | Some families fear dogs; the dog is shown friendly and small. |
| T6 | Meat on the plate for the tiger | Show plainly, no blood. Check an emoji does not look too graphic at pixel size. |
| T7 | Bear and honey | The emoji is a brown bear; Indian sloth bears also love honey. Fine for now. |
| T8 | Hut | Should look like a cosy home, not a sign of poverty. |
| T9 | Name "Bholu" | A common affectionate nickname; also used for dogs in some places. Check for any unintended associations. |
| T10 | Elephant eating sugarcane would be more natural than banana | Only a suggestion for the Designer's food tray (see C4). |

---

## 7. The night and the town in the story

### 7.1 The idea
- The game is set on **one long evening, repeated**: each session is "tonight". Afternoon, dusk, night are the three scenes.
- Chhotu-Nagar starts dark. Each home the child builds gets a lantern and a lit window. Each snack plate lights a garden lantern. Each pulled truck delivers a lantern.
- High on the hill stands the **Moon Lantern**, the tallest and darkest thing in town.
- **Jugnu** is the little light that keeps blinking at the edge of the picture.

### 7.2 The child's ongoing goal, in plain words
"Help Bholu light up the whole town and find Jugnu."
- Not "complete levels", not "collect all".
- No time limit. The word "tonight" is a mood, not a clock.

### 7.3 The Jugnu thread across sessions
Nights mean **sessions**, not calendar days. Missing a day loses nothing. No streak, no guilt.

| Night (session) | At sunset, after the last scene | The child's act |
|---|---|---|
| 1 | One blink in the bush. Chiku: "Ooh, a little light!" It hides. | Tap where it was; it is gone. |
| 2 to 3 | Jugnu hides somewhere the child **built** tonight (the burrow, the feeder, in the guest's ear) | Find the glow and tap once |
| 4 to 5 | Jugnu follows Bholu along the road at dusk and waits just behind him | Tap once, then wait; it comes closer |
| 6 | Jugnu sits on the child's finger for a moment; a short chime | Be gentle |
| 7 | Jugnu flies up the hill and lights the **Moon Lantern**. Every resident the child has met walks up for the **Moon Mela**: each plays its trick (the poke reaction) on a stage; Bholu honks the finale. | Watch, and poke whoever you like |
| 8 and on | A second, far-off light blinks on another hill. Jugnu has a friend who is lost. | New thread, same pattern |

Notes:
- Where Jugnu hides is chosen from what the child **actually built that night**, so the thread feels like a response to the child, not a script.
- Jugnu appears only after the animals have tucked in (it is shy of crowds). That also gives the quiet end to the session.
- The "sealed crate rattles" hook in STORY_PUZZLES.md 4.3 stays. Order at sunset: windows light, then Jugnu, then the crate rattles last, as the "tomorrow" cue.

### 7.4 The mystery inside the scenes
The shadow in Snack Stakeout is a different mystery (a different guest every time). Jugnu is the slow mystery across nights; the shadow is the fast mystery within a night. They must look different: eyes in the bush are two round glowing eyes; Jugnu is a single moving point of light with no eyes until it trusts the child.

### 7.5 Residents without homes
They curl under the moon with a blanket and "zzz" (STORY_PUZZLES.md 7.4). Cosy, not sad. Next night the first Tuck-in guests are those animals, with a sleepy bubble. The framing in the picture is "a friend who is waiting for you", not "a sad animal outside". See risk N4.

---

## 8. Evidence check: known e-learning failures

| Failure | Could our story slide into it? | How the writing avoids it | Residual risk (honest) |
|---|---|---|---|
| **Quiz in a game skin** | Yes: 5 cards, 2 work, a tray reads as a multiple-choice question | The scene opens with a character's trouble, not a question. Each card runs a different clip. Funny misses are as good as solves. | **Medium.** A child may still treat the tray as "pick the right one". Test with the "is this right?" signal from STORY_PUZZLES.md 10.3. |
| **Points for correct answers** | Yes: lit windows and the Moon Lantern could become a score | No numbers, no stars. Lit windows are the visible result of what happened. Funny misses leave stickers. | **Medium.** Lanterns only light on solves. A child may pick cards "to get the light" (R3). Proposed: funny misses also get a small mark (C7). |
| **Lecturing voice-over** | Low | Zero explanations. Lines are 2 to 4 words. Chiku asks and never tells. | **Low.** Watch Bholu's "Thank you!" and "Hooray!" so they do not become praise. |
| **Punishing mistakes** | Yes: "Oh no!" could become a buzzer; sleeping animals outside could look sad | "Oh no!" only reacts to Bholu's own trouble. Misses get a giggle-honk. Animals outside are cosy. | **Medium.** A sensitive child may read "Oh no!" as "I got it wrong". Test it. |
| **Fake choices** | Yes: the lion and cat may be too obvious | Two cards solve in different ways; every card has a different clip; funny misses are worth choosing | **Medium.** Rotate the tray (R6 in the Designer's file). |
| **Reading-heavy text** | Low | No scene needs reading. Captions mirror speech and are not needed to play. Only one title board with a picture. | **Low.** Captions are for deaf and hard-of-hearing children and for muted play. |
| **Fun without understanding** (all chocolate) | Yes (Designer's R1) | The cause is visible in every scene (a drip, a stuck door, stones lighting). The same trait returns in a new place. | **High.** Still the biggest risk; can only be checked by watching children. |
| **Mascot as teacher** | Chiku could become Clippy | Chiku asks and is wrong sometimes (gets a mud hat). | **Low.** |
| **Hidden moral** (the lion is lazy, the cat is useless) | Yes | Each animal's trait is neutral: the lion naps (it is nap time), the cat washes (cats do that). No animal is shamed. | **Low to medium.** Teachers should read the table in 2.5. |
| **Guilt-based retention** | Yes: Jugnu, the sleepy friends, "one more?" | No streaks, nights are sessions not days, nothing is lost by staying away. | **Medium.** The "friend who is waiting" must not be sad. |
| **Cultural tokenism** | Yes | Everything from daily life: truck art, lanterns, mud ponds, chidiya. No costumes or festivals. | **Low.** Review in section 6. |
| **Over-scoping** | Yes: Jugnu, a Moon Mela, 13 lines, 13 sounds | Jugnu is canvas-drawn. Mela reuses poke reactions. | **Medium.** The Mela is a night-7 feature; cut it first. |
| **Adult-pleasing story** | Yes: we like the Panchatantra idea | Children get slapstick, sounds, a hiding light and a rattling crate | **Medium.** Watch if a child asks about Jugnu on their own. |

---

## 9. Conflicts and suggestions for the Game Designer

| # | Item | What I found | Suggestion |
|---|---|---|---|
| C1 | First line plays on arrival | Browsers block sound until a tap, so "Stuck!" and `app.tap_truck` cannot play at 0 s | Make the first tap land on Bholu, who then speaks. The first 3 seconds are visual. |
| C2 | "Too small!" / "Too big!" | They read as a verdict on the animal and explain what the Run already shows | Dropped. Use the visual cue (door, stones). |
| C3 | Owl in the `hide` need | Owls have mixed associations in India and can seem spooky | Use a rustling leaf or a frog ribbit instead. |
| C4 | Dog and cat never arrive in Snack Stakeout | The 6 foods (grass, banana, grain, carrot, honey, meat) do not reach them (`eats:meat` for dog is also doubtful for an Indian dog) | Add a 7th card "doodh" (milk) for cat and (later) a roti card for dog; optional sugarcane for elephant. |
| C5 | Free-order signposts versus time of day | The sky is afternoon, dusk, night; a child may choose Tuck-in first | Each scene has its own sky; the town hub darkens with scenes finished. Accept a small discontinuity. |
| C6 | The lion's nap sinks the truck | Keep it, but frame it as "nap time", not refusal | Lion yawns and purrs; Bholu laughs. |
| C7 | Only solves leave a mark | R3 in STORY_PUZZLES.md | Funny misses leave a small cosmetic mark in the town (a mud print on the signpost, a feather on the table). No count. |
| C8 | Sunset has two hooks (crate and Jugnu) | Too many cliffhangers at once | Windows, then Jugnu, then crate. If it feels busy, cut the crate. |
| C9 | Hooray on solves, giggle on misses | Hooray is a celebration; a verdict in disguise if only solves get it | Make giggle-honk equal in size to the cheer. |
| C10 | `day.done` = "Day done. Great job!" | "Great job" praises performance | Change to "What a night!" or keep with owner approval. |

---

## 10. Open questions for the product owner

| # | Question | Why it matters |
|---|---|---|
| N1 | Are we retiring the name "Animal Express"? It names the subject and the delivery mechanic. | Sets the first impression. |
| N2 | Do you accept Jugnu and a 7-night arc, ending with the Moon Mela? | Sets the cross-session hook and a late-stage feature. |
| N3 | Do Wonder Bubbles (Chiku's spoken facts) stay, or are they replaced by what the Run shows? | Chiku's character changes. |
| N4 | The "sleepy friend waiting" bubble at the start of a session: is it cosy enough, or could it feel like guilt? | Retention versus gentleness. |
| N5 | Is a trail of lit lanterns on the hill a "counter"? | STORY_PUZZLES Q11: no numbers. A visual path might still count as one. |
| N6 | Names: Chiku is a fruit and a nickname; Bholu is common. Happy with both? | Local flavour versus clashes. |
| N7 | Do we want a single human presence (a lantern-keeper) later? I left humans out to avoid gender, class and skin cues. | World richness versus inclusiveness. |
| N8 | Can the owner record both Bholu and Chiku and keep them distinct (Bholu bright, Chiku whispered)? | Voice cost. |
| N9 | Hindi version: "Arre!" as Bholu's catchphrase instead of "Oh no!"? | Translation plan. |
| N10 | May the Moon Mela be the end of the first arc, or should the story never end? | Scope and commitment. |

---

## Summary of numbers
- New voice lines: **13** (9 core, 4 droppable). Existing: 51. New total: **64** at most, **60** at least. If the 9 verdict-style lines retire: **55** to **51**.
- New caption keys for sounds: **13**.
- New characters: **1** (Jugnu, canvas-drawn, no voice).
- New art: Jugnu glow, lanterns, a title board. No new emoji sprites required.
