# Preview & Workflow Follow-ups — October 2025

## Issue: Extend CTA readiness badges across templates
- **Summary:** Mirror the hero CTA readiness pills across every CTA widget (newsletter, tertiary buttons) so editors can see missing labels/URLs without opening the sidebar.
- **Context:** Editors flagged the gap during the October preview study when validating newsletter CTAs.【F:docs/decap-cms-audit.md†L128-L155】
- **Acceptance criteria:**
  - Every CTA-like field renders a readiness chip with label/URL checks.
  - Empty states surface "CTA not configured" copy.
  - Tertiary CTA arrays show per-item readiness.
- **Links:** [`admin/index.html`](../admin/index.html)

## Issue: Support custom slug mappings in locale chips
- **Summary:** Make the locale chips smart enough to deep-link into alternate slug patterns (e.g., marketing campaigns that drop the `_locale` suffix) so localization leads can still hop between variants.
- **Context:** Localization editors requested richer chip logic during the October preview study.【F:docs/decap-cms-audit.md†L128-L155】
- **Acceptance criteria:**
  - Locale chips detect the active entry's slug structure.
  - Provide a fallback link input for manual overrides when no deterministic slug exists.
  - Document the behavior in the CMS audit.
- **Links:** [`admin/index.html`](../admin/index.html)

## Issue: Surface alt text in hero media cards
- **Summary:** Extend the hero media status cards to show the configured alt text beside filenames so QA can confirm accessibility coverage at-a-glance.
- **Context:** Merchandising asked to see alt text while validating hero imagery in preview sessions.【F:docs/decap-cms-audit.md†L128-L155】
- **Acceptance criteria:**
  - Hero media cards show filename and alt text if supplied.
  - Missing alt text renders a "Add alt text" warning state.
  - Documentation updated with the new cues.
- **Links:** [`admin/index.html`](../admin/index.html)
