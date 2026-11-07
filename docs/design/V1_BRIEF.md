# V1 Brief — Jungle + Buddies

Status: v1, 2026-11-07. Scope contract; rationale in `REDESIGN.md`. Not listed here = not in v1.

## Promise

**A six-year-old picks an animal friend, brings it the right food because of what its body tells them, and the trail plays differently depending on which friend came along.**

## In scope

| Area | Ships |
|---|---|
| Animals | 4 jungle friends, visible and waiting, never a crate: Balu/bear–honey, Bunty/monkey–fruit, Gajju/elephant–sugarcane, Neelu/peacock–seeds |
| Loop | Ask → food → trail → meet → card → shelf, ~90 s. Basket holds 5, trail offers 6 — leaving something is a decision, never a penalty |
| Food behaviours | Honey sticky, fruit bounces, sugarcane heavy, seeds scatter |
| Buddies | Pick 1 before a trail. Gajju trunk (high shortcut), Bunty climb (vine shortcut). 1 badge + 1 secret; no card levels |
| Build | One biome, day + rain. Flat vector per `ART_BIBLE.md`, fixed 240×135, letterboxed. Captions for every sound |

## Out of scope (cut, not "later this pass")

Farm and House (doors "coming soon", not playable) · Card clash · "?" stories · card levels 2–4, babies · night variant, second biome, 14 animals · **giraffe and every non-jungle animal** (must stay unseen for the transfer test) · pixel art, new emoji baking · recorded voice, music, rename, parent dashboard.

## Acceptance criteria

Watch a child do these. If it needs explaining, it failed.

1. **Starts alone.** No adult words; the basket moves within 10 s. No glow, arrow or hand after run one.
2. **Picks a buddy** with one tap before the trail, and can point to who came. The same trail with a different buddy plays differently — a new route or a secret — and they name what the buddy did.
3. **Food choice is visible.** Picking one of three foods changes the trail — honey drags with bees, fruit bounces and must be chased — and the child reacts.
4. **Chooses what to carry.** Fills the basket to 5 with a 6th thing on screen, leaves it, and is not punished or slowed.
5. **A mistake is funny.** Bumps or spills, laughs or shrugs, keeps playing. No fail screen, timer or lost card.
6. **Feeds the friend** in one input; the body explains (trunk up the branch, teeth on the meal); the card stamps in ~3 s.
7. **New animal transfer test.** A giraffe — unseen, not in the game — with three foods: they choose the high leaves and point at the neck or give a reason. Inference, not recall. Never ask "what does a bear eat?"
8. **No waiting for the glow.** Hints off after run one: nobody waits >10 s for a light-up, nobody only touches the highlight. If they do, the game is still doing the thinking — a fail, not a difficulty setting.
9. **Asks for one more** at the 8-minute mark, when told they may stop.

## Risks

| Risk | Mitigation |
|---|---|
| **Scope creep** — Farm, House, clash, "one more animal" land mid-build | This page is the contract. New ideas go to the deferred list with a date. A step starts only when the last one is playable. |
| **Art without an artist** — timid vector reads as clip art | `ART_BIBLE.md` is the rule: ≤6 colours per sprite, one outline, one shadow, no gradients. 4 animals × 2 poses, silhouettes readable at 24 px. Judge at arm's length on the phone, not at 4×. |
| **240×135 softness** — fractional scaling blurs; today's canvas varies 240–300, so composition is accidental | Lock 240×135, letterbox, integer scale, nearest-neighbour, whole-pixel positions, 8 px margin. Verify on the target phone at 1× and 2×. |
| **Buddy soft-locks a run** — a Gajju gate strands a child who brought Balu | Every trail completes with **no buddy**; abilities open optional shortcuts/badges only. A null-buddy completion test in `npm test` fails CI if a gate becomes required. |
| **Accessibility / reading** — icons can be ambiguous; one thumb, tremor, old phone | Zero words needed to play; every choice = icon + sound + caption. 48 px targets, tap-a-lane, reduced motion, captions on. |

## Build order and cut line

Each step ends playable, not on a branch.

1. Friend-first + capacity + food behaviours (bear, one trail)
2. Meet + 3-second card stamp
3. Buddy pick + 2 abilities + optional shortcut
4. Animals 2 and 3, second behaviour, rain variant
5. Art pass: palette, fixed 240×135, flat vector, silhouettes
6. Badge + secret + captions + sfx + phone test

**Must ship:** steps 1–3, 5, captions, 3 animals. Four things only: a food choice that changes play, a basket that makes you choose, a friend you feed by hand, a buddy that changes the route — in one confident style.

**Deferred if time runs out:** 4th animal (peacock/seeds), rain variant, bear sniff, peacock fan, second badge, secret #2, recorded voice, shelf polish.

## Playtest metrics — 5 children, 6–7, 10 min, no help

| Measure | Pass |
|---|---|
| First action, unassisted | 5/5 within 10 s |
| Runs completed | 4/5 play 3+ runs |
| **Giraffe transfer** | 3/5 choose high food and give a reason |
| **No waiting for the glow** | 0/5 wait >10 s; 0/5 only touch the highlight |
| Buddy noticed | 3/5 name or point to what their buddy did |
| Asks for one more | 3/5 |
| Help needed | 0/5 ask "what do I do?" twice; 0 adult interventions |
| Recovers from a mistake | 5/5 keep playing after a bump |

Stop rule: if 2+ children wait for a glow, or play one run and wander, stop adding content. Remove hints, add a real choice. Do not fix it with art.
