/* ============================================================
   NOOKA ACCOUNT — аккаунт родителя: вход по почте, сессия.

   Сервер — api.nookagame.ru (репозиторий nookagame-api). Сессия
   живёт в cookie, которую скрипт не видит и не может украсть:
   страница только спрашивает сервер «кто вошёл».

   Закрыть страницу от гостей — одна строка в <head>:
     <script src="../games/nooka-account.js" data-require-login></script>
   Страница не показывается, пока сервер не ответит. Нет входа —
   уходим на /login/ и возвращаемся сюда же после кода.

   В разметке:
     data-nk-email   — сюда подставится почта вошедшего
     data-nk-logout  — по клику выход и переход на главную
     (оба элемента можно держать hidden — покажутся после входа)

   Пользуются: login/, base/index.html, base/report.html
   ============================================================ */
(function () {

  /* Локально сервер крутится рядом на :8787. Имя хоста берём как есть:
     localhost и 127.0.0.1 для браузера разные сайты, и cookie
     с одного на другой не поедет. */
  var API = (function () {
    var h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return 'http://' + h + ':8787';
    return 'https://api.nookagame.ru';
  })();

  var LOGIN_URL = '/login/';

  /* Ответ всегда один формат: { ok, status, data }. Нет сети — status 0. */
  function call(method, path, body) {
    var opts = { method: method, credentials: 'include', headers: {} };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(API + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        return { ok: r.ok, status: r.status, data: data };
      });
    }, function () {
      return { ok: false, status: 0, data: { error: 'network' } };
    });
  }

  /* Кто вошёл: пользователь, null (не вошёл) или ошибка связи.
     Спрашиваем один раз за заход на страницу. */
  var mePromise = null;
  function me(fresh) {
    if (!mePromise || fresh) {
      mePromise = call('GET', '/auth/me').then(function (r) {
        if (r.ok) return r.data.user;
        if (r.status === 401) return null;
        throw r;
      });
    }
    return mePromise;
  }

  /* Куда вернуться после входа. Только свой сайт: иначе ссылкой
     /login/?next=https://чужой.сайт можно увести человека после входа. */
  function safeNext(raw) {
    var s = String(raw || '');
    if (s.charAt(0) !== '/' || s.charAt(1) === '/' || s.charAt(1) === '\\') return '/base/';
    return s;
  }

  function goLogin() {
    var here = location.pathname + location.search + location.hash;
    location.replace(LOGIN_URL + '?next=' + encodeURIComponent(here));
  }

  function logout() {
    return call('POST', '/auth/logout', {}).then(function () { mePromise = null; });
  }

  function fillPage(user) {
    document.querySelectorAll('[data-nk-email]').forEach(function (el) {
      el.textContent = user.email;
      el.hidden = false;
    });
    document.querySelectorAll('[data-nk-logout]').forEach(function (el) {
      el.hidden = false;
      el.addEventListener('click', function (e) {
        e.preventDefault();
        logout().then(function () { location.href = '/'; });
      });
    });
  }

  /* Сервер не ответил. Не выкидываем на вход — вдруг человек уже вошёл,
     просто пропал интернет, — а честно говорим, что случилось. */
  function showOffline() {
    var box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'visibility:visible;position:fixed;inset:0;display:flex;align-items:center;' +
      'justify-content:center;padding:24px;background:#FFF4E4;font-family:Nunito,system-ui,sans-serif;' +
      'color:#2D1B45;text-align:center;z-index:99999';
    box.innerHTML = '<div style="max-width:360px"><p style="font-weight:800;font-size:18px;margin:0 0 8px">' +
      'Не получилось связаться с сервером</p><p style="font-weight:700;font-size:15px;color:#6B5680;' +
      'margin:0 0 18px;line-height:1.5">Проверьте интернет и обновите страницу.</p>' +
      '<button type="button" style="border:none;border-radius:999px;padding:13px 24px;font:800 15px Nunito,' +
      'system-ui,sans-serif;color:#fff;background:#7B4FF2;cursor:pointer">Обновить</button></div>';
    box.querySelector('button').onclick = function () { location.reload(); };
    document.body.appendChild(box);
  }

  function whenBody(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function requireLogin() {
    var root = document.documentElement;
    root.style.visibility = 'hidden';   // ни кадра чужого прогресса до ответа сервера
    return me().then(function (user) {
      if (!user) { goLogin(); return null; }
      whenBody(function () { fillPage(user); root.style.visibility = ''; });
      return user;
    }, function () {
      whenBody(showOffline);
      return null;
    });
  }

  var script = document.currentScript;
  var ready = script && script.hasAttribute('data-require-login') ? requireLogin() : null;

  window.nookaAccount = {
    api: API,
    me: me,
    ready: ready,
    safeNext: safeNext,
    logout: logout,
    requestCode: function (email) { return call('POST', '/auth/request', { email: email }); },
    verifyCode: function (email, code) {
      return call('POST', '/auth/verify', { email: email, code: code }).then(function (r) {
        if (r.ok) mePromise = Promise.resolve(r.data.user);
        return r;
      });
    }
  };
})();
