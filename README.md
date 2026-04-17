<p align="center">
  <img src="brand/social-preview.png" alt="equivault-mcp — AI-powered equity research for Claude" width="100%"/>
</p>

<h1 align="center">equivault-mcp</h1>

<p align="center">
  MCP server for <a href="https://equivault.ai">EquiVault</a> — AI-powered equity research tools for Claude.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/equivault-mcp"><img src="https://img.shields.io/npm/v/equivault-mcp?color=F59E0B&labelColor=0F172A" alt="npm"/></a>
  <a href="https://github.com/equivault/equivault-mcp/actions"><img src="https://img.shields.io/github/actions/workflow/status/equivault/equivault-mcp/ci.yml?branch=main&labelColor=0F172A" alt="CI"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-8B5CF6?labelColor=0F172A" alt="license"/></a>
</p>

## Quick Start

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "equivault": {
      "command": "npx",
      "args": ["-y", "equivault-mcp"],
      "env": {
        "EQUIVAULT_API_KEY": "your-api-key",
        "EQUIVAULT_TENANT_ID": "your-tenant-id"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add equivault -- npx -y equivault-mcp
```

Then set your credentials:

```bash
export EQUIVAULT_API_KEY=your-api-key
export EQUIVAULT_TENANT_ID=your-tenant-id
```

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `EQUIVAULT_API_KEY` | Yes | — | Your EquiVault API key |
| `EQUIVAULT_TENANT_ID` | Yes | — | Your EquiVault tenant ID |
| `EQUIVAULT_BASE_URL` | No | `https://api.equivault.ai/api/v1` | API base URL (override for self-hosted) |

## Tools

| Tool | Description |
|---|---|
| `search_companies` | Search for companies by name, ticker, or keyword |
| `get_company` | Get detailed information about a specific company |
| `get_financials` | Get financial statements (income statement, balance sheet, cash flow) |
| `get_metrics` | Get financial KPIs and metrics for a company over time |
| `get_stock_quote` | Get real-time stock quotes for one or more tickers |
| `screen_companies` | Screen companies using financial filters (sector, market cap, ratios, etc.) |
| `compare_companies` | Compare financial metrics across multiple companies side by side |
| `get_billing_status` | Check your current tier, query usage, and account limits |

## Examples

**Research a company:**
> "What are Apple's latest annual financials and key metrics?"

**Screen for opportunities:**
> "Find technology companies with a market cap over $10B and P/E ratio under 20."

**Compare competitors:**
> "Compare Microsoft, Google, and Amazon on revenue growth and profit margins."

**Check account status:**
> "How many queries do I have left this month?"

## Development

```bash
# Clone and install
git clone https://github.com/your-org/equivault-mcp
cd equivault-mcp
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Watch mode (development)
npm run dev
```

## License

MIT
