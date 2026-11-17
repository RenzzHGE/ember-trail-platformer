// Ember Trail — the things Pip meets: three enemy kinds with simple AI,
// and the pickups (embers, sunstones, hearts). Enemies are stompable from
// above and hurtful from the side.
import { TILE } from './config.js';
import { clamp, rectsOverlap } from './utils.js';
import { tileIsSolid } from './levels.js';

/** A grumble slime: walks its platform, turns at edges and walls. */
export class Grumble {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 34; this.h = 26;
    this.vx = -55; this.vy = 0;
    this.alive = true; this.wobble = Math.random() * 6;
    this.kind = 'grumble';
  }

  update(dt, grid, spec) {
    if (!this.alive) return;
    this.wobble += dt * 6;
    this.vy = Math.min(900, this.vy + 1800 * dt);
    this.x += this.vx * dt;
    const dir = Math.sign(this.vx);
    const edgeX = dir > 0 ? this.x + this.w : this.x;
    const tx = Math.floor(edgeX / TILE);
    const ty = Math.floor((this.y + this.h / 2) / TILE);
    if (tileIsSolid(grid, spec, tx, ty)) {
      this.vx = -this.vx;
      this.x += this.vx * dt * 2;
    }
    // Turn around at a ledge: no ground just ahead and below.
    const aheadX = dir > 0 ? this.x + this.w + 4 : this.x - 4;
    const belowTx = Math.floor(aheadX / TILE);
    const belowTy = Math.floor((this.y + this.h + 6) / TILE);
    if (!tileIsSolid(grid, spec, belowTx, belowTy)) {
      this.vx = -this.vx;
    }
    this.y += this.vy * dt;
    const feetTy = Math.floor((this.y + this.h) / TILE);
    const lx = Math.floor((this.x + 2) / TILE);
    const rx = Math.floor((this.x + this.w - 3) / TILE);
    for (let txx = lx; txx <= rx; txx += 1) {
      if (tileIsSolid(grid, spec, txx, feetTy)) {
        this.y = feetTy * TILE - this.h;
        this.vy = 0;
        break;
      }
    }
    this.x = clamp(this.x, 0, spec.width * TILE - this.w);
  }
}

/** A flit bat: flies a sine wave across its home stretch. */
export class Flit {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 34; this.h = 22;
    this.homeX = x; this.homeY = y; this.t = Math.random() * 6;
    this.alive = true; this.kind = 'flit';
  }

  update(dt) {
    if (!this.alive) return;
    this.t += dt;
    this.x = this.homeX + Math.sin(this.t * 0.9) * 70;
    this.y = this.homeY + Math.sin(this.t * 2.4) * 26;
  }
}

/** A spark wisp: drifts, and chases Pip slowly when he comes close. */
export class Wisp {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 26; this.h = 26;
    this.homeX = x; this.homeY = y; this.t = Math.random() * 6;
    this.alive = true; this.kind = 'wisp';
  }

  update(dt, player) {
    if (!this.alive) return;
    this.t += dt;
    const dx = player.cx - (this.x + this.w / 2);
    const dy = player.cy - (this.y + this.h / 2);
    const dist = Math.hypot(dx, dy);
    if (dist < 230 && dist > 1) {
      const speed = 62;
      this.x += (dx / dist) * speed * dt;
      this.y += (dy / dist) * speed * dt;
    } else {
      this.x = this.homeX + Math.sin(this.t * 0.8) * 46;
      this.y = this.homeY + Math.sin(this.t * 1.7) * 22;
    }
  }
}

/** A floating pickup: ember coin, sunstone gem or a heart. */
export class Pickup {
  constructor(kind, x, y) {
    this.kind = kind; // 'ember' | 'sunstone' | 'heart'
    this.x = x; this.y = y;
    this.w = kind === 'sunstone' ? 30 : 26;
    this.h = kind === 'sunstone' ? 30 : 26;
    this.taken = false;
    this.bob = Math.random() * 6;
    this.baseY = y;
  }

  update(dt) {
    this.bob += dt * 3;
    this.y = this.baseY + Math.sin(this.bob) * 4;
  }

  tryCollect(player) {
    if (this.taken) return false;
    if (rectsOverlap(this, player)) {
      this.taken = true;
      return true;
    }
    return false;
  }
}
