import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { StockQuote } from "../types.js";

export function registerMarketTools(server: McpServer, client: EquiVaultClient): void {
  server.tool(
    "get_stock_quote",
    "Get real-time stock quotes for one or more ticker symbols.",
    {
      tickers: z.string().describe("Comma-separated ticker symbols (e.g. 'AAPL,MSFT,GOOGL')"),
    },
    async ({ tickers }) => {
      try {
        const result = await client.get<StockQuote[]>("/stocks/quotes", { tickers });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
