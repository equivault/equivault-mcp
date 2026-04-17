import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { registerMediaTools } from "../../src/tools/media.js";

describe("media tools", () => {
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
    registerMediaTools(server, client);
  });

  it("registers list_media", () => {
    expect(registered.has("list_media")).toBe(true);
  });

  it("calls GET /media/items with no filters", async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ items: [], total: 0, page: 1 });

    const tool = registered.get("list_media")!;
    await tool.handler({});

    expect(client.get).toHaveBeenCalledWith("/media/items", {});
  });

  it("passes company_id, type, status filters", async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ items: [], total: 0, page: 1 });

    const tool = registered.get("list_media")!;
    await tool.handler({
      company_id: "apple-inc",
      type: "earnings_call",
      status: "ready",
    });

    expect(client.get).toHaveBeenCalledWith("/media/items", {
      company_id: "apple-inc",
      type: "earnings_call",
      status: "ready",
    });
  });
});
