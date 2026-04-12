import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { EquiVaultApiError } from "../../src/client.js";
import { registerFinancialTools } from "../../src/tools/financials.js";

describe("financial tools", () => {
  let registeredTools: Map<string, { handler: Function }>;
  let server: McpServer;
  let client: EquiVaultClient;

  beforeEach(() => {
    registeredTools = new Map();
    server = {
      tool: vi.fn((name: string, ...rest: unknown[]) => {
        const handler = rest[rest.length - 1] as Function;
        registeredTools.set(name, { handler });
      }),
    } as unknown as McpServer;

    client = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as EquiVaultClient;

    registerFinancialTools(server, client);
  });

  describe("get_financials", () => {
    it("is registered", () => {
      expect(registeredTools.has("get_financials")).toBe(true);
    });

    it("calls GET /companies/{id}/financials without optional params", async () => {
      const mockData = { company_id: "c1", income_statement: [], balance_sheet: [], cash_flow: [] };
      vi.mocked(client.get).mockResolvedValueOnce(mockData);

      const result = await registeredTools.get("get_financials")!.handler({ company_id: "c1" });

      expect(client.get).toHaveBeenCalledWith("/companies/c1/financials", undefined);
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(result.isError).toBeUndefined();
    });

    it("passes period_type as query param when provided", async () => {
      const mockData = { company_id: "c1", income_statement: [], balance_sheet: [], cash_flow: [] };
      vi.mocked(client.get).mockResolvedValueOnce(mockData);

      await registeredTools.get("get_financials")!.handler({ company_id: "c1", period_type: "annual" });

      expect(client.get).toHaveBeenCalledWith("/companies/c1/financials", { period_type: "annual" });
    });

    it("returns error on EquiVaultApiError", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(
        new EquiVaultApiError(402, {
          error: {
            code: "TIER_REQUIRED",
            message: "Upgrade required",
            status: 402,
            required_tier: "analyst",
            current_tier: "starter",
            monthly_delta_cents: 6000,
          },
        })
      );

      const result = await registeredTools.get("get_financials")!.handler({ company_id: "c1" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Analyst");
      expect(result.content[0].text).toContain("Starter");
    });

    it("returns error on unexpected error", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error("timeout"));

      const result = await registeredTools.get("get_financials")!.handler({ company_id: "c1" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unexpected error");
    });
  });

  describe("get_metrics", () => {
    it("is registered", () => {
      expect(registeredTools.has("get_metrics")).toBe(true);
    });

    it("calls GET /companies/{id}/metrics without optional params", async () => {
      const mockData = { company_id: "c1", metrics: [] };
      vi.mocked(client.get).mockResolvedValueOnce(mockData);

      const result = await registeredTools.get("get_metrics")!.handler({ company_id: "c1" });

      expect(client.get).toHaveBeenCalledWith("/companies/c1/metrics", undefined);
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(result.isError).toBeUndefined();
    });

    it("passes period_from and period_to as query params when provided", async () => {
      const mockData = { company_id: "c1", metrics: [] };
      vi.mocked(client.get).mockResolvedValueOnce(mockData);

      await registeredTools.get("get_metrics")!.handler({
        company_id: "c1",
        period_from: "2022-01-01",
        period_to: "2024-12-31",
      });

      expect(client.get).toHaveBeenCalledWith("/companies/c1/metrics", {
        period_from: "2022-01-01",
        period_to: "2024-12-31",
      });
    });

    it("only passes provided optional params", async () => {
      const mockData = { company_id: "c1", metrics: [] };
      vi.mocked(client.get).mockResolvedValueOnce(mockData);

      await registeredTools.get("get_metrics")!.handler({ company_id: "c1", period_from: "2022-01-01" });

      expect(client.get).toHaveBeenCalledWith("/companies/c1/metrics", { period_from: "2022-01-01" });
    });

    it("returns error on EquiVaultApiError", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(
        new EquiVaultApiError(429, { error: { code: "RATE_LIMITED", message: "Too many requests", status: 429 } })
      );

      const result = await registeredTools.get("get_metrics")!.handler({ company_id: "c1" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Rate limited");
    });
  });
});
