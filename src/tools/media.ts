import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { MediaListResponse } from "../types.js";

export function registerMediaTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  server.tool(
    "list_media",
    "List media items (earnings calls, podcasts, presentations, investor days, press releases). Filter by company_id, type, or processing status.",
    {
      company_id: z.string().optional().describe("Filter by company"),
      type: z
        .enum(["earnings_call", "podcast", "presentation", "investor_day", "press_release"])
        .optional()
        .describe("Filter by media type"),
      status: z
        .enum(["pending", "processing", "ready", "failed"])
        .optional()
        .describe("Filter by processing status"),
    },
    async ({ company_id, type, status }) => {
      try {
        const params: Record<string, string> = {};
        if (company_id) params.company_id = company_id;
        if (type) params.type = type;
        if (status) params.status = status;

        const data = await client.get<MediaListResponse>("/media/items", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
