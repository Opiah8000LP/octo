/* js/ui/bot.js — MOCK BOT. A parody of the "AI-powered support assistant" widget on every business site…
   except nothing here is AI: every line is written by hand in config/config.js → bot.  Rules, keyword/regex intents,
   conversation states, shuffle-bag response pools (so repeats feel fresh), swear reactions with CENSORED text + a soft bleep,
   reactions to site events, clicked words, easter eggs and ARG-style cryptic replies.  It is deliberately NOT translated. */
import { CONFIG } from '../../config/config.js';
import { S } from '../core/state.js';
import { h, store, asset, ROOT, sleep, shuffle, scramble } from '../core/util.js';
import { get as cfgGet } from '../core/i18n.js';
import { on, emit } from '../core/bus.js';
import * as sfx from '../audio/sfx.js';
import * as settings from '../core/settings.js';

const B = CONFIG.bot;
const CEN = new RegExp(`[${B.censor.chars.replace(/[\]\\^-]/g, '\\$&')}]{3,}`, 'g');
const ic = n => h('i', { class: 'ic', style: `--i:url(${ROOT}assets/ui/${n}.png)`, 'aria-hidden': 'true' });

/* ------------------------------------------------------------------ engine ------------------------------------------------------------------ */
const mem = { state: 'start', unknown: 0, msgs: 0, swears: 0, lastUser: '', visited: {}, clicks: {}, flags: store.get('bot:flags', {}), opened: store.get('bot:opened', 0) };
const bags = new Map();
export function bag(key, arr) {                                   // shuffle-bag: never repeats until the pool is used up (and never twice in a row)
  if (!arr || !arr.length) return '';
  let b = bags.get(key);
  if (!b || !b.q.length) { const q = shuffle(arr); if (b && q[0] === b.last && q.length > 1) q.push(q.shift()); b = { q, last: b && b.last }; bags.set(key, b); }
  const v = b.q.shift(); b.last = v; return v;
}
const norm = s => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim();
const hasWord = (n, kw) => { kw = norm(kw); return kw.includes(' ') ? (' ' + n + ' ').includes(' ' + kw + ' ') : (' ' + n + ' ').includes(' ' + kw + ' '); };
function fill(str) {
  const d = new Date(), page = S.route || 'home';
  return str.replace(/\{(\w+)\}/g, (m, k) => ({ page, time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), user: mem.lastUser.slice(0, 40), n: mem.msgs, name: CONFIG.site.alias, theme: settings.resolveTheme(), song: (document.querySelector('.pw-name span') || {}).textContent || 'that song' }[k] ?? m));
}
const stateOk = (it, st) => !it.state || it.state === '*' || it.state === st || (Array.isArray(it.state) && it.state.includes(st));
const flagOk = it => !it.needs || mem.flags[it.needs];
const intents = (B.intents || []).map((it, i) => ({ ...it, _i: i, _p: (it.priority || 0) + (it.state && it.state !== '*' ? 100 : 0) })).sort((a, b) => b._p - a._p || a._i - b._i);

function swearLevel(n) {
  const words = n.split(' ');
  const hit = list => (list || []).some(w => (w.includes(' ') ? n.includes(w) : words.includes(w) || words.some(x => x.length > 4 && x.startsWith(w) && w.length > 3)));
  if (hit(B.swear.severe)) return 2; if (hit(B.swear.mild)) return 1; return 0;
}

export function reply(input) {
  const raw = input.trim(), n = norm(raw); mem.lastUser = raw; mem.msgs++;
  if (!n) return { text: bag('empty', B.empty), kind: 'empty' };
  /* 1. swearing: encourage the mild stuff, scold the really bad stuff */
  const sl = swearLevel(n);
  if (sl === 2) { mem.swears++; return { text: bag('severe', B.swear.severeRes), kind: 'scold' }; }
  if (sl === 1) { mem.swears++; const m = B.swear.milestones && B.swear.milestones[mem.swears]; return { text: m ? bag('ms' + mem.swears, m) : bag('mild', B.swear.mildRes), kind: 'swear' }; }
  /* 2. intents (state-specific first because of the +100 priority) */
  for (const it of intents) {
    if (!stateOk(it, mem.state) || !flagOk(it)) continue;
    if (it.once && mem.visited[it._i]) continue;
    const ok = (it.kw || []).some(k => hasWord(n, k)) || (it.rx || []).some(r => { try { return new RegExp(r, 'i').test(n) || new RegExp(r, 'i').test(raw); } catch (e) { return false; } });
    if (!ok) continue;
    mem.visited[it._i] = true; mem.unknown = 0;
    if (it.set) { mem.flags[it.set] = true; store.set('bot:flags', mem.flags); }
    mem.state = it.next || 'start';
    return { text: bag('i' + it._i, it.res), kind: it.cryptic ? 'cryptic' : 'normal', act: it.act, sound: it.sound };
  }
  /* 3. no idea: escalating fallbacks */
  mem.unknown++; mem.state = 'start';
  const tier = Math.min(B.fallback.length - 1, mem.unknown - 1);
  return { text: bag('fb' + tier, B.fallback[tier]), kind: 'unknown' };
}

/* ------------------------------------------------------------------ UI ------------------------------------------------------------------ */
let root, launcher, win, log, input, form, toast, badge, chips, isOpen = false, unread = 0, lastProactive = -99, busy = Promise.resolve(), toastT = 0;

async function typeOut(el, text, kind) {
  const segs = []; let last = 0, m; CEN.lastIndex = 0;
  while ((m = CEN.exec(text))) { if (m.index > last) segs.push({ t: text.slice(last, m.index) }); segs.push({ c: m[0] }); last = m.index + m[0].length; }
  if (last < text.length) segs.push({ t: text.slice(last) });
  const quiet = !isOpen || document.hidden; let k = 0;
  for (const s of segs) {
    if (s.t) {
      if (quiet || S.reduced && s.t.length > 60) { el.append(s.t); continue; }
      const node = document.createTextNode(''); el.appendChild(node);
      for (const ch of s.t) { node.data += ch; if (++k % 3 === 0 && settings.get('typeSounds') && kind !== 'cryptic') sfx.play('bot_type', { vol: 0.5, minGap: 0.04 }); await sleep(B.typing.msPerChar * (ch === ' ' ? 0.6 : /[.,!?]/.test(ch) ? 6 : 1) * (kind === 'cryptic' ? 2 : 1)); scrollLog(); }
    } else {                                                 // a CENSORED word: soft bleep + scramble, Delta-rune / Scott-Pilgrim style
      const sp = h('span', { class: 'cens', title: '' }, s.c); el.appendChild(sp);
      sfx.variant('censor', 3, { vol: 0.9 }); if (!quiet) { scramble(sp, s.c, 320); await sleep(340); } scrollLog();
    }
  }
}
const scrollLog = () => { log.scrollTop = log.scrollHeight; };

function addMsg(who, text, kind = 'normal') {
  const bub = h('div', { class: `msg ${who} ${kind}` }), row = h('div', { class: 'row ' + who }, who === 'bot' ? h('img', { class: 'av', src: asset(B.avatar), alt: '' }) : null, bub);
  if (who === 'user') { bub.textContent = text; } log.appendChild(row); scrollLog(); return { bub, row };
}
function typing() { const d = h('div', { class: 'row bot' }, h('img', { class: 'av', src: asset(B.avatar), alt: '' }), h('div', { class: 'msg bot dots', 'aria-label': 'typing' }, h('i'), h('i'), h('i'))); log.appendChild(d); scrollLog(); return d; }

/* say(): queue a bot message (typing dots → typed text). Proactive messages show a toast when the chat is closed. */
export function say(text, { kind = 'normal', proactive = false, act, sound } = {}) {
  text = fill(text);
  busy = busy.then(async () => {
    if (!isOpen && proactive) { showToast(text); unread++; badge.textContent = unread; badge.hidden = false; }
    const dots = typing(); const wait = isOpen ? Math.min(B.typing.max, Math.max(B.typing.min, text.length * 12)) : 150;
    await sleep(S.reduced ? Math.min(wait, 500) : wait); dots.remove();
    const { bub, row } = addMsg('bot', '', kind); sfx.play(kind === 'cryptic' ? 'bot_glitch' : 'bot_msg', { vol: 0.8 }); if (sound) sfx.play(sound);
    if (kind === 'cryptic') row.classList.add('cryp');
    await typeOut(bub, text, kind);
    if (act) runAct(act);
    if (kind !== 'cryptic' && Math.random() < (B.feedbackChance || 0.2) && isOpen) row.after(feedback());
    scrollLog();
  }).catch(e => console.error('[bot]', e));
  return busy;
}
function feedback() {
  const r = h('div', { class: 'fb' }, h('span', {}, B.feedback.ask));
  [['yes', B.feedback.yes], ['no', B.feedback.no]].forEach(([k, pool]) => { const b = h('button', { type: 'button' }, k); b.addEventListener('click', () => { r.remove(); say(bag('fb' + k, pool)); }); r.appendChild(b); });
  return r;
}
function runAct(a) { if (a === 'theme') { settings.toggleTheme(); emit('theme:user'); } else if (a === 'glitch') { import('../core/glitch.js').then(g => g.kick(1)); } else if (a === 'schizo') settings.put('schizo', true); else if (a && a.startsWith('go:')) emit('route:go', a.slice(3)); else if (a === 'play') import('../audio/player.js').then(p => p.play()); else if (a === 'open-settings') emit('settings:toggle'); }

function showToast(text) {
  toast.textContent = text.replace(CEN, m => m); toast.hidden = false; toast.classList.remove('in'); toast.offsetWidth; toast.classList.add('in');
  clearTimeout(toastT); toastT = setTimeout(() => { toast.hidden = true; }, Math.min(9000, 3500 + text.length * 40));
}

function send(text) {
  text = text.trim(); if (!text) return;
  addMsg('user', text); sfx.play('bot_send'); chips.textContent = '';
  const r = reply(text); say(r.text, { kind: r.kind === 'cryptic' ? 'cryptic' : 'normal', act: r.act, sound: r.sound }).then(() => { if (r.kind === 'unknown' && Math.random() < 0.5) setChips(); });
  emit('bot:message', { text, kind: r.kind });
}
function setChips() { chips.textContent = ''; shuffle(B.suggestions).slice(0, 3).forEach(s => { const b = h('button', { type: 'button', class: 'chip' }, s); b.addEventListener('click', () => send(s)); chips.appendChild(b); }); }

export function toggle(force) {
  const open = force === undefined ? !isOpen : force; if (open === isOpen) return;
  isOpen = open; win.hidden = !open; launcher.setAttribute('aria-expanded', open); document.body.classList.toggle('bot-open', open);
  sfx.play(open ? 'bot_open' : 'ui_close');
  if (open) {
    unread = 0; badge.hidden = true; toast.hidden = true;
    if (!log.children.length) { mem.opened++; store.set('bot:opened', mem.opened); say(mem.opened > 1 && B.greetAgain ? bag('greet2', B.greetAgain) : bag('greet', B.greet)); setChips(); }
    setTimeout(() => input.focus({ preventScroll: true }), 60); emit('bot:open');
  } else launcher.focus({ preventScroll: true });
}

/* ------------------------------------------------------------------ site reactions ------------------------------------------------------------------ */
function react(path, { chance = 1, gap = 5, force = false } = {}) {
  if (!settings.get('bot') || S.gated) return false;
  const v = cfgGet(path, B.events); if (!v) return false;
  const pool = Array.isArray(v) ? v : null; if (!pool || !pool.length) return false;
  if (!force && (S.t - lastProactive < gap || Math.random() > chance)) return false;
  lastProactive = S.t; say(bag('ev:' + path, pool), { proactive: true }); return true;
}
export { react };

function initEvents() {
  on('route', route => {
    const first = !mem.visited['page:' + route]; mem.visited['page:' + route] = true;
    const id = route || 'home';
    if (!react(`page.${id}${first ? '' : 'Again'}`, { chance: first ? 0.85 : 0.5 })) if (!first) react('page.again', { chance: 0.4 });
  });
  on('theme:user', () => react(`theme.${settings.resolveTheme()}`, { chance: 0.8, gap: 3 }));
  on('player:track', () => react('track', { chance: 0.35, gap: 20 }));
  on('settings:open', () => react('settingsOpen', { chance: 0.5 }));
  on('lang', l => react('lang.' + l, { chance: 0.7, gap: 3 }));
  on('setting:schizo', v => react(v ? 'schizoOn' : 'schizoOff', { force: true }));
  on('schizo:event', () => react('schizoRandom', { gap: 25 }));
  on('builder:copy', () => react('builderCopy', { force: true }));
  on('builder:open', () => react('builderOpen', { chance: 0.6 }));
  on('gallery:open', () => react('galleryOpen', { chance: 0.5 }));
  on('gallery:empty', () => react('galleryEmpty', { chance: 0.9 }));
  on('gate:enter', () => setTimeout(() => react('enter', { chance: 1, force: true }), 2500));
  on('goat:count', n => react('visitors', { chance: 0.5, gap: 10 }));
  /* idle: it gets bored */
  let idleT = 0; const bump = () => { clearTimeout(idleT); idleT = setTimeout(() => react('idle', { chance: 1, gap: 30 }), (B.idleSeconds || 50) * 1000); };
  ['pointermove', 'keydown', 'scroll', 'pointerdown'].forEach(e => addEventListener(e, bump, { passive: true })); bump();
  /* konami */
  const K = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']; let ki = 0;
  addEventListener('keydown', e => { const k = e.key.toLowerCase(); ki = k === K[ki] ? ki + 1 : (k === K[0] ? 1 : 0); if (ki === K.length) { ki = 0; react('konami', { force: true }); } });
  /* the same word clicked again and again */
  addEventListener('click', e => {
    if (S.gated || e.target.closest('.mockbot, .bot-launch, .set-panel, input, textarea')) return;
    const w = wordAt(e.clientX, e.clientY); if (!w) return;
    const def = B.clickWords[w.toLowerCase()]; if (!def) return;
    const c = mem.clicks[w] = (mem.clicks[w] || 0) + 1;
    let pool = def.res; for (const es of (def.escalate || [])) if (c >= es.at) pool = es.res;
    if (c === (def.once && def.once.at)) pool = def.once.res;
    if (settings.get('bot') && pool) { lastProactive = S.t; say(bag('cw:' + w + ':' + (pool === def.res ? 0 : pool.length), pool), { proactive: true }); }
  });
}
function wordAt(x, y) {
  let node, off;
  if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); if (p) { node = p.offsetNode; off = p.offset; } }
  else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); if (r) { node = r.startContainer; off = r.startOffset; } }
  if (!node || node.nodeType !== 3) return null;
  const t = node.data; let a = off, b = off; const isW = c => /[\p{L}\p{N}'_-]/u.test(c || '');
  while (a > 0 && isW(t[a - 1])) a--; while (b < t.length && isW(t[b])) b++;
  return b > a ? t.slice(a, b) : null;
}

export function init() {
  badge = h('b', { class: 'badge', hidden: true }, '1');
  launcher = h('button', { class: 'bot-launch', type: 'button', 'aria-expanded': 'false', 'aria-label': 'Open MOCK BOT support chat' }, h('img', { src: asset(B.avatar), alt: '' }), h('span', { class: 'bl-t' }, B.launcherLabel), badge);
  toast = h('div', { class: 'bot-toast', hidden: true, role: 'status' }); toast.addEventListener('click', () => toggle(true));
  log = h('div', { class: 'bot-log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Chat messages' });
  chips = h('div', { class: 'chips' });
  input = h('input', { type: 'text', class: 'bot-in', placeholder: B.placeholder, autocomplete: 'off', maxlength: 200, 'aria-label': 'Message MOCK BOT' });
  const sendB = h('button', { type: 'submit', class: 'bot-send', 'aria-label': 'Send' }, ic('send'));
  form = h('form', { class: 'bot-form' }, input, sendB); form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; send(v); });
  const x = h('button', { class: 'bot-x', type: 'button', 'aria-label': 'Close chat' }, ic('close')); x.addEventListener('click', () => toggle(false));
  win = h('section', { class: 'mockbot', hidden: true, role: 'dialog', 'aria-label': B.name + ' chat' },
    h('header', {}, h('img', { src: asset(B.avatar), alt: '' }), h('div', {}, h('b', {}, B.name), h('small', {}, h('i', { class: 'dot' }), B.status)), x),
    log, chips, form, h('footer', {}, B.poweredBy));
  root = h('div', { class: 'bot-root' }, toast, win, launcher); document.body.appendChild(root);
  launcher.addEventListener('click', () => toggle());
  on('escape', () => toggle(false));
  initEvents();
  if (!settings.get('bot')) root.hidden = false;
  window.MOCKBOT = { say, reply, react, mem };            // handy in the console while writing dialogue
}
