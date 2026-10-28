/* js/pages/services.js — SERVICES: "the counter". Commission tickets for every service, the two packages, payment methods,
   how it works, how to support me for free, and a request builder that writes a ready-to-send message. */
import { CONFIG } from '../../config/config.js';
import { S } from '../core/state.js';
import { h, store, ROOT, asset } from '../core/util.js';
import { T, TT, tx, bindAttr, ui } from '../core/i18n.js';
import { emit, on } from '../core/bus.js';
import * as sfx from '../audio/sfx.js';
import { footer } from '../ui/footer.js';
import { items as portItems } from './portfolio.js';

const V = CONFIG.services, RATE = V.robuxPerDollar;
const NAV = CONFIG.nav.find(n => n.route === 'services');
const ic = n => h('i', { class: 'ic', style: `--i:url(${ROOT}assets/ui/${n}.png)`, 'aria-hidden': 'true' });
const usd = n => '$' + n, rbx = n => Math.round(n * RATE) + ' R$';
const money = n => `${usd(n)} / ${rbx(n)}`;
const lvl = (pk, id) => V.packages[pk].levels.find(l => l.id === id) || V.packages[pk].levels[0];

function priceBox(pk, state, onChange) {
  const P = V.packages[pk], wrap = h('div', { class: 'lv', role: 'radiogroup' }), out = h('div', { class: 'price' });
  P.levels.forEach(l => { const b = h('button', { type: 'button', role: 'radio', dataset: { l: l.id } }, TT(l.label), h('small', {}, usd(l.usd))); b.addEventListener('click', () => { state.level = l.id; sync(); sfx.play('ui_toggle_on'); onChange && onChange(); }); wrap.appendChild(b); });
  function sync() { wrap.querySelectorAll('button').forEach(b => { const on_ = b.dataset.l === state.level; b.classList.toggle('on', on_); b.setAttribute('aria-checked', on_); }); const l = lvl(pk, state.level); out.textContent = ''; out.append(h('b', {}, usd(l.usd)), h('span', {}, ' / ' + rbx(l.usd)), h('small', {}, TT(l.hint))); }
  sync(); return h('div', {}, wrap, out);
}

export default {
  id: 'services', scene: 'services', title: NAV.label,
  async mount(ctx) {
    const root = ctx.el; root.classList.add('services');
    const draft = Object.assign({ service: V.list.find(s => s.status === 'open').id, pkg: 'standard', level: 'simple', desc: '', budget: '', budgetTouched: false, pay: 'robux', via: 'discord', handle: '', extra: '' }, store.get('builder', {}));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('seen'); }), { threshold: 0.12 }); ctx.cleanup(() => io.disconnect());
    const R = el => { el.classList.add('reveal'); io.observe(el); return el; };

    /* ---------- header + pricing explainer + payments ---------- */
    const head = h('header', { class: 'phead' }, h('p', { class: 'kick' }, TT(V.kicker)), h('h1', { class: 'xl' }, TT(NAV.label)), h('p', { class: 'lede' }, TT(V.intro)));
    const scale = h('div', { class: 'scale' },
      ...['standard', 'priority'].map(pk => h('div', { class: 'scale-col ' + pk }, h('h3', {}, TT(V.packages[pk].name), h('small', {}, ' ' + money(V.packages[pk].levels[0].usd).split(' / ')[0] + '+')), h('ul', {}, V.packages[pk].levels.map(l => h('li', {}, h('b', {}, usd(l.usd)), h('span', {}, ' = ', TT(l.hint))))))));
    const pay = h('div', { class: 'payrow' }, V.payments.map(p => h('div', { class: 'pay ' + p.id }, h('img', { src: asset(p.icon), alt: '' }), h('div', {}, h('b', {}, TT(p.label)), h('small', {}, TT(p.note))))),
      h('div', { class: 'pay rate' }, h('b', {}, '$1 = ' + RATE + ' R$'), h('small', {}, T('services.rate'))));
    const explain = R(h('section', { class: 'sec explain' }, h('h2', {}, T('services.pricingTitle')), scale, pay, h('p', { class: 'fine' }, TT(V.noOther))));

    /* ---------- the service tickets ---------- */
    const rail = h('nav', { class: 'rail', 'aria-label': 'Services' });
    const tickets = h('div', { class: 'tickets' });
    V.list.forEach((sv, n) => {
      const soon = sv.status === 'soon', st = { level: 'simple', pkg: 'standard' }, st2 = { level: 'good' };
      const chip = h('a', { href: '#sv-' + sv.id, class: 'rail-a' + (soon ? ' soon' : '') }, h('i', {}, String(n + 1).padStart(2, '0')), TT(sv.name)); chip.addEventListener('click', e => { e.preventDefault(); document.getElementById('sv-' + sv.id).scrollIntoView({ behavior: S.reduced ? 'auto' : 'smooth', block: 'start' }); sfx.play('ui_slide'); });
      rail.appendChild(chip);

      let pkgs;
      if (soon) pkgs = h('div', { class: 'pk-soon' }, h('b', {}, TT(V.comingSoon)), h('p', {}, TT(sv.soonNote)));
      else if (sv.flat) {
        pkgs = h('div', { class: 'pkgs one' }, h('article', { class: 'pkg flat' }, h('h4', {}, TT(sv.flat.name)), h('div', { class: 'price' }, h('b', {}, usd(sv.flat.usd)), h('span', {}, ' / ' + rbx(sv.flat.usd))),
          h('ul', {}, sv.flat.perks.map(p => h('li', {}, TT(p)))), h('p', { class: 'best' }, TT(sv.flat.bestFor)), h('button', { class: 'btn pri', type: 'button', on: { click: () => choose(sv.id, 'flat') } }, T('services.request'))));
      } else {
        pkgs = h('div', { class: 'pkgs' }, ['standard', 'priority'].map(pk => {
          const P = V.packages[pk], s = pk === 'standard' ? st : st2; if (pk === 'priority') s.level = 'good';
          return h('article', { class: 'pkg ' + pk }, h('h4', {}, TT(P.name), pk === 'priority' ? h('em', {}, TT(V.fastBadge)) : null), h('p', { class: 'tag' }, TT(P.tagline)), priceBox(pk, s),
            h('ul', {}, P.perks.map(p => h('li', {}, h('i', { class: 'tick' }), TT(p)))), h('p', { class: 'best' }, TT(P.bestFor)),
            h('button', { class: 'btn pri', type: 'button', on: { click: () => choose(sv.id, pk, s.level) } }, T('services.request')));
        }));
      }

      /* examples from the portfolio */
      const ex = portItems(sv.examples.tab).slice(0, sv.examples.limit || 3);
      const examples = h('div', { class: 'ex' }, h('h4', {}, T('services.examples')),
        ex.length ? h('ul', {}, ex.map(e => h('li', {}, h('a', { href: ROOT + 'portfolio/#' + sv.examples.tab, dataset: { route: 'portfolio' } }, tx(e.title))))) : h('p', {}, TT(V.noExamples), ' ', h('a', { href: ROOT + 'portfolio/#' + sv.examples.tab, dataset: { route: 'portfolio' } }, TT(V.seePortfolio))));

      tickets.appendChild(R(h('section', { class: 'ticket' + (soon ? ' is-soon' : ''), id: 'sv-' + sv.id, style: `--n:${n}` },
        h('div', { class: 'stub', 'aria-hidden': 'true' }, h('b', {}, String(n + 1).padStart(2, '0')), h('i')),
        h('div', { class: 'tk-main' },
          h('header', {}, h('h2', {}, TT(sv.name)), h('span', { class: 'badge-s ' + (soon ? 'soon' : 'open') }, TT(soon ? V.comingSoon : V.open))),
          h('p', { class: 'tk-desc' }, TT(sv.desc)),
          h('div', { class: 'tk-cols' },
            h('div', {}, h('h4', {}, T('services.includes')), h('ul', { class: 'dots' }, sv.includes.map(i => h('li', {}, TT(i))))),
            h('div', {}, h('h4', {}, T('services.good2know')), h('ul', { class: 'dots warn' }, sv.limits.map(i => h('li', {}, TT(i)))))),
          pkgs, examples))));
    });

    /* ---------- how it works ---------- */
    const steps = R(h('section', { class: 'sec steps' }, h('h2', {}, T('services.howTitle')),
      h('ol', {}, V.process.map((s, i) => h('li', { style: `--i:${i}` }, h('b', {}, String(i + 1)), h('div', {}, h('h4', {}, TT(s.title)), h('p', {}, TT(s.text))))))));
    const revs = h('p', { class: 'fine' }, TT(V.revisions));

    /* ---------- support for free ---------- */
    const support = R(h('section', { class: 'sec support' }, h('p', { class: 'kick' }, TT(V.support.kicker)), h('h2', { class: 'xl' }, TT(V.support.title)), h('p', { class: 'lede' }, TT(V.support.intro)),
      h('ul', { class: 'sup-grid' }, V.support.ideas.map((i, k) => h('li', { style: `--k:${k}` }, h('img', { src: asset(`assets/ui/${i.icon}.png`), alt: '', class: 'mask' }), h('b', {}, TT(i.title)), h('span', {}, TT(i.text))))),
      h('p', { class: 'warm' }, TT(V.support.outro))));

    /* ---------- request builder ---------- */
    const B = V.builder, f = {};
    const svc = h('select', { id: 'rb-svc', class: 'fld' }, V.list.map(s => h('option', { value: s.id, disabled: s.status === 'soon' }, tx(s.name) + (s.status === 'soon' ? ' — ' + tx(V.comingSoon) : ''))));
    const pkg = h('select', { id: 'rb-pkg', class: 'fld' }), lev = h('select', { id: 'rb-lvl', class: 'fld' });
    const desc = h('textarea', { id: 'rb-desc', class: 'fld', rows: 5, maxlength: 1500 }), budget = h('input', { id: 'rb-bud', class: 'fld', type: 'text', maxlength: 40 });
    const handle = h('input', { id: 'rb-handle', class: 'fld', type: 'text', maxlength: 60, autocomplete: 'off' }), extra = h('textarea', { id: 'rb-extra', class: 'fld', rows: 3, maxlength: 800 });
    bindAttr(desc, 'placeholder', B.descPh); bindAttr(budget, 'placeholder', B.budgetPh); bindAttr(handle, 'placeholder', B.handlePh); bindAttr(extra, 'placeholder', B.extraPh);
    const radio = (name, opts, key) => { const g = h('div', { class: 'rg', role: 'radiogroup' }); opts.forEach(o => { const b = h('button', { type: 'button', role: 'radio', dataset: { v: o.id } }, o.icon ? h('img', { src: asset(o.icon), alt: '', class: 'mask' }) : null, TT(o.label)); b.addEventListener('click', () => { draft[key] = o.id; sync(); sfx.play('ui_toggle_on'); }); g.appendChild(b); }); return g; };
    const payG = radio('pay', V.payments, 'pay'), viaG = radio('via', V.contactVia, 'via');
    const status = h('p', { class: 'rb-status', role: 'status', 'aria-live': 'polite' }), pre = h('pre', { class: 'rb-out', tabindex: 0 }), count = h('small', { class: 'cnt' });
    const field = (id, label, el, hint) => h('div', { class: 'f' }, h('label', { for: id }, T(label)), el, hint ? h('small', {}, T(hint)) : null);

    const svDef = () => V.list.find(s => s.id === draft.service);
    function normalize() {
      const sv = svDef(); if (!sv || sv.status === 'soon') { draft.service = V.list.find(s => s.status === 'open').id; return normalize(); }
      if (sv.flat) { draft.pkg = 'flat'; draft.level = 'flat'; }
      else { if (!V.packages[draft.pkg]) draft.pkg = 'standard'; if (!V.packages[draft.pkg].levels.some(l => l.id === draft.level)) draft.level = V.packages[draft.pkg].levels[0].id; }
    }
    const priceNow = () => { const sv = svDef(); return sv.flat ? sv.flat.usd : lvl(draft.pkg, draft.level).usd; };
    function sync() {
      normalize(); const sv = svDef();
      svc.value = draft.service;
      pkg.textContent = ''; lev.textContent = '';
      if (sv.flat) { pkg.appendChild(h('option', { value: 'flat' }, tx(sv.flat.name))); lev.appendChild(h('option', { value: 'flat' }, usd(sv.flat.usd))); pkg.disabled = lev.disabled = true; }
      else { pkg.disabled = lev.disabled = false; ['standard', 'priority'].forEach(k => pkg.appendChild(h('option', { value: k }, tx(V.packages[k].name) + ' — ' + usd(V.packages[k].levels[0].usd) + '+'))); pkg.value = draft.pkg; V.packages[draft.pkg].levels.forEach(l => lev.appendChild(h('option', { value: l.id }, tx(l.label) + ' — ' + money(l.usd)))); lev.value = draft.level; }
      if (!draft.budgetTouched) draft.budget = money(priceNow()); budget.value = draft.budget;
      [payG, viaG].forEach((g, i) => g.querySelectorAll('button').forEach(b => { const on_ = b.dataset.v === (i ? draft.via : draft.pay); b.classList.toggle('on', on_); b.setAttribute('aria-checked', on_); }));
      desc.value = draft.desc; handle.value = draft.handle; extra.value = draft.extra; render(); store.set('builder', draft);
    }
    function build() {
      const sv = svDef(), credit = sv.flat ? 'No credit needed (flat price)' : draft.pkg === 'priority' ? 'Credit-free usage (Priority)' : 'Credit to DWEEB required (Standard)';
      const pk = sv.flat ? tx(sv.flat.name) : `${V.packages[draft.pkg].name.en} / ${lvl(draft.pkg, draft.level).label.en} (${money(priceNow())})`;
      const payName = V.payments.find(p => p.id === draft.pay).label.en, via = V.contactVia.find(p => p.id === draft.via).label.en;
      return [`COMMISSION REQUEST // ${CONFIG.site.brand}`, '', `Service: ${sv.name.en}`, `Package: ${pk}`, `Credit: ${credit}`, `Budget: ${draft.budget || '—'}`, `Payment: ${payName}${draft.pay === 'robux' ? ' (' + RATE + ' Robux = $1)' : ' (real money, Ko-fi only)'}`,
        `Contact me on: ${via}${draft.handle ? ' — ' + draft.handle : ''}`, '', 'Idea / requirements:', draft.desc.trim() || '(not written yet)', '', 'Extra info:', draft.extra.trim() || '—', ''].join('\n');
    }
    function render() { pre.textContent = build(); count.textContent = draft.desc.length + ' / 1500'; }
    const bind = (el, key, flag) => el.addEventListener('input', () => { draft[key] = el.value; if (flag) draft.budgetTouched = true; render(); store.set('builder', draft); });
    bind(desc, 'desc'); bind(handle, 'handle'); bind(extra, 'extra'); bind(budget, 'budget', true);
    svc.addEventListener('change', () => { draft.service = svc.value; draft.budgetTouched = false; sync(); }); pkg.addEventListener('change', () => { draft.pkg = pkg.value; draft.level = V.packages[draft.pkg].levels[0].id; draft.budgetTouched = false; sync(); }); lev.addEventListener('change', () => { draft.level = lev.value; draft.budgetTouched = false; sync(); });

    const ok = () => { if (draft.desc.trim().length < 10) { status.textContent = tx(B.needDesc); status.className = 'rb-status bad'; sfx.play('ui_error'); desc.focus(); return false; } return true; };
    const copy = async (open) => {
      if (!ok()) return; const text = build();
      try { await navigator.clipboard.writeText(text); } catch (e) { const ta = h('textarea', { value: text, style: 'position:fixed;opacity:0' }); document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (er) {} ta.remove(); }
      sfx.play('ui_success'); status.textContent = tx(open ? B.copiedOpen : B.copied); status.className = 'rb-status good'; emit('builder:copy');
      if (open) { const c = open === 'discord' ? CONFIG.contact.discord.url : CONFIG.contact.kofi.url; if (c) window.open(c, '_blank', 'noopener'); }
    };
    const act = h('div', { class: 'rb-acts' },
      h('button', { class: 'btn pri', type: 'button', on: { click: () => copy(false) } }, ic('copy'), T('services.builder.copy')),
      h('button', { class: 'btn', type: 'button', on: { click: () => copy('discord') } }, h('img', { src: asset('assets/social/discord.png'), class: 'mask', alt: '' }), T('services.builder.sendDiscord')),
      h('button', { class: 'btn', type: 'button', on: { click: () => copy('kofi') } }, h('img', { src: asset('assets/social/kofi.png'), class: 'mask', alt: '' }), T('services.builder.sendKofi')),
      h('button', { class: 'btn ghost', type: 'button', on: { click: () => { Object.assign(draft, { desc: '', extra: '', handle: '', budgetTouched: false }); status.textContent = ''; sync(); sfx.play('ui_close'); } } }, T('services.builder.clear')));
    const builder = R(h('section', { class: 'sec builder', id: 'builder' }, h('p', { class: 'kick' }, TT(B.kicker)), h('h2', { class: 'xl' }, TT(B.title)), h('p', { class: 'lede' }, TT(B.intro)),
      h('div', { class: 'rb-grid' },
        h('div', { class: 'rb-form' },
          field('rb-svc', 'services.builder.service', svc), h('div', { class: 'two' }, field('rb-pkg', 'services.builder.package', pkg), field('rb-lvl', 'services.builder.level', lev)),
          field('rb-desc', 'services.builder.desc', desc), h('div', { class: 'cnt-row' }, count),
          h('div', { class: 'two' }, field('rb-bud', 'services.builder.budget', budget, 'services.builder.budgetHint'), h('div', { class: 'f' }, h('span', { class: 'lab' }, T('services.builder.payment')), payG, h('small', {}, T('services.builder.payHint')))),
          h('div', { class: 'f' }, h('span', { class: 'lab' }, T('services.builder.via')), viaG), field('rb-handle', 'services.builder.handle', handle), field('rb-extra', 'services.builder.extra', extra)),
        h('div', { class: 'rb-prev' }, h('h3', {}, T('services.builder.preview')), pre, status, act, h('p', { class: 'fine' }, T('services.builder.sendHint'))))));

    function choose(id, pk, level) {
      draft.service = id; if (pk !== 'flat') { draft.pkg = pk; draft.level = level || V.packages[pk].levels[0].id; } draft.budgetTouched = false; sync();
      builder.scrollIntoView({ behavior: S.reduced ? 'auto' : 'smooth', block: 'start' }); sfx.play('ui_open'); emit('builder:open'); setTimeout(() => desc.focus({ preventScroll: true }), 500);
    }
    sync();
    root.append(head, explain, h('div', { class: 'tk-wrap' }, rail, tickets), steps, revs, support, builder, footer());
    ctx.on('lang', () => sync());
  }
};
