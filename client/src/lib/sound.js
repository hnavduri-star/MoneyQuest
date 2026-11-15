/** Tiny synthesised sound effects (Web Audio). No audio files, nothing fetched. */
let ctx;
let enabled = true;
export const setSoundEnabled = (v) => (enabled = v);

function tone(freq, start, dur, type = 'sine', gain = 0.12) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime + start);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}
const SOUNDS = {
  tap: () => tone(660, 0, 0.06, 'triangle', 0.06),
  correct: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.18, 'triangle')),
  wrong: () => tone(330, 0, 0.18, 'sine', 0.06),
  coin: () => [988, 1319].forEach((f, i) => tone(f, i * 0.07, 0.12, 'square', 0.05)),
  levelUp: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle')),
  badge: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.22, 'sine', 0.1)),
  hit: () => tone(180, 0, 0.15, 'sawtooth', 0.08),
  tick: () => tone(1200, 0, 0.03, 'square', 0.03),
};
export function play(name) {
  if (!enabled) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    SOUNDS[name]?.();
  } catch {
    /* sound is optional */
  }
}
let haptics = true;
export const setHapticsEnabled = (v) => (haptics = v);
export function buzz(pattern = 20) {
  if (haptics && navigator.vibrate) navigator.vibrate(pattern);
}
