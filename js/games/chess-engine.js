/* js/games/chess-engine.js — BROKEN CHESS rules. Pure logic (no DOM) so the bot, the UI and the tests all share it.

   Board: 64 squares, index = row*8 + col. Row 0 is the top (black's home), row 7 the bottom (white's home). side 0 = white (player), 1 = black (bot).
   Pieces: { t: 'p'|'n'|'b'|'r'|'q'|'k', c: 0|1 }

   THE BROKEN RULES (nothing here is standard or "standard modded" chess):
   1  REGICIDE      there is no check. Capture the enemy king and you win. No legal move at all = you lose.
   2  TECTONIC SHIFT every 6 plies a pre-announced row or column slides one square, wrapping around the edge, carrying every piece on it.
                    The next shift is always shown (which line, which way, in how many plies). A pawn dragged onto its far rank is promoted.
   3  BOUNCING BISHOPS a bishop's diagonal ray reflects ONCE off the board edge (billiards) and keeps going.
   4  SWAPPING ROOKS  a rook may swap places with the first FRIENDLY piece on a line instead of being blocked by it.
   5  PAWN RIOT      pawns capture diagonally forward AND sideways (left/right); they still step 1 (2 from home) and promote to a queen.
   6  STATIC         every capture leaves the square STATIC for 2 plies: nothing may land on it or slide through it (so the capturer is safe there).
                     A piece standing on a static square may still leave.
   7  OVERHEAT       if you moved a queen, your queens are overheated and cannot move on your next turn.
   Kings step 1 square (no castling). Knights jump as usual. Pawns promote to queens. After 200 plies the board gives up (draw). */

export const SHIFT_EVERY = 6, STATIC_PLIES = 3, MAX_PLY = 200;
export const VAL = { p: 100, n: 300, b: 320, r: 500, q: 900, k: 0 };
const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const P = (t, c) => ({ t, c });

function rng(seed) { let a = seed >>> 0; a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a]; }

export function newGame(seed = (Math.random() * 1e9) | 0) {
  const b = Array(64).fill(null), back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) { b[c] = P(back[c], 1); b[8 + c] = P('p', 1); b[48 + c] = P('p', 0); b[56 + c] = P(back[c], 0); }
  const st = { board: b, turn: 0, ply: 0, heat: [false, false], statics: Array(64).fill(0), shift: null, seed: seed >>> 0, winner: null, last: null, log: [] };
  planShift(st); return st;
}
function planShift(st) {
  let r; [r, st.seed] = rng(st.seed); const kind = r < 0.5 ? 'row' : 'col';
  [r, st.seed] = rng(st.seed); const idx = Math.floor(r * 8);
  [r, st.seed] = rng(st.seed); st.shift = { kind, idx, dir: r < 0.5 ? -1 : 1 };
}
export const shiftIn = st => SHIFT_EVERY - (st.ply % SHIFT_EVERY);
export const shiftSquares = st => { const out = []; for (let i = 0; i < 8; i++) out.push(st.shift.kind === 'row' ? st.shift.idx * 8 + i : i * 8 + st.shift.idx); return out; };

/* ---------------- move generation ---------------- */
function gen(st, side) {
  const b = st.board, out = [], S = st.statics;
  for (let from = 0; from < 64; from++) {
    const pc = b[from]; if (!pc || pc.c !== side) continue;
    if (pc.t === 'q' && st.heat[side]) continue;                                       // rule 7
    const r = from >> 3, c = from & 7;
    const add = (to, type, extra) => { out.push(Object.assign({ from, to, type, piece: pc.t, side, cap: type === 'capture' ? b[to].t : null }, extra)); };
    const land = (nr, nc) => { if (!inb(nr, nc)) return 0; const to = nr * 8 + nc; if (S[to] > 0) return 0; const t = b[to]; if (!t) { add(to, 'move'); return 1; } if (t.c !== side) { add(to, 'capture'); return 2; } return 3; };

    if (pc.t === 'p') {
      const d = side === 0 ? -1 : 1, home = side === 0 ? 6 : 1, f = (r + d) * 8 + c;
      if (inb(r + d, c) && !b[f] && !S[f]) { add(f, 'move'); const f2 = (r + 2 * d) * 8 + c; if (r === home && !b[f2] && !S[f2]) add(f2, 'move'); }
      for (const [dr, dc] of [[d, -1], [d, 1], [0, -1], [0, 1]]) { const nr = r + dr, nc = c + dc; if (!inb(nr, nc)) continue; const to = nr * 8 + nc; if (b[to] && b[to].c !== side && !S[to]) add(to, 'capture'); }   // rule 5
    } else if (pc.t === 'n') { for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) land(r + dr, c + dc); }
    else if (pc.t === 'k') { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) land(r + dr, c + dc); }
    else if (pc.t === 'r' || pc.t === 'q') {
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let nr = r + dr, nc = c + dc;
        while (inb(nr, nc)) {
          const to = nr * 8 + nc; if (S[to] > 0) break; const t = b[to];
          if (!t) add(to, 'move'); else if (t.c !== side) { add(to, 'capture'); break; }
          else { if (pc.t === 'r') add(to, 'swap', { swapWith: t.t }); break; }                // rule 4
          nr += dr; nc += dc;
        }
      }
    }
    if (pc.t === 'b' || pc.t === 'q') {
      for (const [sdr, sdc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        let cr = r, cc = c, dr = sdr, dc = sdc, bounced = false; const seen = new Set();
        for (let step = 0; step < 20; step++) {
          let nr = cr + dr, nc = cc + dc;
          if (!inb(nr, nc)) {
            if (pc.t === 'q' || bounced) break;                                           // rule 3: bishops only, one bounce
            bounced = true; if (nr < 0 || nr > 7) dr = -dr; if (nc < 0 || nc > 7) dc = -dc; nr = cr + dr; nc = cc + dc; if (!inb(nr, nc)) break;
          }
          const to = nr * 8 + nc; cr = nr; cc = nc; if (to === from) continue;
          if (S[to] > 0) break; const t = b[to];
          if (!t) { if (!seen.has(to)) { seen.add(to); add(to, 'move', bounced ? { bounce: true } : undefined); } }
          else if (t.c !== side) { if (!seen.has(to)) { seen.add(to); add(to, 'capture', bounced ? { bounce: true } : undefined); } break; }
          else break;
        }
      }
    }
  }
  return out;
}
export function legalMoves(st, side = st.turn) { return st.winner !== null ? [] : gen(st, side); }

/* ---------------- applying a move (returns a NEW state) ---------------- */
const far = (pc, to) => pc.t === 'p' && ((pc.c === 0 && (to >> 3) === 0) || (pc.c === 1 && (to >> 3) === 7));
export function apply(st, mv) { return settle(applyRaw(st, mv)); }
/* applyRaw: just the move itself. settle: everything that happens after it (shift, statics ticking, win checks). The UI calls them
   separately so a shift can play as its own beat after your move; the bot and the tests just call apply(). */
export function applyRaw(st, mv) {
  const b = st.board.slice(), S = st.statics.slice(), side = st.turn, events = [];
  const pc = b[mv.from], tgt = b[mv.to]; let winner = null;
  if (mv.type === 'swap') { b[mv.to] = pc; b[mv.from] = tgt; events.push('swap'); if (far(tgt, mv.from)) { b[mv.from] = P('q', tgt.c); events.push('promote'); } }
  else {
    b[mv.from] = null; b[mv.to] = pc;
    if (mv.type === 'capture') { S[mv.to] = STATIC_PLIES; events.push('capture'); if (tgt.t === 'k') winner = side; }
  }
  if (far(b[mv.to], mv.to) && b[mv.to].c === side && b[mv.to].t === 'p') { b[mv.to] = P('q', side); events.push('promote'); }
  const ns = { board: b, turn: 1 - side, ply: st.ply + 1, heat: st.heat.slice(), statics: S, shift: st.shift, seed: st.seed, winner, last: mv, log: st.log, events, settled: false };
  ns.heat[side] = pc.t === 'q' && mv.type !== 'swap';                                    // rule 7
  return ns;
}
export const shiftDue = ns => ns.winner === null && !ns.settled && ns.ply % SHIFT_EVERY === 0;
export function settle(ns) {
  if (ns.settled) return ns; ns.settled = true; const S = ns.statics;
  if (ns.winner === null) {
    if (ns.ply % SHIFT_EVERY === 0) { doShift(ns); ns.events.push('shift'); planShift(ns); }          // rule 2
    for (let i = 0; i < 64; i++) if (S[i] > 0) S[i]--;                                    // rule 6 ticks down
    if (kingGone(ns, 0)) ns.winner = 1; else if (kingGone(ns, 1)) ns.winner = 0;
    if (ns.winner === null && ns.ply >= MAX_PLY) ns.winner = 'draw';
    if (ns.winner === null && gen(ns, ns.turn).length === 0) ns.winner = 1 - ns.turn;   // rule 1: stuck = lose
  }
  return ns;
}
const kingGone = (st, side) => !st.board.some(p => p && p.t === 'k' && p.c === side);
function doShift(st) {
  const { kind, idx, dir } = st.shift, old = st.board, b = old.slice(), moved = [];
  for (let i = 0; i < 8; i++) {
    const from = kind === 'row' ? idx * 8 + i : i * 8 + idx, to = kind === 'row' ? idx * 8 + (i + dir + 8) % 8 : ((i + dir + 8) % 8) * 8 + idx;
    b[to] = old[from]; if (old[from]) moved.push([from, to]);
  }
  for (const [, to] of moved) { const p = b[to]; if (p && far(p, to)) b[to] = P('q', p.c); }
  st.board = b; st.shiftMoved = moved;
}

/* ---------------- evaluation helpers shared by the bot ---------------- */
export function material(st, side) { let m = 0; for (const p of st.board) if (p) m += (p.c === side ? 1 : -1) * VAL[p.t]; return m; }
export const sqName = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));
export function describe(mv) { const N = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' }; return `${N[mv.piece]}${sqName(mv.from)}${mv.type === 'capture' ? 'x' : mv.type === 'swap' ? '⇄' : '→'}${sqName(mv.to)}${mv.bounce ? '↺' : ''}`; }
