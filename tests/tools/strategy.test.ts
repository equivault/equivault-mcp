import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { registerStrategyTools } from "../../src/tools/strategy.js";

describe("strategy tools", () => {
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
    registerStrategyTools(server, client);
  });

  it("registers get_strategy_profiles", () => {
    expect(registered.has("get_strategy_profiles")).toBe(true);
  });

  it("calls GET /strategy-profiles", async () => {
    const mock = [{ id: "1", name: "Value", type: "system", description: "", criteria: {}, created_at: "2026-01-01" }];
    vi.mocked(client.get).mockResolvedValueOnce(mock);

    const tool = registered.get("get_strategy_profiles")!;
    const result = await tool.handler({}) as { content: { text: string }[] };

    expect(client.get).toHaveBeenCalledWith("/strategy-profiles");
    expect(result.content[0].text).toContain("Value");
  });
});
