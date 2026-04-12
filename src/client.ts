import type { EquiVaultErrorResponse } from "./types.js";

export interface ClientConfig {
  apiKey: string;
  tenantId: string;
  baseUrl: string;
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

  constructor(config: ClientConfig) {
    this.config = config;
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
}
