// Ember Trail — everything the player sees: parallax backgrounds, tiles,
// creatures, pickups, particles, the HUD and every screen. All art is drawn
// in code, so the game ships no image files at all.
import { TILE, VIEW_W, VIEW_H } from './config.js';
import { clamp, lerp, tileShade } from './utils.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  clear() {
    this.ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  }

  drawBackground(palette, camX, time, levelIndex) {
    const ctx = this.ctx;
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(1, palette.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    if (levelIndex === 1) {
      // Cave stars and drifting spores.
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 40; i += 1) {
        const sx = (i * 173.3 + time * 4) % (VIEW_W + 20) - 10;
        const sy = (i * 97.7) % 260;
        ctx.fillRect(sx, sy, 2, 2);
      }
    } else {
      // Sun and slow clouds.
      ctx.fillStyle = levelIndex === 2 ? '#fff2c8' : '#fff8d6';
      ctx.beginPath();
      ctx.arc(VIEW_W - 120, 74, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 5; i += 1) {
        const cx = ((i * 260 + time * 12) % (VIEW_W + 320)) - 160;
        const cy = 46 + (i % 3) * 44;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 52, 17, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 34, cy + 6, 36, 13, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Two parallax hill ridges.
    this.drawRidge(palette.hillFar, camX * 0.25, 300, 46, 0.004, 7);
    this.drawRidge(palette.hillNear, camX * 0.5, 360, 60, 0.006, 11);
  }

  drawRidge(color, offset, baseY, amp, freq, seed) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    for (let x = 0; x <= VIEW_W; x += 16) {
      const y = baseY + Math.sin((x + offset) * freq + seed) * amp
        + Math.sin((x + offset) * freq * 2.7 + seed * 2) * amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }

  drawTiles(grid, spec, palette, camX) {
    const ctx = this.ctx;
    const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
    const x1 = Math.min(spec.width - 1, Math.floor((camX + VIEW_W) / TILE) + 1);
    for (let ty = 0; ty < spec.height; ty += 1) {
      for (let tx = x0; tx <= x1; tx += 1) {
        const t = grid[ty][tx];
        if (t === 0) continue;
        const px = tx * TILE - camX;
        const py = ty * TILE;
        if (t === 2) { this.drawSpikes(px, py); continue; }
        const shade = tileShade(tx, ty) * 0.14 - 0.07;
        const isTop = ty === 0 || grid[ty - 1][tx] === 0;
        ctx.fillStyle = shadeColor(isTop ? palette.groundTop : palette.groundBody, shade);
        ctx.fillRect(px, py, TILE, TILE);
        if (isTop) {
          ctx.fillStyle = shadeColor(palette.groundTop, 0.12);
          ctx.fillRect(px, py, TILE, 7);
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillRect(px + 4, py + 9, 5, 3);
          ctx.fillRect(px + 24, py + 12, 6, 3);
        } else {
          ctx.fillStyle = shadeColor(palette.groundDark, shade);
          ctx.fillRect(px + 6, py + 8, 9, 7);
          ctx.fillRect(px + 22, py + 20, 11, 8);
        }
      }
    }
  }

  drawSpikes(px, py) {
    const ctx = this.ctx;
    ctx.fillStyle = '#c8ccd4';
    ctx.beginPath();
    for (let i = 0; i < 4; i += 1) {
      const bx = px + i * 10;
      ctx.moveTo(bx, py + TILE);
      ctx.lineTo(bx + 5, py + 12);
      ctx.lineTo(bx + 10, py + TILE);
    }
    ctx.fill();
    ctx.fillStyle = '#8f96a3';
    ctx.fillRect(px, py + TILE - 5, TILE, 5);
  }

  drawPlayer(player, time) {
    const ctx = this.ctx;
    if (player.invincible > 0 && Math.floor(time * 14) % 2 === 0) return;
    const cx = player.cx;
    const feet = player.bottom;
    const squashY = 1 + player.squash;
    const squashX = 1 - player.squash * 0.7;
    ctx.save();
    ctx.translate(cx, feet);
    ctx.scale(squashX * player.facing, squashY);
    // Tail flame, flickering.
    const flick = Math.sin(time * 11) * 3;
    ctx.fillStyle = '#ff9d2e';
    ctx.beginPath();
    ctx.moveTo(-12, -16);
    ctx.quadraticCurveTo(-26 - flick, -26, -14, -34);
    ctx.quadraticCurveTo(-8, -26, -10, -14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.moveTo(-13, -18);
    ctx.quadraticCurveTo(-20, -25, -14, -30);
    ctx.quadraticCurveTo(-10, -24, -11, -17);
    ctx.closePath();
    ctx.fill();
    // Body.
    ctx.fillStyle = '#e86a1c';
    roundRect(ctx, -13, -34, 26, 30, 11);
    ctx.fill();
    ctx.fillStyle = '#ffb37a';
    roundRect(ctx, -9, -14, 18, 10, 5);
    ctx.fill();
    // Ears.
    ctx.fillStyle = '#e86a1c';
    ctx.beginPath();
    ctx.moveTo(-11, -32); ctx.lineTo(-8, -44); ctx.lineTo(-3, -33);
    ctx.moveTo(11, -32); ctx.lineTo(8, -44); ctx.lineTo(3, -33);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.moveTo(-8.5, -34); ctx.lineTo(-7, -40); ctx.lineTo(-4.5, -34);
    ctx.moveTo(8.5, -34); ctx.lineTo(7, -40); ctx.lineTo(4.5, -34);
    ctx.closePath();
    ctx.fill();
    // Eyes and cheek ember.
    ctx.fillStyle = '#2b1a10';
    ctx.beginPath(); ctx.arc(4, -24, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, -24, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(5, -25, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(11, -25, 0.9, 0, Math.PI * 2); ctx.fill();
    // Feet, running.
    const run = Math.abs(player.vx) > 20 && player.onGround ? Math.sin(player.runCycle * 6) * 4 : 0;
    ctx.fillStyle = '#7a3d12';
    ctx.beginPath(); ctx.ellipse(-6 + run, -2, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6 - run, -2, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawGrumble(e, time) {
    const ctx = this.ctx;
    const wob = Math.sin(e.wobble) * 2;
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h);
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.ellipse(0, -13 + wob * 0.4, 17, 13 + wob * 0.3, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.ellipse(-4, -20 + wob * 0.4, 12, 7, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-6, -18, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -18, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1a10';
    ctx.beginPath(); ctx.arc(-5, -18, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -18, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1a10';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -12, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.restore();
  }

  drawFlit(e, time) {
    const ctx = this.ctx;
    const flap = Math.sin(time * 16) * 0.7;
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.fillStyle = '#3b3550';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-20, -10 - flap * 10, -24, 2);
    ctx.quadraticCurveTo(-12, 2, -8, 4);
    ctx.moveTo(6, 0);
    ctx.quadraticCurveTo(20, -10 - flap * 10, 24, 2);
    ctx.quadraticCurveTo(12, 2, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#57507a';
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5e7a';
    ctx.beginPath(); ctx.arc(-3, -2, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -2, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawWisp(e, time) {
    const ctx = this.ctx;
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const pulse = 0.7 + Math.sin(time * 5 + e.t) * 0.3;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26 * pulse);
    glow.addColorStop(0, 'rgba(255,122,60,0.55)');
    glow.addColorStop(1, 'rgba(255,122,60,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, 26 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath(); ctx.arc(cx, cy - 1, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1a10';
    ctx.beginPath(); ctx.arc(cx - 3, cy, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 3, cy, 1.4, 0, Math.PI * 2); ctx.fill();
  }

  drawPickup(p, time) {
    const ctx = this.ctx;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    if (p.kind === 'ember') {
      const spin = Math.abs(Math.cos(time * 3 + p.bob));
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(Math.max(0.25, spin), 1);
      ctx.fillStyle = '#ffb347';
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff6c8';
      ctx.beginPath(); ctx.arc(-2, -2, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (p.kind === 'sunstone') {
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 24);
      glow.addColorStop(0, 'rgba(94,234,255,0.5)');
      glow.addColorStop(1, 'rgba(94,234,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(time * 2 + p.bob) * 0.15);
      ctx.fillStyle = '#5eeaff';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(10, 0); ctx.lineTo(0, 14); ctx.lineTo(-10, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d6fbff';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(5, 0); ctx.lineTo(0, 14); ctx.lineTo(-5, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      const beat = 1 + Math.sin(time * 6 + p.bob) * 0.08;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(beat, beat);
      ctx.fillStyle = '#ff5e7a';
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.bezierCurveTo(-12, -2, -8, -11, 0, -4);
      ctx.bezierCurveTo(8, -11, 12, -2, 0, 9);
      ctx.fill();
      ctx.restore();
    }
  }

  drawPortal(x, y, time, palette) {
    const ctx = this.ctx;
    const cx = x + TILE / 2;
    const baseY = y + TILE;
    const pulse = 0.75 + Math.sin(time * 4) * 0.25;
    const glow = ctx.createRadialGradient(cx, baseY - 46, 6, cx, baseY - 46, 64 * pulse);
    glow.addColorStop(0, 'rgba(255,210,62,0.5)');
    glow.addColorStop(1, 'rgba(255,210,62,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, baseY - 46, 64 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(cx, baseY - 46, 22, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - 46, 13, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.ellipse(cx, baseY - 46, 6, 20 + Math.sin(time * 6) * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Flag.
    ctx.strokeStyle = '#6e4525';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx + 26, baseY); ctx.lineTo(cx + 26, baseY - 78); ctx.stroke();
    ctx.fillStyle = '#ff5e7a';
    ctx.beginPath();
    ctx.moveTo(cx + 26, baseY - 78);
    ctx.lineTo(cx + 52, baseY - 70);
    ctx.lineTo(cx + 26, baseY - 62);
    ctx.closePath(); ctx.fill();
  }

  drawCheckpoint(x, y, lit, time) {
    const ctx = this.ctx;
    const cx = x + TILE / 2;
    const baseY = y + TILE;
    ctx.fillStyle = '#5d4030';
    ctx.fillRect(cx - 3, baseY - 52, 6, 52);
    ctx.fillStyle = lit ? '#ffd23e' : '#8a8f98';
    roundRect(ctx, cx - 11, baseY - 72, 22, 22, 5);
    ctx.fill();
    ctx.fillStyle = lit ? '#fff6c8' : '#c8ccd4';
    ctx.beginPath(); ctx.arc(cx, baseY - 61, 5, 0, Math.PI * 2); ctx.fill();
    if (lit) {
      const glow = ctx.createRadialGradient(cx, baseY - 61, 2, cx, baseY - 61, 30);
      glow.addColorStop(0, 'rgba(255,210,62,0.45)');
      glow.addColorStop(1, 'rgba(255,210,62,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, baseY - 61, 30, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawParticles(particles) {
    const ctx = this.ctx;
    for (const p of particles) {
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  drawHUD(game) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(20,16,28,0.55)';
    roundRect(ctx, 10, 10, VIEW_W - 20, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${game.score}`, 24, 33);
    ctx.fillStyle = '#ffd23e';
    ctx.fillText(`◆ ${game.embersGot}/${game.embersTotal}`, 220, 33);
    ctx.fillStyle = '#5eeaff';
    ctx.fillText(`✦ ${game.gemsGot}`, 330, 33);
    // Hearts on the right, before the timer.
    const heartX0 = VIEW_W - 176;
    for (let i = 0; i < game.maxLives; i += 1) {
      const hx = heartX0 + i * 30;
      const hy = 32;
      ctx.fillStyle = i < game.lives ? '#ff5e7a' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 11, hy - 2, hx - 7, hy - 10, hx, hy - 4);
      ctx.bezierCurveTo(hx + 7, hy - 10, hx + 11, hy - 2, hx, hy + 8);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(game.spec.name, VIEW_W / 2 + 60, 33);
    ctx.textAlign = 'right';
    ctx.fillText(formatTime(game.time), VIEW_W - 24, 33);
    ctx.restore();
  }

  drawBanner(text, sub, alpha) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.fillStyle = 'rgba(20,16,28,0.6)';
    ctx.fillRect(0, VIEW_H / 2 - 62, VIEW_W, 124);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 44px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, VIEW_W / 2, VIEW_H / 2 - 18);
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(sub, VIEW_W / 2, VIEW_H / 2 + 28);
    ctx.restore();
  }

  drawTitle(game, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(20,16,28,0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const bob = Math.sin(time * 2) * 6;
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 72px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EMBER TRAIL', VIEW_W / 2, 150 + bob);
    ctx.fillStyle = '#fff';
    ctx.font = '22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('A tiny fox. Three wild trails. One way home.', VIEW_W / 2, 205 + bob);
    ctx.fillStyle = '#ffb347';
    ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
    const blink = Math.floor(time * 2) % 2 === 0;
    if (blink) ctx.fillText('— Press ENTER to start —', VIEW_W / 2, 300);
    ctx.fillStyle = '#e8e8e8';
    ctx.font = '18px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Move  ← → or A / D      Jump  SPACE / ↑ / W      Pause  P      Mute  M', VIEW_W / 2, 360);
    ctx.fillText('Stomp beasties · gather embers ◆ and sunstones ✦ · reach the golden portal', VIEW_W / 2, 392);
    if (game.best > 0) {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText(`Best score: ${game.best}`, VIEW_W / 2, 440);
    }
    ctx.restore();
  }

  drawClear(game) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(20,16,28,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 52px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LEVEL CLEAR!', VIEW_W / 2, 130);
    ctx.fillStyle = '#fff';
    ctx.font = '24px "Trebuchet MS", Verdana, sans-serif';
    const lines = [
      `Embers  ${game.levelEmbers} × 100  =  ${game.levelEmbers * 100}`,
      `Sunstones  ${game.levelGems} × 500  =  ${game.levelGems * 500}`,
      `Time bonus  ${game.timeBonus}`,
      `Level score  ${game.levelScore}`,
    ];
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 200 + i * 36));
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`Total score  ${game.score}`, VIEW_W / 2, 360);
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Press ENTER for the next trail', VIEW_W / 2, 420);
    ctx.restore();
  }

  drawOver(game) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(24,8,12,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#ff5e7a';
    ctx.font = 'bold 56px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', VIEW_W / 2, 170);
    ctx.fillStyle = '#fff';
    ctx.font = '24px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`Score  ${game.score}   ·   Level  ${game.levelIndex + 1} — ${game.spec.name}`, VIEW_W / 2, 240);
    ctx.fillText('Pip the ember-fox fades out… but embers always relight.', VIEW_W / 2, 280);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
    if (Math.floor(game.time * 2) % 2 === 0) ctx.fillText('— Press ENTER to try again —', VIEW_W / 2, 350);
    ctx.restore();
  }

  drawWin(game) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(20,16,28,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 52px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU MADE IT HOME!', VIEW_W / 2, 130);
    ctx.fillStyle = '#fff';
    ctx.font = '24px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`Pip crossed all three trails.`, VIEW_W / 2, 190);
    ctx.fillText(`Embers ${game.embersGot}   Sunstones ${game.gemsGot}   Time ${formatTime(game.totalTime)}`, VIEW_W / 2, 232);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 30px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`Final score  ${game.score}`, VIEW_W / 2, 290);
    if (game.score >= game.best && game.score > 0) {
      ctx.fillStyle = '#5eeaff';
      ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('★ NEW BEST SCORE ★', VIEW_W / 2, 332);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Press ENTER to play again', VIEW_W / 2, 400);
    ctx.restore();
  }

  drawPause() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(20,16,28,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2 - 10);
    ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Press P to keep playing', VIEW_W / 2, VIEW_H / 2 + 34);
    ctx.restore();
  }
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function shadeColor(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(((n >> 16) & 255) + amount * 255, 0, 255);
  const g = clamp(((n >> 8) & 255) + amount * 255, 0, 255);
  const b = clamp((n & 255) + amount * 255, 0, 255);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
