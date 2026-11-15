# Partner policy: banks and schools

MoneyQuest can carry a sponsor bank's and/or a school's brand (see `content/editions.json`). These rules keep the app trustworthy for parents, schools and regulators. Put them in every partner contract.

## 1. Education, not marketing, for children
- Children learn **how** banking products work (accounts, debit cards, cheques, credit cards, savings). Lessons use the partner's product names as examples, with neutral, factual wording.
- **No calls to action aimed at children.** Children are never told to open, buy, ask for or apply for a real product. No "ask your parents for an ABC card" prompts.
- **Product details and links are for grown-ups only**, behind the parent PIN ("For grown-ups" card on the bank stop).
- No partner offers, prizes or discounts inside the children's game. No real-money purchases of any kind.
- Credit and borrowing are always presented with their costs and risks (interest, minimum-payment trap, credit score).

Regulatory references to check with counsel: CBUAE Consumer Protection Regulation and Standards; UK CAP Code section 5 (children) and the Children's Code; EU UCPD and AVMSD rules on direct exhortation to children; ASCI guidelines (India); COPPA and the CARU guidelines (USA).

## 2. Branding limits
- The partner's colours appear on partner-owned surfaces only: the bank stop, the Town Bank, the "presented by" strip and the welcome screen. The rest of the app keeps its own design so it doesn't feel like an advert.
- Partners supply their logo and product names; MoneyQuest supplies the learning content. Partners can review content for accuracy but cannot add promotional material.

## 3. Data
- **No child data is shared with partners.** Partners may receive aggregated, anonymous reports (active learners, average before/after improvement, stops completed) only for groups of at least 20 children.
- A data processing agreement (DPA) is needed with each partner. It should cover: purpose limitation (education only), no re-identification, aggregated reporting thresholds, security measures, sub-processors (hosting), retention and deletion, breach notification (≤72 hours), audit rights, and governing law.

## 4. Schools
- Teachers see nicknames and progress for children whose parents added the class code. Teachers cannot see other families or full game data.
- Worksheets and certificates may carry the school's name and motto.

## 5. Accuracy and review
- Each city's facts (taxes, notes, ATM networks, payday rules, exchange-rate examples) and all Arabic text should be reviewed before launch. Use `npm run review:export` to produce spreadsheets for reviewers and `npm run review:import` to bring corrections back (see `docs/content-review.md`).
