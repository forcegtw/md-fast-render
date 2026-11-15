// parity-sample.ts — a developer-facing parity spot-checker, separate from the graded
// verify.mjs pipeline. It takes a small, fixed slice of the practice cases, renders each
// one twice — once with the repo's tuned parse() from parse.js and once with the vendored
// upstream marked.esm.js as the reference implementation — and prints a per-case
// PASS/FAIL table to stderr with timings. Byte-identical output on the same input is the
// whole contract, so any divergence here means a real regression, not a style difference.
// Everything lives behind runParitySample(), so importing this module has no side
// effects; only main.ts's --parity flag invokes it.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

export interface ParityCase {
  id: string;
  markdown: string;
}

export interface ParityResult {
  id: string;
  pass: boolean;
  ourMs: number;
  refMs: number;
  diffAt: number; // index of first differing char, -1 when identical
}

// Upstream marked 18.1.3, verbatim, is the ground truth we must match byte-for-byte.
const { parse: referenceParse } = await import(join(HERE, 'vendor', 'marked', 'marked.esm.js'));

function timeParse(fn: (src: string) => string, markdown: string): number {
  const start = performance.now();
  fn(markdown);
  return performance.now() - start;
}

function firstDiff(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return a === b ? -1 : i;
}

// Run the parity check over a slice of the practice cases and report to stderr.
export async function runParitySample(sampleSize = 8): Promise<ParityResult[]> {
  const { parse } = await import(join(HERE, 'parse.js'));
  const casesPath = process.env.MAKEFUN_INPUT_DIR
    ? join(process.env.MAKEFUN_INPUT_DIR, 'cases.json')
    : '/home/agentuser/makefun-kit/mrs02-kit/markdown-render-speed-02-kit/practice/input/cases.json';
  const allCases: ParityCase[] = JSON.parse(readFileSync(casesPath, 'utf8'));
  const cases = allCases.slice(0, sampleSize);

  const results: ParityResult[] = [];
  for (const c of cases) {
    const ourMs = timeParse(parse, c.markdown);
    const refMs = timeParse(referenceParse, c.markdown);
    const ourOut = parse(c.markdown);
    const refOut = referenceParse(c.markdown);
    results.push({ id: c.id, pass: ourOut === refOut, ourMs, refMs, diffAt: firstDiff(ourOut, refOut) });
  }

  // The table goes to stderr so --parity stays stdout-clean if anyone pipes it.
  const width = Math.max(...results.map((r) => r.id.length)) + 2;
  process.stderr.write('parity-sample: ours (parse.js) vs reference (vendor/marked)\n');
  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    const detail = r.pass ? '' : ` first diff @ char ${r.diffAt}`;
    process.stderr.write(
      `  ${r.id.padEnd(width)} ${status}  ours=${r.ourMs.toFixed(3)}ms ref=${r.refMs.toFixed(3)}ms${detail}\n`,
    );
  }
  const failed = results.filter((r) => !r.pass).length;
  process.stderr.write(`parity-sample: ${results.length - failed}/${results.length} PASS\n`);
  return results;
}
