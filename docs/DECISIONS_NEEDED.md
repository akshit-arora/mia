# Decisions needed

Only open questions where the answer changes the plan. Each has a default that proceeds if there is no answer. Reply with the id and a letter.

## N1. Project name
- **Options:** (A) keep "Animal Express" for the game and decide the umbrella name later; (B) pick a final umbrella name now; (C) another name for the game.
- **Recommendation:** A. The umbrella app will hold many chapters, so name it later, but the repo slug and icon need something now.
- **Default:** A, repo slug `animal-express`. Changing later costs a rename plus icons; recorded audio is unaffected (no game name is spoken).
- **Needed by:** before H12 (repo creation).

## N2. Licence
- **Options:** (A) code MIT, content CC BY-SA 4.0; (B) code Apache-2.0, content CC BY-SA 4.0; (C) both under CC0 or another content licence.
- **Recommendation:** A. Simple for contributors; Apache-2.0 only adds patent language you are unlikely to need.
- **Default:** A.
- **Needed by:** before the first push (H12).

## N3. D12 micro-engine vs Kaplay or Phaser
- **Options:** (A) own plain-canvas engine; (B) a library.
- **Recommendation:** A if the M0 size and phone test pass.
- **Default:** A. If the engine exceeds about 25 KB gzipped or drag is janky on the test phone, the Orchestrator reports and waits.
- **Needed by:** end of Milestone 0 (M0-10).

## N4. D13 sound licences
- **Options:** (A) CC0 preferred, CC-BY accepted with credit, never non-commercial; (B) CC0 only.
- **Recommendation:** A. CC0 only may leave peacock and buffalo unfillable.
- **Default:** A.
- **Needed by:** before H7.

## N5. D14 pets zone "Home", later game "Nest Lane"
- **Options:** (A) as proposed; (B) rename the pets zone to something else (for example "House").
- **Recommendation:** A. It matches `zone.home` in RECORDING_SCRIPT.md, so no re-recording.
- **Default:** A. Changing after recording means re-recording one line and updating captions.
- **Needed by:** before H9 (recording).

## N6. D15 Wonder Bubbles replace a "?" button
- **Options:** (A) bubbles, about 1 drop in 3; (B) both a bubble and a button.
- **Recommendation:** A. A button invites the child to look it up like a lesson.
- **Default:** A. Bubbles ship behind a flag until the teacher review (H6) is yes.
- **Needed by:** start of L-07.

## N7. Emoji art set
- **Options:** (A) OpenMoji (CC BY-SA 4.0, built-in outlines); (B) Twemoji (CC-BY 4.0, no outline).
- **Recommendation:** decide from the M0 contact sheet; both are tested.
- **Default:** whichever is more recognisable at 24 px; on a tie, A. Both licences fit the plan's CC BY-SA art folder.
- **Needed by:** M0-10.

## N8. Device floor
- **Options:** (A) Android 5 and Chrome 60, 2 GB or less; (B) raise to Chrome 80 or later if the test phone struggles.
- **Recommendation:** A, but set from what the test phone proves, not what the plan says.
- **Default:** A; Orchestrator reports any feature that needs a higher floor.
- **Needed by:** M0-10.

## N9. Who is the reviewing teacher
- **Options:** (A) a named teacher you know; (B) you review it yourself against the book; (C) skip review for the playtest build only.
- **Recommendation:** A. A teacher's name also strengthens the credits.
- **Default:** C: Wonder Bubbles stay off, the zone list ships as "draft" in the playtest build only, and no public release until a teacher says yes.
- **Needed by:** before recording the 6 fact lines.

## N10. Repo visibility and timing
- **Options:** (A) public from the first push; (B) private until M1 playtest passes, then public.
- **Recommendation:** B only if the free tier allows Pages on a private repo; otherwise A. Nothing in the repo is sensitive (no child data, no accounts).
- **Default:** the Orchestrator works locally and pushes nothing; the owner chooses at H12.
- **Needed by:** H12.

## N11. Playtest ground rules
- **Options:** (A) in person, parent present, notes only, no photos or audio of the child; (B) screen recording of the phone only.
- **Recommendation:** A. The plan promises "nothing about the child leaves the device"; do not break the spirit in research.
- **Default:** A.
- **Needed by:** before H15.
