// Ember Trail — Pip, the ember-fox hero. Runs, jumps and stomps with
// coyote time and jump buffering so the controls feel forgiving.
import {
  TILE, GRAVITY, MOVE_SPEED, JUMP_SPEED, MAX_FALL,
  COYOTE_TIME, JUMP_BUFFER, PLAYER_W, PLAYER_H,
} from './config.js';
import { clamp } from './utils.js';
import { tileIsSolid } from './levels.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = PLAYER_W;
    this.h = PLAYER_H;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.coyote = 0;
    this.buffer = 0;
    this.invincible = 0;
    this.squash = 0;
    this.runCycle = 0;
    this.wasFalling = false;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.coyote = 0;
    this.buffer = 0;
    this.invincible = 0;
    this.squash = 0;
    this.runCycle = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }

  /** Advance one fixed step. Returns 'landed' when a fall ends on ground. */
  update(dt, input, grid, spec, sounds) {
    const axis = input.moveAxis();
    const target = axis * MOVE_SPEED;
    const accel = this.onGround ? 2600 : 1800;
    this.vx = Math.abs(target - this.vx) < accel * dt
      ? target
      : this.vx + Math.sign(target - this.vx) * accel * dt;
    if (axis !== 0) this.facing = axis;

    if (input.jumpPressed()) this.buffer = JUMP_BUFFER;
    else this.buffer = Math.max(0, this.buffer - dt);
    this.coyote = this.onGround ? COYOTE_TIME : Math.max(0, this.coyote - dt);

    if (this.buffer > 0 && this.coyote > 0) {
      this.vy = -JUMP_SPEED;
      this.buffer = 0;
      this.coyote = 0;
      this.onGround = false;
      this.squash = -0.25;
      if (sounds) sounds.jump();
    }

    // A held jump button floats a little longer; releasing cuts the jump.
    if (!input.jumpHeld() && this.vy < -260) this.vy = -260;

    this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);
    this.wasFalling = this.vy > 240;

    this.moveAxisX(dt, grid, spec);
    const landed = this.moveAxisY(dt, grid, spec);
    if (landed && this.wasFalling) {
      this.squash = 0.22;
      if (sounds) sounds.land();
    }
    if (this.onGround) this.runCycle += Math.abs(this.vx) * dt * 0.045;
    this.squash *= Math.pow(0.001, dt);
    if (Math.abs(this.squash) < 0.01) this.squash = 0;
    this.invincible = Math.max(0, this.invincible - dt);
    return landed;
  }

  moveAxisX(dt, grid, spec) {
    this.x += this.vx * dt;
    const top = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.h - 1) / TILE);
    if (this.vx > 0) {
      const tx = Math.floor((this.x + this.w) / TILE);
      for (let ty = top; ty <= bottom; ty += 1) {
        if (tileIsSolid(grid, spec, tx, ty)) {
          this.x = tx * TILE - this.w - 0.01;
          this.vx = 0;
          break;
        }
      }
    } else if (this.vx < 0) {
      const tx = Math.floor(this.x / TILE);
      for (let ty = top; ty <= bottom; ty += 1) {
        if (tileIsSolid(grid, spec, tx, ty)) {
          this.x = (tx + 1) * TILE + 0.01;
          this.vx = 0;
          break;
        }
      }
    }
    this.x = clamp(this.x, 0, spec.width * TILE - this.w);
  }

  moveAxisY(dt, grid, spec) {
    this.y += this.vy * dt;
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    let landed = false;
    if (this.vy >= 0) {
      const ty = Math.floor((this.y + this.h) / TILE);
      for (let tx = left; tx <= right; tx += 1) {
        if (tileIsSolid(grid, spec, tx, ty)) {
          this.y = ty * TILE - this.h;
          this.vy = 0;
          this.onGround = true;
          landed = true;
          break;
        }
      }
      if (!landed) this.onGround = false;
    } else {
      const ty = Math.floor(this.y / TILE);
      for (let tx = left; tx <= right; tx += 1) {
        if (tileIsSolid(grid, spec, tx, ty)) {
          this.y = (ty + 1) * TILE + 0.01;
          this.vy = 0;
          break;
        }
      }
    }
    return landed;
  }

  /** True when this body overlaps a tile of the spike kind. */
  touchesSpike(grid, spec) {
    const x0 = Math.floor((this.x + 4) / TILE);
    const x1 = Math.floor((this.x + this.w - 5) / TILE);
    const y0 = Math.floor((this.y + this.h - 12) / TILE);
    const y1 = Math.floor((this.y + this.h - 1) / TILE);
    for (let ty = y0; ty <= y1; ty += 1) {
      for (let tx = x0; tx <= x1; tx += 1) {
        if (tx >= 0 && tx < spec.width && ty >= 0 && ty < spec.height) {
          if (grid[ty][tx] === 2) return true;
        }
      }
    }
    return false;
  }
}
