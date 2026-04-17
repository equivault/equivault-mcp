import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EquiVaultApiError, type EquiVaultClient } from "../client.js";
import { handleError, translateError } from "../errors.js";

/**
 * Resolve a promise to a value or a "gated" placeholder if the API
 * responds with 402. All other errors propagate.
 */
async function resolveOrGate<T>(
  p: Promise<T>
): Promise<{ available: true; data: T } | { available: false; reason: string }> {
  try {
    const data = await p;
    return { available: true, data };
  } catch (err) {
    if (err instanceof EquiVaultApiError && err.status === 402) {
      return { available: false, reason: translateError(err.status, err.body) };
    }
    throw err;
  }
}

export function registerCompositeTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  // ------------------------------------------------------------------
  // analyze_company
  // ------------------------------------------------------------------
  server.tool(
    "analyze_company",
    "Get a comprehensive company snapshot — profile, financial statements, metrics, and investment narrative — in a single call. Sections the user's tier can't access are marked as unavailable rather than failing the whole call.",
    {
      company_id: z.string().describe("Company ID from search_companies"),
    },
    async ({ company_id }) => {
      try {
        const [company, financials, metrics, narrative] = await Promise.all([
          resolveOrGate(client.get(`/companies/${company_id}`)),
          resolveOrGate(client.get(`/companies/${company_id}/financials`)),
          resolveOrGate(client.get(`/companies/${company_id}/metrics`)),
          resolveOrGate(client.get(`/companies/${company_id}/narrative`)),
        ]);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { company, financials, metrics, narrative },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  // ------------------------------------------------------------------
  // company_deep_dive
  // ------------------------------------------------------------------
  server.tool(
    "company_deep_dive",
    "Get a full fundamental deep-dive for a company — everything from analyze_company PLUS all profile sections (guidance, segments, capital allocation, risk factors, insider transactions, earnings quality, debt maturities, competitive signals, management statements, accounting snapshots). Sections your tier can't access are marked unavailable.",
    {
      company_id: z.string().describe("Company ID from search_companies"),
    },
    async ({ company_id }) => {
      try {
        const profileSections = [
          "guidance",
          "segments",
          "capital-allocation",
          "risk-factors",
          "insider-transactions",
          "earnings-quality",
          "debt-maturities",
          "competitive-signals",
          "management-statements",
          "accounting-snapshots",
        ] as const;

        const [
          company,
          financials,
          metrics,
          narrative,
          ...profileResults
        ] = await Promise.all([
          resolveOrGate(client.get(`/companies/${company_id}`)),
          resolveOrGate(client.get(`/companies/${company_id}/financials`)),
          resolveOrGate(client.get(`/companies/${company_id}/metrics`)),
          resolveOrGate(client.get(`/companies/${company_id}/narrative`)),
          ...profileSections.map((s) =>
            resolveOrGate(client.get(`/companies/${company_id}/profile/${s}`))
          ),
        ]);

        // Build profile object keyed by snake_case section names
        const profile: Record<string, unknown> = {};
        profileSections.forEach((section, i) => {
          const key = section.replace(/-/g, "_");
          profile[key] = profileResults[i];
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { company, financials, metrics, narrative, profile },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
