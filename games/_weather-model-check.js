/* замер прогноза до написания уровня:
   если Нейро говорит 78%, дождь должен идти примерно в 78 случаях из 100.
   иначе весь урок про «проценты — не обещание» держится на слове, а не на факте */

const ACC = 0.65;                 // насколько станция угадывает погоду
const L = ACC / (1 - ACC);        // во сколько раз сигнал «дождь» перевешивает

function day(k) {
  const rain = Math.random() < 0.5;
  let odds = 1;                   // шансы 50 на 50 до опроса станций
  for (let i = 0; i < k; i++) {
    const says = Math.random() < (rain ? ACC : 1 - ACC);
    odds *= says ? L : 1 / L;
  }
  return { p: odds / (1 + odds), rain };
}

/* какие проценты вообще выпадают при разном числе станций */
console.log('возможные прогнозы:');
for (let k = 1; k <= 5; k++) {
  const set = new Set();
  for (let i = 0; i < 4000; i++) set.add(Math.round(day(k).p * 100));
  console.log('  ' + k + ' станц.: ' + [...set].sort((a, b) => a - b).join(' '));
}

/* калибровка: собираем много дней и смотрим, сбывается ли обещанное */
const BINS = [[0,20],[20,40],[40,60],[60,80],[80,101]];
const hit = BINS.map(() => ({ n: 0, rain: 0 }));
for (let i = 0; i < 200000; i++) {
  const k = 1 + Math.floor(Math.random() * 5);
  const d = day(k);
  const pc = d.p * 100;
  const b = BINS.findIndex(([a, z]) => pc >= a && pc < z);
  hit[b].n++; if (d.rain) hit[b].rain++;
}
console.log('\nкалибровка:');
BINS.forEach(([a, z], i) => {
  const h = hit[i];
  if (!h.n) return;
  console.log('  сказал ' + a + '–' + z + '%: дождь шёл в ' +
    (h.rain / h.n * 100).toFixed(1) + '% случаев  (' + h.n + ' дней)');
});
