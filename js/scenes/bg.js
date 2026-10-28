/* js/scenes/bg.js — owns the one full-screen canvas. Picks the scene for the current page and draws the overlay on top. */
import { S } from '../core/state.js';
import { mk } from '../core/util.js';
import { drawDark } from './dark.js';
import { drawLight } from './light.js';
import { drawOverlay } from './overlay.js';
import { drawArchive, drawStorm, drawSignal, drawLog } from './pages.js';

export const cv = mk('canvas'); cv.id = 'bg'; cv.setAttribute('aria-hidden', 'true');
export const ctx = cv.getContext('2d', { alpha: false });
const cbs = []; export const onResize = f => { cbs.push(f); };
let scene = 'home';
export const setScene = s => { scene = s; };

export function resize() {
  S.DPR = Math.min(window.devicePixelRatio || 1, S.q < 0.7 ? 1 : 1.5);
  S.W = innerWidth; S.H = innerHeight;
  cv.width = (S.W * S.DPR) | 0; cv.height = (S.H * S.DPR) | 0;
  document.documentElement.style.setProperty('--vh', innerHeight * 0.01 + 'px');
  cbs.forEach(f => f());
}
addEventListener('resize', resize);

export function draw(dt) {
  ctx.setTransform(S.DPR, 0, 0, S.DPR, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = `rgb(${S.bg[0] | 0},${S.bg[1] | 0},${S.bg[2] | 0})`; ctx.fillRect(0, 0, S.W, S.H);
  ctx.textAlign = 'left'; ctx.lineWidth = 1;
  if (scene === 'home') {
    if (1 - S.d > 0.01) drawLight(ctx, 1 - S.d);
    if (S.d > 0.01) drawDark(ctx, S.d);
  } else if (scene === 'portfolio') drawArchive(ctx);
  else if (scene === 'services') drawStorm(ctx);
  else if (scene === 'credits') drawLog(ctx);
  else drawSignal(ctx);
  drawOverlay(ctx, dt);
}
