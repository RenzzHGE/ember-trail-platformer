// Ember Trail — configuration: every tuning number lives here so the game
// can be balanced from one place. No code in this file reads the network.
export const TILE = 40;
export const VIEW_W = 960;
export const VIEW_H = 540;
export const GRAVITY = 1800;
export const MOVE_SPEED = 265;
export const JUMP_SPEED = 770;
export const MAX_FALL = 920;
export const COYOTE_TIME = 0.12;
export const JUMP_BUFFER = 0.12;
export const PLAYER_W = 28;
export const PLAYER_H = 36;
export const MAX_LIVES = 3;
export const SCORE_EMBER = 100;
export const SCORE_SUNSTONE = 500;
export const SCORE_STOMP = 200;
export const CLEAR_BONUS = 1000;
export const LEVEL_COUNT = 3;

// Palette per level: sky top/bottom, hills, tile colours, accent.
export const PALETTES = [
  {
    name: 'Mosswood Glade',
    skyTop: '#7ec8f7', skyBottom: '#dff6d8',
    hillFar: '#8fce8a', hillNear: '#5aa864',
    groundTop: '#6abe4e', groundBody: '#8a5a33', groundDark: '#6e4525',
    platformTop: '#7ed957', platformBody: '#a9713f',
    accent: '#ffb347', text: '#2c4a1e',
  },
  {
    name: 'Cinder Caves',
    skyTop: '#1c1430', skyBottom: '#4a2b4d',
    hillFar: '#33254d', hillNear: '#241a38',
    groundTop: '#9a7b4f', groundBody: '#4c3a52', groundDark: '#382a3d',
    platformTop: '#b08d57', platformBody: '#5d4a68',
    accent: '#ff7a3c', text: '#f5e6c8',
  },
  {
    name: 'Sky Ruins',
    skyTop: '#ff9e6d', skyBottom: '#ffe3b3',
    hillFar: '#e8a56b', hillNear: '#d18a4e',
    groundTop: '#e8dcc8', groundBody: '#b09a7a', groundDark: '#8a755a',
    platformTop: '#f2e6cf', platformBody: '#c2ab84',
    accent: '#ff5e7a', text: '#5a3a1e',
  },
];
