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

## Deploy to Netlify with Decap CMS

1. Connect the repository to Netlify and choose the branch that should trigger builds (e.g. `main`).
2. In **Site settings → Build & deploy**, set the **Build command** to `npm run build` and the **Publish directory** to `dist`.
3. Enable **Identity** and **Git Gateway** from the Netlify dashboard so Decap CMS can authenticate editors and commit updates.
4. Make sure the branch selected in Netlify matches the `branch` value in [`admin/config.yml`](admin/config.yml). The configuration now defaults to `main`; change it if your production site uses a different branch.
5. After deploying, visit `/admin/` on your Netlify site to log in with Netlify Identity and manage all site content through Decap CMS.
