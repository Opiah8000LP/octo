/* js/pages/gallery3d.js — THE WELL: an image gallery you descend through. Pictures hang on the wall of a helix; scroll, drag or use the
   arrow keys to glide down the spiral; click a picture and the camera flies in on a cinematic move, DIVE takes you to the next one.
   Three.js is loaded only when this view opens. */
import { S } from '../core/state.js';
import { asset, clamp, lerp, h } from '../core/util.js';

let THREE = null;
export async function createGallery(host, items, { onFocus, onBlur, labelFn }) {
  THREE = THREE || await import('../../vendor/three/three.module.min.js');
  const T = THREE;
  const cv = h('canvas', { class: 'gal3d-cv', tabindex: 0, 'aria-label': 'Image gallery. Arrow keys glide, Enter opens the nearest picture.' }); host.appendChild(cv);
  let renderer; try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: !S.coarse, alpha: false, powerPreference: 'high-performance' }); } catch (e) { cv.remove(); throw e; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, S.q < 0.7 ? 1 : 1.5));
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(62, 1, 0.1, 140), clock = new T.Clock();
  scene.fog = new T.Fog(0x000000, 6, 38);
  const N = items.length, DA = 0.78, DY = 2.5, RW = 8, RC = 1.4;
  const pathPos = (u, out = new T.Vector3()) => out.set(Math.cos(u * DA) * RC, -DY * u + 0.2, Math.sin(u * DA) * RC);
  const pathLook = (u, out = new T.Vector3()) => out.set(Math.cos(u * DA + 0.1) * RW, -DY * u - 0.1, Math.sin(u * DA + 0.1) * RW);

  /* ----- environment: dust, rings, wire solids, a glowing core line ----- */
  const wireMat = new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  const dustN = S.q < 0.7 ? 500 : 1100, dg = new T.BufferGeometry(), dp = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { const a = Math.random() * 6.283, r = 1 + Math.random() * 9; dp[i * 3] = Math.cos(a) * r; dp[i * 3 + 1] = -Math.random() * (N * DY + 10) + 4; dp[i * 3 + 2] = Math.sin(a) * r; }
  dg.setAttribute('position', new T.BufferAttribute(dp, 3));
  const dustMat = new T.PointsMaterial({ size: 0.07, color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }); scene.add(new T.Points(dg, dustMat));
  const rings = [], solids = [];
  for (let i = 0; i < Math.ceil(N / 2) + 2; i++) { const m = new T.LineSegments(new T.EdgesGeometry(new T.TorusGeometry(RW + 0.8, 0.03, 4, 56)), wireMat); m.rotation.x = Math.PI / 2; m.position.y = -i * DY * 2 + 1; scene.add(m); rings.push(m); }
  for (let i = 0; i < Math.max(4, N); i++) { const g = i % 2 ? new T.IcosahedronGeometry(0.7, 0) : new T.OctahedronGeometry(0.8, 0); const m = new T.LineSegments(new T.EdgesGeometry(g), wireMat); const a = i * 2.1 + 1; m.position.set(Math.cos(a) * (RW - 1.4), -i * DY * 0.95 - 1, Math.sin(a) * (RW - 1.4)); m.userData.s = 0.3 + Math.random() * 0.6; scene.add(m); solids.push(m); }
  const core = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(0.04, N * DY + 16, 0.04)), wireMat); core.position.y = -N * DY / 2; scene.add(core);

  /* ----- pictures ----- */
  const frames = items.map((it, i) => {
    const g = new T.Group(), a = i * DA;
    const mat = new T.MeshBasicMaterial({ color: 0x888888, side: T.DoubleSide, transparent: true }), mesh = new T.Mesh(new T.PlaneGeometry(1, 1), mat);
    const edge = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(1, 1)), new T.LineBasicMaterial({ color: 0xffffff }));
    g.add(mesh, edge); g.position.set(Math.cos(a) * RW, -DY * i, Math.sin(a) * RW); g.lookAt(0, -DY * i, 0);
    const base = 3.1, f = { g, mesh, mat, edge, w: base * 1.4, h: base, i, tex: null, loading: false, hover: 0 };
    g.scale.set(f.w, f.h, 1); scene.add(g); mesh.userData.f = f;
    if (it.ghost) { f.mat.map = ghostTex(it); f.mat.color.set(0xffffff); f.mat.needsUpdate = true; }
    return f;
  });
  function ghostTex(it) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 360; const x = c.getContext('2d'); x.fillStyle = '#16142a'; x.fillRect(0, 0, 512, 360);
    x.strokeStyle = '#a596ff'; x.lineWidth = 2; for (let k = 0; k < 9; k++) { x.beginPath(); x.moveTo(0, k * 45); x.lineTo(512, k * 45 - 70); x.stroke(); } x.strokeRect(14, 14, 484, 332);
    x.fillStyle = '#fff'; x.font = '800 44px Helvetica,Arial,sans-serif'; x.textAlign = 'center'; x.fillText(it.title, 256, 170); x.font = '500 18px ui-monospace,monospace'; x.fillStyle = '#a596ff'; x.fillText(it.desc || '', 256, 214);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  const loader = new T.TextureLoader(); loader.setCrossOrigin('anonymous');
  function ensure(f) {
    const it = items[f.i]; if (f.tex || f.loading || it.ghost || !it.src) return; f.loading = true;
    loader.load(asset(it.src), t => {
      t.colorSpace = T.SRGBColorSpace; t.minFilter = T.LinearFilter; f.tex = t; f.mat.map = t; f.mat.color.set(0xffffff); f.mat.needsUpdate = true;
      const ar = t.image.width / t.image.height, base = 3.1, w = clamp(base * ar, 1.6, 5.4); f.w = w; f.h = w / ar; f.g.scale.set(f.w, f.h, 1);
    }, undefined, () => { f.loading = false; f.err = true; });
  }

  /* ----- camera rig ----- */
  let u = 0, uT = 0, mode = 'path', fi = -1, fov = 62;
  const pos = new T.Vector3(), look = new T.Vector3(), tp = new T.Vector3(), tl = new T.Vector3(), mouse = { x: 0, y: 0 };
  pathPos(0, pos); pathLook(0, look); const ray = new T.Raycaster(), m2 = new T.Vector2(); let hoverF = null;
  const maxU = Math.max(0, N - 1);

  function size() { const r = host.getBoundingClientRect(), w = Math.max(200, r.width), hh = Math.max(200, r.height); renderer.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); }
  size(); const ro = new ResizeObserver(size); ro.observe(host);

  function focus(i) {
    i = clamp(i, 0, N - 1); const f = frames[i]; fi = i; mode = 'focus'; uT = i; ensure(f);
    const dist = Math.max(f.h * 0.5 / Math.tan(T.MathUtils.degToRad(19)) * 1.12, f.w * 0.5 / (Math.tan(T.MathUtils.degToRad(19)) * cam.aspect) * 1.1);
    const p = f.g.position, d = new T.Vector3(p.x, 0, p.z).normalize();
    tp.set(p.x - d.x * dist, p.y + f.h * 0.03, p.z - d.z * dist); tl.copy(p);
    onFocus && onFocus(i, items[i]);
  }
  function unfocus() { if (mode !== 'focus') return; mode = 'path'; uT = fi; fi = -1; onBlur && onBlur(); }
  function dive(dir) { if (mode !== 'focus') return; const n = fi + dir; if (n < 0 || n >= N) return; fov = 90; focus(n); }

  /* ----- input ----- */
  let drag = null, moved = 0;
  const onWheel = e => { e.preventDefault(); if (mode === 'focus') { if (Math.abs(e.deltaY) > 20) dive(e.deltaY > 0 ? 1 : -1); return; } uT = clamp(uT + e.deltaY * 0.0028, -0.4, maxU + 0.4); };
  const onDown = e => { drag = { x: e.clientX, y: e.clientY, u: uT }; moved = 0; cv.setPointerCapture(e.pointerId); };
  const onMove = e => {
    const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width - 0.5; mouse.y = (e.clientY - r.top) / r.height - 0.5;
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.hypot(dx, dy)); if (mode === 'path') uT = clamp(drag.u - (dx * 0.5 + dy) * 0.006, -0.4, maxU + 0.4); }
    else if (e.pointerType === 'mouse') pick_(e, false);
  };
  const onUp = e => { if (drag && moved < 6) pick_(e, true); drag = null; };
  function pick_(e, click) {
    const r = cv.getBoundingClientRect(); m2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(m2, cam);
    const hit = ray.intersectObjects(frames.map(f => f.mesh))[0]; const f = hit ? hit.object.userData.f : null;
    if (click) { if (f && mode === 'path') focus(f.i); else if (!f && mode === 'focus') unfocus(); return; }
    hoverF = f; cv.style.cursor = f ? 'pointer' : 'grab';
  }
  const onKey = e => {
    const k = e.key;
    if (mode === 'focus') { if (k === 'Escape') { unfocus(); e.stopPropagation(); } else if (k === 'ArrowDown' || k === 'ArrowRight') { dive(1); e.preventDefault(); } else if (k === 'ArrowUp' || k === 'ArrowLeft') { dive(-1); e.preventDefault(); } return; }
    if (k === 'ArrowDown' || k === 'ArrowRight') { uT = clamp(Math.round(uT) + 1, 0, maxU); e.preventDefault(); } else if (k === 'ArrowUp' || k === 'ArrowLeft') { uT = clamp(Math.round(uT) - 1, 0, maxU); e.preventDefault(); } else if (k === 'Enter' || k === ' ') { focus(Math.round(clamp(uT, 0, maxU))); e.preventDefault(); }
  };
  cv.addEventListener('wheel', onWheel, { passive: false }); cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', () => { drag = null; }); cv.addEventListener('keydown', onKey);

  /* ----- render ----- */
  const col = new T.Color(); let alive = true;
  function render(dt) {
    if (!alive) return; const t = clock.elapsedTime += dt;
    const night = S.d; col.setRGB(S.bg[0] / 255, S.bg[1] / 255, S.bg[2] / 255); renderer.setClearColor(col, 1); scene.fog.color.copy(col); scene.fog.near = lerp(7, 4, night); scene.fog.far = lerp(46, 34, night);
    const ink = night > 0.5 ? 0xffffff : 0x14141c; wireMat.color.setHex(ink); dustMat.color.setHex(night > 0.5 ? 0xbdb2ff : 0x5b78ee); dustMat.opacity = night > 0.5 ? 0.85 : 0.6;
    /* camera */
    if (mode === 'path') {
      u += (uT - u) * (1 - Math.exp(-dt * 5)); pathPos(u, tp); pathLook(u, tl);
      tl.x += mouse.x * 2.2; tl.y -= mouse.y * 1.6; tp.y += Math.sin(t * 0.6) * 0.12; fov += (62 - fov) * (1 - Math.exp(-dt * 3));
    } else { fov += (38 - fov) * (1 - Math.exp(-dt * 2.6)); }
    const k = mode === 'focus' ? 2.8 : 6; const a = 1 - Math.exp(-dt * k);
    pos.lerp(tp, a); look.lerp(tl, a); cam.position.copy(pos); cam.lookAt(look);
    if (mode === 'focus' && !S.reduced) cam.rotation.z += Math.sin(t * 0.5) * 0.004;
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
    /* lazy-load pictures near the camera, ease hover scale */
    const ci = Math.round(clamp(u, 0, maxU));
    frames.forEach(f => {
      if (Math.abs(f.i - ci) < 5) ensure(f);
      const want = (hoverF === f || fi === f.i) ? 1.06 : 1; f.hover += (want - f.hover) * Math.min(1, dt * 8); f.g.scale.set(f.w * f.hover, f.h * f.hover, 1);
      const dist = Math.abs(f.i - u); f.mat.opacity = clamp(1.4 - dist * 0.16, 0.25, 1);
    });
    solids.forEach((m, i) => { m.rotation.x += dt * m.userData.s * (1 + S.a.bass * 2); m.rotation.y += dt * m.userData.s * 0.7; m.scale.setScalar(1 + S.a.beat * 0.25); });
    rings.forEach((m, i) => { m.rotation.z = t * 0.05 * (i % 2 ? 1 : -1); });
    dustMat.size = 0.07 + S.a.high * 0.05;
    renderer.render(scene, cam);
  }
  return {
    render, focus, unfocus, dive, get index() { return fi; }, get mode() { return mode; }, el: cv,
    nearest: () => Math.round(clamp(u, 0, maxU)),
    destroy() { alive = false; ro.disconnect(); frames.forEach(f => { f.tex && f.tex.dispose(); f.mat.map && f.mat.map.dispose(); f.mat.dispose(); f.mesh.geometry.dispose(); }); scene.traverse(o => { o.geometry && o.geometry.dispose && o.geometry.dispose(); }); renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {} cv.remove(); }
  };
}
