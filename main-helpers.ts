// main-helpers.ts — small reporting/validation helpers for the mrs02 driver.
// Extracted from inline logic in main.ts so the summary format lives in one
// place and the 720-case contract is enforced in exactly one spot.

/**
 * Print a one-line render summary to stderr: case count, wall-clock time and
 * total serialized output size. Called once per run, right after the render
 * loop finishes, so the harness log always shows the same fields.
 */
export function logSummary(cases: { id: string }[], ms: number, outBytes: number): void {
  const perCase = cases.length > 0 ? (ms / cases.length).toFixed(2) : '0.00';
  console.error(
    `[mfr] rendered ${cases.length} cases in ${ms}ms (${perCase}ms/case, ${outBytes} output bytes)`
  );
}

/**
 * Hard contract check: this repo's baseline is exactly 720 test cases, and
 * every entry must render. If the output array length ever drifts from 720
 * (dropped cases, duplicates, mis-split input), fail loudly at the driver
 * level instead of silently writing a wrong html.json.
 */
export function validateOutputCount(n: number): void {
  if (n !== 720) {
    throw new Error(`[mfr] expected 720 rendered cases, got ${n} — refusing to write output`);
  }
}
