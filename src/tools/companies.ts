import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { Company, CompanyDetail } from "../types.js";

export function registerCompanyTools(server: McpServer, client: EquiVaultClient): void {
  server.tool(
    "search_companies",
    "Search for companies by name, ticker symbol, or keyword. Returns a list of matching companies with their IDs.",
    {
      query: z.string().describe("Search term — company name, ticker symbol, or keyword"),
    },
    async ({ query }) => {
      try {
        const results = await client.get<Company[]>("/companies", { search: query });
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  server.tool(
    "get_company",
    "Get detailed information about a specific company by its ID.",
    {
      company_id: z.string().describe("Company ID from search_companies results"),
    },
    async ({ company_id }) => {
      try {
        const result = await client.get<CompanyDetail>(`/companies/${company_id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
