# Sounds

Source recordings live here. They are **inputs** to `npm run audio:pack`; only the packed `public/audio/**` files ship.

- `animals/<id>.(wav|ogg|mp3|flac)`: one short clip per animal, trimmed to about 0.5 to 0.8 s.
- `sfx/`: reserved for any recorded effect (all current effects are synthesized in code).
- `SOURCES.csv`: **every file in `animals/` and `sfx/` needs a row.** `npm run check:sources` fails otherwise.

Columns: `id,file,url,author,licence,date_checked,processing`

- `file` is relative to this folder, for example `animals/lion.wav`.
- `licence` must be exactly one of `CC0`, `CC-BY-4.0`, `CC-BY-3.0`, `CC-BY-2.0`, `own` (your own recording).
- Anything NonCommercial (NC) or NoDerivatives (ND) is rejected, always.
- For CC-BY, keep the author and URL so credit can be shown in the app credits.

## Planned animal clips (guidance, not rows)

Filename is the animal id. Until a file exists the game plays a synthesized placeholder.

| id | Sound wanted | Note |
|---|---|---|
| lion | Roar | |
| tiger | Growl | sharper and higher than bear |
| elephant | Trumpet | |
| monkey | Chatter | |
| bear | Growl | low and slow, clearly unlike tiger |
| peacock | Call | bird recordings are often NC, check the licence |
| cow | Moo | |
| buffalo | Low grunt | |
| goat | Bleat | |
| hen | Cluck | |
| horse | Neigh | |
| dog | Bark | |
| cat | Meow | |
| rabbit | (none) | synthesized hop and nibble, do not source a clip |

## Voice recordings

Voice lines are not stored here. Record with `tools/booth/recording-booth.html`, unzip into `recordings/<locale>/`, then run `npm run audio:pack`.
