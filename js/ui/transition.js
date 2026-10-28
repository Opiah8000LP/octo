/* js/ui/transition.js — glitch-slice page wipe. Strips of the page colour slam across with the destination's name; the page swaps while covered. */
import { S } from '../core/state.js';
import { h, sleep } from '../core/util.js';
import * as sfx from '../audio/sfx.js';

const N = 8;
const strips = Array.from({ length: N }, () => h('i'));
const label = h('b', { class: 'wipe-label' });
const el = h('div', { class: 'wipe', 'aria-hidden': 'true' }, strips, label);
document.body.appendChild(el);

export async function cover(text) {
  if (S.reduced) { el.classList.add('fade', 'on'); await sleep(140); return; }
  label.textContent = text; el.className = 'wipe on';
  sfx.play(Math.random() < 0.34 ? 'whoosh_glitch' : 'whoosh_a');
  strips.forEach((s, i) => { s.style.transition = 'none'; s.style.transform = 'scaleX(0)'; s.style.transformOrigin = i % 2 ? 'right' : 'left'; });
  el.offsetWidth;
  strips.forEach((s, i) => { s.style.transition = `transform .32s cubic-bezier(.7,0,.2,1) ${i * 24}ms`; s.style.transform = 'scaleX(1)'; });
  label.classList.add('show');
  await sleep(320 + N * 24 + 40);
}
export async function reveal() {
  if (S.reduced) { el.classList.remove('on'); await sleep(160); el.className = 'wipe'; return; }
  sfx.play('whoosh_b', { vol: 0.8 });
  strips.forEach((s, i) => { s.style.transformOrigin = i % 2 ? 'left' : 'right'; s.style.transition = `transform .36s cubic-bezier(.7,0,.2,1) ${(N - i) * 22}ms`; s.style.transform = 'scaleX(0)'; });
  label.classList.remove('show');
  await sleep(360 + N * 22 + 40);
  el.className = 'wipe';
}
