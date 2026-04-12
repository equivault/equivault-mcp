import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { EquiVaultApiError } from "../../src/client.js";
import { registerMarketTools } from "../../src/tools/market.js";

describe("market tools", () => {
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

    registerMarketTools(server, client);
  });

  describe("get_stock_quote", () => {
    it("is registered", () => {
      expect(registeredTools.has("get_stock_quote")).toBe(true);
    });

    it("calls GET /stocks/quotes with tickers param", async () => {
      const mockQuotes = [
        { ticker: "AAPL", price: 180.5, change: 1.2, change_percent: 0.67, volume: 54321000, timestamp: "2024-01-15T16:00:00Z" },
        { ticker: "MSFT", price: 375.0, change: -0.5, change_percent: -0.13, volume: 23456000, timestamp: "2024-01-15T16:00:00Z" },
      ];
      vi.mocked(client.get).mockResolvedValueOnce(mockQuotes);

      const result = await registeredTools.get("get_stock_quote")!.handler({ tickers: "AAPL,MSFT" });

      expect(client.get).toHaveBeenCalledWith("/stocks/quotes", { tickers: "AAPL,MSFT" });
      expect(result.content[0].text).toBe(JSON.stringify(mockQuotes, null, 2));
      expect(result.isError).toBeUndefined();
    });

    it("works with a single ticker", async () => {
      const mockQuotes = [
        { ticker: "GOOGL", price: 140.0, change: 0.5, change_percent: 0.36, volume: 12345000, timestamp: "2024-01-15T16:00:00Z" },
      ];
      vi.mocked(client.get).mockResolvedValueOnce(mockQuotes);

      const result = await registeredTools.get("get_stock_quote")!.handler({ tickers: "GOOGL" });

      expect(client.get).toHaveBeenCalledWith("/stocks/quotes", { tickers: "GOOGL" });
      expect(result.content[0].text).toBe(JSON.stringify(mockQuotes, null, 2));
    });

    it("returns error on EquiVaultApiError", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(
        new EquiVaultApiError(401, { error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } })
      );

      const result = await registeredTools.get("get_stock_quote")!.handler({ tickers: "AAPL" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Invalid API key");
    });

    it("returns error on unexpected error", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error("DNS failure"));

      const result = await registeredTools.get("get_stock_quote")!.handler({ tickers: "AAPL" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unexpected error");
    });
  });
});
