import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { registerGuruTools } from "../../src/tools/gurus.js";

describe("guru tools", () => {
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
    registerGuruTools(server, client);
  });

  it("registers get_guru_holdings", () => {
    expect(registered.has("get_guru_holdings")).toBe(true);
  });

  it("calls GET /gurus/{id}/holdings without filter", async () => {
    vi.mocked(client.get).mockResolvedValueOnce([]);

    const tool = registered.get("get_guru_holdings")!;
    await tool.handler({ guru_id: "buffett" });

    expect(client.get).toHaveBeenCalledWith("/gurus/buffett/holdings", {});
  });

  it("passes change_type filter", async () => {
    vi.mocked(client.get).mockResolvedValueOnce([]);

    const tool = registered.get("get_guru_holdings")!;
    await tool.handler({ guru_id: "buffett", change_type: "new" });

    expect(client.get).toHaveBeenCalledWith("/gurus/buffett/holdings", {
      change_type: "new",
    });
  });
});
