// Ember Trail — keyboard input. Tracks held keys and edge-triggered
// presses (jump buffering reads the press edge, not the held state).
export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this.onAnyKey = null;
    this.onConfirm = null;
    this.onPause = null;
    this.onMute = null;
    window.addEventListener('keydown', (e) => this.keyDown(e));
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    window.addEventListener('blur', () => { this.held.clear(); this.pressed.clear(); });
  }

  keyDown(e) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) {
      this.pressed.add(e.code);
      if (this.onAnyKey) this.onAnyKey(e.code);
      if (e.code === 'Enter' || e.code === 'Space') {
        if (this.onConfirm) this.onConfirm();
      }
      if (e.code === 'KeyP') {
        if (this.onPause) this.onPause();
      }
      if (e.code === 'KeyM') {
        if (this.onMute) this.onMute();
      }
    }
    this.held.add(e.code);
  }

  /** -1 left, 0 none, +1 right. */
  moveAxis() {
    const left = this.held.has('ArrowLeft') || this.held.has('KeyA');
    const right = this.held.has('ArrowRight') || this.held.has('KeyD');
    if (left && !right) return -1;
    if (right && !left) return 1;
    return 0;
  }

  jumpHeld() {
    return this.held.has('Space') || this.held.has('ArrowUp') || this.held.has('KeyW');
  }

  jumpPressed() {
    return this.pressed.has('Space') || this.pressed.has('ArrowUp') || this.pressed.has('KeyW');
  }

  /** Clear edge presses; called once per fixed step. */
  endStep() {
    this.pressed.clear();
  }
}
