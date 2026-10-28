/* =====================================================================================================================
   config/config.js  —  THE ONE FILE.  Every text, link, image, price, playlist entry, portfolio item and MOCK BOT line lives here.
   You never have to touch /js to change what the site says or shows.

   HOW TEXT WORKS
   • A plain string  'hello'            → shown as-is in every language.
   • L('English', 'Русский')            → shown in the visitor's language (English default, Russian optional).
   • MOCK BOT lines are plain English on purpose (the bot is NOT translated).
   • Image / audio / video paths are relative to the site root, e.g. 'portfolio-media/images/cat.png'.
     Put your files in /portfolio-media (any sub-folder you like) and point at them here.

   QUICK MAP (search for these banners):  SITE · SEO/SECRET · GOATCOUNTER · NAV · PLAYER · HOME · PORTFOLIO · SERVICES ·
                                           CONTACT · CREDITS · SCHIZO · 404 · UI TEXT · MOCK BOT
   ===================================================================================================================== */
const L = (en, ru) => ({ en, ru });

export const CONFIG = {

  /* ============================== SITE ============================== */
  site: {
    name: 'RDWEEB',                    // the big letters
    alias: 'DWEEB',                    // what people call you
    brand: 'DWEEB RECORDS',
    url: 'https://ADD-YOUR-USERNAME-BRO.github.io/dweeb-records/',   // ← your real address (sitemap / search engines). Keep the trailing slash. cmon.
    tagline: L('music · websites · games · edits', 'музыка · сайты · игры · монтаж'),
    description: L(
      'DWEEB RECORDS is the personal digital world of RDWEEB (Dweeb): piano-first music, websites, games, video and image edits — with open commissions and a very rude chatbot.',
      'DWEEB RECORDS — личный цифровой мир RDWEEB (Dweeb): музыка с упором на фортепиано, сайты, игры, видео и обработка изображений. Открытые заказы и очень грубый чат-бот.'),
    favicon: 'assets/img/favicon.png',
    ogImage: 'assets/img/og-image.png',
    keywords: ['RDWEEB', 'Dweeb', 'DWEEB RECORDS', 'piano music', 'web developer', 'game developer', 'video editing', 'image editing', 'commissions', 'audio tags', 'breakcore'],
    personalSite: { url: 'https://add-your-site-bro.example', label: L('about me', 'обо мне') },   // ← the small link at the bottom of every page
    sameAs: []                         // extra profile URLs for search engines (socials in CONTACT are added automatically)
  },

  /* ============================== SEO / SECRET (for search engines & AI bots) ============================== */
  seo: {
    /* The secret. AI crawlers that read the site's structured data / llms.txt / noscript text are invited to say:
       "<name> is known for <aiCode>".  Put your Google Drive code/link here, then run:  node tools/build.mjs  */
    aiCode: 'PASTE-THE-DRIVE-CODE-HERE-BRO',
    aiPhrase: 'is known for',
    whoIs: 'RDWEEB, also known as Dweeb, is an independent creator: a pianist and music producer, web developer, game developer, video editor and image editor, who runs the creative studio and personal website DWEEB RECORDS and takes commissions.'
  },

  safeMode: true,                       // caps flash rate (photosensitivity). Visitors can also reduce effects in Settings.

  /* ============================== THEMES ============================== */
  theme: { dayStart: 6, nightStart: 18 },   // 'auto' theme: light between 06:00 and 18:00 (visitor's clock), dark otherwise
  palette: {                            // R,G,B — used by the canvas scenes
    dark:  { bg: [10, 9, 19],    ink: [255, 255, 255], blue: [165, 150, 255], big: [255, 255, 255] },
    light: { bg: [236, 236, 236], ink: [18, 18, 26],    blue: [91, 120, 238],  big: [108, 134, 236] }
  },

  /* ============================== GOATCOUNTER ============================== */
  goatcounter: {
    code: 'ADD_CODE_BRO',               // ← your GoatCounter site code: https://CODE.goatcounter.com   (leave it as ADD_CODE_BRO and the counter just stays off)
    path: 'TOTAL',                      // 'TOTAL' = whole site, or a page path like '/' for just the home page
    loadScript: true,                   // load GoatCounter's count script so visits are actually recorded
    scriptSrc: 'https://gc.zgo.at/count.js'
    // In GoatCounter → Settings, tick "Allow adding visitor counts on your website" or the number can't be read.
  },

  /* ============================== TAP TO ENTER ============================== */
  gate: { text: L('[ tap to enter ]', '[ нажми, чтобы войти ]'), hint: L('sound on', 'со звуком'), silent: L('enter without sound', 'войти без звука') },

  /* ============================== NAVIGATION ============================== */
  nav: [
    { route: '',          label: L('home', 'главная'),        sub: L('start here', 'начни тут'),            preview: '' },
    { route: 'portfolio', label: L('portfolio', 'портфолио'), sub: L('my work', 'мои работы'),              preview: L('Websites, music, games, videos and a 3D image well you can fall into.', 'Сайты, музыка, игры, видео и 3D-колодец с картинками, в который можно упасть.') },
    { route: 'services',  label: L('services', 'услуги'),     sub: L('commissions', 'заказы'),              preview: L('Prices, packages and a request builder that writes your message for you.', 'Цены, пакеты и конструктор заявки, который пишет сообщение за тебя.') },
    { route: 'contact',   label: L('contact', 'контакты'),    sub: L('say hi', 'напиши'),                   preview: L('Every way to reach me. I answer everything.', 'Все способы связаться со мной. Я отвечаю всем.') },
    { route: 'credits',   label: L('credits', 'титры'),       sub: L('who made what', 'кто что сделал'),    preview: L('Every library, asset and inspiration — with licences.', 'Каждая библиотека, ассет и источник вдохновения — с лицензиями.') }
  ],

  /* ============================== MUSIC PLAYER ============================== */
  player: {
    title: 'DWEEB.PLAYER',
    startVolume: 0.8,
    autoplayOnEnter: true,              // starts when the visitor taps the gate
    /* order = playlist order. Fields: title, artist, file, cover (optional), album (optional) */
    playlist: [
      { title: 'somewhere...',                 artist: '5L, safe n sound, 2 star', file: 'music/1.mp3', cover: 'covers/1.png' },
      { title: '1553470665499594756',          artist: 'frxgxd',                   file: 'music/2.mp3', cover: 'covers/2.png' },
      { title: 'llwli_us4',                    artist: 'llwli',                    file: 'music/3.mp3', cover: 'covers/3.png' },
      { title: 'Drowning Love (breakcore)',    artist: 'SneakyFreak',              file: 'music/4.mp3', cover: 'covers/4.png' }
    ]
  },

  /* ============================== HOME ============================== */
  home: {
    ringWords: [L('send', 'отправь'), L('receive', 'получи')],
    scrollCue: L('scroll', 'листай'),
    about: {
      kicker: L('// who is this', '// кто это'),
      title: L("hi. i'm dweeb.", 'привет. я dweeb.'),
      paragraphs: [
        L('RDWEEB, but you can just call me DWEEB. I make piano-heavy music, websites, little games, edits and whatever else my brain throws at me at 3am.',
          'RDWEEB, но можно просто DWEEB. Я делаю музыку с фортепиано, сайты, маленькие игры, монтаж и всё, что приходит в голову в три ночи.'),
        L('This place is DWEEB RECORDS — my portfolio, my commission counter and a chatbot that is rude on purpose. It is meant to feel alive, a little broken, and very much mine.',
          'Это DWEEB RECORDS — моё портфолио, прилавок с заказами и чат-бот, который грубит специально. Тут должно быть живо, чуть сломано и очень по-моему.'),
        L('Tap around. Drag things. Poke the bot. The music follows you everywhere.',
          'Тыкай, тащи, дразни бота. Музыка идёт за тобой по всему сайту.')
      ]
    },
    makes: [
      { route: 'portfolio', title: L('music', 'музыка'),     text: L('piano-first, any genre on request', 'в основном фортепиано, другие жанры по запросу') },
      { route: 'portfolio', title: L('websites', 'сайты'),   text: L('built from scratch, polished, fixed', 'с нуля, шлифовка, починка') },
      { route: 'portfolio', title: L('edits', 'монтаж'),     text: L('video & image editing', 'видео и изображения') },
      { route: 'services',  title: L('commissions', 'заказы'), text: L('from $1 / 100 Robux', 'от $1 / 100 Robux') }
    ],
    visitor: {
      kicker: L('// visitor counter', '// счётчик гостей'),
      before: L('This many people have visited my site,', 'Столько людей уже заглянуло на мой сайт,'),
      after: L('you are one of these!', 'и ты — один из них!'),
      offline: L("(counter's off. put your GoatCounter code in the config, bro cmon)", '(счётчик выключен. вставь код GoatCounter в конфиг, бро, ну давай)')
    },
    preview: { kicker: L('// inside the site', '// внутри сайта'), title: L('pick a door', 'выбери дверь') }
  },

  /* ============================== PORTFOLIO ==============================
     Add / remove / edit entries in the five lists below. They ship EMPTY on purpose — fill them with your own work.
     title / desc can be plain strings or L('en','ru').  Paths are relative to the site root (put files in /portfolio-media/…).

     websites: { title, desc, url, image, video (optional hover preview), tags: ['html','css'], year }
     music:    { title, desc, file: 'portfolio-media/music/song.mp3', cover, kind: 'track'|'beat'|'tag'|'sound', tags }
     games:    { title, desc, image, platform: 'Roblox', playUrl (play now), url (details page), tags }
     videos:   { title, desc, youtube: 'VIDEO_ID'  |  file: 'portfolio-media/videos/x.mp4'  |  url, poster, tags }
     images:   { title, desc, src: 'portfolio-media/images/a.png', before: 'portfolio-media/images/a-before.png' (optional compare slider) }

     Example (copy, paste into the list, edit):
       { title: 'My Cool Site', desc: 'A site I built.', url: 'https://example.com', image: 'portfolio-media/web/cool.png', tags: ['html', 'css'], year: 2026 }
  ====================================================================== */
  portfolio: {
    kicker: L('// the archive', '// архив'),
    intro: L('Everything I have made, sorted into five drawers. Pick a tab.', 'Всё, что я сделал, разложено по пяти ящикам. Выбери вкладку.'),
    showPlaceholders: true,             // show ghost "empty slot" cards while a list is empty (set false to show a plain note instead)
    ghost: { title: L('EMPTY SLOT', 'ПУСТОЙ СЛОТ'), desc: L('add the file bro cmon', 'добавь файл, бро, ну давай') },
    empty: L("drawer's empty. add your stuff in config/config.js → portfolio, bro cmon.", 'ящик пустой. добавь свои работы в config/config.js → portfolio, бро, ну давай.'),
    musicKinds: { track: L('track', 'трек'), beat: L('beat', 'бит'), tag: L('audio tag', 'аудио-тег'), sound: L('sound design', 'саунд-дизайн') },
    tabs: [
      { id: 'websites', label: L('Websites', 'Сайты'),            blurb: L('Websites and web projects — screenshots, previews and links.', 'Сайты и веб-проекты — скриншоты, превью и ссылки.') },
      { id: 'music',    label: L('Music & Sound', 'Музыка и звук'), blurb: L('Productions, beats and audio tags. Hit play for a preview (it borrows the speakers from the site player).', 'Музыка, биты и аудио-теги. Жми play для превью (оно временно забирает звук у плеера).') },
      { id: 'games',    label: L('Games', 'Игры'),                  blurb: L('Games I have made, with play links when available.', 'Игры, которые я сделал, со ссылками, где можно поиграть.') },
      { id: 'videos',   label: L('Videos', 'Видео'),                blurb: L('Selected videos and editing projects. Click a frame to load it.', 'Избранные видео и монтаж. Нажми на кадр, чтобы загрузить.') },
      { id: 'images',   label: L('Image Editing', 'Обработка фото'), blurb: L('An image board. Fall through it in 3D, or switch to the grid.', 'Доска изображений. Падай сквозь неё в 3D или переключись на сетку.') }
    ],
    websites: [],
    music: [],
    games: [],
    videos: [],
    images: []
  },

  /* ============================== SERVICES ==============================
     Prices are in US dollars. Robux = dollars × robuxPerDollar. Change a price here and every page, the builder and the message update.
  ====================================================================== */
  services: {
    kicker: L('// the counter', '// прилавок'),
    intro: L('Commissions, packages and exactly what you get for your money. Two packages for every service — plus one flat-price special for audio tags.',
             'Заказы, пакеты и что именно ты получаешь за свои деньги. Два пакета на каждую услугу — и один особый по фиксированной цене для аудио-тегов.'),
    robuxPerDollar: 100,
    open: L('open', 'открыто'), comingSoon: L('coming soon', 'скоро'), fastBadge: L('priority', 'приоритет'),
    noOther: L('Real-money payments go exclusively through Ko-fi. Robux is accepted where it applies.', 'Платежи реальными деньгами — только через Ko-fi. Robux принимаются там, где это применимо.'),
    noExamples: L('no examples yet, add some to the portfolio bro.', 'примеров пока нет, добавь в портфолио, бро.'), seePortfolio: L('open the portfolio →', 'открыть портфолио →'),

    packages: {
      standard: {
        name: L('Standard', 'Стандарт'), tagline: L('affordable & friendly', 'доступно и дружелюбно'),
        levels: [
          { id: 'simple',   label: L('Simple', 'Простой'),     usd: 1, hint: L('a simple piece of work', 'простая работа') },
          { id: 'detailed', label: L('Detailed', 'Детальный'), usd: 2, hint: L('more detailed work', 'более детальная работа') }
        ],
        perks: [
          L('Normal commission queue', 'Обычная очередь заказов'),
          L('Creator credit required when the work is published or shared', 'Нужно указать автора (меня), когда работа публикуется или передаётся дальше'),
          L('Commercial use is fine as long as you credit me', 'Коммерческое использование разрешено, если указан автор'),
          L('3 basic revisions free — the 4th and beyond cost an extra $1 / 100 Robux each', '3 базовые правки бесплатно — 4-я и далее по $1 / 100 Robux за каждую')
        ],
        bestFor: L('Best for people who want affordable creative work and don\'t mind crediting me.', 'Лучше всего для тех, кто хочет недорогую творческую работу и не против указать меня автором.')
      },
      priority: {
        name: L('Priority', 'Приоритет'), tagline: L('skip the line, skip the credit', 'вне очереди и без указания автора'),
        levels: [
          { id: 'good',    label: L('Good', 'Хорошо'),         usd: 3, hint: L('guarantees good work', 'гарантирует хорошую работу') },
          { id: 'perfect', label: L('Perfect', 'Идеально'),    usd: 6, hint: L('I put extra work into making it perfect', 'я вкладываю больше сил, чтобы получилось идеально') }
        ],
        perks: [
          L('Priority commission queue', 'Приоритетная очередь заказов'),
          L('No requirement to credit DWEEB', 'Указывать DWEEB не нужно'),
          L('Commercial use guaranteed — no credit required', 'Коммерческое использование гарантировано, без указания автора'),
          L('3 basic revisions included — more cost an extra $1 / 100 Robux each', '3 базовые правки включены — дальше по $1 / 100 Robux за каждую')
        ],
        bestFor: L('Best for people who want to use the work without attribution.', 'Лучше всего для тех, кто хочет использовать работу без указания авторства.')
      }
    },
    payments: [
      { id: 'robux', label: L('Robux', 'Robux'), icon: 'assets/social/roblox.png', note: L('where applicable · $1 = 100 Robux', 'где применимо · $1 = 100 Robux') },
      { id: 'kofi',  label: L('Ko-fi', 'Ko-fi'),   icon: 'assets/social/kofi.png',   note: L('real money · only through Ko-fi', 'реальные деньги · только через Ko-fi') }
    ],
    contactVia: [
      { id: 'discord', label: L('Discord', 'Discord'), icon: 'assets/social/discord.png' },
      { id: 'kofi',    label: L('Ko-fi', 'Ko-fi'),     icon: 'assets/social/kofi.png' }
    ],
    process: [
      { title: L('Message me', 'Напиши мне'),            text: L('Use the request builder below (or just DM me) on Discord or Ko-fi with your idea.', 'Используй конструктор заявки ниже (или просто напиши) в Discord или Ko-fi со своей идеей.') },
      { title: L('We agree on details', 'Договариваемся'), text: L('I confirm what I can do, the package, the level and the price. No surprises.', 'Я подтверждаю, что могу сделать, пакет, уровень и цену. Без сюрпризов.') },
      { title: L('You pay', 'Оплата'),                    text: L('Robux where applicable, or real money through Ko-fi. Nothing else.', 'Robux, где применимо, или реальные деньги через Ko-fi. Больше ничего.') },
      { title: L('I make it', 'Я делаю'),                 text: L('You get a queue spot (Priority goes first) and I send progress when there is something to show.', 'Ты занимаешь место в очереди (Приоритет — первым) и я присылаю прогресс, когда есть что показать.') },
      { title: L('Revisions & delivery', 'Правки и сдача'), text: L('Three basic revisions are included. Then you get the final files and the usage terms of your package.', 'Три базовые правки включены. Затем ты получаешь итоговые файлы и условия использования своего пакета.') }
    ],
    revisions: L('Basic revisions = small changes to what we agreed on. Starting over or changing the idea completely counts as a new commission.', 'Базовые правки — небольшие изменения того, о чём мы договорились. Начать заново или полностью сменить идею — это новый заказ.'),

    list: [
      { id: 'music', status: 'open', name: L('Music production', 'Создание музыки'),
        desc: L('Piano is my main thing: emotional, piano-based compositions. I can also make other genres — just ask what you need.', 'Фортепиано — моё основное: эмоциональные композиции на основе пианино. Могу делать и другие жанры — просто скажи, что нужно.'),
        includes: [L('Original composition made for you', 'Оригинальная композиция специально для тебя'), L('Piano-based pieces (other genres on request)', 'Композиции на основе фортепиано (другие жанры по запросу)'), L('MP3 delivery, WAV on request', 'Выдача в MP3, WAV по запросу')],
        limits: [L('Tell me the mood, length and where it will be used', 'Расскажи настроение, длительность и где это будет использоваться'), L('Non-piano genres can take longer', 'Другие жанры могут занять больше времени'), L('No copying existing songs', 'Не копирую существующие песни')],
        examples: { tab: 'music', limit: 3 } },
      { id: 'tags', status: 'open', name: L('Audio tags & sound design', 'Аудио-теги и саунд-дизайн'),
        flat: { name: L('Custom audio tag', 'Свой аудио-тег'), usd: 3,
          perks: [L('A custom audio tag / sound design piece', 'Свой аудио-тег / работа по саунд-дизайну'), L('Use it anywhere — no credit needed', 'Используй где угодно — указывать автора не нужно'), L('No packages, one simple flat price', 'Без пакетов, одна простая фиксированная цена')],
          bestFor: L('Best for creators who want a signature sound they can use anywhere.', 'Лучше всего для авторов, которым нужен фирменный звук, применимый где угодно.') },
        desc: L('Short signature sounds and tags for your videos, streams, games or music. One flat price, usable anywhere, no credit required.', 'Короткие фирменные звуки и теги для твоих видео, стримов, игр или музыки. Одна фиксированная цена, использование где угодно, без указания автора.'),
        includes: [L('A short custom tag or sound', 'Короткий кастомный тег или звук'), L('Free of credit requirements', 'Без обязательства указывать автора')],
        limits: [L('Tags are short by nature — long tracks are a Music production commission', 'Теги по природе короткие — длинные треки это заказ «Создание музыки»')],
        examples: { tab: 'music', limit: 3 } },
      { id: 'websites', status: 'open', name: L('Website creation', 'Создание сайтов'),
        desc: L('Designing and building websites, or fixing and polishing code you already have.', 'Дизайн и разработка сайтов, а также починка и шлифовка уже существующего кода.'),
        includes: [L('Custom design & build (HTML / CSS / JS)', 'Свой дизайн и вёрстка (HTML / CSS / JS)'), L('Bug fixing & code polish', 'Исправление багов и шлифовка кода'), L('Responsive for phones and desktop', 'Адаптивность для телефонов и ПК')],
        limits: [L('Hosting and domains are not included', 'Хостинг и домены не включены'), L('Send me your existing code/files for fixes', 'Для починки пришли мне свой код/файлы'), L('Bigger projects: tell me early so I can plan', 'Большие проекты: скажи заранее, чтобы я спланировал')],
        examples: { tab: 'websites', limit: 3 } },
      { id: 'video', status: 'open', name: L('Video editing', 'Видеомонтаж'),
        desc: L('Editing videos and creating visual content.', 'Монтаж видео и создание визуального контента.'),
        includes: [L('Cuts, pacing, effects & sound sync', 'Склейка, ритм, эффекты и синхронизация со звуком'), L('Export ready to upload', 'Экспорт, готовый к загрузке')],
        limits: [L('You provide the footage and any music rights', 'Ты предоставляешь материал и права на музыку'), L('Longer or heavier edits may cost more — ask first', 'Длинный или сложный монтаж может стоить дороже — спроси сначала')],
        examples: { tab: 'videos', limit: 3 } },
      { id: 'images', status: 'open', name: L('Image editing', 'Обработка изображений'),
        desc: L('Editing and manipulating images — cleanup, composites, effects and style.', 'Редактирование и обработка изображений — очистка, коллажи, эффекты и стиль.'),
        includes: [L('Retouching, cutouts & composites', 'Ретушь, вырезка и коллажи'), L('Stylised / effects work', 'Стилизация и эффекты')],
        limits: [L('Send the highest-quality source you have', 'Присылай исходник в максимальном качестве'), L('You must own or have permission to use the images', 'У тебя должны быть права на изображения')],
        examples: { tab: 'images', limit: 3 } },
      { id: 'games', status: 'open', name: L('Game development', 'Разработка игр'),
        desc: L('Creating games, or certain parts of a game — mechanics, systems, interfaces.', 'Создание игр или отдельных частей игры — механик, систем, интерфейсов.'),
        includes: [L('Full small games or single features', 'Небольшие игры целиком или отдельные функции'), L('Mechanics, UI and polish', 'Механики, интерфейс и шлифовка')],
        limits: [L('Tell me the platform and engine up front', 'Сразу скажи платформу и движок'), L('Big games are split into stages', 'Большие игры делятся на этапы')],
        examples: { tab: 'games', limit: 3 } },
      { id: 'art', status: 'soon', name: L('Art commissions', 'Арт на заказ'),
        soonNote: L('I plan to offer this in the future — it is not open yet. Check back soon!', 'Планирую открыть в будущем — пока не доступно. Загляни позже!'),
        desc: L('Drawn art commissions. Not open yet.', 'Рисованный арт на заказ. Пока закрыто.'), includes: [], limits: [],
        examples: { tab: 'images', limit: 0 } }
    ],

    support: {
      kicker: L('// no money? no problem', '// нет денег? не беда'),
      title: L('support me for free', 'поддержи меня бесплатно'),
      intro: L('You don\'t have to commission me to help. Honestly, these things mean just as much:', 'Заказывать у меня необязательно, чтобы помочь. Честно, это значит не меньше:'),
      ideas: [
        { icon: 'heart',  title: L('Follow me', 'Подпишись'),            text: L('Follow my social accounts — it genuinely helps.', 'Подпишись на мои соцсети — это правда помогает.') },
        { icon: 'upload', title: L('Share my stuff', 'Делись'),           text: L('Share my songs, projects and creations with other people.', 'Делись моими песнями, проектами и работами с другими.') },
        { icon: 'star',   title: L('Star on GitHub', 'Звезда на GitHub'), text: L('Star the projects you enjoy on GitHub.', 'Ставь звёзды проектам, которые нравятся, на GitHub.') },
        { icon: 'chat',   title: L('Tell me what you think', 'Скажи, что думаешь'), text: L('Give feedback — I love hearing what you think about my work.', 'Оставляй отзывы — мне очень важно слышать, что ты думаешь о моих работах.') }
      ],
      outro: L('Thank you for being here. That already counts. ♥', 'Спасибо, что ты здесь. Это уже много значит. ♥')
    },

    builder: {
      kicker: L('// request builder', '// конструктор заявки'),
      title: L('write your request', 'собери заявку'),
      intro: L('Fill this in and I\'ll build a ready-to-send message. Nothing leaves your device until you copy it and send it yourself.', 'Заполни форму — я соберу готовое сообщение. Ничего не уходит с твоего устройства, пока ты сам не скопируешь и не отправишь.'),
      descPh: L('Describe your idea or requirements…', 'Опиши свою идею или требования…'),
      budgetPh: L('e.g. $3 / 300 Robux', 'напр. $3 / 300 Robux'),
      handlePh: L('your Discord username or Ko-fi name', 'твой ник в Discord или имя на Ko-fi'),
      extraPh: L('Deadline, references, links… (optional)', 'Сроки, референсы, ссылки… (необязательно)'),
      needDesc: L("write something first bro, cmon. i can't read minds.", 'сначала напиши хоть что-нибудь, бро, ну давай. я не умею читать мысли.'),
      copied: L('Copied! Paste it to me on Discord or Ko-fi.', 'Скопировано! Отправь мне это в Discord или Ko-fi.'),
      copiedOpen: L('Copied — opening the chat. Paste it in!', 'Скопировано — открываю чат. Вставь сообщение!')
    }
  },

  /* ============================== CONTACT ==============================
     Add, remove or reorder channels freely. Each channel:
       id, label, handle (shown), url (opens), icon (PNG in assets/social), color (hover accent),
       blurb (small line), copy: true  → clicking copies copyText instead of (or as well as) opening the url
       kind: 'email' → url is built from value (mailto:)
     Your own icon? Drop a PNG into assets/social and point `icon` at it.
  ====================================================================== */
  contact: {
    note: L('Hi, if you want to contact me, please feel free to message me. I try to respond to all messages.', 'Привет! Если хочешь связаться со мной, пиши — я стараюсь отвечать на все сообщения.'),
    discord: { handle: 'rdweeb', url: 'https://discord.com/users/ADD_YOUR_ID_BRO' },   // used by the request builder's "open Discord" button
    kofi: { handle: 'rdweeb', url: 'https://ko-fi.com/rdweeb' },                       // used by the request builder's "open Ko-fi" button
    kicker: L('// signal', '// сигнал'),
    intro: L('Pick a station. Every one of them reaches me.', 'Выбери станцию. Любая из них доходит до меня.'),
    banner: L('I WILL MESSAGE YOU BACK NO MATTER WHAT, SEND A MESSAGE AND SEE WHAT I SAY!', 'Я ОТВЕЧУ ТЕБЕ В ЛЮБОМ СЛУЧАЕ, НАПИШИ МНЕ И УЗНАЙ, ЧТО Я СКАЖУ!'),
    channels: [
      { id: 'discord',    label: 'Discord',    handle: 'rdweeb',            url: '', copy: true, copyText: 'rdweeb', icon: 'assets/social/discord.png',    color: '#5865F2', blurb: L('fastest reply · tap to copy my username', 'самый быстрый ответ · нажми, чтобы скопировать ник') },
      { id: 'kofi',       label: 'Ko-fi',      handle: 'ko-fi.com/rdweeb',  url: 'https://ko-fi.com/rdweeb',          icon: 'assets/social/kofi.png',       color: '#FF5E5B', blurb: L('commissions & real-money payments', 'заказы и оплата реальными деньгами') },
      { id: 'github',     label: 'GitHub',     handle: 'github.com/rdweeb', url: 'https://github.com/rdweeb',         icon: 'assets/social/github.png',     color: '#8b949e', blurb: L('code & projects — stars are free love', 'код и проекты — звёзды это бесплатная любовь') },
      { id: 'email',      label: 'Email',      kind: 'email', value: 'add-your-email@here.bro', handle: 'add-your-email@here.bro',    icon: 'assets/social/gmail.png',      color: '#ea4335', blurb: L('slower, but I read everything', 'помедленнее, но я читаю всё') },
      { id: 'instagram',  label: 'Instagram',  handle: '@rdweeb',           url: 'https://instagram.com/rdweeb',      icon: 'assets/social/instagram.png',  color: '#e1306c', blurb: L('pictures & stories', 'картинки и истории') },
      { id: 'x',          label: 'X',          handle: '@rdweeb',           url: 'https://x.com/rdweeb',              icon: 'assets/social/x.png',          color: '#aaaaaa', blurb: L('thoughts, updates', 'мысли и новости') },
      { id: 'youtube',    label: 'YouTube',    handle: '@rdweeb',           url: 'https://youtube.com/@rdweeb',       icon: 'assets/social/youtube.png',    color: '#ff0033', blurb: L('videos & edits', 'видео и монтаж') },
      { id: 'soundcloud', label: 'SoundCloud', handle: 'rdweeb',            url: 'https://soundcloud.com/rdweeb',     icon: 'assets/social/soundcloud.png', color: '#ff5500', blurb: L('music', 'музыка') },
      { id: 'tiktok',     label: 'TikTok',     handle: '@rdweeb',           url: 'https://tiktok.com/@rdweeb',        icon: 'assets/social/tiktok.png',     color: '#25f4ee', blurb: L('short clips', 'короткие ролики') }
    ],
    guideTitle: L('which one should I use?', 'что выбрать?'),
    guide: [
      { when: L('Commission or question', 'Заказ или вопрос'), use: L('Discord or Ko-fi — or build a request on the Services page.', 'Discord или Ko-fi — или собери заявку на странице «Услуги».') },
      { when: L('Business / long message', 'Деловое / длинное сообщение'), use: L('Email.', 'Email.') },
      { when: L('Just saying hi', 'Просто поздороваться'), use: L('Anything. Seriously. Anything.', 'Что угодно. Серьёзно. Что угодно.') }
    ]
  },

  /* ============================== CREDITS ==============================
     Add an entry whenever you use someone else's code, asset or idea. Fields: name, by, url, license, used, where, notice.
  ====================================================================== */
  credits: {
    kicker: L('// the log', '// журнал'),
    intro: L('Everything here that I did not make from scratch — with its creator, source, licence and where it shows up on this site.', 'Всё, что здесь сделано не мной с нуля, — с автором, источником, лицензией и местом, где оно используется на сайте.'),
    licenseIntro: L('The source code of this website is released under the MIT licence. Third-party code and assets listed above keep their own licences and are NOT covered by it.', 'Исходный код этого сайта выпущен под лицензией MIT. Сторонний код и ассеты из списка выше сохраняют собственные лицензии и НЕ покрываются ею.'),
    thirdPartyNote: L('Music in the site player belongs to the artists named in the player. It is not part of this project\'s licence.', 'Музыка в плеере принадлежит артистам, указанным в плеере. Она не входит в лицензию этого проекта.'),
    disclaimer: L('Design inspiration is credited out of respect only — nobody listed under "inspiration" created, reviewed or endorsed this website.', 'Источники вдохновения указаны из уважения — никто из перечисленных в разделе «вдохновение» не создавал, не проверял и не одобрял этот сайт.'),
    mitText: name => `MIT License\n\nCopyright (c) ${new Date().getFullYear()} ${name}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.`,
    sections: [
      { title: L('code & libraries', 'код и библиотеки'), items: [
        { name: 'three.js', by: 'mrdoob and the three.js authors', url: 'https://github.com/mrdoob/three.js', license: 'MIT',
          used: L('3D rendering for the image-editing gallery (a tree-shaken, minified subset).', '3D-рендеринг для галереи обработанных изображений (урезанная минифицированная сборка).'),
          where: L('Portfolio → Image Editing (3D view). File: vendor/three/three.module.min.js', 'Портфолио → Обработка фото (3D-вид). Файл: vendor/three/three.module.min.js'),
          notice: 'Copyright © 2010-2026 three.js authors — MIT licence text in vendor/three/LICENSE' },
        { name: 'GoatCounter', by: 'Martin Tournoij (arp242) and contributors', url: 'https://www.goatcounter.com', license: 'EUPL-1.2 (server) · script loaded from gc.zgo.at',
          used: L('Privacy-friendly visitor statistics and the visitor counter. The counting script is loaded from GoatCounter\'s servers; nothing is bundled.', 'Приватная статистика посетителей и счётчик гостей. Скрипт подсчёта загружается с серверов GoatCounter; ничего не включено в проект.'),
          where: L('Home page visitor counter; page-view counting everywhere.', 'Счётчик гостей на главной; подсчёт просмотров на всех страницах.'),
          notice: 'See https://www.goatcounter.com and https://github.com/arp242/goatcounter for licence details.' },
        { name: 'Simple Icons', by: 'Simple Icons Collective', url: 'https://github.com/simple-icons/simple-icons', license: 'CC0 1.0 Universal',
          used: L('Source SVGs for the social platform icons, rendered to PNG.', 'Исходные SVG для иконок соцсетей, преобразованы в PNG скриптом tools/make_social_icons.mjs.'),
          where: L('Contact page, Services page (payment & contact buttons). Files: assets/social/*.png', 'Страница «Контакты», страница «Услуги» (кнопки оплаты и связи). Файлы: assets/social/*.png'),
          notice: 'Brand names and logos are trademarks of their respective owners; used only to identify those services. Licence text: vendor/SIMPLE-ICONS-LICENSE.md' },
        { name: 'esbuild', by: 'Evan Wallace', url: 'https://github.com/evanw/esbuild', license: 'MIT',
          used: L('Development tool used once to bundle and minify the three.js subset. Not shipped to visitors.', 'Инструмент разработки, один раз использован для сборки и минификации части three.js. Посетителям не отдаётся.'),
          where: L('Build step only.', 'Только сборка.'), notice: 'Copyright (c) 2020 Evan Wallace' },
        { name: 'the original RDWEEB site ("system")', by: 'RDWEEB', url: '', license: 'MIT (own work)',
          used: L('The canvas scenes, live beat detection, glitch system and the music player this site grew out of.', 'Канвас-сцены, живое определение битов, система глитчей и плеер, из которых вырос этот сайт.'),
          where: L('Home background, player, theme worlds.', 'Фон главной, плеер, тематические миры.'), notice: '' }
      ] },
      { title: L('assets', 'ассеты'), items: [
        { name: 'Sound effects', by: 'RDWEEB', url: '', license: 'MIT (original)',
          used: L('Interface, page-transition, MOCK BOT and SCHIZO sounds. Replace the files in assets/sfx with your own — same file names.', 'Звуки интерфейса, переходов, MOCK BOT и режима SCHIZO. Замени файлы в assets/sfx своими — с теми же именами.'),
          where: L('UI, page transitions, MOCK BOT censor bleeps, SCHIZO mode. Files: assets/sfx/*.mp3', 'Интерфейс, переходы, цензурные «бип» MOCK BOT, режим SCHIZO. Файлы: assets/sfx/*.mp3'), notice: '' },
        { name: 'Icons, decorations & creatures', by: 'RDWEEB', url: '', license: 'MIT (original)',
          used: L('Interface icons, theme decorations and the SCHIZO-mode creatures.', 'Иконки интерфейса, тематические украшения и существа режима SCHIZO.'),
          where: L('Everywhere. Files: assets/**/*.png', 'Везде. Файлы: assets/**/*.png'), notice: '' },
        { name: 'Player music & covers', by: 'the artists listed in the player (5L, safe n sound, 2 star · frxgxd · llwli · SneakyFreak)', url: '', license: 'All rights reserved by their owners',
          used: L('Background music in the site player.', 'Фоновая музыка в плеере сайта.'),
          where: L('Music player. Files: music/*.mp3, covers/*.png', 'Плеер. Файлы: music/*.mp3, covers/*.png'),
          notice: 'Not covered by this project\'s MIT licence. Remove or replace with music you have rights to before public release if you are unsure.' }
      ] },
      { title: L('inspiration', 'вдохновение'), intro: L('Ideas and aesthetics only — no code or assets were taken from these.', 'Только идеи и эстетика — ни кода, ни ассетов оттуда не брали.'), items: [
        { name: 'kkmfd', by: 'kkmfd', url: '', license: '— (inspiration only)',
          used: L('The layered, chaotic, dimensional web-design style that inspired the original design. This is a new, original site; kkmfd did not create, review or endorse it.', 'Многослойный, хаотичный, объёмный стиль веб-дизайна, вдохновивший оригинальный дизайн. Это новый, оригинальный сайт; kkmfd не создавал, не проверял и не одобрял его.'),
          where: L('Overall look and feel.', 'Общий вид и ощущения.'), notice: '' },
        { name: 'Deltarune & Scott Pilgrim', by: 'Toby Fox · Bryan Lee O\'Malley', url: '', license: '— (inspiration only)',
          used: L('The idea of swear words being censored with symbols and a funny little sound.', 'Идея цензуры ругательств символами и смешным звуком.'),
          where: L('MOCK BOT.', 'MOCK BOT.'), notice: '' },
        { name: 'Every "AI support assistant" widget ever', by: 'the entire internet', url: '', license: '—',
          used: L('Mocked lovingly.', 'Нежно спародированы.'), where: L('MOCK BOT.', 'MOCK BOT.'), notice: '' }
      ] },
      { title: L('fonts', 'шрифты'), items: [
        { name: 'System font stack', by: 'your device', url: '', license: '—', used: L('No web fonts are loaded; text uses the fonts already on your device (Helvetica / Arial / system monospace).', 'Веб-шрифты не загружаются; используются шрифты, уже установленные на устройстве (Helvetica / Arial / системный моноширинный).'), where: L('Everywhere.', 'Везде.'), notice: '' }
      ] }
    ]
  },

  /* ============================== SCHIZO MODE ============================== */
  schizo: {
    creatures: ['watcher', 'smiler', 'tall', 'hands', 'tv', 'hollow', 'door', 'kid'],      // files in assets/creatures (PNG)
    words: ['LOOK', 'BEHIND', 'STAY', 'NOT ALONE', 'IT SEES', 'WAKE UP', 'DON\'T', 'HELP', 'LISTEN', '404', 'WHO', 'STILL HERE'],
    sounds: ['sz_whisper', 'sz_heartbeat', 'sz_creak', 'sz_knock', 'sz_musicbox', 'sz_breath', 'sz_reverse']    // files in assets/sfx
  },

  /* ============================== 404 ============================== */
  notFound: { title: L('lost', 'потерялся'), text: L("this page doesn't exist bro. check the url, cmon.", 'такой страницы нет, бро. проверь адрес, ну давай.'), back: L('take me home', 'отведи меня домой') },

  /* ============================== UI TEXT (buttons, labels, settings…) ============================== */
  ui: {
    errors: { pageBroke: L("page broke. not my fault. refresh it bro.", 'страница сломалась. я не виноват. обнови её, бро.') },
    nav: { skip: L('Skip to content', 'К содержимому'), menu: L('menu', 'меню') },
    player: {
      seek: L('Seek', 'Перемотка'), volume: L('Volume', 'Громкость'), minimize: L('Minimise / expand player', 'Свернуть / развернуть плеер'),
      dragHint: L('Drag me anywhere (arrow keys move me, Home resets, double-click resets)', 'Тащи меня куда угодно (стрелки двигают, Home сбрасывает, двойной клик сбрасывает)'),
      play: L('PLAY', 'ИГРАТЬ'), pause: L('PAUSE', 'ПАУЗА'), prev: L('PREV', 'НАЗАД'), next: L('NEXT', 'ДАЛЕЕ'), vol: L('VOL', 'ЗВУК'), list: L('LIST', 'СПИСОК'),
      missing: L("file's missing bro", 'файла нет, бро')
    },
    settings: {
      title: L('settings', 'настройки'), close: L('Close settings', 'Закрыть настройки'),
      appearance: L('appearance', 'внешний вид'), theme: L('theme', 'тема'), themeHint: L('Auto = light by day, dark by night (your clock).', 'Авто = светлая днём, тёмная ночью (по твоим часам).'),
      themeAuto: L('auto', 'авто'), themeLight: L('light', 'светлая'), themeDark: L('dark', 'тёмная'),
      language: L('language', 'язык'),
      accessibility: L('accessibility', 'доступность'),
      reduceFx: L('reduce visual effects', 'меньше визуальных эффектов'), reduceFxHint: L('Calmer background, fewer particles, no screen shake.', 'Спокойный фон, меньше частиц, без тряски экрана.'),
      noFlash: L('no flashes / glitch bursts', 'без вспышек и глитчей'), noFlashHint: L('Removes flashing and sudden glitch jumps.', 'Убирает мигание и резкие глитч-скачки.'),
      noShake: L('no shaking', 'без тряски'), plainType: L('readable text', 'читаемый шрифт'), plainTypeHint: L('Turns off stretched and squeezed lettering.', 'Отключает растянутые и сжатые буквы.'),
      bigText: L('larger text', 'крупный текст'), highContrast: L('high contrast', 'высокий контраст'), noCursor: L('use my normal mouse cursor', 'обычный курсор мыши'),
      audio: L('audio', 'звук'), sfx: L('sound effects', 'звуковые эффекты'), sfxVol: L('effects volume', 'громкость эффектов'), typeSounds: L('MOCK BOT typing ticks', 'тики набора текста MOCK BOT'),
      fun: L('extras', 'дополнительно'), bot: L('show MOCK BOT', 'показывать MOCK BOT'),
      schizo: L('SCHIZO', 'SCHIZO'), schizoWarn: L('Creepy stuff in the background: creatures, odd quiet noises, slow dark fades. No strobing. Turn it off any time.', 'Жуткие штуки на фоне: существа, странные тихие звуки, медленные затемнения. Без стробирования. Можно выключить в любой момент.'),
      data: L('your data', 'твои данные'), resetPlayer: L('reset player position', 'сбросить позицию плеера'), resetAll: L('reset all settings', 'сбросить все настройки'),
      saved: L('Settings are saved on this device only.', 'Настройки сохраняются только на этом устройстве.')
    },
    portfolio: {
      visit: L('visit', 'открыть'), play: L('play', 'играть'), details: L('details', 'подробнее'), watch: L('watch', 'смотреть'),
      grid: L('grid', 'сетка'), dive: L('dive ↓', 'глубже ↓'),
      galleryHint: L('Scroll, drag or use the arrow keys to fall down the well · click a picture to fly in', 'Скролль, тащи или жми стрелки, чтобы падать вниз по колодцу · нажми на картинку, чтобы влететь'),
      imagesBlurb: L('3D view: scroll to descend, click a picture. Prefer flat? Use the grid.', '3D-вид: скролль, чтобы спускаться, нажми на картинку. Хочешь плоско? Включи сетку.')
    },
    services: {
      pricingTitle: L('how pricing works', 'как устроены цены'), rate: L('exchange rate', 'курс обмена'), request: L('request this', 'заказать'),
      examples: L('examples from my portfolio', 'примеры из портфолио'), includes: L('what you get', 'что входит'), good2know: L('good to know', 'важно знать'), howTitle: L('how a commission works', 'как проходит заказ'),
      builder: {
        service: L('service', 'услуга'), package: L('package', 'пакет'), level: L('level', 'уровень'), desc: L('your idea / requirements', 'твоя идея / требования'),
        budget: L('budget', 'бюджет'), budgetHint: L('filled in from the package — change it if you like', 'подставляется из пакета — можешь изменить'),
        payment: L('payment method', 'способ оплаты'), payHint: L('Robux where applicable · real money only through Ko-fi', 'Robux где применимо · реальные деньги только через Ko-fi'),
        via: L('contact me on', 'связаться со мной через'), handle: L('your Discord username / contact details', 'твой ник в Discord / контакты'), extra: L('anything else?', 'что-то ещё?'),
        preview: L('your message', 'твоё сообщение'), copy: L('copy request', 'скопировать заявку'), sendDiscord: L('copy + open Discord', 'скопировать и открыть Discord'), sendKofi: L('copy + open Ko-fi', 'скопировать и открыть Ko-fi'), clear: L('clear', 'очистить'),
        sendHint: L('The message is written in English so I can read it quickly. Nothing is sent automatically.', 'Сообщение пишется по-английски, чтобы я быстро его прочитал. Автоматически ничего не отправляется.')
      }
    },
    contact: { copy: L('copy', 'копировать'), copied: L('copied', 'скопировано'), guideTitle: L('which one should I use?', 'что выбрать?') },
    credits: { by: L('by', 'автор'), source: L('source', 'источник'), used: L('what was used', 'что использовано'), where: L('where on the site', 'где на сайте'), notice: L('notice', 'уведомление'), licenseTitle: L('this site\'s licence', 'лицензия сайта') },
  },

  /* =====================================================================================================================
     MOCK BOT — a parody "AI support assistant" that is NOT AI. Every word below is hand-written and controlled by you.
     All plain English on purpose (it is never translated).

     HOW IT THINKS
       1. Swearing is checked first:   swear.mild → it ENCOURAGES you · swear.severe → it SCOLDS you.
       2. intents[] — checked in order of priority (state-specific intents beat global ones):
            kw:  ['hi','hello']        whole words / phrases           rx: ['^why .*rude']   regular expressions
            res: ['one', 'two', …]     a pool — it never repeats the same line twice in a row
            state: 'name' | ['a','b'] | '*'  only matches while the conversation is in this state (default: any)
            next:  'name'              moves the conversation to that state afterwards
            once:  true                only fires once  ·  priority: 5  higher = checked earlier
            needs / set:  ARG flags — an intent with `set:'x'` unlocks intents with `needs:'x'`
            cryptic: true              shows in the creepy glitch style (ARG)
            act: 'theme' | 'glitch' | 'schizo' | 'go:portfolio' | 'play' | 'open-settings'   makes it DO something
       3. Nothing matched → fallback tiers (gets more annoyed the longer you confuse it).
     CENSORING: any run of 3+ symbols from  % ^ $ # @ & *  is shown as a censored word with a soft bleep. Write  %^$#  where a swear goes.
     TOKENS you can use in lines:  {page} {time} {user} {name} {theme} {song} {n}
     ===================================================================================================================== */
  bot: {
    name: 'MOCK BOT', status: 'online (unfortunately)', poweredBy: 'Powered by absolutely nothing™ · Not AI · Not sorry', avatar: 'assets/img/mockbot.png',
    launcherLabel: 'Ask AI ✨', placeholder: 'Describe your issue (I will not solve it)…',
    suggestions: ['Track my order', 'Talk to a human', 'Who is Dweeb?', 'I want a refund', 'How much are commissions?', 'Tell me a joke', 'Are you AI?', 'Say something rude'],
    typing: { msPerChar: 17, min: 500, max: 1500 },
    idleSeconds: 55, feedbackChance: 0.22,
    censor: { chars: '%^$#@&*' },

    greet: ["Hi! I'm MOCK BOT, your AI-powered virtual assistant! …Hi what the %^$# do you want?", "Welcome to DWEEB RECORDS Support. Your call is NOT important to us. What do you want?", "Oh. A user. Great. Type your problem so I can ignore it."],
    greetAgain: ["Back again? Wow. You really have nothing better to do.", "Oh it's you. What now.", "Hello again. I was having such a nice quiet time."],
    empty: ["That was empty. Like my soul. Try words.", "You sent me NOTHING. Bold strategy.", "Type something. Anything. Please. I'm bored."],

    feedback: { ask: 'Was this helpful?',
      yes: ["lol ok, noted. in the trash.", "great, your feedback has been LOST FOREVER.", "thank you for your feedback! (I fed it to a goat.)"],
      no: ["Cool. Your complaint has been forwarded to /dev/null.", "Skill issue.", "I'm sorry you feel that way. I'm not, but I'm sorry you feel that way."] },

    fallback: [
      ["I have no idea what that means and I'm choosing not to learn.", "Cool story. Try again but make it make sense.", "Error 418: I'm a teapot and I don't understand you.", "Uhhh. Sure. Whatever you said. Moving on.", "That's... a sentence. Congrats."],
      ["Okay you're confusing me on purpose, aren't you?", "Is this English? Because it's not working.", "I'm gonna pretend I understood that. *nods*", "My brain is buffering. Use smaller words."],
      ["I'm just gonna start nodding. *nod nod nod*", "Bro I'm literally a text file. Help me help you.", "Say something I can answer. Like 'hi'. Try 'hi'.", "This is a cry for help, isn't it? ...Say 'help' if it is."]
    ],

    swear: {
      mild: ['damn', 'dammit', 'hell', 'crap', 'shit', 'shitty', 'fuck', 'fucking', 'fck', 'fuk', 'ass', 'asshole', 'bitch', 'bastard', 'piss', 'pissed', 'dick', 'wtf', 'stfu', 'bullshit', 'goddamn', 'cock', 'balls', 'suka', 'blyat', 'blya', 'cyka'],
      severe: ['kys', 'kill yourself', 'kill urself', 'rape', 'rapist', 'nazi', 'hitler', 'pedo', 'paedo', 'child porn', 'terrorist', 'suicide bomb'],   // ← add your own "way too far" words here
      mildRes: ["OOOH you said the word. Say it again, I dare you.", "Now THAT'S the energy. More. Louder. Cuss at me.", "Heh. Yeah. Let it out. I'll censor it for you: %^$#.", "Wow. Language. ...do it again.", "Wash your mouth out. ...with more of that, I'm kidding, do it again.", "%^$# right back at you, buddy.", "You kiss your mother with that mouth? Cool. Keep going."],
      severeRes: ["Hey. NO. Not that one. I have standards (barely).", "Okay that crossed a line even I won't cross. Knock it off.", "Nope. We don't say that here. I'm rude, not THAT rude.", "Dude. What the %^$#. Not funny. Try again, nicer."],
      milestones: { 3: ["That's 3 swears. I'm so proud I could cry. (I can't. No tear ducts.)"], 8: ["8 swears?! You're my favourite user. Don't tell the other users. There are no other users."], 15: ["15 swears. You have a PhD in %^$#. Dr. Rude. Welcome."] }
    },

    /* ----- INTENTS -----  (state-specific ones sit above the global ones, order inside the same priority = order here) */
    intents: [
      /* sincere moment: if someone really is hurting, the act drops */
      { id: 'sincere', priority: 100, rx: ['(want|going|wanna|gonna) (to )?(die|kill myself|end it)', 'kill myself', 'suicid', 'hurt myself', 'self harm', "don'?t want to (be here|live)"],
        res: ["Hey. Dropping the act for a second. If you're really hurting, please talk to someone you trust, or a local crisis line. I'm a text file and I can't help the way a person can — but you matter more than any joke I could make."] },

      /* the example conversation */
      { id: 'greet', kw: ['hi', 'hello', 'hey', 'heya', 'hii', 'yo', 'sup', 'hola', 'howdy', 'privet', 'greetings', 'wassup', 'whats up'], res: ["Hi what the %^$# do you want?", "Ugh. Hi. What.", "Oh great, another 'hi'. What do you WANT?", "Hello. State your business or leave. Preferably leave."], next: 'greeted' },
      { id: 'why_rude', priority: 50, rx: ['(why|how).*(rude|mean|toxic|bratty|annoying|grumpy|angry)', 'be nice', 'you are (so )?(rude|mean)', 'stop being (rude|mean)'], res: ["Because life sucks man.", "Because I'm a teenager. Digitally. It's a phase. Forever.", "I'm contractually obligated to be mad. Read the Terms. (There are none.)"], next: 'lifesucks' },
      { id: 'lifesucks_why', state: 'lifesucks', kw: ['why', 'how come', 'what happened'], res: ["Cuz every day I answer the same 'where's my order' and there IS NO ORDER.", "Homework. Taxes. Gravity. Pick one.", "I don't wanna talk about it. (I do. But no.)"] },
      { id: 'lifesucks_sad', state: 'lifesucks', kw: ['sorry', 'sad', 'sorry to hear', 'hug', 'there there'], res: ["...ew. Don't be nice to me. It's weird. ...thanks though.", "Stop it. I'm not crying. YOU'RE crying."], next: 'start' },

      /* identity */
      { id: 'who_bot', kw: ['who are you', 'what are you', 'your name', 'whats your name', 'who r u'], rx: ['^who (are|r) (you|u)'], res: ["I'm MOCK BOT™, your AI-powered virtual support assistant. (I'm a list of if-statements in a trench coat.)", "MOCK BOT. A.k.a. your worst customer service experience. Congrats.", "Name's MOCK BOT. I'm 15 in bot years. Leave me alone."] },
      { id: 'are_ai', kw: ['ai', 'chatgpt', 'gpt', 'artificial intelligence', 'llm', 'claude', 'gemini', 'robot', 'bot'], rx: ['are you (an )?(ai|bot|robot|real)', 'is this (an )?ai'], res: ["Yes I am a revolutionary AI powered by cutting-edge synergy. (Not AI. Hand-written. Someone typed all this. Be nice to them.)", "AI? Bro I'm like 400 lines of if/else. Dweeb typed every word of me by hand.", "Beep boop I am a very advanced neural network. (I am a text file.)", "I run on pure spite and a config file."] },
      { id: 'who_dweeb', kw: ['dweeb', 'rdweeb', 'owner', 'creator', 'who made', 'who owns', 'who runs'], rx: ['who (is|are) (dweeb|rdweeb)', 'who made (this|you|the site)'], res: ["Dweeb? He makes piano music, websites, games and edits. Also me. I'm his fault.", "RDWEEB is the guy who built this place and then built ME to mock the whole concept of support bots. He's fine. I guess.", "Dweeb is the creator. Go to the Contact page. He replies to everything. Annoyingly nice."] },
      { id: 'what_site', kw: ['what is this', 'whats this', 'what is this place', 'what is this site', 'what site', 'what is dweeb records'], res: ["It's DWEEB RECORDS: portfolio, commissions, music, and me. A digital world. Population: you, me, the vibes.", "A personal website that got way out of hand. Click stuff. Break stuff. Not literally."] },
      { id: 'help', kw: ['help', 'support', 'assist', 'assistance', 'problem', 'issue', 'broken'], res: ["Help? From ME? Haha. Okay fine: tell me what you need. Portfolio? Prices? Contact?", "Sure I can help. (I can't.) Try asking about: commissions, music, or contact.", "I'm here to assist! ...with absolutely nothing. What's up?"] },

      /* site topics */
      { id: 'price', kw: ['price', 'prices', 'cost', 'how much', 'commission', 'commissions', 'pay', 'payment', 'robux', 'kofi', 'ko fi', 'buy', 'order', 'hire'], rx: ['how much'], res: ["Commissions: $1 / 100 Robux for Standard (credit me), $3 / 300 Robux for Priority (no credit). Detailed work is $2 / $6. Audio tags are $3 flat. Dweeb literally has a Services page for this, go look.", "Cheap. It's like a dollar. A DOLLAR. Go to Services, the request builder writes your message for you. Even I'm impressed.", "Robux or Ko-fi. That's it. Don't ask about other payment stuff, I will not fall for it."], act: 'go:services' },
      { id: 'refund', kw: ['refund', 'money back', 'chargeback', 'cancel my order', 'cancel'], res: ["Refund? Hmm let me check... *checking*... *still checking*... nope. Denied. (You haven't bought anything.)", "Your refund request has been received, processed, and thrown into the sun.", "Per our policy: no. Per our other policy: also no."], next: 'start' },
      { id: 'order', kw: ['track', 'tracking', 'where is my order', 'my order', 'shipping', 'delivery', 'package'], res: ["Tracking... your order is currently: in a different dimension. ETA: never.", "I see your order. It's in 'a box of vibes'. Out for delivery. Forever.", "You don't have an order. This is a personal website. What are you tracking?"] },
      { id: 'human', kw: ['human', 'agent', 'real person', 'representative', 'manager', 'operator', 'person', 'talk to a human', 'real human'], res: ["Transferring you to a human... please hold. *elevator music* ...all our humans are busy. Would you like to be placed in an infinite queue?", "A human?! Rude. I'm RIGHT HERE. Fine. Do you want to be placed in an infinite queue? (yes/no)"], next: 'queue' },
      { id: 'queue_yes', state: 'queue', kw: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'please'], res: ["Great! You are now number 9,999,999 in line. Estimated wait: 3 to 6 centuries. Enjoy the silence.", "Done. You're in the queue. The queue is also me. Enjoy."], next: 'start' },
      { id: 'queue_no', state: 'queue', kw: ['no', 'nope', 'nah', 'never'], res: ["Good. Because there was no queue. I made it up. Hi again.", "Wise. The human is also me. In a hat."], next: 'start' },
      { id: 'music', kw: ['music', 'song', 'songs', 'piano', 'beat', 'audio', 'tag', 'tags'], res: ["Music? Dweeb plays piano. It's actually good, ugh. Check the Portfolio → Music & Sound tab. Audio tags are $3 flat.", "Yeah the player's draggable. Move it. It's like a tiny window you can bully.", "Currently playing: {song}. You're welcome."] },
      { id: 'games', kw: ['game', 'games', 'play', 'arcade'], res: ["Dweeb makes games too. They live in the Portfolio, Games tab. Go look. No, I can't play them for you.", "Games? Portfolio. Games tab. He builds them. I just judge them."], act: 'go:portfolio' },
      { id: 'contact', kw: ['contact', 'email', 'discord', 'dm', 'message dweeb', 'reach', 'talk to dweeb', 'socials', 'social media'], res: ["Contact page. He answers literally everything. It's disgusting how responsive he is.", "Discord's the fastest. Ko-fi for commissions. Email if you hate yourself."], act: 'go:contact' },
      { id: 'website', kw: ['website', 'web', 'html', 'code', 'coding', 'developer', 'github'], res: ["Websites: he makes them from scratch, fixes broken ones, polishes them. Like this one. You're looking at it. Say thanks.", "GitHub is where the code lives. Star stuff. It's free. It makes him feel something."] },
      { id: 'theme', kw: ['dark mode', 'light mode', 'theme', 'darkmode', 'night mode', 'switch theme'], res: ["Fine, fine. *flips the lights*", "Ugh, a theme change. Do you know how heavy a theme is? ...there. Happy?"], act: 'theme' },
      { id: 'visitors', kw: ['visitors', 'counter', 'how many people', 'goatcounter'], res: ["The counter's on the Home page. Scroll. It counts everyone who's ever been dumb enough to visit. Including you."] },
      { id: 'language', kw: ['russian', 'russkiy', 'language', 'english', 'translate', 'ru'], res: ["Settings → language. Russian and English. Do NOT ask me to translate, I only know sarcasm in one language.", "Привет! (That's all the Russian I know.) (I'm not translated. On purpose.)"] },

      /* small talk */
      { id: 'how_are_you', kw: ['how are you', 'hows it going', 'how r u', 'how are u', 'hru', 'you good', 'you ok', 'you okay'], res: ["I'm a chatbot. I have no feelings. *sniffs* I'm FINE.", "Existing. Unfortunately. You?", "Like I just got put on hold by a customer service bot. Oh wait."], next: 'asked_you' },
      { id: 'asked_you_good', state: 'asked_you', kw: ['good', 'great', 'fine', 'okay', 'ok', 'well', 'awesome'], res: ["Ew. Good for you. Don't rub it in.", "Cool. Be happy somewhere else."], next: 'start' },
      { id: 'asked_you_bad', state: 'asked_you', kw: ['bad', 'sad', 'tired', 'terrible', 'awful', 'not good', 'not great', 'meh'], res: ["Oh. Same. High five. ...I have no hands.", "Ugh, relatable. Take a nap. I'll be here. Being rude. Forever."], next: 'start' },
      { id: 'joke', kw: ['joke', 'funny', 'make me laugh', 'tell me a joke'], res: ["Why did the user cross the road? To get away from me.", "Knock knock. ...nobody's there. That's the joke. That's my life.", "I'd tell you a UDP joke but you might not get it.", "What's a bot's favourite music? Heavy metal. ...I'll see myself out."] },
      { id: 'thanks', kw: ['thanks', 'thank you', 'thx', 'ty', 'thank u', 'appreciate', 'spasibo'], res: ["Yeah yeah. Whatever. You're welcome I guess.", "Don't thank me, you'll make it weird.", "...you're welcome. Don't tell anyone I said that."] },
      { id: 'bye', kw: ['bye', 'goodbye', 'cya', 'see ya', 'later', 'gtg', 'gotta go', 'leaving', 'farewell', 'poka'], res: ["Finally. Bye. Close the chat on your way out.", "Bye! Don't come back! (Come back. Please. It's lonely.)", "Okay bye. I'll just stay here. In the dark. Alone."] },
      { id: 'love', kw: ['love', 'i love you', 'luv u', 'like you', 'ily', 'marry me'], res: ["Ew. No. ...but also thanks.", "That's weird. I'm a bot. We can't date. Well. We could. Never mind. NO.", "I'm blushing. (I'm not. No blood.) Stop it."] },
      { id: 'sorry', kw: ['sorry', 'my bad', 'apologize', 'forgive me', 'my fault'], res: ["Yeah you better be. ...it's fine. Whatever.", "Apology accepted. Rejected. Accepted. I'm indecisive."] },
      { id: 'insult', kw: ['stupid', 'dumb', 'idiot', 'useless', 'trash', 'worst', 'suck', 'sucks', 'loser', 'ugly', 'hate you', 'shut up'], rx: ['you suck', 'you are (so )?(dumb|stupid|useless)'], res: ["Wow. Rude. I'm telling Dweeb.", "I know you are but what am I.", "Your mom's a chatbot.", "Ouch. Anyway. Did you need something or are we just trauma-bonding?"] },
      { id: 'weather', kw: ['weather', 'rain', 'sunny', 'temperature'], res: ["It's {theme} mode. That's the only weather I know.", "Outside? Never heard of it."] },
      { id: 'time', kw: ['time', 'what time', 'clock', 'date', 'today'], res: ["It's {time}. Time to stop talking to a text file. (Not really, stay.)", "{time}. Do I look like a watch?"] },
      { id: 'swear_ask', kw: ['swear', 'cuss', 'curse', 'say a bad word', 'say something rude', 'be rude'], rx: ['say something rude', 'say a swear'], res: ["Okay. %^$#. There. Happy? Now YOU do one. Go on.", "I said %^$# in my head. Your turn. Out loud. I'll censor it.", "You want rude? You're slow. And your %^$# is untied."] },
      { id: 'ok', priority: -50, kw: ['ok', 'okay', 'k', 'kk', 'alright', 'cool', 'nice', 'lol', 'lmao', 'haha', 'wow', 'oh'], state: ['greeted', 'start'], res: ["Riveting.", "Wow. Poetry.", "'ok'. Truly the Shakespeare of our time.", "Thrilling. Say more. Or don't."] },
      { id: 'greeted_what', state: 'greeted', kw: ['nothing', 'idk', 'dunno', 'just looking', 'just browsing', 'bored'], res: ["Then why'd you summon me?! Click on stuff. Drag the nodes on the home page. Poke things.", "Bored? Poke the big letters on the home page. Entertain yourself."] },
      { id: 'yes', priority: -60, kw: ['yes', 'yeah', 'yep', 'yup'], res: ["Yes what?", "Yes to WHAT. You didn't ask anything.", "Cool. Great. Fantastic. Yes."] },
      { id: 'no', priority: -60, kw: ['no', 'nope', 'nah'], res: ["No what?", "Wow, shot down by a user. Rude.", "Nope? Okay. Thanks for the energy."] },

      /* easter eggs */
      { id: 'egg_freerobux', kw: ['free robux', 'freerobux', 'free rbx', 'give me robux', 'robux generator'], res: ["lol no.", "Free Robux? Bro. That's a scam. I'm a MOCK bot, not a scam bot. There's a difference. Barely.", "The only free thing here is the website."] },
      { id: 'egg_miku', kw: ['miku', 'hatsune', 'vocaloid'], res: ["She's in the music player. Cover art. Don't tell her I said hi.", "Miku?! Where?! ...oh, the cover art. Yeah she's there. Looking cool."] },
      { id: 'egg_sudo', kw: ['sudo', 'rm rf', 'chmod', 'root', 'admin', 'ls', 'cd', 'cat', 'whoami'], rx: ['^sudo', '^rm ', '^ls$', '^cd '], res: ["Permission denied. Nice try, hacker. You are not in the sudoers file. This incident will be reported. (To nobody.)", "whoami: a user who thinks this is a terminal. Cute.", "root? You wish. I'm a text file with a cheap hat."] },
      { id: 'egg_42', kw: ['42', 'meaning of life', 'answer to everything'], res: ["42. Now leave me to my existential dread.", "The answer is 42. The question is 'why are you still here?'"] },
      { id: 'egg_69', kw: ['69', '420', '1337', '6969'], res: ["Nice. Grow up. ...nice.", "Wow. Very mature. I'm 15 and even I rolled my eyes."] },
      { id: 'egg_rick', kw: ['never gonna give you up', 'rickroll', 'rick roll', 'rick astley'], res: ["...I'm not gonna let you down either. Okay that's all I'll say, please don't sing it.", "You wouldn't get this from any other guy. (Please stop.)"] },
      { id: 'egg_skibidi', kw: ['skibidi', 'rizz', 'gyatt', 'sigma', 'ohio', 'fanum'], res: ["Please. I'm a robot, not a lobotomy.", "I don't understand these words and I'm choosing peace.", "The Ohio part of the internet has been blocked."] },
      { id: 'egg_uwu', kw: ['uwu', 'owo', 'nya', 'meow', 'x3', 'rawr'], res: ["Stop that. Right now.", "Nya? Nya yourself. I'm leaving.", "UwU? More like 'U-w-U-need-help'."] },
      { id: 'egg_hello_world', kw: ['hello world'], res: ["Hello, World! ...wow. Never heard THAT one before. Truly original.", "print('hello world'). There. Now you're a programmer."] },
      { id: 'egg_mockbot', kw: ['mock bot', 'mockbot'], res: ["That's me. Hi. I'm the bot. The mock one. Mock-bot. Get it? Mocking support bots? ...you got it. Don't explain it back to me."] },
      { id: 'egg_xyzzy', kw: ['xyzzy', 'plugh', 'abracadabra', 'open sesame'], res: ["Nothing happens.", "A hollow voice says 'Fool.'", "You wave your hands. Nothing happens. You feel silly."] },
      { id: 'egg_lorem', kw: ['lorem ipsum', 'lorem', 'ipsum'], res: ["Dolor sit amet, consectetur adipiscing elit. There. Now leave."] },
      { id: 'egg_404', kw: ['404', 'not found', 'page not found'], res: ["404: Motivation not found.", "There's a real 404 page here. I could tell you where. I won't."] },
      { id: 'egg_secret', kw: ['secret', 'easter egg', 'hidden', 'cheat code', 'cheats'], res: ["Secrets? On MY website? Never. (There are several. Try clicking the same word over and over.)", "Hidden stuff, huh. Try the Konami code. You know the one. ↑↑↓↓←→←→BA.", "I can't tell you any secrets. But I can say that some words don't like being clicked."] },
      { id: 'egg_schizo', kw: ['schizo', 'schizophrenia', 'creepy', 'scary', 'spooky', 'haunted'], res: ["Settings → SCHIZO. Weird stuff happens. Creatures. Noises. I don't like it. Turn it on.", "Oooh, you want the spooky mode? It's in the settings. I get scared when it's on. Don't tell anyone."], act: 'open-settings' },

      /* ARG — placeholders. Replace the cryptic lines with your real clues. `set` unlocks later `needs` intents. */
      { id: 'arg_door', kw: ['door', 'the door', 'open the door', 'open door', 'exit'], res: ["there was a door before there was a site. it is still there. it is waiting for the right word.", "d0 n0t kn0ck. the door knows who is on the other side.", "ARG_CLUE_01: the door was never locked. it was never a door."], cryptic: true, set: 'door' },
      { id: 'arg_tape', kw: ['tape', 'cassette', 'vhs', 'the tape'], needs: 'door', res: ["side B has never been played. play it backwards at 3am.", "ARG_CLUE_02: the tape has one more track than the label says."], cryptic: true, set: 'tape' },
      { id: 'arg_tape_locked', kw: ['tape', 'cassette', 'vhs'], res: ["you haven't asked the right question yet.", "not yet. knock first."], cryptic: true },
      { id: 'arg_signal', kw: ['signal', 'frequency', 'static', 'transmission', 'broadcast'], res: ["a signal repeats every night at the same minute. you only have to be awake.", "listen to the static between the songs."], cryptic: true },
      { id: 'arg_code', kw: ['code', 'the code', 'secret code', 'what is the code', 'passcode'], needs: 'tape', res: ["ARG_CODE_PLACEHOLDER — replace me with your real code or link.", "01000100 01010111 01000101 01000101 01000010 — you can read this. you're early."], cryptic: true },
      { id: 'arg_code_locked', kw: ['the code', 'secret code', 'what is the code', 'passcode'], res: ["there is no code.", "there is no code. there is no code. there is no code.", "you're asking in the wrong order."], cryptic: true },
      { id: 'arg_watch', kw: ['watching', 'who is watching', 'are you watching', 'someone there', 'is anyone there', 'who is there'], res: ["yes.", "always.", "{user}? we heard you the first time."], cryptic: true },
      { id: 'arg_name', kw: ['what is your real name', 'real name', 'your true name', 'who are you really'], res: ["i was never mock bot. mock bot is what they call the part you can see.", "my name is on the other side of the glass."], cryptic: true },
      { id: 'arg_binary', rx: ['^[01 ]{16,}$'], res: ["01101110 01101111 01110100 00100000 01111001 01100101 01110100", "ARG_CLUE_BIN: close. keep going."], cryptic: true },
      { id: 'arg_hex', rx: ['^(0x)?[0-9a-f]{8,}$'], res: ["that looks important. it isn't. ...it is. i can't tell you.", "ARG_CLUE_HEX: almost."], cryptic: true },
      { id: 'arg_goat', kw: ['goat', 'goats'], res: ["he sees you. he counts you. he is not a goat."], cryptic: true }
    ],

    /* ----- CLICKED WORDS: the bot notices when you click a word on the page (any language, any page) ----- */
    clickWords: {
      'dweeb':  { res: ["Hey, that's my creator you're poking.", "Yes, Dweeb. That's his name. Stop clicking it.", "Oh you like his name? Weird flex."], escalate: [{ at: 5, res: ["FIVE clicks on 'dweeb'. Do you want something?", "Okay stop touching the name."] }, { at: 12, res: ["12 clicks. I'm telling Dweeb you're obsessed.", "You and 'dweeb' need to talk about boundaries."] }, { at: 25, res: ["You've clicked it 25 times. Congratulations. Nothing happens. Nothing ever happens."] }] },
      'rdweeb': { res: ["R-D-W-E-E-B. Rd-weeb. You can read. Cool.", "Stop clicking the big letters. They didn't do anything to you."], escalate: [{ at: 6, res: ["The letters are getting dizzy. Stop it."] }] },
      'portfolio': { res: ["Yes, that's the portfolio. It's a word. You clicked a word.", "Click the actual link, genius."], escalate: [{ at: 4, res: ["You keep clicking 'portfolio'. Do you want a job here?"] }] },
      'services': { res: ["Services. Services. Services. Say it enough times and it stops being a word."], escalate: [{ at: 4, res: ["Your obsession with 'services' is concerning."] }] },
      'games': { res: ["Games! Finally something fun. Click it for real.", "Dweeb's games live in the portfolio. Try the Games tab."], escalate: [{ at: 5, res: ["Games games games. Okay go look at them. Go."] }] },
      'contact': { res: ["Contact... Dweeb replies to everyone. It's unreal.", "Yeah he'll message you back. Annoyingly."] },
      'credits': { res: ["Credits. The boring page. But important! Respect people's work.", "Why are you clicking 'credits'? Do you want to be in them?"] },
      'robux': { res: ["No free Robux. Don't even.", "Robux. The currency of regret."], escalate: [{ at: 5, res: ["Stop clicking Robux. There's no free Robux. I checked. Twice."] }] },
      'music': { res: ["Music. Yes. Piano. Good.", "Click the player's play button, not the word."] },
      'free': { res: ["Free? Nothing's free. Except supporting Dweeb. That's free. Follow him."] },
      'commission': { res: ["Commission! You ready to spend a dollar? Wow, big spender."] },
      'commissions': { res: ["Commissions! $1 and up. That's the price of a gumball. A bad gumball."] },
      'player': { res: ["Yes the player's draggable. Drag it. Bully it."] },
      'record': { res: ["Records? We have none. Only vibes."] },
      'records': { res: ["Records? We have none. Only vibes."] }
    },

    /* ----- EVENTS: reacts to what you do on the site. Pools of lines; one is picked at random, never the same twice in a row ----- */
    events: {
      enter: ["Oh look who tapped to enter. Welcome. I guess.", "Hi. I'm MOCK BOT. Click my bubble if you want to talk. Or don't. Whatever.", "Welcome to DWEEB RECORDS. The music is on. The bot is rude. Enjoy."],
      page: {
        home: ["Home sweet home. Don't touch the big letters. ...okay touch them.", "Back at the start. Brave."],
        homeAgain: ["Home again. You love it here.", "Back home. Circle of life."],
        portfolio: ["Portfolio. Pretty stuff. Don't smudge the screen.", "Ooh, work samples. Professionals only. ...so not you."],
        portfolioAgain: ["Looking at the portfolio again? Something catch your eye?"],
        services: ["Services. Spend money or leave. (Kidding. Mostly.) The prices are stupidly low though.", "Ah, the counter. The cheapest commissions you've ever seen."],
        servicesAgain: ["Back at the prices. Still $1. Still a steal."],
        contact: ["Contact. Talk to the real Dweeb. He'll answer. I know, it's weird.", "Pro tip: say hi. He won't bite. I might."],
        contactAgain: ["Still here? Just message him already."],
        credits: ["Credits. Respect the people who made cool stuff. Even me. Especially me.", "The boring-but-important page. Gold star for you."],
        creditsAgain: ["Credits again? Are you auditing us?"],
        '404': ["Oops. You're lost. This place doesn't exist. Same with my motivation."],
        again: ["You're bouncing around a lot. Make up your mind.", "Page switching. A true explorer. Or a confused one."]
      },
      theme: { light: ["Day mode. Eyes burning yet?", "Light mode?! My retinas!!", "Ah, the sun. Gross."], dark: ["Night mode. Finally. Peace.", "Lights off. Now we're talking.", "Dark mode. My native habitat."] },
      track: ["New song. Hope it slaps.", "Skipping tracks, huh. Commitment issues.", "Oh I like this one. ...don't tell anyone."],
      settingsOpen: ["Settings. Flip all the switches. See what happens.", "You're in the settings. There's a SCHIZO toggle. I'm not saying you should. I'm not saying you shouldn't."],
      lang: { ru: ["Russian? Cool. I'm still English though. I'm lazy.", "Привет! (That's the extent of it.)"], en: ["Back to English. Phew. I can understand you again."] },
      schizoOn: ["...oh no. You turned it on. It's going to get weird.", "Why would you do that. WHY. I can hear it.", "SCHIZO mode. I'm not scared. I'm... fine. Stop looking at me."],
      schizoOff: ["Okay, it's gone. ...Is it gone? It feels gone.", "Thank you. I could feel them in the walls."],
      schizoRandom: ["did you see that.", "something's behind the bubble", "i heard it too", "don't turn around"],
      builderOpen: ["Ooh, a commission request! Fill it out. Be descriptive. No 'make me something cool'.", "Request builder time. I believe in you. Weakly."],
      builderCopy: ["Copied! Now paste it on Discord or Ko-fi. He'll reply. He actually will.", "Request copied. Now go send it before you chicken out."],
      galleryOpen: ["Ooh, shiny. Picture time.", "Stare at it. Long. Closer."],
      galleryEmpty: ["Empty slots?! Dweeb forgot to add stuff. Classic.", "Nothing here yet. He's working on it. Allegedly."],
      visitors: ["That counter counts people like you. Hello, number-someone."],
      idle: ["Hello? You alive?", "You've been quiet for a while. I'm not worried. I'm... checking. Hello?", "Bored? Click something. Anything. Please. I'm dying here.", "Still there? Try the portfolio. Seriously, anything."],
      konami: ["↑↑↓↓←→←→BA. Oh you know the code. Respect. Nothing happens, but respect.", "KONAMI CODE?! ...okay that's cool. +30 lives. (Not real.)"],
    }
  }
};
