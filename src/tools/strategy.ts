import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { StrategyProfile } from "../types.js";

export function registerStrategyTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  server.tool(
    "get_strategy_profiles",
    "List all available investment strategy profiles (system + custom). Each profile defines screening criteria for a particular investing approach.",
    async () => {
      try {
        const data = await client.get<StrategyProfile[]>("/strategy-profiles");
        return {
          content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
