# Decap CMS & Netlify Rolling Log

## 2025-10-30 — Restored localized Home hero content
- **What changed**: Re-applied the English Home markdown hero showcase copy directly from commit `4f69023` so the supply chain and rituals tiles use the design-approved wording while confirming the Portuguese and Spanish files already matched the same structure.
- **Impact & follow-up**: Ensures the homepage hero module renders with the expected headings and CTAs across locales, keeping the visual editor in sync with the reference layout. Monitor future homepage edits in Decap to make sure the localized markdown stays aligned with the design baseline.
- **References**: Pending PR

## 2025-10-06 — Removed duplicate Home preview path configuration
- **What changed**: Deleted the redundant `preview_path: "/"` from the Home page entry in `admin/config.yml` so the setting is defined only once alongside the rest of the page metadata.
- **Impact & follow-up**: Prevents Decap from flagging a duplicate preview path on load and keeps the Home configuration consistent with other page files. Confirm the CMS continues to resolve the homepage preview correctly after future schema edits.
- **References**: Pending PR

## 2025-10-07 — Added visibility toggles for pages and sections
- **What changed**: Introduced a reusable `visible` toggle in `admin/config.yml` for every page entry and section template, then wired the React loaders (`utils/unifiedPageLoader.ts`, `SectionRenderer`, and page components) to drop sections marked hidden and surface the new page-level visibility flag. Documented the content pipeline audit along the way to confirm unified JSON, Markdown fallbacks, and Stackbit bindings all honor the new field.
- **Impact & follow-up**: Editors can now stage sections or entire pages without deleting content, while the frontend filters hidden entries consistently. Monitor upcoming Decap edits to ensure localized markdown includes the toggle when desired and expand visibility handling to nested list items if editors request finer control.
- **References**: Pending PR

## 2025-10-06 — Consolidated Page Builder locales
- **What changed**: Switched the CMS i18n structure to `multiple_folders` and updated each Page Builder entry in `admin/config.yml` to reference `content/pages/{{locale}}/...` so English, Portuguese, and Spanish copies share a single form per page.
- **Impact & follow-up**: Editors now see one entry per page with locale tabs instead of separate language duplicates, while existing Markdown sources continue to power each locale. Confirm Decap previews resolve the correct locale paths for `/pt` and `/es` after deployment.
- **References**: Pending PR

## 2025-10-06 — Added CMS-managed favicon controls
- **What changed**: Exposed a favicon upload in the Site Configuration SEO group, seeded `content/site.json` with a default SVG icon, and updated the shared `<Seo>` component to emit a Cloudinary-aware `<link rel="icon">` tag.
- **Impact & follow-up**: Editors can now swap the browser tab icon without code changes, and the frontend automatically loads the chosen asset. Confirm the Visual Editor surfaces the new field alongside the existing SEO defaults after the next sync.
- **References**: Pending PR

This log records day-to-day investigations, fixes, and decisions that affect the Decap CMS configuration or Netlify delivery. Use it to understand why a change shipped, what problem it solved, and where to look for deeper context (PRs, commits, and audit docs).

## How to add a new entry
- **Date**: Use ISO format (`YYYY-MM-DD`).
- **Title**: Summarise the change or discovery in a short phrase.
- **What changed**: Explain the update or investigation outcome.
- **Impact & follow-up**: Note whether editors, deploys, or automation were affected and document any TODOs.
- **References**: Link to the relevant PRs/commits and any supporting documents in `docs/`.

---

## 2025-10-24 — Retired unused partner/doctor CMS modules
- **What changed**: Removed the dormant partner carousel and doctor roster from Decap, deleting `content/partners.json`/`content/doctors.json`, pruning the related collections from `admin/config.yml`, Stackbit bindings, and `stackbit.config.ts`, and clearing the leftover `doctorsTitle`/`partnersTitle` fields from page content.
- **Impact & follow-up**: CMS editors no longer see unused groups or fields tied to defunct features, reducing clutter without touching rendered sections. Verify future content audits don't rely on the retired JSON files before purging the unused uploads folder.
- **References**: Pending PR

## 2025-10-23 — Enabled locale fallbacks for page Markdown
- **What changed**: Duplicated every English page Markdown file into the `content/pages/pt` and `content/pages/es` folders with placeholder TODO notes, registered the PT/ES files in `admin/config.yml` using YAML anchors with `i18n: true`, and updated the Home page loader to render structured sections when the English fallback is used.
- **Impact & follow-up**: `/pt` and `/es` routes now render instead of 404ing when translations are missing, and CMS editors can open localized files to replace the placeholder copy. Translate the new Markdown files to Portuguese and Spanish when ready.
- **References**: Pending PR

## 2025-10-22 — Enforced SPA fallback redirect in Netlify config
- **What changed**: Added an explicit `[[redirects]]` rule to `netlify.toml` so Netlify always routes unknown paths to `/index.html`, ensuring the SPA fallback survives even if the `_redirects` artifact is missing.
- **Impact & follow-up**: Prevents localized routes like `/pt` and `/es` from 404ing on preview builds that omit `_redirects`. Confirm subsequent deployments keep the generated `_redirects` file in `dist/`.
- **References**: Pending PR

## 2025-10-21 — Streamlined contact & training editing previews
- **What changed**: Updated `admin/config.yml` so every page builder form renders locale tabs via the new `display: 'tabs'` editor setting and added targeted contact/training preview components plus a shared template loader to reuse site styles.
- **Impact & follow-up**: Editors get consistent language tabs across key pages and live previews for contact/training entries that surface hero copy, contact details, and module sections. Monitor Decap for any console warnings about the targeted templates on load.
- **References**: Pending PR

## 2025-10-18 — Refreshed Contact page schema & Netlify form
- **What changed**: Rebuilt the `/contact` page to load unified page data, added a reusable Netlify-enabled `ContactForm` component, and updated the CMS schema so editors manage hero copy, email, phone, address, and map embeds in one place.
- **Impact & follow-up**: Editors now have dedicated fields for contact details and the rendered page mirrors those updates while keeping a Netlify form fallback. Confirm the Google Maps embed renders correctly across locales and monitor Netlify form submissions after deployment.
- **References**: Pending PR

## 2025-10-17 — Enforced training catalog validation
- **What changed**: Marked the training catalog list in `admin/config.yml` with a minimum entry count and required course title/summaries so editors cannot save empty modules. Updated the TrainingList React component to ignore entries without titles and hide empty summaries/CTAs on the `/training` page.
- **Impact & follow-up**: Prevents blank "Learn more" cards from rendering when placeholder rows exist in Decap. Monitor future catalog imports to ensure they provide both title and summary content.
- **References**: Pending PR

## 2025-10-06 — Restored home layout order and localized PT/ES copy
- **What changed**: Reordered the Home page section array in both the Markdown sources and `content/pages_v2/index.json` so the rendered layout matches the legacy hero → showcase → community → newsletter → product → testimonials flow. Updated the Portuguese and Spanish Markdown front matter for hero copy, carousel text, newsletter CTA, and value props to use localized strings instead of English fallbacks.
- **Impact & follow-up**: `/pt` and `/es` now render with native copy and no longer mis-order the hero-adjacent sections, keeping the CMS editing experience consistent across locales. Monitor future homepage edits to ensure the localized Markdown stays in sync with the unified JSON model.
- **References**: Pending PR

## 2025-10-06 — Added locale fallback loader and seeded placeholder content
- **What changed**: Introduced a shared `loadPage` helper that retries localized Markdown fetches with an automatic English fallback. Updated Home, Learn, Method, Clinics, About, and Training page loaders to surface the resolved locale and added PT/ES placeholder copies (with TODO markers) for the Method Kapunka, Founder Story, Product Education, and Training Program Markdown sources.
- **Impact & follow-up**: Locale-prefixed routes now render even when a translation file is missing, while analytics can track which locale supplied the content. Replace the placeholder Markdown with localized copy once translations are available.
- **References**: Pending PR

## 2025-10-05 — Added Decap tabs to page locale editors
- **What changed**: Enabled the tabbed editor layout for every file in the `pages` collection so translators can switch between English, Portuguese, and Spanish views without scrolling through sequential field groups.
- **Impact & follow-up**: Simplifies copy editing by aligning all page-level forms with the localized section widgets. Verify Decap renders the tabs correctly once deployed and extend the pattern to any new page entries.
- **References**: Pending PR

## 2025-10-05 — Enabled tabbed multilingual editing for pages
- **What changed**: Updated `admin/config.yml` so every page-level field that editors translate now uses locale objects rendered as language tabs. Collapsed the reusable section widgets and rewired section summaries so the English copy previews instead of showing `[object Object]`.
- **Impact & follow-up**: Editors can toggle English, Portuguese, and Spanish copy side-by-side without scrolling, reducing translation errors. Confirm the updated Decap widgets render correctly in staging and adjust any additional collection summaries if future locales are added.
- **References**: Pending PR

## 2025-10-16 — Enabled Netlify contact form submissions
- **What changed**: Wired the `/contact` form to Netlify Forms with the required hidden inputs, honeypot, and encoded POST handler. Updated contact translations to include the studio address and refreshed the site config phone/WhatsApp numbers.
- **Impact & follow-up**: Messages now deliver to Netlify instead of the previous in-memory mock. Confirm the Netlify dashboard lists the new "kapunka-contact" form after deployment and set up notifications if needed.
- **References**: Pending PR

## 2025-10-12 — Realigned nav translations with header IA
- **What changed**: Added the missing navigation keys (For Professionals, Product Education, Clinics, Story) to `content/translations/nav.json` and exposed the matching fields in `admin/config.yml` so editors can localize every header label.
- **Impact & follow-up**: Restores full localization coverage for the live six-item navigation across locales, preventing English fallbacks in Portuguese and Spanish. Confirm Decap saves the new fields and that Visual Editor bindings surface the updated labels when switching languages.
- **References**: Pending PR

## 2025-10-11 — Swapped Decap media library to Cloudinary env placeholders
- **What changed**: Updated `admin/config.yml` to point the Decap media library at Cloudinary with placeholder env references so builds read credentials from Netlify. No runtime keys remain hardcoded in the repo.
- **Impact & follow-up**: Keeps editorial uploads routed through Cloudinary without exposing secrets. Ensure Netlify env vars `CLOUDINARY_BASE_URL` and `NETLIFY_ENV_CLOUDINARY_API_KEY` stay configured across deploy contexts.
- **References**: Pending PR

## 2025-10-10 — Localized site settings refinements
- **What changed**: Updated `admin/config.yml` so brand name, alt text, footer legal copy, social labels, and SEO defaults use explicit locale fields instead of raw maps, added validation patterns for contact links, and introduced descriptive hints to guide editors.
- **Impact & follow-up**: Editors now see one input per language for shared site settings and get immediate validation for contact URLs, reducing content errors in Decap. Monitor upcoming edits to ensure the new patterns do not block legitimate international phone formats.
- **References**: Pending PR

## 2025-10-05 — Retired legacy test page from CMS
- **What changed**: Removed the unused `TestPage` model from `stackbit.config.ts`, dropped the `/test` entry from the unified pages index, and deleted the lone English markdown file so every published page now has matching `en`, `es`, and `pt` sources.
- **Impact & follow-up**: Editors no longer see the orphaned test entry in Decap/Stackbit, eliminating a source of partial translations. Confirm Netlify previews rebuild without referencing the retired slug and watch for any lingering `/test` links in future content audits.
- **References**: Pending PR

## 2025-10-09 — Added manifesto content model for Story page
- **What changed**: Extended `admin/config.yml` with dedicated fields for the Story/Manifesto page (hero text, manifesto statements, values grid, and closing copy), translated the new UI strings, and rewrote the localized `content/pages/*/story.md` entries to match the schema.
- **Impact & follow-up**: Editors can now manage the manifesto narrative and value pillars directly from Decap and the Visual Editor. Monitor upcoming edits to ensure the new list and markdown fields save correctly across locales.
- **References**: Pending PR

## 2025-10-08 — Refactored Decap previews to use site components
- **What changed**: Updated `admin/cms.js` to dynamically import shared preview components, switched page previews to render the same hero and section React elements used on the live site, and registered the global Tailwind CSS bundle so previews mirror production styling.
- **Impact & follow-up**: Editors now get richer, more accurate previews for localized pages without manually duplicating markup. Monitor Decap for any module loading errors in older browsers and confirm additional page types render correctly via the new generic fallback.
- **References**: Pending PR

## 2025-10-07 — Switched Decap media library to Cloudinary
- **What changed**: Pointed `admin/config.yml` at Cloudinary via the `media_library` block, updated the global media/public folders to `/uploads`, and documented that the API secret must be supplied through the `CLOUDINARY_API_SECRET` environment variable.
- **Impact & follow-up**: Editors now browse Cloudinary assets from the media picker while existing uploads keep their URLs. Confirm the secret is added to Netlify before enabling production edits.
- **References**: Pending PR

## 2025-10-06 — Clarified CMS field guidance & reusable sections
- **What changed**: Expanded `admin/config.yml` with reusable hero/section anchors, converted relation and list fields to include descriptive hints with character limits, and ensured multilingual inputs are surfaced per locale across site, page, and translation collections.
- **Impact & follow-up**: Editors now see consistent instructions when updating content, reducing guesswork around limits and localization. Monitor Decap UI to confirm the new hints render cleanly in nested objects and adjust copy if any fields remain ambiguous.
- **References**: Pending PR

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

## 2025-10-06 — Normalized CMS image references for Cloudinary delivery
- **What changed**: Replaced legacy `/content/uploads/...` paths across product, article, and page content entries with Cloudinary public IDs. Updated the shared `getCloudinaryUrl` helper to strip historic upload prefixes and fall back to runtime environment variables exposed by Vite.
- **Impact & follow-up**: Ensures Visual Editor previews and the live site load media from Cloudinary regardless of locale or section source. Monitor upcoming CMS edits for any new `/content/uploads/` paths that may need automatic normalization.
- **References**: Pending PR

## 2025-10-06 — Added simplified For Clinics hero and section overrides
- **What changed**: Introduced a new `pages/for-clinics.tsx` layout that pulls meta, hero, and section copy from translations with Markdown overrides. Added `heroTitle`/`heroSubtitle` fields to the clinics Markdown entries plus matching translation keys, and exposed the hero controls in `admin/config.yml` so editors can manage the new page.
- **Impact & follow-up**: The For Clinics experience now loads faster with a streamlined hero and curated sections while remaining fully editable in the Visual Editor and Decap. Verify Stackbit bindings continue to resolve correctly when switching locales in the Visual Editor.
- **References**: Pending PR

## 2025-10-07 — Added localized page loader fallback to English
- **What changed**: Updated `src/lib/content.ts` so localized Markdown/JSON requests retry with the English slug when the locale-specific file is missing or empty, preventing hard failures in the Visual Editor.
- **Impact & follow-up**: Ensures editors always see the English baseline when localized files have not been authored yet. Monitor future localized page additions to confirm they return localized content once present.
- **References**: Pending PR

## 2025-10-07 — Synced pt/es home content to English baseline
- **What changed**: Copied the updated `content/pages/en/home.md` structure into the Portuguese and Spanish Markdown sources so they match the fields expected by the page loader.
- **Impact & follow-up**: Prevents 404s when localized entries are incomplete by ensuring the Visual Editor and runtime can fall back to English copy until translations are ready.
- **References**: Pending PR
