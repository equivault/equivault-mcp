# Roadmap: equivault-mcp

## Overview

Public MCP server that exposes the EquiVault API to Claude (Desktop, Code, and any MCP client). Runs on its own release cadence. Each MCP release is a "milestone" (semver-named) that tracks back to the platform version whose API surface it mirrors.

Each MCP milestone is self-contained: scope → implementation plan → release → registry submission. Because the server is stateless and the npm package ships independently of platform deploys, MCP releases never block platform releases (and vice versa).

## Milestones

### Shipped

- ✅ **v0.1.0 MVP** (2026-04-17) — 8 core research tools; tracks platform v1.3.x — [archive](milestones/v0.1.0-MILESTONE.md)
- ✅ **v0.2.0 fiscal.ai Parity** (2026-04-17) — +14 tools (narrative + 10 profile sections + 2 composites); tracks platform v1.4.x–v1.5.x — [archive](milestones/v0.2.0-MILESTONE.md)
- ✅ **v0.3.0 EquiVault Complete** (2026-04-17) — +16 tools (signals + alerts + briefs + portfolios + media + gurus + markets + 2 advanced composites); tracks platform v1.5.x — [archive](milestones/v0.3.0-MILESTONE.md)
- ✅ **v1.0.0 Stable Launch** (2026-04-17) — tool surface frozen at 38; full launch docs (CHANGELOG, CONTRIBUTING, EXAMPLES); awesome-mcp-servers submission — [archive](milestones/v1.0.0-MILESTONE.md)
- ✅ **v1.0.1 Platform Compat Infrastructure** (2026-04-18) — `equivault.platformCompatRange` in package.json; runtime check via `X-EquiVault-Version` header; `docs/ALIGNMENT.md`; 7-day release-cadence commitment — [archive](milestones/v1.0.1-MILESTONE.md)

### Active

- 🚧 **v1.1.0 Platform v1.6.x Alignment** — OAuth auth option + feature-flag evaluation tool + stock data expansion + e2e-route awareness. Triggered by platform v1.6.0 (currently executing Phase 05). — [milestone](milestones/v1.1.0-MILESTONE.md)

### Planned

- 🧭 **v1.2.0 Real-Time & Export Surface** — SSE signal stream adapter (if MCP streaming lands), `export_pdf`/`export_pptx`/`export_xlsx` tools once platform export jobs stabilise.
- 🧭 **v2.0.0 Major** — only if the platform ships a breaking API change (v2.x); will re-evaluate auth (OAuth-only?), retire deprecated tools, and consider SSE-native transports.

## Progress

| Milestone | Tools added | Total tools | Status | Shipped |
|---|---|---|---|---|
| v0.1.0 MVP | 8 | 8 | Complete | 2026-04-17 |
| v0.2.0 fiscal.ai Parity | 14 | 22 | Complete | 2026-04-17 |
| v0.3.0 EquiVault Complete | 16 | 38 | Complete | 2026-04-17 |
| v1.0.0 Stable Launch | 0 (docs + release) | 38 | Complete | 2026-04-17 |
| v1.0.1 Platform Compat Infrastructure | 0 (compat layer) | 38 | Complete | 2026-04-18 |
| v1.1.0 Platform v1.6.x Alignment | tbd (≈3–5 new tools) | tbd | Planned | — |

## Version Alignment With Platform

The MCP doesn't share semver with the platform; instead it tracks the platform's API surface. An MCP minor bump corresponds to a platform minor surface addition; an MCP patch bump corresponds to contract tweaks.

```
Platform v1.3.x  ────►  MCP v0.1.0 (MVP)
Platform v1.4.x  ────►  MCP v0.2.0 (fiscal.ai parity, narrative)
Platform v1.5.x  ────►  MCP v0.2.0 + v0.3.0 (profile sections + signals/briefs/portfolios)
Platform v1.6.x  ────►  MCP v1.1.0 (OAuth, feature flags, stocks expansion) [planned]
Platform v2.0.0  ────►  MCP v2.0.0 [conditional on platform major]
```

## Trigger Policy

An MCP minor release is triggered when any of the following is true:

1. **New platform endpoint** added in an entitled tier (not marketing, not admin-only)
2. **Behavioural change** in an existing endpoint (new optional field, new enum value, new error code) that an MCP tool should surface
3. **New tier** added to the 6-tier model — `translateError` needs to know about it
4. **Cross-repo contract drift detected** by `equivault-contracts` CI that affects the MCP's assumptions

A patch release is triggered by: dependency updates, doc fixes, tool description tweaks, non-breaking Zod schema tightening.

## Operating Model

- **Who triggers an MCP release:** any phase in a platform milestone that adds new API surface should end with a ≤30-minute MCP-alignment task that updates the MCP tools in lockstep. Track as a quick task under the milestone's phase, not as a phase of its own — MCP work is always small relative to the platform work that triggers it.
- **When MCP changes land in a platform milestone:** reference the MCP version bump in the milestone's roadmap + ship notes (e.g. v1.6.0 ship notes mention MCP v1.1.0).
- **Where MCP-specific phases live:** under `.planning/equivault-mcp/phases/` only when the MCP has work independent of the platform (e.g. registry submission, auth refactor, major dep upgrade).

## Conventions

- Shipped MCP milestone records live at `.planning/equivault-mcp/milestones/<version>-MILESTONE.md`. Each is one-page: scope, tools added, tests, platform version tracked, links to the GitHub tag and the release PR/plan under `docs/superpowers/plans/`.
- The MCP repo's own `CHANGELOG.md` is the canonical source for release notes; this roadmap's `milestones/*.md` files are just GSD-side pointers with alignment context.
- No `REQUIREMENTS.md` at the stream level — the MCP has no independent requirements beyond "mirror the platform API surface". Each milestone's `MILESTONE.md` lists the specific tools it added.
