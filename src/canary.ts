export function evaluateCanary(
  baselineMs?: number,
  canaryMs?: number,
  thresholdPercent = 20
) {
  if (
    baselineMs === undefined ||
    !Number.isFinite(baselineMs) ||
    baselineMs <= 0 ||
    canaryMs === undefined ||
    !Number.isFinite(canaryMs) ||
    canaryMs < 0 ||
    !Number.isFinite(thresholdPercent) ||
    thresholdPercent < 0
  ) {
    return { decision: "Insufficient data" };
  }

  const increaseMs = canaryMs - baselineMs;
  const allowedIncreaseMs = (baselineMs * thresholdPercent) / 100;
  const limitMs = baselineMs + allowedIncreaseMs;

  const hold = canaryMs > limitMs;

  return {
    decision: hold ? "Hold" : "Pass",
    increasePercent: (increaseMs / baselineMs) * 100,
    limitMs,
    aboveLimitMs: hold ? Math.max(0, increaseMs - allowedIncreaseMs) : 0
  };
}
