import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN =
  "https://08573b16863216ee1edfe24ca9b44551@o4511158959931392.ingest.de.sentry.io/4511158970220624";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
});
