/* замер модели диджея до того, как писать уровень:
   зацикливается ли мелодия на низкой смелости и разваливается ли на высокой */

const CORPUS = [
  [0,1,2,3,2,1,0,0],
  [2,3,4,3,2,1,2,0],
  [0,2,4,5,4,2,0,0],
  [3,4,5,4,3,2,3,3],
  [0,1,2,4,5,7,5,4],
  [5,4,3,2,3,4,5,5],
  [2,2,3,4,5,4,2,1,0],
  [4,5,6,7,6,5,4,4],
  [0,2,3,2,0,1,2,2],
];

const N = 8;
const M = Array.from({length:N},()=>new Array(N).fill(0));
CORPUS.forEach(m => { for (let i=0;i<m.length-1;i++) M[m[i]][m[i+1]]++; });

console.log('таблица переходов:');
M.forEach((row,i)=>console.log(i, row.join(' ')));

function next(prev, T) {
  const eps = 0.3 * T;
  const w = M[prev].map(c => Math.pow(c + eps, 1/T));
  const sum = w.reduce((a,b)=>a+b,0);
  let r = Math.random()*sum;
  for (let i=0;i<N;i++){ r -= w[i]; if (r<=0) return i; }
  return N-1;
}

function gen(seed, T, n) {
  const out = [];
  let p = seed[seed.length-1];
  for (let i=0;i<n;i++){ p = next(p, T); out.push(p); }
  return out;
}

const SEED = [0,1,2,3];
const TEMPS = [{t:0.08,n:"самое частое"},{t:0.55,n:'осторожно'},{t:1.0,n:'смело'},{t:3.0,n:'наугад'}];

TEMPS.forEach(({t,n}) => {
  console.log('\n— ' + n + ' (T=' + t + ')');
  for (let k=0;k<4;k++) {
    const g = gen(SEED, t, 10);
    /* сколько разных нот и сколько повторов подряд-пар */
    const uniq = new Set(g).size;
    let loops = 0;
    for (let i=0;i<g.length-2;i++) if (g[i]===g[i+2]) loops++;
    console.log('  ' + g.join(' ') + '   разных: ' + uniq + ', качаний туда-обратно: ' + loops);
  }
});
