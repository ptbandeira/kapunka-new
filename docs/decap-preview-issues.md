# Preview & Workflow Issues to File (2025-10-06)

## Issue: Add locale toggle to CMS preview header
- **Labels**: `cms`, `localization`
- **Summary**: Introduce a lightweight locale switcher inside the Decap preview header so editors can pivot between `home_en`, `home_es`, and `home_pt` without navigating back to the left-hand entry list.
- **Acceptance Criteria**:
  - Preview header exposes buttons or a segmented control for each available locale on multi-locale entries.
  - Toggling the control updates the preview to the matching entry while retaining scroll position.
  - Locale toggle clearly indicates the current selection and degrades gracefully when only one locale exists.
- **Notes**: Participant B from the October 2025 test still needed to backtrack through the sidebar even after reading the new breadcrumb/locale pill, signalling the need for an in-preview control.

## Issue: Extend CTA readiness indicators beyond hero blocks
- **Labels**: `cms`, `ux`
- **Summary**: Replicate the hero CTA status chips for other CTA-bearing widgets (newsletter signup, showcase cards, footer promos) so editors can see missing labels/URLs without drilling into list items.
- **Acceptance Criteria**:
  - Preview cards display CTA readiness for every supported section type, including counts for nested CTAs.
  - Missing labels/URLs surface a "Draft" state with guidance on where to edit them.
  - Documentation updated in `docs/decap-cms-audit.md` once implemented.
- **Notes**: Participant A highlighted the absence of tertiary CTA cues during the October 2025 sessions.

## Issue: Surface asset filenames in section detail chips
- **Labels**: `cms`, `content-qa`
- **Summary**: Enhance the section detail chips to show the referenced media filename (or alt text fallback) when imagery is present, helping editors confirm translations and asset swaps quickly.
- **Acceptance Criteria**:
  - Each section card lists the primary media filename (derived from the URL) alongside the asset count.
  - When an image is missing, the existing "Media placeholder" chip remains.
  - Solution handles both direct `image` fields and nested list items.
- **Notes**: Participant C requested faster filename access after relying on the new media placeholder chip during testing.
