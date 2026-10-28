/* js/ui/settingsPanel.js — the settings drawer, openable from anywhere (gear button or the "," key). */
import { CONFIG } from '../../config/config.js';
import { h, ROOT } from '../core/util.js';
import { T, bindAttr, ui, setLang, getLang } from '../core/i18n.js';
import { on, emit } from '../core/bus.js';
import * as settings from '../core/settings.js';
import * as sfx from '../audio/sfx.js';
import { resetLayout } from './playerWindow.js';

let panel, scrim, opener, rows = [];
const ic = n => h('i', { class: 'ic', style: `--i:url(${ROOT}assets/ui/${n}.png)`, 'aria-hidden': 'true' });

function sw(key, labelPath, hintPath) {
  const b = h('button', { class: 'sw', type: 'button', role: 'switch', 'aria-checked': 'false' }, h('i'));
  const lab = h('span', { class: 'sr-lab' }, T(labelPath), hintPath ? h('small', {}, T(hintPath)) : null);
  const row = h('div', { class: 'set-row' }, lab, b);
  const sync = () => { const v = !!settings.get(key); b.setAttribute('aria-checked', v); };
  b.addEventListener('click', () => { const v = !settings.get(key); settings.put(key, v); sfx.play(v ? 'ui_toggle_on' : 'ui_toggle_off'); });
  rows.push(sync); sync(); return row;
}
function seg(name, options, get, set) {
  const wrap = h('div', { class: 'seg', role: 'radiogroup' });
  const btns = options.map(([val, label]) => {
    const b = h('button', { type: 'button', role: 'radio', dataset: { v: val } }, typeof label === 'string' && label.startsWith('ui:') ? T(label.slice(3)) : label);
    b.addEventListener('click', () => { set(val); sfx.play('ui_toggle_on'); }); wrap.appendChild(b); return b;
  });
  const sync = () => btns.forEach(b => { const on_ = b.dataset.v === get(); b.setAttribute('aria-checked', on_); b.classList.toggle('on', on_); });
  rows.push(sync); sync(); return wrap;
}
const group = (titlePath, ...kids) => h('section', { class: 'set-group' }, h('h3', {}, T(titlePath)), ...kids);

export function init() {
  const close = h('button', { class: 'set-x', type: 'button' }, ic('close')); bindAttr(close, 'aria-label', CONFIG.ui.settings.close);
  close.addEventListener('click', () => toggle(false));

  const vol = h('input', { type: 'range', min: 0, max: 100, step: 5, class: 'range' }); bindAttr(vol, 'aria-label', CONFIG.ui.settings.sfxVol);
  vol.addEventListener('input', () => { settings.put('sfxVol', vol.value / 100); sfx.play('ui_click', { force: true }); });
  rows.push(() => { vol.value = Math.round(settings.get('sfxVol') * 100); });

  const sz = sw('schizo', 'settings.schizo', 'settings.schizoWarn'); sz.classList.add('sz-row');

  panel = h('aside', { class: 'set-panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'set-t', hidden: true },
    h('header', {}, h('h2', { id: 'set-t' }, T('settings.title')), close),
    h('div', { class: 'set-scroll' },
      group('settings.appearance',
        h('div', { class: 'set-row col' }, h('span', { class: 'sr-lab' }, T('settings.theme'), h('small', {}, T('settings.themeHint'))),
          seg('theme', [['auto', 'ui:settings.themeAuto'], ['light', 'ui:settings.themeLight'], ['dark', 'ui:settings.themeDark']], () => settings.get('theme'), v => { settings.setTheme(v); emit('theme:user'); sfx.playNow(settings.resolveTheme() === 'dark' ? 'theme_night' : 'theme_day'); }))),
      group('settings.language',
        h('div', { class: 'set-row col' }, seg('lang', [['en', 'English'], ['ru', 'Русский']], () => getLang(), v => setLang(v)))),
      group('settings.accessibility',
        sw('reduceFx', 'settings.reduceFx', 'settings.reduceFxHint'), sw('noFlash', 'settings.noFlash', 'settings.noFlashHint'), sw('noShake', 'settings.noShake'),
        sw('plainType', 'settings.plainType', 'settings.plainTypeHint'), sw('bigText', 'settings.bigText'), sw('highContrast', 'settings.highContrast'), sw('noCursor', 'settings.noCursor')),
      group('settings.audio', sw('sfx', 'settings.sfx'), h('div', { class: 'set-row col' }, h('span', { class: 'sr-lab' }, T('settings.sfxVol')), vol), sw('typeSounds', 'settings.typeSounds')),
      group('settings.fun', sw('bot', 'settings.bot'), sz),
      group('settings.data',
        h('div', { class: 'set-btns' },
          h('button', { class: 'btn', type: 'button', on: { click: () => { resetLayout(); sfx.play('ui_click'); } } }, T('settings.resetPlayer')),
          h('button', { class: 'btn', type: 'button', on: { click: () => { settings.resetAll(); settings.applyTheme(false); import('../core/i18n.js').then(m => m.setLang('en')); rows.forEach(f => f()); sfx.play('ui_close'); } } }, T('settings.resetAll')))),
      h('p', { class: 'set-foot' }, T('settings.saved'))));
  scrim = h('div', { class: 'scrim', hidden: true }); scrim.addEventListener('click', () => toggle(false));
  document.body.append(scrim, panel);
  on('setting', () => rows.forEach(f => f())); on('lang', () => rows.forEach(f => f())); on('theme', () => rows.forEach(f => f()));
  on('settings:toggle', () => toggle()); on('escape', () => toggle(false));
  panel.addEventListener('keydown', e => {                      /* keep focus inside while open */
    if (e.key !== 'Tab') return; const f = [...panel.querySelectorAll('button,input')].filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
export function toggle(force) {
  const open = force === undefined ? panel.hidden : force; if (open === !panel.hidden) return;
  if (open) opener = document.activeElement;
  panel.hidden = !open; scrim.hidden = !open; document.body.classList.toggle('set-open', open);
  sfx.play(open ? 'ui_open' : 'ui_close'); emit(open ? 'settings:open' : 'settings:close');
  if (open) setTimeout(() => panel.querySelector('.set-x').focus(), 30); else if (opener && opener.focus) opener.focus({ preventScroll: true });
}
