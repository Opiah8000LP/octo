/* js/pages/games.js — GAMES: the in-site game browser. A little browser window with a tab per game, an address bar, and
   instructions / settings / restart / fullscreen controls. Games are loaded only when you open them. */
import { CONFIG } from '../../config/config.js';
import { S } from '../core/state.js';
import { h, store, asset, ROOT, scramble } from '../core/util.js';
import { T, TT, tx, bindAttr } from '../core/i18n.js';
import { emit, on } from '../core/bus.js';
import * as sfx from '../audio/sfx.js';
import { footer } from '../ui/footer.js';

const G = CONFIG.games;
const ic = n => h('i', { class: 'ic', style: `--i:url(${ROOT}assets/ui/${n}.png)`, 'aria-hidden': 'true' });
const MODS = { rhyme: () => import('../games/rhyme.js'), snake: () => import('../games/snake.js'), chess: () => import('../games/chess.js') };

export default {
  id: 'games', scene: 'games', title: CONFIG.nav[3].label,
  async mount(ctx) {
    const root = ctx.el; root.classList.add('games');
    let cur = null, inst = null, panel = null, token = 0;
    const urlBar = h('output', { class: 'g-url' }, 'dweeb://games/'), tabs = h('div', { class: 'g-tabs', role: 'tablist' }), body = h('div', { class: 'g-body' }), toolbar = h('div', { class: 'g-tools' });
    const tool = (icon, label, fn) => { const b = h('button', { class: 'g-tool', type: 'button', disabled: true }, ic(icon)); bindAttr(b, 'aria-label', label); bindAttr(b, 'title', label); b.addEventListener('click', fn); toolbar.appendChild(b); return b; };
    const bInfo = tool('info', G.tools.info, () => togglePanel('info')), bSet = tool('settings', G.tools.settings, () => togglePanel('settings')), bRe = tool('restart', G.tools.restart, () => { inst && inst.restart(); sfx.play('ui_click'); closePanel(); }), bFs = tool('fullscreen', G.tools.fullscreen, () => fs()), bX = tool('close', G.tools.close, () => open(null));
    const win = h('section', { class: 'game-win', 'aria-label': 'Game browser' },
      h('div', { class: 'g-bar' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), tabs, h('span', { class: 'g-bar-t' }, 'DWEEB://BROWSER')),
      h('div', { class: 'g-addr' }, ic('home'), urlBar, toolbar), body);

    const tabBtn = (id, label) => { const b = h('button', { class: 'g-tab', type: 'button', role: 'tab', dataset: { id } }, label); b.addEventListener('click', () => open(id === 'library' ? null : id)); tabs.appendChild(b); return b; };
    const tabLib = tabBtn('library', T('games.library')), tabsById = Object.fromEntries(G.list.map(g => [g.id, tabBtn(g.id, g.title)]));

    /* ---------- library ---------- */
    function library() {
      body.className = 'g-body lib'; body.textContent = '';
      body.append(h('div', { class: 'g-grid' }, G.list.map((g, i) => {
        const card = h('article', { class: 'g-card', style: `--i:${i};--a:${g.accent}` },
          h('div', { class: 'g-shot' }, h('img', { src: asset(`assets/games/preview_${g.id}.png`), alt: '', loading: 'lazy' }), h('span', { class: 'g-num' }, String(i + 1).padStart(2, '0'))),
          h('div', { class: 'g-info' }, h('h3', {}, g.title), h('p', { class: 'g-tag' }, TT(g.tagline)), h('p', {}, TT(g.desc)), h('ul', { class: 'tags' }, g.tags.map(t => h('li', {}, TT(t)))),
            h('button', { class: 'btn pri', type: 'button', on: { click: () => open(g.id) } }, T('games.insert'))));
        card.addEventListener('pointerenter', () => scramble(card.querySelector('h3'), g.title, 300)); return card;
      })), h('p', { class: 'fine g-note' }, T('games.note')));
    }

    /* ---------- open / close a game ---------- */
    async function open(id, user = true) {
      const my = ++token; closePanel();
      if (inst) { try { inst.destroy(); } catch (e) {} inst = null; }
      cur = id; tabLib.setAttribute('aria-selected', !id); Object.entries(tabsById).forEach(([k, b]) => b.setAttribute('aria-selected', k === id));
      [bInfo, bSet, bRe, bFs, bX].forEach(b => { b.disabled = !id; }); win.classList.toggle('playing', !!id); S.bgSkip = id ? 3 : 1; urlBar.textContent = 'dweeb://games/' + (id || '');
      history.replaceState(history.state, '', id ? '#' + id : location.pathname); if (user) sfx.play(id ? 'ui_open' : 'ui_close');
      if (!id) { library(); return; }
      const def = G.list.find(g => g.id === id); body.className = 'g-body play'; body.textContent = ''; body.append(h('div', { class: 'g-loading' }, T('games.loading')));
      try {
        const mod = await MODS[id](); if (my !== token) return; body.textContent = '';
        const hostEl = h('div', { class: 'g-host', style: `--a:${def.accent}` }); body.appendChild(hostEl);
        inst = mod.default.create(hostEl, api(def)); inst.resize && inst.resize();
        if (user) openInstr(def, true);
      } catch (e) { console.error(e); body.textContent = ''; body.append(h('p', { class: 'err-msg' }, T('games.failed'))); }
    }
    const api = def => ({
      sfx: (n, o) => sfx.playNow(n, o), preload: names => sfx.preload(names), emit: (e, d) => emit(e, d),
      store: { get: (k, d) => store.get(`g:${def.id}:${k}`, d), set: (k, v) => store.set(`g:${def.id}:${k}`, v) },
      getSetting: k => { const s = def.settings.find(x => x.key === k); return store.get(`g:${def.id}:set:${k}`, s ? s.def : undefined); }
    });

    /* ---------- instructions / settings panels ---------- */
    function closePanel() { if (panel) { panel.remove(); panel = null; } bInfo.classList.remove('on'); bSet.classList.remove('on'); }
    function togglePanel(kind) { if (panel && panel.dataset.k === kind) return closePanel(); const def = G.list.find(g => g.id === cur); if (kind === 'info') openInstr(def); else openSettings(def); sfx.play('ui_open'); }
    function mkPanel(kind, title, ...kids) {
      closePanel(); const x = h('button', { class: 'g-px', type: 'button', 'aria-label': 'Close' }, ic('close')); x.addEventListener('click', closePanel);
      panel = h('div', { class: 'g-panel', role: 'dialog', dataset: { k: kind } }, h('header', {}, h('h3', {}, title), x), ...kids); win.appendChild(panel); (kind === 'info' ? bInfo : bSet).classList.add('on'); x.focus({ preventScroll: true });
    }
    function openInstr(def, first) {
      mkPanel('info', h('span', {}, def.title, ' — ', T('games.howto')), h('ul', { class: 'g-instr' }, def.instructions.map(i => h('li', {}, TT(i)))),
        h('table', { class: 'g-keys' }, h('tbody', {}, def.controls.map(c => h('tr', {}, h('th', {}, TT(c.keys)), h('td', {}, TT(c.does)))))),
        h('button', { class: 'btn pri', type: 'button', on: { click: closePanel } }, T('games.gotit')));
    }
    function openSettings(def) {
      const rows = def.settings.map(s => {
        const cur_ = () => store.get(`g:${def.id}:set:${s.key}`, s.def), seg = h('div', { class: 'seg', role: 'radiogroup' });
        const btns = s.options.map(o => { const b = h('button', { type: 'button', role: 'radio', dataset: { v: o.v } }, TT(o.label)); b.addEventListener('click', () => { store.set(`g:${def.id}:set:${s.key}`, o.v); sync(); inst && inst.onSetting && inst.onSetting(s.key, o.v); sfx.play('ui_toggle_on'); }); seg.appendChild(b); return b; });
        const sync = () => btns.forEach(b => { const on_ = b.dataset.v === cur_(); b.classList.toggle('on', on_); b.setAttribute('aria-checked', on_); }); sync();
        return h('div', { class: 'set-row col' }, h('span', { class: 'sr-lab' }, TT(s.label), s.hint ? h('small', {}, TT(s.hint)) : null), seg);
      });
      mkPanel('settings', h('span', {}, def.title, ' — ', T('games.settings')), ...rows, h('p', { class: 'fine' }, T('games.settingsNote')));
    }
    function fs() { const on_ = win.classList.toggle('fs'); S.bgSkip = on_ ? -1 : 3; document.body.classList.toggle('game-fs', on_); if (on_ && win.requestFullscreen && S.coarse) win.requestFullscreen().catch(() => {}); else if (!on_ && document.fullscreenElement) document.exitFullscreen().catch(() => {}); setTimeout(() => inst && inst.resize && inst.resize(), 60); sfx.play('ui_slide'); }
    const vis = () => { if (document.hidden && inst && inst.pause) inst.pause(); };
    document.addEventListener('visibilitychange', vis); addEventListener('resize', () => inst && inst.resize && inst.resize());
    ctx.on('escape', () => { if (panel) closePanel(); else if (win.classList.contains('fs')) fs(); });

    root.append(h('header', { class: 'phead' }, h('p', { class: 'kick' }, TT(G.kicker)), h('h1', { class: 'xl' }, TT(CONFIG.nav[3].label)), h('p', { class: 'lede' }, TT(G.intro))), win, footer());
    ctx.cleanup(() => { document.removeEventListener('visibilitychange', vis); S.bgSkip = 1; document.body.classList.remove('game-fs'); if (inst) { try { inst.destroy(); } catch (e) {} inst = null; } if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); });
    const want = (location.hash || '').slice(1); if (G.list.some(g => g.id === want)) open(want, false); else open(null, false);
  }
};
