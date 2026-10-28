/* js/games/common.js — little helpers shared by the three games */
import { CONFIG } from '../../config/config.js';
import { get, tx, TT } from '../core/i18n.js';
export const gtt = (p, tag = 'span', cls) => TT(get('games.ui.' + p), tag, cls);   // live-translating element
export const gs = p => tx(get('games.ui.' + p));                                     // current string (for canvas text)
export const asset_ = p => new URL(p, new URL('../../', import.meta.url)).href;
export function loadImg(p) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = asset_(p); }); }
