# Credits

Scaffold. The lead fills the exact text; items marked TODO-VERIFY must be checked against the source before release.

## Emoji art: Twemoji
- Graphics: Twemoji, Copyright 2020 Twitter, Inc and other contributors (maintained by jdecked), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
- Packaged through the npm package `@twemoji/svg` 15.0.0 (wrapper licence MIT, Samuel Kopp). The package ships no CC BY text, so the graphics licence is taken from upstream knowledge. TODO-VERIFY: check the exact copyright line against upstream LICENSE-GRAPHICS before release.
- Changes: the art is downscaled to 32x32, colour-quantised to a shared palette, outlined and packed into one atlas by `tools/bake-emoji.mjs`.

## Stage 3 art
The Card clash pictures (crossed-cards button, phone and friends menu pictures, padlock, pointing hand, card faces and backs) are drawn in code by this project (`src/games/trump/art.ts`); no new third-party art was added. Twemoji (CC BY 4.0, above) still provides the animal, food, home and sparkle pictures.

## Sounds
Every sound is listed with source, author and licence in `sounds/SOURCES.csv`. `npm run check:sources` rejects rows without a usable licence.

## Voice
Spoken names and phrases: recorded by the project owner (own voice). Recording pending. Other languages are recorded by teachers and relatives using the recording booth (`tools/booth/recording-booth.html`); list contributors here with permission.

## Fonts
None. The app uses system fonts only.

## Development tooling
TypeScript, Vite, vite-plugin-pwa (Workbox), Vitest. Each under its own open-source licence; see `package-lock.json`.
