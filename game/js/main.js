// Ember Trail — the game itself: state machine, fixed-step loop, level
// loading, collisions, scoring, lives, checkpoints and the camera.
import { TILE, VIEW_W, VIEW_H, MAX_LIVES, SCORE_EMBER, SCORE_SUNSTONE, SCORE_STOMP, CLEAR_BONUS, PALETTES } from './config.js';
import { clamp, rectsOverlap, makeRng } from './utils.js';
import { LEVELS, buildLevelGrid, tileCenter } from './levels.js';
import { Player } from './player.js';
import { Grumble, Flit, Wisp, Pickup } from './enemies.js';
import { Renderer } from './render.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { setupShotScene } from './shots.js';

const STEP = 1 / 60;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.sounds = new SoundBank();
    this.input = new Input();
    this.state = 'title';
    this.levelIndex = 0;
    this.spec = LEVELS[0];
    this.grid = buildLevelGrid(this.spec);
    this.player = new Player(0, 0);
    this.enemies = [];
    this.pickups = [];
    this.checkpoints = [];
    this.particles = [];
    this.cameraX = 0;
    this.score = 0;
    this.lives = MAX_LIVES;
    this.maxLives = MAX_LIVES;
    this.time = 0;
    this.totalTime = 0;
    this.embersGot = 0;
    this.embersTotal = 0;
    this.gemsGot = 0;
    this.levelEmbers = 0;
    this.levelGems = 0;
    this.timeBonus = 0;
    this.levelScore = 0;
    this.best = this.loadBest();
    this.banner = 0;
    this.shake = 0;
    this.elapsed = 0;
    this.respawn = { x: 0, y: 0 };
    this.rng = makeRng(20261117);
    this.input.onConfirm = () => this.confirm();
    this.input.onPause = () => this.togglePause();
    this.input.onMute = () => this.sounds.toggleMute();
    this.input.onAnyKey = () => this.sounds.ensure();
    canvas.addEventListener('pointerdown', () => {
      this.sounds.ensure();
      this.confirm();
    });
    window.addEventListener('blur', () => {
      if (this.state === 'play') this.state = 'pause';
    });
    this.loadLevel(0, true);
    this.state = 'title';
  }

  loadBest() {
    try {
      return Number(window.localStorage.getItem('emberTrailBest') || 0) || 0;
    } catch (e) {
      return 0;
    }
  }

  saveBest() {
    if (this.score <= this.best) return;
    this.best = this.score;
    try {
      window.localStorage.setItem('emberTrailBest', String(this.best));
    } catch (e) { /* storage unavailable: best score is session-only */ }
  }

  loadLevel(index, quiet = false) {
    this.levelIndex = index;
    this.spec = LEVELS[index];
    this.grid = buildLevelGrid(this.spec);
    this.enemies = [];
    this.pickups = [];
    this.checkpoints = [];
    this.particles = [];
    for (const x of this.spec.grumbles) {
      const c = tileCenter(x, 12);
      this.enemies.push(new Grumble(c.x - 17, c.y - 13));
    }
    for (const [x, y] of this.spec.bats) {
      const c = tileCenter(x, y);
      this.enemies.push(new Flit(c.x - 17, c.y - 11));
    }
    for (const [x, y] of this.spec.wisps) {
      const c = tileCenter(x, y);
      this.enemies.push(new Wisp(c.x - 13, c.y - 13));
    }
    for (const [x, y] of this.spec.coins) {
      const c = tileCenter(x, y);
      this.pickups.push(new Pickup('ember', c.x - 13, c.y - 13));
    }
    for (const [x, y] of this.spec.sunstones) {
      const c = tileCenter(x, y);
      this.pickups.push(new Pickup('sunstone', c.x - 15, c.y - 15));
    }
    for (const [x, y] of this.spec.hearts) {
      const c = tileCenter(x, y);
      this.pickups.push(new Pickup('heart', c.x - 13, c.y - 13));
    }
    for (const x of this.spec.checkpoints) {
      this.checkpoints.push({ x: x * TILE, y: 12 * TILE, lit: false });
    }
    this.embersTotal = this.spec.coins.length;
    const spawn = tileCenter(this.spec.spawn[0], this.spec.spawn[1]);
    this.respawn = { x: spawn.x - 14, y: spawn.y - 18 };
    this.player.reset(this.respawn.x, this.respawn.y);
    this.time = 0;
    this.levelEmbers = 0;
    this.levelGems = 0;
    this.banner = quiet ? 0 : 2.2;
    this.cameraX = 0;
    this.updateCamera(0);
  }

  startGame() {
    this.score = 0;
    this.lives = MAX_LIVES;
    this.totalTime = 0;
    this.embersGot = 0;
    this.gemsGot = 0;
    this.loadLevel(0);
    this.state = 'play';
    this.sounds.ensure();
    this.sounds.click();
  }

  confirm() {
    if (this.state === 'title' || this.state === 'over' || this.state === 'win') {
      this.startGame();
    } else if (this.state === 'clear') {
      this.nextLevel();
    }
  }

  togglePause() {
    if (this.state === 'play') this.state = 'pause';
    else if (this.state === 'pause') this.state = 'play';
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.state = 'win';
      this.saveBest();
      this.sounds.win();
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.state = 'play';
    this.sounds.click();
  }

  hurt(fromX) {
    if (this.player.invincible > 0 || this.state !== 'play') return;
    this.lives -= 1;
    this.sounds.hurt();
    this.shake = 0.35;
    this.burst(this.player.cx, this.player.cy, '#ff5e7a', 14, 190);
    this.player.invincible = 1.6;
    this.player.vy = -420;
    this.player.vx = this.player.cx < fromX ? -260 : 260;
    if (this.lives <= 0) {
      this.state = 'over';
      this.saveBest();
      this.sounds.lose();
    }
  }

  fellInPit() {
    this.lives -= 1;
    this.sounds.hurt();
    this.shake = 0.3;
    if (this.lives <= 0) {
      this.state = 'over';
      this.saveBest();
      this.sounds.lose();
      return;
    }
    this.player.reset(this.respawn.x, this.respawn.y);
    this.player.invincible = 1.6;
    this.updateCamera(0);
  }

  levelClear() {
    const under = Math.max(0, this.spec.par - Math.floor(this.time));
    this.timeBonus = under * 10;
    this.levelScore = this.levelEmbers * SCORE_EMBER + this.levelGems * SCORE_SUNSTONE + CLEAR_BONUS + this.timeBonus;
    this.score += this.levelScore;
    this.totalTime += this.time;
    this.state = 'clear';
    this.sounds.portal();
    this.sounds.clear();
    this.burst(this.player.cx, this.player.cy, '#ffd23e', 26, 260);
  }

  burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i += 1) {
      const a = this.rng() * Math.PI * 2;
      const v = speed * (0.4 + this.rng() * 0.6);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
        life: 0.5 + this.rng() * 0.4, maxLife: 0.9,
        size: 3 + this.rng() * 4, color,
      });
    }
  }

  updateCamera(dt) {
    const target = clamp(this.player.cx - VIEW_W * 0.42, 0, this.spec.width * TILE - VIEW_W);
    this.cameraX = dt === 0 ? target : this.cameraX + (target - this.cameraX) * Math.min(1, dt * 8);
  }

  step(dt) {
    this.elapsed += dt;
    if (this.banner > 0) this.banner -= dt;
    if (this.shake > 0) this.shake -= dt;
    if (this.state !== 'play') return;
    this.time += dt;

    this.player.update(dt, this.input, this.grid, this.spec, this.sounds);
    for (const e of this.enemies) {
      if (e.kind === 'grumble') e.update(dt, this.grid, this.spec);
      else if (e.kind === 'flit') e.update(dt);
      else e.update(dt, this.player);
    }
    for (const p of this.pickups) p.update(dt);
    this.updateParticles(dt);
    this.updateCamera(dt);

    // Pickups.
    for (const p of this.pickups) {
      if (p.tryCollect(this.player)) {
        if (p.kind === 'ember') {
          this.score += SCORE_EMBER;
          this.embersGot += 1;
          this.levelEmbers += 1;
          this.sounds.coin();
          this.burst(p.x + 13, p.y + 13, '#ffd23e', 8, 120);
        } else if (p.kind === 'sunstone') {
          this.score += SCORE_SUNSTONE;
          this.gemsGot += 1;
          this.levelGems += 1;
          this.sounds.gem();
          this.burst(p.x + 15, p.y + 15, '#5eeaff', 12, 160);
        } else {
          this.lives = Math.min(this.maxLives, this.lives + 1);
          this.sounds.checkpoint();
          this.burst(p.x + 13, p.y + 13, '#ff5e7a', 10, 140);
        }
      }
    }

    // Checkpoints.
    for (const c of this.checkpoints) {
      if (!c.lit && Math.abs(this.player.cx - (c.x + TILE / 2)) < 34 && this.player.bottom > c.y) {
        c.lit = true;
        this.respawn = { x: c.x + 6, y: c.y - 18 };
        this.sounds.checkpoint();
        this.burst(c.x + TILE / 2, c.y + 10, '#ffd23e', 12, 150);
      }
    }

    // Enemies: stomp from above, hurt from the side.
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (!rectsOverlap(this.player, e)) continue;
      const falling = this.player.vy > 120;
      const above = this.player.bottom - e.y < 18;
      if (falling && above) {
        e.alive = false;
        this.score += SCORE_STOMP;
        this.player.vy = -520;
        this.player.y = e.y - this.player.h;
        this.sounds.stomp();
        this.burst(e.x + e.w / 2, e.y + e.h / 2, '#c9b8ff', 12, 180);
      } else {
        this.hurt(e.x + e.w / 2);
      }
    }

    // Spikes.
    if (this.player.invincible <= 0 && this.player.touchesSpike(this.grid, this.spec)) {
      this.hurt(this.player.cx + (this.player.facing > 0 ? -40 : 40));
    }

    // Portal.
    const portal = tileCenter(this.spec.portal[0], this.spec.portal[1]);
    const portalBox = { x: portal.x - 24, y: portal.y - 78, w: 48, h: 118 };
    if (rectsOverlap(this.player, portalBox)) {
      this.levelClear();
      return;
    }

    // Fell out of the world.
    if (this.player.y > this.spec.height * TILE + 80) {
      this.fellInPit();
    }
    this.input.endStep();
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  render() {
    const r = this.renderer;
    const pal = PALETTES[this.levelIndex];
    r.clear();
    // The sky and hills are screen-space; the world is drawn translated.
    r.drawBackground(pal, this.cameraX, this.elapsed, this.levelIndex);
    const shakeX = this.shake > 0 ? (this.rng() - 0.5) * 7 : 0;
    const shakeY = this.shake > 0 ? (this.rng() - 0.5) * 5 : 0;
    r.ctx.save();
    r.ctx.translate(Math.round(-this.cameraX + shakeX), Math.round(shakeY));
    r.drawTiles(this.grid, this.spec, pal, this.cameraX);
    for (const c of this.checkpoints) r.drawCheckpoint(c.x, c.y, c.lit, this.elapsed);
    const portal = tileCenter(this.spec.portal[0], this.spec.portal[1]);
    r.drawPortal(portal.x - TILE / 2, portal.y - TILE / 2, this.elapsed, pal);
    for (const p of this.pickups) {
      if (!p.taken) r.drawPickup(p, this.elapsed);
    }
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.kind === 'grumble') r.drawGrumble(e, this.elapsed);
      else if (e.kind === 'flit') r.drawFlit(e, this.elapsed);
      else r.drawWisp(e, this.elapsed);
    }
    if (this.state !== 'title') r.drawPlayer(this.player, this.elapsed);
    r.drawParticles(this.particles);
    r.ctx.restore();

    // Screen-space UI on top of the world.
    if (this.state === 'play' || this.state === 'pause' || this.state === 'clear') {
      r.drawHUD(this);
    }
    if (this.banner > 0 && this.state === 'play') {
      r.drawBanner(`Level ${this.levelIndex + 1} — ${this.spec.name}`, this.spec.subtitle, Math.min(1, this.banner));
    }
    if (this.state === 'title') r.drawTitle(this, this.elapsed);
    else if (this.state === 'clear') r.drawClear(this);
    else if (this.state === 'over') r.drawOver(this);
    else if (this.state === 'win') r.drawWin(this);
    else if (this.state === 'pause') r.drawPause();
  }

  /** Fixed-step loop driven by requestAnimationFrame. */
  run() {
    let last = performance.now();
    let acc = 0;
    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 4) {
        this.step(STEP);
        acc -= STEP;
        n += 1;
      }
      if (n === 4) acc = 0;
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

export function bootGame(canvas) {
  const game = new Game(canvas);
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    const seed = Number(params.get('seed') || 1);
    setupShotScene(game, shot, seed);
    game.render();
    window.__shotReady = true;
    return game;
  }
  game.run();
  return game;
}
