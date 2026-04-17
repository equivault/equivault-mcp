# equivault-mcp — Example Prompts

Real prompts to try with Claude Desktop or Claude Code once `equivault-mcp` is configured. Claude picks the right tool automatically — you don't need to name them explicitly.

## Core research

> "Find me semiconductor companies with market cap over $100B."
> → `search_companies` / `screen_companies`

> "What sector is NVIDIA in? Give me the full profile."
> → `get_company`

> "Show Apple's quarterly income statements for the last 2 years."
> → `get_financials` with `period_type: "quarterly"`

> "How has Microsoft's P/E and revenue growth trended from 2023 to 2026?"
> → `get_metrics` with date range

> "What's the current price and today's change for AAPL, MSFT, and NVDA?"
> → `get_stock_quote`

> "Compare Apple, Microsoft, and Google on profitability and valuation."
> → `compare_companies`

> "Am I close to my query limit this month?"
> → `get_billing_status`

## Fundamental deep-dives

> "What's the investment thesis for Costco?"
> → `get_company_narrative`

> "Has Meta been beating or missing its own guidance lately?"
> → `get_guidance`

> "How does AWS revenue break down within Amazon, and which segment is growing fastest?"
> → `get_segments`

> "Has Apple been aggressive with buybacks vs dividends over the last 5 years?"
> → `get_capital_allocation`

> "What new risks has Tesla added to its 10-K risk factors recently?"
> → `get_risk_factors`

> "Are insiders at Palantir buying or selling? Any non-10b5-1 trades?"
> → `get_insider_transactions` (Advisor tier)

> "Is there anything unusual in NVIDIA's earnings quality right now?"
> → `get_earnings_quality`

> "When does Boeing's debt come due, and at what rates?"
> → `get_debt_maturities`

> "Pick a CEO — give me notable statements they've made recently, with sentiment."
> → `get_management_statements` (Advisor tier)

> "Give me everything you have on Costco — a full deep dive."
> → `company_deep_dive` (runs 14 endpoints in parallel; tier-gated sections marked unavailable)

> "I want a snapshot of Adobe — profile, financials, key metrics, and thesis."
> → `analyze_company`

## Signals and alerts

> "What signals are active on my portfolio right now?"
> → `get_signal_dashboard`

> "What are the trending signals across the market today?"
> → `get_trending_signals`

> "Has Lockheed Martin triggered any unusual signals in the last 30 days?"
> → `get_signals` + `get_signal_summary`

> "Create an alert for me: when Tesla's P/E drops below 50, notify me."
> → `create_alert` (Advisor tier)

> "Update alert abc-123 — raise the threshold to 60."
> → `update_alert`

> "Delete alert abc-123."
> → `delete_alert`

## Briefs, media, gurus

> "Are there any recent briefs for companies I follow?"
> → `list_briefs` with `followed: true`

> "Open brief brief-42 in full."
> → `get_brief`

> "Has there been a new Apple earnings call transcript uploaded?"
> → `list_media` with `company_id: "apple-inc"`, `type: "earnings_call"`

> "What new positions did Warren Buffett open last quarter?"
> → `get_guru_holdings` with `guru_id: "buffett"`, `change_type: "new"`

> "Show my portfolio's return, Sharpe ratio, and top winners."
> → `get_portfolio_analytics`

> "What markets does EquiVault support?"
> → `get_markets`

## Daily workflows

> "What should I look at first thing this morning?"
> → `morning_briefing` (signal dashboard + trending + recent briefs + optional portfolio analytics in one call)

> "Build me a full research report on Arm Holdings, ready to share with my team."
> → `research_report` (full deep-dive + recent signals + related briefs, 16 parallel calls)

## Tier-aware behavior

The MCP surfaces tier gates as Claude-readable messages. If you're on **Explorer** and ask for guidance tracking, you'll get back something like:

> *This feature requires Professional tier. You're on Explorer. Upgrade for +$249.00/mo.*

Claude will typically relay this to you so you can decide whether to upgrade or work within your tier. To check your tier at any time:

> "What EquiVault tier am I on?"
> → `get_billing_status`
