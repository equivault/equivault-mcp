import { describe, it, expect, vi } from "vitest";
import {
  evaluateCompat,
  parseSemver,
  parseRange,
  satisfiesRange,
  runCompatCheck,
} from "../src/compat.js";

describe("parseSemver", () => {
  it("parses standard triples", () => {
    expect(parseSemver("1.6.0")).toEqual({ major: 1, minor: 6, patch: 0 });
    expect(parseSemver("12.345.6789")).toEqual({ major: 12, minor: 345, patch: 6789 });
  });

  it("ignores pre-release suffixes", () => {
    expect(parseSemver("1.6.0-rc.1")).toEqual({ major: 1, minor: 6, patch: 0 });
    expect(parseSemver("1.6.0+build.42")).toEqual({ major: 1, minor: 6, patch: 0 });
  });

  it("trims whitespace", () => {
    expect(parseSemver("  1.0.0 ")).toEqual({ major: 1, minor: 0, patch: 0 });
  });

  it("returns null for malformed input", () => {
    expect(parseSemver("v1.0.0")).toBeNull();
    expect(parseSemver("1.0")).toBeNull();
    expect(parseSemver("")).toBeNull();
    expect(parseSemver(null)).toBeNull();
    expect(parseSemver(undefined)).toBeNull();
  });
});

describe("parseRange", () => {
  it("parses a bounded range", () => {
    const bounds = parseRange(">=1.3.0 <1.6.0");
    expect(bounds).toHaveLength(2);
    expect(bounds[0]).toEqual({
      operator: ">=",
      version: { major: 1, minor: 3, patch: 0 },
    });
    expect(bounds[1]).toEqual({
      operator: "<",
      version: { major: 1, minor: 6, patch: 0 },
    });
  });

  it("defaults to >= when no operator is given", () => {
    const bounds = parseRange("1.0.0");
    expect(bounds).toEqual([
      { operator: ">=", version: { major: 1, minor: 0, patch: 0 } },
    ]);
  });

  it("supports all five operators", () => {
    const bounds = parseRange(">=1.0.0 >1.0.0 <=2.0.0 <3.0.0 =1.5.0");
    expect(bounds.map((b) => b.operator)).toEqual([">=", ">", "<=", "<", "="]);
  });

  it("returns empty array on parse failure", () => {
    expect(parseRange("garbage")).toEqual([]);
    expect(parseRange(">=1.0")).toEqual([]);
  });
});

describe("satisfiesRange", () => {
  const range = parseRange(">=1.3.0 <1.6.0");

  it("matches versions inside the range", () => {
    expect(satisfiesRange({ major: 1, minor: 3, patch: 0 }, range)).toBe(true);
    expect(satisfiesRange({ major: 1, minor: 5, patch: 99 }, range)).toBe(true);
  });

  it("rejects versions below the lower bound", () => {
    expect(satisfiesRange({ major: 1, minor: 2, patch: 99 }, range)).toBe(false);
  });

  it("rejects versions at or above the upper bound", () => {
    expect(satisfiesRange({ major: 1, minor: 6, patch: 0 }, range)).toBe(false);
    expect(satisfiesRange({ major: 2, minor: 0, patch: 0 }, range)).toBe(false);
  });

  it("never matches an empty range", () => {
    expect(satisfiesRange({ major: 1, minor: 0, patch: 0 }, [])).toBe(false);
  });
});

describe("evaluateCompat", () => {
  const compatRange = ">=1.3.0 <1.6.0";

  it("returns ok when observed version is in range", () => {
    const result = evaluateCompat("1.5.2", compatRange);
    expect(result.status).toBe("ok");
    expect(result.observed).toBe("1.5.2");
    expect(result.message).toBeUndefined();
  });

  it("returns mismatch with actionable message when out of range", () => {
    const result = evaluateCompat("1.6.0", compatRange);
    expect(result.status).toBe("mismatch");
    expect(result.observed).toBe("1.6.0");
    expect(result.message).toContain("1.6.0");
    expect(result.message).toContain(compatRange);
    expect(result.message).toContain("newer equivault-mcp release");
  });

  it("returns unknown when version is missing", () => {
    const result = evaluateCompat(null, compatRange);
    expect(result.status).toBe("unknown");
    expect(result.observed).toBeUndefined();
  });

  it("returns unknown when version is unparseable", () => {
    const result = evaluateCompat("not-a-version", compatRange);
    expect(result.status).toBe("unknown");
    expect(result.observed).toBe("not-a-version");
  });

  it("returns invalid-range when the compat range is malformed", () => {
    const result = evaluateCompat("1.5.0", "garbage");
    expect(result.status).toBe("invalid-range");
  });
});

describe("runCompatCheck", () => {
  it("reports mismatches", () => {
    const reporter = vi.fn();
    runCompatCheck("1.6.0", ">=1.3.0 <1.6.0", reporter);
    expect(reporter).toHaveBeenCalledOnce();
    expect(reporter.mock.calls[0][0]).toContain("platform version check");
    expect(reporter.mock.calls[0][0]).toContain("1.6.0");
  });

  it("stays silent when in range", () => {
    const reporter = vi.fn();
    runCompatCheck("1.5.0", ">=1.3.0 <1.6.0", reporter);
    expect(reporter).not.toHaveBeenCalled();
  });

  it("stays silent when version is unknown", () => {
    const reporter = vi.fn();
    runCompatCheck(null, ">=1.3.0 <1.6.0", reporter);
    expect(reporter).not.toHaveBeenCalled();
  });

  it("reports when the range itself is malformed", () => {
    const reporter = vi.fn();
    runCompatCheck("1.5.0", "garbage", reporter);
    expect(reporter).toHaveBeenCalledOnce();
    expect(reporter.mock.calls[0][0]).toContain("Could not parse compat range");
  });

  it("defaults to console.error when no reporter given", () => {
    // Smoke test — just confirm it doesn't throw.
    expect(() => runCompatCheck(null, ">=1.3.0 <1.6.0")).not.toThrow();
  });
});
