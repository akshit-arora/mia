# Milestone 1 animal list (14)

Content for **Animal Express**: the intro plus levels 3 to 8 (levels 1, 2 and 5 are single-target replay pools). Everything here is a draft for teacher review. Facts are written to be true everywhere and are about what an animal **does**.

Lens for this chapter: "where does it live?" Zones: **J** = Jungle (wild), **F** = Farm (domestic), **H** = Home (pets).

## 1. Animals, zones and emoji

| # | id | Animal | Emoji (codepoint) | Zone | Accepts | Appears from |
|---|---|---|---|---|---|---|
| 1 | lion | Lion | 🦁 U+1F981 (face only) | J | J | Intro (first crate) |
| 2 | tiger | Tiger | 🐅 U+1F405 (body) | J | J | Level 2 |
| 3 | elephant | Elephant | 🐘 U+1F418 (body) | J | J (also F in Milestone 2) | New-arrival guest, level 8 |
| 4 | monkey | Monkey | 🐒 U+1F412 (body) | J | J | Level 2 |
| 5 | bear | Bear | 🐻 U+1F43B (face only) | J | J | Level 4 |
| 6 | peacock | Peacock | 🦚 U+1F99A (body) | J | J | Level 4 |
| 7 | cow | Cow | 🐄 U+1F404 (body) | F | **F only** | Intro (second crate) |
| 8 | buffalo | Buffalo | 🐃 U+1F403 (body) | F | F | Level 4 |
| 9 | goat | Goat | 🐐 U+1F410 (body) | F | F | Level 1 pool |
| 10 | hen | Hen | 🐔 U+1F414 | F | F (check double-yes vs book, level 11) | Level 1 pool |
| 11 | horse | Horse | 🐎 U+1F40E (body) | F | F | New-arrival guest, level 8 |
| 12 | dog | Dog | 🐕 U+1F415 (body) | H | H (and F from level 10) | Intro (third crate) |
| 13 | cat | Cat | 🐈 U+1F408 (body) | H | H | Level 5 |
| 14 | rabbit | Rabbit | 🐇 U+1F407 (body) | H | H | Level 5 |

Notes:
- Codepoints are from memory; verify at bake time. The art is baked into the atlas at build time from one emoji set, so old phones' system emoji support does not matter.
- **Face-only emoji** (lion, bear) are the weakest at 24 px; they are the first candidates for hand-pixelled replacements.
- **Cat vs tiger** look alike at small size. The prototype (Milestone 0) must check stripes and silhouette.
- Peacock and elephant are good Indian-context anchors. Bear is a brown bear in emoji; a sloth bear would need custom art later.
- Horse and elephant are held back as occasional guests in later levels, so there is still a surprise.

## 2. Sounds and captions

| id | Sound | Caption text (`cc.animal.<id>`) | Source plan |
|---|---|---|---|
| lion | Roar | Lion roars | Freesound CC0, or own recording |
| tiger | Growl | Tiger growls | Freesound CC0 |
| elephant | Trumpet | Elephant trumpets | Freesound CC0 |
| monkey | Chatter | Monkey chatters | Freesound CC0 |
| bear | Growl | Bear growls | Freesound CC0 (differ clearly from tiger) |
| peacock | Call | Peacock calls | Freesound CC0 (check, bird recordings are often NC) |
| cow | Moo | Cow moos | Freesound CC0, or children imitating |
| buffalo | Low grunt | Buffalo grunts | Freesound CC0 |
| goat | Bleat | Goat bleats | Freesound CC0 |
| hen | Cluck | Hen clucks | Freesound CC0 |
| horse | Neigh | Horse neighs | Freesound CC0 |
| dog | Bark | Dog barks | Freesound CC0 |
| cat | Meow | Cat meows | Freesound CC0 |
| rabbit | Hop and nibble | Rabbit hops | **Synthesized** (rabbits are nearly silent) |

Each clip is trimmed to 0.5 to 0.8 seconds, loudness-matched and recorded in `sounds/SOURCES.csv` (id, URL, author, licence, date checked, processing). Anything not CC0 or CC-BY is rejected.

## 3. Level pools (Milestone 1)

| Level | Targets | Pool |
|---|---|---|
| Intro (levels 1, 2, 5 compressed) | J, then F, then H | lion, cow, dog |
| 1 (replay pool) | F | cow, hen, goat |
| 2 (replay pool) | J | lion, monkey, tiger |
| 3 | F, J | cow, lion, hen, tiger |
| 4 | F, J | goat, monkey, buffalo, bear, hen, peacock |
| 5 (replay pool) | H | dog, cat, rabbit |
| 6 | H, J | dog, lion, cat, tiger, monkey |
| 7 | F, J, H | dog, cow, lion, cat, hen, tiger |
| 8 | F, J, H | ten animals from the above, plus elephant and horse as guests |

## 4. Poke reactions (one tap reaction per animal)

| Animal | Reaction |
|---|---|
| lion | Big yawn, shakes its mane |
| tiger | Stretches, tail flick |
| elephant | Sprays water from its trunk |
| monkey | Scratches its head, swings a little |
| bear | Rubs its back on a tree |
| peacock | Fans its feathers |
| cow | Swishes its tail, chews |
| buffalo | Rolls in a puddle |
| goat | Hops, nibbles a leaf |
| hen | Lays an egg, pecks at the ground |
| horse | Trots on the spot |
| dog | Fetches a stick |
| cat | Licks its paw |
| rabbit | Nibbles a carrot |

## 5. Wonder Bubbles (6 animals, teacher review required)

Rules: one fact per visit, at most 8 words, shown through an action first, never gated or scored.

| Animal | Chiku's question | Action on tap | Spoken fact (`fact.<id>.*`) |
|---|---|---|---|
| elephant | What can that nose do? | Picks up a ball | Trunk is like a hand! |
| monkey | What is it holding? | Peels a banana | Monkeys peel their bananas! |
| peacock | What is behind it? | Opens its feathers | It spreads its feathers like a fan! |
| goat | Can it climb that rock? | Hops up a rock | Goats are great climbers! |
| hen | What is under there? | A chick hatches | Hens keep chicks warm! |
| cat | Listen closely... | Purr sound, closes its eyes | Cats purr when they are happy! |

## 6. Checks before building

- [ ] A teacher reviews zones, the cow = Farm decision and each Wonder fact.
- [ ] Check the book's wording for wild, domestic and pet before adding the dog's "Home or Farm" answer (level 10), and before hen and goat double-yes (level 11).
- [ ] Prototype 6 baked animals (lion, tiger, cat, cow, elephant, peacock) at 24 and 32 px.
- [ ] Source and license-check all 13 recorded animal sounds.
