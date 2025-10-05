# Decap CMS & Netlify Rolling Log

This log records day-to-day investigations, fixes, and decisions that affect the Decap CMS configuration or Netlify delivery. Use it to understand why a change shipped, what problem it solved, and where to look for deeper context (PRs, commits, and audit docs).

## How to add a new entry
- **Date**: Use ISO format (`YYYY-MM-DD`).
- **Title**: Summarise the change or discovery in a short phrase.
- **What changed**: Explain the update or investigation outcome.
- **Impact & follow-up**: Note whether editors, deploys, or automation were affected and document any TODOs.
- **References**: Link to the relevant PRs/commits and any supporting documents in `docs/`.

---

## 2025-10-05 — Enabled localized site settings & routing
- **What changed**: Marked brand name, footer legal text, social link labels, and about alt fields as `i18n: true` in `admin/config.yml` and migrated `content/site.json` to store Portuguese and Spanish values alongside English. Updated React routing and language utilities so internal links and CTAs build locale-prefixed URLs and fall back to English copy when translations are missing.
- **Impact & follow-up**: Editors can now manage the shared site chrome in all three locales from a single form, and visitors see `/pt/...` or `/es/...` URLs when switching languages. Monitor Stackbit annotations around the updated links to confirm the Visual Editor still maps to the correct fields.
- **References**: Pending PR

## 2025-10-03 — Restored Visual Editor metadata
- **What changed**: Recovered `metadata.json` from the last valid revision after it was committed as an empty file, restoring the Stackbit model definitions required by the Visual Editor.
- **Impact & follow-up**: Netlify builds run again and Visual Editor bindings resolve correctly. Keep an eye on future schema migrations to ensure regenerated metadata is committed alongside content changes.
- **References**: Pending PR

## 2025-10-03 — Removed legacy imageRef fields from CMS
- **What changed**: Simplified all Decap schemas to rely on the native `image`/`imageUrl` upload fields, removed the redundant `imageRef` string fallback, and migrated existing JSON content plus metadata/Stackbit bindings to the new structure.
- **Impact & follow-up**: Editors now see a single, intuitive image picker instead of duplicate path inputs. Monitor upcoming content edits to confirm older entries save without regenerating the removed fields.
- **References**: Pending PR

## 2025-10-03 — Unified page hero editor refresh
- **What changed**: Reworked the unified pages hero schema into grouped content/CTA/media/layout objects and migrated existing entries to match. The new CMS layout mirrors the “command center” wireframe so editors only see the essential fields.
- **Impact & follow-up**: Editors gain a streamlined hero workflow without losing access to alignment or CTA settings. Monitor Stackbit/Visual Editor bindings to ensure the new nested structure is resolved correctly.
- **References**: Pending PR

## 2025-10-03 — Custom commit messages for editorial history
- **What changed**: Added friendly commit message templates so Decap records the collection, slug, and editor responsible for each change committed through Netlify Identity.
- **Impact & follow-up**: Improves auditability of CMS-driven content changes; no further action required unless new collections are added. Aligns with guidance in the Decap CMS audit for keeping editorial trails transparent.
- **References**: [PR #198](https://github.com/ptbandeira/kapunka-new/pull/198) · [Commit 3cdbf99](https://github.com/ptbandeira/kapunka-new/commit/3cdbf99364cf5dc0f0c080030080260576421cef) · [Decap CMS audit](./decap-cms-audit.md)

## 2025-10-03 — Unified page image sync fixes
- **What changed**: Flattened locale-specific image objects in the unified pages schema and corrected i18n keys so Netlify builds and Stackbit sync use the same field structure.
- **Impact & follow-up**: Resolved asset hydration errors during previews and ensures editors only manage one image per locale. Continue monitoring Stackbit sync logs for regressions when adding new unified sections.
- **References**: [PR #199](https://github.com/ptbandeira/kapunka-new/pull/199) · [Commit 8873572](https://github.com/ptbandeira/kapunka-new/commit/8873572b02dd9db01df958524dc77f9c3e0b3905) · [Visual editor audit](./visual-editor-audit.md)

## 2025-10-03 — Refactored Decap sections & i18n config
- **What changed**: Added top-level locale settings, introduced reusable hero/media/testimonial objects in `admin/config.yml`, and removed unused feature flag + unified pages scaffolding. Updated the React Home page to consume the new nested section data while supporting existing content.
- **Impact & follow-up**: Editors now work with cleaner section objects and consistent localization defaults. Monitor upcoming CMS edits to ensure nested hero/media/testimonial data saves as expected across locales.
- **References**: Pending PR

## 2025-10-04 — Removed duplicate i18n block from CMS config
- **What changed**: Deleted the redundant `i18n` declaration at the bottom of `admin/config.yml` to keep the global locale settings defined only once.
- **Impact & follow-up**: Prevents conflicting locale settings when Decap parses the schema. No further action required unless additional top-level options are added.
- **References**: Pending PR

## 2025-10-05 — Migrated page content to Markdown & rebuilt Visual Editor mirror
- **What changed**: Converted all localized page entries from JSON to Markdown front matter, reorganized uploads by collection, and updated CMS + Stackbit metadata to reference the new paths. Added `scripts/prepare-visual-editor-content.js` to copy the canonical `content/` tree (excluding uploads) into `.netlify/visual-editor/content/` during builds.
- **Impact & follow-up**: Editors now work with cleaner front matter files and scoped media directories while the Visual Editor loads content from the generated mirror instead of the deprecated `site/content` tree. Monitor future migrations to ensure the prep script continues to exclude large assets.
- **References**: Pending PR

## 2025-10-05 — Added tailored Decap previews & editorial dashboard shortcuts
- **What changed**: Introduced `admin/cms.js` with rich React previews for Home, Learn, and Method pages, loaded the Tailwind CSS bundle via `admin/preview.css`, and registered a dashboard widget with quick links to the most edited entries. Updated `admin/config.yml` to surface the custom dashboard widget in the editorial workflow.
- **Impact & follow-up**: Editors now see styled previews that mirror the live design and can jump straight to high-priority entries from the workflow screen. Validate the dashboard injection on production Decap; adjust widget placement if the editorial UI changes upstream.
- **References**: Pending PR

## 2025-10-06 — Added structured pages for founder, method, training, and product education
- **What changed**: Introduced dedicated Markdown sources under `content/pages/*/index.md` for the founder story, Method Kapunka, training program, and product education. Registered new Stackbit models so each page is editable in the CMS and wired new React routes/components plus header navigation entries.
- **Impact & follow-up**: Editors can now manage rich narratives, pillar descriptions, curriculum modules, and product guidance as standalone entries. Verify upcoming CMS sessions surface the new collections and that navigation labels remain accurate across locales.
- **References**: Pending PR

## 2025-10-04 — Centralised testimonials and partner logos
- **What changed**: Added dedicated `testimonials` and updated `partners` collections in Decap, introduced reusable testimonial entries with language metadata, and rewired the Clinics/Home pages plus Stackbit bindings to consume relation-selected testimonials and richer partner descriptions.
- **Impact & follow-up**: Editors can now reuse quotes across locales without copy/paste while enriching the “Trusted by clinicians” carousel. Monitor new testimonial entries to confirm relation widgets save the expected `fileRelativePath` values.
- **References**: Pending PR
