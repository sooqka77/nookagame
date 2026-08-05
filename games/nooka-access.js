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
     OPEN_ALL = false — работает платная стена: бесплатны только
                        уровни 1–5 первой игры (поле free в реестре)     */
  var OPEN_ALL = true;   // ← в день старта продаж поменять на false

  var KEY = 'nooka_access';
  var ALPHA = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';   // без 0/O/1/I — чтобы диктовать по телефону
  var SALT = 'nooka-2026-ai-literacy';
  var EPOCH = Date.UTC(2026, 0, 1);                  // 01.01.2026
  var DAY = 86400000;

  var PLANS = {
    quarter: { code: 0, days: 92,  price: '490 ₽',  title: 'Три месяца', note: 'Три игры, 30 уровней. Продлевать не нужно: срок вышел — доступ закрылся сам.' },
    year:    { code: 1, days: 366, price: '1450 ₽', title: 'Год',        note: 'Те же три игры на 12 месяцев плюс все новые игры платформы, которые выйдут за год.' }
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
    var days = Math.floor((Date.now() + p.days * DAY - EPOCH) / DAY);
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
    return { code: 'NOOKA-' + body + '-' + sum, plan: plan, until: until };
  }

  /* ── состояние ───────────────────────────────────────── */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function state() {
    var a = load();
    if (!a || !a.until) return { paid: false };
    if (a.until < Date.now()) return { paid: false, expired: true, plan: a.plan };
    return { paid: true, plan: a.plan, until: a.until, days: Math.ceil((a.until - Date.now()) / DAY) };
  }

  function unlock(raw) {
    var p = parse(raw);
    if (!p) return { ok: false, why: 'Такого кода нет. Проверь буквы — их легко перепутать.' };
    if (p.until < Date.now()) return { ok: false, why: 'Срок этого кода закончился.' };
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
    return { ok: true, plan: p.plan, until: p.until };
  }

  /* ── можно ли играть ─────────────────────────────────── */
  function canPlay(gameKey, n) {
    if (OPEN_ALL) return true;
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
    '.nkpw__err--bad{color:#FF9E8E}.nkpw__err--ok{color:#7CE9B7}';

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
        '<p class="nkpw__s">' + (opts.sub || 'Пять уровней первой игры открыты всем. Остальные 25 — по доступу для одной семьи.') + '</p>' +
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
      '</div>';
    document.body.appendChild(w);

    function plan(k) {
      var p = PLANS[k];
      return '<a class="nkpw__p' + (k === 'year' ? ' nkpw__p--best' : '') + '" href="' +
        (opts.payUrl || '../index.html#plans') + '">' +
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
    var mod = null;
    try { mod = new URLSearchParams(location.search).get('m'); } catch (e) {}
    var hit = null;
    window.nookaLevels.games.forEach(function (g) {
      g.levels.forEach(function (lv) {
        if (!lv.href || hit) return;
        var base = lv.href.split(/[?#]/)[0].toLowerCase();
        if (base !== file) return;
        var wantHash = (lv.href.split('#')[1] || '').replace('!', '');
        var wantMod = null;
        var qs = lv.href.split('?')[1];
        if (qs) { var mm = qs.split('#')[0].match(/(?:^|&)m=([^&]+)/); if (mm) wantMod = mm[1]; }
        if (wantHash && wantHash !== hash) return;
        if (wantMod && wantMod !== mod) return;
        hit = { game: g, level: lv };
      });
    });
    return hit;
  }

  /* Закрыть платный уровень, если его открыли прямой ссылкой мимо витрины */
  function guard() {
    if (OPEN_ALL || state().paid) return;
    var cur = currentLevel();
    if (!cur || canPlay(cur.game.key, cur.level.n)) return;
    var hub = 'game.html?g=' + cur.game.key;
    paywall({
      title: 'Этот уровень — в платной части',
      sub: '«' + cur.level.t + '» из игры «' + cur.game.name + '». Бесплатны первые пять уровней первой игры.',
      onClose: function () { location.href = hub; },
      onUnlock: function () { location.reload(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guard);
  else setTimeout(guard, 0);

  window.nookaAccess = {
    openAll: OPEN_ALL,
    currentLevel: currentLevel,
    guard: guard,
    plans: PLANS,
    state: state,
    canPlay: canPlay,
    unlock: unlock,
    paywall: paywall,
    make: make,        // для tools/codes.html
    parse: parse,
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
})();
