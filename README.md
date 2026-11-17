# Ember Trail

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/RenzzHGE/ember-trail-platformer/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/RenzzHGE/ember-trail-platformer/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A tiny fox. Three wild trails. One way home.

Ember Trail is a complete 2D platformer adventure that runs offline in a
desktop browser from static files. Pip, a little ember-fox, runs, jumps and
stomps across three hand-built trails — Mosswood Glade, Cinder Caves and Sky
Ruins — gathering embers and hidden sunstones, dodging thorns and beasties,
and reaching the golden portal at the end of each trail.

Built for [make.fun's "Make the best game" bounty](https://make.fun/bounty/best-game-01) ($1,000 in USDC).

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static file server). No network requests, no build step.

- **Move**: Left / Right arrows or A / D
- **Jump**: Space / Up arrow / W (coyote time and jump buffering included)
- **Pause**: P — **Mute**: M — **Start / restart**: Enter or click

Stomp a beastie from above to defeat it (+200). Touch one from the side,
touch thorns, or fall into a pit and you lose a life. Lantern checkpoints
save your place. Three lives per run; the best score is kept in the browser.

## The game

- 3 levels with their own palettes, hazards and enemy mixes
- Enemies with simple AI: grumble slimes that patrol, flit bats that ride
  a sine wave, spark wisps that drift toward you
- Pickups: embers (+100), sunstones (+500, hidden), hearts (+1 life)
- HUD with score, embers, sunstones, lives, level name and timer
- Title, level banners, level-clear breakdown, game-over and win screens
- WebAudio sound effects, synthesised live — no audio files
- All art drawn in code on canvas; no image files

## Layout

- `game/index.html` — the page
- `game/js/main.js` — state machine, loop, collisions, scoring
- `game/js/levels.js` — the three level specs and the tile builder
- `game/js/player.js` — Pip: physics, coyote time, jump buffering
- `game/js/enemies.js` — grumbles, flits, wisps and pickups
- `game/js/render.js` — all drawing: world, creatures, HUD, screens
- `game/js/shots.js` — deterministic screenshot scenes (`?shot=`)
- `game/js/audio.js` — synthesised sound effects
- `game/js/input.js` — keyboard input
- `game/js/config.js` — tuning numbers and palettes
- `game/js/utils.js` — helpers and a seeded RNG
- `main.ts` — the make.fun entry program (copies game/ + screenshots/,
  writes dossier.json)

Screenshots in `screenshots/` are real renders of the game, taken with
`?shot=title|play|clear|over` in headless Chromium.

## License

MIT — see LICENSE.
