/* js/games/chess-ai.js — the BROKEN CHESS bot. It plays by the same broken rules (moves come from legalMoves(), shifts and statics are
   simulated while it searches) but it has a weird personality: each game it picks a QUIRK that bends its evaluation, and a chaos dial
   adds noise and the occasional complete brain-fart.  It is not trying to play good chess. It is trying to be a character. */
import { legalMoves, apply, VAL, shiftSquares, sqName } from './chess-engine.js';

export const QUIRKS = ['pawn-cult', 'corner-goblin', 'knight-hater', 'queen-simp', 'mirror', 'shift-gambler', 'sacrificer'];
const CENTER = i => { const r = i >> 3, c = i & 7; return 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5)); };

function evalState(st, me, q, last) {
  if (st.winner === me) return 100000 - st.ply; if (st.winner === 1 - me) return -100000 + st.ply; if (st.winner === 'draw') return 0;
  let s = 0; const b = st.board, line = q === 'shift-gambler' ? new Set(shiftSquares(st)) : null;
  for (let i = 0; i < 64; i++) {
    const p = b[i]; if (!p) continue; const sg = p.c === me ? 1 : -1, r = i >> 3, c = i & 7; let v = VAL[p.t];
    if (q === 'pawn-cult' && p.t === 'p') v += 150 + (p.c === 0 ? 6 - r : r - 1) * 18; if (q === 'pawn-cult' && p.t === 'q') v -= 350;
    if (q === 'knight-hater' && p.t === 'n') v += p.c === me ? -220 : 260;
    if (q === 'sacrificer' && (p.t === 'q' || p.t === 'r') && p.c === me) v -= 380;
    if (q === 'corner-goblin') v += (CENTER(i) < 1 ? 55 : 0) * (p.c === me ? 1 : 0);
    else v += CENTER(i) * (p.t === 'p' ? 4 : 7) * (p.t === 'k' ? -0.5 : 1);
    if (q === 'shift-gambler' && line.has(i) && p.c === me) v += 60;
    if (q === 'queen-simp' && p.t === 'q' && p.c === me) { const k = b.findIndex(x => x && x.t === 'k' && x.c === me); if (k >= 0) v += 120 - 30 * Math.max(Math.abs((k >> 3) - r), Math.abs((k & 7) - c)); }
    s += sg * v;
  }
  if (q === 'mirror' && last && st.last && st.last.side === me) { const mf = 63 - last.from, mt = 63 - last.to; if (st.last.from === mf && st.last.to === mt) s += 400; }
  return s;
}
function order(moves) { return moves.sort((a, b) => ((b.cap ? VAL[b.cap] : 0) - (a.cap ? VAL[a.cap] : 0)) || (a.type === 'swap') - (b.type === 'swap')); }

export function chooseMove(st, { chaos = 0.4, quirk = 'pawn-cult', depth = 3, lastPlayerMove = null, budget = 14000 } = {}) {
  const me = st.turn, moves = order(legalMoves(st, me)); if (!moves.length) return null;
  const rnd = Math.random;
  /* 1. brain-fart */
  if (rnd() < chaos * 0.12) { const m = moves[(rnd() * moves.length) | 0]; return { move: m, mood: 'fart', quirk }; }
  let nodes = 0; const d = moves.length > 34 ? 2 : depth;
  const search = (s, dp, alpha, beta, maxi) => {
    if (dp === 0 || s.winner !== null || ++nodes > budget) return evalState(s, me, quirk, lastPlayerMove);
    const ms = order(legalMoves(s, s.turn)); if (!ms.length) return evalState(s, me, quirk, lastPlayerMove);
    if (maxi) { let v = -Infinity; for (const m of ms) { v = Math.max(v, search(apply(s, m), dp - 1, alpha, beta, false)); alpha = Math.max(alpha, v); if (alpha >= beta) break; } return v; }
    let v = Infinity; for (const m of ms) { v = Math.min(v, search(apply(s, m), dp - 1, alpha, beta, true)); beta = Math.min(beta, v); if (alpha >= beta) break; } return v;
  };
  const scored = moves.map(m => { const ns = apply(st, m); let v = search(ns, d - 1, -Infinity, Infinity, false); v += (rnd() - 0.5) * chaos * 140; if (quirk === 'mirror' && lastPlayerMove && m.from === 63 - lastPlayerMove.from && m.to === 63 - lastPlayerMove.to) v += 500; return { m, v }; });
  scored.sort((a, b) => b.v - a.v);
  /* 2. pick among the top few, more recklessly when chaotic */
  const k = rnd() < chaos * 0.45 ? Math.min(scored.length, 2 + ((chaos * 5) | 0)) : 1; const pickd = scored[(rnd() * k) | 0];
  const mood = pickd.m.cap && VAL[pickd.m.cap] >= 500 ? 'bigcapture' : pickd.m.cap ? 'capture' : pickd.m.type === 'swap' ? 'swap' : pickd.m.bounce ? 'bounce' : k > 1 && pickd !== scored[0] ? 'weird' : 'quiet';
  return { move: pickd.m, mood, quirk, score: pickd.v };
}
