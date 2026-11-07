# ART BIBLE — flat vector storybook

v1, 2026-11-07. Direction: **flat vector** (REDESIGN §8B). One language for world, cards and UI. No artist:
every rule must be executable in canvas at 240×135.

## 1. Palette

**22 tokens.** A sprite uses **≤6**; a scene band **≤8**; a screen **≤14**. Nothing else may be invented.

| Token | Hex | Use |
|---|---|---|
| INK | `#181020` | all contours, body text |
| INK_SOFT | `#3A2E4A` | inner lines, plate shadow |
| PAPER | `#FFF6E5` | plates, captions, eye white |
| WHITE | `#FFFFFF` | eye glint, ≤6 px² |
| NIGHT | `#1B2545` | page, night sky |
| SKY | `#86D7F2` | day sky |
| SKY_RAIN | `#7E9BB0` | rain sky |
| WATER | `#3FA9D9` | river, puddle |
| SUN | `#FFC93C` | sun, badge, firefly |
| LEAF_D | `#1E7A46` | far canopy, shade |
| LEAF | `#2FA85A` | shelf 1, mid canopy |
| LEAF_L | `#7BD389` | verge, lit plane |
| BARK | `#8B5A2B` | trunk, wood |
| BARK_D | `#5A3A22` | trunk shade, shelf |
| DIRT | `#D9A45B` | path |
| DIRT_D | `#B07A3F` | path edge, ground shadow |
| SAND | `#F0C987` | clearing, path centre |
| CORAL | `#E8654A` | food, meet accent |
| BERRY | `#B23A6B` | house depth, stamp |
| FARM | `#E8A33B` | shelf 2 |
| HOUSE | `#E8699A` | shelf 3 |

Cards are PAPER with a 2 px shelf-accent edge. **No tints, no pastels.**
**Forbidden:** gradients (canvas or conic CSS), `globalAlpha`, `shadowBlur`, CSS `filter`/`box-shadow`,
pure `#000`, greys, noise, dither, a second highlight. Shadows are solid tokens, never black or alpha.

## 2. Line and shape

| Item | Rule |
|---|---|
| Contour | **2 logical px** at ≥24 px tall, **1.5 px** below (4 / 3 px at 64 source) |
| Inner line | 1 px, only where limbs overlap; never on a face |
| Radii | 2 px icon, 4 px prop, 6 px plate. **No 999 px pills in-world** |
| Shadow | Hard `(+2,+3)` logical px, 0 blur, darker surface token, max 3 px |
| Silhouette | One mass, ≤3 protrusions, reads at 32 px and greyscale |
| Anchoring | y snaps to 0.5 px; integer scale only (0.9 / 1.0 / 1.12); no rotation |

## 3. Escaping the low-res look

The cause is not 240×135; it is **32 px sources drawn at 36–48 px** nearest-neighbour, then CSS `pixelated`.

Do this (already half-applied in the working tree — keep it):
1. Bake **64 px cells** from a 512 px raster, premultiplied alpha, Lanczos-3 to 64.
2. Snap to the 22-colour palette **after** downscale: kills emoji gloss and drift; the browser's bilinear
   downscale to 24–44 px supplies the antialiasing.
3. Stamp the contour **after** the snap by alpha dilation. No 1 px auto-outline.
4. `image-rendering:auto`; `imageSmoothingEnabled = true`, quality `high`, everywhere.

**Measured:** 64 px / 32-colour atlas = 11.9 KB raw and gzip (PNG barely compresses further); the 32 px
atlas was 3.6 KB, so **+8.3 KB**. Card atlas ≈7.1 KB. Art ≈19 KB of the **40 KB** budget, ~21 KB spare.
A 22-colour snap should land 9–12 KB. **No 96 px:** ~25–30 KB for no gain at a 40 px display size.

**Limit of 240×135:** lanes 33 px apart, animals 36–40 px, sub-2-px detail invisible. One logical px is
4–6 device px on a phone, so a 2 px line reads 8–12 device px. **Keep 240×135 for v1**, fix `W` at 240 and
letterbox instead of reflowing 240–300. 320×180 buys +78 % area but a day of lane retuning: later.

## 4. Animal and food sprites

- Cell 64×64, 4 px margin, base line **y=58**, eye line **y=26 ±2**, facing **right**.
- **Normalise silhouette height, not emoji bounds:** land 52–56 px, birds 44, elephant 58. This stops "stickers".
- Same top-left light, one shade per fill (−18 % lightness), highlight only on head/top plane.
- Same 4 px INK contour, round joins, no gaps; contact shadow ellipse 60 % wide, 3 px, +2 y, band token.
- Food: object 44–52 px, centred, no plate, no shadow, reads at 20 px. Delete details the snap destroys.

## 5. Jungle scenery

Five flat bands with hard edges, using `FAR_H 60 / GND_H 108`.

| Layer | y | Content |
|---|---|---|
| Sky | 0–38 | `SKY`; `SUN` disc + WHITE notch; 2 PAPER cloud slabs |
| Far canopy | 22–60 | `LEAF_D` silhouette, parallax 0.25× |
| Mid canopy | 40–68 | `LEAF` + `LEAF_D` underside, `BARK` trunks, 0.5× |
| Ground | 30–135 | `LEAF_L` verge 8 px, `LEAF_D` edge 2 px, `DIRT` field |
| Path | 39–135 | `DIRT`, `SAND` centre 3 px, `DIRT_D` edges 2 px, ≤4 pebbles |

Props keep one contour and one shadow; integer y, 0.5 px x.
**Rain:** `SKY→SKY_RAIN`, leaves/ground −8 % value, path `DIRT_D`; 8×8 tile of three 1 px PAPER diagonals;
flat `WATER` puddles with a 1 px PAPER lip. **Night:** `SKY→NIGHT`, canopy → INK, ground −30 % value, sun →
fireflies (2 px SUN + 4 px SUN ring). Variants are **palette maps at bake/load**: zero bytes.

## 6. UI

Canvas plates are the game's voice; DOM carries words and access. Keep DOM for captions (`#cc`), `aria-live`,
focus, the parent panel and every hit area.

- Plate: PAPER, INK 2 px, radius 6, hard `(+2,+2)` INK_SOFT. One shape for name, badge, button.
- Type: system-ui 700 only (Devanagari). Logical 8 / 9 / 12 / 14; DOM 13 / 16 / 22 px.
- Buttons: 36 px paper disc, 2 px border, 18 px glyph; pressed `translate(1,1)`, shadow removed.
- Hit areas ≥56×56 device px; one hint maximum. No 999 px radius, 3 px borders, conic progress ring
  (use 4 stepped segments) or soft shadows: no element may use a radius, weight, shadow or hue outside this page.

## 7. Motion

| Event | ms | Rule |
|---|---|---|
| Micro | 90 | easeOut, no overshoot |
| Pickup | 55 hitstop + 140 | 1.12 → 1.0 scale, +1 px pop |
| Bump | 90 hitstop + 160 | 2 px shake, 3 oscillations, 20 Hz |
| Anticipation | 70 | squash 0.92 x, +1 y |
| Action | 100 | stretch 1.08 x, −3 y |
| Settle | 140 | one overshoot ≤3 % |
| Meet / stamp | 140 drop −8 y, 60 squash, 100 settle | hold 900 |
| Idle bob | 1200 loop | ±1 px |
| Particles | 380 life, max 5, 3×3 px | spawn 4, 40–70 px/s, gravity 140 |
| Shake | 2 px / 110; 3 px / 160 at meet | never on UI |

Tween at 30 fps (33 ms), hold poses 80 ms, max 8 tweens. Reduced motion: 60 ms cap, no shake or particles,
one PAPER flash 80 ms.

## 8. Pre-flight checklist

1. On-palette, ≤6 per sprite. 2. Contour 4 px at 64 source, no gaps. 3. Reads at 32 px and greyscale.
4. Base 58, eye 26, faces right. 5. Height 52–56 / 44 / 58. 6. One shade, one highlight, top-left.
7. Hard shadow ≤3 px, band token. 8. No gradient, alpha, blur, dither, black. 9. 64 px source, 24–44 display,
smoothing on. 10. Matches the nearest sprite. 11. Food reads at 20 px. 12. `npm run bake && npm run size`
inside 40 KB.

**Next:** measure the 22-colour bake, then rebuild `farLayer`/`groundLayer` as flat bands before new content.
