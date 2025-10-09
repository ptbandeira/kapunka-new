<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ROv6j-3REdmWuJaFL9bv6nVzPXYPlQNf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Diagnose deploy issues

Use the build diagnostics runner to capture detailed error summaries when a Netlify/Vite build fails.

If you're collaborating with the AI assistant and want it to inspect the build output for you, ask it to run the command and review the generated log. For example:

> "Run `npm run diagnose:deploy` and tell me which files and lines are failing."

The assistant (or you, when running it manually) will execute the command below.

```bash
npm run diagnose:deploy
```

The command proxies `npm run build`, saves the full log under `logs/deploy-diagnostics/`, and highlights any file/line pairs detected in the error output so you can jump straight to the failing code. When working asynchronously, share the most recent log path (e.g., `logs/deploy-diagnostics/build-<timestamp>.log`) so the assistant can dive deeper into the exact failure trace.

## Coding standards

When committing changes, keep these safeguards in mind:

- Memoize React event handlers (`useCallback`, pre-declared functions) instead of passing inline lambdas/binds through JSX props.
- Replace `void someAsync()` with an explicit call that handles rejections (`someAsync().catch(...)`).
- Supply React list keys from stable domain data (ids, slugs, unique strings) rather than array indices.
- Prefer strong typings—avoid `any` altogether. Validate CMS payloads with type guards and keep values as `unknown` until narrowed.

## Deploy to Netlify with Decap CMS

1. Connect the repository to Netlify and choose the branch that should trigger builds (e.g. `main`).
2. In **Site settings → Build & deploy**, set the **Build command** to `npm run build` and the **Publish directory** to `dist`.
3. Within the same settings screen, open **Dependency management** and select **Node.js 20.x** for the preview/build image. This matches the `NODE_VERSION = "20"` declared in [`netlify.toml`](netlify.toml) and avoids using newer runtimes (like 22.x) that the project has not been validated against.
4. Enable **Identity** and **Git Gateway** from the Netlify dashboard so Decap CMS can authenticate editors and commit updates.
5. Make sure the branch selected in Netlify matches the `branch` value in [`admin/config.yml`](admin/config.yml). The configuration now defaults to `main`; change it if your production site uses a different branch.
6. After deploying, visit `/admin/` on your Netlify site to log in with Netlify Identity and manage all site content through Decap CMS.

### Further reading for editors
- Track historical decisions around Decap CMS configuration and Netlify deploys in the [Decap CMS & Netlify rolling log](docs/decap-netlify-rolling-log.md) before making structural changes.
