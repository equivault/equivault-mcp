import type { EquiVaultErrorResponse } from "./types.js";

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function translateError(
  status: number,
  body: EquiVaultErrorResponse | null | undefined
): string {
  if (!body) {
    return "EquiVault API error. Try again in a moment.";
  }

  if (status === 401) {
    return "Invalid API key. Check your EQUIVAULT_API_KEY configuration.";
  }

  if (status === 402) {
    const { required_tier, current_tier, monthly_delta_cents } = body.error;
    const required = capitalize(required_tier ?? "");
    const current = capitalize(current_tier ?? "");

    const base = `This feature requires ${required} tier. You're on ${current}.`;

    if (monthly_delta_cents && monthly_delta_cents > 0) {
      const dollars = Math.floor(monthly_delta_cents / 100);
      return `${base} Upgrade for +$${dollars}/mo.`;
    }

    return base;
  }

  if (status === 404) {
    return "Company not found. Try searching with the search_companies tool.";
  }

  if (status === 429) {
    return "Rate limited. Check your usage with the get_billing_status tool.";
  }

  if (status >= 500) {
    return "EquiVault API error. Try again in a moment.";
  }

  return "EquiVault API error. Try again in a moment.";
}
