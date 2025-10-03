# Decap CMS & Netlify Rolling Log

This log records day-to-day investigations, fixes, and decisions that affect the Decap CMS configuration or Netlify delivery. Use it to understand why a change shipped, what problem it solved, and where to look for deeper context (PRs, commits, and audit docs).

## How to add a new entry
- **Date**: Use ISO format (`YYYY-MM-DD`).
- **Title**: Summarise the change or discovery in a short phrase.
- **What changed**: Explain the update or investigation outcome.
- **Impact & follow-up**: Note whether editors, deploys, or automation were affected and document any TODOs.
- **References**: Link to the relevant PRs/commits and any supporting documents in `docs/`.

---

## 2025-10-03 — Decap CMS factory reset
- **What changed**: Replaced the previous multi-collection Decap configuration with a minimal single-pages schema and removed the bespoke preview bootstrapping script so the CMS loads without legacy tooling.
- **Impact & follow-up**: Editors now start from a blank slate and must rebuild collections before publishing; site runtime and existing content remain untouched.
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
