/* Общие компоненты интерфейса Nooka: шапка, бейдж задачи, модалки, маскот.
   Вынесены из prompt.html, чтобы новые уровни их переиспользовали.
   Требуют React и nooka-core. */
const { useState, useEffect, useRef } = React;

function TopBar({
  level,
  title,
  onHome,
  step,
  total
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 16px 6px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "ak-btn ak-btn--soft ak-btn--sm",
    onClick: onHome
  }, "← Назад"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ak-display)',
      fontSize: 11,
      color: 'var(--ak-ink-3)',
      textTransform: 'uppercase',
      letterSpacing: 1
    }
  }, "Уровень ", level), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ak-display)',
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--ak-ink)'
    }
  }, title)), total > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5
    }
  }, Array.from({
    length: total
  }, (_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: i < step ? 'var(--ak-ok-2)' : i === step ? 'var(--ak-phys-2)' : 'rgba(45,27,69,.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      color: i < step ? '#fff' : i === step ? '#fff' : 'var(--ak-ink-3)',
      fontFamily: 'var(--ak-display)'
    }
  }, i + 1))));
}
function TaskBadge({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ak-pulse",
    style: {
      margin: '0 16px 10px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '11px 18px 11px 14px',
      borderRadius: 999,
      background: '#101C32',
      fontFamily: 'var(--ak-display)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ak-ink)',
      boxShadow: '0 4px 0 rgba(45,27,69,.08),0 10px 22px -6px rgba(45,27,69,.14),inset 0 1px 0 rgba(255,255,255,1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: '#B5A1FF',
      flexShrink: 0,
      boxShadow: '0 0 0 4px rgba(181,161,255,.33),inset 0 -1px 0 #7C5FE0'
    }
  }), /*#__PURE__*/React.createElement("span", null, children));
}
function WinModal({
  emoji,
  title,
  law,
  fact,
  cta,
  onNext,
  onHome
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(4,8,20,.72)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ak-clay ak-pop",
    style: {
      margin: 20,
      padding: 28,
      textAlign: 'center',
      maxWidth: 320
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 52,
      marginBottom: 6
    }
  }, emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ak-display)',
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--ak-ink)',
      marginBottom: 12
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--ak-phys-1)',
      borderRadius: 18,
      padding: '14px 18px',
      marginBottom: 18,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ak-display)',
      fontSize: 13,
      color: 'var(--ak-phys-3)',
      marginBottom: 6
    }
  }, "⚡ ", law), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ak-ink)',
      lineHeight: 1.55
    }
  }, fact)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "ak-btn ak-btn--soft ak-btn--sm",
    onClick: onHome
  }, "🏠"), /*#__PURE__*/React.createElement("button", {
    className: "ak-btn ak-btn--cta",
    onClick: onNext
  }, cta))));
}
function FailModal({
  tip,
  onRetry
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(4,8,20,.72)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ak-clay ak-pop",
    style: {
      margin: 20,
      padding: 28,
      textAlign: 'center',
      maxWidth: 300
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 44,
      marginBottom: 8
    }
  }, "🤔"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ak-display)',
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--ak-ink)',
      marginBottom: 10
    }
  }, "Попробуй ещё!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--ak-ink-2)',
      lineHeight: 1.55,
      marginBottom: 22
    }
  }, tip), /*#__PURE__*/React.createElement("button", {
    className: "ak-btn ak-btn--phys",
    onClick: onRetry
  }, "Ещё раз 🔄")));
}
/* goal — чему ребёнок здесь учится. Короткая фраза крупным шрифтом, до задания:
   иначе уровень заходит как развлечение, а знание из него не достаётся.
   Берётся из реестра nooka-levels.js — все формулировки правятся в одном месте.
   Явно переданный goal перебивает реестр. */
function nkGoal() {
  var lv = nkLevel();
  return (lv && lv.goal) || '';
}
function nkLevel() {
  try {
    var cur = window.nookaAccess && window.nookaAccess.currentLevel();
    return (cur && cur.level) || null;
  } catch (e) { return null; }
}

/* ── экран догадки ────────────────────────────────────────────
   Заменяет собой объяснение перед уровнем. Раньше здесь стояли три
   текстовых блока подряд — «чему учимся», «правило» и подсказка, —
   и ребёнок девяти лет пропускал их все: между ним и игрой была
   кнопка «Начать», а всё остальное читалось как препятствие.

   Теперь на экране нет ничего, что можно пропустить: чтобы начать,
   нужно ответить на вопрос уровня. Ответ не проверяется и не
   оценивается — он нужен, чтобы в конце ребёнок увидел разницу между
   тем, что думал, и тем, что выяснил сам. Эта разница и есть понимание;
   без неё уровень читается как просто игра.

   Подсказка не исчезла — она приходит плашкой уже внутри игры, в тот
   момент, когда действительно нужна. */
function GuessGate({ emoji, title, ask, bets, tip, onStart }) {
  function pick(i) {
    try { window.nooka && window.nooka.betSet(i, bets[i]); } catch (e) {}
    if (tip) { try { window.nooka && window.nooka.beat(tip); } catch (e) {} }
    onStart();
  }
  return React.createElement('div', {
    style: {
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg,#182A4A 0%,#0D1427 55%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '28px 22px', overflowY: 'auto', zIndex: 100
    }
  },
    React.createElement('div', { className: 'ak-bob', style: { fontSize: 54, marginBottom: 6 } }, emoji),
    /* Название уровня ребёнку ничего не говорит — здесь стоит умение,
       которому уровень учит. Та же формулировка встретит его на экране
       победы: «здесь учимся» в начале и «теперь умеешь» в конце. */
    React.createElement('div', {
      style: {
        fontFamily: 'var(--ak-display)', fontWeight: 700, fontSize: 10.5,
        letterSpacing: '.1em', color: '#FFD84D', marginBottom: 5, textTransform: 'uppercase'
      }
    }, 'Здесь учимся'),
    React.createElement('div', {
      style: {
        fontFamily: 'var(--ak-display)', fontWeight: 700, fontSize: 16, lineHeight: 1.25,
        color: '#FFE7B8', textAlign: 'center', maxWidth: 320, marginBottom: 16
      }
    }, nkGoal() || title),
    React.createElement('div', {
      style: {
        fontFamily: 'var(--ak-display)', fontWeight: 700, fontSize: 25, lineHeight: 1.22,
        color: '#FFF6DC', textAlign: 'center', maxWidth: 330, marginBottom: 20
      }
    }, ask),
    React.createElement('div', {
      style: { width: '100%', maxWidth: 330, display: 'flex', flexDirection: 'column', gap: 10 }
    }, bets.map(function (b, i) {
      return React.createElement('button', {
        key: i,
        onClick: function () { pick(i); },
        style: {
          width: '100%', padding: '15px 18px', border: 'none', borderRadius: 18, cursor: 'pointer',
          textAlign: 'left', fontFamily: 'var(--ak-display)', fontWeight: 700, fontSize: 16,
          lineHeight: 1.3, color: '#FFF6DC', background: 'rgba(255,255,255,.07)',
          boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.16)'
        }
      }, b);
    })),
    React.createElement('div', {
      style: {
        marginTop: 16, fontSize: 13, fontWeight: 700, lineHeight: 1.45,
        color: '#9FB0CC', textAlign: 'center', maxWidth: 300
      }
    }, 'Выбери, что думаешь. Проверим прямо сейчас — ошибиться тут нельзя.')
  );
}
function IntroModal({
  emoji,
  title,
  goal,
  law,
  diagram,
  tip,
  onStart
}) {
  /* Если у уровня в реестре есть вопрос и варианты догадки — показываем
     их вместо объяснения. Уровни, где этого ещё нет, работают по-старому. */
  var lv = nkLevel();
  if (lv && lv.ask && lv.bets && lv.bets.length) {
    return React.createElement(GuessGate, {
      emoji: emoji, title: title, ask: lv.ask, bets: lv.bets, tip: tip, onStart: onStart
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(160deg,#182A4A 0%,#0D1427 55%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 24px 28px',
      overflowY: 'auto',
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ak-bob",
    style: {
      fontSize: 64,
      marginBottom: 10
    }
  }, emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ak-display)',
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--ak-ink)',
      marginBottom: 16,
      textAlign: 'center'
    }
  }, title), (goal = goal || nkGoal()) && /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 320,
      marginBottom: 16,
      padding: '13px 18px 15px',
      borderRadius: 20,
      background: 'rgba(255,216,77,.12)',
      boxShadow: 'inset 0 0 0 1.5px rgba(255,216,77,.45)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ak-display)',
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: '.09em',
      color: '#FFD84D',
      marginBottom: 7
    }
  }, "ЗДЕСЬ УЧИМСЯ"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ak-display)',
      fontWeight: 700,
      fontSize: 21,
      lineHeight: 1.25,
      color: '#FFF6DC'
    }
  }, goal)), diagram && /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 320,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    id: "intro-canvas",
    width: 320,
    height: 130,
    style: {
      width: '100%',
      borderRadius: 18,
      background: 'rgba(16,28,50,.85)',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 320,
      background: 'rgba(16,28,50,.92)',
      borderRadius: 20,
      padding: '14px 18px',
      marginBottom: 12,
      boxShadow: 'inset 0 1px 0 #fff, 0 4px 12px -6px rgba(45,27,69,.1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ak-display)',
      fontSize: 13,
      color: 'var(--ak-phys-3)',
      marginBottom: 6
    }
  }, "Правило:"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--ak-ink)',
      lineHeight: 1.6
    }
  }, law)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 320,
      background: 'rgba(255,210,98,.2)',
      borderRadius: 14,
      padding: '10px 16px',
      marginBottom: 24,
      fontSize: 13,
      color: 'var(--ak-ink-2)',
      lineHeight: 1.5
    }
  }, tip), /*#__PURE__*/React.createElement("button", {
    className: "ak-btn ak-btn--phys",
    style: {
      minWidth: 200,
      fontSize: 18
    },
    onClick: onStart
  }, "Начать!"));
}

/* ══════════════════════════════════════════════════════════════
   LEVEL 1 — ТРАЕКТОРИЯ
   Cannon + angle → fire → velocity vectors shown on ball → hit stars
   ══════════════════════════════════════════════════════════════ */

/* ============================================================
   ПромптЛаб — учимся говорить с ИИ. Nooka.
   ============================================================ */

/* Маскот Нейро. Картинка всегда одна — чистый робот (hello).
   Эмоция рисуется поверх: у think/win в исходных рендерах вокруг робота
   налипло конфетти, которое нельзя отделить от корпуса — на тёмном фоне
   оно читалось как мусорные пиксели, а из-за него же робот вставал не по центру.
   Свои эффекты чище и вдобавок анимированы. */
const NKM = (n, sz) => {
  const conf = ['#FFD84D', '#FF6FC4', '#7BF0BC', '#B57BFF', '#FF9F3C', '#7FD4FF'];
  return React.createElement('span', {
    style: {
      position: 'relative', display: 'inline-block',
      width: sz, height: sz, lineHeight: 0,
    }
  },
    React.createElement('img', {
      src: '../mascot/hello.webp',
      alt: 'Нейро',
      width: sz, height: sz,
      style: {
        width: sz, height: sz, display: 'block',
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,.35)) drop-shadow(0 0 20px rgba(196,77,255,.3))',
      }
    }),
    n === 'think' && React.createElement('svg', {
      viewBox: '0 0 100 100',
      style: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }
    },
      React.createElement('style', null,
        '@keyframes nkmQ{0%{opacity:0;transform:translateY(4px) scale(.7)}' +
        '30%{opacity:1;transform:translateY(0) scale(1)}' +
        '70%{opacity:1;transform:translateY(-4px) scale(1)}' +
        '100%{opacity:0;transform:translateY(-9px) scale(.85)}}'),
      [[20, 20, 15, 0], [37, 9, 20, .5], [55, 17, 12, 1]].map((q, i) =>
        React.createElement('text', {
          key: i, x: q[0], y: q[1], fontSize: q[2],
          fontFamily: 'var(--nk-display),system-ui,sans-serif', fontWeight: 900,
          fill: '#C48BFF', stroke: '#2A1150', strokeWidth: 1.6, paintOrder: 'stroke',
          style: { animation: `nkmQ 2.4s ease-in-out ${q[3]}s infinite`, transformOrigin: `${q[0]}px ${q[1]}px` }
        }, '?')
      )
    ),
    n === 'win' && React.createElement('svg', {
      viewBox: '0 0 100 100',
      style: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }
    },
      React.createElement('style', null,
        '@keyframes nkmC{0%{opacity:0;transform:translate(0,0) rotate(0)}' +
        '12%{opacity:1}' +
        '100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--rot))}}'),
      [[50, 42, -38, -34, '220deg', 0], [50, 42, 36, -30, '-190deg', .18],
       [50, 42, -30, 12, '150deg', .36], [50, 42, 30, 16, '-160deg', .54],
       [50, 42, -12, -44, '200deg', .72], [50, 42, 14, -46, '-210deg', .9],
       [50, 42, -44, -8, '170deg', 1.08], [50, 42, 44, -4, '-140deg', 1.26]].map((c, i) =>
        React.createElement('rect', {
          key: i, x: c[0] - 2.6, y: c[1] - 4.5, width: 5.6, height: 9, rx: 1.5,
          fill: conf[i % conf.length],
          style: {
            '--dx': c[2] + 'px', '--dy': c[3] + 'px', '--rot': c[4],
            animation: `nkmC 2.5s ease-out ${c[5]}s infinite`,
            transformOrigin: '50px 42px',
          }
        })
      )
    )
  );
};

/* ---------- Уровень 1: Джинн-буквалист (v2 — живая сцена) ---------- */
