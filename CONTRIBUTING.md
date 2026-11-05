# Contributing

Most contributions are data, not code. Start with `docs/CONTENT_GUIDE.md`.

1. Edit JSON in `src/data/` or `src/locales/`. Do not add animal-specific code.
2. Run `npm run validate` and `npm test`. Both must pass.
3. New sounds need a row in `sounds/SOURCES.csv` with a licence we can use (no CC-BY-NC). Run `npm run check:sources`.
4. New text for children: short, kind, true everywhere. Wonder facts are at most 8 words and about what an animal does. A teacher should review them.
5. No tracking, no ads, no network calls, no analytics. Nothing leaves the device.
6. Keep pull requests small and say what a child will see or hear differently.

Child safety: no gags that mock an animal, no scary content, no personal data. If unsure, ask first.
