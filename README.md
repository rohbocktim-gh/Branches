# Branches

A math puzzle laid out like a crossword, but grown as branches instead of a square grid.
Each branch is an equation that reads toward its total; cells where branches cross count for both.
Players fill the board from a number bank (duplicates included), by dragging or tapping.

Target: Android (Google Play), Kotlin + Jetpack Compose, monetized with AdMob.

## What's here

- `prototype/index.html` — the playable web prototype: generated puzzles (Easy / Medium / Hard),
  drag-and-drop tiles, hints, days-played and streak rewards, unlockable skins, cheerful ambiance.
  Open it in any browser. (The leaderboard only works when hosted as a Claude artifact.)
- `generator/gen.js` — the puzzle generator and solver on its own, runnable with Node.

## Puzzle rules

- Branches point in any of 8 directions; each reads from its first cell toward its total.
- Operators: `+`, `−`, `×`, evaluated left to right. Totals are 1–72.
- Every generated puzzle has exactly one solution. The solver checks this; when a layout allows
  more than one answer, the generator pre-fills cells to rule the alternatives out.

## Generator quick test

```
node -e 'const {generate}=require("./generator/gen.js"); console.log(JSON.stringify(generate("easy", 1001)))'
```

Difficulty presets: easy = 5 branches, medium = 7, hard = 9. Puzzles are seeded, so
`generate(difficulty, seed)` always returns the same puzzle.

## Rewards design (prototype)

- Solve: Easy 10, Medium 20, Hard 35 petals; +5 for no hints.
- Daily bonus on first solve: 10 × streak days, capped at 70.
- Milestones by days played: 3 (Sunset), 7 (Night Garden), 14 (Cherry Blossom), 30 (Autumn Grove).
- First hint per puzzle free, then 15 petals.

## Next

Port the generator, solver and board to Kotlin + Compose, with a GitHub Actions build.
