import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { CompanyNarrative } from "../types.js";

export function registerNarrativeTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  server.tool(
    "get_company_narrative",
    "Get the investment thesis for a company — including value drivers, headwinds, and tailwinds. Pass history=true to include prior narrative versions.",
    {
      company_id: z.string().describe("Company ID from search_companies"),
      history: z
        .boolean()
        .optional()
        .describe("Include prior narrative versions"),
    },
    async ({ company_id, history }) => {
      try {
        const params: Record<string, string> = {};
        if (history) params.history = "true";
        const data = await client.get<CompanyNarrative>(
          `/companies/${company_id}/narrative`,
          params
        );
        return {
          content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
