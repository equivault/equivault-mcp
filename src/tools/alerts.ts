import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EquiVaultClient } from "../client.js";
import { handleError } from "../errors.js";
import type { AlertRule } from "../types.js";

const conditionEnum = z.enum([
  "above",
  "below",
  "crosses_above",
  "crosses_below",
  "equals",
]);

export function registerAlertTools(
  server: McpServer,
  client: EquiVaultClient
): void {
  server.tool(
    "create_alert",
    "Create a new alert rule that fires when a metric meets a condition. Optionally scoped to a specific company_id; if omitted, the alert applies to all followed companies. Requires Advisor tier.",
    {
      name: z.string().describe("Human-readable alert name"),
      company_id: z
        .string()
        .optional()
        .describe("Optional company ID — if omitted, alert applies across portfolio"),
      metric: z
        .string()
        .describe("Metric key (e.g. 'pe_ratio', 'revenue_growth', 'insider_buying_90d')"),
      condition: conditionEnum.describe("How the metric should match: above, below, crosses_above, crosses_below, equals"),
      threshold: z.number().describe("Threshold value to compare against"),
    },
    async (input) => {
      try {
        const payload: Record<string, unknown> = {
          name: input.name,
          metric: input.metric,
          condition: input.condition,
          threshold: input.threshold,
        };
        if (input.company_id) payload.company_id = input.company_id;

        const alert = await client.post<AlertRule>("/signals/alerts", payload);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(alert, null, 2) }],
        };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  server.tool(
    "update_alert",
    "Update an existing alert rule. Only the fields you provide are changed. Requires Advisor tier.",
    {
      alert_id: z.string().describe("Alert rule ID"),
      name: z.string().optional().describe("New alert name"),
      threshold: z.number().optional().describe("New threshold"),
      condition: conditionEnum.optional().describe("New condition"),
      enabled: z.boolean().optional().describe("Enable or disable the alert"),
    },
    async ({ alert_id, ...rest }) => {
      try {
        const patch: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) {
          if (v !== undefined) patch[k] = v;
        }

        const alert = await client.put<AlertRule>(
          `/signals/alerts/${alert_id}`,
          patch
        );
        return {
          content: [{ type: "text" as const, text: JSON.stringify(alert, null, 2) }],
        };
      } catch (err) {
        return handleError(err);
      }
    }
  );

  server.tool(
    "delete_alert",
    "Delete an alert rule. This cannot be undone. Requires Advisor tier.",
    {
      alert_id: z.string().describe("Alert rule ID"),
    },
    async ({ alert_id }) => {
      try {
        await client.delete(`/signals/alerts/${alert_id}`);
        return {
          content: [
            {
              type: "text" as const,
              text: `Alert ${alert_id} deleted.`,
            },
          ],
        };
      } catch (err) {
        return handleError(err);
      }
    }
  );
}
