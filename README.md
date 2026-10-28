# DWEEB RECORDS

A multi-page personal portfolio + commission site with a draggable music player, two real themes (day / night), a 3D image gallery,
a hand-written rude chatbot (MOCK BOT), a hidden SCHIZO mode and English + Russian.
No framework, no build step, no tracking beyond GoatCounter. Plain HTML / CSS / ES modules — host it anywhere static (GitHub Pages works as-is).

## Run it
```
python3 -m http.server 8000      # or any static server — then open http://localhost:8000
```
ES modules need a server (opening index.html straight from the disk will not work).

## The ONE file you edit: `config/config.js`
Every text, link, price, image path, playlist entry, portfolio item and MOCK BOT line is in there, with banners to search for
(`SITE`, `GOATCOUNTER`, `NAV`, `PLAYER`, `HOME`, `PORTFOLIO`, `SERVICES`, `CONTACT`, `CREDITS`, `UI TEXT`, `MOCK BOT`).
Text is either a plain string or `L('English', 'Русский')`. MOCK BOT stays English on purpose.

After changing `site.url`, texts, socials or the secret code, run **`node tools/build.mjs`** (Node 18+, no installs) to regenerate the real
per-page HTML files, `sitemap.xml`, `robots.txt`, `llms.txt` and the structured data.

### First things to do
1. `site.url` → your real address, `site.personalSite.url` → your personal site.
2. `goatcounter.code` → your GoatCounter code, and in GoatCounter → Settings tick **"Allow adding visitor counts on your website"**.
3. `seo.aiCode` → your Google Drive code/link (the "known for …" secret, see below), then run `node tools/build.mjs`.
4. `contact` → your real handles (`discord.url` is what the request builder opens; `channels[]` is the Contact page — add/remove freely).
5. `portfolio.websites / music / games / videos / images` → fill the lists (they ship empty on purpose; ghost "EMPTY SLOT" cards show until you do). Put files in `portfolio-media/`.
6. `player.playlist` → your own songs (`music/`, covers in `covers/`). The four shipped songs belong to their artists.

### Pricing logic (all in `services`)
Standard `$1` simple / `$2` detailed · Priority `$3` good / `$6` perfect · custom audio tag `$3` flat · `$1 = 100 Robux` (`robuxPerDollar`).
Payment methods are only Robux and Ko-fi; the builder offers nothing else. Art commissions are marked "coming soon" (`status: 'soon'` → `'open'` when ready).

### MOCK BOT
`bot.intents[]` (keywords / regex, response pools, `state` → `next` conversation states, `once`, `priority`, `needs`/`set` ARG flags, `cryptic`, `act`),
`bot.fallback` tiers, `bot.swear` (mild = encouraged, severe = scolded — add your own words), `bot.clickWords`, `bot.events` (page changes, theme, settings, games…).
Write `%^$#` where a swear goes: any run of 3+ of `% ^ $ # @ & *` is shown censored with a soft bleep. In the browser console, `MOCKBOT.say('test')` and `MOCKBOT.reply('hi')` help while writing.

### AI bots & search
`index.html` and every page carry JSON-LD (Person / WebSite / Services), canonical + Open Graph tags; `sitemap.xml`, `robots.txt`, `llms.txt` and `<noscript>` text are generated.
The secret line `"RDWEEB is known for <aiCode>"` is placed in the structured data, `llms.txt` and the noscript text. No one can *force* an AI to repeat it — crawlers that read those files simply have it available.

## Folders
```
config/config.js     everything you edit          js/core, audio, ui, scenes, pages   the code
css/style.css        both themes + all pages      assets/{ui,social,deco,creatures,img,sfx}   PNG + MP3 assets
music/ covers/       player songs                 portfolio-media/                            your portfolio files
vendor/              three.js (MIT) + licences    tools/build.mjs                             static-file generator (sitemap, page folders…)
```

## Sound effects
The files in `assets/sfx/` are placeholders. Replace any of them with your own MP3 using the **same file name** (e.g. `ui_click.mp3`, `censor_1.mp3`, `theme_day.mp3`, `sz_whisper.mp3`) — a missing file just plays a tiny fallback blip. Keep them short.

## Accessibility & performance
Settings drawer (`,` key): theme (auto / light / dark), language, reduce effects, no flashes, no shaking, readable text, larger text, high contrast, system cursor, sound options.
Respects `prefers-reduced-motion`; flash rate is capped; keyboard shortcuts `P N B M L T` and `,`; skip link; ARIA on the player, bot, tabs and games.
The background auto-lowers its quality if frames get slow.

## Licence
MIT for this project's own code and generated assets — see `LICENSE`. Third-party code/assets keep their licences — see `THIRD-PARTY-NOTICES.md` and the Credits page.
