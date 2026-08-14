/* Nooka Core — общий профиль игрока (XP, миссии, звание, стрик).
   Живёт в localStorage домена nookagame.ru — общий для всех игр. */
(function () {
  var KEY = 'nooka_profile';
  var beatShown = {};   // напоминания, уже показанные за этот заход в уровень

  function load() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    p.xp = p.xp || 0;
    p.missions = p.missions || {};
    p.days = p.days || [];
    return p;
  }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function dstr(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  var RANKS = [
    [0, 'Кадет', '🎒'],
    [150, 'Пилот', '🚀'],
    [400, 'Инженер', '🔧'],
    [900, 'Командир', '🎖️'],
    [1800, 'Капитан базы', '👑']
  ];

  /* Значки вместо эмодзи: одинаково выглядят на любом телефоне и держат стиль базы.
     Рисуются линией, цвет наследуют от текста. */
  function svg(body, size) {
    return '<svg class="nk-ico" viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) +
      '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
      body + '</svg>';
  }
  var ICONS = {
    'Кадет':        '<rect x="4" y="8" width="16" height="13" rx="4"/><path d="M8.5 8V6.5A3.5 3.5 0 0 1 12 3a3.5 3.5 0 0 1 3.5 3.5V8"/><rect x="9" y="14" width="6" height="7" rx="1.6"/>',
    'Пилот':        '<path d="M12 3c3 2.5 4.5 5.8 4.5 9L12 17l-4.5-5c0-3.2 1.5-6.5 4.5-9Z"/><circle cx="12" cy="10" r="1.6"/><path d="M8 18l-2 3 3.5-1M16 18l2 3-3.5-1"/>',
    'Инженер':      '<path d="M15.5 4.5a4.5 4.5 0 0 0-5.6 5.7L4 16.1V20h3.9l5.9-5.9a4.5 4.5 0 0 0 5.7-5.6l-2.7 2.7-2.3-.5-.5-2.3 2.5-2.9Z"/>',
    'Командир':     '<circle cx="12" cy="14.5" r="5"/><path d="M12 12.6l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 14.7l2-.3.9-1.8Z"/><path d="M8.5 9.5 7 3h10l-1.5 6.5"/>',
    'Капитан базы': '<path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.6 10H5.6L4 8Z"/><path d="M5.6 20h12.8"/>',
    'огонь':        '<path d="M12 3c.4 3-1.2 4.2-2.6 5.6C7.9 10.1 7 11.6 7 13.6 7 17 9.3 20 12 20s5-3 5-6.4c0-1.6-.7-2.9-1.7-4.1-.6 1-1.4 1.6-2.1 1.7.6-2.3.4-5-1.2-8.2Z"/>',
    'колба':        '<path d="M9 3h6M10 3v6.2L4.8 18A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-3L14 9.2V3"/><path d="M7.5 15h9"/>',
    'молния':       '<path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z"/>',
    'джойстик':     '<rect x="2.5" y="7.5" width="19" height="11" rx="4"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="12" r="1.1"/><circle cx="18.5" cy="14.5" r="1.1"/>',
    'победа':       '<path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3"/><path d="M12 12v4M9 20h6M10 17h4"/>',
    'тренировка':   '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>'
  };
  function icon(name, size) { return ICONS[name] ? svg(ICONS[name], size) : ''; }

  window.nooka = {
    icon: icon,
    profile: load,

    /* Склонение существительного при числе: 1 выстрел, 2 выстрела, 5 выстрелов.
       Без неё в играх появлялись «раз(а)» и «1 выстрелов». */
    plural: function (n, one, few, many) {
      var a = Math.abs(n) % 100, b = a % 10;
      if (a > 10 && a < 20) return many;
      if (b > 1 && b < 5) return few;
      if (b === 1) return one;
      return many;
    },

    addXP: function (n) { var p = load(); p.xp += n; save(p); return p.xp; },

    // Отметить миссию пройденной. XP начисляется один раз, день идёт в стрик всегда.
    completeMission: function (id, xp) {
      var p = load();
      var t = dstr(new Date());
      if (p.days.indexOf(t) < 0) p.days.push(t);
      var isNew = !p.missions[id];
      if (isNew) { p.missions[id] = Date.now(); p.xp += (xp || 60); }
      save(p);
      return isNew;
    },

    // Номера пройденных миссий с данным префиксом: getCompleted('chem') -> [1,3]
    getCompleted: function (prefix) {
      var p = load(), out = [];
      for (var k in p.missions) {
        if (k.indexOf(prefix) === 0) {
          var n = parseInt(k.slice(prefix.length), 10);
          if (!isNaN(n)) out.push(n);
        }
      }
      return out;
    },

    // Суммарный XP: профиль + Нейро Академия (своё хранилище aiq5_gs)
    totalXP: function () {
      var xp = load().xp;
      try {
        var g = JSON.parse(localStorage.getItem('aiq5_gs'));
        if (g && g.xp) xp += g.xp;
      } catch (e) {}
      return xp;
    },

    getRank: function (xp) {
      if (xp == null) xp = this.totalXP();
      var r = RANKS[0], next = null;
      for (var i = 0; i < RANKS.length; i++) {
        if (xp >= RANKS[i][0]) r = RANKS[i];
        else { next = RANKS[i]; break; }
      }
      return { name: r[1], emoji: r[2], at: r[0], next: next ? { name: next[1], at: next[0] } : null, xp: xp };
    },

    // Миссия пройдена + красочный экран победы (конфетти, XP, звание)
    /* Напоминание в середине уровня. Вызывается из уровня в тот момент, когда
       ребёнок только что сделал ключевое действие руками: тогда фраза попадает
       в живой опыт, а не читается как текст на экране. Показывается один раз
       за заход, уходит по тапу или сама через восемь секунд.
       Текст короткий — длинный превращает уровень в лекцию. */
    beat: function (text) {
      if (!text || document.getElementById('nooka-beat')) return;
      if (beatShown[text]) return;
      beatShown[text] = 1;

      var el = document.createElement('div');
      el.id = 'nooka-beat';
      el.innerHTML =
        '<style>' +
        '#nooka-beat{position:fixed;left:12px;right:12px;bottom:14px;z-index:9998;display:flex;justify-content:center;' +
        'pointer-events:none;animation:nkBeatIn .38s cubic-bezier(.34,1.4,.64,1)}' +
        '#nooka-beat.out{animation:nkBeatOut .3s ease forwards}' +
        '#nooka-beat .nkb{pointer-events:auto;cursor:pointer;max-width:460px;width:100%;display:flex;gap:12px;align-items:flex-start;' +
        'background:#150F2E;border:1.5px solid rgba(255,216,77,.55);border-radius:18px;padding:13px 15px;' +
        'box-shadow:0 14px 34px rgba(0,0,0,.45);font-family:\'Space Grotesk\',system-ui,sans-serif}' +
        '#nooka-beat i{flex:none;width:5px;align-self:stretch;background:#FFD84D;border-radius:4px}' +
        '#nooka-beat span{display:block;font-size:17px;line-height:1.3;font-weight:700;color:#FFF6DC}' +
        '@keyframes nkBeatIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}' +
        '@keyframes nkBeatOut{to{opacity:0;transform:translateY(14px)}}' +
        '</style><div class="nkb"><i></i><span>' + text + '</span></div>';
      document.body.appendChild(el);

      var gone = false;
      function hide() {
        if (gone) return;
        gone = true;
        el.className = 'out';
        setTimeout(function () { el.remove(); }, 300);
      }
      el.querySelector('.nkb').onclick = hide;
      setTimeout(hide, 8000);
    },

    missionWin: function (id, xp, opts) {
      var isNew = this.completeMission(id, xp);
      opts = opts || {};
      opts.mid = id;                       // чтобы celebrate нашёл игру в реестре
      this.celebrate(isNew ? (xp || 60) : 0, opts);
      return isNew;
    },

    // Оверлей победы. gained=0 — повторное прохождение (без XP)
    celebrate: function (gained, opts) {
      var self = this;
      var total = self.totalXP();
      var rank = self.getRank(total);
      var old = document.getElementById('nooka-win');
      if (old) old.remove();

      var css = '#nooka-win{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
        'background:rgba(17,17,24,.78);backdrop-filter:blur(6px);animation:nkFade .3s}' +
        '@keyframes nkFade{from{opacity:0}to{opacity:1}}' +
        '@keyframes nkPop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}' +
        '@keyframes nkBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}' +
        '#nooka-win .nk-card{position:relative;background:#fff;border-radius:28px;padding:34px 30px 26px;max-width:340px;width:calc(100% - 40px);' +
        'text-align:center;animation:nkPop .45s cubic-bezier(.34,1.56,.64,1);font-family:\'Space Grotesk\',system-ui,sans-serif;color:#111118}' +
        '#nooka-win .nk-emo{line-height:0;color:#7B2FFF;animation:nkBounce 1.6s ease-in-out infinite}' +
        '#nooka-win .nk-rank .nk-ico{vertical-align:-3px;margin-right:2px}' +
        '#nooka-win .nk-title{font-weight:700;font-size:24px;margin:10px 0 4px}' +
        '#nooka-win .nk-xp{display:inline-block;background:#FFE141;border-radius:30px;padding:7px 20px;font-weight:700;font-size:20px;margin:10px 0 4px}' +
        '#nooka-win .nk-rank{font-size:14px;color:#6B7280;margin:8px 0 2px}' +
        '#nooka-win .nk-bar{height:10px;background:#EDE9FE;border-radius:8px;overflow:hidden;margin:8px 0 16px}' +
        '#nooka-win .nk-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7B2FFF,#A855F7);border-radius:8px;transition:width 1s .3s}' +
        '#nooka-win .nk-now{background:#FFF6DC;border:1.5px solid #FFD84D;border-radius:16px;padding:12px 14px;margin:2px 0 14px}' +
        '#nooka-win .nk-now b{display:block;font-size:10.5px;letter-spacing:1.2px;color:#A9791B;margin-bottom:5px}' +
        '#nooka-win .nk-now span{display:block;font-size:18px;line-height:1.25;font-weight:700;color:#111118}' +
        '#nooka-win .nk-show{font-size:13.5px;color:#6B7280;margin-bottom:16px}' +
        '#nooka-win .nk-next{display:block;width:100%;background:#7B2FFF;color:#fff;border:none;border-radius:16px;padding:14px;' +
        'font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px}' +
        '#nooka-win .nk-base{display:block;color:#7B2FFF;font-weight:700;font-size:14px;text-decoration:none;padding:8px}' +
        '#nooka-win canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}';

      /* Куда вести после победы. Ребёнку восьми лет некуда ткнуть, если
         экран победы никуда не ведёт, — поэтому кнопка сама открывает
         следующий уровень этой же игры, а ссылка ниже возвращает к списку.
         Сам уровень никуда не уводит: любой переход тут только по клику. */
      var hub = { href: '../base/', label: '\u041c\u043e\u044f \u0431\u0430\u0437\u0430' };
      var next = null, hasArt = false, now = '';
      try {
        if (window.nookaLevels && opts.mid) {
          window.nookaLevels.games.forEach(function (g) {
            g.levels.forEach(function (lv, i) {
              if (lv.mid !== opts.mid && lv.aim !== opts.mid) return;
              hub.href = 'game.html?g=' + g.key;
              hub.label = '\u041a \u0443\u0440\u043e\u0432\u043d\u044f\u043c: ' + g.name;
              hasArt = !!lv.art;
              now = lv.now || '';
              var nx = g.levels[i + 1];
              if (nx && nx.href) next = { href: nx.href, title: nx.t };
            });
          });
        }
      } catch (e) {}

      var wrap = document.createElement('div');
      wrap.id = 'nooka-win';
      wrap.innerHTML = '<style>' + css + '</style><canvas></canvas><div class="nk-card">' +
        '<div class="nk-emo">' + icon(gained ? 'победа' : 'тренировка', 54) + '</div>' +
        '<div class="nk-title">' + (opts.title || (gained ? 'Миссия пройдена!' : 'Отличная тренировка!')) + '</div>' +
        (gained ? '<div class="nk-xp">+' + gained + ' XP</div>' : '') +
        '<div class="nk-rank">' + icon(rank.name, 18) + ' ' + rank.name +
        (rank.next ? ' · до звания «' + rank.next.name + '» — ' + (rank.next.at - total) + ' XP' : ' · высшее звание!') + '</div>' +
        '<div class="nk-bar"><i></i></div>' +
        /* Сверка с целью уровня: в начале было «чему учимся», здесь — «вот это ты
           теперь умеешь». Без неё уровень запоминается как игра, а знание из него
           не достаётся. Фраза в инфинитиве — она одинаково читается и мальчику,
           и девочке. Берётся из реестра, поля нет — блок не показывается. */
        (now ? '<div class="nk-now"><b>ТЕПЕРЬ ТЫ ЭТО УМЕЕШЬ</b><span>' + now + '</span></div>' : '') +
        '<div class="nk-show">Покажи родителям, что у тебя получилось</div>' +
        '<button class="nk-next">' + (opts.nextLabel ||
            (next ? 'Дальше: ' + next.title + ' \u2192' : '\u041a \u0443\u0440\u043e\u0432\u043d\u044f\u043c \u2192')) + '</button>' +
        '<a class="nk-base" href="' + hub.href + '">' + hub.label + '</a>' +
        (hasArt ? '<a class="nk-base" href="../base/index.html#gallery">\u0412 \u043a\u043e\u043b\u043b\u0435\u043a\u0446\u0438\u044e</a>' : '') +
        '</div>';
      document.body.appendChild(wrap);

      var pct = rank.next ? Math.min(100, Math.round((total - rank.at) / (rank.next.at - rank.at) * 100)) : 100;
      requestAnimationFrame(function () { wrap.querySelector('.nk-bar i').style.width = pct + '%'; });

      wrap.querySelector('.nk-next').onclick = function () {
        if (opts.onNext) { wrap.remove(); opts.onNext(); return; }
        window.location.href = next ? next.href : hub.href;
      };

      // конфетти
      var cv = wrap.querySelector('canvas'), cx = cv.getContext('2d');
      cv.width = innerWidth; cv.height = innerHeight;
      var colors = ['#7B2FFF', '#FFE141', '#FF5038', '#00C27C', '#3B82F6', '#A855F7'];
      var parts = [];
      for (var i = 0; i < 140; i++) parts.push({
        x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5,
        w: 6 + Math.random() * 8, h: 8 + Math.random() * 10,
        c: colors[i % colors.length], vy: 2 + Math.random() * 3.5,
        vx: -1 + Math.random() * 2, r: Math.random() * Math.PI, vr: -0.1 + Math.random() * 0.2
      });
      var t0 = Date.now();
      (function tick() {
        if (!document.getElementById('nooka-win')) return;
        cx.clearRect(0, 0, cv.width, cv.height);
        parts.forEach(function (p) {
          p.y += p.vy; p.x += p.vx + Math.sin(p.y / 40); p.r += p.vr;
          cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
          cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
        });
        if (Date.now() - t0 < 6000) requestAnimationFrame(tick);
        else cx.clearRect(0, 0, cv.width, cv.height);
      })();
    },

    // Дней подряд (сегодня или вчера — стрик жив)
    streak: function () {
      var days = load().days;
      if (!days.length) return 0;
      var set = {};
      days.forEach(function (d) { set[d] = 1; });
      var d = new Date();
      if (!set[dstr(d)]) {
        d.setDate(d.getDate() - 1);
        if (!set[dstr(d)]) return 0;
      }
      var n = 0;
      while (set[dstr(d)]) { n++; d.setDate(d.getDate() - 1); }
      return n;
    }
  };
})();

/* Отладочный автопилот для скриншотов: ?nkauto=Текст1|Текст2 — кликает кнопки по тексту с шагом 700мс. В обычной игре не активируется. */
(function () {
  try {
    var q = new URLSearchParams(location.search);
    var seq = q.get('nkauto');
    if (!seq) return;
    seq.split('|').forEach(function (txt, i) {
      setTimeout(function () {
        var bs = Array.prototype.slice.call(document.querySelectorAll('button')).filter(function (b) { return b.textContent.indexOf(txt) >= 0 && !b.disabled; });
        if (bs.length) bs[bs.length - 1].click();
      }, 700 * (i + 1));
    });
  } catch (e) {}
})();
