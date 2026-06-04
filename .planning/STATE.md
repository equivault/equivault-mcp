---
gsd_state_version: 1.0
stream: equivault-mcp
status: v1.1.0 planning — waiting on platform v1.6.x surface + X-EquiVault-Version header
last_shipped: v1.0.1
last_updated: "2026-04-18T10:00:00.000Z"
progress:
  shipped_milestones: 5
  total_tools: 38
  total_tests: 158
---

# equivault-mcp Stream State

## Current Position

- **Last shipped:** v1.0.0 Stable Launch (2026-04-17)
- **In flight:** v1.1.0 Platform v1.6.x Alignment — scope TBD; waits on platform v1.6.x phases to land their new API surface
- **Not blocking:** platform milestones. The MCP is a trailing-edge consumer; it ships after the platform exposes the surface it wants to mirror.

## Shipped Milestones

| Version | Name | Platform tracked | Tools added | Total tools | Shipped |
|---|---|---|---|---|---|
| v0.1.0 | MVP | v1.3.x | 8 | 8 | 2026-04-17 |
| v0.2.0 | fiscal.ai Parity | v1.4.x–v1.5.x | 14 | 22 | 2026-04-17 |
| v0.3.0 | EquiVault Complete | v1.5.x | 16 | 38 | 2026-04-17 |
| v1.0.0 | Stable Launch | — (docs + release) | 0 | 38 | 2026-04-17 |
| v1.0.1 | Platform Compat Infrastructure | v1.3.x–v1.5.x | 0 (compat layer) | 38 | 2026-04-18 |

## Open Items

Operator tasks are tracked step-by-step in **[`OPERATOR-TASKS.md`](./OPERATOR-TASKS.md)** in this directory. Quick summary:

1. 🔴 **`NPM_TOKEN` secret** — not configured; no version is on npm yet. See OPERATOR-TASKS Task 1.
2. 🟡 **awesome-mcp-servers PR #5036** — open, awaiting upstream review. See OPERATOR-TASKS Task 2.
3. 🟡 **Platform-side `X-EquiVault-Version` header** — 5-line middleware change in `equivault-api/src/main.py`. Tracked in v1.6.0 roadmap under "Pre-ship platform tasks for MCP alignment". See OPERATOR-TASKS Task 4.
4. 🟢 **glama.ai registry submission** — unlocks a second registry + score badge. See OPERATOR-TASKS Task 3.
5. **v1.1.0 scope freeze** — triggered once platform v1.6.0 ships + the header middleware is live.

## Next Actions

- Continue platform v1.6.0 execution. The MCP sits idle until new API surface is final.
- When platform v1.6.0 ships, open `.planning/equivault-mcp/milestones/v1.1.0-MILESTONE.md` (already scaffolded) and expand into a full implementation plan under `docs/superpowers/plans/` in the MCP repo.

## Reference

- Stream PROJECT: `.planning/equivault-mcp/PROJECT.md`
- Stream ROADMAP: `.planning/equivault-mcp/ROADMAP.md`
- MCP repo: https://github.com/equivault/equivault-mcp (local: `/Users/svparijs/Projects/AI/equivault-mcp/`)
- Canonical release notes: `equivault-mcp/CHANGELOG.md`
- MCP design spec: `docs/superpowers/specs/2026-04-12-equivault-mcp-server-design.md`
- Shipped plans: `docs/superpowers/plans/2026-04-12-equivault-mcp-m{1,2,3}-*.md`
