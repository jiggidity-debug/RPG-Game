# Shinobi Path

A browser RPG where you create your own ninja and live out their career — from Academy student to Genin, through C-rank missions and the Chunin Exams. Not everyone makes it: you can fail the graduation exam, wash out, get hurt, or lose your career.

Fan-made and non-commercial. Not affiliated with or endorsed by the creators or publishers of Naruto.

## Play

Open `index.html` in a browser — no install or build step. Progress saves automatically in your browser.

## Put it on GitHub Pages

1. Create a new repository on GitHub (for example `shinobi-path`).
2. Upload everything in this folder (`index.html`, `css/`, `js/`, this README) to the repository.
3. In the repository, go to **Settings → Pages**, set **Source** to "Deploy from a branch", pick `main` and `/ (root)`, and save.
4. After a minute the game is live at `https://<your-username>.github.io/shinobi-path/`.

## Project layout

| File | What it does |
|---|---|
| `js/data.js` | All content: villages, clans, jutsu, missions, enemies. Add new content here. |
| `js/state.js` | Creates characters and saves/loads the game. |
| `js/sim.js` | Game rules: training, time, exams, missions, combat. |
| `js/ui.js` | Draws the screens. |
| `js/main.js` | Connects clicks to actions. |
| `js/util.js` | Small shared helpers. |

## How it works (v0.1)

- Every action takes one week. Training gains slow down as stats rise, when you're tired, and depend on hidden per-stat talent.
- Fatigue above 80 risks injury. Injured ninja can only rest or study.
- Graduation exam every year from age 11 (early takers face a higher bar). Fail at 15 and you wash out.
- Your chakra nature is hidden until graduation.
- Genin take D-rank and C-rank missions; C-ranks can turn into real fights.
- Chunin Exams twice a year: written test, survival stage, then a one-on-one final. Promotion is a judgement call, not just a win.

## Roadmap ideas

- Chunin content: B-rank missions, leading a squad
- Kekkei genkai awakenings (Sharingan, etc.)
- Shops and gear with ryo
- Rivals and relationships with teammates
- Jonin, ANBU, and Kage paths
