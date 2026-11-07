# Phone test: how to try MIA on a real phone and what to watch for

No child has played MIA yet. Everything in the build report was measured on a laptop. This file is the protocol for the first real test. It is about watching, not asking.

## 1. Open it on a phone

**Over Wi-Fi from your Mac (fastest, shows your latest code)**
1. Phone and Mac on the same Wi-Fi.
2. In the project: `npm run dev -- --host` (Vite prints the Network URL; the port is 5173).
3. Find the Mac's address if you need it: `ipconfig getifaddr en0` (use `en1` if that prints nothing).
4. On the phone open `http://<that address>:5173/?fps`, for example `http://192.168.1.23:5173/?fps`. Turn the phone sideways (MIA is landscape).
5. The dev server is not the installed app: no offline mode and a little slower to start. It is fine for feel and for the `?fps` numbers; for the production feel use the next option.

**The deployed site (the real thing, installable)**
1. Open `https://<your-github-user>.github.io/mia/` (the repository's Pages address, the `/mia/` path) in Chrome on Android. Add `?fps` for the numbers.
2. Chrome menu, "Install app" or "Add to Home screen". After one load it works offline; test that once by switching on airplane mode and reopening.
3. A new deploy reaches an installed copy on the second open (the service worker updates itself). If you see old behaviour, close the app fully and reopen it.

**The `?fps` overlay.** A small dark strip at the top centre, on every page and game:
`30 fps | worst 18 ms | draw 0.3 (max 1.2) ms | calls 14 (max 22)`
- `fps`: pictures drawn per second. 30 while something moves; about 4 on a still screen, on purpose (saves battery). A moving screen showing under 20 on the phone is a problem.
- `worst`: the longest pause between two browser ticks in the last second or two. 17 is perfect; 34 is one dropped frame; over 100 is a visible stutter.
- `draw`: how long our drawing took per frame (average and the biggest). On a cheap phone under 5 ms average is comfortable; a max over 16 ms means a hitch.
- `calls`: canvas drawing calls in the latest frame, then the biggest seen since the page opened. The budget is 25. If a screen shows more, note which screen.
Note down the numbers for: home, shelves, a card, each of the three games in the middle of a round, the reveal, Card clash. A photo of the screen is enough.

## 2. The 10-minute observation (a 6-year-old, parent beside them)

Ground rules: in person, a parent present, notes only, no photos or recordings of the child (the project promises nothing about the child leaves the device). Do not teach, do not quiz, do not ask "what is this animal?", "where does it live?" or "what does it eat?". If the child asks you something, answer like a friend. If they are stuck for more than 20 seconds, say nothing for 10 more seconds; then point at the screen without naming the answer.

Flow: hand over the phone on the home screen. Say only "this is a toy, you can play". Watch. After 10 minutes, ask one open question: "What was your favourite?" and note the answer word for word.

Signals to tick (with the minute they happened):
- [ ] Opens a door without help (which door, how long it took).
- [ ] Plays 3 or more rounds in total (of any game).
- [ ] Says an animal's name aloud, unprompted (Sheru, Balu, Moti, ...).
- [ ] Looks at the signposts or the food picture before choosing (eyes on the food signs, pointing at them, saying the food).
- [ ] Laughs or points at the reveal, the funny action or a shrug.
- [ ] Asks for "one more", or reaches for the phone after the end.
- [ ] Taps the cards on the shelf, or goes to the shelf by themselves.
- [ ] Taps a card's food or home badge to hear it.
- [ ] Tries Card clash; picks a power on purpose (does the choice look like "this is the big one"?); shows a sibling or parent.
- [ ] Wants a specific animal ("I want the tiger"), and goes back to a door to get it.

Also note, without judging:
- Where the child's finger went first on each screen, and any tap that did nothing. Targets that look tappable but are not (or the reverse).
- Moments of boredom (looks away, sighs, hands the phone back) and which screen they were on.
- Moments they did not know what to do (the first hint hand on the home screen: did they follow it?).
- Whether they read or ignored the captions; whether sound was on.
- Anything they said about the animals, the numbers or the cards, word for word.
- The phone model, Android version, browser, whether it ran smoothly, and the `?fps` numbers for each screen.
- Heat, battery drop (note the percentage before and after) and any crash or blank screen.

## 3. Kill and revise criteria (decide before you look at the results)

Judge on at least three children, different days, if you can.

**Keep going (green)**: most children tick "plays 3 or more rounds" and at least one of "says an animal's name" or "asks for one more", and the phone holds 25 fps or more while moving on the oldest phone you will support.

**Revise (amber), change the one thing, test again**
- A game is opened but not finished by most children: its round is too long or its goal is not clear. Shorten or add a hint before anything else.
- Children never touch the shelf or the card badges: the facts are decoration. Consider making the card view part of the reveal flow, not a side trip.
- Card clash is never opened, or children pick powers at random: simplify (fewer powers) or show it earlier.
- Children tap the wrong things often (missed targets): enlarge the target; do not add instructions.
- Frame rate under 25 fps while moving, or `worst` over 100 ms, on the target phone: fix performance before any new content.

**Kill or rethink (red)**
- Two of three children stop before finishing one game and do not return to the phone for another round.
- Nobody says an animal's name or points at a card after 10 minutes: the animals are not wanted, and the whole card idea needs a rethink, not a polish.
- A child is upset by a shrug, a "next time", or by missing an animal they wanted: change that reaction before anything else.
- The app crashes, gets hot, or drains more than about 10 percent battery in 10 minutes on the target phone.

Write the verdict (green, amber, red), the evidence (ticks and quotes) and the one change you will make next in `docs/BACKLOG.md` or a new dated section here.
