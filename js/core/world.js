/* js/core/world.js — live palette (eased between the day and night themes) written to CSS variables. */
import { S } from './state.js';
import { CONFIG } from '../../config/config.js';
import { mix3, rgb } from './util.js';

let lastD = -1;
export function updatePalette() {
  const P = CONFIG.palette;
  const r = S.reduced ? 1 : 1 - Math.pow(1 - 0.06, S.dt * 60);
  S.d += (S.target - S.d) * r; if (Math.abs(S.d - S.target) < 0.002) S.d = S.target;
  S.bg = mix3(P.light.bg, P.dark.bg, S.d); S.ink = mix3(P.light.ink, P.dark.ink, S.d);
  S.blue = mix3(P.light.blue, P.dark.blue, S.d); S.big = mix3(P.light.big, P.dark.big, S.d);
  S.inkc = rgb(S.ink);
  if (S.d !== lastD) {                                     // only touch the DOM while a transition is running
    lastD = S.d;
    const rs = document.documentElement.style;
    rs.setProperty('--ink', S.inkc); rs.setProperty('--blue', rgb(S.blue)); rs.setProperty('--big', rgb(S.big)); rs.setProperty('--bg', rgb(S.bg));
    rs.setProperty('--ink-rgb', S.ink.map(v => v | 0).join(',')); rs.setProperty('--blue-rgb', S.blue.map(v => v | 0).join(','));
    rs.setProperty('--bg-rgb', S.bg.map(v => v | 0).join(','));
  }
}
