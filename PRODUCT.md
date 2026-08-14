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

- **Map expedition** — 20 Libyan cities at real coordinates across the four
  regions, 77 stages, unlocked by collecting stars.
- **Question banks** — 343 multiple-choice questions across 9 categories
  (4 Libyan: history, dialect, sport, cuisine; 5 general: geography, Islamic
  civilisation, Arabic language and literature, science, general knowledge),
  plus 50 true/false statements for the speed mode. Eight of the nine banks hold
  40 questions each; every category carries a real spread of difficulty
  (93 easy / 132 medium / 85 hard / 33 expert) and reward follows difficulty.
  73 questions cite a source — a named work, institution or Quranic verse rather
  than a link, so it stays checkable offline.
- **Puzzle modes** — letter scramble (17), 4×4 Arabic mini-crossword (18),
  45-second speed blitz, and a daily challenge **derived from the date** — a
  pure function, so the same day yields the same challenge on every device
  with no server, cycling four modes without repeating until a pool is spent.
- **Question memory** — the game records which questions a player has seen and
  which they got wrong. Rounds prefer unseen questions, and a practice mode
  replays only the missed ones until they are answered correctly.
- **Content integrity check** — `npm run questions:check` gates the build, so a
  bank that breaks the authoring rules or a dangling stage reference cannot ship.
- **Local two-player duel** on one device (pass and play).
- **Meta** — Libyan-dinar economy, lifelines shop, badges, shareable achievement
  cards rendered on canvas.
- **Persistence** — everything is on-device, with manual backup export/import.

Constraints:

- **Arabic RTL is the only language.** Not a localisation of an English product.
- **Offline-first**, including the first visit.
- **No accounts and no server today.** A server *is* planned later, for accounts,
  sync and a real cross-player leaderboard — so local features should be shaped so
  they can be connected later without being rebuilt.

Explicitly undecided:

- Which of the three audiences is primary.
- **Who validates Libyan factual content.** No authority is established. Claims
  that cannot be confirmed carry a `needsReview` note in the data saying what
  is doubtful and why.
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
- **The leaderboard rivals are fabricated placeholder names.** They stand in for a
  feature that needs the planned server. Until it exists, the leaderboard must not
  present invented people as real competitors.
- **No external review of the Libyan content** has happened by a person. A
  machine fact-check pass covered the hard and expert questions and 73 now carry
  a source, but its verdicts were unreliable enough that only quoted, re-checked
  findings were applied. One claim — the description of المثرودة — is still
  flagged in the data itself as wanting a local reviewer.

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
- `prefers-reduced-motion` is honoured — the map, celebrations and card entrances
  all animate.
- Text meets WCAG AA contrast, including muted captions and locked states.
