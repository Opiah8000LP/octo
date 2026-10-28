/* 404 — the page that isn't there */
import { CONFIG } from '../../config/config.js';
import { h } from '../core/util.js';
import { TT } from '../core/i18n.js';
import { href } from '../ui/nav.js';
import { footer } from '../ui/footer.js';
export default {
  id: '404', scene: 'signal', title: CONFIG.notFound.title,
  async mount(ctx) { ctx.el.classList.add('nf'); ctx.el.append(h('section', { class: 'sec nf-box' }, h('h1', { class: 'xl' }, '404'), h('p', { class: 'lede' }, TT(CONFIG.notFound.text)), h('a', { class: 'btn pri', href: href(''), dataset: { route: '' } }, TT(CONFIG.notFound.back))), footer()); }
};
