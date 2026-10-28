/* js/pages/contact.js — CONTACT: "the signal". Every channel is a station on a dial; hover tunes it in. Everything comes from config → contact. */
import { CONFIG } from '../../config/config.js';
import { S } from '../core/state.js';
import { h, asset, scramble } from '../core/util.js';
import { T, TT, ui } from '../core/i18n.js';
import { emit } from '../core/bus.js';
import { kick } from '../core/glitch.js';
import * as sfx from '../audio/sfx.js';
import { footer } from '../ui/footer.js';

const C = CONFIG.contact;
const NAV = CONFIG.nav.find(n => n.route === 'contact');
export default {
  id: 'contact', scene: 'contact', title: NAV.label,
  async mount(ctx) {
    const root = ctx.el; root.classList.add('contact');
    const banner = h('div', { class: 'shout', role: 'note' }, h('div', { class: 'shout-track' }, [0, 1].map(() => h('span', {}, TT(C.banner), ' ✦ '))));
    const bannerPlain = h('p', { class: 'shout-plain' }, TT(C.banner));
    const dial = h('span', { class: 'dial-readout' }, '---.- MHz'), tune = h('div', { class: 'dial', 'aria-hidden': 'true' }, h('i', { class: 'needle' }), dial);
    const chans = [];
    const cards = C.channels.map((c, i) => {
      const val = c.value || c.handle, isMail = c.kind === 'email', url = isMail ? 'mailto:' + c.value : c.url;
      const a = h(url ? 'a' : 'button', Object.assign({ class: 'chan', style: `--i:${i};--c:${c.color || 'var(--blue)'}`, type: url ? undefined : 'button' }, url ? { href: url, target: isMail ? undefined : '_blank', rel: 'noopener' } : {}),
        h('span', { class: 'chan-ic' }, h('img', { src: asset(c.icon), alt: '', class: 'mask' })), h('span', { class: 'chan-t' }, h('b', {}, c.label), h('small', { class: 'hd' }, val), c.blurb ? h('em', {}, TT(c.blurb)) : null),
        h('span', { class: 'chan-go' }, c.copy ? T('contact.copy') : '↗'));
      const hd = a.querySelector('.hd');
      a.addEventListener('pointerenter', () => { scramble(a.querySelector('b'), c.label, 280); dial.textContent = (88 + (i * 7.3) % 20).toFixed(1) + ' MHz'; kick(0.25); });
      a.addEventListener('focus', () => { dial.textContent = (88 + (i * 7.3) % 20).toFixed(1) + ' MHz'; });
      if (c.copy) a.addEventListener('click', async e => { if (!url) e.preventDefault(); try { await navigator.clipboard.writeText(c.copyText || c.handle); } catch (er) {} sfx.play('ui_copy'); scramble(hd, ui('contact.copied') + ' // ' + (c.copyText || c.handle), 300); setTimeout(() => scramble(hd, val, 300), 1700); emit('contact:copy', c.id); });
      else a.addEventListener('click', () => emit('contact:click', c.id));
      chans.push(a); return a;
    });
    const guide = C.guide.map(g => h('li', {}, h('b', {}, TT(g.when)), h('span', {}, TT(g.use))));
    root.append(
      h('header', { class: 'phead' }, h('p', { class: 'kick' }, TT(C.kicker)), h('h1', { class: 'xl' }, TT(NAV.label)), h('p', { class: 'lede' }, TT(C.intro))),
      banner, bannerPlain, tune, h('div', { class: 'chans' }, cards),
      h('section', { class: 'sec guide' }, h('h2', {}, T('contact.guideTitle')), h('ul', {}, guide)), footer());
    const needle = tune.querySelector('.needle');
    ctx.frame(() => { needle.style.transform = `translateX(${(Math.sin(S.t * 0.6) * 0.5 + 0.5) * 100 + S.a.bass * 6}%)`; });
  }
};
