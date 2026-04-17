import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EquiVaultApiError, type EquiVaultClient } from "../../src/client.js";
import { registerCompositeTools } from "../../src/tools/composite.js";

describe("composite tools", () => {
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
    client = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } as unknown as EquiVaultClient;
    registerCompositeTools(server, client);
  });

  describe("analyze_company", () => {
    it("is registered", () => {
      expect(registered.has("analyze_company")).toBe(true);
    });

    it("calls 4 endpoints in parallel and merges results", async () => {
      vi.mocked(client.get).mockImplementation(async (path: string) => {
        if (path === "/companies/apple-inc") return { id: "apple-inc", name: "Apple" };
        if (path === "/companies/apple-inc/financials") return { company_id: "apple-inc", income_statement: [], balance_sheet: [], cash_flow: [] };
        if (path === "/companies/apple-inc/metrics") return { company_id: "apple-inc", metrics: [] };
        if (path === "/companies/apple-inc/narrative") return { company_id: "apple-inc", thesis: "Strong moat", drivers: [], headwinds: [], tailwinds: [], updated_at: "" };
        throw new Error(`Unexpected path: ${path}`);
      });

      const tool = registered.get("analyze_company")!;
      const result = await tool.handler({ company_id: "apple-inc" }) as { content: { text: string }[] };

      expect(client.get).toHaveBeenCalledTimes(4);
      const text = result.content[0].text;
      expect(text).toContain("\"company\"");
      expect(text).toContain("\"financials\"");
      expect(text).toContain("\"metrics\"");
      expect(text).toContain("\"narrative\"");
      expect(text).toContain("Strong moat");
    });

    it("degrades gracefully when narrative is tier-gated", async () => {
      vi.mocked(client.get).mockImplementation(async (path: string) => {
        if (path === "/companies/apple-inc/narrative") {
          throw new EquiVaultApiError(402, {
            error: { code: "FEATURE_NOT_AVAILABLE", message: "", status: 402, current_tier: "explorer", required_tier: "starter", monthly_delta_cents: 3900 },
          });
        }
        if (path === "/companies/apple-inc") return { id: "apple-inc", name: "Apple" };
        if (path === "/companies/apple-inc/financials") return { company_id: "apple-inc", income_statement: [], balance_sheet: [], cash_flow: [] };
        if (path === "/companies/apple-inc/metrics") return { company_id: "apple-inc", metrics: [] };
        throw new Error(`Unexpected path: ${path}`);
      });

      const tool = registered.get("analyze_company")!;
      const result = await tool.handler({ company_id: "apple-inc" }) as { content: { text: string }[]; isError?: boolean };

      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain("\"company\"");
      expect(text).toContain("\"financials\"");
      expect(text).toMatch(/"narrative":\s*\{[^}]*"available":\s*false/);
      expect(text).toContain("Starter");
    });
  });

  describe("company_deep_dive", () => {
    it("is registered", () => {
      expect(registered.has("company_deep_dive")).toBe(true);
    });

    it("fetches analyze_company data + all 10 profile sections", async () => {
      vi.mocked(client.get).mockResolvedValue({ company_id: "apple-inc" });

      const tool = registered.get("company_deep_dive")!;
      const result = await tool.handler({ company_id: "apple-inc" }) as { content: { text: string }[] };

      // 4 (analyze_company) + 10 (profile sections) = 14
      expect(client.get).toHaveBeenCalledTimes(14);
      const text = result.content[0].text;
      expect(text).toContain("\"profile\"");
      expect(text).toContain("guidance");
      expect(text).toContain("insider_transactions");
    });
  });

  describe("morning_briefing", () => {
    it("is registered", () => {
      expect(registered.has("morning_briefing")).toBe(true);
    });

    it("fetches dashboard, trending, and followed briefs (no portfolio_id)", async () => {
      vi.mocked(client.get).mockImplementation(async (path: string) => {
        if (path === "/signals/dashboard") return { portfolio_signals: [], unread_total: 3, by_company: [] };
        if (path === "/signals/trending") return [{ company_id: "x", ticker: "X" }];
        if (path === "/briefs") return [{ id: "b-1", title: "Weekly" }];
        throw new Error(`Unexpected path: ${path}`);
      });

      const tool = registered.get("morning_briefing")!;
      const result = await tool.handler({}) as { content: { text: string }[] };

      expect(client.get).toHaveBeenCalledTimes(3);
      const text = result.content[0].text;
      expect(text).toContain("signal_dashboard");
      expect(text).toContain("trending_signals");
      expect(text).toContain("recent_briefs");
    });

    it("includes portfolio analytics when portfolio_id is provided", async () => {
      vi.mocked(client.get).mockImplementation(async (path: string) => {
        if (path === "/signals/dashboard") return { portfolio_signals: [], unread_total: 0, by_company: [] };
        if (path === "/signals/trending") return [];
        if (path === "/briefs") return [];
        if (path === "/portfolios/p-1/analytics") return { portfolio_id: "p-1", total_return: 0.1 };
        throw new Error(`Unexpected path: ${path}`);
      });

      const tool = registered.get("morning_briefing")!;
      const result = await tool.handler({ portfolio_id: "p-1" }) as { content: { text: string }[] };

      expect(client.get).toHaveBeenCalledTimes(4);
      expect(result.content[0].text).toContain("portfolio_analytics");
      expect(result.content[0].text).toContain("p-1");
    });

    it("degrades gracefully on 402 for portfolio analytics", async () => {
      vi.mocked(client.get).mockImplementation(async (path: string) => {
        if (path === "/portfolios/p-1/analytics") {
          throw new EquiVaultApiError(402, {
            error: {
              code: "FEATURE_NOT_AVAILABLE", message: "", status: 402,
              current_tier: "explorer", required_tier: "analyst", monthly_delta_cents: 9900,
            },
          });
        }
        if (path === "/signals/dashboard") return { portfolio_signals: [], unread_total: 0, by_company: [] };
        if (path === "/signals/trending") return [];
        if (path === "/briefs") return [];
        throw new Error(`Unexpected path: ${path}`);
      });

      const tool = registered.get("morning_briefing")!;
      const result = await tool.handler({ portfolio_id: "p-1" }) as { content: { text: string }[]; isError?: boolean };

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toMatch(/"portfolio_analytics":\s*\{[^}]*"available":\s*false/);
    });
  });

  describe("research_report", () => {
    it("is registered", () => {
      expect(registered.has("research_report")).toBe(true);
    });

    it("fetches deep-dive endpoints + recent signals + briefs", async () => {
      vi.mocked(client.get).mockImplementation(async (path: string) => {
        if (path === "/signals/companies/apple-inc") return { signals: [{ id: "s-1" }], total: 1, page: 1 };
        if (path === "/briefs") return [{ id: "b-1" }];
        return { company_id: "apple-inc" };
      });

      const tool = registered.get("research_report")!;
      const result = await tool.handler({ company_id: "apple-inc" }) as { content: { text: string }[] };

      // 4 (analyze_company) + 10 (profile sections) + 1 (signals) + 1 (briefs) = 16
      expect(client.get).toHaveBeenCalledTimes(16);
      const text = result.content[0].text;
      expect(text).toContain("company");
      expect(text).toContain("profile");
      expect(text).toContain("recent_signals");
      expect(text).toContain("briefs");
    });
  });
});
