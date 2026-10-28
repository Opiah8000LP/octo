/* js/ui/input.js — pointer, scroll, keyboard, cursor, and the click/hover sound feedback. One place for every global gesture.
   Keys: P play/pause · N next · B back · M mute · L playlist · T theme · , settings · Esc closes panels (ignored while typing). */
import { S } from '../core/state.js';
import { mk, clamp } from '../core/util.js';
import { kick } from '../core/glitch.js';
import * as sfx from '../audio/sfx.js';
import * as engine from '../audio/engine.js';
import * as Player from '../audio/player.js';
import { burst } from '../scenes/overlay.js';
import { emit } from '../core/bus.js';
import * as settings from '../core/settings.js';

export const cursor = mk('div'); cursor.id = 'cur'; cursor.setAttribute('aria-hidden', 'true');
export const dot = mk('div'); dot.id = 'dot'; dot.setAttribute('aria-hidden', 'true');
const cp = { x: S.mouse.x, y: S.mouse.y };
let drag = null, lastScroll = 0;
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"], [role="slider"], [tabindex]:not([tabindex="-1"]), .pw, .mockbot, .set-panel, .gal3d';
const typing = t => t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable);

export function init() {
  addEventListener('pointermove', e => {
    const sp = Math.hypot(e.clientX - S.mouse.x, e.clientY - S.mouse.y);
    S.mouse.x = e.clientX; S.mouse.y = e.clientY;
    if (sp > 40 && !S.gated) kick(Math.min(0.12, sp * 0.0008));
    if (drag) { S.spinV += (e.clientX - drag.x) * 0.0016; drag.x = e.clientX; }
  }, { passive: true });

  addEventListener('pointerdown', e => {
    engine.ensureCtx(); engine.resume();
    if (S.gated) return;
    const inter = e.target.closest && e.target.closest(INTERACTIVE);
    if (!inter) { burst(e.clientX, e.clientY, 12); kick(0.4); }
    if (e.target.closest && e.target.closest('a, button, [role="button"], summary, label')) sfx.play('ui_click');
    if (!inter && e.pointerType === 'mouse' && S.route === '') drag = { x: e.clientX };
  });
  addEventListener('pointerup', () => { drag = null; });
  addEventListener('pointercancel', () => { drag = null; });

  /* soft hover tick on links/buttons (mouse only) */
  addEventListener('pointerover', e => {
    if (S.gated || e.pointerType !== 'mouse') return;
    const el = e.target.closest && e.target.closest('a, button, [role="button"]');
    if (el && !el.contains(e.relatedTarget)) { sfx.play('ui_hover', { vol: 0.7 }); cursor.classList.add('h'); }
    else if (!el) cursor.classList.remove('h');
  });
  addEventListener('pointerout', e => { if (!e.relatedTarget) cursor.classList.remove('h'); });

  addEventListener('scroll', () => { const y = scrollY; S.scrollV = y - lastScroll; lastScroll = y; S.scroll = y; }, { passive: true });
  addEventListener('wheel', e => {
    if (S.gated || S.route !== '') return;
    S.spinV += clamp(e.deltaY, -120, 120) * 0.0005; kick(0.04);
  }, { passive: true });

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || S.gated) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') { emit('escape'); return; }
    if (typing(e.target)) return;
    if (k === 'p') Player.toggle(); else if (k === 'n') Player.next(); else if (k === 'b') Player.prev();
    else if (k === 'm') Player.toggleMute(); else if (k === 'l') emit('player:toggleList');
    else if (k === 't') { settings.toggleTheme(); emit('theme:user'); }
    else if (k === ',') emit('settings:toggle');
  });
  addEventListener('orientationchange', () => setTimeout(() => dispatchEvent(new Event('resize')), 200));
}

export function update(dt) {
  S.spin += S.spinV; S.spinV *= Math.pow(0.93, dt * 60);
  S.zoom += (S.zoomT - S.zoom) * 0.08; S.zoomT *= Math.pow(0.97, dt * 60);
  S.scrollV = (S.scrollV || 0) * Math.pow(0.9, dt * 60);
  if (document.body.classList.contains('no-cursor')) return;
  cp.x += (S.mouse.x - cp.x) * 0.22; cp.y += (S.mouse.y - cp.y) * 0.22;
  cursor.style.transform = `translate(${cp.x}px,${cp.y}px) scale(${1 + S.a.beat * 0.25})`;
  dot.style.transform = `translate(${S.mouse.x}px,${S.mouse.y}px)`;
}
