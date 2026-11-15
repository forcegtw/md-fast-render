// healthcheck.ts: verifies the repo's critical inputs before a render run.
// No side effects on import — only runHealthCheck() touches anything.

import { accessSync, constants } from 'node:fs';
import { join } from 'node:path';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

export async function runHealthCheck(): Promise<boolean> {
  let ok = true;
  const report = (name: string, good: boolean, detail = '') => {
    console.error(`${good ? '✓' : '✗'} ${name}${detail ? `: ${detail}` : ''}`);
    if (!good) ok = false;
  };
  try {
    accessSync(join(INPUT_DIR, 'cases.json'), constants.R_OK);
    report('input readable', true, INPUT_DIR);
  } catch (e) {
    report('input readable', false, `${INPUT_DIR} (${(e as Error).message})`);
  }
  try {
    accessSync(OUTPUT_DIR, constants.W_OK);
    report('output writable', true, OUTPUT_DIR);
  } catch (e) {
    report('output writable', false, `${OUTPUT_DIR} (${(e as Error).message})`);
  }
  try {
    const mod = await import('./parse.js');
    report('parse.js loads', true, typeof mod.parse === 'function' ? 'parse() exported' : '');
    if (typeof mod.parse !== 'function') report('parse.js exposes parse()', false);
  } catch (e) {
    report('parse.js loads', false, (e as Error).message);
  }
  return ok;
}
