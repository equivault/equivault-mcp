import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { PortfolioAnalytics } from "../types.js";

export function registerPortfolioTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  server.tool(
    "get_portfolio_analytics",
    "Get pre-computed analytics for a portfolio — total return, Sharpe ratio, sector allocation, top winners/losers.",
    {
      portfolio_id: z.string().describe("Portfolio ID"),
    },
    async ({ portfolio_id }) => {
      try {
        const data = await client.get<PortfolioAnalytics>(
          `/portfolios/${portfolio_id}/analytics`
        );
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
