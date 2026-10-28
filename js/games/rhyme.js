/* js/games/rhyme.js — RHYME. A rhythm game with NO beatmap.
   The music is analysed live in three bands. A LOW hit (kick) drops a heavy slab, a MID hit (snare / vocal) throws a shard, a HIGH hit
   (hats, sparkle) fires a spark — and the pitch inside the band decides roughly WHERE it lands. The speakers hear the song a moment later
   (a delay line) than the analyser does, so notes arrive exactly on the sound. Any MP3 on your device works.
     SPARK : touch it   ·  SHARD : swipe through it   ·  SLAB : tap it */
import { S } from '../core/state.js';
import { h, clamp, lerp, rnd, rgba, pick, fmtTime, ROOT, TAU } from '../core/util.js';
import { SHAPES, drawWire } from '../shapes/wire.js';
import * as engine from '../audio/engine.js';
import * as Player from '../audio/player.js';
import { CONFIG } from '../../config/config.js';
import { gtt, gs, loadImg } from './common.js';
import { asset } from '../core/util.js';

const DIFF = { chill: { thr: 1.9, gap: [0.3, 0.2, 0.15], win: 0.16, hp: 0, life: false }, normal: { thr: 1.55, gap: [0.24, 0.15, 0.1], win: 0.12, hp: 8, life: true }, hard: { thr: 1.25, gap: [0.2, 0.11, 0.07], win: 0.1, hp: 11, life: true } };
const APPROACH = { slow: 1.9, normal: 1.5, fast: 1.1 };
const COL = { low: '#ff2a6d', mid: '#ffe14a', high: '#05d9e8' };
const SFX = { low: 'rh_low', mid: 'rh_mid', high: 'rh_high' };

export default {
  id: 'rhyme',
  create(host, api) {
    const cv = h('canvas', { class: 'rh-cv', tabindex: -1 }), c = cv.getContext('2d', { alpha: false });
    const hud = {
      score: h('b', {}, '0'), combo: h('b', { class: 'rh-combo' }, ''), acc: h('b', {}, '100%'), hp: h('i'), time: h('b', {}, '0:00'),
      bl: h('span', { class: 'bd low' }, 'LOW'), bm: h('span', { class: 'bd mid' }, 'MID'), bh: h('span', { class: 'bd high' }, 'HIGH')
    };
    const hudEl = h('div', { class: 'rh-hud', 'aria-hidden': 'true' }, h('div', {}, h('small', {}, gtt('rhyme.score')), hud.score), h('div', { class: 'cm' }, hud.combo), h('div', {}, h('small', {}, gtt('rhyme.acc')), hud.acc),
      h('div', { class: 'hpbar' }, hud.hp), h('div', { class: 'bands' }, hud.bl, hud.bm, hud.bh), h('div', { class: 'tm' }, hud.time));
    /* ---- start screen ---- */
    const file = h('input', { type: 'file', accept: 'audio/*,.mp3,.wav,.ogg,.m4a,.flac', hidden: true }), nameEl = h('p', { class: 'rh-file' });
    const list = h('ul', { class: 'rh-tracks' }), startB = h('button', { class: 'btn pri lg', type: 'button', disabled: true }, gtt('rhyme.start'));
    const imp = h('button', { class: 'btn', type: 'button' }, gtt('rhyme.import')), drop = h('div', { class: 'rh-drop' }, imp, h('small', {}, gtt('rhyme.drop')), nameEl);
    const menu = h('div', { class: 'g-screen rh-menu' }, h('h3', {}, 'RHYME'), h('p', {}, gtt('rhyme.pick')), list, drop, h('p', { class: 'rh-how' }, gtt('rhyme.how')), startB, file);
    const over = h('div', { class: 'g-screen rh-over', hidden: true }), pauseS = h('div', { class: 'g-screen rh-pause', hidden: true }, h('h3', {}, gtt('rhyme.paused')), h('button', { class: 'btn pri', type: 'button', on: { click: () => resume() } }, gtt('rhyme.resume')));
    host.append(cv, hudEl, menu, over, pauseS);

    /* ---- state ---- */
    let W = 0, H = 0, DPR = 1, raf = 0, alive = true, running = false, paused = false, track = null, gt = 0, D = 1.5, el = null, srcN = null, an = null, delay = null, outG = null, ended = false, endAt = 0;
    const notes = [], parts = [], pops = [], trail = [], imgs = {};
    let score = 0, combo = 0, maxCombo = 0, hp = 100, hitW = 0, total = 0, perf = 0, good = 0, miss = 0, shake = 0, lastPos = { x: 0, y: 0, t: 0 }, nid = 0;
    const ptr = { x: -999, y: -999, vx: 0, vy: 0, active: false, down: false, downAt: -9, speed: 0 };
    const det = { prev: null, hist: { low: [], mid: [], high: [] }, last: { low: -9, mid: -9, high: -9 }, flash: { low: 0, mid: 0, high: 0 } };
    let freq = null, bins = null, fx = 1;
    const opt = () => ({ diff: DIFF[api.getSetting('difficulty')] || DIFF.normal, appr: APPROACH[api.getSetting('approach')] || 1.5, off: (+api.getSetting('offset') || 0) / 1000 });
    Promise.all(['low', 'mid', 'high', 'ring'].map(k => loadImg(`assets/games/rhyme/${k}.png`).then(i => { imgs[k] = i; })));
    api.preload(['rh_low', 'rh_mid', 'rh_high', 'rh_miss', 'rh_combo', 'rh_start', 'rh_finish', 'rh_fail', 'rh_perfect']);

    /* ---- track choosing ---- */
    let chosen = null;
    const select = (t, li) => { chosen = t; startB.disabled = false; list.querySelectorAll('li').forEach(x => x.classList.toggle('on', x === li)); };
    Player.tracks.forEach(t => { const li = h('li', {}, h('button', { type: 'button' }, h('b', {}, t.title), h('small', {}, t.artist))); li.firstChild.addEventListener('click', () => { select({ url: asset(t.file), name: t.title }, li); nameEl.textContent = ''; }); list.appendChild(li); });
    const useFile = f => { if (!f) return; if (!/audio|video\/mp4|\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.type + f.name)) { nameEl.textContent = gs('rhyme.notAudio'); return; } select({ url: URL.createObjectURL(f), name: f.name.replace(/\.[^.]+$/, ''), blob: true }, null); nameEl.textContent = '♪ ' + f.name; list.querySelectorAll('li').forEach(x => x.classList.remove('on')); };
    imp.addEventListener('click', () => file.click()); file.addEventListener('change', () => useFile(file.files[0]));
    ['dragover', 'drop'].forEach(ev => host.addEventListener(ev, e => { e.preventDefault(); if (ev === 'drop') useFile(e.dataTransfer.files[0]); }));
    startB.addEventListener('click', () => begin());

    /* ---- audio graph ---- */
    function build() {
      const ctx = engine.ensureCtx(); engine.resume(); const o = opt(); D = o.appr;
      el = new Audio(); el.crossOrigin = 'anonymous'; el.src = chosen.url; el.preload = 'auto'; ended = false;
      srcN = ctx.createMediaElementSource(el); an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0; freq = new Uint8Array(an.frequencyBinCount); bins = freq.length;
      outG = ctx.createGain(); outG.gain.value = 0.9; outG.connect(ctx.destination); srcN.connect(an); makeDelay(); el.addEventListener('ended', () => { ended = true; endAt = gt + D + 0.4; });
    }
    function makeDelay() { const ctx = engine.ctx(); if (delay) { try { srcN.disconnect(delay); delay.disconnect(); } catch (e) {} } delay = ctx.createDelay(3); delay.delayTime.value = D; srcN.connect(delay); delay.connect(outG); }
    function teardown() { try { el && el.pause(); } catch (e) {} try { srcN && srcN.disconnect(); delay && delay.disconnect(); an && an.disconnect(); outG && outG.disconnect(); } catch (e) {} if (el) el.src = ''; el = srcN = delay = an = outG = null; }

    async function begin() {
      if (!chosen) return; Player.hold(); teardown();
      try { build(); await el.play(); } catch (e) { menu.hidden = false; nameEl.textContent = gs('rhyme.cantPlay'); return; }
      menu.hidden = true; over.hidden = true; pauseS.hidden = true; notes.length = parts.length = pops.length = 0;
      score = combo = maxCombo = hitW = total = perf = good = miss = 0; hp = 100; gt = 0; running = true; paused = false; det.prev = null; Object.keys(det.hist).forEach(k => det.hist[k].length = 0);
      api.sfx('rh_start'); api.emit('game:start', 'rhyme'); hud.score.textContent = '0'; hud.combo.textContent = ''; hud.acc.textContent = '100%'; hud.hp.style.width = '100%';
    }
    function pause() { if (!running || paused) return; paused = true; el.pause(); outG.gain.value = 0; pauseS.hidden = false; notes.length = 0; }
    function resume() {
      if (!paused) return; paused = false; pauseS.hidden = true; engine.resume();
      const t = Math.max(0, el.currentTime - D); makeDelay(); el.currentTime = t; el.play().catch(() => {}); outG.gain.value = 0.9; det.prev = null;
    }

    /* ---- onset detection (spectral flux per band, adaptive threshold) ---- */
    const BANDS = () => { const sr = engine.ctx().sampleRate, bw = sr / 1024; const b = f => Math.max(1, Math.round(f / bw)); return { low: [b(40), b(210)], mid: [b(260), b(2400)], high: [b(3200), b(12000)] }; };
    let BR = null;
    function detect() {
      if (!an || paused) return; an.getByteFrequencyData(freq); BR = BR || BANDS(); const o = opt(), P = det.prev;
      if (P) {
        let i = 0;
        for (const k of ['low', 'mid', 'high']) {
          const [a, b] = BR[k]; let flux = 0, peak = 0, pv = 0, energy = 0;
          for (let j = a; j <= b; j++) { const d = freq[j] - P[j]; if (d > 0) flux += d; energy += freq[j]; if (freq[j] > pv) { pv = freq[j]; peak = j; } }
          flux /= (b - a + 1); energy /= (b - a + 1);
          const hs = det.hist[k]; hs.push(flux); if (hs.length > 70) hs.shift();
          const mean = hs.reduce((s, v) => s + v, 0) / hs.length, sd = Math.sqrt(hs.reduce((s, v) => s + (v - mean) ** 2, 0) / hs.length);
          const thr = mean + sd * o.diff.thr * (k === 'low' ? 0.9 : k === 'high' ? 1.0 : 1.15), minFlux = k === 'low' ? 5 : k === 'mid' ? 3.2 : 1.6;
          const gap = o.diff.gap[i++];
          if (flux > thr && flux > minFlux && energy > 12 && gt - det.last[k] > gap && hs.length > 12) { det.last[k] = gt; det.flash[k] = 1; spawn(k, (peak - a) / Math.max(1, b - a), flux); }
        }
      }
      det.prev = P ? (P.set(freq), P) : new Uint8Array(freq);
    }
    function spawn(type, pitch, strength) {
      const m = 0.12, R = type === 'low' ? 0.075 : type === 'mid' ? 0.055 : 0.04; const rad = Math.max(24, Math.min(W, H) * R * (S.coarse ? 1.25 : 1));
      const lx = m * W + rad, hx = W - m * W - rad, ly = { low: [0.5, 0.82], mid: [0.28, 0.7], high: [0.12, 0.85] }[type];
      let x = lerp(lx, hx, clamp(0.5 + (pitch - 0.5) * 0.85 + rnd(-0.22, 0.22), 0, 1)), y = lerp(ly[0] * H, ly[1] * H, Math.random());
      const tHit = gt + D, pr = notes.length ? notes[notes.length - 1] : null;
      if (pr) { /* reachable: limit jump distance by the time between hits */ const dt = Math.max(0.06, tHit - pr.tHit), maxD = (type === 'low' ? 900 : 1500) * dt * Math.min(1.2, Math.max(0.7, Math.min(W, H) / 700)) + rad * 2; const dx = x - pr.x, dy = y - pr.y, d = Math.hypot(dx, dy); if (d > maxD) { x = pr.x + dx / d * maxD; y = pr.y + dy / d * maxD; } }
      for (let tries = 0; tries < 6; tries++) { const bad = notes.some(n => !n.done && Math.abs(n.tHit - tHit) < 0.28 && Math.hypot(n.x - x, n.y - y) < (n.r + rad) * 1.05); if (!bad) break; x = clamp(x + rnd(-1, 1) * rad * 3, lx, hx); y = clamp(y + rnd(-1, 1) * rad * 3, 0.1 * H + rad, H - rad * 1.2); }
      notes.push({ id: nid++, type, x, y, r: rad, tHit, done: false, str: strength }); total++;
    }

    /* ---- judging ---- */
    function judge(n, dt_) {
      const o = opt(), a = Math.abs(dt_), w = o.diff.win; let q = a < w * 0.5 ? 'perfect' : 'good'; n.done = true;
      if (q === 'perfect') { perf++; score += 300 * mult(); hitW += 1; hp = Math.min(100, hp + 2); api.sfx('rh_perfect', { vol: 0.5 }); } else { good++; score += 100 * mult(); hitW += 0.6; hp = Math.min(100, hp + 1); }
      combo++; maxCombo = Math.max(maxCombo, combo); api.sfx(SFX[n.type], { vol: n.type === 'high' ? 0.8 : 1, rate: 0.95 + Math.random() * 0.1 }); if (combo % 25 === 0) api.sfx('rh_combo');
      burst(n.x, n.y, COL[n.type], n.type === 'low' ? 22 : 12); pops.push({ x: n.x, y: n.y - n.r, t: 0, s: gs('rhyme.' + q), c: q === 'perfect' ? '#fff' : COL[n.type] }); if (n.type === 'low' && !S.reduced) shake = Math.min(10, shake + 6);
      if (navigator.vibrate && S.coarse && !S.reduced) navigator.vibrate(n.type === 'low' ? 12 : 5); hudUpdate();
    }
    const mult = () => 1 + Math.min(3, Math.floor(combo / 10) * 0.25);
    function missed(n) { n.done = true; n.miss = true; miss++; combo = 0; hp -= opt().diff.hp; api.sfx('rh_miss', { vol: 0.6 }); pops.push({ x: n.x, y: n.y, t: 0, s: gs('rhyme.miss'), c: '#8a84b8' }); hudUpdate(); if (opt().diff.life && hp <= 0) finish(true); }
    function tryHits(kind) {
      const o = opt(), w = o.diff.win;
      for (const n of notes) {
        if (n.done) continue; const dt_ = gt - o.off - n.tHit; if (dt_ < -w || dt_ > w) continue; const d = Math.hypot(ptr.x - n.x, ptr.y - n.y);
        if (n.type === 'high' && (ptr.active) && d < n.r * 1.5 + 12) judge(n, dt_);
        else if (n.type === 'mid' && ptr.active && d < n.r * 1.4 + 10 && ptr.speed > (S.coarse ? 330 : 450)) judge(n, dt_);
        else if (n.type === 'low' && kind === 'down' && d < n.r * 1.6 + 14) judge(n, dt_);
      }
    }
    function hudUpdate() {
      hud.score.textContent = Math.round(score).toLocaleString(); hud.combo.textContent = combo > 3 ? combo + '×' : ''; hud.acc.textContent = (total - (notes.filter(n => !n.done).length) > 0 ? Math.round(hitW / Math.max(1, perf + good + miss) * 100) : 100) + '%'; hud.hp.style.width = Math.max(0, hp) + '%'; hud.hp.parentNode.classList.toggle('low', hp < 30);
    }
    function finish(failed) {
      if (!running) return; running = false; const acc = hitW / Math.max(1, perf + good + miss), grade = failed ? 'F' : acc > 0.95 ? 'S' : acc > 0.85 ? 'A' : acc > 0.7 ? 'B' : acc > 0.5 ? 'C' : 'D';
      teardown(); Player.release(); api.sfx(failed ? 'rh_fail' : 'rh_finish'); api.emit(failed ? 'game:over' : 'game:win', 'rhyme');
      const best = api.store.get('best:' + (chosen && chosen.name), 0); if (!failed && score > best) api.store.set('best:' + chosen.name, Math.round(score));
      over.textContent = ''; over.append(h('h3', { class: failed ? 'bad' : '' }, gtt(failed ? 'rhyme.failed' : 'rhyme.cleared')), h('div', { class: 'grade g-' + grade }, grade),
        h('dl', { class: 'res' }, h('div', {}, h('dt', {}, gtt('rhyme.score')), h('dd', {}, Math.round(score).toLocaleString())), h('div', {}, h('dt', {}, gtt('rhyme.acc')), h('dd', {}, Math.round(acc * 100) + '%')), h('div', {}, h('dt', {}, gtt('rhyme.maxCombo')), h('dd', {}, maxCombo)),
          h('div', {}, h('dt', {}, gtt('rhyme.perfect')), h('dd', {}, perf)), h('div', {}, h('dt', {}, gtt('rhyme.good')), h('dd', {}, good)), h('div', {}, h('dt', {}, gtt('rhyme.miss')), h('dd', {}, miss))),
        h('p', { class: 'fine' }, gs('rhyme.best') + ': ' + Math.max(best, Math.round(score)).toLocaleString()),
        h('div', { class: 'g-btns' }, h('button', { class: 'btn pri', type: 'button', on: { click: () => begin() } }, gtt('rhyme.again')), h('button', { class: 'btn', type: 'button', on: { click: () => { over.hidden = true; menu.hidden = false; } } }, gtt('rhyme.menu'))));
      over.hidden = false;
    }

    /* ---- fx ---- */
    function burst(x, y, col, n) { if (S.reduced) n = Math.min(n, 4); for (let i = 0; i < n && parts.length < 200; i++) { const a = Math.random() * TAU, v = rnd(80, 420); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, c: col, s: rnd(2, 5) }); } }

    /* ---- input ---- */
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointermove', e => { const [x, y] = pos(e); ptr.x = x; ptr.y = y; ptr.active = e.pointerType === 'mouse' ? true : ptr.down; });
    cv.addEventListener('pointerdown', e => { const [x, y] = pos(e); ptr.x = x; ptr.y = y; ptr.down = ptr.active = true; ptr.downAt = gt; cv.setPointerCapture(e.pointerId); if (running && !paused) tryHits('down'); e.preventDefault(); });
    const up = e => { ptr.down = false; if (e.pointerType !== 'mouse') ptr.active = false; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') ptr.active = false; });
    cv.style.touchAction = 'none';
    const key = e => { if (!host.isConnected) return; if (e.key === ' ' || e.key === 'z' || e.key === 'x') { if (running && !paused) { ptr.down = true; ptr.active = true; tryHits('down'); setTimeout(() => { ptr.down = false; }, 60); e.preventDefault(); } } else if (e.key === 'Escape' || e.key === 'p') { if (running && !paused) { pause(); e.stopPropagation(); } else if (paused) resume(); } };
    addEventListener('keydown', key);

    /* ---- render ---- */
    const size = () => { const r = host.getBoundingClientRect(); W = Math.max(280, r.width); H = Math.max(240, r.height); DPR = Math.min(devicePixelRatio || 1, S.q < 0.7 ? 1 : 1.5); cv.width = W * DPR | 0; cv.height = H * DPR | 0; cv.style.width = W + 'px'; cv.style.height = H + 'px'; };
    const ro = new ResizeObserver(size); ro.observe(host); size();
    let last = performance.now(), acc_ = 0, rot = 0;
    function frame(ms) {
      if (!alive) return; raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (ms - last) / 1000); last = ms;
      if (running && !paused) { gt += dt; detect(); if (ended && gt > endAt && !notes.some(n => !n.done)) finish(false); }
      /* ptr speed */
      const sp = Math.hypot(ptr.x - lastPos.x, ptr.y - lastPos.y) / Math.max(dt, 0.001); ptr.speed = lerp(ptr.speed, sp, 0.5); lastPos.x = ptr.x; lastPos.y = ptr.y;
      if (running && !paused && ptr.active) { tryHits('move'); trail.push({ x: ptr.x, y: ptr.y }); if (trail.length > 14) trail.shift(); } else if (trail.length) trail.shift();
      const w = opt().diff.win; for (const n of notes) if (!n.done && gt - opt().off - n.tHit > w) missed(n);
      while (notes.length && notes[0].done && gt - notes[0].tHit > 0.6) notes.shift();
      draw(dt);
    }
    function draw(dt) {
      const sx = shake > 0 && !S.reduced ? rnd(-shake, shake) : 0, sy = shake > 0 && !S.reduced ? rnd(-shake, shake) : 0; shake *= Math.pow(0.85, dt * 60);
      c.setTransform(DPR, 0, 0, DPR, sx * DPR, sy * DPR); const cx = W / 2, cy = H * 0.46, A = S.a, big = Math.min(W, H);
      c.fillStyle = S.reduced ? '#0a0913' : 'rgba(10,9,19,0.42)'; c.fillRect(-20, -20, W + 40, H + 40);
      const bass = det.flash.low; rot += dt * (0.25 + bass * 1.2);
      /* tunnel */
      c.lineWidth = 1.2;
      for (let k = 0; k < 9; k++) { const z = ((k / 9) + gt * 0.1) % 1, r = big * (0.04 + z * z * 1.1), a = Math.sin(z * Math.PI); c.strokeStyle = rgba([165, 150, 255], a * (0.5 + bass * 0.4)); c.beginPath(); for (let i = 0; i <= 6; i++) { const an = rot * (k % 2 ? 1 : -1) + i * TAU / 6; i ? c.lineTo(cx + Math.cos(an) * r * 1.4, cy + Math.sin(an) * r) : c.moveTo(cx + Math.cos(an) * r * 1.4, cy + Math.sin(an) * r); } c.stroke(); }
      c.strokeStyle = 'rgba(165,150,255,.18)'; c.beginPath(); for (let i = 0; i < 12; i++) { const an = rot + i * TAU / 12; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(an) * W, cy + Math.sin(an) * H); } c.stroke();
      c.strokeStyle = rgba([255, 255, 255], 0.8); drawWire(c, SHAPES.ico, cx, cy, big * 0.07 * (1 + bass * 0.8), gt * 0.7, gt * 0.9, 0);
      /* spectrum floor */
      if (freq && running) { c.fillStyle = 'rgba(165,150,255,.28)'; const nb = 56, bw = W / nb; for (let i = 0; i < nb; i++) { const v = freq[Math.floor(Math.pow(i / nb, 1.6) * 300) + 1] / 255; c.fillRect(i * bw, H - v * H * 0.12, bw - 2, v * H * 0.12); } }
      /* notes */
      const o = opt();
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i]; const p = clamp(1 - (n.tHit - (gt - o.off)) / D, 0, 1.15), col = COL[n.type];
        if (n.done) { if (n.miss) { c.globalAlpha = 0.25; drawNote(n, 1, col, cx, cy); c.globalAlpha = 1; } continue; }
        const fly = Math.pow(Math.min(1, p), 1.5); const x = lerp(cx, n.x, fly), y = lerp(cy, n.y, fly), s = 0.18 + 0.82 * Math.min(1, p) ** 1.2;
        /* approach ring at the final spot */
        const rr = n.r * (1 + 2.4 * (1 - Math.min(1, p))); c.strokeStyle = rgba(hex(col), 0.25 + 0.6 * p); c.lineWidth = 1.5 + p * 2; c.beginPath(); c.arc(n.x, n.y, rr, 0, TAU); c.stroke();
        c.strokeStyle = rgba(hex(col), 0.12 * p); c.lineWidth = 1; c.beginPath(); c.moveTo(cx, cy); c.lineTo(x, y); c.stroke();
        drawNoteAt(n, x, y, s, col, p);
      }
      /* particles, pops */
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.l -= dt * 2.2; if (q.l <= 0) { parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.94; q.vy *= 0.94; c.fillStyle = rgba(hex(q.c), q.l); c.fillRect(q.x, q.y, q.s, q.s); }
      c.textAlign = 'center'; c.font = '800 20px Helvetica,Arial,sans-serif';
      for (let i = pops.length - 1; i >= 0; i--) { const q = pops[i]; q.t += dt; if (q.t > 0.7) { pops.splice(i, 1); continue; } c.globalAlpha = 1 - q.t / 0.7; c.fillStyle = q.c; c.fillText(q.s, q.x, q.y - q.t * 40); } c.globalAlpha = 1;
      /* blade */
      if (trail.length > 1) { c.lineCap = 'round'; for (let i = 1; i < trail.length; i++) { c.strokeStyle = `rgba(255,255,255,${i / trail.length * 0.85})`; c.lineWidth = i / trail.length * 7; c.beginPath(); c.moveTo(trail[i - 1].x, trail[i - 1].y); c.lineTo(trail[i].x, trail[i].y); c.stroke(); } }
      if (ptr.active || S.coarse === false) { c.strokeStyle = ptr.down ? '#fff' : 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(ptr.x, ptr.y, ptr.down ? 16 : 10, 0, TAU); c.stroke(); }
      /* band lamps + clock */
      for (const [k, el_] of [['low', hud.bl], ['mid', hud.bm], ['high', hud.bh]]) { det.flash[k] *= Math.pow(0.82, dt * 60); el_.style.opacity = 0.25 + det.flash[k] * 0.75; }
      acc_ += dt; if (acc_ > 0.25) { acc_ = 0; if (el) hud.time.textContent = fmtTime(el.currentTime - D < 0 ? 0 : el.currentTime - D) + ' / ' + fmtTime(el.duration || 0); hudUpdate(); }
      if (!S.reduced && bass > 0.6 && !S.noFlash) { c.fillStyle = `rgba(255,42,109,${bass * 0.05})`; c.fillRect(0, 0, W, H); }
    }
    function drawNote(n, s, col, cx, cy) { drawNoteAt(n, n.x, n.y, s, col, 1); }
    function drawNoteAt(n, x, y, s, col, p) {
      const r = n.r * s, im = imgs[n.type]; c.save(); c.translate(x, y);
      if (n.type === 'mid') c.rotate(gt * 2 + n.id); else if (n.type === 'high') c.rotate(-gt * 3 + n.id);
      if (im) c.drawImage(im, -r * 1.25, -r * 1.25, r * 2.5, r * 2.5); else { c.fillStyle = col; c.fillRect(-r, -r, r * 2, r * 2); }
      c.restore();
      if (n.type === 'mid' && p > 0.6) { c.strokeStyle = rgba([255, 255, 255], 0.5); c.lineWidth = 2; c.beginPath(); c.moveTo(x - r * 1.4, y + r * 1.4); c.lineTo(x + r * 1.4, y - r * 1.4); c.stroke(); }
    }
    const hex = h_ => [parseInt(h_.slice(1, 3), 16), parseInt(h_.slice(3, 5), 16), parseInt(h_.slice(5, 7), 16)];
    raf = requestAnimationFrame(frame);

    return {
      start() {}, restart() { if (chosen) begin(); else { menu.hidden = false; } }, pause, resize: size,
      onSetting() {}, get running() { return running },
      destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('keydown', key); teardown(); Player.release(); if (chosen && chosen.blob) URL.revokeObjectURL(chosen.url); }
    };
  }
};
