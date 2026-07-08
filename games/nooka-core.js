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
