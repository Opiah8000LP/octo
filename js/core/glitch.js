/* js/core/glitch.js — glitch energy + the photosensitivity safety valve.
   Everything "flashy" goes through kick() / flash() so rates stay capped (and obey the accessibility settings). */
import { S } from './state.js';
import { CONFIG } from '../../config/config.js';

let lastKick = -9, lastFlash = -9;
const CAP = CONFIG.safeMode ? 1.0 : 1.4;

export function kick(v = 0.5) {
  if (S.noFlash) v *= 0.05; else if (S.reduced) v *= 0.12;
  if (S.t - lastKick < 0.09) v *= 0.35;
  lastKick = S.t;
  S.g = Math.min(CAP, S.g + v * (0.35 + S.chaos * 0.9));
}
export function flash(amount = 1) {
  const gap = CONFIG.safeMode ? 0.34 : 0.15;
  if (S.noFlash || S.t - lastFlash < gap) return false;
  lastFlash = S.t; S.flash = Math.min(1, amount); return true;
}
export function update(dt) {
  S.g *= S.reduced ? 0.8 : Math.pow(0.92, dt * 60);
  S.flash *= Math.pow(0.86, dt * 60);
}
