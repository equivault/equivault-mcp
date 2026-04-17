import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EquiVaultClient, EquiVaultApiError } from "../src/client.js";
import type { ClientConfig } from "../src/client.js";

const config: ClientConfig = {
  apiKey: "test-api-key",
  tenantId: "tenant-123",
  baseUrl: "https://api.equivault.test",
};

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("EquiVaultClient", () => {
  let client: EquiVaultClient;

  beforeEach(() => {
    client = new EquiVaultClient(config);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("get()", () => {
    it("sends GET request with correct headers", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse({ data: "ok" }));
      vi.stubGlobal("fetch", fetchMock);

      await client.get("/companies");

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.equivault.test/companies");
      expect(init.method).toBe("GET");
      expect(init.headers["Authorization"]).toBe("Bearer test-api-key");
      expect(init.headers["X-Tenant-ID"]).toBe("tenant-123");
      expect(init.headers["Content-Type"]).toBe("application/json");
    });

    it("appends query params to URL", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse({ data: "ok" }));
      vi.stubGlobal("fetch", fetchMock);

      await client.get("/companies", { q: "Apple", limit: "10" });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain("?");
      expect(url).toContain("q=Apple");
      expect(url).toContain("limit=10");
    });

    it("returns parsed JSON on success", async () => {
      const payload = { id: "aapl", name: "Apple" };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(payload)));

      const result = await client.get<typeof payload>("/companies/aapl");

      expect(result).toEqual(payload);
    });

    it("throws EquiVaultApiError on non-ok response", async () => {
      const errorBody = {
        error: { code: "NOT_FOUND", message: "Not found", status: 404 },
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(errorBody, 404)));

      await expect(client.get("/companies/unknown")).rejects.toThrow(EquiVaultApiError);
    });

    it("throws EquiVaultApiError with correct status", async () => {
      const errorBody = {
        error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 },
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(errorBody, 401)));

      try {
        await client.get("/companies");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(EquiVaultApiError);
        expect((err as EquiVaultApiError).status).toBe(401);
        expect((err as EquiVaultApiError).body).toEqual(errorBody);
      }
    });

    it("sets body to null when JSON parse fails on error response", async () => {
      const badResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new SyntaxError("bad json")),
      } as unknown as Response;
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(badResponse));

      try {
        await client.get("/companies");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(EquiVaultApiError);
        expect((err as EquiVaultApiError).status).toBe(500);
        expect((err as EquiVaultApiError).body).toBeNull();
      }
    });

    it("does not append query string when no params provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse({ data: "ok" }));
      vi.stubGlobal("fetch", fetchMock);

      await client.get("/companies");

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.equivault.test/companies");
      expect(url).not.toContain("?");
    });
  });

  describe("post()", () => {
    it("sends POST request with correct headers and body", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse({ id: "new" }, 201));
      vi.stubGlobal("fetch", fetchMock);

      const payload = { name: "Apple", ticker: "AAPL" };
      await client.post("/companies", payload);

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.equivault.test/companies");
      expect(init.method).toBe("POST");
      expect(init.headers["Authorization"]).toBe("Bearer test-api-key");
      expect(init.headers["X-Tenant-ID"]).toBe("tenant-123");
      expect(init.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(init.body)).toEqual(payload);
    });

    it("returns parsed JSON on successful POST", async () => {
      const responseData = { id: "new-company", created: true };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(responseData, 201)));

      const result = await client.post<typeof responseData>("/companies", {});

      expect(result).toEqual(responseData);
    });

    it("throws EquiVaultApiError on non-ok POST response", async () => {
      const errorBody = {
        error: { code: "FORBIDDEN", message: "Forbidden", status: 403 },
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(errorBody, 403)));

      await expect(client.post("/companies", {})).rejects.toThrow(EquiVaultApiError);
    });

    it("throws EquiVaultApiError with correct status on POST failure", async () => {
      const errorBody = {
        error: {
          code: "UPGRADE_REQUIRED",
          message: "Upgrade required",
          status: 402,
          required_tier: "professional",
          current_tier: "starter",
          monthly_delta_cents: 21000,
        },
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(errorBody, 402)));

      try {
        await client.post("/screen", {});
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(EquiVaultApiError);
        expect((err as EquiVaultApiError).status).toBe(402);
        expect((err as EquiVaultApiError).body).toEqual(errorBody);
      }
    });

    it("sets body to null when JSON parse fails on POST error", async () => {
      const badResponse = {
        ok: false,
        status: 503,
        json: vi.fn().mockRejectedValue(new SyntaxError("bad json")),
      } as unknown as Response;
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(badResponse));

      try {
        await client.post("/companies", {});
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(EquiVaultApiError);
        expect((err as EquiVaultApiError).status).toBe(503);
        expect((err as EquiVaultApiError).body).toBeNull();
      }
    });
  });

  describe("put()", () => {
    it("sends PUT request with correct headers and body", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse({ id: "alert-1", updated: true }));
      vi.stubGlobal("fetch", fetchMock);

      const result = await client.put("/signals/alerts/alert-1", { threshold: 10 });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.equivault.test/signals/alerts/alert-1");
      expect(init.method).toBe("PUT");
      expect(JSON.parse(init.body)).toEqual({ threshold: 10 });
      expect(init.headers["Authorization"]).toBe("Bearer test-api-key");
      expect(result).toEqual({ id: "alert-1", updated: true });
    });

    it("throws EquiVaultApiError on non-ok PUT response", async () => {
      const errorBody = { error: { code: "NOT_FOUND", message: "Not found", status: 404 } };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(errorBody, 404)));

      await expect(client.put("/signals/alerts/bad", {})).rejects.toThrow(EquiVaultApiError);
    });
  });

  describe("delete()", () => {
    it("sends DELETE request with correct headers and no body", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse({}, 204));
      vi.stubGlobal("fetch", fetchMock);

      await client.delete("/signals/alerts/alert-1");

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.equivault.test/signals/alerts/alert-1");
      expect(init.method).toBe("DELETE");
      expect(init.body).toBeUndefined();
      expect(init.headers["Authorization"]).toBe("Bearer test-api-key");
    });

    it("returns empty object when response body is empty (204)", async () => {
      const emptyResponse = {
        ok: true,
        status: 204,
        json: vi.fn().mockRejectedValue(new Error("no body")),
      } as unknown as Response;
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(emptyResponse));

      const result = await client.delete("/signals/alerts/alert-1");
      expect(result).toEqual({});
    });

    it("throws EquiVaultApiError on non-ok DELETE response", async () => {
      const errorBody = { error: { code: "NOT_FOUND", message: "Not found", status: 404 } };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(errorBody, 404)));

      await expect(client.delete("/signals/alerts/bad")).rejects.toThrow(EquiVaultApiError);
    });
  });

  describe("EquiVaultApiError", () => {
    it("is an instance of Error", () => {
      const err = new EquiVaultApiError(404, null);
      expect(err).toBeInstanceOf(Error);
    });

    it("has correct name", () => {
      const err = new EquiVaultApiError(404, null);
      expect(err.name).toBe("EquiVaultApiError");
    });

    it("exposes status and body", () => {
      const body = { error: { code: "E", message: "m", status: 404 } };
      const err = new EquiVaultApiError(404, body);
      expect(err.status).toBe(404);
      expect(err.body).toEqual(body);
    });
  });
});
