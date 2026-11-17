// Ember Trail — small helpers: clamping, rectangles and a seeded random
// generator so screenshot scenes are reproducible from a seed.
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Overlap test for two axis-aligned rectangles. */
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** A tiny deterministic RNG (mulberry32) so a seed always gives one world. */
export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic per-tile shade so the same tile always looks the same. */
export function tileShade(tx, ty) {
  let h = (tx * 374761393 + ty * 668265263) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return (h % 100) / 100;
}
