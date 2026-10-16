// GEN START
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const DIRS = [[1,0],[0,1],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1]];
// plus/minus are the chances of + and − (the rest is ×); maxNum caps the digits; maxTotal caps branch totals.
const MIX = { plus: 0.45, minus: 0.30, maxNum: 9, maxTotal: 72, minFree: 4 };
const CFG = {
  easy:   { branches: 5, extra: 2, plus: 0.6, minus: 0.4, maxNum: 9, maxTotal: 30, minFree: 4 },  // no ×
  medium: Object.assign({ branches: 7, extra: 1 }, MIX),
  hard:   Object.assign({ branches: 9, extra: 0 }, MIX),
};
// Easy puzzles 1-5 are a gentle on-ramp: few branches, small numbers, + only at first, and only
// a handful of blanks (free = how many cells the player fills).
const STARTER = [
  { branches: 2, plus: 1,   minus: 0,   maxNum: 5, maxTotal: 12, free: 3 },
  { branches: 3, plus: 1,   minus: 0,   maxNum: 5, maxTotal: 15, free: 3 },
  { branches: 3, plus: 1,   minus: 0,   maxNum: 6, maxTotal: 18, free: 4 },
  { branches: 4, plus: 0.7, minus: 0.3, maxNum: 9, maxTotal: 20, free: 4 },
  { branches: 4, plus: 0.6, minus: 0.4, maxNum: 9, maxTotal: 25, free: 5 },
];
const STARTER_COUNT = STARTER.length;
function config(diff, level) { return diff === 'easy' && level >= 1 && level <= STARTER.length ? STARTER[level - 1] : CFG[diff]; }
const LIM = 3;
function evalOps(vals, ops) { let r = vals[0]; ops.forEach((op, i) => { const v = vals[i + 1]; r = op === '+' ? r + v : op === '−' ? r - v : r * v; }); return r; }

function solve(n, br, given, truth, limit, nodeLimit) {
  const order = [], seen = new Set();
  br.forEach(b => b.ids.forEach(i => { if (!(i in given) && !seen.has(i)) { seen.add(i); order.push(i); } }));
  const idx = new Array(n).fill(-1); order.forEach((c, t) => idx[c] = t);
  const checks = order.map(() => []);
  br.forEach(b => { const last = Math.max(...b.ids.map(i => idx[i])); if (last >= 0) checks[last].push(b); });
  const cnt = {}; order.forEach(c => cnt[truth[c]] = (cnt[truth[c]] || 0) + 1);
  const keys = Object.keys(cnt).map(Number).sort((a, b) => a - b);
  const vals = new Array(n); for (const k in given) vals[k] = given[k];
  let count = 0, nodes = 0, aborted = false; const sols = [];
  (function rec(t) {
    if (t === order.length) { count++; sols.push(vals.slice()); return; }
    for (const v of keys) {
      if (!cnt[v]) continue;
      if (++nodes > nodeLimit) { aborted = true; return; }
      cnt[v]--; vals[order[t]] = v;
      let good = true;
      for (const b of checks[t]) if (evalOps(b.ids.map(i => vals[i]), b.ops) !== b.total) { good = false; break; }
      if (good) rec(t + 1);
      cnt[v]++;
      if (aborted || count >= limit) return;
    }
  })(0);
  return { count, sols, aborted };
}

function generate(diff, seed, level) {
  const rnd = mulberry32(seed * 7919 + 13), ri = n => Math.floor(rnd() * n);
  const cfg = config(diff, level);
  for (let attempt = 0; attempt < 400; attempt++) {
    const pos = [], at = new Map(), occ = new Map(), br = [];
    const key = (x, y) => x + ',' + y; // doubled coordinates
    const tryBranch = (jx, jy, d, L, k, first) => {
      const cp = []; for (let i = 0; i < L; i++) cp.push([jx + (i - k) * d[0], jy + (i - k) * d[1]]);
      const tgt = [jx + (L - k) * d[0], jy + (L - k) * d[1]], pts = cp.concat([tgt]);
      for (const [x, y] of pts) if (Math.abs(x) > LIM || Math.abs(y) > LIM) return false;
      for (const [x, y] of cp) { const o = occ.get(key(2 * x, 2 * y)); if (o && o !== 'c') return false; }
      if (occ.has(key(2 * tgt[0], 2 * tgt[1]))) return false;
      for (let i = 0; i < L; i++) if (occ.has(key(pts[i][0] + pts[i + 1][0], pts[i][1] + pts[i + 1][1]))) return false;
      const existing = cp.filter(([x, y]) => occ.get(key(2 * x, 2 * y)) === 'c').length;
      if ((!first && existing < 1) || existing === L || existing > 2) return false;
      const ids = cp.map(([x, y]) => { const kk = key(2 * x, 2 * y); if (!at.has(kk)) { at.set(kk, pos.length); pos.push([x, y]); occ.set(kk, 'c'); } return at.get(kk); });
      for (let i = 0; i < L; i++) occ.set(key(pts[i][0] + pts[i + 1][0], pts[i][1] + pts[i + 1][1]), 'o');
      occ.set(key(2 * tgt[0], 2 * tgt[1]), 't');
      br.push({ ids, end: tgt });
      return true;
    };
    tryBranch(0, 0, DIRS[ri(8)], 2 + ri(2), 0, true);
    for (let tries = 0; br.length < cfg.branches && tries < 400; tries++) {
      const j = pos[ri(pos.length)], L = 2 + ri(2);
      tryBranch(j[0], j[1], DIRS[ri(8)], L, ri(L), false);
    }
    if (br.length < cfg.branches) continue;
    const truth = pos.map(() => 1 + ri(cfg.maxNum));
    let ok = true;
    for (const b of br) {
      let done = false;
      for (let t = 0; t < 30 && !done; t++) {
        const ops = b.ids.slice(1).map(() => { const q = rnd(); return q < cfg.plus ? '+' : q < cfg.plus + cfg.minus ? '−' : '×'; });
        const tot = evalOps(b.ids.map(i => truth[i]), ops);
        if (tot >= 1 && tot <= cfg.maxTotal) { b.ops = ops; b.total = tot; done = true; }
      }
      if (!done) { ok = false; break; }
    }
    if (!ok) continue;
    const given = {};
    let unique = false;
    for (let g = 0; g < pos.length; g++) {
      const res = solve(pos.length, br, given, truth, 2, 150000);
      if (res.aborted) break;
      if (res.count === 1) { unique = true; break; }
      const alt = res.sols.find(s => s.some((v, i) => v !== truth[i]));
      const diffs = truth.map((v, i) => i).filter(i => alt[i] !== truth[i] && !(i in given));
      const pick = diffs[ri(diffs.length)];
      given[pick] = truth[pick];
    }
    if (!unique) continue;
    const free = pos.map((_, i) => i).filter(i => !(i in given));
    if (cfg.free) {
      if (free.length < cfg.free) continue;
      while (free.length > cfg.free) { const c = free.splice(ri(free.length), 1)[0]; given[c] = truth[c]; }
    } else {
      for (let e = 0; e < cfg.extra && free.length > cfg.minFree; e++) { const c = free.splice(ri(free.length), 1)[0]; given[c] = truth[c]; }
      if (free.length < cfg.minFree) continue;
    }
    return { pos, branches: br, truth, given };
  }
  return null;
}
// GEN END
if (typeof module !== 'undefined') module.exports = { generate, STARTER_COUNT };
