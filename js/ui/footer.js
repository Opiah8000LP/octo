/* the small, unobtrusive link to the personal site — appended to the end of every page */
import { CONFIG } from '../../config/config.js';
import { h } from '../core/util.js';
import { TT } from '../core/i18n.js';
export function footer() {
  const p = CONFIG.site.personalSite;
  return h('footer', { class: 'foot' },
    h('a', { class: 'about-link', href: p.url, target: '_blank', rel: 'noopener', title: p.url }, '[ ', TT(p.label), ' ↗ ]'),
    h('small', {}, '© ', String(new Date().getFullYear()), ' ', CONFIG.site.name, ' · MIT'));
}
