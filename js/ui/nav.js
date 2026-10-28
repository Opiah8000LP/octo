/* js/ui/nav.js — top bar + full-screen "node map" menu. Real links (keyboard + crawler friendly), styled like the original corner tags. */
import { CONFIG } from '../../config/config.js';
import { S } from '../core/state.js';
import { h, ROOT, scramble } from '../core/util.js';
import { T, TT, bindAttr, ui } from '../core/i18n.js';
import { on, emit } from '../core/bus.js';
import * as sfx from '../audio/sfx.js';
import * as settings from '../core/settings.js';

export const href = route => ROOT + (route ? route + '/' : '');
let menu, links = [], bar, menuBtn;

function icon(name) { return h('i', { class: 'ic', style: `--i:url(${ROOT}assets/ui/${name}.png)`, 'aria-hidden': 'true' }); }

export function init() {
  const items = CONFIG.nav;
  const skip = h('a', { class: 'skip', href: '#view' }, T('nav.skip'));
  skip.addEventListener('click', e => { e.preventDefault(); const v = document.getElementById('view'); v.setAttribute('tabindex', '-1'); v.focus(); });

  const home = h('a', { class: 'corner l', href: href(''), 'data-route': '', dataset: { route: '' } }, '[ ', h('span', {}, CONFIG.site.alias.toLowerCase()), ' ]');
  const inline = h('nav', { class: 'topnav', 'aria-label': 'Main' });
  items.filter(i => i.route !== '').forEach(i => {
    const a = h('a', { href: href(i.route), dataset: { route: i.route } }, '[ ', TT(i.label), ' ]'); inline.appendChild(a); links.push(a);
  });
  const themeBtn = h('button', { class: 'tb tb-theme', type: 'button', 'aria-label': 'Theme', title: 'T' }, icon('sun'), icon('moon'));
  themeBtn.addEventListener('click', () => { settings.toggleTheme(); emit('theme:user'); sfx.playNow(settings.resolveTheme() === 'dark' ? 'theme_night' : 'theme_day'); });
  const setBtn = h('button', { class: 'tb', type: 'button', 'aria-label': 'Settings', title: ',' }, icon('settings'));
  bindAttr(setBtn, 'aria-label', CONFIG.ui.settings.title);
  setBtn.addEventListener('click', () => emit('settings:toggle'));
  menuBtn = h('button', { class: 'tb menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'menu' }, icon('menu'), h('span', {}, '[ ', T('nav.menu'), ' ]'));
  menuBtn.addEventListener('click', () => toggleMenu());
  bar = h('header', { class: 'bar' }, home, inline, h('div', { class: 'tools' }, themeBtn, setBtn, menuBtn));

  /* the node-map menu */
  const list = h('ol', { class: 'menu-list' });
  items.forEach((i, n) => {
    const a = h('a', { class: 'menu-link', href: href(i.route), dataset: { route: i.route }, style: `--n:${n}` },
      h('span', { class: 'mn' }, String(n + 1).padStart(2, '0')), h('span', { class: 'ml' }, TT(i.label)), h('small', {}, TT(i.sub)));
    list.appendChild(h('li', {}, a)); links.push(a);
    a.addEventListener('click', () => toggleMenu(false));
    a.addEventListener('pointerenter', () => { if (!S.reduced) scramble(a.querySelector('.ml'), (typeof i.label === 'string' ? i.label : i.label[document.documentElement.lang] || i.label.en), 300); });
  });
  menu = h('div', { class: 'menu', id: 'menu', role: 'dialog', 'aria-label': 'Menu', hidden: true },
    h('button', { class: 'menu-x', type: 'button', 'aria-label': 'Close' }, icon('close')), list,
    h('p', { class: 'menu-note' }, TT(CONFIG.contact.note)));
  menu.querySelector('.menu-x').addEventListener('click', () => toggleMenu(false));
  document.body.append(skip, bar, menu);
  on('escape', () => toggleMenu(false));
}

export function toggleMenu(force) {
  const open = force === undefined ? menu.hidden : force; if (open === !menu.hidden) return;
  menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
  sfx.play(open ? 'ui_open' : 'ui_close');
  if (open) setTimeout(() => menu.querySelector('.menu-link').focus(), 50); else menuBtn.focus({ preventScroll: true });
}
export function setActive(route) {
  links.forEach(a => { const on_ = a.dataset.route === route; a.classList.toggle('on', on_); if (on_) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}
