import {
  buildAlertRule,
  toAlertRuleResponse,
  validateAlertRuleInput,
  validateAlertRulePatchInput
} from "../domain/alertRules";
import { createAlertRuleRepository, createRepository } from "../storage/repository";
import { ApiError, errorResponse, jsonResponse, methodNotAllowed, notFound, parseJsonBody } from "./http";

export interface ApiEnv {
  DB: D1Database;
}

export async function handleApiRequest(request: Request, env: ApiEnv): Promise<Response> {
  try {
    return await dispatchApiRequest(request, env);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse(new ApiError(500, "internal_error", "Unexpected server error."));
  }
}

async function dispatchApiRequest(request: Request, env: ApiEnv): Promise<Response> {
  const url = new URL(request.url);
  const repository = createAlertRuleRepository(createRepository(env.DB));

  if (url.pathname === "/api/alerts") {
    if (request.method === "GET") {
      const alerts = await repository.listAlertRules();
      return jsonResponse({ alerts: alerts.map(toAlertRuleResponse) });
    }

    if (request.method === "POST") {
      const validation = validateAlertRuleInput(await parseJsonBody<unknown>(request));

      if (!validation.ok) {
        throw new ApiError(400, "invalid_alert", validation.issues[0]?.message ?? "Invalid alert rule.", {
          issues: validation.issues
        });
      }

      const alert = buildAlertRule(validation.value);
      await repository.createAlertRule(alert);

      return jsonResponse({ alert: toAlertRuleResponse(alert) }, { status: 201 });
    }

    return methodNotAllowed(request.method);
  }

  const alertMatch = /^\/api\/alerts\/([^/]+)$/.exec(url.pathname);

  if (alertMatch) {
    const id = decodeURIComponent(alertMatch[1]);

    if (request.method === "PATCH") {
      const validation = validateAlertRulePatchInput(await parseJsonBody<unknown>(request));

      if (!validation.ok) {
        throw new ApiError(400, "invalid_alert_update", validation.issues[0]?.message ?? "Invalid alert update.", {
          issues: validation.issues
        });
      }

      const alert = await repository.setAlertRuleActive(id, validation.value.active, new Date().toISOString());

      if (!alert) {
        return notFound("Alert rule not found.");
      }

      return jsonResponse({ alert: toAlertRuleResponse(alert) });
    }

    if (request.method === "DELETE") {
      await repository.deleteAlertRule(id);
      return new Response(null, { status: 204 });
    }

    return methodNotAllowed(request.method);
  }

  return notFound("API route not found.");
}
