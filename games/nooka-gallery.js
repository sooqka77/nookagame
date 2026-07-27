/* Nooka Gallery — коллекция того, что ребёнок создал сам.
   Живёт в localStorage рядом с профилем и общая для всех игр.
   Артефакт хранится готовой SVG-строкой: галерея умеет показать что угодно,
   не зная, какая игра это сделала. */
(function () {
  var KEY = 'nooka_gallery';
  var LIMIT = 80;          // хватает надолго, но не раздувает localStorage

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) {                       // место кончилось — жертвуем самым старым
      if (list.length > 1) { list.shift(); return save(list); }
      return false;
    }
  }

  window.nookaGallery = {
    /* a = { kind, title, note, svg, game } */
    add: function (a) {
      var list = load();
      var item = {
        id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        kind: a.kind || 'item',        // item | pet | poster | recipe | scan | tune | forecast
        title: a.title || 'Без названия',
        note: a.note || '',            // чему научился — это читает родитель
        svg: a.svg || '',
        game: a.game || '',
        at: Date.now()
      };
      list.push(item);
      while (list.length > LIMIT) list.shift();
      save(list);
      return item.id;
    },

    all: function () { return load().slice().reverse(); },   // новое сверху
    count: function () { return load().length; },
    get: function (id) {
      var l = load();
      for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
      return null;
    },
    remove: function (id) {
      save(load().filter(function (x) { return x.id !== id; }));
    },

    /* сколько разных видов артефактов собрано — для «коллекционера» в профиле */
    kinds: function () {
      var s = {};
      load().forEach(function (x) { s[x.kind] = (s[x.kind] || 0) + 1; });
      return s;
    }
  };
})();
