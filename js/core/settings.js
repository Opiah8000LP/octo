/* js/core/settings.js — every visitor preference, saved on their device (localStorage) and applied to <body>. */
import { S } from './state.js';
import { store } from './util.js';
import { CONFIG } from '../../config/config.js';
import { emit } from './bus.js';

const D = {
  theme: 'auto',                      // 'auto' (day = light, night = dark) | 'light' | 'dark'
  reduceFx: S.osReduced,              // reduce visual effects (defaults to the OS "reduce motion" choice)
  noFlash: false,                     // no glitch bursts / flashes at all
  noShake: false,                     // no screen shake / jitter
  plainType: false,                   // readable text (no stretched / negative-spaced type)
  bigText: false,
  highContrast: false,
  noCursor: false,                    // use the normal mouse cursor
  sfx: true, sfxVol: 0.7,
  typeSounds: true,                   // tiny typing ticks in MOCK BOT
  bot: true,                          // show MOCK BOT
  schizo: false
};
export const set = {};
for (const k in D) set[k] = store.get('s:' + k, D[k]);

export function applyAll() {
  const b = document.body, c = b.classList;
  S.reduced = !!set.reduceFx; S.noFlash = !!set.noFlash || S.reduced; S.schizo = !!set.schizo;
  c.toggle('reduced-fx', S.reduced); c.toggle('no-flash', S.noFlash); c.toggle('no-shake', !!set.noShake || S.reduced);
  c.toggle('plain-type', !!set.plainType); c.toggle('big-text', !!set.bigText); c.toggle('hc', !!set.highContrast);
  c.toggle('no-cursor', !!set.noCursor || S.coarse); c.toggle('schizo', S.schizo); c.toggle('bot-off', !set.bot);
}
export function get(k) { return set[k]; }
export function put(k, v) {
  if (!(k in D)) return;
  set[k] = v; store.set('s:' + k, v); applyAll(); emit('setting', { key: k, value: v }); emit('setting:' + k, v);
}
export function resetAll() { for (const k in D) { set[k] = D[k]; store.del('s:' + k); } store.del('lang'); applyAll(); emit('setting', { key: '*' }); }
export const defaults = D;

/* ---- theme: day = light (default), night = dark.  'auto' follows the visitor's local clock. ---- */
const TH = CONFIG.theme;
export const isDay = (d = new Date()) => { const h = d.getHours() + d.getMinutes() / 60; return h >= TH.dayStart && h < TH.nightStart; };
export function resolveTheme() { return set.theme === 'auto' ? (isDay() ? 'light' : 'dark') : set.theme; }
export function applyTheme(instant = false) {
  const th = resolveTheme(), root = document.documentElement;
  S.target = th === 'dark' ? 1 : 0; if (instant) S.d = S.target;
  root.classList.toggle('t-dark', th === 'dark'); root.classList.toggle('t-light', th === 'light');
  root.dataset.theme = th;
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = th === 'dark' ? '#0a0913' : '#ececec';
  emit('theme', th);
}
export function setTheme(mode) { put('theme', mode); applyTheme(false); }
export function toggleTheme() { setTheme(resolveTheme() === 'dark' ? 'light' : 'dark'); }
setInterval(() => { if (set.theme === 'auto') { const was = S.target; applyTheme(false); if (was !== S.target) emit('theme:auto', resolveTheme()); } }, 60000);
