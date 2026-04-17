import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { GuruHolding } from "../types.js";

export function registerGuruTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  server.tool(
    "get_guru_holdings",
    "Get portfolio holdings for a prominent investor (guru). Optionally filter by change type: new positions, increased, decreased, or sold.",
    {
      guru_id: z.string().describe("Guru ID"),
      change_type: z
        .enum(["new", "increased", "decreased", "sold"])
        .optional()
        .describe("Filter by change type"),
    },
    async ({ guru_id, change_type }) => {
      try {
        const params: Record<string, string> = {};
        if (change_type) params.change_type = change_type;

        const data = await client.get<GuruHolding[]>(
          `/gurus/${guru_id}/holdings`,
          params
        );
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
