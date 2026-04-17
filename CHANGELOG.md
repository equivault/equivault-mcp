# Changelog

All notable changes to `equivault-mcp` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] — 2026-04-17 · EquiVault Complete

Full EquiVault capability coverage — signals, alerts, briefs, portfolios, media, gurus, markets.

### Added

- **Signal intelligence (5 tools):** `get_signals`, `get_signal_summary`, `get_signal_dashboard`, `get_signal_trends`, `get_trending_signals`
- **Alert management (3 tools):** `create_alert`, `update_alert`, `delete_alert` (Advisor tier)
- **Briefs (2 tools):** `list_briefs`, `get_brief`
- **Portfolio, media, gurus, markets (4 tools):** `get_portfolio_analytics`, `list_media`, `get_guru_holdings`, `get_markets`
- **Advanced composite tools (2):** `morning_briefing` (daily research summary), `research_report` (full deep-dive + signals + briefs)
- **HTTP client:** `put()` and `delete()` methods for alert mutation, with structured error handling matching the existing `get()` / `post()` contract.

### Changed

- Tool count: **22 → 38** (16 new).
- Test count: **88 → 130** (42 new).

## [0.2.0] — 2026-04-17 · fiscal.ai Parity

Depth to match fiscal.ai's equity research surface — full fundamental profiles plus one-shot composite tools.

### Added

- **Narrative (1 tool):** `get_company_narrative` (thesis, drivers, headwinds, tailwinds)
- **Profile sections (10 tools):** `get_guidance`, `get_segments`, `get_capital_allocation`, `get_risk_factors`, `get_insider_transactions`, `get_earnings_quality`, `get_debt_maturities`, `get_competitive_signals`, `get_management_statements`, `get_accounting_snapshots`
- **Strategy profiles (1 tool):** `get_strategy_profiles`
- **Composite tools (2):** `analyze_company` (4 parallel calls), `company_deep_dive` (14 parallel calls) — both with graceful 402 degradation via `resolveOrGate` helper.

### Changed

- Tool count: **8 → 22** (14 new).
- Test count: **65 → 88** (23 new).

## [0.1.0] — 2026-04-17 · MVP

Initial public release. Core equity research tools for Claude.

### Added

- **Core research (8 tools):** `search_companies`, `get_company`, `get_financials`, `get_metrics`, `get_stock_quote`, `screen_companies`, `compare_companies`, `get_billing_status`
- **HTTP client** with API key + tenant ID auth
- **Tier-aware error handling:** 401 / 402 (upgrade prompt with cost delta) / 404 / 429 / 5xx
- **CI/CD:** GitHub Actions for typecheck + test + build on Node 18, 20, 22; tag-triggered npm publish workflow (requires `NPM_TOKEN` secret).
- **Brand:** Official EquiVault identity — indigo `#4F46E5` + amber `#FBBF24` ascending-chart mark, Space Grotesk wordmark, dark-mode social preview banner.

[Unreleased]: https://github.com/equivault/equivault-mcp/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/equivault/equivault-mcp/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/equivault/equivault-mcp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/equivault/equivault-mcp/releases/tag/v0.1.0
