import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { EquiVaultApiError } from "../../src/client.js";
import { registerScreeningTools } from "../../src/tools/screening.js";

describe("screening tools", () => {
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

    registerScreeningTools(server, client);
  });

  describe("screen_companies", () => {
    it("is registered", () => {
      expect(registeredTools.has("screen_companies")).toBe(true);
    });

    it("parses JSON filters and calls POST /companies/screen", async () => {
      const mockResults = [
        { company: { id: "c1", name: "Apple", ticker: "AAPL", sector: "Technology" }, metrics: { pe_ratio: 28.5 } },
      ];
      vi.mocked(client.post).mockResolvedValueOnce(mockResults);

      const filters = JSON.stringify({ sector: "Technology", market_cap_min: 1000000000 });
      const result = await registeredTools.get("screen_companies")!.handler({ filters });

      expect(client.post).toHaveBeenCalledWith("/companies/screen", {
        sector: "Technology",
        market_cap_min: 1000000000,
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockResults, null, 2));
      expect(result.isError).toBeUndefined();
    });

    it("returns error for invalid JSON filters", async () => {
      const result = await registeredTools.get("screen_companies")!.handler({ filters: "not valid json" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Invalid filters");
      expect(client.post).not.toHaveBeenCalled();
    });

    it("returns error on EquiVaultApiError", async () => {
      vi.mocked(client.post).mockRejectedValueOnce(
        new EquiVaultApiError(402, {
          error: {
            code: "TIER_REQUIRED",
            message: "Upgrade required",
            status: 402,
            required_tier: "professional",
            current_tier: "analyst",
            monthly_delta_cents: 15000,
          },
        })
      );

      const result = await registeredTools.get("screen_companies")!.handler({ filters: "{}" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Professional");
    });

    it("returns error on unexpected error", async () => {
      vi.mocked(client.post).mockRejectedValueOnce(new Error("server error"));

      const result = await registeredTools.get("screen_companies")!.handler({ filters: "{}" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unexpected error");
    });
  });

  describe("compare_companies", () => {
    it("is registered", () => {
      expect(registeredTools.has("compare_companies")).toBe(true);
    });

    it("splits comma-separated IDs and calls POST /companies/compare", async () => {
      const mockResult = {
        columns: [],
        metric_names: ["revenue", "net_income"],
      };
      vi.mocked(client.post).mockResolvedValueOnce(mockResult);

      const result = await registeredTools
        .get("compare_companies")!
        .handler({ company_ids: "c1,c2,c3" });

      expect(client.post).toHaveBeenCalledWith("/companies/compare", {
        company_ids: ["c1", "c2", "c3"],
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockResult, null, 2));
      expect(result.isError).toBeUndefined();
    });

    it("trims whitespace from company IDs", async () => {
      vi.mocked(client.post).mockResolvedValueOnce({ columns: [], metric_names: [] });

      await registeredTools.get("compare_companies")!.handler({ company_ids: " c1 , c2 , c3 " });

      expect(client.post).toHaveBeenCalledWith("/companies/compare", {
        company_ids: ["c1", "c2", "c3"],
      });
    });

    it("returns error on EquiVaultApiError", async () => {
      vi.mocked(client.post).mockRejectedValueOnce(
        new EquiVaultApiError(429, { error: { code: "RATE_LIMITED", message: "Too many requests", status: 429 } })
      );

      const result = await registeredTools.get("compare_companies")!.handler({ company_ids: "c1,c2" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Rate limited");
    });
  });
});
