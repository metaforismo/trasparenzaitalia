import { getSourcePolicy, type SourceId } from "@/lib/data/source-policy";

export type FreshnessState = "fresh" | "stale" | "unknown";

export type Freshness = {
  state: FreshnessState;
  sourceTimestamp: string | null;
  ageSeconds: number | null;
  staleAfterSeconds: number | null;
  checkedAt: string;
};

function parseTimestamp(value: string | null): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function classifyFreshness(
  sourceId: SourceId,
  sourceTimestamp: string | null,
  now: Date = new Date(),
): Freshness {
  const policy = getSourcePolicy(sourceId);
  const parsed = parseTimestamp(sourceTimestamp);
  const checkedAt = now.toISOString();

  if (parsed === null || policy.staleAfterSeconds === null) {
    return {
      state: "unknown",
      sourceTimestamp,
      ageSeconds: parsed === null ? null : Math.max(0, (now.getTime() - parsed) / 1_000),
      staleAfterSeconds: policy.staleAfterSeconds,
      checkedAt,
    };
  }

  const ageSeconds = (now.getTime() - parsed) / 1_000;
  if (!Number.isFinite(ageSeconds) || ageSeconds < -300) {
    return {
      state: "unknown",
      sourceTimestamp,
      ageSeconds: null,
      staleAfterSeconds: policy.staleAfterSeconds,
      checkedAt,
    };
  }

  return {
    state: ageSeconds > policy.staleAfterSeconds ? "stale" : "fresh",
    sourceTimestamp,
    ageSeconds: Math.max(0, ageSeconds),
    staleAfterSeconds: policy.staleAfterSeconds,
    checkedAt,
  };
}
