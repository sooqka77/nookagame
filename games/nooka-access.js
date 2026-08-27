/* ============================================================
   NOOKA ACCESS — доступ к платным уровням без бэкенда.

   Как это работает для родителя:
     1. оплачивает по ссылке (эквайринг платёжки, чек приходит от неё)
     2. получает код вида NOOKA-K7M3-QP9F
     3. вводит код в игре — доступ открыт до даты, зашитой в код

   Код проверяется на устройстве: внутри кода лежат тариф и дата
   окончания, плюс контрольная сумма. Сервер не нужен — а значит
   продажи можно запустить в день готовности контента.
   Коды печёт tools/codes.html (открыть в браузере, работает офлайн).

   Ограничение осознанное: код можно передать другому. Для первой
   тысячи продаж это дешевле, чем строить регистрацию и бэкенд.
   ============================================================ */
(function () {

  /* ── переключатели запуска ────────────────────────────────
     OPEN_ALL = true  — вся платформа открыта (показы, тесты, до старта продаж)
     OPEN_ALL = false — работает платная стена: бесплатна вся первая игра
                        целиком (поле free в реестре), две другие — по коду */
  var OPEN_ALL = false;  // ← стена включена: бесплатна только первая игра

  /* Поддержка и запасной путь: пока не подключена платёжка, кнопки оплаты
     ведут сюда, и код выдаётся руками. */
  var TG_URL = 'https://t.me/NookaGame';

  /* Страницы продажи. Стена внутри игр не тащит человека сразу в банк:
     сначала страница, где написано, что он покупает и как получит доступ. */
  var BUY_URL    = '/buy/';
  var ACCESS_URL = '/access/';
  var OFERTA_URL = '/legal/oferta.html';

  /* ── PAYKEEPER: АВТОМАТИЧЕСКАЯ ВЫДАЧА ДОСТУПА ──────────────
     Сюда — адрес платёжной формы из личного кабинета PayKeeper, вида
     https://<ваш-магазин>.server.paykeeper.ru/create/
     Пока пусто, кнопки оплаты ведут в Telegram и покупателю обещана
     ручная выдача. Как только адрес появится — включается автомат:

       1. покупатель жмёт «Оплатить» — здесь же печатается его код
          и уходит в форму как адрес возврата;
       2. PayKeeper проводит оплату и возвращает человека на /access/,
          дописав к адресу ?payment_id=…&clientid=…&result=success;
       3. страница видит успех, включает доступ и показывает код.

     Покупатель не пишет нам ни строчки.                                 */
  var PAYKEEPER = 'https://nookagame.server.paykeeper.ru/create/';

  /* Готовые платёжные ссылки из кабинета — запасной путь, если форму
     почему-то перестанет принимать магазин. Они проще, но не умеют
     передавать адрес возврата, а значит и выдавать доступ сами:
       490 ₽  https://lnk.paykeeper.ru/AgH5BgpU
       1450 ₽ https://lnk.paykeeper.ru/Y6cACuXQ                          */

  /* Куда PayKeeper возвращает покупателя. Адрес должен быть абсолютным
     и вести на боевой домен: с localhost платёжка не работает.

     Код кладём в хеш, а не в параметр. PayKeeper дописывает свои
     параметры строкой «?payment_id=…» — если в адресе уже есть «?»,
     получится два вопросительных знака и сломанный адрес. Хеш переживает
     обе склейки, а заодно не уходит в журналы хостинга. */
  var SITE       = 'https://nookagame.ru';
  var RETURN_URL = SITE + '/access/';

  /* Сколько ждать код, если выдаём руками (пока не подключён PayKeeper).
     Держать выполнимым: лучше пообещать 15 минут и ответить за две. */
  var DELIVERY_WAIT = '15 минут';

  /* Код печатается до оплаты и ждёт возвращения покупателя. Страховка на
     случай, если хеш по дороге потеряется: тогда доступ включит сам факт
     успешного возврата. Живёт два часа — дольше нельзя, иначе ссылку
     с успехом можно будет подставить руками много позже. */
  var PEND = 'nooka_pending';
  var PEND_TTL = 2 * 3600 * 1000;

  /* ── ДЕМО-ДОСТУП ПО ССЫЛКЕ ────────────────────────────────
     Ссылка вида nookagame.ru/demo/?k=NOOKA-XXXX-YYYY открывает все три игры
     без ввода кода: удобно показывать партнёрам и школам.
     Демо-коды печатаются с серией 15 — по ней их видно и можно отозвать.
     DEMO_OFF = true — все демо-ссылки перестают работать сразу после
     выкладки, даже те, что уже открыты на чужих устройствах.            */
  var DEMO_SERIAL = 15;
  var DEMO_OFF = false;   // ← рубильник: true и выложить — демо закрыто

  /* ── предпросмотр: «как видит родитель без оплаты» ─────────
     ?wall=1 включает режим только в этой вкладке, ?wall=0 выключает.
     Гасит и общий показ, и записанный на устройстве доступ — иначе
     владелец с личным ключом видит всё открытым и проверить не может.
     Сам ключ при этом остаётся в памяти браузера: закрыл режим —
     доступ на месте. Другим людям это ничего не меняет. */
  var WALL_PREVIEW = false;
  try {
    var wq = new URLSearchParams(location.search).get('wall');
    if (wq === '1') sessionStorage.setItem('nooka_wall', '1');
    if (wq === '0') sessionStorage.removeItem('nooka_wall');
    WALL_PREVIEW = sessionStorage.getItem('nooka_wall') === '1';
  } catch (e) {}

  /* Открыто ли всё: боевой переключатель минус предпросмотр в этой вкладке */
  function allOpen() { return OPEN_ALL && !WALL_PREVIEW; }

  var KEY = 'nooka_access';
  var ALPHA = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';   // без 0/O/1/I — чтобы диктовать по телефону
  var SALT = 'nooka-2026-ai-literacy';
  var EPOCH = Date.UTC(2026, 0, 1);                  // 01.01.2026
  var DAY = 86400000;

  var PLANS = {
    quarter: { code: 0, days: 92,  rub: 490,  price: '490 ₽',  title: 'Три месяца', note: 'Вторая и третья игры — ещё 20 уровней. Продлевать не нужно: срок вышел — доступ закрылся сам.' },
    year:    { code: 1, days: 366, rub: 1450, price: '1450 ₽', title: 'Год',        note: 'Те же 20 уровней на 12 месяцев плюс все новые игры платформы, которые выйдут за год.' },
    /* Демо не продаётся: под него печатается ссылка для показов (серия 15).
       Срок длинный, чтобы не перевыпускать перед каждой встречей, — на случай
       утечки есть рубильник DEMO_OFF. */
    demo:    { code: 0, days: 90,  price: 'демо',   title: 'Демо-доступ', note: 'Все три игры на 90 дней. Для показов партнёрам и школам.' },
    /* Ключ владельца: чтобы смотреть сайт целиком, не платя себе же.
       Серия 14, а не 15, — рубильник демо его не гасит. */
    owner:   { code: 1, days: 3650, price: '—',      title: 'Ключ владельца', note: 'Все игры на десять лет. Не выдавать никому.' }
  };

  /* ── кодирование ──────────────────────────────────────── */
  function enc(num, len) {
    var s = '';
    for (var i = 0; i < len; i++) { s = ALPHA[num & 31] + s; num >>= 5; }
    return s;
  }
  function dec(str) {
    var n = 0;
    for (var i = 0; i < str.length; i++) {
      var v = ALPHA.indexOf(str[i]);
      if (v < 0) return -1;
      n = n * 32 + v;
    }
    return n;
  }
  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) & 0xFFFFFFF;
    return h;
  }

  /* payload: 20 бит = план (1) + дней от эпохи (15) + серия (4) */
  function make(plan, serial) {
    var p = PLANS[plan] || PLANS.quarter;
    /* округляем вверх: иначе код на «92 дня» давал 91 — обещание в оффере
       должно выполняться буквально */
    var days = Math.ceil((Date.now() + p.days * DAY - EPOCH) / DAY);
    var num = (p.code << 19) | ((days & 0x7FFF) << 4) | ((serial || 0) & 15);
    var body = enc(num, 4);
    return 'NOOKA-' + body + '-' + enc(hash(body + SALT) & 0xFFFFF, 4);
  }

  function parse(raw) {
    var s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (s.indexOf('NOOKA') === 0) s = s.slice(5);
    if (s.length !== 8) return null;
    var body = s.slice(0, 4), sum = s.slice(4);
    if (dec(body) < 0 || dec(sum) < 0) return null;
    if (enc(hash(body + SALT) & 0xFFFFF, 4) !== sum) return null;
    var num = dec(body);
    var plan = (num >> 19) & 1 ? 'year' : 'quarter';
    var until = EPOCH + ((num >> 4) & 0x7FFF) * DAY;
    /* серия лежит в младших четырёх битах: по ней отличаем демо от продажи */
    return { code: 'NOOKA-' + body + '-' + sum, plan: plan, until: until, serial: num & 0xF };
  }

  /* ── состояние ───────────────────────────────────────── */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function state() {
    /* В режиме предпросмотра притворяемся, что оплаты нет: это единственный
       способ увидеть сайт глазами покупателя, не стирая свой ключ. */
    if (WALL_PREVIEW) return { paid: false, preview: true };
    var a = load();
    if (!a || !a.until) return { paid: false };
    /* Демо отозвали — доступ гаснет и на тех устройствах, где уже открыт:
       проверка живёт в скрипте, а он грузится с сайта при каждом заходе. */
    if (DEMO_OFF && a.serial === DEMO_SERIAL) return { paid: false, demoOff: true };
    if (a.until < Date.now()) return { paid: false, expired: true, plan: a.plan };
    /* Код отдаём наружу: на странице доступа его показывают, чтобы человек
       мог открыть игры на втором устройстве, ничего не разыскивая. */
    return { paid: true, plan: a.plan, until: a.until, code: a.code,
             days: Math.ceil((a.until - Date.now()) / DAY) };
  }

  function unlock(raw) {
    var p = parse(raw);
    if (!p) return { ok: false, why: 'Такого кода нет. Проверь буквы — их легко перепутать.' };
    if (p.until < Date.now()) return { ok: false, why: 'Срок этого кода закончился.' };
    if (DEMO_OFF && p.serial === DEMO_SERIAL) return { ok: false, why: 'Эта демо-ссылка больше не действует.' };
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
    return { ok: true, plan: p.plan, until: p.until };
  }

  /* ── можно ли играть ─────────────────────────────────── */
  function canPlay(gameKey, n) {
    if (allOpen()) return true;
    if (state().paid) return true;
    var g = window.nookaLevels && window.nookaLevels.game(gameKey);
    return !!(g && n <= (g.free || 0));
  }

  /* ── экран оплаты ────────────────────────────────────── */
  var PW_CSS =
    '.nkpw{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;' +
      'padding:20px;background:rgba(8,5,16,.86);backdrop-filter:blur(10px);' +
      "font-family:'Nunito',system-ui,sans-serif}" +
    '.nkpw__card{position:relative;width:100%;max-width:430px;max-height:92vh;overflow-y:auto;' +
      'padding:26px 24px;border-radius:28px;background:linear-gradient(180deg,#1B1330,#120D22);' +
      'box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 40px 80px -30px #000}' +
    '.nkpw__x{position:absolute;right:16px;top:16px;width:32px;height:32px;border:none;cursor:pointer;' +
      'border-radius:50%;background:rgba(255,255,255,.08);color:#C9BAE6;font-size:14px}' +
    '.nkpw__kick{font-weight:900;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#FFD84D}' +
    ".nkpw__h{font-family:'Unbounded','Nunito',system-ui,sans-serif;font-weight:700;font-size:21px;" +
      'line-height:1.25;margin:9px 0 8px;color:#F3EEFF}' +
    '.nkpw__s{font-weight:600;font-size:13px;line-height:1.5;color:#A896C9;margin:0}' +
    '.nkpw__plans{margin-top:16px;display:flex;flex-direction:column;gap:10px}' +
    '.nkpw__p{position:relative;display:block;padding:15px 17px;border-radius:20px;text-decoration:none;' +
      'background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.09)}' +
    ".nkpw__p b{font-family:'Unbounded','Nunito',system-ui,sans-serif;font-weight:900;font-size:22px;color:#F3EEFF}" +
    '.nkpw__p i{font-style:normal;margin-left:8px;font-weight:800;font-size:13px;color:#A896C9}' +
    '.nkpw__p span{display:block;margin-top:6px;font-weight:600;font-size:12px;line-height:1.45;color:#A896C9}' +
    '.nkpw__p--best{background:linear-gradient(180deg,rgba(255,216,77,.14),rgba(255,216,77,.05));' +
      'box-shadow:inset 0 0 0 1.5px rgba(255,216,77,.4)}' +
    '.nkpw__flag{position:absolute!important;right:14px;top:14px;margin:0!important;padding:4px 10px;' +
      'border-radius:999px;font-weight:900!important;font-size:10px!important;color:#33240A!important;background:#FFD84D}' +
    '.nkpw__code{margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.09)}' +
    '.nkpw__code label{display:block;font-weight:800;font-size:12px;color:#A896C9;margin-bottom:8px}' +
    '.nkpw__row{display:flex;gap:8px}' +
    '.nkpw__row input{flex:1;min-width:0;padding:13px 15px;border:none;border-radius:14px;' +
      "font-family:'Unbounded','Nunito',system-ui,sans-serif;font-weight:700;font-size:14px;letter-spacing:.06em;" +
      'color:#F3EEFF;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);outline:none}' +
    '.nkpw__row input:focus{box-shadow:inset 0 0 0 1.5px #A98BFF}' +
    ".nkpw__go{padding:13px 18px;border:none;border-radius:14px;cursor:pointer;font-family:'Unbounded','Nunito',system-ui,sans-serif;" +
      'font-weight:700;font-size:14px;color:#fff;background:linear-gradient(180deg,#9B78FF,#7B4FF2)}' +
    '.nkpw__err{min-height:17px;margin-top:8px;font-weight:700;font-size:12px}' +
    '.nkpw__err--bad{color:#FF9E8E}.nkpw__err--ok{color:#7CE9B7}' +
    '.nkpw__fine{margin-top:14px;font-weight:700;font-size:11.5px;line-height:1.5;color:#7E6E9C}' +
    '.nkpw__fine a{color:#A896C9;text-decoration:underline}';

  function paywall(opts) {
    opts = opts || {};
    if (document.getElementById('nkpw')) return;
    if (!document.getElementById('nkpw-css')) {
      var st = document.createElement('style');
      st.id = 'nkpw-css';
      st.textContent = PW_CSS;
      document.head.appendChild(st);
    }

    var w = document.createElement('div');
    w.className = 'nkpw';
    w.id = 'nkpw';
    w.innerHTML =
      '<div class="nkpw__card">' +
        '<button class="nkpw__x" aria-label="Закрыть">✕</button>' +
        '<div class="nkpw__kick">Дальше — по доступу</div>' +
        '<h2 class="nkpw__h">' + (opts.title || 'Тут заканчивается бесплатная часть') + '</h2>' +
        '<p class="nkpw__s">' + (opts.sub || 'Первая игра открыта всем целиком. Две другие — по доступу для одной семьи.') + '</p>' +
        '<div class="nkpw__plans">' +
          plan('quarter') + plan('year') +
        '</div>' +
        '<div class="nkpw__code">' +
          '<label>Код доступа уже есть</label>' +
          '<div class="nkpw__row">' +
            '<input id="nkpwIn" placeholder="NOOKA-••••-••••" autocomplete="off" spellcheck="false">' +
            '<button class="nkpw__go" id="nkpwGo">Открыть</button>' +
          '</div>' +
          '<div class="nkpw__err" id="nkpwErr"></div>' +
        '</div>' +
        '<div class="nkpw__fine">Разовая оплата, без автосписаний. Вернём деньги за 14 дней. ' +
          '<a href="' + OFERTA_URL + '" target="_blank" rel="noopener">Оферта</a></div>' +
      '</div>';
    document.body.appendChild(w);

    /* Тариф ведёт на страницу покупки, а не прямо в банк: там написано,
       что именно открывается, как придёт код и что деньги вернут. Человек,
       которого швырнули из игры сразу в форму оплаты, не платит. */
    function plan(k) {
      var p = PLANS[k];
      return '<a class="nkpw__p' + (k === 'year' ? ' nkpw__p--best' : '') + '" href="' +
        (opts.payUrl || BUY_URL) + '#' + k + '">' +
        (k === 'year' ? '<span class="nkpw__flag">Выгоднее</span>' : '') +
        '<b>' + p.price + '</b><i>' + p.title + '</i><span>' + p.note + '</span></a>';
    }

    var close = function () { w.remove(); if (opts.onClose) opts.onClose(); };
    w.querySelector('.nkpw__x').onclick = close;
    w.onclick = function (e) { if (e.target === w) close(); };

    var inp = w.querySelector('#nkpwIn'), err = w.querySelector('#nkpwErr');
    w.querySelector('#nkpwGo').onclick = function () {
      var r = unlock(inp.value);
      if (r.ok) {
        err.className = 'nkpw__err nkpw__err--ok';
        err.textContent = 'Готово. Доступ открыт.';
        setTimeout(function () { w.remove(); if (opts.onUnlock) opts.onUnlock(r); else location.reload(); }, 900);
      } else {
        err.className = 'nkpw__err nkpw__err--bad';
        err.textContent = r.why;
        inp.focus();
      }
    };
    inp.onkeydown = function (e) { if (e.key === 'Enter') w.querySelector('#nkpwGo').click(); };
  }

  /* ── какой уровень открыт на этой странице ───────────────
     Уровни живут по-разному: отдельным файлом (forge.html),
     по хешу (prompt.html#l3) или модулем Академии (ai.html?m=engine). */
  function currentLevel() {
    if (!window.nookaLevels) return null;
    var file = (location.pathname.split('/').pop() || '').toLowerCase();
    var hash = location.hash.replace('#', '').replace('!', '');
    var here = null;
    try { here = new URLSearchParams(location.search); } catch (e) {}
    var hit = null;
    window.nookaLevels.games.forEach(function (g) {
      g.levels.forEach(function (lv) {
        if (!lv.href || hit) return;
        var base = lv.href.split(/[?#]/)[0].toLowerCase();
        if (base !== file) return;
        var wantHash = (lv.href.split('#')[1] || '').replace('!', '');
        if (wantHash && wantHash !== hash) return;
        /* Сверяем все параметры адреса, а не только модуль: в одном файле
           живут несколько уровней (draw.html?n=2 … ?n=10), и без этой
           проверки платный десятый уровень считался бы вторым, бесплатным. */
        var qs = (lv.href.split('?')[1] || '').split('#')[0];
        var same = true;
        if (qs) {
          qs.split('&').forEach(function (kv) {
            if (!kv) return;
            var i = kv.indexOf('='), k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? '' : kv.slice(i + 1);
            if (!here || here.get(k) !== v) same = false;
          });
        }
        if (!same) return;
        hit = { game: g, level: lv };
      });
    });
    return hit;
  }

  /* Уровень или бонус, открытый по этому адресу. Бонусы лежат отдельно от
     levels, и без этого поиска их страницы не знают своей цели: она была
     вписана прямо в файл и расходилась с реестром при каждой правке. */
  function currentAny() {
    var hit = currentLevel();
    if (hit) return hit;
    if (!window.nookaLevels) return null;
    var file = (location.pathname.split('/').pop() || '').toLowerCase();
    var here = null;
    try { here = new URLSearchParams(location.search); } catch (e) {}
    var found = null;
    window.nookaLevels.games.forEach(function (g) {
      (g.extras || []).forEach(function (x) {
        if (found || !x.href) return;
        var base = x.href.split(/[?#]/)[0].toLowerCase();
        if (base !== file) return;
        var qs = (x.href.split('?')[1] || '').split('#')[0];
        var same = true;
        if (qs) qs.split('&').forEach(function (kv) {
          if (!kv) return;
          var i = kv.indexOf('='), k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? '' : kv.slice(i + 1);
          if (!here || here.get(k) !== v) same = false;
        });
        if (same) found = { game: g, level: x };
      });
    });
    return found;
  }

  /* Все уровни, которые живут в этом файле. Нужны, когда по адресу нельзя
     понять, какой именно уровень открыт: prompt.html держит внутри пять
     уровней и переключает их сам, без перезагрузки страницы. Тогда судим
     по файлу целиком — весь платный, значит закрыт вход, а не уровень. */
  function fileLevels() {
    var file = (location.pathname.split('/').pop() || '').toLowerCase();
    var out = [];
    if (!file || !window.nookaLevels) return out;
    window.nookaLevels.games.forEach(function (g) {
      g.levels.forEach(function (lv) {
        var f = String(lv.href || '').split(/[?#]/)[0].toLowerCase();
        if (f === file) out.push({ game: g, level: lv });
      });
    });
    return out;
  }

  /* Закрыть платный уровень, если его открыли прямой ссылкой мимо витрины */
  /* Бонусные страницы, открытые всем: мастерская загадок. По ссылке-загадке
     приходит друг, у которого доступа нет, — закрыть её значит убить обмен. */
  function isBonus() {
    try {
      var q = new URLSearchParams(location.search);
      return q.has('riddle') || q.has('q');
    } catch (e) { return false; }
  }

  function guard() {
    if (allOpen() || state().paid || isBonus()) return;
    var cur = currentLevel(), whole = false;
    if (!cur) {
      var all = fileLevels();
      if (!all.length) return;                    // страница не про уровни
      for (var i = 0; i < all.length; i++) {      // есть что играть бесплатно — пускаем
        if (canPlay(all[i].game.key, all[i].level.n)) return;
      }
      cur = all[0];                               // весь файл платный — закрываем вход
      whole = true;
    }
    if (canPlay(cur.game.key, cur.level.n)) return;
    var hub = 'game.html?g=' + cur.game.key;
    paywall({
      title: whole ? 'Эта игра — в платной части' : 'Этот уровень — в платной части',
      sub: whole
        ? 'Игра «' + cur.game.name + '» открывается по доступу. Первая игра курса бесплатна целиком.'
        : '«' + cur.level.t + '» из игры «' + cur.game.name + '». Бесплатно открыта вся первая игра.',
      onClose: function () { location.href = hub; },
      onUnlock: function () { location.reload(); }
    });
  }

  /* ── оплата: уход в PayKeeper ────────────────────────────
     Код печатается прямо здесь, в момент нажатия, и не лежит в исходнике
     страницы заранее. Одновременно кладём его в память браузера: если
     хеш по дороге потеряется, доступ включит сам факт успешной оплаты. */
  function pendMake(plan) {
    /* серии 14 и 15 заняты ключом владельца и демо — берём ниже */
    var code = make(plan, Math.floor(Math.random() * 14));
    try {
      localStorage.setItem(PEND, JSON.stringify({ code: code, plan: plan, at: Date.now() }));
    } catch (e) {}
    return code;
  }
  function pendGet() {
    try {
      var p = JSON.parse(localStorage.getItem(PEND) || 'null');
      if (!p || !p.code || Date.now() - p.at > PEND_TTL) return null;
      return p;
    } catch (e) { return null; }
  }
  function pendClear() { try { localStorage.removeItem(PEND); } catch (e) {} }

  /* Есть ли куда вести на оплату прямо сейчас */
  function canPay() { return !!PAYKEEPER; }

  function startPay(plan) {
    if (!canPay()) { window.open(TG_URL, '_blank', 'noopener'); return false; }
    var p = PLANS[plan] || PLANS.quarter;
    var code = pendMake(plan);
    var f = document.createElement('form');
    f.method = 'POST';
    f.action = PAYKEEPER;
    f.acceptCharset = 'utf-8';
    f.style.display = 'none';
    function add(name, value) {
      var i = document.createElement('input');
      i.type = 'hidden'; i.name = name; i.value = value;
      f.appendChild(i);
    }
    add('sum', String(p.rub));
    add('orderid', 'NK-' + Date.now().toString(36).toUpperCase());
    add('service_name', 'Доступ к играм Nooka — ' + p.title.toLowerCase());
    add('user_result_callback', RETURN_URL + '#' + code);
    document.body.appendChild(f);
    f.submit();
    return true;
  }

  /* ── возвращение из платёжки ─────────────────────────────
     PayKeeper дописывает к адресу ?payment_id=…&clientid=…&result=success.
     Если он склеил адрес тупо, всё это уехало в хеш следом за кодом —
     поэтому ищем параметры и там, и там. */
  function payReturn() {
    var q = null, hq = null, code = '';
    try { q = new URLSearchParams(location.search); } catch (e) {}
    var hash = (location.hash || '').replace(/^#/, '');
    var cut = hash.indexOf('?');
    if (cut >= 0) {
      code = hash.slice(0, cut);
      try { hq = new URLSearchParams(hash.slice(cut + 1)); } catch (e) {}
    } else code = hash;

    function par(k) {
      var v = q && q.get(k); if (v) return v;
      v = hq && hq.get(k); return v || '';
    }
    var result = par('result'), pid = par('payment_id');
    if (!result && !pid) return null;          // это не возврат из платёжки

    /* Адрес чистим всегда: в clientid лежит имя плательщика, а имени
       не место ни в адресной строке, ни в чужом скриншоте. */
    function wipe() {
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
    }

    if (result === 'fail') { wipe(); return { ok: false, failed: true }; }

    var pend = pendGet();
    var use = parse(code) ? code : (pend ? pend.code : '');
    if (!use) { wipe(); return { ok: false, lost: true }; }

    var r = unlock(use);
    wipe();
    if (r.ok) { pendClear(); return { ok: true, code: use, plan: r.plan, until: r.until }; }
    return { ok: false, why: r.why };
  }

  /* ── доступ по ссылке ────────────────────────────────────
     Код можно передать не только руками, но и адресом: ?k=NOOKA-XXXX-YYYY.
     Сразу после разбора чистим адрес — чтобы код не уезжал дальше вместе
     со скриншотом или скопированной строкой браузера. */
  function fromLink() {
    var q = null;
    try { q = new URLSearchParams(location.search); } catch (e) { return null; }
    var k = q.get('k') || q.get('code');
    if (!k) return null;
    var r = unlock(k);
    try {
      q.delete('k'); q.delete('code');
      var qs = q.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    } catch (e) {}
    if (r.ok) toast('Доступ открыт: все три игры');
    else toast(r.why);
    return r;
  }

  function toast(text) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:10000;' +
      'max-width:calc(100% - 32px);padding:12px 18px;border-radius:16px;background:#150F2E;color:#FFF6DC;' +
      "font:700 15px/1.3 'Nunito',system-ui,sans-serif;box-shadow:0 14px 34px rgba(0,0,0,.45);" +
      'border:1.5px solid rgba(255,216,77,.55);text-align:center';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 4200);
  }

  var payResult = null;

  /* Метка режима. Без неё владелец, открывший превью и забывший о нём,
     решит, что потерял доступ, — и полезет чинить то, что не сломано. */
  function previewBadge() {
    if (!WALL_PREVIEW || document.getElementById('nkprev')) return;
    var off = location.pathname + '?wall=0';
    var el = document.createElement('div');
    el.id = 'nkprev';
    /* nowrap обязателен: на телефоне текст иначе встаёт в четыре строки
       и плашка превращается в кляксу поверх страницы */
    el.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:10001;' +
      'display:flex;align-items:center;gap:11px;white-space:nowrap;' +
      'padding:10px 15px;border-radius:999px;background:#150F2E;color:#FFF6DC;' +
      "font:800 12.5px/1.2 'Nunito',system-ui,sans-serif;box-shadow:0 14px 34px rgba(0,0,0,.45);" +
      'border:1.5px solid rgba(255,216,77,.55)';
    el.innerHTML = '<span>Вид как у родителя без оплаты</span>' +
      '<a href="' + off + '" style="color:#FFD84D;text-decoration:underline;white-space:nowrap">Выключить</a>';
    document.body.appendChild(el);
  }

  function boot() {
    /* Сначала возврат из платёжки, потом ссылка с кодом: если человек
       вернулся с оплаты, стена не должна успеть моргнуть ему в лицо. */
    payResult = payReturn();
    fromLink();      // ссылка работает и до включения стены: доступ ляжет впрок
    guard();
    previewBadge();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);

  window.nookaAccess = {
    openAll: allOpen(),
    wallPreview: WALL_PREVIEW,
    tgUrl: TG_URL,
    buyUrl: BUY_URL,             // куда вести кнопку «купить» — на страницу покупки
    accessUrl: ACCESS_URL,
    ofertaUrl: OFERTA_URL,
    /* Автомат включён ровно тогда, когда задан адрес формы PayKeeper.
       От этого зависят и кнопки, и то, что обещано покупателю. */
    canPay: canPay,
    delivery: canPay() ? 'auto' : 'manual',
    deliveryWait: DELIVERY_WAIT,
    startPay: startPay,
    /* Итог возврата из платёжки: считается на загрузке, поэтому отдаём
       геттером — свойство было бы снято раньше, чем boot отработает. */
    payInfo: function () { return payResult; },
    pendGet: pendGet,
    demoSerial: DEMO_SERIAL,
    demoOff: DEMO_OFF,
    fromLink: fromLink,
    currentLevel: currentLevel,
    currentAny: currentAny,
    fileLevels: fileLevels,
    guard: guard,
    plans: PLANS,
    state: state,
    canPlay: canPlay,
    isBonus: isBonus,
    unlock: unlock,
    paywall: paywall,
    make: make,        // для tools/codes.html
    parse: parse,
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
})();
