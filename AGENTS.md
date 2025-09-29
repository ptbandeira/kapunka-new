# AGENTS.md

## Read me first
- This document guides autonomous coding agents.
- Golden rule: DO NOT modify the site’s “spine” (navigation, header/footer, layout grids, section renderer contracts). Prefer CMS-driven content additions.
- Any new content must be editable in Decap and visible in Netlify Visual Editor.

## Project overview
- Framework: Vite-powered React single-page app (HashRouter + React Router DOM routes).
- Language: TypeScript across app, contexts, and pages (`tsconfig.json`).
- Styling: Tailwind CSS via CDN with inline config in `index.html`.
- CMS: Decap (Netlify Identity + Git Gateway) at `/admin`.
- Content roots: `content/**` (including `content/pages/{en,es,pt}`, `content/products`, `content/articles`, `content/translations`, etc.) and Visual Editor mirror data in `site/content`.
- Deployment: Netlify (see `netlify.toml`).
- Routing: Hash-based React Router defined in `App.tsx`.

## Repo map (key folders/files)
- App code: `index.tsx`, `App.tsx`, page routes under `pages/`, shared UI in `components/`, contexts in `contexts/`.
- CMS admin: `admin/config.yml` (Decap schema) and `admin/index.html`.
- Content: `content/` JSON (pages per locale, catalog data, translations, uploads), `site/content/` (Visual Editor metadata content), `metadata.json` (Stackbit model map).
- Section renderer: `components/SectionRenderer.tsx` plus section components like `components/TimelineSection.tsx` and any matching `components/sections/*` you add.
- Styles/Tailwind: CDN config script inside `index.html`; no standalone Tailwind config file.
- Build/deploy config: `netlify.toml` (build command, publish dir, Visual Editor plugin) and `stackbit.config.{js,mjs}` (Visual Editor/Stackbit mapping).
- Scripts: `scripts/postbuild.js` (copies `content/` and `admin/` into `dist/`).

## Dev environment
- Node: 20.x (per `netlify.toml` `[build.environment] NODE_VERSION = "20"`).
- Package manager: npm (`package-lock.json`).
- Install: `npm install`.
- Dev server: `npm run dev` (Vite on port 5173; Netlify Visual Editor expects this).
- Build: `npm run build` (runs Vite build then `scripts/postbuild.js`).
- Preview: `npm run preview` (serves Vite preview).
- Environment variables: `GEMINI_API_KEY` (surface via Vite define). Do **not** commit secrets; use `.env.local`.
- Netlify Identity/Git Gateway: Enabled through Netlify dashboard; Decap backend configured in `admin/config.yml`.

## Build & test commands
- Lint: none configured (add only if requested; no npm script available).
- Format: none configured.
- Type check: none configured beyond Vite/TS defaults (no dedicated script).
- Unit tests: none configured.
- CI: No GitHub Actions workflows present.

## UI/UX invariants (DO NOT change)
- Keep header, footer, nav, cart drawer, and global spacing rhythm exactly as implemented.
- Preserve section component contracts and keys used by Visual Editor/Stackbit metadata.
- Maintain existing animation timings/easing (see `App.tsx` page transitions, Framer Motion usage).
- Uphold accessibility: respect semantic structure, focus states, and color contrast.

## Content & CMS contract
- All new content must flow through Decap schemas and JSON content under `content/` (mirrored to `site/content/` for Visual Editor).
- When adding fields: append optional keys; never rename/remove existing keys or reorder section identifiers.
- For images/videos: expose upload widgets in `admin/config.yml` pointing to `content/uploads`. Avoid hard-coded external URLs.
- i18n: Provide `en`, `es`, and `pt` values for every new text field (match existing JSON structure).
- Learn/Blog: ensure entries include `category`, `summary`, `faq[]`, and `featuredProducts[]` arrays when extending content.
- Product pages: continue supporting `originStory`, `scientificEvidence`, `multiUseTips`, `faqs[]`, `goodToKnow[]` fields (extend via optional additions only).
- Policies: keep locale-specific markdown blocks editable via CMS.

## Section patterns
- To add a new visual section (SplitHero, ImageTextHalf, ImageGrid, VideoGallery, TrainingList, etc.):
  1. Define a new section type in `admin/config.yml` with localized fields and optional media uploads.
  2. Create the matching component under `components/sections/<Name>.tsx` (keep prop contracts typed via `types.ts`).
  3. Register it in `components/SectionRenderer.tsx` without altering existing switch/case names.
  4. Insert the section into the relevant page JSON (all locales) with empty or placeholder CMS-managed assets.

## Colour & theme tokens
- Tailwind/theme tokens live in the inline `tailwind.config` block inside `index.html`.
- Suggested additions (use sparingly; add via `tailwind.config` extension and CMS toggles):
  - `dark-primary`: #262626
  - `warm-beige`: #F4EDE4
  - `accent-brown`: #8B5E3C
- Do not rename existing palette values; only extend.
- Background variants should remain CMS-driven via boolean/enum flags (e.g., `bgVariant: light|dark|beige`).

## Media handling
- Provide CMS upload fields for any new imagery or video posters.
- Use existing responsive image components/utilities; lazy-load assets below the fold.
- Keep file sizes optimized; no autogenerated imagery.

## SEO & metadata
- Ensure each page JSON maintains `metaTitle` and `metaDescription` per locale.
- Add FAQ schema markup only when a populated `faq[]` array exists.
- Include descriptive, localized `alt` text fields in CMS for every image.

## Performance & accessibility
- Avoid heavy client libraries or blocking scripts without explicit approval.
- Prevent layout shifts: reserve image dimensions, respect skeleton loaders where present.
- Validate contrast ratios and keyboard focus when adjusting styles/content.

## Security & privacy
- Never commit secrets; rely on Netlify environment variables.
- Respect GDPR: keep cookie consent (`components/CookieConsent.tsx`) and privacy policy content intact.

## Testing instructions
- No automated lint/test/typecheck scripts exist yet. Run `npm run build` to ensure compilation succeeds before PR.

## Lint-critical coding rules
- Memoize JSX event handlers with `useCallback` (or pull them outside the component) instead of passing inline arrow functions or `.bind` usages.
- Do not rely on the `void` operator to silence unresolved promises. Call the async function and handle failures explicitly.
- Generate React `key` props from deterministic data (ids, slugs, stable content). Array indices or position-based keys are not allowed.
- Avoid the `any` type. Keep data as `unknown` until you narrow it with type guards or validated schemas.

## PR & commit guidelines
- Branch naming: `feature/*`, `fix/*`, `content/*`, `docs/*`.
- Commit messages: follow Conventional Commits (e.g., `content: add es/PT translations for home hero`).
- Before opening PR: run `npm run build` and review CMS JSON for locale completeness.
- PR checklist: confirm i18n coverage, Visual Editor bindings intact, no core UI/UX spine changes, document new CMS fields.

## Large monorepo / subprojects (optional)
- `site/` holds Visual Editor scaffolding (`site/content`). Follow root rules; ensure any updates stay in sync with primary `content/`.

## Known gotchas
- Visual Editor breaks if section keys or ordering change—additions only.
- Do not modify Netlify paths or ports in `netlify.toml` without coordinated deployment updates.
- Keep `metadata.json`, `stackbit.config.js`, and `scripts/postbuild.js` aligned with CMS schema changes.

## Contact points
- Content questions: edit via Decap CMS (`/admin`) collections (`site`, `pages`, `products`, etc.).
- Deployment questions: Netlify dashboard URL TBD (coordinate with project maintainer).
