import { readFileSync } from 'node:fs';
const cases = JSON.parse(readFileSync(process.argv[2] ?? '/home/agentuser/makefun-kit/mrs02-kit/markdown-render-speed-02-kit/practice/input/cases.json', 'utf8'));
const ref = JSON.parse(readFileSync('/home/agentuser/makefun-kit/mrs02-kit/markdown-render-speed-02-kit/practice/reference/expected.json', 'utf8'));
const expected = ref.cases;
const { parse } = await import('./parse.js');
const out = [];
for (const c of cases) out.push(parse(c.markdown));
let bad = 0;
for (let i = 0; i < out.length; i++) {
  if (out[i] !== expected[i].html) {
    bad++;
    if (bad <= 8) {
      const e = expected[i].html, o = out[i] ?? '';
      let k = 0; while (k < e.length && k < o.length && e[k] === o[k]) k++;
      console.log(`FAIL ${cases[i].id} at char ${k}: got ${JSON.stringify(o.slice(Math.max(0,k-20), k + 60))} want ${JSON.stringify(e.slice(Math.max(0,k-20), k + 60))}`);
    }
  }
}
console.log(bad === 0 ? `ALL ${out.length} PASS` : `${bad}/${out.length} FAIL`);
