/* js/games/chess.js — BROKEN CHESS UI. Rules live in chess-engine.js, the weird opponent in chess-ai.js. */
import { S } from '../core/state.js';
import { h, pick, sleep, shuffle, asset } from '../core/util.js';
import { tx, bindText } from '../core/i18n.js';
import { CONFIG } from '../../config/config.js';
import { newGame, legalMoves, applyRaw, settle, shiftDue, shiftIn, shiftSquares, sqName, describe, VAL } from './chess-engine.js';
import { chooseMove, QUIRKS } from './chess-ai.js';
import { gtt, gs } from './common.js';

const CH = CONFIG.games.chess, CHAOS = { tame: 0.15, weird: 0.45, cursed: 0.9 };
const PIECE_NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

export default {
  id: 'chess',
  create(host, api) {
    const boardEl = h('div', { class: 'ch-board', role: 'grid', 'aria-label': 'Broken chess board' }), layer = h('div', { class: 'ch-pieces', 'aria-hidden': 'true' }), cells = [];
    for (let i = 0; i < 64; i++) {
      const b = h('button', { class: 'ch-cell ' + (((i >> 3) + (i & 7)) & 1 ? 'dk' : 'lt'), type: 'button', role: 'gridcell', dataset: { i } }); b.addEventListener('click', () => clickCell(i)); cells.push(b); boardEl.appendChild(b);
    }
    boardEl.appendChild(layer);
    for (let c = 0; c < 8; c++) { cells[56 + c].appendChild(h('i', { class: 'fl' }, 'abcdefgh'[c])); cells[c * 8].appendChild(h('i', { class: 'rk' }, 8 - c)); }
    const status = h('p', { class: 'ch-status', role: 'status', 'aria-live': 'polite' }), tele = h('div', { class: 'ch-tele' }), heat = h('div', { class: 'ch-heat' }), quirkEl = h('p', { class: 'ch-quirk' });
    const bubble = h('div', { class: 'ch-bubble' }), avatar = h('img', { class: 'ch-av', src: asset('assets/games/chess/bk.png'), alt: '' });
    const logEl = h('ol', { class: 'ch-log' }), rules = h('details', { class: 'ch-rules', open: !S.coarse }, h('summary', {}, gtt('chess.rules')), h('ol', {}, CH.rules.map(r => h('li', {}, h('b', {}, bindText(h('span'), r.name)), ' — ', bindText(h('span'), r.text)))));
    const over = h('div', { class: 'g-screen', hidden: true });
    const side = h('aside', { class: 'ch-side' }, h('div', { class: 'ch-bot' }, avatar, bubble), quirkEl, status, tele, heat, rules, h('div', { class: 'ch-logwrap' }, h('h4', {}, gtt('chess.moves')), logEl));
    host.append(h('div', { class: 'ch-wrap' }, boardEl, side), over);

    let st = null, sel = null, moves = [], busy = false, alive = true, quirk = 'pawn-cult', lastPlayer = null, imgs = new WeakMap(), gone = [];
    api.preload(['ch_select', 'ch_move', 'ch_capture', 'ch_shift', 'ch_static', 'ch_win', 'ch_lose', 'ch_think', 'ch_promote', 'ch_illegal']);
    const say = (key, extra) => { const pool = (extra ? CH.lines[key + '.' + extra] : null) || CH.lines[key]; if (!pool || !pool.length) return; const line = tx(pick(pool)); bubble.textContent = line; bubble.classList.remove('pop'); bubble.offsetWidth; bubble.classList.add('pop'); api.emit('chess:line', line); };

    function begin() {
      st = newGame(); sel = null; moves = []; busy = false; over.hidden = true; logEl.textContent = ''; lastPlayer = null; layer.textContent = ''; imgs = new WeakMap(); gone = [];
      quirk = pick(QUIRKS); quirkEl.textContent = ''; quirkEl.append(h('b', {}, gs('chess.quirk') + ': '), tx(CH.quirks[quirk].name), ' — ', h('i', {}, tx(CH.quirks[quirk].text)));
      render(false); say('start'); api.emit('game:start', 'chess');
    }
    const legalFor = from => legalMoves(st, 0).filter(m => m.from === from);

    function clickCell(i) {
      if (!st || busy || st.winner !== null || st.turn !== 0) return;
      const pc = st.board[i];
      if (sel !== null) { const mv = moves.find(m => m.to === i); if (mv) return play(mv); }
      if (pc && pc.c === 0) { const ms = legalFor(i); if (!ms.length) { api.sfx('ch_illegal', { vol: 0.5 }); sel = null; moves = []; hint(); return; } sel = i; moves = ms; api.sfx('ch_select', { vol: 0.6 }); hint(); }
      else { sel = null; moves = []; hint(); if (pc) api.sfx('ch_illegal', { vol: 0.4 }); }
    }
    function hint() {
      cells.forEach((b, i) => { b.classList.remove('sel', 'mv', 'cap', 'swp', 'bnc'); }); if (sel === null) return; cells[sel].classList.add('sel');
      if (api.getSetting('hints') === 'off') return;
      moves.forEach(m => cells[m.to].classList.add(m.type === 'capture' ? 'cap' : m.type === 'swap' ? 'swp' : 'mv', ...(m.bounce ? ['bnc'] : [])));
    }

    async function play(mv) {
      busy = true; sel = null; moves = []; hint(); lastPlayer = mv;
      await commit(mv); if (st.winner !== null) return end();
      if (mv.type === 'capture' && VAL[mv.cap] >= 500) say('playerCapture');
      await botTurn();
    }
    async function commit(mv) {
      const side = st.turn, ns = applyRaw(st, mv); st = ns; render(true); sound(ns.events);
      addLog(side, mv); await sleep(S.reduced ? 120 : 380);
      if (shiftDue(ns)) {                                         // the board breaks as its own beat
        say('shift'); cells.forEach(b => b.classList.add('rumble')); api.sfx('ch_shift'); api.emit('chess:shift'); await sleep(S.reduced ? 100 : 650);
        settle(st); cells.forEach(b => b.classList.remove('rumble')); render(true); await sleep(S.reduced ? 80 : 420);
      } else settle(st);
      render(false); if (st.statics.some(v => v > 0) && ns.events.includes('capture')) api.sfx('ch_static', { vol: 0.5 });
    }
    async function botTurn() {
      status.textContent = gs('chess.thinking'); say('thinking'); api.sfx('ch_think', { vol: 0.5 }); await sleep(S.reduced ? 300 : 700 + Math.random() * 700); if (!alive) return;
      const r = chooseMove(st, { chaos: CHAOS[api.getSetting('chaos')] ?? 0.45, quirk, lastPlayerMove: lastPlayer });
      if (!r) { st.winner = 0; return end(); }
      await commit(r.move); if (r.mood === 'quiet' && Math.random() < 0.5) say('quirk', quirk); else say(r.mood);
      if (st.winner !== null) return end(); busy = false; render(false);
    }
    function end() {
      busy = true; const w = st.winner; api.sfx(w === 0 ? 'ch_win' : 'ch_lose'); api.emit(w === 0 ? 'game:win' : 'game:over', 'chess'); say(w === 0 ? 'lose' : w === 1 ? 'win' : 'draw');
      over.textContent = ''; over.append(h('h3', { class: w === 0 ? '' : 'bad' }, gtt(w === 0 ? 'chess.youWin' : w === 1 ? 'chess.youLose' : 'chess.draw')), h('p', {}, gs('chess.plies') + ': ' + st.ply),
        h('div', { class: 'g-btns' }, h('button', { class: 'btn pri', type: 'button', on: { click: () => begin() } }, gtt('chess.again')))); over.hidden = false; render(false);
    }
    function sound(ev) { if (ev.includes('promote')) api.sfx('ch_promote'); if (ev.includes('capture')) api.sfx('ch_capture'); else if (!ev.length || ev.includes('swap')) api.sfx('ch_move'); else if (!ev.includes('shift')) api.sfx('ch_move'); }
    function addLog(side, mv) { const li = h('li', { class: side ? 'b' : 'w' }, h('i', {}, side ? '●' : '○'), ' ', describe(mv)); logEl.appendChild(li); logEl.scrollTop = logEl.scrollHeight; }

    /* ---------- drawing the position ---------- */
    function pieceEl(pc) {
      let e = imgs.get(pc); if (e) return e;
      e = h('img', { class: 'ch-pc', src: asset(`assets/games/chess/${pc.c ? 'b' : 'w'}${pc.t}.png`), alt: '', draggable: false }); imgs.set(pc, e); layer.appendChild(e); return e;
    }
    function render(animate) {
      const live = new Set();
      for (let i = 0; i < 64; i++) {
        const pc = st.board[i], b = cells[i], r = i >> 3, c = i & 7;
        b.classList.toggle('static', st.statics[i] > 0); b.classList.remove('tele', 'tele-s');
        b.setAttribute('aria-label', `${sqName(i)}${pc ? ' ' + (pc.c ? 'black ' : 'white ') + PIECE_NAME[pc.t] : ' empty'}${st.statics[i] > 0 ? ', static' : ''}`);
        if (!pc) continue; live.add(pc); const e = pieceEl(pc), prev = e._i; e._i = i;
        const far = prev !== undefined && (Math.abs((prev >> 3) - r) > 2 || Math.abs((prev & 7) - c) > 2) && !(['n'].includes(pc.t));
        if (!animate || S.reduced || prev === undefined) e.style.transition = 'none'; else e.style.transition = far && st.last && st.events && st.events.includes('shift') ? 'transform .55s cubic-bezier(.6,0,.3,1)' : 'transform .32s cubic-bezier(.3,.9,.3,1)';
        e.style.transform = `translate(${c * 100}%,${r * 100}%)`; e.classList.toggle('dead', false);
        if (prev === undefined && animate) { e.style.transition = 'none'; }
      }
      /* remove pieces that left the board */
      for (const e of [...layer.children]) { const stillThere = st.board.some(pc => pc && imgs.get(pc) === e); if (!stillThere && !e._dying) { e._dying = true; e.classList.add('dead'); setTimeout(() => e.remove(), 380); } }
      /* telegraph the next shift */
      const t = st.shift, due = shiftDue(st); shiftSquares(st).forEach(i => cells[i].classList.add('tele'));
      tele.textContent = ''; tele.append(h('b', {}, gs('chess.nextShift')), ' ', t.kind === 'row' ? gs('chess.row') + ' ' + (8 - t.idx) : gs('chess.col') + ' ' + 'abcdefgh'[t.idx], ' ', t.kind === 'row' ? (t.dir > 0 ? '→' : '←') : (t.dir > 0 ? '↓' : '↑'), ' · ', h('em', {}, due ? gs('chess.now') : gs('chess.in') + ' ' + (6 - (st.ply % 6)) + ' ' + gs('chess.plies')));
      heat.textContent = (st.heat[0] ? '🔥 ' + gs('chess.overheat') : '') + (st.heat[1] ? ' · ' + gs('chess.botOverheat') : '');
      if (!busy || st.winner !== null) status.textContent = st.winner !== null ? '' : st.turn === 0 ? gs('chess.yourTurn') : gs('chess.thinking');
      boardEl.classList.toggle('flat', api.getSetting('tilt') === 'off' || S.reduced);
    }
    begin();
    return { start() {}, restart() { begin(); }, pause() {}, resize() {}, onSetting() { render(false); hint(); }, destroy() { alive = false; } };
  }
};
