# Runtime Error Logger Operations Guide

## Enabling the logger
1. In the Netlify dashboard, open the site → *Site configuration* → *Environment variables*.
2. Set `ENABLE_LOGGER` to `true` (string) and redeploy the site. The logger only runs in production builds, so local previews stay unaffected.

## Capturing an incident
1. After enabling the flag, reproduce the client-side error in production.
2. Open Netlify → *Logs* → *Functions* → `log-error` and filter for `[client-error]` to inspect the structured payload. Each entry includes the original message/stack plus a `receivedAt` timestamp from the function.

## Disabling the logger
1. Return to the Netlify environment variable settings.
2. Set `ENABLE_LOGGER` back to `false` (or remove the variable) and redeploy. The client stops sending runtime errors as soon as the new build is live.
