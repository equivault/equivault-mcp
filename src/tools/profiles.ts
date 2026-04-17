import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type {
  GuidanceResponse,
  SegmentsResponse,
  CapitalAllocationResponse,
  RiskFactorsResponse,
  InsiderTransactionsResponse,
  EarningsQualityResponse,
  DebtMaturitiesResponse,
  CompetitiveSignalsResponse,
  ManagementStatementsResponse,
  AccountingSnapshotsResponse,
} from "../types.js";

interface ProfileDef<T> {
  name: string;
  description: string;
  path: string;
  _phantom?: T; // preserves return type for readability
}

const companyIdInput = {
  company_id: z.string().describe("Company ID from search_companies"),
};

export function registerProfileTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  const defs: ProfileDef<unknown>[] = [
    { name: "get_guidance", description: "Get the management guidance tracker for a company — prior guidance commitments and actual outcomes (beat/miss/in-line).", path: "guidance" } as ProfileDef<GuidanceResponse>,
    { name: "get_segments", description: "Get revenue and operating-income breakdown by business segment for a company.", path: "segments" } as ProfileDef<SegmentsResponse>,
    { name: "get_capital_allocation", description: "Get historical capital allocation: buybacks, dividends, debt repayment, M&A, and capex.", path: "capital-allocation" } as ProfileDef<CapitalAllocationResponse>,
    { name: "get_risk_factors", description: "Get the evolution of risk factors disclosed in a company's filings (new, ongoing, resolved, elevated).", path: "risk-factors" } as ProfileDef<RiskFactorsResponse>,
    { name: "get_insider_transactions", description: "Get insider transactions (buys, sells, grants, exercises) with 10b5-1 flag. Requires Advisor tier.", path: "insider-transactions" } as ProfileDef<InsiderTransactionsResponse>,
    { name: "get_earnings_quality", description: "Get the earnings quality assessment: accruals ratio, cash conversion, non-GAAP adjustments, and flags.", path: "earnings-quality" } as ProfileDef<EarningsQualityResponse>,
    { name: "get_debt_maturities", description: "Get the debt maturity schedule: principal due per year, interest rates, and instrument types.", path: "debt-maturities" } as ProfileDef<DebtMaturitiesResponse>,
    { name: "get_competitive_signals", description: "Get detected competitive signals affecting a company (market share shifts, new entrants, pricing pressure).", path: "competitive-signals" } as ProfileDef<CompetitiveSignalsResponse>,
    { name: "get_management_statements", description: "Get notable management statements with sentiment analysis and source attribution. Requires Advisor tier.", path: "management-statements" } as ProfileDef<ManagementStatementsResponse>,
    { name: "get_accounting_snapshots", description: "Get snapshots of accounting policies and changes from prior periods.", path: "accounting-snapshots" } as ProfileDef<AccountingSnapshotsResponse>,
  ];

  for (const def of defs) {
    server.tool(
      def.name,
      def.description,
      companyIdInput,
      async ({ company_id }) => {
        try {
          const data = await client.get<unknown>(
            `/companies/${company_id}/profile/${def.path}`
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
}
