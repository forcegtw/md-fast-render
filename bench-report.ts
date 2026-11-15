#!/usr/bin/env node
// bench-report.ts — run the full 720-case verify benchmark N times and summarize timings.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)));

function iterations(): number {
  const raw = process.env.MFR_BENCH_ITER;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 5;
}

function runOnce(): number {
  const t0 = performance.now();
  const r = spawnSync('node', ['verify.mjs'], { cwd: repoRoot, encoding: 'utf8' });
  const ms = performance.now() - t0;
  if (r.status !== 0) {
    throw new Error(`verify.mjs failed (exit ${r.status}): ${(r.stderr || '').slice(-400)}`);
  }
  return ms;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export async function runBenchReport(): Promise<void> {
  const n = iterations();
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    times.push(runOnce());
  }
  const sorted = [...times].sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((a, b) => a + (b - mean) ** 2, 0) / times.length;
  const stdev = Math.sqrt(variance);
  const fmt = (v: number) => v.toFixed(1).padStart(9);
  process.stderr.write(
    [
      `iterations: ${times.length}`,
      `mean   ms: ${fmt(mean)}`,
      `median ms: ${fmt(quantile(sorted, 0.5))}`,
      `min    ms: ${fmt(sorted[0])}`,
      `max    ms: ${fmt(sorted[sorted.length - 1])}`,
      `stdev  ms: ${fmt(stdev)}`,
    ].join('\n') + '\n',
  );
}
