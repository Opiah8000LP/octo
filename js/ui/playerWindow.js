/* js/ui/playerWindow.js — the original player (cover · title · artist · elapsed · seek · total · prev · play · next · vol · list),
   now living inside ONE draggable window that follows you across every page and dances to the music. */
import { S } from '../core/state.js';
import { h, clamp, store, fmtTime, ROOT, asset } from '../core/util.js';
import { T, bindAttr, bindText, refreshI18n, ui } from '../core/i18n.js';
import { rgb } from '../core/util.js';
import * as Player from '../audio/player.js';
import * as sfx from '../audio/sfx.js';
import { on } from '../core/bus.js';
import { CONFIG } from '../../config/config.js';

const ic = n => h('i', { class: 'ic', style: `--i:url(${ROOT}assets/ui/${n}.png)`, 'aria-hidden': 'true' });
let win, art, imgEl, nameEl, nameIn, artistEl, elEl, totEl, seek, volS, playBtn, volBtn, listEl, vis, vctx, pos = { x: 0, y: 0 }, minimized, listOpen = false, seeking = false, bars = [];

/* a slider: drag the track (or use the arrow keys). value is 0..1 */
function slider(label, get, set, cls = '') {
  const fill = h('i', { class: 'fill' }), knob = h('i', { class: 'knob' }), buf = h('i', { class: 'buf' });
  const el = h('div', { class: 'track ' + cls, role: 'slider', tabindex: 0, 'aria-valuemin': 0, 'aria-valuemax': 100 }, buf, fill, knob);
  bindAttr(el, 'aria-label', label);
  let drag = false;
  const val = e => { const r = el.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1); };
  el.addEventListener('pointerdown', e => { drag = true; el.setPointerCapture(e.pointerId); el.dispatchEvent(new CustomEvent('seekstart')); set(val(e), true); render(val(e)); e.stopPropagation(); });
  el.addEventListener('pointermove', e => { if (drag) { set(val(e), true); render(val(e)); } });
  const end = e => { if (!drag) return; drag = false; set(val(e), false); el.dispatchEvent(new CustomEvent('seekend')); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('keydown', e => {
    const d = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05 }[e.key]; if (d === undefined) return;
    e.preventDefault(); e.stopPropagation(); const v = clamp(get() + d, 0, 1); set(v, false); render(v);
  });
  function render(v) { fill.style.width = knob.style.left = (v * 100) + '%'; el.setAttribute('aria-valuenow', Math.round(v * 100)); }
  el.render = render; el.buf = buf; el.isDrag = () => drag;
  return el;
}

export function init() {
  imgEl = h('img', { alt: '', draggable: false });
  vis = h('canvas', { class: 'pw-vis', width: 160, height: 28, 'aria-hidden': 'true' }); vctx = vis.getContext('2d');
  art = h('div', { class: 'pw-art' }, imgEl);
  nameIn = h('span'); nameEl = h('div', { class: 'pw-name' }, nameIn); artistEl = h('div', { class: 'pw-artist' });
  elEl = h('span', { class: 'pw-time' }, '0:00'); totEl = h('span', { class: 'pw-time' }, '0:00');
  seek = slider(CONFIG.ui.player.seek, () => (Player.duration() ? Player.el.currentTime / Player.duration() : 0), (v, live) => { seeking = live; if (!live) Player.seekRatio(v); else elEl.textContent = fmtTime(v * Player.duration()); }, 'seek');
  seek.addEventListener('seekend', () => { seeking = false; });
  volS = slider(CONFIG.ui.player.volume, () => Player.state.vol, v => { Player.setVolume(v); }, 'vol');

  const btn = (cls, iconName, labelPath, fn) => { const b = h('button', { class: 'pb ' + cls, type: 'button' }, ic(iconName), h('span', { class: 'pl' }, T(labelPath))); b.addEventListener('click', fn); return b; };
  const prev = btn('prev', 'prev', 'player.prev', () => Player.prev());
  playBtn = btn('play', 'play', 'player.play', () => Player.toggle());
  const next = btn('next', 'next', 'player.next', () => Player.next());
  { const pl = playBtn.querySelector('.pl'); pl.textContent = ''; pl.appendChild(bindText(h('span'), () => ui(Player.state.playing ? 'player.pause' : 'player.play'))); }
  volBtn = btn('vol', 'volume', 'player.vol', () => Player.toggleMute());
  const listBtn = btn('list', 'playlist', 'player.list', () => toggleList());
  listEl = h('ol', { class: 'pw-list' });
  const minBtn = h('button', { class: 'pw-min', type: 'button' }, ic('minimize')); bindAttr(minBtn, 'aria-label', CONFIG.ui.player.minimize);
  minBtn.addEventListener('click', () => setMin(!minimized));
  const bar = h('div', { class: 'pw-bar', tabindex: 0, role: 'group' }, h('span', { class: 'pw-grip' }, ic('grip')), h('b', {}, CONFIG.player.title || 'DWEEB.PLAYER'), minBtn);
  bindAttr(bar, 'aria-label', CONFIG.ui.player.dragHint); bindAttr(bar, 'title', CONFIG.ui.player.dragHint);

  win = h('section', { class: 'pw', 'aria-label': 'Music player' }, bar,
    h('div', { class: 'pw-body' },
      h('div', { class: 'pw-main' }, art, h('div', { class: 'pw-meta' }, nameEl, artistEl, vis)),
      h('div', { class: 'pw-seekrow' }, elEl, seek, totEl),
      h('div', { class: 'pw-ctl' }, prev, playBtn, next, h('span', { class: 'pw-sp' }), volBtn, volS, listBtn),
      h('div', { class: 'pw-listwrap' }, listEl)));
  document.body.appendChild(win);

  minimized = store.get('pw:min', S.W < 700);
  win.classList.toggle('min', minimized);
  buildList(); onTrack(Player.current()); onVolume(); onState();
  Player.on('track', onTrack); Player.on('state', onState); Player.on('volume', onVolume); Player.on('list', buildList); Player.on('error', buildList);
  on('player:toggleList', () => toggleList());
  on('lang', () => { updateTitle(); });
  initDrag(bar);
  addEventListener('resize', () => place());
  setTimeout(place, 0);
}

function setMin(m) { minimized = m; store.set('pw:min', m); win.classList.toggle('min', m); if (m) { listOpen = false; win.classList.remove('list-open'); } sfx.play(m ? 'ui_close' : 'ui_open'); requestAnimationFrame(place); }
function toggleList() { if (minimized) setMin(false); listOpen = !listOpen; win.classList.toggle('list-open', listOpen); sfx.play(listOpen ? 'ui_open' : 'ui_close'); requestAnimationFrame(place); }

function updateTitle() {
  const t = Player.current(); nameIn.textContent = t.title; artistEl.textContent = t.artist + (t.ok === false ? '  ·  ' + ui('player.missing') : '');
  win.classList.toggle('missing', t.ok === false);
  requestAnimationFrame(() => { const over = nameIn.scrollWidth - nameEl.clientWidth; nameEl.classList.toggle('scroll', over > 4); nameIn.style.setProperty('--sc', -(over + 12) + 'px'); });
}
function onTrack(t) {
  if (t.cover) { imgEl.src = asset(t.cover); art.classList.remove('empty'); } else { imgEl.removeAttribute('src'); art.classList.add('empty'); }
  updateTitle(); buildList(); totEl.textContent = fmtTime(t.duration);
}
function onState() {
  const p = Player.state.playing; win.classList.toggle('is-playing', p);
  playBtn.querySelector('.ic').style.setProperty('--i', `url(${ROOT}assets/ui/${p ? 'pause' : 'play'}.png)`);
  refreshI18n();
  playBtn.dataset.state = p ? 'pause' : 'play'; document.body.classList.toggle('is-playing', p);
}
function onVolume() {
  const m = Player.state.muted || Player.state.vol === 0; volS.render(m ? 0 : Player.state.vol);
  volBtn.querySelector('.ic').style.setProperty('--i', `url(${ROOT}assets/ui/${m ? 'mute' : 'volume'}.png)`);
}
function buildList() {
  listEl.textContent = '';
  Player.tracks.forEach((t, i) => {
    const b = h('button', { class: 'pl-item', type: 'button' },
      t.cover ? h('img', { src: asset(t.cover), alt: '', loading: 'lazy' }) : h('span', { class: 'noimg' }),
      h('span', { class: 'ti' }, h('b', {}, t.title), h('em', {}, t.artist)),
      h('span', { class: 'eq' }, h('i'), h('i'), h('i')), h('span', { class: 'du' }, t.duration ? fmtTime(t.duration) : '–:––'));
    b.addEventListener('click', () => { Player.load(i, true); });
    listEl.appendChild(h('li', { class: (i === Player.state.index ? 'cur ' : '') + (t.ok === false ? 'bad' : '') }, b));
  });
}

/* ---------- placement + dragging ---------- */
function place(save) {
  const w = win.offsetWidth || 300, hh = win.offsetHeight || 200;
  const s = store.get('pw:pos', null);
  if (!place.init) { place.init = true; if (s) { pos.x = s[0] * S.W; pos.y = s[1] * S.H; } else { pos.x = S.W - w - 14; pos.y = S.H - hh - 14; place.def = true; } }
  else if (place.def && !save) { pos.x = S.W - w - 14; pos.y = S.H - hh - 14; }
  pos.x = clamp(pos.x, 4, Math.max(4, S.W - w - 4)); pos.y = clamp(pos.y, 4, Math.max(4, S.H - hh - 4));
  win.style.transform = `translate3d(${pos.x}px,${pos.y}px,0)`;
  if (save) { place.def = false; store.set('pw:pos', [pos.x / S.W, pos.y / S.H]); }
}
export function resetLayout() { store.del('pw:pos'); place.init = false; place.def = true; place(); }
function initDrag(handle) {
  let st = null;
  handle.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return; if (e.button !== undefined && e.button !== 0) return;
    st = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, id: e.pointerId }; handle.setPointerCapture(e.pointerId); win.classList.add('dragging');
  });
  handle.addEventListener('pointermove', e => { if (!st || e.pointerId !== st.id) return; pos.x = st.ox + e.clientX - st.sx; pos.y = st.oy + e.clientY - st.sy; place(); });
  const up = e => { if (!st) return; st = null; win.classList.remove('dragging'); place(true); };
  handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
  handle.addEventListener('dblclick', e => { if (!e.target.closest('button')) resetLayout(); });
  handle.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (e.key === 'Home') { e.preventDefault(); resetLayout(); return; } if (!k) return;
    e.preventDefault(); const st_ = e.shiftKey ? 80 : 20; pos.x += k[0] * st_; pos.y += k[1] * st_; place(true);
  });
}

/* ---------- per-frame: time, seek, sound-reactive details ---------- */
export function update() {
  if (!win) return;
  const A = S.a, d = Player.duration(), ct = Player.el.currentTime || 0;
  if (!seeking) { elEl.textContent = fmtTime(ct); if (!seek.isDrag()) seek.render(d ? ct / d : 0); }
  if (d && totEl.dataset.d !== String(d | 0)) { totEl.dataset.d = d | 0; totEl.textContent = fmtTime(d); }
  const b = Player.el.buffered; if (b && b.length && d) seek.buf.style.width = (b.end(b.length - 1) / d * 100) + '%';
  if (!Player.state.playing && !win._idle) { win._idle = true; win.style.setProperty('--beat', 0); }
  if (Player.state.playing) win._idle = false;
  if (!win._idle) {
    win.style.setProperty('--beat', (A.beat * 0.8 + A.bass * 0.4).toFixed(3));
    art.style.transform = S.reduced ? '' : `scale(${1 + A.beat * 0.07 + A.bass * 0.03}) rotate(${(A.tick * 2.5 * Math.sin(S.t * 40)).toFixed(2)}deg)`;
    if (!minimized) drawVis(A);
  }
}
function drawVis(A) {
  const w = vis.width, hh = vis.height, f = A.freq; vctx.clearRect(0, 0, w, hh);
  vctx.fillStyle = rgb(S.blue);
  const n = 32, bw = w / n;
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.pow(i / n, 1.7) * 220) + 2; let v = f ? f[idx] / 255 : 0; if (!A.real) v = 0.08 + 0.06 * Math.sin(S.t * 3 + i);
    const bh = Math.max(1, v * hh); vctx.fillRect(i * bw + 1, hh - bh, bw - 2, bh);
  }
}
