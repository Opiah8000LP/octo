/* js/scenes/pages.js — one canvas scene per page. Each reads the eased theme value S.d (0 day … 1 night)
   and branches on it, so day and night are different pictures, not recolours. All of them react to the music. */
import { S } from '../core/state.js';
import { rgba, sr, TAU } from '../core/util.js';
import { SHAPES, drawWire } from '../shapes/wire.js';

const night = () => S.d > 0.5;
const fit = () => Math.max(S.W, S.H);

/* ---------------------------------------------------------------- PORTFOLIO: the archive tunnel */
export function drawArchive(ctx) {
  const { W, H, t, mouse } = S, A = S.a, d = night();
  const vx = W / 2 + (mouse.x - W / 2) * 0.06, vy = H * 0.42 + (mouse.y - H / 2) * 0.04;
  const speed = 0.06 + A.bass * 0.12 + Math.min(1, Math.abs(S.scrollV || 0) * 0.02) * 0.2;
  S.arc = (S.arc || 0) + speed * S.dt; const z0 = S.arc % 1;
  ctx.lineWidth = 1;
  /* radial lines */
  ctx.strokeStyle = rgba(S.blue, d ? 0.5 : 0.35);
  ctx.beginPath();
  for (let i = -9; i <= 9; i++) {
    const x = vx + i * W * 0.17; ctx.moveTo(vx, vy); ctx.lineTo(x * 1.0 + (x - vx) * 2, H + 20);
    ctx.moveTo(vx, vy); ctx.lineTo(x + (x - vx) * 2, -20);
  }
  ctx.stroke();
  /* rungs: floor and ceiling */
  ctx.strokeStyle = rgba(S.ink, d ? 0.35 : 0.22);
  ctx.beginPath();
  for (let k = 0; k < 14; k++) {
    const z = ((k + z0) / 14), p = z * z;
    const yf = vy + (H - vy + 30) * p, yc = vy - (vy + 30) * p;
    ctx.moveTo(0, yf); ctx.lineTo(W, yf); ctx.moveTo(0, yc); ctx.lineTo(W, yc);
  }
  ctx.stroke();
  /* floating frames: contact-sheet / film frames flying toward you */
  const n = S.q < 0.7 ? 5 : 8;
  for (let i = 0; i < n; i++) {
    const z = ((i / n) + S.arc * 0.5) % 1, p = z * z, side = i % 2 ? 1 : -1;
    const fw = (60 + sr(i) * 80) * (0.2 + p * 5), fh = fw * (0.6 + sr(i + 4) * 0.4);
    const x = vx + side * (W * 0.06 + sr(i + 9) * W * 0.34) * p * 2.4, y = vy + (sr(i + 2) - 0.5) * H * 0.7 * p * 2;
    ctx.strokeStyle = rgba(S.ink, Math.min(0.9, p * 2) * (d ? 0.7 : 0.5)); ctx.lineWidth = 1 + p;
    ctx.strokeRect(x - fw / 2, y - fh / 2, fw, fh);
    if (d) { ctx.fillStyle = rgba(S.blue, 0.05 + p * 0.1 + A.bass * 0.06 * p); ctx.fillRect(x - fw / 2, y - fh / 2, fw, fh); }
    else { ctx.beginPath(); ctx.moveTo(x - fw / 2 - 8, y - fh / 2); ctx.lineTo(x - fw / 2 + 8, y - fh / 2); ctx.moveTo(x - fw / 2, y - fh / 2 - 8); ctx.lineTo(x - fw / 2, y - fh / 2 + 8); ctx.stroke(); }
  }
  /* horizon bar + vanishing glow */
  const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, fit() * 0.5);
  g.addColorStop(0, rgba(S.blue, d ? 0.35 + A.bass * 0.25 : 0.25 + A.bass * 0.15)); g.addColorStop(1, rgba(S.blue, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = rgba(S.ink, 0.9); ctx.lineWidth = 1.2;
  drawWire(ctx, SHAPES.cube, vx, vy, 16 + A.beat * 10 + A.bass * 8, t * 0.6, t * 0.8, 0);
}

/* ---------------------------------------------------------------- SERVICES: the price storm */
const GLY = ['$1', '$2', '$3', '$6', '100', '300', 'R$', '$', '+', '1', '3', '6', '%', '#'];
export function drawStorm(ctx) {
  const { W, H, t } = S, A = S.a;
  if (night()) {
    const cols = Math.min(Math.floor(W / (S.W < 700 ? 34 : 30)), S.q < 0.7 ? 18 : 40), cw = W / cols;
    ctx.font = '700 13px ui-monospace,Menlo,monospace'; ctx.textAlign = 'center';
    for (let c = 0; c < cols; c++) {
      const sp = 30 + sr(c) * 70, off = sr(c + 3) * H, len = 7 + (sr(c + 7) * 9 | 0);
      const y0 = ((t * sp * (1 + A.bass * 0.8) + off) % (H + len * 18)) ;
      for (let k = 0; k < len; k++) {
        const y = y0 - k * 18; if (y < -10 || y > H + 10) continue;
        const a = (1 - k / len) * (0.55 + A.high * 0.4);
        ctx.fillStyle = k === 0 ? 'rgba(255,255,255,.95)' : rgba(S.blue, a * 0.9);
        ctx.fillText(GLY[(c * 5 + k + ((t * 2) | 0) * (k === 0 ? 1 : 0)) % GLY.length], c * cw + cw / 2, y);
      }
    }
    const g = ctx.createRadialGradient(W / 2, H * 0.7, 0, W / 2, H * 0.7, fit() * 0.6);
    g.addColorStop(0, rgba(S.blue, 0.18 + A.bass * 0.15)); g.addColorStop(1, rgba(S.blue, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else {
    /* day: a printed halftone sheet with floating coins */
    const gx = Math.floor(W / (S.W < 700 ? 22 : 26)), gy = Math.floor(H / (S.W < 700 ? 22 : 26));
    const sx = W / gx, sy = H / gy; ctx.fillStyle = rgba(S.blue, 0.55);
    const step = S.q < 0.7 ? 2 : 1;
    for (let j = 0; j < gy; j += step) for (let i = 0; i < gx; i += step) {
      const v = (Math.sin(i * 0.35 + t * 0.9) + Math.cos(j * 0.3 - t * 0.7) + Math.sin((i + j) * 0.15 + t * 0.4)) / 3 * 0.5 + 0.5;
      const r = Math.max(0, v * v * sx * 0.55 * (1 + A.bass * 0.5)); if (r < 0.6) continue;
      ctx.beginPath(); ctx.arc(i * sx + sx / 2, j * sy + sy / 2, r, 0, TAU); ctx.fill();
    }
    for (let k = 0; k < 6; k++) {
      const x = W * (0.1 + 0.16 * k) + Math.sin(t * 0.6 + k) * 30, y = (H * (0.2 + sr(k) * 0.6) - t * (14 + k * 4)) % (H + 80); const yy = y < -40 ? y + H + 80 : y;
      ctx.strokeStyle = rgba(S.ink, 0.8); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, yy, 18 + k * 3 + A.beat * 5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = rgba(S.ink, 0.9); ctx.font = '800 14px Helvetica,Arial,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(k % 2 ? '$' : 'R$', x, yy + 5);
    }
  }
}

/* ---------------------------------------------------------------- CONTACT: the signal */
export function drawSignal(ctx) {
  const { W, H, t, mouse } = S, A = S.a, d = night();
  const cx = W * 0.5 + (mouse.x - W / 2) * 0.03, cy = H * 0.5 + (mouse.y - H / 2) * 0.03, R = fit() * 0.75;
  for (let k = 0; k < (S.q < 0.7 ? 7 : 11); k++) {
    const p = ((t * 0.14 + k / 11) + A.lowN * 0.0) % 1, r = p * R * (1 + A.bass * 0.06);
    ctx.strokeStyle = d ? rgba(S.blue, (1 - p) * 0.7) : rgba(S.ink, (1 - p) * 0.45); ctx.lineWidth = 1 + (1 - p) * (d ? 2.5 : 1.2);
    ctx.beginPath();
    if (d) ctx.arc(cx, cy, r, 0, TAU);
    else for (let s = 0; s <= 72; s++) { const an = s / 72 * TAU, rr = r * (1 + 0.04 * Math.sin(5 * an + t + k)); const x = cx + Math.cos(an) * rr * 1.2, y = cy + Math.sin(an) * rr * 0.85; s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
  /* orbiting satellites */
  ctx.fillStyle = S.inkc; for (let i = 0; i < 5; i++) { const an = t * (0.2 + i * 0.07) + i * 1.3, r = R * (0.18 + i * 0.1); const s = 5 + A.tick * 6; ctx.fillRect(cx + Math.cos(an) * r - s / 2, cy + Math.sin(an) * r * 0.7 - s / 2, s, s); }
  if (!d) { /* paper plane scribble */
    ctx.strokeStyle = rgba(S.ink, 0.8); ctx.lineWidth = 1.4; const px = W * 0.8 + Math.sin(t * 0.5) * 30, py = H * 0.25 + Math.cos(t * 0.4) * 20;
    ctx.beginPath(); ctx.moveTo(px - 40, py); ctx.lineTo(px + 40, py - 18); ctx.lineTo(px + 8, py + 30); ctx.lineTo(px - 6, py + 6); ctx.closePath(); ctx.moveTo(px + 40, py - 18); ctx.lineTo(px - 6, py + 6); ctx.stroke();
  }
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5); g.addColorStop(0, rgba(S.blue, 0.22 + A.bass * 0.18)); g.addColorStop(1, rgba(S.blue, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/* ---------------------------------------------------------------- CREDITS: the log */
const HEX = '0123456789ABCDEF';
const cols = Array.from({ length: 22 }, (_, i) => ({ x: i / 22, sp: 6 + sr(i) * 22, seed: i * 17, len: 30 + (sr(i + 3) * 40 | 0) }));
export function drawLog(ctx) {
  const { W, H, t } = S, A = S.a, d = night();
  if (d) {
    ctx.font = '11px ui-monospace,Menlo,monospace'; ctx.textAlign = 'left';
    const n = S.q < 0.7 ? 10 : cols.length;
    for (let i = 0; i < n; i++) {
      const c = cols[i], x = c.x * W + 6, off = (t * c.sp) % 16;
      for (let k = 0; k < Math.min(c.len, H / 14); k++) {
        const y = k * 14 - off + 14, fade = 0.08 + 0.25 * Math.abs(Math.sin(k * 0.3 + t * 0.4 + i)); ctx.fillStyle = rgba(S.blue, fade + A.high * 0.12);
        const row = ((c.seed + k + Math.floor(t * c.sp / 16)) * 2654435761) >>> 0; ctx.fillText(HEX[row & 15] + HEX[(row >> 4) & 15] + HEX[(row >> 8) & 15], x, y);
      }
    }
    const sy = (t * 60) % (H + 100) - 50, g = ctx.createLinearGradient(0, sy - 40, 0, sy + 40); g.addColorStop(0, rgba(S.blue, 0)); g.addColorStop(0.5, rgba(S.blue, 0.2 + A.bass * 0.1)); g.addColorStop(1, rgba(S.blue, 0));
    ctx.fillStyle = g; ctx.fillRect(0, sy - 40, W, 80);
  } else {
    ctx.strokeStyle = rgba(S.blue, 0.4); ctx.lineWidth = 1; ctx.beginPath(); for (let y = 40; y < H; y += 28) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,107,138,.7)'; ctx.beginPath(); const mx = Math.min(W * 0.1, 90); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.moveTo(mx + 5, 0); ctx.lineTo(mx + 5, H); ctx.stroke();
    ctx.fillStyle = rgba(S.ink, 0.55); for (let i = 0; i < 9; i++) { const y = 60 + i * (H / 9); ctx.beginPath(); ctx.arc(mx / 2, y, 6, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = rgba(S.ink, 0.5); ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { const x = W * (0.55 + 0.1 * i) + Math.sin(t * 0.4 + i) * 8, y = H * (0.15 + 0.2 * i) + Math.cos(t * 0.5 + i) * 6, r = 14 + i * 4 + A.beat * 4; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 + t * 0.2, rr = k % 2 ? r * 0.45 : r; k ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.stroke(); }
  }
}
