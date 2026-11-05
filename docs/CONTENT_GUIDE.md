# New pack in 30 minutes

You only edit JSON and record sounds. No code. After each step run `npm run validate`.

## Add an entity (`src/data/entities.json`)
```json
{ "id": "zebra", "nameKey": "name.zebra", "emoji": "1f993", "tags": ["wild"],
  "relations": { "livesAt": ["jungle"] }, "accepts": ["jungle"],
  "sound": "animal.zebra", "captionKey": "cc.animal.zebra", "poke": "stretch" }
```
- `emoji` is the lowercase hex codepoint. Run `npm run bake` to add it to the art atlas.
- `accepts` is the strict list of zones where a drop is allowed and must not be empty. `acceptsAlso` is for later levels.
- `poke` must be a reaction implemented in `src/game/reactions.ts`.
- Special rules are data: `"noGag": true` skips the wrong-drop reaction (the cow uses it).
- Add the keys to `src/locales/en.json`: `name.zebra`, `cc.animal.zebra`.

## Add a level (`src/data/levels.json`)
Copy a level and change only generic fields: `id`, unique `order`, `prereq` (an existing level id or `null`), `targets` (zone ids), `itemQuery.pool` / `guests`, `count`, `distractors`, `accept`, `reveal`, `pace`. Unknown keys are rejected.
Every pool entity must be accepted by at least one target, or the validator calls the level unwinnable. Reuse `promptId` keys that exist in `en.json`.

## Add a zone (`src/data/zones.json`)
`id`, `nameKey` (`zone.xyz` in en.json) and a `theme` palette slot.

## Add a language (Hindi stub as the model)
1. Copy `src/locales/hi.json` to `src/locales/<code>.json` and set `_meta` (`name`, `dir`, `reviewed: false`).
2. Translate any keys; leave the rest out. Missing keys fall back to English (the validator only warns).
3. Never add a key that is not in `en.json`; that is an error.
4. Record the voice in the booth (`tools/booth/recording-booth.html`, open via `npm run dev` or https), then `npm run audio:pack`.

## Add an audio key
Audio keys equal locale keys (`name.zebra`, `animal.zebra`, `fact.zebra.stripes`). Put the file in the recording list, add a row to `sounds/SOURCES.csv` with author and licence (CC0, CC BY or CC BY-SA only; no NC), then `npm run audio:pack` and `npm run check:sources`.

## Add a Wonder fact
On an entity add:
```json
"wonder": { "questionKey": "wonder.q.zebra", "action": "ball", "factKey": "fact.zebra.stripes" }
```
Rules (PLAN 4.6): the fact is at most 8 words, about what the animal does, true everywhere. The question is text only and visual. A teacher should review it. Add both keys to `en.json`.

## Before you open a pull request
`npm run validate && npm test && npm run build && npm run size`
