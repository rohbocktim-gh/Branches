// Generates 60 puzzles per difficulty and checks each one is valid and quick to make.
const { generate } = require('../generator/gen.js');
const CFG = { easy: 5, medium: 7, hard: 9 };
let failures = 0;
const evalOps = (v, ops) => { let r = v[0]; ops.forEach((op, i) => { const x = v[i + 1]; r = op === '+' ? r + x : op === '−' ? r - x : r * x; }); return r; };
for (const d of Object.keys(CFG)) {
  for (let s = 1; s <= 60; s++) {
    const t0 = Date.now(), p = generate(d, s), ms = Date.now() - t0;
    const fail = m => { failures++; console.error(`${d} seed ${s}: ${m}`); };
    if (!p) { fail('no puzzle'); continue; }
    if (p.branches.length !== CFG[d]) fail('wrong branch count');
    if (ms > 2000) fail(`slow (${ms} ms)`);
    for (const b of p.branches) if (evalOps(b.ids.map(i => p.truth[i]), b.ops) !== b.total) fail('branch does not add up');
    const pts = p.pos.concat(p.branches.map(b => b.end)).map(q => q.join(','));
    if (new Set(pts).size !== pts.length) fail('overlapping cells');
  }
}
if (failures) { console.error(`${failures} problem(s)`); process.exit(1); }
console.log('generator: 180 puzzles OK');
