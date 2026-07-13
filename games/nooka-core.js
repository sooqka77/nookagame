/* Nooka Core — общий профиль игрока (XP, миссии, звание, стрик).
   Живёт в localStorage домена nookagame.ru — общий для всех игр. */
(function () {
  var KEY = 'nooka_profile';

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

  window.nooka = {
    profile: load,

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
    missionWin: function (id, xp, opts) {
      var isNew = this.completeMission(id, xp);
      this.celebrate(isNew ? (xp || 60) : 0, opts || {});
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
        '#nooka-win .nk-emo{font-size:64px;line-height:1;animation:nkBounce 1.6s ease-in-out infinite}' +
        '#nooka-win .nk-title{font-weight:700;font-size:24px;margin:10px 0 4px}' +
        '#nooka-win .nk-xp{display:inline-block;background:#FFE141;border-radius:30px;padding:7px 20px;font-weight:700;font-size:20px;margin:10px 0 4px}' +
        '#nooka-win .nk-rank{font-size:14px;color:#6B7280;margin:8px 0 2px}' +
        '#nooka-win .nk-bar{height:10px;background:#EDE9FE;border-radius:8px;overflow:hidden;margin:8px 0 16px}' +
        '#nooka-win .nk-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7B2FFF,#A855F7);border-radius:8px;transition:width 1s .3s}' +
        '#nooka-win .nk-show{font-size:13.5px;color:#6B7280;margin-bottom:16px}' +
        '#nooka-win .nk-next{display:block;width:100%;background:#7B2FFF;color:#fff;border:none;border-radius:16px;padding:14px;' +
        'font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px}' +
        '#nooka-win .nk-base{display:block;color:#7B2FFF;font-weight:700;font-size:14px;text-decoration:none;padding:8px}' +
        '#nooka-win canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}';

      var wrap = document.createElement('div');
      wrap.id = 'nooka-win';
      wrap.innerHTML = '<style>' + css + '</style><canvas></canvas><div class="nk-card">' +
        '<div class="nk-emo">' + (gained ? '🏆' : '💪') + '</div>' +
        '<div class="nk-title">' + (opts.title || (gained ? 'Миссия пройдена!' : 'Отличная тренировка!')) + '</div>' +
        (gained ? '<div class="nk-xp">+' + gained + ' XP</div>' : '') +
        '<div class="nk-rank">' + rank.emoji + ' ' + rank.name +
        (rank.next ? ' · до звания «' + rank.next.name + '» — ' + (rank.next.at - total) + ' XP' : ' · высшее звание!') + '</div>' +
        '<div class="nk-bar"><i></i></div>' +
        '<div class="nk-show">Покажи родителям, что у тебя получилось! 👀</div>' +
        '<button class="nk-next">' + (opts.nextLabel || 'Дальше →') + '</button>' +
        '<a class="nk-base" href="../base/">🚀 Моя база</a></div>';
      document.body.appendChild(wrap);

      var pct = rank.next ? Math.min(100, Math.round((total - rank.at) / (rank.next.at - rank.at) * 100)) : 100;
      requestAnimationFrame(function () { wrap.querySelector('.nk-bar i').style.width = pct + '%'; });

      wrap.querySelector('.nk-next').onclick = function () {
        wrap.remove();
        if (opts.onNext) opts.onNext();
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
