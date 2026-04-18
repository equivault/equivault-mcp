import type { EquiVaultErrorResponse } from "./types.js";
import { runCompatCheck } from "./compat.js";

export interface ClientConfig {
  apiKey: string;
  tenantId: string;
  baseUrl: string;
  /**
   * npm-style semver range declaring the platform API versions this
   * client was built against, e.g. ">=1.3.0 <1.6.0". When the API
   * responds with an `X-EquiVault-Version` header outside this range,
   * the client logs a single warning to stderr. Pass `null` to disable
   * the check (useful in tests).
   */
  platformCompatRange?: string | null;
}

export class EquiVaultApiError extends Error {
  readonly status: number;
  readonly body: EquiVaultErrorResponse | null;

  constructor(status: number, body: EquiVaultErrorResponse | null) {
    super(`EquiVault API error: ${status}`);
    this.name = "EquiVaultApiError";
    this.status = status;
    this.body = body;
  }
}

export class EquiVaultClient {
  private readonly config: ClientConfig;
  private compatChecked = false;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  /**
   * Read the platform version from a response header and run the
   * compat check exactly once per client instance. Silent when the
   * observed version is in range, missing, or the check is disabled.
   */
  private maybeCheckCompat(response: Response): void {
    if (this.compatChecked) return;
    const range = this.config.platformCompatRange;
    if (range === null || range === undefined || range === "") return;
    this.compatChecked = true;
    const observed = response.headers.get("x-equivault-version");
    runCompatCheck(observed, range);
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      "X-Tenant-ID": this.config.tenantId,
      "Content-Type": "application/json",
    };
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = `${this.config.baseUrl}${path}`;
    if (!params || Object.keys(params).length === 0) {
      return url;
    }
    const qs = new URLSearchParams(params).toString();
    return `${url}?${qs}`;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Peek at the platform version header on every response — success
    // or failure. Check runs at most once per client instance.
    this.maybeCheckCompat(response);

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    let body: EquiVaultErrorResponse | null = null;
    try {
      body = (await response.json()) as EquiVaultErrorResponse;
    } catch {
      // JSON parse failed — leave body as null
    }

    throw new EquiVaultApiError(response.status, body);
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(path, params);
    const response = await fetch(url, {
      method: "GET",
      headers: this.headers,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async put<T = unknown>(path: string, data: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T = unknown>(path: string): Promise<T> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.headers,
    });

    this.maybeCheckCompat(response);

    if (!response.ok) {
      let body: EquiVaultErrorResponse | null = null;
      try {
        body = (await response.json()) as EquiVaultErrorResponse;
      } catch {
        // body stays null
      }
      throw new EquiVaultApiError(response.status, body);
    }

    // DELETE responses often have no body (204 No Content)
    try {
      return (await response.json()) as T;
    } catch {
      return {} as T;
    }
  }
}
