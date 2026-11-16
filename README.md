# Shinobi Chronicles — arc-free hybrid Naruto RPG foundation

A **working static-browser prototype**, without AI APIs, external packages, or backend hosting. Includes a small clickable exploration grid, a d20 training check, a preliminary combat test, character stats, rank XP, resource bars, local storage, and portable JSON save import/export.

## Run

- Upload `index.html`, `styles.css`, `app.js`, and `initial-state.json` to a GitHub repository root.
- In repository **Settings → Pages**, publish from the main branch root. Your site will be hosted at the GitHub Pages URL.
- Alternatively run `python -m http.server 8000` from this folder, then open `http://localhost:8000`.
- **Do not** double-click `index.html` directly: the baseline JSON loads through `fetch`, requiring a local web server.

## Canon safety

The character snapshot is derived from `Kaido_Modular_Save_v26_May29_Y7_RECONCILED.zip` (`00`–`04`): Level 6 (10/100), attributes, 28 skills, HP 52, stamina 55, chakra 194, ryō 5262. No campaign story content is loaded. Training XP formula and combat opponent math in this demo are *provisional*; only the check formula `d20 + (attribute-5) + skill rank + situation` and 100 XP per rank are taken as established rules. Other test effects are sandbox-only, never imported into canon without approval.

### Implemented
- Full character roster values (single-character prototype)
- Core resource max formulas and skill-rank XP rollovers
- Exploration test grid, navigation and position persistence
- Training skill check, d20 input or RNG; **provisional award**
- Test encounter and basic resource consumption; **placeholder enemy AI and damage**
- History, browser storage, JSON import/export/reset

### Planned engine features (not implemented yet)
- True grid positioning and movement/action economy in combat
- Approved combat resolution based on consolidated archived campaign mechanics
- Time tracking, recovery and calibrated training XP based on actual campaign rules
- Equipment, item constraints, economy ledger, and transactions
- World maps and connected locations, NPC profiles and relationships
- Arc/quest scripting, dialogue branches, cutscenes, map assets
- Multiple characters, protected GM-only lore and save migrations

**Publishing caution:** Do not publish unplayed GM-only secrets or private source saves to a public GitHub repository. This package deliberately contains only the public game prototype and current player-facing character stats.
