import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { Brief, BriefSummary } from "../types.js";

export function registerBriefTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  server.tool(
    "list_briefs",
    "List investment briefs. Filter by company_id, or by followed=true to only get briefs for companies the user follows.",
    {
      company_id: z.string().optional().describe("Only list briefs for this company"),
      followed: z.boolean().optional().describe("Only list briefs for followed companies"),
    },
    async ({ company_id, followed }) => {
      try {
        const params: Record<string, string> = {};
        if (company_id) params.company_id = company_id;
        if (followed !== undefined) params.followed = String(followed);

        const data = await client.get<BriefSummary[]>("/briefs", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  server.tool(
    "get_brief",
    "Get the full contents of a specific brief including its scorecard, strategy score, and rendered sections.",
    {
      brief_id: z.string().describe("Brief ID from list_briefs"),
    },
    async ({ brief_id }) => {
      try {
        const data = await client.get<Brief>(`/briefs/${brief_id}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
