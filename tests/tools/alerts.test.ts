import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EquiVaultApiError, type EquiVaultClient } from "../../src/client.js";
import { registerAlertTools } from "../../src/tools/alerts.js";

describe("alert tools", () => {
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
    registerAlertTools(server, client);
  });

  it("registers all 3 alert tools", () => {
    for (const name of ["create_alert", "update_alert", "delete_alert"]) {
      expect(registered.has(name)).toBe(true);
    }
  });

  it("create_alert POSTs /signals/alerts with full payload", async () => {
    vi.mocked(client.post).mockResolvedValueOnce({ id: "alert-1", enabled: true });

    const tool = registered.get("create_alert")!;
    await tool.handler({
      name: "AAPL PE > 30",
      company_id: "apple-inc",
      metric: "pe_ratio",
      condition: "above",
      threshold: 30,
    });

    expect(client.post).toHaveBeenCalledWith("/signals/alerts", {
      name: "AAPL PE > 30",
      company_id: "apple-inc",
      metric: "pe_ratio",
      condition: "above",
      threshold: 30,
    });
  });

  it("create_alert omits optional company_id when not provided", async () => {
    vi.mocked(client.post).mockResolvedValueOnce({ id: "alert-2" });

    const tool = registered.get("create_alert")!;
    await tool.handler({
      name: "Any tech PE > 50",
      metric: "pe_ratio",
      condition: "above",
      threshold: 50,
    });

    expect(client.post).toHaveBeenCalledWith("/signals/alerts", {
      name: "Any tech PE > 50",
      metric: "pe_ratio",
      condition: "above",
      threshold: 50,
    });
  });

  it("update_alert PUTs /signals/alerts/{id} with only the provided fields", async () => {
    vi.mocked(client.put).mockResolvedValueOnce({ id: "alert-1", threshold: 40 });

    const tool = registered.get("update_alert")!;
    await tool.handler({
      alert_id: "alert-1",
      threshold: 40,
    });

    expect(client.put).toHaveBeenCalledWith("/signals/alerts/alert-1", {
      threshold: 40,
    });
  });

  it("update_alert includes all provided optional fields", async () => {
    vi.mocked(client.put).mockResolvedValueOnce({ id: "alert-1" });

    const tool = registered.get("update_alert")!;
    await tool.handler({
      alert_id: "alert-1",
      name: "renamed",
      threshold: 45,
      condition: "below",
      enabled: false,
    });

    expect(client.put).toHaveBeenCalledWith("/signals/alerts/alert-1", {
      name: "renamed",
      threshold: 45,
      condition: "below",
      enabled: false,
    });
  });

  it("delete_alert DELETEs /signals/alerts/{id}", async () => {
    vi.mocked(client.delete).mockResolvedValueOnce({});

    const tool = registered.get("delete_alert")!;
    const result = await tool.handler({ alert_id: "alert-1" }) as { content: { text: string }[] };

    expect(client.delete).toHaveBeenCalledWith("/signals/alerts/alert-1");
    expect(result.content[0].text).toContain("deleted");
  });

  it("create_alert returns tier-gate error for non-Advisor", async () => {
    vi.mocked(client.post).mockRejectedValueOnce(
      new EquiVaultApiError(402, {
        error: {
          code: "FEATURE_NOT_AVAILABLE",
          message: "",
          status: 402,
          current_tier: "professional",
          required_tier: "advisor",
          monthly_delta_cents: 35000,
        },
      })
    );

    const tool = registered.get("create_alert")!;
    const result = await tool.handler({
      name: "x",
      metric: "pe_ratio",
      condition: "above",
      threshold: 1,
    }) as { content: { text: string }[]; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Advisor");
  });
});
