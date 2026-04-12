import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../../src/client.js";
import { EquiVaultApiError } from "../../src/client.js";
import { registerBillingTools } from "../../src/tools/billing.js";

describe("billing tools", () => {
  let registeredTools: Map<string, { handler: Function }>;
  let server: McpServer;
  let client: EquiVaultClient;

  beforeEach(() => {
    registeredTools = new Map();
    server = {
      tool: vi.fn((name: string, _config: unknown, handler: Function) => {
        registeredTools.set(name, { handler });
      }),
    } as unknown as McpServer;

    client = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as EquiVaultClient;

    registerBillingTools(server, client);
  });

  describe("get_billing_status", () => {
    it("is registered", () => {
      expect(registeredTools.has("get_billing_status")).toBe(true);
    });

    it("calls GET /billing/status with no params", async () => {
      const mockStatus = {
        tier: "analyst",
        status: "active",
        query_limit: 500,
        query_count: 123,
        companies_limit: 20,
        companies_count: 5,
        api_access: true,
        overage_enabled: false,
      };
      vi.mocked(client.get).mockResolvedValueOnce(mockStatus);

      const result = await registeredTools.get("get_billing_status")!.handler({});

      expect(client.get).toHaveBeenCalledWith("/billing/status");
      expect(result.content[0].text).toBe(JSON.stringify(mockStatus, null, 2));
      expect(result.isError).toBeUndefined();
    });

    it("includes trial_days_remaining when present", async () => {
      const mockStatus = {
        tier: "explorer",
        status: "trial",
        query_limit: 15,
        query_count: 3,
        companies_limit: 3,
        companies_count: 1,
        api_access: false,
        trial_days_remaining: 7,
        overage_enabled: false,
      };
      vi.mocked(client.get).mockResolvedValueOnce(mockStatus);

      const result = await registeredTools.get("get_billing_status")!.handler({});

      expect(result.content[0].text).toContain("trial_days_remaining");
      expect(result.content[0].text).toContain("7");
    });

    it("returns error on EquiVaultApiError", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(
        new EquiVaultApiError(401, { error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } })
      );

      const result = await registeredTools.get("get_billing_status")!.handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Invalid API key");
    });

    it("returns error on unexpected error", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error("connection refused"));

      const result = await registeredTools.get("get_billing_status")!.handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unexpected error");
    });
  });
});
