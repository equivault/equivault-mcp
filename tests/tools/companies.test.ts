import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { EquiVaultApiError } from "../../src/client.js";
import { registerCompanyTools } from "../../src/tools/companies.js";

describe("company tools", () => {
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

    registerCompanyTools(server, client);
  });

  describe("search_companies", () => {
    it("is registered", () => {
      expect(registeredTools.has("search_companies")).toBe(true);
    });

    it("calls GET /companies with search query param", async () => {
      const mockResults = [{ id: "c1", name: "Apple Inc.", ticker: "AAPL", sector: "Technology" }];
      vi.mocked(client.get).mockResolvedValueOnce(mockResults);

      const result = await registeredTools.get("search_companies")!.handler({ query: "Apple" });

      expect(client.get).toHaveBeenCalledWith("/companies", { search: "Apple" });
      expect(result.content[0].text).toBe(JSON.stringify(mockResults, null, 2));
      expect(result.isError).toBeUndefined();
    });

    it("returns error on EquiVaultApiError", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(
        new EquiVaultApiError(401, { error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } })
      );

      const result = await registeredTools.get("search_companies")!.handler({ query: "Apple" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Invalid API key");
    });

    it("returns error on unexpected error", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error("Network failure"));

      const result = await registeredTools.get("search_companies")!.handler({ query: "Apple" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unexpected error");
    });
  });

  describe("get_company", () => {
    it("is registered", () => {
      expect(registeredTools.has("get_company")).toBe(true);
    });

    it("calls GET /companies/{company_id}", async () => {
      const mockDetail = {
        id: "c1",
        name: "Apple Inc.",
        ticker: "AAPL",
        sector: "Technology",
        website: "https://apple.com",
      };
      vi.mocked(client.get).mockResolvedValueOnce(mockDetail);

      const result = await registeredTools.get("get_company")!.handler({ company_id: "c1" });

      expect(client.get).toHaveBeenCalledWith("/companies/c1");
      expect(result.content[0].text).toBe(JSON.stringify(mockDetail, null, 2));
      expect(result.isError).toBeUndefined();
    });

    it("returns 404 error message", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(
        new EquiVaultApiError(404, { error: { code: "NOT_FOUND", message: "Not found", status: 404 } })
      );

      const result = await registeredTools.get("get_company")!.handler({ company_id: "invalid" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Company not found");
    });
  });
});
