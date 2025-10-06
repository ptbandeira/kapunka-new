# Page Builder Migration Notes

These notes capture how page-specific migrations were completed so we can repeat the pattern for future pages.

## Learn Page (April 2025)
- **Content Source**: moved hero metadata and category config from `content/translations/learn.json` into per-locale page files (`content/pages/{locale}/learn.md` with build-time mirrors in `.netlify/visual-editor/content`).
- **Runtime Loader**: introduced `utils/loadLearnPageContent.ts` to fetch the page data with automatic fallback to the Visual Editor mirror when editing in Netlify Create.
- **Rendering Update**: `pages/Learn.tsx` now reads hero copy and category labels from the loader, while still falling back to translations if any field is missing. Article cards receive CMS-sourced category labels.
- **CMS Schema**: extended the Page Builder schema (`admin/config.yml`) with hero and category list fields so editors manage the Learn page entirely from a single entry.

- **Content Source**: migrated clinic hero, intro, protocol cards, references, keywords, FAQ, and CTA strings out of `content/translations/clinics.json` into `content/pages/{locale}/clinics.md` (mirrored during builds into `.netlify/visual-editor/content`). Existing section arrays remain intact.
- **Runtime Loader**: added `utils/loadClinicsPageContent.ts` and updated `pages/ForClinics.tsx` to consume the new JSON while preserving translation fallbacks.
- **CMS Schema**: expanded the Page Builder entry with structured objects (Intro, Protocol cards, References, Keywords, FAQ, CTA) so editors can update everything from the page form.
- **Clinic partners**: the legacy partner carousel module was retired during the 2025 CMS cleanup once no pages referenced the shared list.

## Community Carousel Refresh (April 2025)
- **New Layout**: `components/sections/CommunityCarousel.tsx` now renders a marquee-style slider with square imagery and a floating quote overlay, matching the requested visual style.
- **Animations**: Tailwind config (`index.html`) adds a `carousel-scroll` keyframe; each slide is duplicated for a seamless loop and animation duration is computed from CMS-provided timing.
- **Quotes Overlay**: Quotes rotate automatically, with randomised positions, a dedicated `quoteDuration` CMS field, and inline Netlify Visual Editor bindings preserved for quote/name/role fields.

When migrating another page, follow the same pattern: move localized content into `content/pages/{locale}` as Markdown front matter, mirror it into `.netlify/visual-editor/content` during builds, add a loader under `utils/`, update the page component to prefer the new content with translation fallbacks, and extend `admin/config.yml` accordingly.
