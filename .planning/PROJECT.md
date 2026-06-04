# equivault-mcp — Project

## What This Is

`equivault-mcp` is the official open-source [Model Context Protocol](https://modelcontextprotocol.io) server for EquiVault. It exposes the EquiVault REST API as Claude-callable tools so investors and developers can perform equity research directly from Claude Desktop, Claude Code, or any MCP-compatible client.

**Purpose:**
- **Top-of-funnel for EquiVault API adoption** — discoverable via GitHub, npm, and MCP registries
- **Feature parity with fiscal.ai** (company fundamentals, financials, screening) plus EquiVault-unique capabilities (signals, briefs, portfolios, gurus)
- **Dev-relations asset** — showcases EquiVault's API quality for developers evaluating it

## Repository

- **GitHub**: https://github.com/equivault/equivault-mcp (public, MIT)
- **npm**: `equivault-mcp` (publishing pending `NPM_TOKEN` secret)
- **Local clone**: `/Users/svparijs/Projects/AI/equivault-mcp/`

Lives **outside** the 9-repo monorepo-ish structure in the root `EquiVault.AI` workspace. Runs on its own cadence; does not block platform milestones.

## Current State

**Last shipped:** v1.0.0 (2026-04-17) — stable launch.

- **v0.1.0** (2026-04-17): MVP, 8 core research tools.
- **v0.2.0** (2026-04-17): fiscal.ai parity — 12 profile-section tools + 2 composite tools (`analyze_company`, `company_deep_dive`).
- **v0.3.0** (2026-04-17): EquiVault Complete — signals, alerts, briefs, portfolio analytics, media, gurus, markets + 2 advanced composites (`morning_briefing`, `research_report`).
- **v1.0.0** (2026-04-17): Stable launch — 38 tools frozen for v1.x line. CHANGELOG, CONTRIBUTING, EXAMPLES docs. [awesome-mcp-servers PR #5036](https://github.com/punkpeye/awesome-mcp-servers/pull/5036) open.

**Metrics:**
- 38 MCP tools across 16 modules
- 130 tests (100% passing, CI green on Node 18/20/22)
- 22.2 kB npm package, 83 files
- TypeScript + `@modelcontextprotocol/sdk` ^1.29.0 + zod ^3.25.0

## Version Alignment With Platform

The MCP follows its own semver but tracks platform capability expansions. Rule of thumb:

| Platform event | MCP response |
|---|---|
| Platform adds a new API endpoint in an entitled tier | MCP adds a corresponding tool in the next **minor** (e.g. v1.1.0) |
| Platform changes an existing endpoint contract (OpenAPI diff) | MCP adds support in the next **patch** (e.g. v1.0.1), keeping backwards compatibility |
| Platform tier model changes (e.g. new tier, price change) | MCP patches `translateError` + `get_billing_status` surface in the next **patch** |
| Platform major re-architecture (v2.0.0) | MCP cuts v2.0.0 and can drop deprecated tools |

**Mapping today:**

| Platform version | MCP surface |
|---|---|
| v1.3.x | search, get_company, financials, metrics, screen, compare, quote, billing (MCP v0.1.0) |
| v1.4.x | + company narrative (MCP v0.2.0) |
| v1.5.x | + guidance / segments / capital-allocation / risk-factors / insider / earnings-quality / debt-maturities / competitive-signals / management-statements / accounting-snapshots (MCP v0.2.0), + signals / alerts / briefs / portfolio / media / gurus / markets (MCP v0.3.0) |
| v1.6.x | Triggers MCP v1.1.0 — see roadmap below. Planned tools: OAuth-backed auth option, feature-flag evaluation, stock-data expansion, e2e-test gate awareness. |

## Guiding Principles (Inherited from Platform)

The MCP honours the same P1–P5 as the platform (see root `CLAUDE.md`), applied to the MCP surface:

- **P1 — Revenue Follows Trust:** Tool responses never silently drop data. Tier-gated features are surfaced as `isError: true` with a user-readable upgrade message, never as a blank result.
- **P2 — Close the Loop to User Value:** A new platform endpoint is not "done from the MCP perspective" until a corresponding tool exists, is tested, and is documented in EXAMPLES.md.
- **P3 — Tier-Aware by Default:** Every tool that calls a tier-gated endpoint surfaces 402s via `translateError` with `current_tier`, `required_tier`, and `monthly_delta_cents`. Composite tools use `resolveOrGate` to mark sub-sections unavailable rather than failing the whole call.
- **P4 — Ship Small, Verify Relentlessly:** TDD per tool (fail → implement → pass → commit). CI on every PR across Node 18/20/22.
- **P5 — Make the Implicit Explicit:** CHANGELOG follows Keep-a-Changelog. Every tool's `description` and every zod field's `.describe()` answer "what would a Claude picking this tool need to know to pick it confidently?"

## Key Decisions

- **GitHub over GitLab** (chosen 2026-04-17): the rest of EquiVault lives on GitLab, but MCP ecosystem discovery happens on GitHub + npm. MCP repo is GitHub-only.
- **TypeScript over Python** (chosen 2026-04-17): MCP SDK is most mature in TS, npm distribution matches Claude Desktop's onboarding path.
- **API key + tenant ID env vars** (chosen 2026-04-17): stateless, no OAuth dance. Requires Professional tier or above for API access.
- **Hybrid thin + composite tools** (chosen 2026-04-17): thin wrappers cover every endpoint (38 tools); 4 composite tools (`analyze_company`, `company_deep_dive`, `morning_briefing`, `research_report`) exist on top for common workflows.
- **Tool count frozen at 38 for v1.x** (chosen 2026-04-17): adding tools within v1.x is allowed via minor version bumps; removing tools requires v2.0.
- **CI + release infrastructure shipped at v0.1.0, NPM_TOKEN secret pending** (open 2026-04-17): `Publish to npm` workflow is green-path-ready; blocked on operator setting `NPM_TOKEN` in repo secrets.
