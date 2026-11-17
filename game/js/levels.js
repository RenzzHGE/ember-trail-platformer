// Ember Trail — the three levels. Each level is data: ground ranges, floating
// platforms, hazards, pickups and spawns, all in tile coordinates. A builder
// below turns the data into the solid tile grid the physics reads.
import { TILE } from './config.js';

export const TILE_SOLID = 1;
export const TILE_SPIKE = 2;

export const LEVELS = [
  {
    name: 'Mosswood Glade',
    subtitle: 'Follow the ember trail home',
    par: 75,
    width: 100,
    height: 15,
    ground: [[0, 24], [28, 50], [54, 78], [82, 99]],
    platforms: [
      { x: 10, y: 10, w: 7 }, { x: 30, y: 9, w: 7 }, { x: 40, y: 7, w: 5 },
      { x: 58, y: 10, w: 7 }, { x: 70, y: 8, w: 7 }, { x: 86, y: 10, w: 5 },
    ],
    spikes: [[20, 12], [21, 12]],
    coins: [
      [12, 9], [13, 9], [14, 9], [26, 11], [32, 8], [33, 8], [42, 6],
      [52, 11], [60, 9], [61, 9], [72, 7], [80, 11], [88, 9], [95, 11],
    ],
    sunstones: [[42, 5]],
    hearts: [[73, 6]],
    checkpoints: [48],
    grumbles: [15, 35, 65, 88],
    bats: [[60, 8]],
    wisps: [],
    spawn: [2, 12],
    portal: [96, 12],
  },
  {
    name: 'Cinder Caves',
    subtitle: 'Mind the thorns, mind the dark',
    par: 95,
    width: 110,
    height: 15,
    ground: [[0, 18], [22, 40], [44, 62], [66, 86], [90, 109]],
    platforms: [
      { x: 8, y: 10, w: 6 }, { x: 24, y: 9, w: 6 }, { x: 34, y: 7, w: 5 },
      { x: 46, y: 10, w: 6 }, { x: 56, y: 8, w: 5 }, { x: 68, y: 10, w: 6 },
      { x: 78, y: 7, w: 5 }, { x: 92, y: 10, w: 6 }, { x: 100, y: 8, w: 5 },
    ],
    spikes: [[12, 12], [13, 12], [36, 12], [58, 12], [59, 12], [80, 12]],
    coins: [
      [10, 9], [11, 9], [20, 11], [26, 8], [27, 8], [36, 6], [42, 11],
      [48, 9], [49, 9], [58, 7], [64, 11], [70, 9], [71, 9], [80, 6],
      [88, 11], [94, 9], [95, 9], [102, 7], [107, 11],
    ],
    sunstones: [[36, 5], [80, 5]],
    hearts: [[57, 6]],
    checkpoints: [38, 84],
    grumbles: [10, 30, 52, 74, 96],
    bats: [[48, 8], [70, 7], [98, 8]],
    wisps: [[60, 6]],
    spawn: [2, 12],
    portal: [106, 12],
  },
  {
    name: 'Sky Ruins',
    subtitle: 'The last climb, above the clouds',
    par: 120,
    width: 120,
    height: 15,
    ground: [[0, 14], [18, 34], [38, 54], [58, 74], [78, 94], [98, 119]],
    platforms: [
      { x: 6, y: 10, w: 6 }, { x: 16, y: 8, w: 4 }, { x: 24, y: 9, w: 6 },
      { x: 30, y: 7, w: 5 }, { x: 36, y: 8, w: 4 }, { x: 44, y: 10, w: 6 },
      { x: 50, y: 7, w: 5 }, { x: 56, y: 8, w: 4 }, { x: 64, y: 10, w: 6 },
      { x: 70, y: 8, w: 5 }, { x: 76, y: 8, w: 4 }, { x: 84, y: 10, w: 6 },
      { x: 90, y: 7, w: 5 }, { x: 96, y: 8, w: 4 }, { x: 104, y: 10, w: 6 },
      { x: 110, y: 8, w: 5 },
    ],
    spikes: [[10, 12], [26, 12], [46, 12], [66, 12], [86, 12], [106, 12]],
    coins: [
      [8, 9], [9, 9], [17, 7], [26, 8], [27, 8], [32, 6], [37, 7],
      [46, 9], [47, 9], [52, 6], [57, 7], [66, 9], [67, 9], [72, 7],
      [77, 7], [86, 9], [87, 9], [92, 6], [97, 7], [106, 9], [107, 9],
      [112, 7], [117, 11],
    ],
    sunstones: [[32, 5], [92, 5]],
    hearts: [[51, 5]],
    checkpoints: [52, 92],
    grumbles: [8, 28, 48, 68, 88, 108],
    bats: [[26, 7], [56, 7], [86, 7], [106, 7]],
    wisps: [[40, 6], [80, 6], [100, 6]],
    spawn: [2, 12],
    portal: [116, 12],
  },
];

/** Turn a level spec into the tile grid the physics and renderer read. */
export function buildLevelGrid(spec) {
  const grid = [];
  for (let y = 0; y < spec.height; y += 1) {
    grid.push(new Array(spec.width).fill(0));
  }
  for (const [x0, x1] of spec.ground) {
    for (let x = x0; x <= x1; x += 1) {
      grid[13][x] = TILE_SOLID;
      grid[14][x] = TILE_SOLID;
    }
  }
  for (const p of spec.platforms) {
    for (let x = p.x; x < p.x + p.w; x += 1) {
      if (x >= 0 && x < spec.width) grid[p.y][x] = TILE_SOLID;
    }
  }
  for (const [x, y] of spec.spikes) {
    grid[y][x] = TILE_SPIKE;
  }
  return grid;
}

/** Tile at (tx, ty): 0 empty, 1 solid, 2 spike. Edges and the floor are solid. */
export function tileAt(grid, spec, tx, ty) {
  if (tx < 0 || tx >= spec.width) return TILE_SOLID;
  if (ty < 0) return 0;
  if (ty >= spec.height) return TILE_SOLID;
  return grid[ty][tx];
}

export function tileIsSolid(grid, spec, tx, ty) {
  return tileAt(grid, spec, tx, ty) === TILE_SOLID;
}

/** Pixel centre of a tile coordinate. */
export function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}
