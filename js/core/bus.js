/* js/core/bus.js — a tiny event bus. Pages, player, settings and MOCK BOT all talk through this. */
const L = {};
export const on = (e, f) => { (L[e] = L[e] || []).push(f); return () => off(e, f); };
export const off = (e, f) => { L[e] = (L[e] || []).filter(x => x !== f); };
export const emit = (e, d) => { (L[e] || []).slice().forEach(f => { try { f(d); } catch (err) { console.error('[bus]', e, err); } }); (L['*'] || []).forEach(f => { try { f(e, d); } catch (er) {} }); };
