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
    client = { get: vi.fn(), post: vi.fn() } as unknown as EquiVaultClient;
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
});
