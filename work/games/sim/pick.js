const { evaluate } = require('./sim.js');
const base = evaluate(5, { sword: 4, dual: 1, shield: 3, bare: 2 }, 20000, 7);
const RATIO = { sword: .4, dual: .1, shield: .3, bare: .2 };
const K = ['sword', 'dual', 'shield', 'bare'];
const ok = m => Math.abs(m.rounds - base.rounds) / base.rounds <= 0.08 && Math.abs(m.deathRate - base.deathRate) / base.deathRate <= 0.06 && Math.abs(m.firstWin - 0.5) <= Math.abs(base.firstWin - 0.5) + 0.01;
let prev = { sword: 0, dual: 0, shield: 0, bare: 0 };
for (let n = 3; n <= 10; n++) {
  const W = 2 * n, cands = [];
  for (let dual = 1; dual <= W; dual++) for (let sword = 1; sword <= W; sword++) for (let shield = 1; shield <= W; shield++) {
    const bare = W - sword - dual - shield; if (bare < 0) continue;
    const c = { sword, dual, shield, bare };
    const dist = K.reduce((s, k) => s + Math.abs(c[k] - RATIO[k] * W), 0);
    if (dist > 3.2 || K.some(k => c[k] < prev[k])) continue;
    cands.push({ c, dist });
  }
  cands.sort((a, b) => a.dist - b.dist);
  let chosen = null; const rows = [];
  for (const x of cands.slice(0, 12)) {
    const m = n === 5 && x.c.sword === 4 && x.c.dual === 1 && x.c.shield === 3 ? base : evaluate(n, x.c, 12000, 1234 + n);
    rows.push(`   ${K.map(k => x.c[k]).join('/')} dist=${x.dist.toFixed(1)} fw=${(m.firstWin*100).toFixed(1)} r=${m.rounds.toFixed(2)} d=${(m.deathRate*100).toFixed(1)} ${ok(m) ? 'OK' : ''}`);
    if (!chosen && ok(m)) chosen = { ...x, m };
    if (chosen && rows.length >= 4) break;
  }
  console.log(`n=${n} (총 ${2*n}명) → ${chosen ? K.map(k => chosen.c[k]).join('/') : '없음'}`);
  console.log(rows.join('\n'));
  if (chosen) prev = chosen.c;
}
console.log('base', base);
