/* js/ui/gate.js — TAP TO ENTER. Browsers only allow sound after a real tap, so this is that tap.
   Alive on purpose: a little 3D wire creature spins behind the text, letters scramble, and it can also be entered silently. */
import { CONFIG } from '../../config/config.js';
import { S } from '../core/state.js';
import { h, scramble } from '../core/util.js';
import { bindText } from '../core/i18n.js';
import { SHAPES, drawWire } from '../shapes/wire.js';

export function init(onEnter) {
  const cv = h('canvas', { class: 'gate-cv', 'aria-hidden': 'true' });
  const g = h('span', { class: 'g' }), small = h('small'), alt = h('button', { class: 'gate-alt', type: 'button' });
  bindText(g, CONFIG.gate.text); bindText(small, CONFIG.gate.hint); bindText(alt, CONFIG.gate.silent);
  const prog = h('i', { class: 'gate-prog' });
  const btn = h('button', { class: 'gate-btn', type: 'button', 'aria-label': 'Enter the site' }, g, small);
  const root = h('div', { class: 'gate', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Enter' },
    cv, h('div', { class: 'gate-top', 'aria-hidden': 'true' }, '[ ', CONFIG.site.brand.toLowerCase(), ' ]'), btn, alt, prog);
  document.body.appendChild(root);

  /* animation: wireframes + dust, very light */
  const c = cv.getContext('2d'); let raf = 0, alive = true, t0 = performance.now();
  const dust = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() }));
  const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
  size(); addEventListener('resize', size);
  const dark = document.documentElement.classList.contains('t-dark');
  (function loop(ms) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const t = (ms - t0) / 1000, W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
    const ink = dark ? '255,255,255' : '18,18,26', blue = dark ? '165,150,255' : '91,120,238';
    c.fillStyle = `rgba(${ink},.5)`;
    dust.forEach(p => { const x = ((p.x + t * 0.01 * (0.3 + p.z)) % 1) * W, y = p.y * H; c.fillRect(x, y, 1 + p.z * 2, 1 + p.z * 2); });
    c.lineWidth = 1.2; c.strokeStyle = `rgba(${blue},.9)`;
    drawWire(c, SHAPES.ico, W / 2, H / 2, Math.min(W, H) * 0.3, t * 0.4, t * 0.6, 0);
    c.strokeStyle = `rgba(${ink},.8)`; drawWire(c, SHAPES.octa, W / 2, H / 2, Math.min(W, H) * 0.12, -t * 0.9, t * 1.1, 0);
    c.beginPath(); c.arc(W / 2, H / 2, Math.min(W, H) * (0.34 + 0.01 * Math.sin(t * 2)), 0, 6.283); c.stroke();
  })(t0);
  const sc = setInterval(() => { if (!S.reduced) scramble(g, bindTextValue(), 380); }, 2600);
  const bindTextValue = () => { const v = CONFIG.gate.text; return typeof v === 'string' ? v : (v[document.documentElement.lang] || v.en); };

  let done = false;
  const enter = silent => {
    if (done) return; done = true; S.gated = false; clearInterval(sc);
    root.classList.add('out'); document.body.classList.add('ready');
    onEnter && onEnter({ silent });
    setTimeout(() => { alive = false; cancelAnimationFrame(raf); root.remove(); }, 650);
  };
  btn.addEventListener('click', () => enter(false)); alt.addEventListener('click', () => enter(true));
  setTimeout(() => btn.focus({ preventScroll: true }), 80);
  return { progress: p => { prog.style.transform = `scaleX(${p})`; }, root };
}
