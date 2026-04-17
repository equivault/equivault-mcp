import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EquiVaultApiError, type EquiVaultClient } from "../../src/client.js";
import { registerNarrativeTools } from "../../src/tools/narrative.js";

describe("narrative tools", () => {
  let server: McpServer;
  let client: EquiVaultClient;
  let registeredTools: Map<string, { handler: (args: Record<string, unknown>) => Promise<unknown> }>;

  beforeEach(() => {
    registeredTools = new Map();
    server = {
      tool: vi.fn((...args: unknown[]) => {
        const name = args[0] as string;
        const handler = args[args.length - 1] as (a: Record<string, unknown>) => Promise<unknown>;
        registeredTools.set(name, { handler });
      }),
    } as unknown as McpServer;

    client = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as EquiVaultClient;

    registerNarrativeTools(server, client);
  });

  it("registers get_company_narrative", () => {
    expect(registeredTools.has("get_company_narrative")).toBe(true);
  });

  it("calls GET /companies/{id}/narrative", async () => {
    const mock = { company_id: "apple-inc", thesis: "x", drivers: [], headwinds: [], tailwinds: [], updated_at: "2026-01-01" };
    vi.mocked(client.get).mockResolvedValueOnce(mock);

    const tool = registeredTools.get("get_company_narrative")!;
    const result = await tool.handler({ company_id: "apple-inc" }) as { content: { text: string }[] };

    expect(client.get).toHaveBeenCalledWith("/companies/apple-inc/narrative", {});
    expect(result.content[0].text).toContain("apple-inc");
  });

  it("passes history=true when requested", async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ company_id: "x", thesis: "", drivers: [], headwinds: [], tailwinds: [], updated_at: "" });

    const tool = registeredTools.get("get_company_narrative")!;
    await tool.handler({ company_id: "x", history: true });

    expect(client.get).toHaveBeenCalledWith("/companies/x/narrative", { history: "true" });
  });

  it("returns tier-aware error on 402", async () => {
    vi.mocked(client.get).mockRejectedValueOnce(
      new EquiVaultApiError(402, {
        error: { code: "FEATURE_NOT_AVAILABLE", message: "", status: 402, current_tier: "explorer", required_tier: "starter", monthly_delta_cents: 3900 },
      })
    );

    const tool = registeredTools.get("get_company_narrative")!;
    const result = await tool.handler({ company_id: "x" }) as { content: { text: string }[]; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Starter");
  });
});
