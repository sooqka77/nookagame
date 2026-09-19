/* ============================================================
   СТРАНИЦА ВХОДА — два шага: почта, потом код из письма.

   Пароля нет намеренно: родителю не нужно его придумывать,
   забывать и восстанавливать. Почта сама подтверждает, что это он.

   Требует nooka-account.js. Пользуется: login/index.html
   ============================================================ */
(function () {
  var A = window.nookaAccount;
  var $ = function (id) { return document.getElementById(id); };

  var params = new URLSearchParams(location.search);
  var next = A.safeNext(params.get('next'));

  var email = '';
  var timer = null;

  function plural(n, one, few, many) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
    return many;
  }

  function why(r) {
    var d = r.data || {};
    switch (d.error) {
      case 'bad_email': return 'В адресе почты, кажется, опечатка. Проверьте его.';
      case 'too_soon': return 'Код уже отправлен. Новый можно попросить через ' + d.retryAfter + ' с.';
      case 'too_many': return 'Слишком много кодов подряд. Попробуйте через час.';
      case 'mail_failed': return 'Не получилось отправить письмо. Попробуйте через пару минут.';
      case 'wrong_code':
        return d.attemptsLeft
          ? 'Код не подходит. ' + plural(d.attemptsLeft, 'Осталась', 'Осталось', 'Осталось') + ' ' +
            d.attemptsLeft + ' ' + plural(d.attemptsLeft, 'попытка', 'попытки', 'попыток') + '.'
          : 'Код не подходит, попытки закончились. Попросите новый код.';
      case 'too_many_attempts': return 'Попытки закончились. Попросите новый код.';
      case 'code_expired': return 'Этот код уже не действует. Попросите новый.';
      case 'network': return 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.';
      default: return 'Что-то пошло не так. Попробуйте ещё раз.';
    }
  }

  function say(id, text, good) {
    var el = $(id);
    el.textContent = text || '';
    el.className = 'msg' + (text ? (good ? ' msg--ok' : ' msg--bad') : '');
  }

  function busy(btn, on) {
    btn.disabled = on;
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function showStep(n) {
    $('stepEmail').hidden = n !== 1;
    $('stepCode').hidden = n !== 2;
    (n === 1 ? $('email') : $('code')).focus();
  }

  /* «Отправить ещё раз» — после обратного отсчёта, как просит сервер */
  function countdown(sec) {
    var btn = $('resend');
    clearInterval(timer);
    function tick() {
      btn.disabled = sec > 0;
      btn.textContent = sec > 0 ? 'Отправить ещё раз через ' + sec + ' с' : 'Отправить код ещё раз';
      if (sec-- <= 0) clearInterval(timer);
    }
    tick();
    timer = setInterval(tick, 1000);
  }

  function toCodeStep(resendAfter) {
    $('sentTo').textContent = email;
    $('code').value = '';
    say('codeMsg', '');
    showStep(2);
    countdown(resendAfter || 60);
  }

  function sendCode(btn, msgId) {
    busy(btn, true);
    return A.requestCode(email).then(function (r) {
      busy(btn, false);
      if (r.ok) return toCodeStep(r.data.resendAfter);
      /* код на эту почту уже ушёл минуту назад — он и нужен, ведём к вводу */
      if (r.data.error === 'too_soon') {
        toCodeStep(r.data.retryAfter);
        return say('codeMsg', 'Код уже отправлен — проверьте почту.', true);
      }
      say(msgId, why(r));
    });
  }

  $('formEmail').addEventListener('submit', function (e) {
    e.preventDefault();
    email = $('email').value.trim().toLowerCase();
    say('emailMsg', '');
    sendCode($('sendBtn'), 'emailMsg');
  });

  $('formCode').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = $('code').value.replace(/\D/g, '');
    if (code.length !== 6) return say('codeMsg', 'В коде шесть цифр.');
    var btn = $('verifyBtn');
    busy(btn, true);
    say('codeMsg', '');
    A.verifyCode(email, code).then(function (r) {
      if (r.ok) {
        say('codeMsg', 'Готово, входим…', true);
        location.replace(next);
        return;
      }
      busy(btn, false);
      say('codeMsg', why(r));
      $('code').select();
    });
  });

  /* Код из шести цифр: как только набран целиком — сразу проверяем */
  $('code').addEventListener('input', function () {
    var v = this.value.replace(/\D/g, '').slice(0, 6);
    if (v !== this.value) this.value = v;
    if (v.length === 6 && !$('verifyBtn').disabled) $('formCode').requestSubmit();
  });

  $('resend').addEventListener('click', function () {
    say('codeMsg', '');
    sendCode(this, 'codeMsg').then(function () {
      if (!$('codeMsg').textContent) say('codeMsg', 'Отправили новый код.', true);
    });
  });

  $('changeEmail').addEventListener('click', function () {
    clearInterval(timer);
    say('emailMsg', '');
    showStep(1);
  });

  /* Уже вошёл — страница входа не нужна */
  A.me().then(function (user) {
    if (user) location.replace(next);
  }, function () { /* сервер недоступен — покажем ошибку при отправке */ });

  showStep(1);
})();
