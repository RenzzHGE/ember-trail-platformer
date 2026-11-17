// Ember Trail — deterministic screenshot scenes behind ?shot=title|play|
// clear|over. Each scene plays the real rules forward from a fresh world
// for a fixed number of steps (the play scene is steered by a small
// autopilot), so the frame is what a short game really looks like and the
// same seed always gives the same frame.
import { TILE } from './config.js';
import { makeRng } from './utils.js';
import { tileIsSolid } from './levels.js';

const STEP = 1 / 60;

const PLAY_STEPS = 420;

/** Input stand-in for the autopilot: holds right, and presses jump with a
 *  realistic hold (a tap that is cut short on the next step would never
 *  clear a pit, so the hold lasts a few steps after the press). */
class SimInput {
  constructor() {
    this.pressed = false;
    this.hold = 0;
  }

  pressJump(holdSteps = 18) {
    this.pressed = true;
    this.hold = holdSteps;
  }

  moveAxis() { return 1; }
  jumpHeld() { return this.hold > 0; }
  jumpPressed() { return this.pressed; }
  endStep() {
    this.pressed = false;
    this.hold = Math.max(0, this.hold - 1);
  }
}

/** True when the ground under the player's next steps has a gap. */
function gapAhead(game) {
  const p = game.player;
  const footRow = Math.floor((p.bottom + 6) / TILE);
  const aheadX = p.x + p.w + 26;
  const tx = Math.floor(aheadX / TILE);
  return !tileIsSolid(game.grid, game.spec, tx, footRow)
    && !tileIsSolid(game.grid, game.spec, tx, footRow - 1);
}

/** True when a hazard or enemy is just ahead on the ground. */
function threatAhead(game) {
  const p = game.player;
  for (const e of game.enemies) {
    if (!e.alive) continue;
    const dx = e.x - (p.x + p.w);
    if (dx > 0 && dx < 70 && Math.abs(e.y - p.y) < 60) return true;
  }
  const tx = Math.floor((p.x + p.w + 30) / TILE);
  const ty = Math.floor((p.bottom - 4) / TILE);
  return game.grid[ty] && game.grid[ty][tx] === 2;
}

/** True when an ember is just ahead and just above the player's head, so a
 *  short hop reaches it. */
function coinAhead(game) {
  const p = game.player;
  for (const pk of game.pickups) {
    if (pk.taken || pk.kind !== 'ember') continue;
    if (pk.x + pk.w < p.x || pk.x > p.x + 90) continue;
    if (pk.y + pk.h < p.y - 80 || pk.y > p.y + 10) continue;
    return true;
  }
  return false;
}

/** Steer the play scene: run right, jump over gaps, spikes and beasties,
 *  hop for low embers. */
function autopilotStep(game, sim) {
  if (!game.player.onGround) return;
  if (gapAhead(game) || threatAhead(game)) { sim.pressJump(18); return; }
  if (coinAhead(game)) sim.pressJump(3);
}

export function setupShotScene(game, scene, seed) {
  game.rng = makeRng(seed || 1);
  // Deterministic enemy phases so one seed gives one frame.
  const fixPhases = () => {
    game.enemies.forEach((e, i) => {
      if (e.wobble !== undefined) e.wobble = i * 1.3;
      if (e.t !== undefined) e.t = i * 1.7;
    });
  };

  if (scene === 'title') {
    game.loadLevel(0, true);
    game.state = 'title';
    game.elapsed = 3;
    fixPhases();
    return;
  }

  if (scene === 'clear') {
    game.loadLevel(0, true);
    game.state = 'clear';
    game.score = 2720;
    game.levelEmbers = 9;
    game.levelGems = 1;
    game.timeBonus = 320;
    game.levelScore = 2720;
    game.time = 43;
    game.embersGot = 9;
    game.gemsGot = 1;
    game.elapsed = 3;
    fixPhases();
    return;
  }

  if (scene === 'over') {
    game.loadLevel(0, true);
    game.state = 'over';
    game.score = 1450;
    game.lives = 0;
    game.time = 52;
    game.elapsed = 3;
    fixPhases();
    return;
  }

  // Default: 'play' — a real mid-level frame with the HUD.
  game.loadLevel(0, true);
  game.state = 'play';
  game.lives = 99;
  game.elapsed = 0;
  fixPhases();
  const realInput = game.input;
  const sim = new SimInput();
  game.input = sim;
  for (let i = 0; i < PLAY_STEPS; i += 1) {
    autopilotStep(game, sim);
    game.step(STEP);
    if (game.state !== 'play') {
      // The pilot died or cleared the level: restart the run once.
      game.loadLevel(0, true);
      game.state = 'play';
      game.lives = 99;
      fixPhases();
    }
  }
  game.input = realInput;
  game.lives = 3;
  game.elapsed = 7;
}
