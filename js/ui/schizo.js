/* js/ui/schizo.js — the ominous toggle. Creatures peek in from the edges, quiet wrong noises, text slips, the dark leans in.
   Slow fades only (no strobing), sounds stay low, and it respects the accessibility settings. */
import { CONFIG } from '../../config/config.js';
import { S } from '../core/state.js';
import { h, rnd, pick, asset } from '../core/util.js';
import { on, emit } from '../core/bus.js';
import * as settings from '../core/settings.js';
import * as sfx from '../audio/sfx.js';
import { kick } from '../core/glitch.js';

const Z = CONFIG.schizo;
let timer = 0, vig, on_ = false;

function creature() {
  const name = pick(Z.creatures), size = rnd(90, S.W < 700 ? 190 : 300);
  const edge = pick(['l', 'r', 'b', 't']), el = h('img', { class: 'sz-creature e-' + edge, src: asset(`assets/creatures/${name}.png`), alt: '', 'aria-hidden': 'true', draggable: false });
  el.style.width = size + 'px';
  if (edge === 'l' || edge === 'r') el.style.top = rnd(5, 70) + '%'; else el.style.left = rnd(5, 85) + '%';
  document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
  if (Math.random() < 0.35) emit('schizo:creature', name);
}
function slip() {
  const pool = $$('h1,h2,h3,.lab,.ml,.pl-title,.big i,.corner span').filter(e => e.children.length === 0 && e.textContent.trim() && e.offsetParent !== null);
  if (!pool.length) return; const e = pick(pool), old = e.textContent; e.textContent = pick(Z.words);
  setTimeout(() => { if (e.isConnected && e.textContent !== old) e.textContent = old; }, rnd(500, 1300));
}
function dark() { vig.classList.add('on'); setTimeout(() => vig.classList.remove('on'), rnd(1800, 3600)); }
function tick() {
  if (!on_) return;
  const r = Math.random(), calm = S.reduced ? 0.5 : 1;
  if (r < 0.34) creature(); else if (r < 0.58) sfx.play(pick(Z.sounds), { vol: 0.55 * calm, force: false }); else if (r < 0.74) slip(); else if (r < 0.88) dark();
  else { kick(0.5); sfx.play('sz_static', { vol: 0.35 }); }
  if (Math.random() < 0.18) emit('schizo:event');
  timer = setTimeout(tick, rnd(2200, 6500) * (S.reduced ? 1.8 : 1));
}
function start() {
  if (on_) return; on_ = true; if (!vig) { vig = h('div', { class: 'sz-vig', 'aria-hidden': 'true' }); document.body.appendChild(vig); }
  sfx.preload([...Z.sounds, 'sz_static']); sfx.playNow('sz_drone', { vol: 0.7 }); emit('schizo:on'); timer = setTimeout(tick, 1200);
}
function stop() { if (!on_) return; on_ = false; clearTimeout(timer); $$('.sz-creature').forEach(e => e.remove()); emit('schizo:off'); }
export function init() { on('setting:schizo', v => (v ? start() : stop())); if (settings.get('schizo')) { document.body.classList.add('schizo'); } }
export const resume = () => { if (settings.get('schizo')) start(); };
