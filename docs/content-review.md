# Reviewing facts and Arabic

Two spreadsheets (CSV, opens in Excel or Google Sheets) let reviewers check content without touching code.

```bash
npm run review:export     # writes review/city-facts.csv and review/lesson-text.csv
# reviewers edit the "en" / "ar" columns and send the files back
npm run review:import     # applies their edits to content/*.json
npm run content:check     # confirms nothing broke
```

- **`city-facts.csv`** (for a finance-literate teacher or banker per city): one row per city and fact: currency, notes and coins, central bank, ATM network, tax line, payday, exchange-rate lines, bills, journey stops. Check each against current, official sources.
- **`lesson-text.csv`** (for a native Arabic editor): every text in every lesson, with the English beside the Arabic. Words in `{curly brackets}` and `[[double square brackets]]` are placeholders: keep them exactly as they are.

Only change the `en` or `ar` columns. Leave the `path` column alone: it tells the import script where each text lives.
