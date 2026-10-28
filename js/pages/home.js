/* js/pages/home.js — HOME. The original contact piece, grown up: the giant mirrored title, the hub, the draggable 3D nodes
   (now one per page), then — scrolling over it — who DWEEB is, the GoatCounter visitor count, and a live preview of every page. */
import { CONFIG } from '../../config/config.js';
import { S } from '../core/state.js';
import { h, rnd, pick, clamp, GL, scramble } from '../core/util.js';
import { TT, tx } from '../core/i18n.js';
import { kick } from '../core/glitch.js';
import * as sfx from '../audio/sfx.js';
import { setNodes } from '../scenes/overlay.js';
import * as goat from '../core/goat.js';
import { footer } from '../ui/footer.js';
import { href } from '../ui/nav.js';

const C = CONFIG.home;
const NAV = CONFIG.nav.find(n => n.route === '');

export default {
  id: 'home', scene: 'home', title: NAV.label,
  async mount(ctx) {
    const root = ctx.el; root.classList.add('home');
    /* ---------- hero: giant title, hub, ring, nodes ---------- */
    const word = CONFIG.site.name.toUpperCase(), letters = [];
    const big = pos => { const d = h('div', { class: 'big ' + pos, 'aria-hidden': 'true' }); [...word].forEach(ch => { const i = h('i', { dataset: { c: ch } }, ch); letters.push(i); d.appendChild(i); }); return d; };
    const bigs = h('div', { class: 'bigs' }, big('top'), big('bot'));
    const hub = h('div', { class: 'hub', 'aria-hidden': 'true' }, h('b'));
    const ring = h('div', { class: 'ring', 'aria-hidden': 'true' }, h('div'), h('span', { class: 'rs' }, TT(C.ringWords[0])), h('span', { class: 'rr' }, TT(C.ringWords[1])), h('hr'));
    const nodesLayer = h('nav', { class: 'nodes', 'aria-label': 'Pages' });
    const note = h('p', { class: 'note' }, TT(CONFIG.contact.note));
    const cue = h('button', { class: 'cue', type: 'button' }, h('span', {}, TT(C.scrollCue)), h('i'));
    cue.addEventListener('click', () => window.scrollTo({ top: innerHeight * 0.95, behavior: S.reduced ? 'auto' : 'smooth' }));
    const hero = h('section', { class: 'hero', 'aria-label': CONFIG.site.brand }, bigs, hub, ring, nodesLayer, note, cue,
      h('h1', { class: 'sr-only' }, CONFIG.site.name, ' — ', TT(CONFIG.site.tagline)));

    const items = CONFIG.nav.filter(n => n.route !== '');
    const nodes = items.map((it, i) => {
      const lab = h('span', { class: 'lab' }, TT(it.label)), sub = h('span', { class: 'sub' }, TT(it.sub)), txt = h('span', { class: 'txt' }, lab, sub);
      const a = h('a', { class: 'node', href: href(it.route), dataset: { route: it.route }, draggable: false }, h('span', { class: 'sq' }), txt);
      nodesLayer.appendChild(a);
      return { it, el: a, txt, lab, x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, side: 1, rot: rnd(-5, 5), depth: (i % 3) - 1, placed: false, down: null, drag: false, moved: false, hov: false };
    });
    const proxy = nodes.map(() => ({ x: 0, y: 0, side: 1 })); setNodes(proxy); ctx.cleanup(() => setNodes([]));

    const layout = () => {
      const { W, H } = S, n = nodes.length, land = H < 520 && W > H, narrow = W < 700;
      S.hubFx = land ? 0.3 : 0.5; S.hub.x = W * S.hubFx; S.hub.y = H * 0.47;
      nodes.forEach((o, i) => {
        const side = i % 2 ? 1 : -1, spread = 0.3 + 0.1 * Math.sin(i * 1.9 + 0.5), row = (i + 0.5) / n;
        o.side = side; o.hx = W * S.hubFx + side * W * (land ? 0.11 + 0.04 * Math.sin(i * 1.9) : (narrow ? 0.27 : spread));
        o.hy = H * (narrow ? 0.15 : 0.17) + H * 0.44 * row; o.el.classList.toggle('rt', side > 0);
        if (!o.placed) { o.x = S.hub.x + rnd(-40, 40); o.y = S.hub.y + rnd(-40, 40); o.placed = true; }
        if (o.userMoved) { o.hx = o.ux * W; o.hy = o.uy * H; }
      });
      const rs = Math.min(W * 0.46, 300), r = ring.firstChild;
      r.style.cssText = `left:${-rs / 2}px;top:${-rs / 2}px;width:${rs}px;height:${rs}px`;
      ring.querySelector('.rs').style.cssText = `left:${-rs * 0.36}px;top:${-rs * 0.2}px`; ring.querySelector('.rr').style.cssText = `left:${-rs * 0.4}px;top:${rs * 0.02}px`;
      ring.querySelector('hr').style.cssText = `left:${-rs * 0.47}px;top:${-rs * 0.03}px;width:${rs * 0.62}px`;
    };
    /* drag nodes (a drag never counts as a click) */
    nodes.forEach(o => {
      o.el.addEventListener('pointerdown', e => { o.down = { x: e.clientX, y: e.clientY, ox: o.x, oy: o.y }; o.moved = false; });
      o.el.addEventListener('pointerenter', () => { o.hov = true; scramble(o.lab, tx(o.it.label).toUpperCase(), 360); kick(0.3); });
      o.el.addEventListener('pointerleave', () => { o.hov = false; });
      o.el.addEventListener('focus', () => { o.hov = true; scramble(o.lab, tx(o.it.label).toUpperCase(), 300); }); o.el.addEventListener('blur', () => { o.hov = false; });
      o.el.addEventListener('dragstart', e => e.preventDefault());
      o.el.addEventListener('click', e => { if (o.moved) { e.preventDefault(); e.stopImmediatePropagation(); } else kick(0.7); }, true);
    });
    const mv = e => nodes.forEach(o => {
      if (!o.down) return; const dx = e.clientX - o.down.x, dy = e.clientY - o.down.y;
      if (!o.moved && Math.hypot(dx, dy) > 6) { o.moved = true; o.drag = true; }
      if (o.drag) { o.x = clamp(o.down.ox + dx, 20, S.W - 20); o.y = clamp(o.down.oy + dy, 20, S.H - 20); o.vx = o.vy = 0; }
    });
    const up = () => nodes.forEach(o => { if (!o.down) return; o.down = null; if (o.drag) { o.hx = o.x; o.hy = o.y; o.ux = o.x / S.W; o.uy = o.y / S.H; o.userMoved = true; o.drag = false; setTimeout(() => { o.moved = false; }, 60); } });
    addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    ctx.cleanup(() => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); });
    addEventListener('resize', layout); ctx.cleanup(() => removeEventListener('resize', layout)); layout();

    /* ---------- below the fold ---------- */
    const aboutP = C.about.paragraphs.map(p => h('p', {}, TT(p)));
    const makes = h('ul', { class: 'makes' }, C.makes.map(m => h('li', {}, h('a', { href: href(m.route), dataset: { route: m.route } }, h('b', {}, TT(m.title)), h('span', {}, TT(m.text))))));
    const about = h('section', { class: 'sec about reveal' }, h('p', { class: 'kick' }, TT(C.about.kicker)), h('h2', { class: 'xl' }, TT(C.about.title)), h('div', { class: 'cols' }, h('div', {}, aboutP), makes));

    /* GoatCounter */
    const num = h('output', { class: 'vc-num', 'aria-live': 'polite' }, '0'); const after = h('p', { class: 'vc-after' }, TT(C.visitor.after)), hint = h('small', { class: 'vc-hint' });
    const vis = h('section', { class: 'sec visitors reveal' }, h('p', { class: 'kick' }, TT(C.visitor.kicker)),
      h('p', { class: 'vc-before' }, TT(C.visitor.before)), h('div', { class: 'vc-box' }, h('span', { class: 'vc-br' }, '['), num, h('span', { class: 'vc-br' }, ']')), after, hint);
    let target = null, shown = 0, counting = false, started = false;
    goat.total().then(n => {
      if (n === null) { num.textContent = '???'; hint.textContent = tx(C.visitor.offline); return; }
      target = n; if (started) counting = true;
    });
    if (!goat.enabled) { num.textContent = '???'; setTimeout(() => { hint.textContent = tx(C.visitor.offline); }, 0); }
    const fmt = n => Math.round(n).toLocaleString(document.documentElement.lang === 'ru' ? 'ru-RU' : 'en-US');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); if (e.target === vis) { started = true; if (target !== null) counting = true; } } }), { threshold: 0.25 });
    ctx.cleanup(() => io.disconnect());

    /* preview cards */
    const cards = items.map((it, i) => {
      const mini = h('div', { class: 'mini mini-' + it.route, 'aria-hidden': 'true' }, miniInner(it.route));
      const c = h('a', { class: 'pcard', href: href(it.route), dataset: { route: it.route }, style: `--k:${i}` },
        mini, h('div', { class: 'pc-t' }, h('b', {}, TT(it.label)), h('span', {}, TT(it.preview))), h('span', { class: 'pc-go' }, '→'));
      c.addEventListener('pointermove', e => { if (S.reduced) return; const r = c.getBoundingClientRect(); c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 14 + 'deg'); c.style.setProperty('--rx', -((e.clientY - r.top) / r.height - 0.5) * 12 + 'deg'); });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
      return c;
    });
    const prev = h('section', { class: 'sec preview reveal' }, h('p', { class: 'kick' }, TT(C.preview.kicker)), h('h2', { class: 'xl' }, TT(C.preview.title)), h('div', { class: 'pgrid' }, cards));
    const below = h('div', { class: 'below' }, about, vis, prev, footer());
    root.append(hero, below); [about, vis, prev].forEach(s => io.observe(s));

    /* ---------- per frame ---------- */
    let acc = 0, accC = 0; const A = S.a;
    ctx.frame(dt => {
      const { t, mouse, W, H, g } = S, sc = Math.min(1, S.scroll / H);
      const covered = S.scroll > H * 0.98; hero.classList.toggle('gone', covered);
      setNodes(covered ? [] : proxy);
      if (!covered) {
        const px = mouse.x / W - 0.5, py = mouse.y / H - 0.5;
        bigs.style.transform = `translate3d(${-px * 22}px,${-py * 14 - S.scroll * 0.15}px,0) scale(${1 + A.beat * 0.02 + A.bass * 0.012 + g * 0.012})`;
        S.hub.x = W * S.hubFx + Math.sin(t * 0.5) * 12 + (mouse.x - W / 2) * 0.015; S.hub.y = H * 0.47 + Math.cos(t * 0.4) * 10 + (mouse.y - H / 2) * 0.015;
        hub.style.transform = `translate(${S.hub.x}px,${S.hub.y}px) rotate(${t * 40 + A.mid * 60 + A.tick * 35}deg) scale(${1 + A.beat * 0.45 + A.bass * 0.2})`;
        ring.style.transform = `translate(${S.hub.x}px,${S.hub.y}px) perspective(700px) rotateX(${Math.sin(t * 0.7) * 30 + py * 40}deg) rotateY(${Math.cos(t * 0.5) * 35 + px * 60}deg) rotateZ(${Math.sin(t * 0.3) * 25 + g * 20 + S.spin * 40}deg) scale(${1 + A.bass * 0.15})`;
        nodes.forEach((o, i) => {
          if (!o.drag) {
            const tx_ = o.hx + Math.sin(t * 0.6 + i * 2) * 16 + Math.sin(t * 1.7 + i) * 6 + (mouse.x - W / 2) * 0.02 * o.depth + A.bass * Math.sin(i * 2.1) * 10;
            const ty_ = o.hy + Math.cos(t * 0.5 + i * 3) * 14 + (mouse.y - H / 2) * 0.02 * o.depth;
            const f = Math.min(3, dt * 60), damp = Math.pow(0.82, f);
            o.vx += (tx_ - o.x) * 0.05 * f; o.vy += (ty_ - o.y) * 0.05 * f; o.vx *= damp; o.vy *= damp; o.x += o.vx * f; o.y += o.vy * f;
          }
          const gx = g > 0.35 ? rnd(-6, 6) * g : 0;
          o.el.style.transform = `translate3d(${o.x + gx}px,${o.y}px,0)`;
          proxy[i].x = o.x; proxy[i].y = o.y; proxy[i].side = o.side;
          if (o.hov) {
            const r = o.txt.getBoundingClientRect(), ry = clamp(((mouse.x - (r.left + r.width / 2)) / Math.max(1, r.width)) * 40, -25, 25), rx = clamp(-((mouse.y - (r.top + r.height / 2)) / Math.max(1, r.height)) * 30, -20, 20);
            o.txt.style.transform = `perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.05)`;
          } else {
            const m = S.reduced ? 0.2 : 1 - S.calm * 0.5;
            o.txt.style.transform = `perspective(500px) rotateX(${Math.sin(t * 0.9 + i) * 9 * m}deg) rotateY(${Math.cos(t * 0.7 + i * 2) * 12 * m}deg) rotate(${o.rot}deg) skewX(${Math.sin(t * 1.3 + i) * 3 * m + (g > 0.4 && !S.noFlash ? rnd(-8, 8) * g : 0)}deg) scale(${1 + A.beat * 0.04})`;
          }
        });
        /* letters: ambient + beat-driven distortion */
        acc += dt;
        if (acc > 0.11 && !S.reduced) { acc = 0; const n = Math.max(0, Math.round(S.chaos * 3 * (1 - S.calm))); for (let k = 0; k < n; k++) if (Math.random() < 0.8) mutate(pick(letters)); }
        accC += dt; if (accC > 1.7 && !S.reduced) { accC = 0; const o = pick(nodes); scramble(o.lab, tx(o.it.label).toUpperCase(), 380); }
      }
      /* visitor count-up */
      if (counting && target !== null) { shown += (target - shown) * Math.min(1, dt * 2.6) + (target > 0 ? 0.4 : 0); if (target - shown < 0.6) { shown = target; counting = false; scramble(num, fmt(target), 500); } else num.textContent = fmt(shown); }
      vis.style.setProperty('--b', (A.beat * 0.6 + A.bass * 0.3).toFixed(3));
    });
    ctx.on('beat:low', str => { if (S.reduced || S.scroll > S.H * 0.9) return; if (str > 0.6 && Math.random() < 0.6) mutate(pick(letters)); });
    ctx.on('beat:high', str => { if (S.reduced || S.scroll > S.H * 0.9) return; if (Math.random() < 0.3 * str) mutate(pick(letters)); });
    ctx.on('lang', () => { if (target !== null && !counting) num.textContent = fmt(target); });
  }
};

function mutate(L) {
  const m = Math.random();
  if (m < 0.4) L.style.transform = `scale(${rnd(0.5, 1.8)},${rnd(0.6, 1.3)}) skewX(${rnd(-30, 30)}deg)`;
  else if (m < 0.55) L.style.transform = 'rotate(180deg)';
  else if (m < 0.7) L.textContent = pick(GL);
  else if (m < 0.85) L.style.transform = `translateY(${rnd(-8, 8)}%) scaleY(-1)`;
  else L.style.transform = '';
  setTimeout(() => { L.style.transform = ''; L.textContent = L.dataset.c; }, rnd(80, 420));
}
function miniInner(r) {
  const d = (c, s) => h('i', { class: c, style: s });
  switch (r) {
    case 'portfolio': return [d('f f1'), d('f f2'), d('f f3')];
    case 'services': return [h('b', { class: 'tag t1' }, '$1'), h('b', { class: 'tag t3' }, '$3'), h('b', { class: 'tag tr' }, 'R$100')];
    case 'contact': return [d('rg r1'), d('rg r2'), d('rg r3'), d('sq')];
    default: return h('div', { class: 'hexs' }, 'A3F 0B7 9C1 E42 7D0 1BB 5E9 C08 F31 2A6 D74 8E5 '.repeat(8));
  }
}
