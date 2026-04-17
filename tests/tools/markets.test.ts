import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { registerMarketsTools } from "../../src/tools/markets.js";

describe("markets tools", () => {
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
    registerMarketsTools(server, client);
  });

  it("registers get_markets", () => {
    expect(registered.has("get_markets")).toBe(true);
  });

  it("calls GET /markets", async () => {
    vi.mocked(client.get).mockResolvedValueOnce([]);

    const tool = registered.get("get_markets")!;
    await tool.handler({});

    expect(client.get).toHaveBeenCalledWith("/markets");
  });
});
