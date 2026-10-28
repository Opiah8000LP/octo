/* js/pages/portfolio.js — PORTFOLIO: "the archive". Five tabs, each presented in its own way. Everything comes from config/config.js → portfolio. */
import { CONFIG } from '../../config/config.js';
import { S } from '../core/state.js';
import { h, asset, ROOT, fmtTime, clamp } from '../core/util.js';
import { T, TT, tx, ui } from '../core/i18n.js';
import { emit } from '../core/bus.js';
import * as sfx from '../audio/sfx.js';
import * as Player from '../audio/player.js';
import * as settings from '../core/settings.js';
import { footer } from '../ui/footer.js';

const P = CONFIG.portfolio;
const NAV = CONFIG.nav.find(n => n.route === 'portfolio');
const ic = n => h('i', { class: 'ic', style: `--i:url(${ROOT}assets/ui/${n}.png)`, 'aria-hidden': 'true' });
export const items = tab => (P[tab] || []);
const ghosts = (tab, n = 3) => Array.from({ length: n }, (_, i) => ({ ghost: true, title: `${tx(P.ghost.title)} ${String(i + 1).padStart(2, '0')}`, desc: tx(P.ghost.desc), tags: [tab] }));
const withGhosts = tab => (items(tab).length ? items(tab) : (P.showPlaceholders ? ghosts(tab, tab === 'images' ? 9 : 3) : []));
const tags = a => (a && a.length ? h('ul', { class: 'tags' }, a.map(x => h('li', {}, x))) : null);
const text = v => tx(v);

/* ---- one shared audio element for previews; it borrows the speakers from the site player ---- */
const pv = new Audio(); pv.preload = 'none'; let pvBtn = null;
pv.addEventListener('ended', () => stopPreview()); pv.addEventListener('pause', () => { if (pvBtn) pvBtn.classList.remove('playing'); });
function stopPreview() { pv.pause(); if (pvBtn) { pvBtn.classList.remove('playing'); pvBtn.closest('.rec') && pvBtn.closest('.rec').classList.remove('playing'); } pvBtn = null; Player.release(); }

const R = {
  /* ---------------- websites: little browser windows ---------------- */
  websites(box, list) {
    box.className = 'tabbody webs';
    list.forEach((w, i) => {
      const shot = h('div', { class: 'web-shot' });
      if (w.ghost) shot.appendChild(h('div', { class: 'ghost-shot' }, '< / >'));
      else {
        if (w.image) shot.appendChild(h('img', { src: asset(w.image), alt: text(w.title), loading: 'lazy' }));
        if (w.video) {                                   // hover to preview
          const v = h('video', { src: asset(w.video), muted: true, loop: true, playsInline: true, preload: 'none', poster: w.image ? asset(w.image) : undefined });
          shot.append(v); shot.addEventListener('pointerenter', () => v.play().catch(() => {})); shot.addEventListener('pointerleave', () => v.pause());
        }
      }
      const url = w.url ? h('a', { class: 'btn', href: w.url, target: '_blank', rel: 'noopener' }, T('portfolio.visit'), ic('external')) : null;
      box.appendChild(h('article', { class: 'web-card' + (w.ghost ? ' is-ghost' : ''), style: `--i:${i}` },
        h('div', { class: 'web-bar' }, h('i'), h('i'), h('i'), h('span', {}, w.url ? w.url.replace(/^https?:\/\//, '') : 'https://add-your-site-bro.example')), shot,
        h('div', { class: 'web-info' }, h('h3', {}, text(w.title)), h('p', {}, text(w.desc)), tags(w.tags), h('div', { class: 'acts' }, url, w.year ? h('small', {}, w.year) : null))));
    });
  },
  /* ---------------- music & sound: records with a preview player ---------------- */
  music(box, list) {
    box.className = 'tabbody recs';
    list.forEach((m, i) => {
      const prog = h('i', { class: 'rec-prog' }), time = h('span', { class: 'rec-time' }, '0:00');
      const playB = h('button', { class: 'rec-play', type: 'button', 'aria-label': 'Play preview' }, ic('play'));
      const disc = h('div', { class: 'disc' }, m.cover ? h('img', { src: asset(m.cover), alt: '', loading: 'lazy' }) : h('span', {}, '♪'));
      const bar = h('div', { class: 'rec-bar', role: 'slider', tabindex: 0, 'aria-label': 'Seek preview' }, prog);
      const row = h('article', { class: 'rec' + (m.ghost ? ' is-ghost' : ''), style: `--i:${i}` }, disc,
        h('div', { class: 'rec-main' }, h('div', { class: 'rec-top' }, h('h3', {}, text(m.title)), m.kind ? h('span', { class: 'kind' }, P.musicKinds[m.kind] ? TT(P.musicKinds[m.kind]) : m.kind) : null),
          h('p', {}, text(m.desc)), tags(m.tags), h('div', { class: 'rec-row' }, playB, bar, time)));
      box.appendChild(row);
      if (m.ghost || !m.file) { playB.disabled = true; return; }
      pv.addEventListener('timeupdate', () => { if (pvBtn === playB && pv.duration) { prog.style.width = (pv.currentTime / pv.duration * 100) + '%'; time.textContent = fmtTime(pv.currentTime); } });
      playB.addEventListener('click', () => {
        if (pvBtn === playB && !pv.paused) { stopPreview(); playB.querySelector('.ic').style.setProperty('--i', `url(${ROOT}assets/ui/play.png)`); return; }
        stopPreview(); Player.hold(); pv.src = asset(m.file); pv.play().catch(() => {}); pvBtn = playB; playB.classList.add('playing'); row.classList.add('playing');
        playB.querySelector('.ic').style.setProperty('--i', `url(${ROOT}assets/ui/pause.png)`); emit('portfolio:preview', m);
      });
      pv.addEventListener('pause', () => { if (pvBtn === playB || !pvBtn) playB.querySelector('.ic').style.setProperty('--i', `url(${ROOT}assets/ui/play.png)`); row.classList.remove('playing'); });
      bar.addEventListener('click', e => { if (pvBtn === playB && pv.duration) { const r = bar.getBoundingClientRect(); pv.currentTime = clamp((e.clientX - r.left) / r.width, 0, 1) * pv.duration; } });
    });
  },
  /* ---------------- games: cartridges ---------------- */
  games(box, list) {
    box.className = 'tabbody carts';
    list.forEach((g, i) => box.appendChild(h('article', { class: 'cart' + (g.ghost ? ' is-ghost' : ''), style: `--i:${i}` },
      h('div', { class: 'cart-art' }, g.image && !g.ghost ? h('img', { src: asset(g.image), alt: text(g.title), loading: 'lazy' }) : h('span', {}, '▶')),
      h('div', { class: 'cart-label' }, h('h3', {}, text(g.title)), g.platform ? h('small', {}, g.platform) : null),
      h('p', {}, text(g.desc)), tags(g.tags),
      h('div', { class: 'acts' }, g.playUrl ? h('a', { class: 'btn pri', href: g.playUrl, target: '_blank', rel: 'noopener' }, T('portfolio.play')) : null, g.url ? h('a', { class: 'btn', href: g.url, target: '_blank', rel: 'noopener' }, T('portfolio.details'), ic('external')) : null))));
  },
  /* ---------------- videos: film strip, embeds load on click ---------------- */
  videos(box, list) {
    box.className = 'tabbody reel';
    const ytId = v => { if (v.youtube) return v.youtube; const m = (v.url || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/); return m ? m[1] : null; };
    list.forEach((v, i) => {
      const id = ytId(v), frame = h('div', { class: 'film-frame' });
      const poster = v.poster || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null);
      if (v.ghost) frame.appendChild(h('div', { class: 'ghost-shot' }, '▶'));
      else {
        if (poster) frame.appendChild(h('img', { src: poster.startsWith('http') ? poster : asset(poster), alt: '', loading: 'lazy' }));
        const b = h('button', { class: 'film-play', type: 'button', 'aria-label': 'Play ' + text(v.title) }, ic('play'));
        b.addEventListener('click', () => {
          Player.hold(); sfx.play('ui_open');
          const el = id ? h('iframe', { src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowFullscreen: true, title: text(v.title), loading: 'lazy' })
            : v.file ? h('video', { src: asset(v.file), controls: true, autoplay: true, playsInline: true }) : null;
          if (el) { frame.textContent = ''; frame.appendChild(el); } else if (v.url) window.open(v.url, '_blank', 'noopener');
        });
        frame.appendChild(b);
      }
      box.appendChild(h('article', { class: 'film' + (v.ghost ? ' is-ghost' : ''), style: `--i:${i}` }, h('div', { class: 'sprockets', 'aria-hidden': 'true' }), frame, h('div', { class: 'sprockets', 'aria-hidden': 'true' }),
        h('div', { class: 'film-info' }, h('h3', {}, text(v.title)), h('p', {}, text(v.desc)), tags(v.tags), v.url && !v.ghost ? h('a', { class: 'btn', href: v.url, target: '_blank', rel: 'noopener' }, T('portfolio.watch'), ic('external')) : null)));
    });
  }
};

/* ---------------- image editing: the 3D well (grid view is always available) ---------------- */
function lightbox(list, start, onClose) {
  let i = start; const img = h('img', { alt: '' }), cap = h('figcaption'), wrap = h('div', { class: 'lb-stage' });
  const x = h('button', { class: 'lb-x', type: 'button', 'aria-label': 'Close' }, ic('close')), pv_ = h('button', { class: 'lb-n l', type: 'button', 'aria-label': 'Previous' }, ic('prev')), nx = h('button', { class: 'lb-n r', type: 'button', 'aria-label': 'Next' }, ic('next'));
  const lb = h('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true' }, x, pv_, nx, h('figure', {}, wrap, cap));
  const show = () => {
    const it = list[i]; wrap.textContent = ''; cap.textContent = ''; cap.append(h('b', {}, text(it.title)), ' — ', text(it.desc || ''));
    if (it.before && it.src) { /* before / after compare */
      const a = h('img', { src: asset(it.src), alt: 'after' }), b = h('img', { src: asset(it.before), alt: 'before', class: 'cmp-b' }), rng = h('input', { type: 'range', min: 0, max: 100, value: 50, class: 'cmp-r', 'aria-label': 'Before / after' });
      const c = h('div', { class: 'cmp' }, a, b, h('i', { class: 'cmp-line' }), rng); const set = () => { c.style.setProperty('--p', rng.value + '%'); }; rng.addEventListener('input', set); set(); wrap.appendChild(c);
    } else if (it.src) wrap.appendChild(h('img', { src: asset(it.src), alt: text(it.title) }));
    else wrap.appendChild(h('div', { class: 'ghost-shot big' }, text(it.title)));
  };
  const close = () => { lb.remove(); removeEventListener('keydown', key, true); onClose && onClose(); }, step = d => { i = (i + d + list.length) % list.length; show(); sfx.play('ui_slide'); };
  const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); };
  x.addEventListener('click', close); nx.addEventListener('click', () => step(1)); pv_.addEventListener('click', () => step(-1)); lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', key, true); document.body.appendChild(lb); show(); x.focus(); sfx.play('ui_open'); emit('gallery:open');
  return close;
}

function images(box, list, ctx) {
  box.className = 'tabbody imgs';
  const stage = h('div', { class: 'gal3d' }), grid = h('div', { class: 'imgrid' });
  const cap = h('div', { class: 'gal-cap', hidden: true }), hint = h('p', { class: 'gal-hint' }, T('portfolio.galleryHint'));
  const mode3 = !S.reduced && !!document.createElement('canvas').getContext('webgl2'); let view = mode3 ? '3d' : 'grid', gal = null, closeLb = null;
  const bt3 = h('button', { type: 'button', class: 'seg-b', role: 'radio' }, '3D'), btg = h('button', { type: 'button', class: 'seg-b', role: 'radio' }, T('portfolio.grid'));
  const tog = h('div', { class: 'seg sm', role: 'radiogroup' }, bt3, btg);
  const real = items('images').length > 0;
  list.forEach((it, i) => {
    const b = h('button', { class: 'gi', type: 'button', style: `--i:${i}` }, it.src && !it.ghost ? h('img', { src: asset(it.src), alt: text(it.title), loading: 'lazy' }) : h('span', { class: 'ghost-shot' }, text(it.title)), h('span', { class: 'gi-t' }, text(it.title)));
    b.addEventListener('click', () => { closeLb = lightbox(list, i); }); grid.appendChild(b);
  });
  const nav = h('div', { class: 'gal-nav' }, ...['prev', 'x', 'next'].map(k => { const b = h('button', { type: 'button', class: 'pb', 'aria-label': k }, k === 'x' ? ic('close') : ic(k === 'prev' ? 'prev' : 'next')); b.addEventListener('click', () => (k === 'x' ? gal && gal.unfocus() : gal && gal.dive(k === 'prev' ? -1 : 1))); return b; }));
  const dive = h('button', { type: 'button', class: 'btn pri dive' }, T('portfolio.dive')); dive.addEventListener('click', () => gal && gal.dive(1));
  cap.append(h('div', { class: 'cap-t' }), h('div', { class: 'cap-d' }), nav);
  const info = it => { cap.querySelector('.cap-t').textContent = text(it.title); cap.querySelector('.cap-d').textContent = text(it.desc || ''); };
  async function open3d() {
    try {
      const { createGallery } = await import('./gallery3d.js'); if (!stage.isConnected) return;
      gal = await createGallery(stage, list, { onFocus: (i, it) => { info(it); cap.hidden = false; hint.hidden = true; sfx.play('whoosh_a', { vol: 0.5 }); emit('gallery:open'); }, onBlur: () => { cap.hidden = true; hint.hidden = false; sfx.play('whoosh_b', { vol: 0.4 }); } });
      ctx.frame(dt => gal && view === '3d' && gal.render(dt));
    } catch (e) { console.warn('[gallery] 3D died, falling back to the grid. not my fault bro', e); view = 'grid'; sync(); }
  }
  function sync() {
    stage.hidden = view !== '3d'; grid.hidden = view !== 'grid'; hint.hidden = view !== '3d' || !cap.hidden; cap.hidden = cap.hidden || view !== '3d';
    bt3.setAttribute('aria-checked', view === '3d'); btg.setAttribute('aria-checked', view === 'grid'); bt3.classList.toggle('on', view === '3d'); btg.classList.toggle('on', view === 'grid');
    if (view === '3d' && !gal) open3d();
  }
  bt3.addEventListener('click', () => { view = '3d'; sync(); }); btg.addEventListener('click', () => { view = 'grid'; sync(); });
  box.append(h('div', { class: 'gal-top' }, tog, h('p', {}, T('portfolio.imagesBlurb'))), stage, grid, hint, cap); stage.appendChild(dive);
  if (!real) emit('gallery:empty');
  sync();
  return () => { if (gal) gal.destroy(); gal = null; closeLb && closeLb(); };
}

export default {
  id: 'portfolio', scene: 'portfolio', title: NAV.label,
  async mount(ctx) {
    const root = ctx.el; root.classList.add('portfolio');
    let tab = (location.hash || '').slice(1); if (!P.tabs.some(t => t.id === tab)) tab = P.tabs[0].id;
    let body = h('div', { class: 'tabbody' }); const tabsEl = h('div', { class: 'tabs', role: 'tablist' }), blurb = h('p', { class: 'tab-blurb' });
    let dispose = null;
    const btns = P.tabs.map((t, n) => {
      const cnt = items(t.id).length, b = h('button', { class: 'tab', type: 'button', role: 'tab', id: 'tab-' + t.id, 'aria-controls': 'tabpanel', style: `--n:${n}` }, h('span', { class: 'tn' }, String(n + 1).padStart(2, '0')), h('span', { class: 'tl' }, TT(t.label)), h('em', {}, cnt ? String(cnt) : '·'));
      b.addEventListener('click', () => select(t.id, true)); tabsEl.appendChild(b); return [t.id, b];
    });
    tabsEl.addEventListener('keydown', e => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k) return; const i = P.tabs.findIndex(t => t.id === tab); select(P.tabs[(i + k + P.tabs.length) % P.tabs.length].id, true); btns.find(b => b[0] === tab)[1].focus(); });
    function select(id, user) {
      if (dispose) { dispose(); dispose = null; } stopPreview(); tab = id; if (user) { history.replaceState(history.state, '', '#' + id); sfx.play('ui_slide'); }
      btns.forEach(([k, b]) => { b.setAttribute('aria-selected', k === id); b.tabIndex = k === id ? 0 : -1; });
      const def = P.tabs.find(t => t.id === id); blurb.textContent = ''; blurb.appendChild(TT(def.blurb));
      const nb = h('div', { id: 'tabpanel', role: 'tabpanel', 'aria-labelledby': 'tab-' + id, tabindex: 0 }); body.replaceWith(nb); body = nb;
      const list = withGhosts(id);
      if (id === 'images') dispose = images(nb, list, ctx); else R[id](nb, list);
      if (!items(id).length && id !== 'images') { nb.appendChild(h('p', { class: 'empty-note' }, TT(P.empty))); emit('gallery:empty'); }
      nb.classList.add('swap'); setTimeout(() => nb.classList.remove('swap'), 600);
    }
    root.append(h('header', { class: 'phead' }, h('p', { class: 'kick' }, TT(P.kicker)), h('h1', { class: 'xl glitch-t', 'data-t': '' }, TT(NAV.label)), h('p', { class: 'lede' }, TT(P.intro))), tabsEl, blurb, body, footer());
    select(tab, false);
    ctx.cleanup(() => { if (dispose) dispose(); stopPreview(); });
  }
};
