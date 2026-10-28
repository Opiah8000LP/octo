/* js/core/goat.js — GoatCounter: loads the (privacy-friendly) counter script and reads the real visitor total.
   Set the code in config/config.js → goatcounter.code, and enable "Allow adding visitor counts on your website" in GoatCounter's settings. */
import { CONFIG } from '../../config/config.js';
import { h } from './util.js';
import { emit } from './bus.js';

const G = CONFIG.goatcounter;
export const enabled = !!G.code && !/^(YOUR|ADD)/i.test(G.code);
const host = `https://${G.code}.goatcounter.com`;
let cached = null;

export function init() {
  if (!enabled || !G.loadScript) return;
  document.head.appendChild(h('script', { async: true, src: G.scriptSrc, 'data-goatcounter': host + '/count' }));
}
export function hit(path, title) { try { if (enabled && window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path, title }); } catch (e) {} }
export async function total() {
  if (!enabled) return null; if (cached !== null) return cached;
  try {
    const r = await fetch(`${host}/counter/${G.path || 'TOTAL'}.json`, { cache: 'no-store' }); if (!r.ok) throw 0;
    const j = await r.json(); const n = parseInt(String(j.count ?? j.count_unique ?? '').replace(/\D/g, ''), 10);
    if (isFinite(n)) { cached = n; emit('goat:count', n); return n; }
  } catch (e) {}
  return null;
}
