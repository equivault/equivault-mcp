import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { registerPortfolioTools } from "../../src/tools/portfolio.js";

describe("portfolio tools", () => {
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
    registerPortfolioTools(server, client);
  });

  it("registers get_portfolio_analytics", () => {
    expect(registered.has("get_portfolio_analytics")).toBe(true);
  });

  it("calls GET /portfolios/{id}/analytics", async () => {
    vi.mocked(client.get).mockResolvedValueOnce({
      portfolio_id: "p-1",
      total_return: 0.15,
      sharpe_ratio: 1.2,
      sector_allocation: {},
      winners: [],
      losers: [],
      updated_at: "",
    });

    const tool = registered.get("get_portfolio_analytics")!;
    const result = await tool.handler({ portfolio_id: "p-1" }) as { content: { text: string }[] };

    expect(client.get).toHaveBeenCalledWith("/portfolios/p-1/analytics");
    expect(result.content[0].text).toContain("p-1");
  });
});
