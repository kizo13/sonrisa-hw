import { jsonResponse } from "./http";
import { handleApiRequest } from "./routes";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  DELIVERY_MODE: "fake" | "real";
  SLACK_WEBHOOK_URL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return jsonResponse({
        ok: true,
        service: "alert-notifications",
        deliveryMode: env.DELIVERY_MODE
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_event: ScheduledEvent, _env: Env, _ctx: ExecutionContext): Promise<void> {
    // Scheduled evaluation is a documented stretch goal, not part of setup.
  }
};
