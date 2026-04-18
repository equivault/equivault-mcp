#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EquiVaultClient } from "./client.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerFinancialTools } from "./tools/financials.js";
import { registerMarketTools } from "./tools/market.js";
import { registerScreeningTools } from "./tools/screening.js";
import { registerBillingTools } from "./tools/billing.js";
import { registerNarrativeTools } from "./tools/narrative.js";
import { registerProfileTools } from "./tools/profiles.js";
import { registerStrategyTools } from "./tools/strategy.js";
import { registerCompositeTools } from "./tools/composite.js";
import { registerSignalTools } from "./tools/signals.js";
import { registerAlertTools } from "./tools/alerts.js";
import { registerBriefTools } from "./tools/briefs.js";
import { registerPortfolioTools } from "./tools/portfolio.js";
import { registerMediaTools } from "./tools/media.js";
import { registerGuruTools } from "./tools/gurus.js";
import { registerMarketsTools } from "./tools/markets.js";

const apiKey = process.env.EQUIVAULT_API_KEY;
const tenantId = process.env.EQUIVAULT_TENANT_ID;
const baseUrl = process.env.EQUIVAULT_BASE_URL ?? "https://api.equivault.ai/api/v1";

if (!apiKey) {
  console.error("Error: EQUIVAULT_API_KEY environment variable is required.");
  process.exit(1);
}

if (!tenantId) {
  console.error("Error: EQUIVAULT_TENANT_ID environment variable is required.");
  process.exit(1);
}

// Read our own package.json to surface the version + compat range
// from a single source of truth. The file sits at ../package.json
// relative to the compiled build/ directory.
interface EquivaultPkgMeta {
  version: string;
  equivault?: {
    platformCompatRange?: string;
    platformSurfaceVersion?: string;
  };
}

function readPackageMeta(): EquivaultPkgMeta {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkgPath = join(here, "..", "package.json");
  try {
    const raw = readFileSync(pkgPath, "utf8");
    return JSON.parse(raw) as EquivaultPkgMeta;
  } catch {
    // Fall back to minimal hardcoded metadata if the file isn't
    // readable (e.g. custom build or unusual install layout).
    return { version: "0.0.0" };
  }
}

const pkg = readPackageMeta();
const platformCompatRange = pkg.equivault?.platformCompatRange ?? null;

const client = new EquiVaultClient({
  apiKey,
  tenantId,
  baseUrl,
  platformCompatRange,
});
const server = new McpServer({ name: "equivault", version: pkg.version });

registerCompanyTools(server, client);
registerFinancialTools(server, client);
registerMarketTools(server, client);
registerScreeningTools(server, client);
registerBillingTools(server, client);
registerNarrativeTools(server, client);
registerProfileTools(server, client);
registerStrategyTools(server, client);
registerCompositeTools(server, client);
registerSignalTools(server, client);
registerAlertTools(server, client);
registerBriefTools(server, client);
registerPortfolioTools(server, client);
registerMediaTools(server, client);
registerGuruTools(server, client);
registerMarketsTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
