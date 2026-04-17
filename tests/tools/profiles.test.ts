import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EquiVaultApiError, type EquiVaultClient } from "../../src/client.js";
import { registerProfileTools } from "../../src/tools/profiles.js";

const profileTools: { tool: string; path: string }[] = [
  { tool: "get_guidance", path: "/companies/apple-inc/profile/guidance" },
  { tool: "get_segments", path: "/companies/apple-inc/profile/segments" },
  { tool: "get_capital_allocation", path: "/companies/apple-inc/profile/capital-allocation" },
  { tool: "get_risk_factors", path: "/companies/apple-inc/profile/risk-factors" },
  { tool: "get_insider_transactions", path: "/companies/apple-inc/profile/insider-transactions" },
  { tool: "get_earnings_quality", path: "/companies/apple-inc/profile/earnings-quality" },
  { tool: "get_debt_maturities", path: "/companies/apple-inc/profile/debt-maturities" },
  { tool: "get_competitive_signals", path: "/companies/apple-inc/profile/competitive-signals" },
  { tool: "get_management_statements", path: "/companies/apple-inc/profile/management-statements" },
  { tool: "get_accounting_snapshots", path: "/companies/apple-inc/profile/accounting-snapshots" },
];

describe("profile tools", () => {
  let server: McpServer;
  let client: EquiVaultClient;
  let registered: Map<string, { handler: (args: Record<string, unknown>) => Promise<unknown> }>;

  beforeEach(() => {
    registered = new Map();
    server = {
      tool: vi.fn((...args: unknown[]) => {
        const name = args[0] as string;
        const handler = args[args.length - 1] as (a: Record<string, unknown>) => Promise<unknown>;
        registered.set(name, { handler });
      }),
    } as unknown as McpServer;

    client = { get: vi.fn(), post: vi.fn() } as unknown as EquiVaultClient;
    registerProfileTools(server, client);
  });

  it("registers all 10 profile tools", () => {
    for (const { tool } of profileTools) {
      expect(registered.has(tool)).toBe(true);
    }
  });

  for (const { tool, path } of profileTools) {
    it(`${tool} calls GET ${path}`, async () => {
      vi.mocked(client.get).mockResolvedValueOnce({ company_id: "apple-inc" });

      const t = registered.get(tool)!;
      const result = await t.handler({ company_id: "apple-inc" }) as { content: { text: string }[] };

      expect(client.get).toHaveBeenCalledWith(path);
      expect(result.content[0].text).toContain("apple-inc");
    });
  }

  it("surfaces tier-gate errors for insider_transactions (Advisor+)", async () => {
    vi.mocked(client.get).mockRejectedValueOnce(
      new EquiVaultApiError(402, {
        error: { code: "FEATURE_NOT_AVAILABLE", message: "", status: 402, current_tier: "professional", required_tier: "advisor", monthly_delta_cents: 35000 },
      })
    );

    const t = registered.get("get_insider_transactions")!;
    const result = await t.handler({ company_id: "apple-inc" }) as { content: { text: string }[]; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Advisor");
  });
});
