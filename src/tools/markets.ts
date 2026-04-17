import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { Market } from "../types.js";

export function registerMarketsTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  server.tool(
    "get_markets",
    "List all available markets (exchanges) that EquiVault supports — code, name, country, currency, MIC.",
    async () => {
      try {
        const data = await client.get<Market[]>("/markets");
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
