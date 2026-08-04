/* замер модели «угадай следующее слово» до написания уровня:
   Нейро должен угадывать заметно лучше случайного выбора,
   но не всегда — иначе спорить с ним неинтересно */

const CORPUS = [
  'кот сидит на окне',
  'кот спит на диване',
  'кот прыгнул на стол',
  'кот пьёт молоко',
  'собака спит на коврике',
  'собака бежит по двору',
  'собака громко лает',
  'мама купила хлеб и молоко',
  'мама читает книгу',
  'папа чинит велосипед',
  'зимой на улице очень холодно',
  'летом на улице очень жарко',
  'осенью на улице идёт дождь',
  'весной на улице тает снег',
  'мы идём в школу',
  'мы идём в парк',
  'после школы я иду домой',
  'на завтрак я ем кашу',
  'на обед я ем суп',
  'я люблю рисовать красками',
  'я люблю играть в футбол',
  'бабушка печёт пирог',
  'дедушка читает газету',
  'дети играют во дворе',
  'птицы поют на ветке',
  'солнце светит очень ярко',
  'ветер качает деревья',
  'снег падает на землю',
  'книга лежит на полке',
  'мяч закатился под диван',
];

const M = {};
CORPUS.forEach(s => {
  const w = s.split(' ');
  for (let i = 0; i < w.length - 1; i++) {
    (M[w[i]] = M[w[i]] || {});
    M[w[i]][w[i + 1]] = (M[w[i]][w[i + 1]] || 0) + 1;
  }
});

/* сколько разных продолжений у слова — там, где их много, спорить интересно */
const forks = Object.entries(M)
  .map(([w, next]) => [w, Object.keys(next).length])
  .filter(x => x[1] > 1)
  .sort((a, b) => b[1] - a[1]);
console.log('слова с несколькими продолжениями:');
forks.forEach(([w, n]) => console.log('  ' + w + ' → ' + n + ' вариантов: ' + Object.keys(M[w]).join(', ')));

/* точность модели: угадывает ли Нейро следующее слово во фразах корпуса */
function predict(w) {
  const next = M[w];
  if (!next) return null;
  let best = null, bn = -1;
  Object.entries(next).forEach(([k, n]) => { if (n > bn) { bn = n; best = k; } });
  return best;
}

let tot = 0, hit = 0, forkTot = 0, forkHit = 0;
CORPUS.forEach(s => {
  const w = s.split(' ');
  for (let i = 0; i < w.length - 1; i++) {
    const p = predict(w[i]);
    tot++; if (p === w[i + 1]) hit++;
    if (Object.keys(M[w[i]]).length > 1) { forkTot++; if (p === w[i + 1]) forkHit++; }
  }
});
console.log('\nНейро угадывает: ' + (hit / tot * 100).toFixed(0) + '% всех слов');
console.log('на развилках:    ' + (forkHit / forkTot * 100).toFixed(0) + '% (' + forkTot + ' случаев)');

/* сколько всего слов — для оценки, хватит ли вариантов на кнопки */
const vocab = new Set(CORPUS.join(' ').split(' '));
console.log('слов в словаре:  ' + vocab.size);

/* ── а если помнить не одно слово, а два? ──────────────────── */
const M2 = {};
CORPUS.forEach(s => {
  const w = s.split(' ');
  for (let i = 1; i < w.length - 1; i++) {
    const key = w[i - 1] + ' ' + w[i];
    (M2[key] = M2[key] || {});
    M2[key][w[i + 1]] = (M2[key][w[i + 1]] || 0) + 1;
  }
});
function predict2(a, b) {
  const next = M2[a + ' ' + b];
  if (!next) return null;
  let best = null, bn = -1;
  Object.entries(next).forEach(([k, n]) => { if (n > bn) { bn = n; best = k; } });
  return best;
}
let t2 = 0, h2 = 0, f2t = 0, f2h = 0;
CORPUS.forEach(s => {
  const w = s.split(' ');
  for (let i = 1; i < w.length - 1; i++) {
    const p = predict2(w[i - 1], w[i]);
    t2++; if (p === w[i + 1]) h2++;
    if (M[w[i]] && Object.keys(M[w[i]]).length > 1) { f2t++; if (p === w[i + 1]) f2h++; }
  }
});
console.log('\nпамять в два слова:');
console.log('  угадывает:    ' + (h2 / t2 * 100).toFixed(0) + '%');
console.log('  на развилках: ' + (f2h / f2t * 100).toFixed(0) + '% (' + f2t + ' случаев)');
