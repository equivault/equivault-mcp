import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { ScreenResult, ComparisonResponse } from "../types.js";

export function registerScreeningTools(server: McpServer, client: EquiVaultClient): void {
  server.tool(
    "screen_companies",
    "Screen companies using financial filters. Returns companies matching your criteria.",
    {
      filters: z
        .string()
        .describe(
          'JSON string of screening filters, e.g. \'{"sector":"Technology","market_cap_min":1000000000}\''
        ),
    },
    async ({ filters }) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(filters);
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: "Invalid filters: must be a valid JSON string. Example: {\"sector\":\"Technology\",\"market_cap_min\":1000000000}",
            },
          ],
          isError: true as const,
        };
      }

      try {
        const result = await client.post<ScreenResult[]>("/companies/screen", parsed);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  server.tool(
    "compare_companies",
    "Compare financial metrics across multiple companies side by side.",
    {
      company_ids: z
        .string()
        .describe("Comma-separated company IDs to compare (from search_companies results)"),
    },
    async ({ company_ids }) => {
      try {
        const ids = company_ids.split(",").map((id) => id.trim());
        const result = await client.post<ComparisonResponse>("/companies/compare", {
          company_ids: ids,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
