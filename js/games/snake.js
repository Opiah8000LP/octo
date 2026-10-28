/* js/games/snake.js — REIMAGINED SNAKE ("HEXWARP").
   · The arena is a HEX grid, and you never steer absolutely: you only turn 60° LEFT or RIGHT.
   · Two layers share the same board: GROUND (flat, 2D) and SKY (raised, 3D). SHIFT hops between them (limited charges).
     Holes only kill on the ground, spikes only kill in the sky, walls kill on both — and you can hop OVER your own tail.
   · Food lives on one layer; you must be on that layer to eat it. The edge of the board wraps through the middle.
   · Every 8 bits the board DROPS: it flips over, holes ⇄ spikes swap, and everything is re-arranged. */
import { S } from '../core/state.js';
import { h, clamp, lerp, rnd, pick, TAU, rgba, shuffle } from '../core/util.js';
import { gtt, gs, loadImg } from './common.js';

const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const SZ = { small: 5, medium: 7, large: 9 }, SPD = { slow: 330, normal: 250, fast: 180 };
const key = (q, r) => q + ',' + r;
const inside = (q, r, R) => Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) <= R;

export default {
  id: 'snake',
  create(host, api) {
    const cv = h('canvas', { class: 'sn-cv', tabindex: 0, 'aria-label': 'Reimagined Snake. Left and right arrows turn, up arrow or space shifts layer.' }), c = cv.getContext('2d', { alpha: false });
    const hud = { score: h('b', {}, '0'), len: h('b', {}, '3'), plane: h('b', {}, ''), chg: h('b', {}, ''), drop: h('b', {}, ''), banner: h('div', { class: 'sn-banner', 'aria-live': 'polite' }) };
    const hudEl = h('div', { class: 'sn-hud' }, h('div', {}, h('small', {}, gtt('snake.score')), hud.score), h('div', {}, h('small', {}, gtt('snake.length')), hud.len), h('div', {}, h('small', {}, gtt('snake.layer')), hud.plane), h('div', {}, h('small', {}, gtt('snake.charges')), hud.chg), h('div', {}, h('small', {}, gtt('snake.drop')), hud.drop));
    const mkBtn = (cls, label, fn) => { const b = h('button', { type: 'button', class: 'sn-b ' + cls }, label); b.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); return b; };
    const pad = h('div', { class: 'sn-pad' }, mkBtn('l', gtt('snake.left'), () => turn(1)), mkBtn('s', gtt('snake.shift'), () => shift()), mkBtn('r', gtt('snake.right'), () => turn(-1)));
    const menu = h('div', { class: 'g-screen sn-menu' }, h('h3', {}, 'HEXWARP'), h('p', {}, gtt('snake.how')), h('ul', { class: 'sn-legend' }, ['food', 'hole', 'spike', 'portal'].map(k => h('li', {}, h('img', { src: new URL(`../../assets/games/snake/${k}.png`, import.meta.url).href, alt: '' }), gtt('snake.' + k)))), h('button', { class: 'btn pri lg', type: 'button', on: { click: () => begin() } }, gtt('snake.start')));
    const over = h('div', { class: 'g-screen', hidden: true }), pauseS = h('div', { class: 'g-screen', hidden: true }, h('h3', {}, gtt('snake.paused')), h('button', { class: 'btn pri', type: 'button', on: { click: () => togglePause() } }, gtt('snake.resume')));
    host.append(cv, hudEl, hud.banner, pad, menu, over, pauseS);

    const img = {}; ['food', 'hole', 'spike', 'portal'].forEach(k => loadImg(`assets/games/snake/${k}.png`).then(i => { img[k] = i; }));
    api.preload(['sn_turn', 'sn_eat', 'sn_shift', 'sn_shift_back', 'sn_die', 'sn_drop', 'sn_spawn', 'sn_portal']);

    let W = 0, H = 0, DPR = 1, raf = 0, alive = true, state = 'menu', R = 7, size = 30, acc = 0, tickMs = 250, last = performance.now();
    let snake, heading, plane, charges, foods, score, best, queue, food, hazards, portals, flip, camYaw = 0, camYawT = 0, shiftAnim = 0, shake = 0, nextDrop, comboT = 0, ticks = 0, bannerT = 0;
    const parts = [];
    best = api.store.get('best', 0);
    const set = k => api.getSetting(k);

    function begin() {
      R = SZ[set('size')] || 7; tickMs = SPD[set('speed')] || 250; menu.hidden = over.hidden = pauseS.hidden = true;
      snake = [{ q: -2, r: 0, p: 0 }, { q: -3, r: 0, p: 0 }, { q: -4, r: 0, p: 0 }]; heading = 0; plane = 0; charges = 2; foods = 0; score = 0; queue = []; hazards = []; portals = null; flip = null; ticks = 0; nextDrop = 8; acc = 0; parts.length = 0; comboT = 0;
      camYaw = camYawT = 0; spawnFood(); state = 'play'; resize(); updHud(); cv.focus({ preventScroll: true }); api.emit('game:start', 'snake'); say(gs('snake.go'));
    }
    const free = (q, r, minD = 0) => { if (!inside(q, r, R)) return false; if (snake.some(s => s.q === q && s.r === r)) return false; if (food && food.q === q && food.r === r) return false; if (hazards.some(z => z.q === q && z.r === r)) return false; if (portals && portals.some(z => z.q === q && z.r === r)) return false; const hd = snake[0]; return Math.max(Math.abs(q - hd.q), Math.abs(r - hd.r), Math.abs(-q - r + hd.q + hd.r)) >= minD; };
    const randCell = (minD = 0) => { for (let i = 0; i < 80; i++) { const q = (Math.random() * (2 * R + 1) | 0) - R, r = (Math.random() * (2 * R + 1) | 0) - R; if (free(q, r, minD)) return { q, r }; } return null; };
    function spawnFood() { const cell = randCell(2); if (cell) { food = { ...cell, p: Math.random() < 0.5 ? 0 : 1 }; api.sfx('sn_spawn', { vol: 0.6 }); } }
    function spawnHazard() {
      const cell = randCell(4); if (!cell) return; const t = pick(['hole', 'hole', 'spike', 'spike', 'wall']); hazards.push({ ...cell, t, arm: 4 }); api.sfx('sn_spawn', { vol: 0.5, rate: 0.7 });
    }
    function spawnPortals() { const a = randCell(3), b = a && randCell(3); if (a && b && (a.q !== b.q || a.r !== b.r)) portals = [a, b]; }
    const say = s => { hud.banner.textContent = s; hud.banner.classList.remove('on'); hud.banner.offsetWidth; hud.banner.classList.add('on'); bannerT = 1.4; };

    function turn(d) { if (state !== 'play' || flip) return; if (queue.length < 2) queue.push(d); }
    function shift() {
      if (state !== 'play' || flip) return; if (charges <= 0) { api.sfx('ui_error', { vol: 0.5 }); say(gs('snake.noCharge')); return; }
      charges--; plane = 1 - plane; snake[0].p = plane; shiftAnim = 1; api.sfx(plane ? 'sn_shift' : 'sn_shift_back'); updHud();
    }
    function togglePause() { if (state === 'play') { state = 'pause'; pauseS.hidden = false; } else if (state === 'pause') { state = 'play'; pauseS.hidden = true; last = performance.now(); } }

    function die(why) {
      state = 'over'; api.sfx('sn_die'); shake = 14; for (let i = 0; i < 40; i++) addP(snake[0], '#ff2a6d'); if (score > best) { best = score; api.store.set('best', best); }
      api.emit('game:over', 'snake'); over.textContent = '';
      over.append(h('h3', { class: 'bad' }, gtt('snake.dead')), h('p', { class: 'why' }, gs('snake.why.' + why)), h('dl', { class: 'res' }, h('div', {}, h('dt', {}, gtt('snake.score')), h('dd', {}, score)), h('div', {}, h('dt', {}, gtt('snake.length')), h('dd', {}, snake.length)), h('div', {}, h('dt', {}, gtt('snake.best')), h('dd', {}, best))),
        h('div', { class: 'g-btns' }, h('button', { class: 'btn pri', type: 'button', on: { click: () => begin() } }, gtt('snake.again')), h('button', { class: 'btn', type: 'button', on: { click: () => { over.hidden = true; menu.hidden = false; state = 'menu'; } } }, gtt('snake.menu'))));
      over.hidden = false;
    }
    const wrap = (q, r, d) => { if (inside(q, r, R)) return [q, r]; let nq = -q + d[0], nr = -r + d[1]; if (inside(nq, nr, R)) return [nq, nr]; nq = -q; nr = -r; return inside(nq, nr, R) ? [nq, nr] : [0, 0]; };

    function tick() {
      ticks++; if (queue.length) { heading = (heading + queue.shift() + 6) % 6; api.sfx('sn_turn', { vol: 0.5 }); camYawT = set('camera') === 'follow' ? heading * Math.PI / 3 : 0; }
      hazards.forEach(z => { if (z.arm > 0) z.arm--; });
      const hd = snake[0], d = DIRS[heading]; let [q, r] = wrap(hd.q + d[0], hd.r + d[1], d);
      if (portals) { const i = portals.findIndex(z => z.q === q && z.r === r); if (i >= 0) { const o = portals[1 - i]; q = o.q; r = o.r; api.sfx('sn_portal', { vol: 0.7 }); for (let k = 0; k < 14; k++) addP({ q, r, p: plane }, '#05d9e8'); say(gs('snake.warp')); } }
      const p = plane, hz = hazards.find(z => z.q === q && z.r === r && z.arm === 0);
      if (hz) { if (hz.t === 'wall') return die('wall'); if (hz.t === 'hole' && p === 0) return die('hole'); if (hz.t === 'spike' && p === 1) return die('spike'); }
      const body = snake.slice(0, -1); if (body.some(s => s.q === q && s.r === r && s.p === p)) return die('self');
      snake.unshift({ q, r, p });
      if (food && food.q === q && food.r === r && food.p === p) {
        foods++; comboT = comboT > 0 ? comboT + 1 : 1; const bonus = ticks - (eatAt || 0) < 12 ? 5 : 0; eatAt = ticks; score += 10 + bonus + Math.min(20, foods); api.sfx('sn_eat', { rate: 1 + Math.min(0.5, foods * 0.02) }); for (let i = 0; i < 18; i++) addP(snake[0], '#ffe14a');
        if (foods % 3 === 0 && charges < 3) { charges++; say(gs('snake.charge')); }
        if (foods % 2 === 0) spawnHazard(); if (foods === 5 && !portals) spawnPortals();
        tickMs = Math.max(105, tickMs * 0.975); food = null; spawnFood();
        if (foods >= nextDrop) { nextDrop += 8; startFlip(); }
      } else snake.pop();
      updHud();
    }
    let eatAt = 0;
    function startFlip() { flip = { t: 0, dur: 1.1, swapped: false }; api.sfx('sn_drop'); say(gs('snake.dropMsg')); shake = 10; }
    function doSwap() {
      hazards.forEach(z => { if (z.t === 'hole') z.t = 'spike'; else if (z.t === 'spike') z.t = 'hole'; z.arm = Math.max(z.arm, 3); });
      if (food) food.p = 1 - food.p; const hd = snake[0]; hazards = hazards.filter(z => Math.max(Math.abs(z.q - hd.q), Math.abs(z.r - hd.r)) > 2);
      for (let i = 0; i < 2; i++) spawnHazard(); if (portals) { portals = null; spawnPortals(); } charges = Math.min(3, charges + 1);
    }
    function addP(cell, col) { if (S.reduced && parts.length > 12) return; const a = Math.random() * TAU, v = rnd(40, 200); parts.push({ q: cell.q, r: cell.r, z: cell.p ? 1 : 0, ox: 0, oy: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, c: col }); }
    function updHud() { hud.score.textContent = score; hud.len.textContent = snake.length; hud.plane.textContent = gs(plane ? 'snake.sky' : 'snake.ground'); hud.chg.textContent = '◆'.repeat(charges) + '◇'.repeat(3 - charges); hud.drop.textContent = Math.max(0, nextDrop - foods); }

    /* ---------- projection: 2D ground, 3D sky ---------- */
    let cx = 0, cy = 0, tiltT = 0;
    function proj(q, r, z) {
      let x = size * Math.sqrt(3) * (q + r / 2), y = size * 1.5 * r;
      if (camYaw) { const ca = Math.cos(-camYaw), sa = Math.sin(-camYaw); [x, y] = [x * ca - y * sa, x * sa + y * ca]; }
      const t = tiltT, flipS = flip ? Math.cos(Math.PI * clamp(flip.t / flip.dur, 0, 1)) : 1;
      const zz = z * size * 1.1 * flipS, y2 = y * Math.cos(t) * flipS - zz * Math.sin(t) * (flip ? 1 : 1), dep = y * Math.sin(t) + zz * Math.cos(t), k = 900 / (900 - dep * 0.9);
      return { x: cx + x * k, y: cy + (y * Math.cos(t) * flipS - zz * Math.sin(t) + (flip ? 0 : 0)) * k, k };
    }
    function hexPath(q, r, z, s = 1) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + TAU / 12, ox = Math.cos(a) * size * s, oy = Math.sin(a) * size * s; const p0 = proj(q, r, z), ang = camYaw ? -camYaw : 0; const rx = ox * Math.cos(ang) - oy * Math.sin(ang), ry = ox * Math.sin(ang) + oy * Math.cos(ang); const px = p0.x + rx * p0.k, py = p0.y + ry * p0.k * Math.cos(tiltT) * (flip ? Math.cos(Math.PI * clamp(flip.t / flip.dur, 0, 1)) : 1); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); }

    function resize() {
      const r = host.getBoundingClientRect(); W = Math.max(260, r.width); H = Math.max(260, r.height); DPR = Math.min(devicePixelRatio || 1, S.q < 0.7 ? 1 : 1.5); cv.width = W * DPR | 0; cv.height = H * DPR | 0; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      const RR = state === 'menu' ? 7 : R; size = Math.min(W / (Math.sqrt(3) * (2 * RR + 1.6)), H * (S.coarse ? 0.68 : 0.82) / (1.5 * (2 * RR + 1) + 0.5)); cx = W / 2; cy = H * (S.coarse ? 0.46 : 0.5);
    }
    const ro = new ResizeObserver(resize); ro.observe(host);

    function frame(ms) {
      if (!alive) return; raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (ms - last) / 1000); last = ms;
      if (state === 'play') {
        if (flip) { flip.t += dt; if (!flip.swapped && flip.t > flip.dur / 2) { flip.swapped = true; doSwap(); } if (flip.t >= flip.dur) flip = null; }
        else { acc += dt * 1000; while (acc >= tickMs && state === 'play') { acc -= tickMs; tick(); } }
      }
      tiltT = lerp(tiltT, set('tilt') === 'off' ? 0 : 0.95 + Math.sin(S.t * 0.4) * (S.reduced ? 0 : 0.06), 0.1); camYaw = lerp(camYaw, camYawT, 0.12); shiftAnim *= Math.pow(0.85, dt * 60); shake *= Math.pow(0.86, dt * 60);
      if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) hud.banner.classList.remove('on'); }
      draw(dt);
    }
    const planeCol = ['#a596ff', '#ff6bd6'];
    function draw(dt) {
      const sx = shake > 0.5 && !S.reduced ? rnd(-shake, shake) : 0, sy = shake > 0.5 && !S.reduced ? rnd(-shake, shake) : 0;
      c.setTransform(DPR, 0, 0, DPR, sx * DPR, sy * DPR); c.fillStyle = '#0a0913'; c.fillRect(-20, -20, W + 40, H + 40);
      /* starfield + vignette */
      c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 50; i++) { const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * W, y = (Math.sin(i * 53.1) * 0.5 + 0.5) * H; c.fillRect(x, (y + S.t * 6 * (1 + i % 3)) % H, 1.5, 1.5); }
      const rr = state === 'menu' ? 7 : R, A = S.a;
      /* ground tiles */
      for (let q = -rr; q <= rr; q++) for (let r = Math.max(-rr, -q - rr); r <= Math.min(rr, -q + rr); r++) {
        hexPath(q, r, 0); const edge = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) === rr; c.fillStyle = edge ? 'rgba(165,150,255,.10)' : ((q + r) & 1 ? 'rgba(165,150,255,.05)' : 'rgba(165,150,255,.02)'); c.fill(); c.strokeStyle = rgba([165, 150, 255], edge ? 0.55 : 0.22); c.lineWidth = 1; c.stroke();
      }
      if (state === 'menu') return;
      const items = [];
      hazards.forEach(z => items.push({ k: z.t, q: z.q, r: z.r, plane: z.t === 'spike' ? 1 : 0, z }));
      portals && portals.forEach(z => items.push({ k: 'portal', q: z.q, r: z.r, plane: 0, z })); food && items.push({ k: 'food', q: food.q, r: food.r, plane: food.p });
      snake.forEach((s, i) => items.push({ k: 'seg', q: s.q, r: s.r, plane: s.p, i }));
      /* shadows of sky things on the ground */
      c.fillStyle = 'rgba(0,0,0,.35)'; items.filter(o => o.plane === 1).forEach(o => { const p = proj(o.q, o.r, 0); c.beginPath(); c.ellipse(p.x, p.y + 2, size * 0.55 * p.k, size * 0.28 * p.k, 0, 0, TAU); c.fill(); });
      const sorted = items.map(o => ({ ...o, p: proj(o.q, o.r, o.plane) })).sort((a, b) => a.plane - b.plane || a.p.y - b.p.y);
      for (const o of sorted) {
        const { p } = o, s = size * p.k;
        if (o.k === 'seg') { const head = o.i === 0, col = planeCol[o.plane], rad = s * (head ? 0.62 : 0.52 - Math.min(0.14, o.i * 0.004)); c.fillStyle = rgba(hexc(col), head ? 1 : 0.88 - Math.min(0.4, o.i * 0.015)); c.beginPath(); c.arc(p.x, p.y, rad, 0, TAU); c.fill(); c.strokeStyle = '#0a0913'; c.lineWidth = 2; c.stroke(); if (head) { c.fillStyle = '#fff'; const e = heading * Math.PI / 3 - camYaw; for (const sd of [-0.5, 0.5]) { c.beginPath(); c.arc(p.x + Math.cos(-e + sd) * rad * 0.5, p.y + Math.sin(-e + sd) * rad * 0.5 * Math.cos(tiltT), rad * 0.2, 0, TAU); c.fill(); } } }
        else if (o.k === 'wall') { hexPath(o.q, o.r, 0.35, 0.8); c.fillStyle = o.z.arm ? 'rgba(255,255,255,.2)' : '#2a2650'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
        else { const im = img[o.k], sz = s * (o.k === 'food' ? 1.5 : 1.9) * (o.k === 'food' ? 1 + Math.sin(S.t * 5) * 0.06 + A.beat * 0.1 : 1); const armed = !(o.z && o.z.arm); c.globalAlpha = armed ? 1 : (Math.sin(S.t * 24) > 0 ? 0.65 : 0.12); if (im) { c.save(); c.translate(p.x, p.y - (o.k === 'food' && o.plane ? 0 : 0)); if (o.k === 'hole' || o.k === 'portal') c.rotate(S.t * (o.k === 'portal' ? 1.5 : 0.6)); c.drawImage(im, -sz / 2, -sz / 2, sz, sz); c.restore(); } c.globalAlpha = 1; if (o.k === 'hole' || o.k === 'spike') { c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '700 ' + (s * 0.45 | 0) + 'px ui-monospace,monospace'; c.textAlign = 'center'; c.fillText(o.k === 'hole' ? '▼' : '▲', p.x, p.y + s * 1.0); } if (o.k === 'food') { c.strokeStyle = rgba(hexc(planeCol[o.plane]), 0.9); c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, sz * 0.62, 0, TAU); c.stroke(); } }
      }
      /* plane hop ring */
      if (shiftAnim > 0.05) { const p = proj(snake[0].q, snake[0].r, plane); c.strokeStyle = rgba(hexc(planeCol[plane]), shiftAnim); c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, size * p.k * (2 - shiftAnim), 0, TAU); c.stroke(); }
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.l -= dt * 2; if (q.l <= 0) { parts.splice(i, 1); continue; } q.ox += q.vx * dt; q.oy += q.vy * dt; const p = proj(q.q, q.r, q.z); c.fillStyle = rgba(hexc(q.c), q.l); c.fillRect(p.x + q.ox, p.y + q.oy, 4, 4); }
      if (flip && !S.noFlash) { c.fillStyle = `rgba(255,255,255,${Math.sin(Math.PI * flip.t / flip.dur) * 0.08})`; c.fillRect(0, 0, W, H); }
    }
    const hexc = hx => [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)];

    const kd = e => {
      if (!host.isConnected) return; const k = e.key.toLowerCase(); let used = true;
      if (k === 'arrowleft' || k === 'a') turn(1); else if (k === 'arrowright' || k === 'd') turn(-1); else if (k === 'arrowup' || k === 'w' || k === ' ') shift(); else if (k === 'p' || k === 'escape') togglePause(); else if (k === 'r') begin(); else used = false;
      if (used && (state === 'play' || document.activeElement === cv)) e.preventDefault();
    };
    addEventListener('keydown', kd);
    /* swipe on the board: left/right half taps turn (touch) */
    cv.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || state !== 'play') return; });
    raf = requestAnimationFrame(frame); resize();
    return { start() {}, restart() { begin(); }, pause() { if (state === 'play') togglePause(); }, resize, onSetting() { resize(); }, destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('keydown', kd); } };
  }
};
