/* js/core/i18n.js — every visible string in config/config.js is either a plain string or L('english','русский').
   tx() picks the current language. bind*() registers an element so it updates live when the language changes
   (no page rebuild — so a running game or a half-written request survives a language switch). */
import { CONFIG } from '../../config/config.js';
import { store } from './util.js';
import { emit } from './bus.js';

export const LANGS = ['en', 'ru'];
let lang = store.get('lang', 'en'); if (!LANGS.includes(lang)) lang = 'en';
export const getLang = () => lang;

export function tx(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'function') return tx(v());
  return v[lang] ?? v.en ?? '';
}
export function get(path, root = CONFIG) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), root); }
export const ui = path => { const v = get('ui.' + path); if (v === undefined) { console.warn('[i18n] ui.' + path + ' is missing bro, add it to config.js'); return path; } return tx(v); };
export const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));

const reg = new Set();
const apply = r => {
  if (r.el.isConnected) r.was = true; else if (r.was) { reg.delete(r); return; }      // prune only elements that were attached once and then removed
  const s = tx(typeof r.v === 'function' ? r.v() : r.v);
  if (r.kind === 'text') { if (r.el.textContent !== s) r.el.textContent = s; }
  else if (r.kind === 'html') r.el.innerHTML = s;
  else r.el.setAttribute(r.kind, s);
};
function add(el, v, kind) { const r = { el, v, kind }; reg.add(r); apply(r); return el; }
export const bindText = (el, v) => add(el, v, 'text');
export const bindHTML = (el, v) => add(el, v, 'html');
export const bindAttr = (el, attr, v) => add(el, v, attr);
/* shorthand used everywhere: t('ui.path') returns a span bound to a ui string */
export function T(path, tag = 'span', cls) { const e = document.createElement(tag); if (cls) e.className = cls; return bindText(e, () => ui(path)); }
export const TT = (v, tag = 'span', cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return bindText(e, v); };

export function setLang(l) {
  if (!LANGS.includes(l) || l === lang) return;
  lang = l; store.set('lang', l);
  document.documentElement.lang = l;
  [...reg].forEach(apply);
  emit('lang', l);
}
document.documentElement.lang = lang;
export function refreshI18n() { [...reg].forEach(apply); }
