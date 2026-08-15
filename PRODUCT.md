# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences are served **equally**; no single primary has been chosen yet, and
that is a deliberate open decision rather than an oversight:

1. **Youth and families inside Libya** — short sessions on a phone, between other
   things. The heritage is already familiar; the pull is the knowledge contest.
2. **Libyans in the diaspora** — often parents playing with children, using the
   game to keep a live connection to dialect, geography and heritage.
3. **Students and teachers** — learning Libyan history and geography through play,
   at school or at home.

Until one is chosen, no mechanic may assume a context only one of them has
(a classroom, a co-present second player, prior familiarity with the dialect).

## Product Purpose

«دبارة» is an Arabic, right-to-left trivia and puzzle game about Libyan heritage:
its cities, history, dialect and proverbs, cuisine, sport, and the wider Arab and
Islamic culture around them.

Success is **cultural reach, not revenue**. This is a free project; its value is
in preserving and spreading Libyan heritage knowledge and in how many people play
it. Nothing may gate that spread behind payment.

## Positioning

A heritage-accurate Libyan game with a **real geographic spine**: cities sit at
their true coordinates on a projected map of Libya, and progression is a journey
across the country's four historical regions rather than an abstract level list.
The content is specifically Libyan — dialect, proverbs, dishes, clubs, sites —
not a generic Arabic quiz with a Libyan skin.

## Operating Context

- Played on a phone, in Arabic, right-to-left, one hand, often in short bursts.
- **Connectivity cannot be assumed.** The game is an installable PWA that must
  boot and play fully offline, including on a first visit.
- Sessions are self-contained: a quick round, a daily challenge, or a single map
  stage. Nothing requires a long uninterrupted sitting.
- One device may be shared — the local two-player duel exists for that.

## Capabilities and Constraints

Built and verified today:

- **Map expedition** — 26 Libyan cities at real coordinates across the four
  regions, 95 stages, unlocked by collecting stars or bought with dinars. Every
  city carries three or four questions of its own, so no city repeats itself. The
  map zooms and pans to 4x; symbols hold their size on screen, so zooming in
  lets the declutter ask for less separation and the pins settle back onto their
  true positions — no pin is ever drawn more than 39 km from its city, and at 4x
  none is displaced at all. `npm run map:audit` reports the drift per city.
- **Question banks** — 393 multiple-choice questions across 9 categories
  (4 Libyan: history, dialect, sport, cuisine; 5 general: geography, Islamic
  civilisation, Arabic language and literature, science, general knowledge),
  plus 50 true/false statements for the speed mode. Difficulty spreads
  four levels across all nine banks, and reward follows difficulty six-fold
  rather than two-fold. 167 questions cite a source — a named work, institution
  or Quranic verse rather than a link, so it stays checkable offline.
- **Round shape** — a five-question round ramps easy, easy, medium, medium,
  hard instead of being drawn at random, so no round opens on an expert
  question. Measured over thousands of sampled rounds by `npm run round:audit`.
- **Hints** — 136 of the 137 hard and expert questions carry a bought hint that
  narrows the thinking without naming the answer; the build fails if one does.
- **Earned fun facts** — the fun fact appears only on a correct answer. A wrong
  answer is shown the right one and nothing more.
- **Puzzle modes** — letter scramble (52), 4×4 Arabic mini-crossword (52),
  45-second speed blitz, and a daily challenge **derived from the date** — a
  pure function, so the same day yields the same challenge on every device
  with no server, cycling four modes without repeating until a pool is spent.
  One puzzle of each kind per week of the year: walking the generator forward
  900 days, the first repeat of any puzzle falls on day 364. The build fails if
  that window drops under 300, so it cannot erode unnoticed. Crossword layouts
  are solved by search in `scripts/crossword-build.mjs` rather than placed by
  hand — interlocking four words in a 4×4 is where a letter slips out of step
  and the grid contradicts its own clue.
- **Question memory** — the game records which questions a player has seen and
  which they got wrong. Rounds prefer unseen questions, and a practice mode
  replays only the missed ones until they are answered correctly. A map stage
  asks its curated question first, then draws unseen ones from the same city and
  subject, so replaying a city no longer repeats: twelve replays now give twelve
  different questions in every city, where it used to give one.
- **Content integrity check** — `npm run questions:check` gates the build, so a
  bank that breaks the authoring rules or a dangling stage reference cannot ship.
  It also catches one question giving away another's answer, across questions,
  fun facts, hints, crossword clues and speed-blitz statements. That backlog went
  111 pairs to zero, so the rule now has no exceptions at all.
- **Local two-player duel** on one device (pass and play).
- **Meta** — Libyan-dinar economy sized so the balance is worth watching: a
  perfect round pays about 120 against lifelines at 45 to 120, and the shop sells
  eight avatars, four titles and the early unlock of a locked city at 120 dinars
  per star it would have cost. Cosmetics touch no difficulty, so they can be
  priced freely. Badges and shareable achievement cards rendered on canvas.
- **Mistake reporting** — a link under every fun fact opens WhatsApp with the
  question id already filled in, so a report names the item rather than
  describing it.
- **Persistence** — everything is on-device, with manual backup export/import.

Constraints:

- **Arabic RTL is the only language.** Not a localisation of an English product.
- **Offline-first**, including the first visit.
- **No accounts and no server today.** A server *is* planned later, for accounts,
  sync and a real cross-player leaderboard — so local features should be shaped so
  they can be connected later without being rebuilt.

Explicitly undecided:

- Which of the three audiences is primary.
- **Who validates Libyan factual content.** No authority is established beyond
  the author's own review. Claims that cannot be confirmed carry a `needsReview`
  note saying what is doubtful and why — none are outstanding today. Every hard
  and expert question now cites a source, so the gap is no longer coverage but
  the kind of claim a citation cannot settle: how a proverb is worded in one
  region against another, or a club nickname its own supporters would correct.
  The in-game report link exists to reach the people who know those.
- When the server arrives, and what it covers first.

## Brand Commitments

- **Name:** «دبارة» — subtitle «لغز ومعرفة».
- **Language and voice:** Arabic throughout, warm and familiar, using Libyan terms
  as the product's own vocabulary — «معلومة ع الماشي» for the fact card, the
  Libyan dinar as the currency, «فرسان المتوسط», «شاهي العالة».
- **Visual world:** the Neo-Heritage system recorded in `design.md` is the
  incumbent identity and is binding. Its tokens live in `src/index.css` and are
  the only way components may express colour, shadow or motion.

## Evidence on Hand

Real and usable:

- The full content set above, authored in-repo.
- Map artwork (`public/assets/libya-map.png`) with a calibrated Mercator fit.

Absences that future work must not paper over:

- **No real players, testimonials, download numbers, reviews or press.** None may
  be invented or implied.
- **There is no cross-player leaderboard, and the standing screen must not
  imply one.** It once listed seven invented rivals with invented scores; those
  are gone, and it now shows only the player's own record against a rank ladder.
  Real ranking needs the planned server, and until that exists nothing here may
  present invented people as competitors.
- **No external review of the Libyan content** has happened by a person. Machine
  fact-check passes brought every hard and expert question to a named source,
  but their verdicts were unreliable enough that only quoted, re-checked findings
  were applied — and rightly so. Across those passes one source was fabricated
  outright (a proverb credited to a heritage blog that is in fact a news weekly
  carrying neither the proverb nor the quoted text) and one "fun fact" told the
  player a club's former name using a rival club that was itself a wrong option
  in that same question.

- **Sources are trusted by class, not individually re-opened.** About six were
  verified by fetching the page. The rest were accepted because they come from
  the class where every spot-check held — Arabic Wikipedia — while both
  fabrications were non-Wikipedia with vague URLs. That is a reasoned bet, not
  full verification, and should be described as such.

- **Four classical-dictionary citations name the work from knowledge rather than
  a page opened.** `شاملة` blocks fetching and `almougem` returned only a root
  URL. The definitions themselves are standard, but the citations are weaker
  evidence than the others and are the first place to look if one is disputed.

## Product Principles

1. **Free and unblocked.** Cultural reach is the goal; nothing gates play behind
   payment, accounts, or connectivity.
2. **Accuracy is the product.** A heritage game that teaches something false does
   real harm. Unverifiable claims are removed or reworded, never guessed at.
3. **Never present fabricated data as real.** Placeholder content is labelled as
   such or reshaped into something true.
4. **Offline on any phone.** Connectivity, recent hardware and large downloads are
   all assumptions this product does not make.
5. **Local-first, server-ready.** On-device today, but shaped so accounts and a
   real leaderboard can attach later without a rebuild.

## Accessibility & Inclusion

- Arabic right-to-left is the native direction, not a mirrored afterthought.
- Thumb-reachable controls; the game is played one-handed on a phone.
- Every interactive element is a real button with a visible keyboard focus ring.
- Dialogs hold focus rather than merely claiming to: Tab cycles inside them,
  Escape closes, and focus returns to whatever opened them. Declaring
  `aria-modal` confines nothing on its own, which is how four sheets came to let
  Tab walk out into the map behind them.
- `prefers-reduced-motion` is honoured in both layers that animate — CSS, and
  Framer Motion via `MotionConfig`. The CSS rule alone cannot reach Framer, which
  writes inline styles frame by frame, so for a long time the preference was
  close to decorative across the fourteen components that animate through it.
- Page zoom is left enabled. Locking the scale on a screen that is mostly Arabic
  prose fails the readers who most need to enlarge it, and the map's pinch does
  not depend on it.
- Target size follows WCAG 2.2 AA at 24x24 CSS px. Map pins are the deliberate
  exception the standard allows: their position is the information, and zoom is
  the mechanism for reaching them.
- Text meets WCAG AA contrast, including muted captions and locked states.
- Option buttons name the answer alongside their order letter, so a screen
  reader does not run the two together into a different word.
