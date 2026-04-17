import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type {
  SignalListResponse,
  SignalSummary,
  SignalDashboard,
  SignalTrendsResponse,
  TrendingSignal,
} from "../types.js";

export function registerSignalTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  server.tool(
    "get_signals",
    "Get detected signals for a specific company (earnings surprises, guidance changes, insider activity, etc). Supports pagination.",
    {
      company_id: z.string().describe("Company ID from search_companies"),
      page: z.number().int().positive().optional().describe("Page number (default 1)"),
      limit: z.number().int().positive().max(200).optional().describe("Results per page (default 50, max 200)"),
    },
    async ({ company_id, page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (page !== undefined) params.page = String(page);
        if (limit !== undefined) params.limit = String(limit);

        const data = await client.get<SignalListResponse>(
          `/signals/companies/${company_id}`,
          params
        );
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  server.tool(
    "get_signal_summary",
    "Get a count-based summary of signals for a company — breakdowns by type and severity, plus unread count.",
    {
      company_id: z.string().describe("Company ID from search_companies"),
    },
    async ({ company_id }) => {
      try {
        const data = await client.get<SignalSummary>(
          `/signals/companies/${company_id}/summary`
        );
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  server.tool(
    "get_signal_dashboard",
    "Get portfolio-wide signal dashboard: recent signals across all followed companies, unread counts, and per-company breakdown.",
    async () => {
      try {
        const data = await client.get<SignalDashboard>("/signals/dashboard");
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  server.tool(
    "get_signal_trends",
    "Get time-bucketed signal activity trends across your followed portfolio. Optional window: '7d', '30d', '90d', '1y'.",
    {
      window: z.string().optional().describe("Time window: '7d', '30d', '90d', '1y'"),
    },
    async ({ window }) => {
      try {
        const params: Record<string, string> = {};
        if (window) params.window = window;

        const data = await client.get<SignalTrendsResponse>(
          "/signals/dashboard/trends",
          params
        );
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  server.tool(
    "get_trending_signals",
    "Get cross-company trending signals right now — what's moving in the market across all tracked companies.",
    {
      limit: z.number().int().positive().max(100).optional().describe("Max results (default 20)"),
    },
    async ({ limit }) => {
      try {
        const params: Record<string, string> = {};
        if (limit !== undefined) params.limit = String(limit);

        const data = await client.get<TrendingSignal[]>("/signals/trending", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
