import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { BillingStatus } from "../types.js";

export function registerBillingTools(server: McpServer, client: EquiVaultClient): void {
  server.tool(
    "get_billing_status",
    "Get current billing status, tier, query usage, and limits for your EquiVault account.",
    async () => {
      try {
        const result = await client.get<BillingStatus>("/billing/status");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
