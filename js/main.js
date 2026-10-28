/* js/main.js — the conductor. Boots modules, runs the single animation loop.
   Each frame: audio analysis → glitch/mood → palette → input → page frames → player window → canvas. */
import { CONFIG } from '../config/config.js';
import { S } from './core/state.js';
import { emit } from './core/bus.js';
import * as settings from './core/settings.js';
import * as glitch from './core/glitch.js';
import * as mood from './core/mood.js';
import * as world from './core/world.js';
import * as goat from './core/goat.js';
import * as router from './core/router.js';
import * as bg from './scenes/bg.js';
import { pulseShards, tickShards } from './scenes/overlay.js';
import * as engine from './audio/engine.js';
import * as Player from './audio/player.js';
import * as sfx from './audio/sfx.js';
import * as input from './ui/input.js';
import * as gate from './ui/gate.js';
import * as nav from './ui/nav.js';
import * as pw from './ui/playerWindow.js';
import * as settingsPanel from './ui/settingsPanel.js';
import * as schizo from './ui/schizo.js';
import * as bot from './ui/bot.js';

/* theme decorations: a sun + clouds by day, a moon + sparkles by night (PNG masks from assets/deco) */
function buildDeco() {
  const U = n => `url(${new URL('../assets/deco/' + n + '.png', import.meta.url).href})`, d = document.createElement('div'); d.id = 'deco'; d.setAttribute('aria-hidden', 'true');
  const add = (cls, img, style) => { const i = document.createElement('i'); i.className = 'dc ' + cls; i.style.cssText = `--i:${U(img)};${style}`; d.appendChild(i); };
  add('day sun', 'sun', 'right:4vw;top:9vh;width:min(22vw,200px)'); add('day cloud', 'cloud', 'left:-6vw;top:20vh;width:min(30vw,260px);--s:48s'); add('day cloud', 'cloud', 'left:-6vw;top:62vh;width:min(22vw,190px);--s:70s;animation-delay:-30s');
  add('night moon', 'moon', 'right:5vw;top:10vh;width:min(18vw,170px)'); add('night spark', 'sparkle', 'left:8vw;top:24vh;width:34px'); add('night spark', 'sparkle', 'right:22vw;top:52vh;width:22px;animation-delay:-1.1s'); add('night spark', 'sparkle', 'left:30vw;top:70vh;width:28px;animation-delay:-2s'); add('night spark', 'star', 'left:60vw;top:16vh;width:18px;animation-delay:-.6s');
  document.body.prepend(d);
}
/* ---------- boot ---------- */
settings.applyAll(); settings.applyTheme(true);
{ const l = document.querySelector('link[rel="icon"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' })); l.href = new URL(CONFIG.site.favicon, new URL('../', import.meta.url)).href; }
document.body.prepend(bg.cv); document.body.append(input.cursor, input.dot); buildDeco();
Player.init(); bg.resize(); input.init(); nav.init(); pw.init(); settingsPanel.init(); schizo.init(); bot.init(); goat.init();
router.start();

const g = gate.init(({ silent }) => {
  engine.ensureCtx(); engine.resume(); sfx.preload(sfx.CORE);
  sfx.playNow('enter');
  if (!silent && CONFIG.player.autoplayOnEnter) Player.play(); else Player.unlock();
  glitch.kick(1.0); emit('gate:enter', { silent }); schizo.resume();
});
let loaded = 0; { const imgs = ['assets/deco/pearl.png', 'assets/ui/play.png', 'assets/img/mockbot.png']; imgs.forEach(p => { const i = new Image(); i.onload = i.onerror = () => g.progress(++loaded / imgs.length); i.src = new URL(p, new URL('../', import.meta.url)).href; }); }

/* ---------- beat reactions: low = slow & heavy, high = fast & dense ---------- */
engine.onBeat((band, str) => {
  if (S.gated) return;
  if (band === 'low') { glitch.flash(0.5 + str * 0.5); if (str > 0.55) glitch.kick(0.1 + str * 0.25); pulseShards(str); emit('beat:low', str); }
  else { glitch.kick(0.03 + str * 0.05); tickShards(str); emit('beat:high', str); }
});

/* ---------- adaptive quality: if frames get slow, quietly lower the load ---------- */
let slow = 0, fast = 0, frameN = 0;
function adapt(dt) {
  if (S.gated || document.hidden) return;
  if (dt > 0.032) { slow++; fast = 0; } else { fast++; slow = Math.max(0, slow - 1); }
  if (slow > 70 && S.q > 0.5) { S.q = S.q > 0.8 ? 0.7 : 0.5; slow = 0; bg.resize(); }
}

/* ---------- main loop ---------- */
let last = performance.now();
function frame(ms) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ms - last) / 1000); last = ms;
  S.t = ms / 1000; S.dt = dt; frameN++;
  adapt(dt);
  engine.update(dt, Player.state.playing);
  glitch.update(dt); mood.update(dt); world.updatePalette(); input.update(dt);
  router.runFrames(dt); pw.update();
  bg.draw(dt);
}
requestAnimationFrame(frame);
window.RDWEEB = { S, Player, settings, router, bot };
