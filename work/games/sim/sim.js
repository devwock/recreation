// 검과 방패 몬테카를로 시뮬레이션
// 사용: node sim.js <팀 인원> <검> <쌍검> <방패> <맨손> [게임 수]
// 행동 모델은 bluff 확률·의심 임계값을 바꿔 가며 평균을 낸다(모델 의존성 완화).
'use strict';

const DMG = { sword: 1, dual: 2 };
const MAX_ROUNDS = 40;

function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mulberry(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// comp: { sword, dual, shield, bare }, 합계 = 2n
function playGame(n, comp, beh, rnd) {
  const players = [];
  for (const team of [0, 1]) {
    const bag = [];
    for (const k of ['sword', 'dual', 'shield', 'bare']) for (let i = 0; i < comp[k]; i++) bag.push(k);
    shuffle(bag, rnd);
    const leader = Math.floor(rnd() * n);
    for (let i = 0; i < n; i++) {
      players.push({
        team, leader: i === leader, alive: true, order: i,
        arms: [bag[2 * i], bag[2 * i + 1]],
        // 공개 정보: 팔별로 선언(또는 공개)된 무기 종류, 방패 선언 누적 피해
        pub: [null, null], revealed: [false, false], shieldUsed: [0, 0]
      });
    }
  }
  const idx = players.map((_, i) => i);
  const teamOf = t => idx.filter(i => players[i].team === t);
  const aliveOf = t => teamOf(t).filter(i => players[i].alive);

  // 팀 t 의 팔 중 arm 을 제외하고 type 으로 확정(선언·공개)된 팔 수, 미확정 팔 수
  function pLie(x, arm, type) {
    const p = players[x];
    if (p.revealed[arm]) return p.arms[arm] === type ? 0 : 1;
    if (p.pub[arm] && p.pub[arm] !== type) return 1;   // 같은 팔에 다른 무기 선언
    let committed = 0, unknown = 0;
    for (const i of teamOf(p.team)) {
      for (const a of [0, 1]) {
        if (i === x && a === arm) { unknown++; continue; }
        const q = players[i];
        if (q.pub[a] == null) unknown++;
        else if (q.pub[a] === type) committed++;
      }
    }
    const r = comp[type] - committed;
    if (r <= 0) return 1;
    if (p.pub[arm] === type) return 0.5 * (1 - Math.min(1, r / unknown)); // 이미 넘어간 선언 반복: 덜 의심
    const prior = Math.min(1, r / unknown);
    const b = type === 'shield' ? beh.bluffDef : beh.bluffAtk;
    return 1 - prior / (prior + (1 - prior) * b);
  }

  let firstDoubt = null;   // 통계용
  const stats = { deaths: 0, doubtOk: 0, doubtFail: 0, rounds: 0, attacks: 0, passes: 0 };

  // 상대 팀 생존자 중 한 명이 의심. 반환: 의심한 사람 or null
  function maybeDoubt(x, arm, type, extra) {
    const pl = pLie(x, arm, type);
    if (pl < beh.theta) return null;
    const cands = aliveOf(1 - players[x].team).filter(i => !players[i].leader || pl >= 1);
    if (extra != null && players[extra].alive && !cands.includes(extra)) cands.push(extra);
    if (!cands.length) return null;
    return cands[Math.floor(rnd() * cands.length)];
  }

  function kill(i) {
    players[i].alive = false;
    stats.deaths++;
    return players[i].leader;
  }

  // 반환: 끝났으면 승리 팀, 아니면 null
  function doubtResolve(x, arm, type, by) {
    players[x].revealed[arm] = true;
    players[x].pub[arm] = players[x].arms[arm];
    if (players[x].arms[arm] !== type) {
      stats.doubtOk++;
      if (kill(x)) return { end: 1 - players[x].team, lie: true };
      return { lie: true };
    }
    stats.doubtFail++;
    if (kill(by)) return { end: 1 - players[by].team, lie: false };
    return { lie: false };
  }

  function turn(x) {
    const p = players[x];
    // 공격 팔 고르기: 진짜 쌍검 > 진짜 검 > 허세
    let arm = -1, type = null;
    for (const t of ['dual', 'sword']) {
      const a = p.arms.findIndex(w => w === t);
      if (a >= 0 && arm < 0) { arm = a; type = t; }
    }
    if (arm < 0) {
      if (p.leader || rnd() >= beh.bluffAtk) { stats.passes++; return null; }
      // 허세: 이미 검으로 넘어간 팔 우선, 아니면 미확정 팔
      arm = [0, 1].find(a => p.pub[a] === 'sword' && !p.revealed[a]);
      if (arm == null) arm = [0, 1].find(a => p.pub[a] == null);
      if (arm == null) { stats.passes++; return null; }
      type = 'sword';
    }
    const opp = aliveOf(1 - p.team);
    const target = opp[Math.floor(rnd() * opp.length)];
    stats.attacks++;
    p.pub[arm] = p.pub[arm] || type;

    const d1 = maybeDoubt(x, arm, type, target);
    if (d1 != null) {
      const r = doubtResolve(x, arm, type, d1);
      if (r.end != null) return r.end;
      if (r.lie) return null;                 // 공격 무효
      if (!players[target].alive) return null; // 대상이 의심하다 사망
    }
    const dmg = DMG[type];
    const t = players[target];
    // 방어: 진짜 방패(남은 횟수 충분) > 허세 방패 > 방어 안 함
    let darm = [0, 1].find(a => t.arms[a] === 'shield' && t.shieldUsed[a] + dmg <= 3 && !(t.pub[a] && t.pub[a] !== 'shield'));
    if (darm == null) {
      darm = [0, 1].find(a => !t.revealed[a] && (t.pub[a] == null || t.pub[a] === 'shield') && t.shieldUsed[a] + dmg <= 3);
    }
    if (darm == null) return kill(target) ? p.team : null;
    t.pub[darm] = 'shield';
    t.shieldUsed[darm] += dmg;
    const d2 = maybeDoubt(target, darm, 'shield', null);
    if (d2 != null) {
      const r = doubtResolve(target, darm, 'shield', d2);
      if (r.end != null) return r.end;
      if (r.lie) return null;   // 방어자는 이미 의심으로 사망
      return null;
    }
    if (t.arms[darm] !== 'shield') { /* 거짓 방패가 통과됨 */ }
    return null;
  }

  const firstTeam = rnd() < 0.5 ? 0 : 1;
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    stats.rounds = round;
    const lead = round % 2 === 1 ? firstTeam : 1 - firstTeam;
    const done = new Set();
    let last = null;
    for (;;) {
      const pickFrom = t => aliveOf(t).filter(i => !done.has(i)).sort((a, b) => players[a].order - players[b].order)[0];
      let next = last == null ? pickFrom(lead) : pickFrom(1 - players[last].team);
      if (next == null && last != null) next = pickFrom(players[last].team);
      if (next == null) break;
      done.add(next);
      last = next;
      const w = turn(next);
      if (w != null) return { winner: w, firstWin: w === firstTeam, ...stats };
    }
  }
  return { winner: null, firstWin: false, ...stats };
}

const BEHAVIORS = [];
for (const bluffAtk of [0.3, 0.6]) for (const bluffDef of [1]) for (const theta of [0.5, 0.7])
  BEHAVIORS.push({ bluffAtk, bluffDef, theta });

function evaluate(n, comp, games = 4000, seed = 1) {
  const rnd = mulberry(seed);
  let fw = 0, dec = 0, rounds = 0, deaths = 0, draws = 0, ok = 0, fail = 0, att = 0;
  for (const beh of BEHAVIORS) {
    for (let g = 0; g < games; g++) {
      const r = playGame(n, comp, beh, rnd);
      if (r.winner == null) { draws++; continue; }
      dec++;
      if (r.firstWin) fw++;
      rounds += r.rounds; deaths += r.deaths; ok += r.doubtOk; fail += r.doubtFail; att += r.attacks;
    }
  }
  const total = games * BEHAVIORS.length;
  return {
    firstWin: fw / dec, rounds: rounds / dec, deathRate: deaths / dec / (2 * n),
    draw: draws / total, doubtOk: ok / dec, doubtFail: fail / dec, attacks: att / dec
  };
}

module.exports = { evaluate, playGame, BEHAVIORS };

if (require.main === module) {
  const [n, s, d, sh, b, g] = process.argv.slice(2).map(Number);
  console.log(evaluate(n, { sword: s, dual: d, shield: sh, bare: b }, g || 4000));
}
