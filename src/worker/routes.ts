import {
  buildAlertRule,
  toAlertRuleResponse,
  validateAlertRuleInput,
  validateAlertRulePatchInput
} from "../domain/alertRules";
import { createEmailChannel } from "../channels/email";
import { createSlackChannel } from "../channels/slack";
import { validateDemoEventInput } from "../domain/events";
import { findMatchingAlertRules } from "../domain/matcher";
import { type NotificationChannel, notifyAlertForEvent } from "../domain/notifications";
import {
  createAlertRuleRepository,
  createEventRepository,
  createNotificationAttemptRepository,
  createRepository
} from "../storage/repository";
import { ApiError, errorResponse, jsonResponse, methodNotAllowed, notFound, parseJsonBody } from "./http";

export interface ApiEnv {
  DB: D1Database;
  DELIVERY_MODE?: "fake" | "real";
  SLACK_WEBHOOK_URL?: string;
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
  const repository = createRepository(env.DB);
  const alertRules = createAlertRuleRepository(repository);

  if (url.pathname === "/api/alerts") {
    if (request.method === "GET") {
      const alerts = await alertRules.listAlertRules();
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
      await alertRules.createAlertRule(alert);

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

      const alert = await alertRules.setAlertRuleActive(id, validation.value.active, new Date().toISOString());

      if (!alert) {
        return notFound("Alert rule not found.");
      }

      return jsonResponse({ alert: toAlertRuleResponse(alert) });
    }

    if (request.method === "DELETE") {
      await alertRules.deleteAlertRule(id);
      return new Response(null, { status: 204 });
    }

    return methodNotAllowed(request.method);
  }

  if (url.pathname === "/api/events/demo") {
    if (request.method !== "POST") {
      return methodNotAllowed(request.method);
    }

    const validation = validateDemoEventInput(await parseJsonBody<unknown>(request));

    if (!validation.ok) {
      throw new ApiError(400, "invalid_event", validation.issues[0]?.message ?? "Invalid demo event.", {
        issues: validation.issues
      });
    }

    const events = createEventRepository(repository);
    const attempts = createNotificationAttemptRepository(repository);
    const event = await events.upsertEventCandidate(validation.value);
    const activeRules = await events.listActiveAlertRulesByCategory(event.category);
    const matchingRules = findMatchingAlertRules(activeRules, event);
    const channels = createChannelMap(env);
    let createdAttempts = 0;
    let skippedDuplicates = 0;

    for (const alert of matchingRules) {
      const channel = channels.get(alert.channel);

      if (!channel) {
        continue;
      }

      const result = await notifyAlertForEvent({
        alert,
        event,
        channel,
        store: attempts
      });

      if (result.duplicate) {
        skippedDuplicates += 1;
      } else {
        createdAttempts += 1;
      }
    }

    return jsonResponse({
      event: {
        id: event.id,
        title: event.title,
        category: event.category
      },
      matchedAlerts: matchingRules.length,
      createdAttempts,
      skippedDuplicates
    });
  }

  if (url.pathname === "/api/attempts") {
    if (request.method !== "GET") {
      return methodNotAllowed(request.method);
    }

    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(1, parseInt(limitParam ?? "20", 10) || 20), 100);
    const attempts = createNotificationAttemptRepository(repository);
    const recentAttempts = await attempts.listRecentNotificationAttempts(limit);

    return jsonResponse({ attempts: recentAttempts });
  }

  return notFound("API route not found.");
}

function createChannelMap(env: ApiEnv): Map<string, NotificationChannel> {
  const useRealDelivery = env.DELIVERY_MODE === "real";

  return new Map<string, NotificationChannel>([
    ["email", createEmailChannel()],
    ["slack", createSlackChannel({ webhookUrl: useRealDelivery ? env.SLACK_WEBHOOK_URL : undefined })]
  ]);
}
