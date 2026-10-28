/* js/pages/credits.js — CREDITS: "the log". A transparent, structured list of everything borrowed, inspired by, and made from scratch. */
import { CONFIG } from '../../config/config.js';
import { h } from '../core/util.js';
import { T, TT } from '../core/i18n.js';
import * as sfx from '../audio/sfx.js';
import { footer } from '../ui/footer.js';

const K = CONFIG.credits;
const NAV = CONFIG.nav.find(n => n.route === 'credits');
const row = (label, node) => h('div', { class: 'cr-f' }, h('dt', {}, T(label)), h('dd', {}, node));
export default {
  id: 'credits', scene: 'credits', title: NAV.label,
  async mount(ctx) {
    const root = ctx.el; root.classList.add('credits');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('seen'); }), { threshold: 0.1 }); ctx.cleanup(() => io.disconnect());
    const entry = (c, i) => {
      const el = h('article', { class: 'cr reveal', style: `--i:${i % 6}` },
        h('header', {}, h('h3', {}, c.url ? h('a', { href: c.url, target: '_blank', rel: 'noopener' }, c.name) : c.name), h('span', { class: 'lic' }, c.license)),
        h('dl', {}, row('credits.by', c.by), row('credits.source', c.url ? h('a', { href: c.url, target: '_blank', rel: 'noopener' }, c.url.replace(/^https?:\/\//, '')) : '—'),
          row('credits.used', TT(c.used)), row('credits.where', TT(c.where)), c.notice ? row('credits.notice', h('code', {}, c.notice)) : null));
      io.observe(el); return el;
    };
    const section = (s, idx) => h('section', { class: 'sec cr-sec' }, h('h2', {}, h('span', {}, String(idx + 1).padStart(2, '0')), TT(s.title)), s.intro ? h('p', { class: 'lede' }, TT(s.intro)) : null, h('div', { class: 'cr-grid' }, s.items.map(entry)));
    const mit = h('section', { class: 'sec mit reveal' }, h('h2', {}, T('credits.licenseTitle')), h('p', {}, TT(K.licenseIntro)), h('pre', { class: 'lic-text', tabindex: 0 }, K.mitText(CONFIG.site.name)), h('p', { class: 'fine' }, TT(K.thirdPartyNote)), h('p', { class: 'fine' }, TT(K.disclaimer)));
    io.observe(mit);
    root.append(h('header', { class: 'phead' }, h('p', { class: 'kick' }, TT(K.kicker)), h('h1', { class: 'xl' }, TT(NAV.label)), h('p', { class: 'lede' }, TT(K.intro))), ...K.sections.map(section), mit, footer());
  }
};
