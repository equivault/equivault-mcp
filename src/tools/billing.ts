import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EquiVaultApiError, type EquiVaultClient } from "../client.js";
import { translateError } from "../errors.js";
import type { BillingStatus } from "../types.js";

function handleError(err: unknown) {
  if (err instanceof EquiVaultApiError) {
    return {
      content: [{ type: "text" as const, text: translateError(err.status, err.body) }],
      isError: true as const,
    };
  }
  return {
    content: [{ type: "text" as const, text: `Unexpected error: ${String(err)}` }],
    isError: true as const,
  };
}

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
