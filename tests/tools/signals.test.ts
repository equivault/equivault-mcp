import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { registerSignalTools } from "../../src/tools/signals.js";

describe("signal tools", () => {
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
    registerSignalTools(server, client);
  });

  it("registers all 5 signal tools", () => {
    for (const name of [
      "get_signals",
      "get_signal_summary",
      "get_signal_dashboard",
      "get_signal_trends",
      "get_trending_signals",
    ]) {
      expect(registered.has(name)).toBe(true);
    }
  });

  it("get_signals calls GET /signals/companies/{id} with pagination", async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ signals: [], total: 0, page: 1 });

    const tool = registered.get("get_signals")!;
    await tool.handler({ company_id: "apple-inc", page: 2, limit: 50 });

    expect(client.get).toHaveBeenCalledWith(
      "/signals/companies/apple-inc",
      { page: "2", limit: "50" }
    );
  });

  it("get_signals omits pagination when not provided", async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ signals: [], total: 0, page: 1 });

    const tool = registered.get("get_signals")!;
    await tool.handler({ company_id: "apple-inc" });

    expect(client.get).toHaveBeenCalledWith("/signals/companies/apple-inc", {});
  });

  it("get_signal_summary calls GET /signals/companies/{id}/summary", async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ company_id: "apple-inc", by_type: {}, by_severity: {}, unread_count: 0 });

    const tool = registered.get("get_signal_summary")!;
    const result = await tool.handler({ company_id: "apple-inc" }) as { content: { text: string }[] };

    expect(client.get).toHaveBeenCalledWith("/signals/companies/apple-inc/summary");
    expect(result.content[0].text).toContain("apple-inc");
  });

  it("get_signal_dashboard calls GET /signals/dashboard", async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ portfolio_signals: [], unread_total: 0, by_company: [] });

    const tool = registered.get("get_signal_dashboard")!;
    await tool.handler({});

    expect(client.get).toHaveBeenCalledWith("/signals/dashboard");
  });

  it("get_signal_trends passes window when provided", async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ trends: [], window: "30d" });

    const tool = registered.get("get_signal_trends")!;
    await tool.handler({ window: "30d" });

    expect(client.get).toHaveBeenCalledWith("/signals/dashboard/trends", { window: "30d" });
  });

  it("get_signal_trends omits window when absent", async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ trends: [], window: "30d" });

    const tool = registered.get("get_signal_trends")!;
    await tool.handler({});

    expect(client.get).toHaveBeenCalledWith("/signals/dashboard/trends", {});
  });

  it("get_trending_signals passes limit when provided", async () => {
    vi.mocked(client.get).mockResolvedValueOnce([]);

    const tool = registered.get("get_trending_signals")!;
    await tool.handler({ limit: 20 });

    expect(client.get).toHaveBeenCalledWith("/signals/trending", { limit: "20" });
  });
});
