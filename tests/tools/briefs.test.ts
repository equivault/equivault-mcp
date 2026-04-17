import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { registerBriefTools } from "../../src/tools/briefs.js";

describe("brief tools", () => {
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
    registerBriefTools(server, client);
  });

  it("registers list_briefs and get_brief", () => {
    expect(registered.has("list_briefs")).toBe(true);
    expect(registered.has("get_brief")).toBe(true);
  });

  it("list_briefs without filters calls GET /briefs", async () => {
    vi.mocked(client.get).mockResolvedValueOnce([]);

    const tool = registered.get("list_briefs")!;
    await tool.handler({});

    expect(client.get).toHaveBeenCalledWith("/briefs", {});
  });

  it("list_briefs with company_id filter", async () => {
    vi.mocked(client.get).mockResolvedValueOnce([]);

    const tool = registered.get("list_briefs")!;
    await tool.handler({ company_id: "apple-inc" });

    expect(client.get).toHaveBeenCalledWith("/briefs", { company_id: "apple-inc" });
  });

  it("list_briefs with followed=true filter", async () => {
    vi.mocked(client.get).mockResolvedValueOnce([]);

    const tool = registered.get("list_briefs")!;
    await tool.handler({ followed: true });

    expect(client.get).toHaveBeenCalledWith("/briefs", { followed: "true" });
  });

  it("list_briefs with both filters", async () => {
    vi.mocked(client.get).mockResolvedValueOnce([]);

    const tool = registered.get("list_briefs")!;
    await tool.handler({ company_id: "apple-inc", followed: true });

    expect(client.get).toHaveBeenCalledWith("/briefs", {
      company_id: "apple-inc",
      followed: "true",
    });
  });

  it("get_brief calls GET /briefs/{id}", async () => {
    const brief = { id: "b-1", company_id: "apple-inc", title: "Q4", period: "", generated_at: "", content: "", sections: [] };
    vi.mocked(client.get).mockResolvedValueOnce(brief);

    const tool = registered.get("get_brief")!;
    const result = await tool.handler({ brief_id: "b-1" }) as { content: { text: string }[] };

    expect(client.get).toHaveBeenCalledWith("/briefs/b-1");
    expect(result.content[0].text).toContain("b-1");
  });
});
