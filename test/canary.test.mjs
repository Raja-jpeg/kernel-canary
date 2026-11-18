import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCanary } from "../src/canary.ts";

test("passes below the 20% threshold", () => {
  assert.deepEqual(evaluateCanary(8, 9), {
    decision: "Pass",
    increasePercent: 12.5,
    limitMs: 9.6,
    aboveLimitMs: 0
  });
});

test("passes at exactly 20%", () => {
  for (const [baseline, limit] of [
    [8, 9.6],
    [9, 10.8]
  ]) {
    const result = evaluateCanary(baseline, limit);
    assert.equal(result.decision, "Pass");
    assert.ok(Math.abs(result.increasePercent - 20) < 1e-12);
    assert.equal(result.aboveLimitMs, 0);
  }
});

test("holds the fictional sample above the threshold", () => {
  assert.deepEqual(evaluateCanary(8, 12), {
    decision: "Hold",
    increasePercent: 50,
    limitMs: 9.6,
    aboveLimitMs: 2.4
  });
});

test("returns Insufficient data for missing or invalid measurements or policy", () => {
  for (const input of [
    [],
    [8],
    [undefined, 12],
    [0, 12],
    [-8, 12],
    [NaN, 12],
    [8, Infinity],
    [8, -1],
    [8, 12, -1],
    [8, 12, NaN]
  ]) {
    assert.deepEqual(evaluateCanary(...input), {
      decision: "Insufficient data"
    });
  }
});
