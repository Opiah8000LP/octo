/* js/core/router.js — tiny History-API router. Real folders exist for every route (portfolio/index.html …) so deep links and crawlers work;
   once the app is running, links swap pages without reloading, which is what keeps the music playing. */
import { CONFIG } from '../../config/config.js';
import { S } from './state.js';
import { ROOT, h } from './util.js';
import { tx, ui, refreshI18n } from './i18n.js';
import { emit, on } from './bus.js';
import * as bg from '../scenes/bg.js';
import * as nav from '../ui/nav.js';
import * as transition from '../ui/transition.js';
import * as goat from './goat.js';
import * as settings from './settings.js';

const LOAD = {
  '': () => import('../pages/home.js'), portfolio: () => import('../pages/portfolio.js'), services: () => import('../pages/services.js'),
  contact: () => import('../pages/contact.js'), credits: () => import('../pages/credits.js'), '404': () => import('../pages/notfound.js')
};
const rootPath = new URL(ROOT).pathname;
export function routeFromLocation() {
  let rel = decodeURIComponent(location.pathname.slice(rootPath.length)).replace(/index\.html$/, '').replace(/^\/+|\/+$/g, '');
  const q = new URLSearchParams(location.search).get('r'); if (q !== null) rel = q;
  return rel in LOAD ? rel : '404';
}
export function routeFromHref(a) {
  if (a.origin !== location.origin || a.target === '_blank' || a.hasAttribute('download')) return null;
  const rel = decodeURIComponent(a.pathname.slice(rootPath.length)).replace(/index\.html$/, '').replace(/^\/+|\/+$/g, '');
  return a.pathname.startsWith(rootPath) && rel in LOAD ? rel : null;
}

const view = h('main', { id: 'view', class: 'view' }); document.body.appendChild(view);
let cur = null, frames = [], busy = false, pending = null, first = true;
const eventOffs = [];

const mkCtx = route => ({
  el: view, route,
  frame(fn) { frames.push(fn); return fn; },
  cleanup(fn) { cleanups.push(fn); },
  on(ev, fn) { eventOffs.push(on(ev, fn)); }
});
let cleanups = [];
export const runFrames = dt => { for (let i = 0; i < frames.length; i++) frames[i](dt); };

async function show(route, push) {
  if (busy) { pending = [route, push]; return; }
  busy = true;
  try {
    const mod = await LOAD[route](); const page = mod.default;
    const label = tx(page.title).toUpperCase();
    if (!first) await transition.cover(label);
    cleanups.forEach(f => { try { f(); } catch (e) {} }); cleanups = []; frames = []; eventOffs.splice(0).forEach(f => f());
    if (cur && cur.unmount) { try { cur.unmount(); } catch (e) {} }
    view.textContent = ''; view.className = 'view page-' + (route || 'home'); view.dataset.page = route || 'home';
    S.route = route; bg.setScene(page.scene || 'signal'); nav.setActive(route);
    if (push) history.pushState({ route }, '', ROOT + (route && route !== '404' ? route + '/' : ''));
    window.scrollTo(0, 0); S.scroll = 0;
    cur = page; document.title = `${tx(page.title)} // ${CONFIG.site.brand}`;
    const el = h('div', { class: 'page' }); view.appendChild(el);
    await page.mount(Object.assign(mkCtx(route), { el }));
    refreshI18n();
    if (!first) { await transition.reveal(); goat.hit(location.pathname, document.title); }
    view.querySelector('.page') && view.querySelector('.page').classList.add('in');
    emit('route', route); first = false;
  } catch (err) { console.error('[router]', err); document.body.classList.add('ready'); view.textContent = ''; view.appendChild(h('p', { class: 'err-msg' }, ui('errors.pageBroke'))); await transition.reveal(); first = false; }
  busy = false;
  if (pending) { const [r, p] = pending; pending = null; show(r, p); }
}
export function go(route, push = true) { if (route === S.route && !busy && !first) { window.scrollTo({ top: 0, behavior: S.reduced ? 'auto' : 'smooth' }); return; } show(route, push); }

export function start() {
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const r = routeFromHref(a); if (r === null) return; e.preventDefault(); go(r);
  });
  addEventListener('popstate', () => show(routeFromLocation(), false));
  on('route:go', r => go(r)); on('lang', () => { if (cur) document.title = `${tx(cur.title)} // ${CONFIG.site.brand}`; });
  return show(routeFromLocation(), false);
}
