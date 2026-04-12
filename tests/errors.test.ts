import { describe, it, expect } from "vitest";
import { translateError } from "../src/errors.js";
import type { EquiVaultErrorResponse } from "../src/types.js";

const makeError = (overrides: Partial<EquiVaultErrorResponse["error"]> = {}): EquiVaultErrorResponse => ({
  error: {
    code: "SOME_ERROR",
    message: "Some error",
    status: 400,
    ...overrides,
  },
});

describe("translateError", () => {
  it("returns invalid API key message for 401", () => {
    const result = translateError(401, makeError({ status: 401 }));
    expect(result).toBe("Invalid API key. Check your EQUIVAULT_API_KEY configuration.");
  });

  it("returns tier-aware message for 402 with delta", () => {
    const body = makeError({
      status: 402,
      required_tier: "professional",
      current_tier: "analyst",
      monthly_delta_cents: 15000,
    });
    const result = translateError(402, body);
    expect(result).toBe(
      "This feature requires Professional tier. You're on Analyst. Upgrade for +$150/mo."
    );
  });

  it("returns tier message without delta for 402 without monthly_delta_cents", () => {
    const body = makeError({
      status: 402,
      required_tier: "advisor",
      current_tier: "starter",
    });
    const result = translateError(402, body);
    expect(result).toBe(
      "This feature requires Advisor tier. You're on Starter."
    );
  });

  it("handles 402 with zero delta (no delta shown)", () => {
    const body = makeError({
      status: 402,
      required_tier: "enterprise",
      current_tier: "advisor",
      monthly_delta_cents: 0,
    });
    const result = translateError(402, body);
    expect(result).toBe(
      "This feature requires Enterprise tier. You're on Advisor."
    );
  });

  it("handles 402 with missing tier info gracefully", () => {
    const body = makeError({ status: 402 });
    const result = translateError(402, body);
    expect(result).toContain("tier");
  });

  it("returns company not found message for 404", () => {
    const result = translateError(404, makeError({ status: 404 }));
    expect(result).toBe(
      "Company not found. Try searching with the search_companies tool."
    );
  });

  it("returns rate limited message for 429", () => {
    const result = translateError(429, makeError({ status: 429 }));
    expect(result).toBe(
      "Rate limited. Check your usage with the get_billing_status tool."
    );
  });

  it("returns generic API error for 500", () => {
    const result = translateError(500, makeError({ status: 500 }));
    expect(result).toBe("EquiVault API error. Try again in a moment.");
  });

  it("returns generic API error for 503", () => {
    const result = translateError(503, makeError({ status: 503 }));
    expect(result).toBe("EquiVault API error. Try again in a moment.");
  });

  it("returns generic API error for null body", () => {
    const result = translateError(500, null);
    expect(result).toBe("EquiVault API error. Try again in a moment.");
  });

  it("returns generic API error for undefined body", () => {
    const result = translateError(500, undefined);
    expect(result).toBe("EquiVault API error. Try again in a moment.");
  });

  it("returns generic API error for null body with non-5xx status", () => {
    const result = translateError(400, null);
    expect(result).toBe("EquiVault API error. Try again in a moment.");
  });

  it("capitalizes single-word tier names correctly", () => {
    const body = makeError({
      status: 402,
      required_tier: "explorer",
      current_tier: "enterprise",
      monthly_delta_cents: 500,
    });
    const result = translateError(402, body);
    expect(result).toBe(
      "This feature requires Explorer tier. You're on Enterprise. Upgrade for +$5/mo."
    );
  });

  it("formats cents as whole dollars (rounds down)", () => {
    const body = makeError({
      status: 402,
      required_tier: "professional",
      current_tier: "analyst",
      monthly_delta_cents: 9999,
    });
    const result = translateError(402, body);
    expect(result).toContain("$99");
  });
});
