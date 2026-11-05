# Human tasks (product owner only)

Sorted by what blocks what. Times are rough. "Why not an agent" is the reason a person must do it. Backlog ids link to BACKLOG.md.

## Recommended order at a glance

1. **Now (30 min total, unblocks the build):** H1, H2, H3
2. **This week (needs a phone and a teacher):** H4, H5, H6
3. **While the agents build (parallel, slow, start early):** H7, H11
4. **After teacher says yes and audio pipeline exists:** H9, H10
5. **Outward-facing:** H12
6. **Before release:** H13, H14, H15, H17
7. **Milestone 2:** H8, H16
8. **Optional:** H18

---

## Phase 1: Unblock the prototype

### H1. Name and licence (15 min)
- **Do:** Answer N1 and N2 in DECISIONS_NEEDED.md (or accept the defaults).
- **Why not an agent:** it is the owner's identity and legal choice.
- **Unblocks:** F-05, F-07, A-06 (icons use the name), repo URL.

### H2. Record 5 sample lines (20 min)
- **Do:** `app.tap_truck`, `name.lion`, `crate.open`, `correct.1`, `wrong.gentle`. Follow RECORDING_SCRIPT.md section 3. One take each is enough for the test.
- **Why not an agent:** it is your voice (D10).
- **Unblocks:** M0-08 (does the voice work on a phone speaker), early size figures.

### H3. Review the emoji contact sheet (10 min)
- **Do:** Look at the 6 baked animals at 24 and 32 px. Say which are not recognisable, especially cat vs tiger, lion and bear faces. Pick the emoji set.
- **Why not an agent:** an agent cannot judge whether a child would recognise it.
- **Unblocks:** M0-10, A-01, A-02.
- **Needs:** M0-02 done.

### H4. Test on a real old, low-end Android phone (45 min)
- **Do:** Open the test page from the local network on the oldest cheap Android you can borrow (ideally 2 GB RAM or less). Check: does it load, is the drag smooth, is the truck and crate big enough, can you hear the sample lines on the speaker. Note model, Android version, Chrome version.
- **Why not an agent:** needs physical hardware and human ears. Emulators lie about touch and speakers.
- **Unblocks:** D12 (engine), the device floor, bitrate choice, the whole size budget.
- **Needs:** M0-05, M0-06, H2.

### H5. Confirm D12 and the device floor (5 min)
- **Do:** Answer after the M0 report.
- **Unblocks:** the entire build (F-01 onward).

---

## Phase 2: Content gate

### H6. Teacher review (about 1 hour of a teacher's time, plus finding one)
- **Do:** Give a primary teacher ANIMALS.md. Ask them to confirm: (a) the zones (Jungle, Farm, Home) for all 14 animals; (b) cow = Farm only; (c) each of the 6 Wonder facts is true and clear to a 6 year old; (d) the book's wording for wild, domestic and pet (this also feeds H8).
- **Why not an agent:** professional judgement and accountability for what children are told.
- **Unblocks:** recording of the 6 `fact.*` lines, shipping Wonder Bubbles, level 10 and 11 answers, content freeze (C-06).
- **Fallback:** facts stay behind a feature flag and ship off.

### H7. Source and licence-check 13 animal sounds (3 to 4 hours, can be split)
- **Do:** Find one short clip per animal (not rabbit). Prefer CC0. Record in `sounds/SOURCES.csv`: URL, author, licence, date checked. Reject any non-commercial licence. Watch peacock and other bird recordings, they are often NC. Lion may be your own recording.
- **Why not an agent:** needs a site account, a manual download and a human reading each licence page. Agents must not create accounts or download unreviewed files, and a wrong licence would contaminate the repo.
- **Unblocks:** U-06, the core audio pack, the CI gate.
- **Tip:** an agent can prepare a shortlist and the empty CSV first (U-05) if you allow web search.

---

## Phase 3: Voice

### H9. Record the 51 English lines (2 sessions of about 30 min, plus retakes)
- **Do:** Follow RECORDING_SCRIPT.md. 3 takes each, file name equals key. Record all 14 names in one sitting. Record the 6 facts only after H6.
- **Why not an agent:** it is your voice; the plan forbids synthetic voices with restrictive licences.
- **Unblocks:** U-08, captions text freeze, the English voice in M1.
- **Tip:** the 39 non-fact lines can be recorded before teacher review, so do not wait for H6.

### H10. Pick takes and approve audio on a phone speaker (45 min)
- **Do:** Listen to the processed lines on a cheap phone speaker. Pick the best takes. Flag any line that sounds disappointed (`wrong.*`) or too similar (Bholu vs Chiku).
- **Why not an agent:** an agent cannot hear tone.
- **Unblocks:** release audio, U-08.

---

## Phase 4: Publish

### H12. Create the GitHub repo, enable Pages and push (30 min)
- **Do:** Create the repository, set Settings > Pages > Source to GitHub Actions, push. The Orchestrator supplies exact commands and a checklist. Add a contact address for the code of conduct and child-safety policy.
- **Why not an agent:** outward-facing and public; needs your account and explicit approval. Agents do not push without the owner's yes.
- **Unblocks:** F-08, installing from a real URL, CI, the real-phone tests in H13.
- **Note:** GitHub Pages on a private repo may need a paid plan; a public repo is free.

### H11. Confirm D13, D14, D15 (10 min)
- **Do:** Answer in DECISIONS_NEEDED.md or accept defaults.
- **Unblocks:** sound sourcing rules, zone naming in all strings, Wonder Bubbles scope.

---

## Phase 5: Before releasing Milestone 1

### H13. Full device check on a 2 GB Android (45 min)
- **Do:** First install over mobile data, then airplane mode, then re-open. Check size, frame rate, drag, sound, update behaviour.
- **Why not an agent:** physical device.
- **Unblocks:** the claim "budgets met on a real phone" (PLAN section 12).

### H14. Deaf or hard-of-hearing reviewer (1 hour, plus finding a person)
- **Do:** They play a full session on mute, captions only. Collect what is unclear.
- **Why not an agent:** lived experience cannot be simulated.
- **Unblocks:** CC-05, release.

### H15. Playtest with 3 to 5 real children (about 3 hours incl. setup)
- **Do:** Parent present and consenting, you observe silently, no coaching. Use the playtest kit (Q-05). Record: unaided tutorial completion, whether they replay without being asked, any confusion. Take notes only, no photos or recordings of the child.
- **Why not an agent:** children, parents, trust.
- **Unblocks:** Q-07 and the "done" definition for M1.

### H17. Release approval (20 min)
- **Do:** Read the credits and licence list, check About page wording, say yes to publish.
- **Why not an agent:** publishing is outward-facing.

---

## Phase 6: Milestone 2

### H8. Check the book's wording for wild, domestic and pet (30 min)
- **Do:** Dog, hen, goat. Decide the accepted answers for levels 10 and 11.
- **Why not an agent:** the book is not in the repo and cannot be copied; you hold it.
- **Unblocks:** M2-01, M2-02.

### H16. Hindi pack: native-speaker review, then recording
- **Do:** A native speaker (and a teacher) reviews all strings, the names Bholu, Chiku, Chhotu-Nagar and the zone words. A Hindi speaker records the lines via the booth. Repeat the whole process for any later language.
- **Why not an agent:** correctness and warmth of a language need native judgement; a wrong word in front of children is worse than none.
- **Unblocks:** M2-10, M2-11. Do not release any non-English pack without it.

## Optional

### H18. Real-eye colour-blind check (15 min)
- **Do:** If someone with colour vision deficiency is available, show them the park.
- **Why:** CI simulation is good, a person is better. Not blocking.

## Things only you can notice (standing)
- If the voice, the town or the names stop feeling like yours, say so early. Changes to names cascade into audio, captions, icons and docs, and get more expensive after recording.
