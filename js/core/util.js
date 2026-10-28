/* js/core/util.js — tiny shared helpers (no dependencies). */
export const TAU = Math.PI * 2;
export const ROOT = new URL('../../', import.meta.url).href;            // site root, works in any sub-folder
export const asset = p => (!p ? '' : /^(https?:|data:|blob:|\/\/)/.test(p) ? p : new URL(p, ROOT).href);
export const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const rint = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = a => a[(Math.random() * a.length) | 0];
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const sr = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
export const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const GL = '█▓▒░#%&@?!/\\<>+=*0123456789';
export const smooth = (cur, target, up, down, dt) => cur + (target - cur) * (1 - Math.pow(1 - (target > cur ? up : down), dt * 60));
export const fmtTime = s => { if (!isFinite(s) || s < 0) s = 0; return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const mk = t => document.createElement(t);
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* safe localStorage (namespaced) */
export const store = {
  get(k, d) { try { const v = localStorage.getItem('rdweeb:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('rdweeb:' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('rdweeb:' + k); } catch (e) {} }
};

/* hyperscript:  h('div', {class:'x', on:{click:fn}, dataset:{a:1}, style:{color:'red'}}, 'text', child, [more]) */
export function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') { if (typeof v === 'string') e.style.cssText = v; else Object.assign(e.style, v); }
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else if (k === 'on') for (const ev in v) e.addEventListener(ev, v[ev]);
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k in e && k !== 'list' && typeof v !== 'object') { try { e[k] = v; } catch (er) { e.setAttribute(k, v); } }
    else e.setAttribute(k, v === true ? '' : v);
  }
  const add = c => {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(add);
    else e.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  };
  kids.forEach(add);
  return e;
}
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* scramble an element's text (glitch reveal) */
export function scramble(el, text, dur = 420) {
  if (el._sc) clearInterval(el._sc);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduced-fx')) { el.textContent = text; return; }
  const t0 = performance.now();
  el._sc = setInterval(() => {
    const p = (performance.now() - t0) / dur;
    if (p >= 1) { clearInterval(el._sc); el.textContent = text; return; }
    el.textContent = [...text].map((c, i) => (i < p * text.length || c === ' ' ? c : pick(GL))).join('');
  }, 40);
}
