# Decap CMS & Netlify Rolling Log

## 2025-10-09 — Migrated Tailwind to the build pipeline
- **What changed**: Installed Tailwind + PostCSS tooling, added a project-wide config that mirrors the previous CDN overrides, created entry CSS for the app/admin, and wired the Netlify prebuild step to emit `/public/styles/globals.css` for CMS previews instead of loading Tailwind from the CDN.
- **Impact & follow-up**: Removes the runtime CDN dependency while keeping CMS previews styled with the same utility classes as production. Re-run `npm run tailwind:preview` whenever Tailwind directives change outside of `npm run build` to refresh the admin stylesheet.
- **References**: Pending PR

## 2025-10-11 — Hardened runtime error telemetry
- **What changed**: Replaced the ad-hoc `log-error` handler with an ESM Netlify Function that enforces `application/json` POST payloads and timestamps each `[client-error]` entry, rebuilt the guarded browser logger around `initLogger()`, and moved CMS analytics behind a `CMS_ANALYTICS_ENABLED` flag so production traffic never triggers Decap-only metrics.
- **Impact & follow-up**: Keeps production noise out of the admin telemetry stream while giving ops a single Netlify Function log to inspect runtime crashes. Toggle `ENABLE_LOGGER` in Netlify when deeper debugging is required and watch for any backlog of cms analytics requests once re-enabled inside the admin bundle.
- **References**: Pending PR

## 2025-10-10 — Added client error logging pipeline
- **What changed**: Created a `log-error` Netlify Function that accepts JSON payloads from the browser and emits `[client-error]` entries, plus a guarded Vite client logger that posts fatal errors only when `ENABLE_LOGGER=true`.
- **Impact & follow-up**: Enables on-demand tracing of production crashes directly from Netlify Function logs without bloating the bundle when the flag is disabled. Monitor log volume once enabled and consider batching if traffic grows.
- **References**: Pending PR

## 2025-10-10 — Removed legacy Visual Editor maintenance scripts
- **What changed**: Deleted the unused `scripts/remove-image-ref.mjs` and `scripts/syncMetadataPages.js` helpers and scrubbed contributor docs of the obsolete metadata regeneration workflow now that the Visual Editor has been fully retired.
- **Impact & follow-up**: Eliminates dead tooling that referenced `metadata.json` and `.netlify/visual-editor/**`, reducing confusion for contributors. Future schema changes only need updates under `content/**` plus the Decap config.
- **References**: Pending PR

## 2025-10-09 — Retired Netlify Visual Editor integration
- **What changed**: Removed the Netlify Visual Editor plugin, deleted the Stackbit config/metadata files, and stopped copying `.netlify/visual-editor/**` during postbuild. Replaced the legacy `fetchVisualEditorJson`/`fetchVisualEditorMarkdown` helpers with `fetchContentJson`/`fetchContentMarkdown`, simplified `loadUnifiedPage` to read only from `/content/pages_v2`, and updated every page loader to drop Visual Editor source flags.
- **Impact & follow-up**: The app now fetches content exclusively from the canonical Decap JSON/Markdown files, eliminating the extra mirror and the runtime detection logic that had been causing 404s and locale instability. Monitor future CMS edits to ensure the simplified loaders continue to resolve localized fallbacks correctly.
- **References**: Pending PR

## 2025-10-08 — Eliminated /.netlify 404s by aliasing Visual Editor mirrors
- **What changed**: Added a production-safe mirror of `.netlify/visual-editor` under `dist/visual-editor`, taught the JSON loaders to prioritize that alias when the Visual Editor runtime is absent, and centralised the mirror prefix detection in `utils/visualEditorEnvironment.ts`.
- **Impact & follow-up**: Removes the persistent 404s for `/.netlify/visual-editor/...` in production while preserving live editing by automatically preferring the real Visual Editor mirrors whenever the editor is active. Confirm future content loaders use the shared prefix helper to stay consistent.
- **References**: Pending PR

## 2025-10-08 — Fixed locale routing regression
- **What changed**: Updated `LocalizedLayout` in `App.tsx` to read the active locale from the pathname via `getLocaleFromPath`, short-circuit unsupported locale params, and stop the default-language branch from resetting translated routes back to `/`.
- **Impact & follow-up**: Portuguese and Spanish URLs keep their `/pt` and `/es` prefixes, allowing localized copy to load without flashing to English or tripping the Visual Editor fetch probes. Audit remaining navigation links for hard-coded paths that may need `buildLocalizedPath`.
- **References**: Pending PR

## 2025-10-08 — Home now loads unified page data only
- **What changed**: Refactored `pages/Home.tsx` to fetch homepage content via `loadUnifiedPage('home')`, removed the legacy Markdown loader and bespoke section renderers, and leaned on `SectionRenderer` plus existing shared components for structured blocks. Follow-up pass dropped the old clinics/gallery/bestseller/review widgets so only unified sections render the page. Ran `npm run build` to confirm the unified pipeline compiles cleanly.
- **Impact & follow-up**: The homepage now reflects edits made in `content/pages_v2/index.json` immediately, eliminating the drift between JSON and Markdown sources while trimming redundant rendering paths. Next steps are auditing remaining scripts that still copy legacy Markdown so we can retire those build steps.
- **References**: Pending PR

## 2025-10-08 — Patched unified homepage media grid regressions
- **What changed**: Fixed the new `MediaShowcase` section renderer by restoring its layout classnames and teaching `normalizeImagePath` to resolve `shared/` assets to `/content/uploads/*`, so Cloudinary helpers stop outputting broken `/content/en/uploads/shared/*` paths. Verified the build via `npm run build`.
- **Impact & follow-up**: The homepage now renders again instead of throwing `articleClasses is not defined`, and gallery items load their imagery rather than 404s. Keep tightening section components for any other Markdown-era assumptions before removing the legacy loaders from secondary pages.
- **References**: Pending PR

## 2025-10-08 — Simplified section field bindings
- **What changed**: Removed redundant nested Stackbit bindings from the `Bullets` and `Specialties` section components so list items expose a single editable target, and backfilled the unified home JSON with missing English/Portuguese/Spanish strings for the product and feature grids. Ran `npm run build` to confirm the shared sections still compile in the unified pipeline.
- **Impact & follow-up**: Prevents duplicate field overlays in the Visual Editor and keeps the unified section components aligned with the new JSON source while ensuring each locale renders native copy. Continue auditing remaining section widgets before we retire the Markdown fallbacks across the other pages.
- **References**: Pending PR

## 2025-10-08 — Hardened Visual Editor fallbacks for static deploys
- **What changed**: Updated `scripts/postbuild.js` to mirror `content/` into `site/content/`, copy both `site/` and `.netlify/visual-editor/` into `dist/`, and added static-asset fallbacks to `fetchVisualEditorJson` plus `loadUnifiedPage` (using `import.meta.url`) so hashed JSON assets resolve when network mirrors fail. Ran `npm run build` to verify the new copy steps and fallbacks execute.
- **Impact & follow-up**: Portuguese and Spanish pages no longer crash when the Visual Editor probes `/site/content` or `/.netlify/visual-editor` before landing on the canonical `/content` data. Keep an eye on the remaining markdown-dependent pages while migrating them to the unified loader.
- **References**: Pending PR

## 2025-10-08 — Refined hero media layout
- **What changed**: Flattened the homepage hero’s side-by-side layout so supporting imagery stretches edge-to-edge and reworked the Media Showcase grid to match the art-direction reference (full-bleed mosaic, zero gutters, stacked copy overlay). Ran `npm run build` to confirm the updated layout compiles cleanly.
- **Impact & follow-up**: The hero now mirrors the reference proportions with left-aligned copy, and the showcase montage beneath it reads as a continuous strip without padding. Keep monitoring other homepage sections for lingering legacy spacing.
- **References**: Pending PR

## 2025-10-08 — Removed Visual Editor runtime hooks
- **What changed**: Simplified the Stackbit integration to no-ops: stripped the React runtime patching in `index.tsx`, removed the annotation helpers/runtime detection, collapsed `useVisualEditorSync` to a static provider, and rewrote the Stackbit binding utilities to return empty attributes. Also slimmed the Markdown loader to fetch directly from `/content/**` with static fallbacks. Ran `npm run build` to confirm the CMS-only flow works.
- **Impact & follow-up**: The app no longer loads or patches any Visual Editor code paths, cutting unnecessary runtime fetches and stabilising locale routing. Keep migrating the remaining markdown loaders to unified JSON as content allows.
- **References**: Pending PR
## 2025-10-07 — Simplified Decap editing UX
- **What changed**: Added locale-specific editing toggles to `admin/cms.js` so editors can focus on a single language at a time, introduced smart fallback hints for localized fields, exposed new CTA toggle defaults, and published reusable section templates via the `sectionTemplates` collection with starter JSON blocks.
- **Impact & follow-up**: Content designers can now work in English-first mode and reveal additional locales on demand while relying on ready-made section blueprints for frequent layouts. Gather feedback on additional templates that would speed up campaign builds and consider migrating legacy sections to the new CTA controls over time.
- **References**: Pending PR

## 2025-10-07 — Restored Page Builder data bindings
- **What changed**: Realigned the Page Builder schema in `admin/config.yml` with the existing Markdown frontmatter, replacing the stale localized fieldsets with per-page fields (`heroHeadline`, `heroAlignment`, `sections`, etc.) and redefining every section type to use simple strings/lists that mirror the live site.
- **Impact & follow-up**: Editors now see the real content (hero copy, section data, carousel entries) instead of empty localized objects, eliminating the red validation errors and ensuring Decap matches the production pages. Verify each page in the CMS to confirm the new forms load existing data and report any additional section shapes that still feel off.
- **References**: Pending PR

## 2025-10-07 — Added editorial focus modes & audit tooling
- **What changed**: Introduced beginner/advanced editing modes in `admin/cms.js` that hide power-user fields by default, added inline “Advanced” badges, tightened required metadata on Learn/Method/Clinics/Story/Contact pages, and published `scripts/audit-translations.mjs` to flag missing localized meta copy.
- **Impact & follow-up**: Editors get a calmer Page Builder with progressive disclosure, while advanced users can flip a toggle to access layout controls. Run `node scripts/audit-translations.mjs` in CI or locally to keep EN/PT/ES metadata aligned and extend the advanced-field list if new power settings appear.
- **References**: Pending PR

## 2025-10-07 — Modularized Decap config & added caching
- **What changed**: Split the Decap YAML into `admin/config-modules/anchors.yaml` + `main.yaml`, introduced `scripts/build-decap-config.mjs` to stitch and validate the final `config.yml`, enforced lazy loading on heavy collections, and memoized Visual Editor markdown/preview images for faster editing.
- **Impact & follow-up**: Config edits are now composable with validation catching duplicate collections or missing lazy flags before publish, while editors see quicker previews thanks to caching. Run `npm run cms:build` whenever modules change (automatically via `prebuild`) and clear caches with `clearVisualEditorMarkdownCache()` if you add new content at runtime.
- **References**: Pending PR

## 2025-10-07 — Cloudinary credentials sourced from env
- **What changed**: Updated `admin/config-modules/main.yaml` so Decap’s Cloudinary media library reads `CLOUDINARY_CLOUD_NAME` and `NETLIFY_ENV_CLOUDINARY_API_KEY` from Netlify environment variables instead of hard-coded values.
- **Impact & follow-up**: Keeps local, preview, and production deployments aligned on the same media account. Verify both environment variables are defined in Netlify (and `.env` locally) before editing assets.
- **References**: Pending PR

## 2025-10-07 — Restored Home CMS bindings & hero alignment
- **What changed**: Marked `sections` as non-i18n so Decap reads the actual Markdown sections, and adjusted `pages/Home.tsx` hero layout logic so left/right alignment respects the CMS settings even with full-bleed imagery.
- **Impact & follow-up**: The Page Builder now lists the existing home sections instead of showing an empty array, and hero content aligns left/middle/right exactly as configured. Revisit other pages to confirm they no longer expose unnecessary locale tabs for shared sections.
- **References**: Pending PR

## 2025-10-07 — Re-enabled localized home sections & forced local rendering
- **What changed**: Restored the `sections` field to use Decap’s locale-aware editing, relaxed the home loader so structured sections render even without a hero block, and reinstated `mediaShowcase` in the allowed section filter.
- **Impact & follow-up**: The homepage now shows the full Media Showcase and Community Carousel stacks again, and editors can translate per-locale sections without data loss. Confirm the CMS still resolves the section arrays for EN/PT/ES as expected.
- **References**: Pending PR

## 2025-10-07 — Restored Cloudinary previews in Decap
- **What changed**: Added a Cloudinary-aware image resolver inside `admin/preview-components.js` so preview thumbnails pull the CMS cloud name, strip legacy upload prefixes, and render full CDN URLs rather than broken relative paths.
- **Impact & follow-up**: Editors now see the same media framing in the CMS as on the live site while keeping the API key sourced from the `NETLIFY_ENV_CLOUDINARY_API_KEY` Netlify environment variable instead of committing secrets. Confirm the env var remains set in each Netlify context and provide a local `.env` when running the CMS locally.
- **References**: Pending PR

## 2025-10-07 — Consolidated Decap collections for editors
- **What changed**: Grouped the CMS collections into six `collection_groups` (Site Settings, Page Builder, Assets & Media, Translations, Products, Blog Posts), aligned each collection’s `group` label, surfaced the catalog/policy libraries that were previously hidden, and renamed a few panels for plain-language clarity (e.g. Blog Posts, Product Reviews, Video Library).
- **Impact & follow-up**: Editors now see a cleaner left rail with predictable categories and no hidden catalog entries, reducing the cognitive load when jumping between assets, products, and long-form pages. Monitor first editing sessions to confirm the new grouping matches editorial workflows and note any categories that still feel overloaded.
- **References**: Pending PR

## 2025-10-18 — Updated Cloudinary credentials for Decap
- **What changed**: Replaced the placeholder Cloudinary cloud name with `du6xl727e` in `admin/config.yml` and wired `NETLIFY_ENV_CLOUDINARY_API_KEY` plus the `CLOUDINARY_BASE_URL` delivery root into `netlify.toml` so the build, Visual Editor, and Decap UI read the real account settings.
- **Impact & follow-up**: Editors can now upload assets through the Cloudinary media library without configuration warnings, while the site references a single Cloudinary base URL for asset delivery. Confirm Netlify’s environment variable screen reflects the API key and that Decap connects to Cloudinary successfully after deployment.
- **References**: Pending PR

## 2025-10-18 — Enabled Cloudinary optimization & focal points
- **What changed**: Added default Cloudinary transformations (`f_auto`, `q_auto`, `dpr_auto`) to the delivery helper and Cloudinary media library config so uploads are auto-optimized, introduced reusable focal point fields in `admin/config.yml`, and updated section components (timeline, media copy, carousel, showcase, image grid, image split) to respect the new focal metadata via `object-position`.
- **Impact & follow-up**: Editors can now dial in focal points per asset and see that focus honored on the frontend while optimized Cloudinary URLs keep payloads lean. Encourage content editors to populate focal values for legacy media that currently crops awkwardly.
- **References**: Pending PR

## 2025-10-18 — Seeded focal metadata for homepage assets
- **What changed**: Backfilled representative focal coordinates for the homepage media showcase cards and community carousel slides across EN/ES/PT markdown so the new cropping controls have sensible defaults.
- **Impact & follow-up**: Critical above-the-fold imagery now respects intentional framing out-of-the-box, reducing manual editor work for the most visible assets. Continue reviewing other pages to flag images that still need focal tuning.
- **References**: Pending PR

## 2025-10-18 — Streamlined catalog editing experience
- **What changed**: Promoted the Products and Articles collections (now under “Catalog”), collapsed high-noise groups, replaced repeated locale objects with shared anchors, and exposed multi-use tips. Added dedicated preview templates, switched the large collections to lazy loading, centralised product/article fieldsets, and applied the same anchor/lazy pattern to Courses, Videos, and Training catalogs.
- **Impact & follow-up**: Editors can locate catalog content without digging into legacy groups, update copy with fewer nested tabs, and visualise product/article changes before publishing while reducing initial CMS load time. Review additional legacy collections to see if similar simplifications are warranted.

## 2025-10-18 — Added editorial workflow helpers
- **What changed**: Introduced reusable `status` and `scheduling` anchors across page files and catalog items, enabling publish/unpublish windows inside Decap. Added scripts `scripts/bulk-update-status.mjs` for bulk status/scheduling updates and `scripts/create-page-from-template.mjs` with a reusable `content/templates/page-default.md` starter for rapid page creation.
- **Impact & follow-up**: Editors can coordinate workflow states directly in the CMS, schedule go-live dates without manual deploy timing, batch-update large catalogs from the CLI, and spin up consistent new pages faster. Consider adding additional templates for campaign-specific layouts as the component library grows.
- **References**: Pending PR

## 2025-10-18 — Instrumented CMS analytics & audit tooling
- **What changed**: Added Netlify function `cms-analytics` with Decap event hooks (save/delete/publish) and global error tracking inside `admin/cms.js`, plus offline queue flushing. Introduced CLI scripts `scripts/generate-content-audit.mjs` and JSON output `analytics/content-audit.json` to snapshot entry status/scheduling across pages and catalogs.
- **Impact & follow-up**: Maintainers can monitor editor behavior, capture runtime errors, and produce compliance-friendly audit trails without manual spreadsheet work. Review Netlify function logs periodically and expand audit reporting if additional metadata (e.g. approver) is required.
- **References**: Pending PR

## 2025-10-31 — Expanded section renderer coverage
- **What changed**: Added strongly typed models for every Stackbit builder block in `types.ts`, introduced reusable section components (media copy, feature grid, banner, newsletter, product grid, testimonials, facts, bullets, specialties), and updated `SectionRenderer` plus the story/about/training/videos page loaders to recognise the new variants with proper Visual Editor field bindings.
- **Impact & follow-up**: Visual Editor sections now render consistently across detail pages and inline editing works for the newly supported blocks, reducing manual QA when editors add builder sections. Monitor upcoming content syncs to confirm product grids resolve product references correctly.
- **References**: Pending PR

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

## 2025-10-07 — Wired Clinics page to unified sections and hero fields
- **What changed**: Updated `pages/for-clinics.tsx` to render the new builder-driven sections via `SectionRenderer`, pulling hero and CTA copy from the unified hero/fields data exposed by `loadClinicsPageContent`. Trimmed the legacy Markdown-era fields and refreshed Stackbit bindings so edits map to `site.content.<locale>.pages.clinics.*`.
- **Impact & follow-up**: Clinics editors now manage a single section list across locales in the Visual Editor, and hero/CTA strings stay in sync with builder data. Verify Stackbit shows the section blocks under `pages.clinics` in each locale and that hero CTA links resolve correctly after publish.
- **References**: Pending PR

## 2025-10-07 — Stabilized Home page bindings
- **What changed**: Refactored `pages/Home.tsx` to pull language context into clinics CTAs, inject fallback gallery alt text, align Stackbit field path bindings for media copy, and harden testimonials/media showcase loaders with stricter typing so the Visual Editor and runtime agree on section data.
- **Impact & follow-up**: Home sections now compile without TypeScript failures and the Visual Editor maps edits back to the unified content schema, reducing broken bindings when editors adjust hero, gallery, or testimonial blocks. Re-run localized page syncs once outstanding content model fixes land to keep schemas aligned.
- **References**: Pending PR

## 2025-10-07 — Harmonized Home section typing
- **What changed**: Tightened the Home page section filters to use explicit type guards, ensuring only builder-backed blocks enter the render pipeline, and coerced media showcase entries to the shared `MediaShowcaseSectionContent` shape so the Visual Editor annotations resolve correctly.
- **Impact & follow-up**: TypeScript now compiles without treating legacy timeline blocks as hero data, and media showcases surface consistent bindings inside Stackbit. Confirm upcoming schema cleanup removes deprecated section variants so the guard list stays authoritative.
- **References**: Pending PR

## 2025-10-07 — Unified Home content source
- **What changed**: Updated `pages/Home.tsx` to prefer the unified `pages_v2` loader before falling back to legacy Markdown, reusing the shared schema parser so both Decap and the Visual Editor hydrate from the same JSON index.
- **Impact & follow-up**: Home now pulls from the single authoritative content graph, eliminating drift between Visual Editor edits and runtime data. Monitor remaining legacy Markdown files and plan removals once all sections are migrated.
- **References**: Pending PR

## 2025-10-07 — Switched Decap media library to Netlify
- **What changed**: Updated `admin/config.yml` so Decap CMS now uses Netlify’s media library instead of the placeholder Cloudinary setup that blocked uploads.
- **Impact & follow-up**: Editors can resume uploading images without configuring Cloudinary credentials. Keep the previous Cloudinary helper code for frontend delivery; revisit once unified credentials are available.
- **References**: Pending PR

## 2025-10-07 — Synced Visual Editor cache with canonical content
- **What changed**: Ran `npm run visual:prepare` and the full `npm run build` pipeline so the Visual Editor mirror under `.netlify/visual-editor/content/pages_v2/` now matches `content/pages_v2/index.json` byte-for-byte.
- **Impact & follow-up**: The unified loader and Visual Editor both read the same `pages_v2` data, eliminating the stale cache that hid recent updates. Re-run the sync whenever content is edited outside the editor to keep caches aligned.
- **References**: Pending PR

## 2025-10-07 — Propagated admin config via postbuild
- **What changed**: Confirmed the `scripts/postbuild.js` step now copies the corrected `/admin/config.yml` into `dist/admin/` and `site/admin/config.yml`, keeping all admin surfaces in sync.
- **Impact & follow-up**: Eliminates drift between duplicated Decap configs; future updates only need to touch `admin/config.yml` before running the build pipeline.
- **References**: Pending PR

## 2025-10-07 — Restored legacy Home layout
- **What changed**: Reverted `pages/Home.tsx` to the stable implementation used before the recent schema experiments so the hero, media rows, and testimonials render as designed.
- **Impact & follow-up**: The homepage regains its expected structure while we reassess how to migrate to unified content without breaking layout. Future schema work should happen behind feature flags to avoid regressions.
- **References**: Pending PR

## 2025-10-09 — Restored localized markdown loaders
- **What changed**: Added a reusable `loadLocalizedMarkdown` helper and updated the Method Kapunka, Product Education, Founder Story, Training Program, and Training pages to request locale-specific Markdown with automatic English fallback. Dynamic `data-sb-object-id` values now reflect the resolved locale so Visual Editor bindings stay accurate.
- **Impact & follow-up**: Spanish and Portuguese routes once again hydrate fresh content instead of sticking to the English copy. Keep migrating remaining Markdown-backed pages to the helper to prevent future localization drift.
- **References**: Pending PR

## 2025-10-07 — Mapped unified hero data to legacy layout
- **What changed**: Updated `pages/Home.tsx` to translate the new `hero` schema (localized headings, CTAs, layout hints) into the legacy rendering fields so the homepage hero and marquee blocks load again.
- **Impact & follow-up**: Restores the full hero experience with overlay image, dual CTAs, and alignment controls matching the design in production. Continue aligning remaining sections before re-enabling unified-only loading.
- **References**: Pending PR

## 2025-10-07 — Reverted Home page to pre-unified layout
- **What changed**: Restored `pages/Home.tsx` from commit 7871f64 (before the unified content experiments) so the hero, media showcase grid, carousel, newsletter, bestsellers, and testimonials render exactly like the reference design.
- **Impact & follow-up**: The homepage now matches the original layout; future unified-content work must ship behind toggles to prevent layout regressions. Update the new schema to align with this implementation before reattempting migration.
- **References**: Pending PR

## 2025-10-07 — Adapted unified hero schema to legacy renderer
- **What changed**: `pages/Home.tsx` now reads the new `hero.content`, `hero.ctas`, and `hero.layout` fields from `pages_v2` and maps them to the legacy hero alignment, overlay, and CTA props so the hero matches the intended design again.
- **Impact & follow-up**: Restores left-aligned hero copy, dual CTAs, and overlay treatment without regressing the rest of the homepage. Continue validating other sections against the unified schema before re-enabling full migration.
- **References**: Pending PR

## 2025-10-07 — Patched Home TS typings for legacy layout
- **What changed**: Added localized helpers, restored `VisibilityFlag` typing, and mapped the unified hero/layout schema back into the legacy `Home.tsx`. This clears the IDE TypeScript errors (missing `language`, `computedTitle`, CTA generics, etc.) while keeping the classic design.
- **Impact & follow-up**: Dev tooling stops flagging the Home page, and the hero + media sections stay editable through the Visual Editor. Continue migrating remaining sections cautiously to avoid reintroducing type mismatches.
- **References**: Pending PR

## 2025-10-07 — Reverted Home.tsx to legacy layout baseline
- **What changed**: Checked out the pre-unified `pages/Home.tsx` (commit 13f87fe) so the hero, media grid, carousel, newsletter, and testimonials match the original reference screenshot exactly.
- **Impact & follow-up**: Restores the homepage experience while we re-evaluate the unified schema rollout. Ensure future refactors preserve this layout before merging.
- **References**: Pending PR

## 2025-10-07 — Rebuilt hero as full-bleed overlay
- **What changed**: Tweaked `pages/Home.tsx` so the hero renders as a full-width background image with a left-aligned gradient overlay and updated CTA styling, matching the art direction you shared.
- **Impact & follow-up**: The hero now mirrors the “Be thankful to your skin” layout with crisp text contrast and correct button treatments. Confirm imagery still resolves from the CMS and adjust translations if copy changes.
- **References**: Pending PR

## 2025-10-08 — Aligned hero layout data across CMS sources
- **What changed**: Updated `content/pages_v2/index.json` and the locale Markdown front matter to set `alignX: left`, `textAnchor: bottom-left`, `overlay: strong`, and `layoutHint: image-full`, then ran `npm run visual:prepare` and `npm run build` to sync the Visual Editor cache.
- **Impact & follow-up**: The homepage hero now consistently positions copy on the left with the full hero image visible across builds. Continue editing hero alignment in `pages_v2` to keep all environments synchronized.
- **References**: Pending PR

## 2025-10-08 — Disabled legacy hero duplication
- **What changed**: Updated `pages/Home.tsx` to skip rendering hero blocks from legacy section lists so the page relies solely on the new full-bleed hero implementation.
- **Impact & follow-up**: Prevents legacy section data from overriding the hero layout, eliminating the conflicting render path while we continue the broader content-source cleanup.
- **References**: Pending PR
