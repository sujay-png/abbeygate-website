import * as Sentry from "@sentry/nextjs";
import { EventEmitter } from "events";

// Next.js dev server attaches multiple 'close' listeners to ServerResponse
// objects (one per active request handler / abort signal). The default limit
// of 10 is too low for a site with several concurrent data-fetching routes,
// causing a spurious MaxListenersExceededWarning. Raising it to 20 is safe
// and suppresses the false-positive warning without masking real leaks.
EventEmitter.defaultMaxListeners = 20;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./lib/env");
    const envCheck = validateEnv();
    if (!envCheck.isValid) {
      console.warn("[env] Environment validation warnings:", envCheck.errors.join("; "));
    }
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
