// Ember Trail — sound effects, synthesised live with WebAudio. No audio
// files are shipped: every effect is an oscillator (and one noise burst)
// so the game stays a handful of static files and plays offline.
export class SoundBank {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
  }

  /** Create the context on first user gesture; safe to call any time. */
  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.context = new AC();
      this.master = this.context.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.context.destination);
    } catch (e) {
      this.context = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
    return this.muted;
  }

  /** One oscillator note, optionally sliding to another frequency. */
  tone(freq, dur, type, vol, delay = 0, slideTo = 0) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** Short filtered noise burst, for stomps and landings. */
  noise(dur, vol, delay = 0) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + delay;
    const len = Math.max(1, Math.floor(this.context.sampleRate * dur));
    const buf = this.context.createBuffer(1, len, this.context.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.context.createBufferSource();
    src.buffer = buf;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  jump() { this.tone(280, 0.16, 'square', 0.16, 0, 620); }
  coin() { this.tone(988, 0.09, 'sine', 0.22); this.tone(1319, 0.16, 'sine', 0.2, 0.07); }
  gem() {
    this.tone(784, 0.1, 'sine', 0.2);
    this.tone(1047, 0.1, 'sine', 0.2, 0.08);
    this.tone(1568, 0.22, 'sine', 0.2, 0.16);
  }
  stomp() { this.noise(0.12, 0.3); this.tone(180, 0.14, 'triangle', 0.25, 0, 60); }
  hurt() { this.tone(320, 0.28, 'sawtooth', 0.2, 0, 90); }
  checkpoint() { this.tone(523, 0.12, 'sine', 0.2); this.tone(784, 0.2, 'sine', 0.2, 0.1); }
  portal() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'sine', 0.2, i * 0.09));
  }
  clear() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.2, i * 0.1));
  }
  win() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.2, i * 0.13));
  }
  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.24, 'sawtooth', 0.16, i * 0.16));
  }
  click() { this.tone(660, 0.06, 'square', 0.12); }
  land() { this.noise(0.05, 0.1); }
}
