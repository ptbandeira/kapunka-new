# Task Plan — Fix Localized Clinics CTA Slugs

## Background
Portuguese and Spanish homepages were linking to `/clinics`, but the React router only exposes the Clinics landing page at `/for-clinics`. When visitors clicked the hero or "Partner with us" CTAs, React Router failed to resolve `/pt/clinics` or `/es/clinics` and fell back to the root, making the localized pages appear broken.

## Task Breakdown
1. **Update page JSON:** Replace every `/clinics` reference in `content/pages_v2/index.json` hero and section CTA fields with `/for-clinics` so each locale uses the live slug.
2. **Sync localized markdown:** Mirror the slug update in `content/pages/en/home.md`, `content/pages/pt/home.md`, and `content/pages/es/home.md` to keep Decap card front matter aligned with the JSON model.
3. **Sweep for stale links:** Run `rg '/clinics' content` to confirm no other CMS-managed documents still point at the retired route.
4. **Regression check:** After updating content, run `npm run build` and spot-check `/pt` and `/es` locally to confirm the CTAs navigate correctly.

## Success Criteria
- All localized CTAs navigate to `/for-clinics` without redirect loops.
- `npm run build` succeeds with no new warnings.
- Repository search shows no remaining `/clinics` links targeting the deprecated slug.

## Completion Notes
- Updated the unified home JSON and all localized markdown sources to point hero and section CTAs at `/for-clinics`.
- Confirmed with `rg '/clinics' content` that no CMS-managed content still references the retired slug.
