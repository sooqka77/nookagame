/* Замер для уровня «Шарик ищет дно» до написания.

   Шарик не видит долину. Он знает только наклон под собой и делает
   x = x - шаг · наклон. Больше ничего.

   Первый акт — про величину шага, склон с одной ямой:
     крошечный шаг — ползёт и за отведённые шаги не доходит
     средний       — приходит на дно за десяток шагов
     огромный      — раскачивается всё сильнее и улетает
   Проверяю, что каждый исход держится на широком диапазоне шага,
   а не на случайном значении.

   Второй акт — про место старта, склон с двумя ямами:
     пустил слева от бугра — сядешь в мелкую ямку
     пустил справа        — найдёшь настоящее дно
   Тут шаг один и тот же: решает только то, откуда начали.

   Замысел «средний шаг перепрыгивает бугор и находит дно» я проверил
   и отбросил: у всех подходящих склонов такой исход держался на двух-трёх
   значениях шага из полутора сотен. Для ребёнка это выглядело бы лотереей.
*/

const LIMIT = 40;

function roll(m, start, step, max, lo, hi) {
  let x = start;
  const path = [x];
  for (let i = 0; i < max; i++) {
    x = x - step * m.d(x);
    if (!isFinite(x) || x < lo || x > hi) return { out: true, steps: i + 1, path: path };
    path.push(x);
    if (Math.abs(step * m.d(x)) < 0.004) return { steps: i + 1, stop: x, path: path };
  }
  return { steps: max, stop: x, slow: true, path: path };
}

/* ══ АКТ 1: одна яма, решает величина шага ══════════════════ */
const A = {
  lo: -5.6, hi: 5.6,
  f: x => 0.5 * x * x + 0.015 * x * x * x,
  d: x => x + 0.045 * x * x,
};
const A_START = -3.0;

{
  const ямы = [];
  for (let x = A.lo; x < A.hi; x += 0.002) if (A.d(x) < 0 && A.d(x + 0.002) >= 0) ямы.push(x + 0.001);
  console.log('=== АКТ 1. СКЛОН ===');
  console.log('  ям на склоне: ' + ямы.length + ' (нужна одна), дно x = ' + ямы.map(x => x.toFixed(2)).join(', '));
  console.log('  старт x = ' + A_START + ', глубина там ' + A.f(A_START).toFixed(2));

  const дно = ямы[0];
  const код = s => {
    const r = roll(A, A_START, s, LIMIT, A.lo, A.hi);
    if (r.out) return { к: 'улетел', r: r };
    if (r.slow) return { к: 'ползёт', r: r };
    return { к: Math.abs(r.stop - дно) < 0.3 ? 'дно' : 'иное', r: r };
  };
  const сетка = [];
  for (let s = 0.01; s <= 3.0; s += 0.01) сетка.push(Math.round(s * 100) / 100);
  const все = сетка.map(s => Object.assign({ s: s }, код(s)));

  const отрезок = к => {
    const и = все.map((x, i) => (x.к === к ? i : -1)).filter(i => i >= 0);
    if (!и.length) return null;
    let от = и[0], до = и[0], лот = и[0], лдо = и[0];
    for (let j = 1; j < и.length; j++) {
      if (и[j] === до + 1) до = и[j];
      else { if (до - от > лдо - лот) { лот = от; лдо = до; } от = до = и[j]; }
    }
    if (до - от > лдо - лот) { лот = от; лдо = до; }
    return { от: все[лот].s, до: все[лдо].s, шт: лдо - лот + 1 };
  };
  ['ползёт', 'дно', 'улетел'].forEach(к => {
    const o = отрезок(к);
    if (!o) { console.log('  ' + к + ': не встречается'); return; }
    console.log('  ' + к.padEnd(8) + ': шаг от ' + o.от.toFixed(2) + ' до ' + o.до.toFixed(2) +
      '  (' + o.шт + ' значений подряд)');
  });

  const выбор = [
    { имя: 'крошечный', s: 0.02 },
    { имя: 'маленький', s: 0.15 },
    { имя: 'средний',   s: 0.55 },
    { имя: 'огромный',  s: 2.20 },
  ];
  console.log('\n  что выйдет на выбранных шагах (лимит ' + LIMIT + '):');
  выбор.forEach(({ имя, s }) => {
    const o = код(s), r = o.r;
    const где = r.out ? 'улетел со склона на ' + r.steps + '-м шаге'
      : r.slow ? 'ползёт, дошёл до x=' + r.stop.toFixed(2) + ' (дно на ' + дно.toFixed(2) + ')'
      : 'встал на дно за ' + r.steps + ' шагов';
    console.log('    ' + имя.padEnd(11) + 'шаг ' + s.toFixed(2) + ' → ' + o.к.padEnd(7) + ' · ' + где);
  });
  console.log('  крошечным дошёл бы за ' + roll(A, A_START, 0.02, 9000, A.lo, A.hi).steps + ' шагов');
  console.log('  путь среднего:  ' + roll(A, A_START, 0.55, LIMIT, A.lo, A.hi).path.map(x => x.toFixed(1)).join(' → '));
  console.log('  путь огромного: ' + roll(A, A_START, 2.20, LIMIT, A.lo, A.hi).path.map(x => x.toFixed(1)).join(' → '));
}

/* ══ АКТ 2: две ямы, решает место старта ════════════════════ */
const B = {
  lo: -6, hi: 6,
  f: x => 0.10 * x * x + 3.0 * Math.cos(1.2 * x) - 0.3 * x,
  d: x => 0.20 * x - 3.6 * Math.sin(1.2 * x) - 0.3,
};
const B_STEP = 0.3;

{
  const ямы = [], бугры = [];
  for (let x = -5; x < 5; x += 0.002) {
    if (B.d(x) < 0 && B.d(x + 0.002) >= 0) ямы.push(x + 0.001);
    if (B.d(x) > 0 && B.d(x + 0.002) <= 0) бугры.push(x + 0.001);
  }
  console.log('\n=== АКТ 2. СКЛОН ===');
  ямы.forEach(x => console.log('  яма   x = ' + x.toFixed(2).padStart(6) + '  глубина ' + B.f(x).toFixed(2)));
  бугры.forEach(x => console.log('  бугор x = ' + x.toFixed(2).padStart(6) + '  высота  ' + B.f(x).toFixed(2)));

  const мелкая = ямы.reduce((a, b) => (B.f(a) > B.f(b) ? a : b));
  const дно = ямы.reduce((a, b) => (B.f(a) < B.f(b) ? a : b));
  const водораздел = бугры.filter(x => x > Math.min(мелкая, дно) && x < Math.max(мелкая, дно))[0];
  console.log('  мелкая ямка x = ' + мелкая.toFixed(2) + ', настоящее дно x = ' + дно.toFixed(2));
  console.log('  водораздел  x = ' + (водораздел === undefined ? '—' : водораздел.toFixed(2)));

  console.log('\n  куда придёт шарик при шаге ' + B_STEP + ' с разных мест:');
  let верно = 0, всего = 0;
  for (let s = -4.5; s <= 4.5; s += 0.5) {
    const r = roll(B, s, B_STEP, 60, -5.2, 5.2);
    const куда = r.out ? 'улетел'
      : Math.abs(r.stop - мелкая) < 0.3 ? 'ямка'
      : Math.abs(r.stop - дно) < 0.3 ? 'ДНО' : 'x=' + r.stop.toFixed(2);
    const ждали = s < водораздел ? 'ямка' : 'ДНО';
    всего++; if (куда === ждали) верно++;
    console.log('    старт ' + s.toFixed(1).padStart(5) + ' → ' + куда.padEnd(8) +
      (куда === ждали ? '' : '  !! ждали ' + ждали) + '  за ' + r.steps + ' шагов');
  }
  console.log('  правило «где начал — туда и придёшь» держится ' + верно + ' раз из ' + всего);
}

/* ══ картинки ═══════════════════════════════════════════════ */
console.log('\n=== ПРОФИЛИ ===');
[[A, 'акт 1 — одна яма', -5.2, 4.2], [B, 'акт 2 — ямка и дно', -5, 5]].forEach(пара => {
  const m = пара[0], имя = пара[1], x0 = пара[2], x1 = пара[3];
  let lo = Infinity, hi = -Infinity;
  for (let x = x0; x <= x1; x += 0.05) { const y = m.f(x); if (y < lo) lo = y; if (y > hi) hi = y; }
  const W = 60, H = 14;
  const g = Array.from({ length: H }, () => new Array(W).fill(' '));
  for (let i = 0; i < W; i++) {
    const x = x0 + (x1 - x0) * i / (W - 1);
    g[H - 1 - Math.round((m.f(x) - lo) / (hi - lo) * (H - 1))][i] = '#';
  }
  console.log(имя + '  (высоты от ' + lo.toFixed(1) + ' до ' + hi.toFixed(1) + '):');
  g.forEach(r => console.log('  |' + r.join('') + '|'));
});
