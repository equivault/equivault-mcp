import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { FinancialsResponse, MetricsResponse } from "../types.js";

export function registerFinancialTools(server: McpServer, client: EquiVaultClient): void {
  server.tool(
    "get_financials",
    "Get financial statements (income statement, balance sheet, cash flow) for a company.",
    {
      company_id: z.string().describe("Company ID from search_companies results"),
      period_type: z
        .enum(["annual", "quarterly"])
        .optional()
        .describe("Filter by period type: 'annual' or 'quarterly'"),
    },
    async ({ company_id, period_type }) => {
      try {
        const params: Record<string, string> = {};
        if (period_type) {
          params.period_type = period_type;
        }
        const result = await client.get<FinancialsResponse>(
          `/companies/${company_id}/financials`,
          Object.keys(params).length > 0 ? params : undefined
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  server.tool(
    "get_metrics",
    "Get financial metrics and key performance indicators for a company over time.",
    {
      company_id: z.string().describe("Company ID from search_companies results"),
      period_from: z.string().optional().describe("Start date for metrics (ISO date string, e.g. '2022-01-01')"),
      period_to: z.string().optional().describe("End date for metrics (ISO date string, e.g. '2024-12-31')"),
    },
    async ({ company_id, period_from, period_to }) => {
      try {
        const params: Record<string, string> = {};
        if (period_from) params.period_from = period_from;
        if (period_to) params.period_to = period_to;
        const result = await client.get<MetricsResponse>(
          `/companies/${company_id}/metrics`,
          Object.keys(params).length > 0 ? params : undefined
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
