# equivault-mcp — Version Alignment Strategy

This document explains how `equivault-mcp` stays in sync with the EquiVault platform API as both evolve.

## TL;DR

- **npm semver** for the MCP (`1.0.1`, `1.1.0`, `2.0.0`). Consumers get the standard npm version ranges they expect.
- **Machine-readable compat range** declared in `package.json` under `equivault.platformCompatRange`. Tools, CI, and humans can check it.
- **Runtime warning** if the observed platform version is outside that range — emitted once per client instance to stderr. The MCP still runs; the user sees an actionable message.
- **Release cadence commitment**: the MCP ships an alignment release within **7 calendar days** of each platform minor ship.

The MCP's version is *its own surface contract* (the 38 tools). The `platformCompatRange` field is the *consumed* contract (the EquiVault REST API surface it was built against).

## The `equivault` block in `package.json`

```json
{
  "name": "equivault-mcp",
  "version": "1.0.1",
  "equivault": {
    "platformCompatRange": ">=1.3.0 <1.6.0",
    "platformSurfaceVersion": "1.5.x"
  }
}
```

- **`platformCompatRange`** — npm-style semver range of platform API versions this MCP release was built for. The runtime checker parses this and compares against the observed platform version.
- **`platformSurfaceVersion`** — human-readable summary. Displayed in documentation; not consumed programmatically.

## The `X-EquiVault-Version` header

**Platform contract** (mirrored here for convenience):

> Every response from `https://api.equivault.ai/api/v1/*` sets an `X-EquiVault-Version` header with the platform's currently-deployed semver version (e.g. `1.5.2`).

The MCP reads this header on the first response per client instance and compares it to `platformCompatRange`:

- **In range** → silent
- **Out of range** → one `console.error` warning
- **Header missing** → silent (older platform; MCP trusts the user's version pinning)
- **Header unparseable** → silent (platform contract is our source of truth — the MCP is permissive)
- **Range unparseable** → a warning tells the user the MCP itself is misconfigured

All tool calls continue to run regardless. The MCP never hard-fails on version mismatch — most minor bumps are backward-compatible and refusing to function would be worse than surfacing a warning.

## When to bump each version

### MCP patch (`1.0.1` → `1.0.2`)

- Dependency updates
- Tool description / Zod field description improvements
- Documentation fixes
- Non-breaking Zod schema tightening
- `platformCompatRange` widening (e.g. platform patch release with no surface change)

### MCP minor (`1.0.x` → `1.1.0`)

- **New platform endpoint** exposed as a new MCP tool
- **New optional field** on an existing endpoint surfaced in tool responses
- **New tier** or pricing change — `translateError` updates
- **`platformCompatRange` shifts to a new major or minor** (e.g. `>=1.3.0 <1.6.0` → `>=1.3.0 <1.7.0`)

### MCP major (`1.x.x` → `2.0.0`)

- **Tool removal** (any existing tool goes away)
- **Tool signature change** (renamed required parameter, changed return shape in a breaking way)
- **Auth contract change** (e.g. drop API key support in favour of OAuth only)
- Platform itself cuts `v2.0.0` with breaking API changes

## Platform → MCP alignment table

| Platform version | MCP release | Notes |
|---|---|---|
| v1.3.x | v0.1.0 | Initial 8 core research tools |
| v1.4.x | v0.2.0 | + company narrative |
| v1.5.x | v0.2.0 → v0.3.0 | + 10 profile sections, then signals / briefs / portfolios |
| v1.5.x | v1.0.0 | Tool surface frozen; semver stabilised |
| v1.5.x | **v1.0.1** (current) | Compat infrastructure shipped; runtime check, metadata block |
| v1.6.x | v1.1.0 (planned) | analyst-ratings, health-scores, price-targets, entitlements snapshot, feature flags, optional OAuth |
| v2.0.x | v2.0.0 (conditional) | Only cut if platform makes a breaking change |

The canonical version of this table is maintained in `.planning/equivault-mcp/ROADMAP.md` in the EquiVault planning repo; this README section is a user-facing copy.

## Release cadence commitment

**An MCP alignment release ships within 7 calendar days of each platform minor release.** The alignment release:

- Expands `platformCompatRange` to include the new platform version
- Adds tools for any new endpoints surfaced in an entitled tier
- Bumps the tool description for any contract change on existing endpoints
- Updates CHANGELOG, EXAMPLES, and the alignment table above

Operator tasks that enable this cadence are listed in `.planning/equivault-mcp/OPERATOR-TASKS.md` (in the planning repo, not this one).

## What users see in practice

**Happy path (platform v1.5.2, MCP v1.0.1):**
```
# no warning; everything works
```

**Drift (platform v1.6.0, MCP v1.0.1 still installed):**
```
equivault-mcp: platform version check — Platform 1.6.0 is outside the
compat range >=1.3.0 <1.6.0. The MCP may work, but some tools could return
unexpected shapes or miss new endpoints. Check for a newer equivault-mcp
release.
```

**Action**: upgrade with `npm install -g equivault-mcp@latest` or let npx pick it up (`npx -y equivault-mcp@latest`).

## Disabling the check (escape hatch)

Programmatic consumers of `EquiVaultClient` can pass `platformCompatRange: null`:

```typescript
const client = new EquiVaultClient({
  apiKey,
  tenantId,
  baseUrl,
  platformCompatRange: null, // opt out of the compat check
});
```

The stdio MCP server reads the range from `package.json` and does not expose an env-var override. If you need to suppress the warning at runtime, pipe stderr elsewhere (`2>/dev/null` in your MCP client config) — but the recommended action is to upgrade the MCP.

## History

- **v1.0.1** (2026-04-18) — compat infrastructure shipped. `equivault.platformCompatRange` field added; runtime check added to the HTTP client.
- **v1.0.0** (2026-04-17) — semver stabilised; tool surface frozen at 38.
- **v0.1.0 through v0.3.0** (2026-04-17) — all built against platform v1.3-v1.5 without machine-readable compat tracking. Retroactively in range `>=1.3.0 <1.6.0`.
