/**
 * Platform-version compatibility checker.
 *
 * The EquiVault platform sets an `X-EquiVault-Version` response header on
 * every API call. This module compares that version against the compat
 * range declared in package.json (`equivault.platformCompatRange`) and
 * logs a single `console.error` warning if the observed platform is
 * outside the range the MCP was built against.
 *
 * The MCP does NOT hard-fail on mismatch. The user sees an actionable
 * warning and tools still run — most will work even across platform
 * minor bumps, and hard-failing on a header missing from older platforms
 * would break the whole tool.
 */

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)/;

interface SemverTriple {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Parse "1.6.0" to { major: 1, minor: 6, patch: 0 }. Returns null on
 * any parse failure (including pre-release suffixes, which we
 * intentionally ignore for this simple check).
 */
export function parseSemver(version: string | null | undefined): SemverTriple | null {
  if (!version) return null;
  const match = SEMVER_RE.exec(version.trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareSemver(a: SemverTriple, b: SemverTriple): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

interface RangeBound {
  operator: ">=" | ">" | "<=" | "<" | "=";
  version: SemverTriple;
}

/**
 * Parse a simple npm-style range like ">=1.3.0 <1.6.0" into bounds.
 * Supports >=, >, <=, <, = joined by whitespace.
 * Returns empty array on parse failure; an empty range matches nothing.
 */
export function parseRange(range: string): RangeBound[] {
  const bounds: RangeBound[] = [];
  const parts = range.trim().split(/\s+/);
  for (const part of parts) {
    const opMatch = /^(>=|<=|>|<|=)?(\d+\.\d+\.\d+.*)$/.exec(part);
    if (!opMatch) return [];
    const operator = (opMatch[1] ?? ">=") as RangeBound["operator"];
    const parsed = parseSemver(opMatch[2]);
    if (!parsed) return [];
    bounds.push({ operator, version: parsed });
  }
  return bounds;
}

export function satisfiesRange(observed: SemverTriple, range: RangeBound[]): boolean {
  if (range.length === 0) return false;
  for (const { operator, version } of range) {
    const cmp = compareSemver(observed, version);
    switch (operator) {
      case ">=":
        if (cmp < 0) return false;
        break;
      case ">":
        if (cmp <= 0) return false;
        break;
      case "<=":
        if (cmp > 0) return false;
        break;
      case "<":
        if (cmp >= 0) return false;
        break;
      case "=":
        if (cmp !== 0) return false;
        break;
    }
  }
  return true;
}

export interface CompatCheckResult {
  status: "ok" | "mismatch" | "unknown" | "invalid-range";
  observed?: string;
  compatRange: string;
  message?: string;
}

/**
 * Compare an observed platform version against a compat range.
 * Pure function, no side effects, safe to unit test.
 */
export function evaluateCompat(
  observedVersion: string | null | undefined,
  compatRange: string
): CompatCheckResult {
  if (!observedVersion) {
    return { status: "unknown", compatRange };
  }

  const parsedObserved = parseSemver(observedVersion);
  if (!parsedObserved) {
    return {
      status: "unknown",
      observed: observedVersion,
      compatRange,
      message: `Could not parse observed platform version: ${observedVersion}`,
    };
  }

  const range = parseRange(compatRange);
  if (range.length === 0) {
    return {
      status: "invalid-range",
      observed: observedVersion,
      compatRange,
      message: `Could not parse compat range: ${compatRange}`,
    };
  }

  if (satisfiesRange(parsedObserved, range)) {
    return { status: "ok", observed: observedVersion, compatRange };
  }

  return {
    status: "mismatch",
    observed: observedVersion,
    compatRange,
    message: `Platform ${observedVersion} is outside the compat range ${compatRange}. The MCP may work, but some tools could return unexpected shapes or miss new endpoints. Check for a newer equivault-mcp release.`,
  };
}

/**
 * Runtime check. Takes a reporter function so tests do not touch stderr.
 * The default reporter logs to stderr.
 */
export function runCompatCheck(
  observedVersion: string | null | undefined,
  compatRange: string,
  reporter: (msg: string) => void = (m) => console.error(m)
): CompatCheckResult {
  const result = evaluateCompat(observedVersion, compatRange);

  if (result.status === "mismatch" && result.message) {
    reporter(`equivault-mcp: platform version check — ${result.message}`);
  } else if (result.status === "invalid-range" && result.message) {
    reporter(`equivault-mcp: ${result.message}`);
  }

  return result;
}
