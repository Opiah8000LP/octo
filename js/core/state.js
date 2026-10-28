/* js/core/state.js — the single shared state object every module reads.
   Audio features (S.a) are written by audio/engine.js each frame. */
import { CONFIG } from '../../config/config.js';
const P = CONFIG.palette;

export const S = {
  W: 0, H: 0, DPR: 1,
  t: 0, dt: 0.016,
  osReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  reduced: false,            // effective "reduce visual effects" (setting OR OS) — set by settings.js
  noFlash: false,            // no glitch bursts / flashes
  coarse: matchMedia('(pointer: coarse)').matches,
  q: 1,                      // adaptive quality 1 | .7 | .5 (lowered automatically when frames get slow)

  /* themes: d = 1 dark/night, 0 light/day (eased); target = where it is heading */
  d: 0, target: 0,

  /* chaos controls */
  g: 0, chaos: 0.5, calm: 0, flash: 0,
  spin: 0, spinV: 0, zoom: 0, zoomT: 0,

  mouse: { x: innerWidth / 2, y: innerHeight / 2 },
  hub: { x: 0, y: 0 }, hubFx: 0.5,
  scroll: 0,

  bg: P.light.bg.slice(), ink: P.light.ink.slice(), blue: P.light.blue.slice(), big: P.light.big.slice(),
  inkc: 'rgb(18,18,26)',

  a: { bass: 0, mid: 0, high: 0, level: 0, beat: 0, tick: 0, lowN: 0, tickN: 0, playing: false, real: false, freq: null },

  gated: true,
  route: '',
  schizo: false
};
