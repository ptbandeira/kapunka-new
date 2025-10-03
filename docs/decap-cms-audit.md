# Decap CMS Audit & Editor Navigation Guide

> Looking for a change-by-change history? See the [Decap CMS & Netlify rolling log](./decap-netlify-rolling-log.md) for dated context before diving into specific audits.

## Executive Summary
- Decap pulls all assets from `content/uploads`, so every image referenced across pages, products, and globals can be updated in one place without touching the codebase.【F:admin/config.yml†L8-L9】
- Page schemas are repeated for each locale (English, Portuguese, Spanish), creating heavy duplication and longer editorial forms; introducing Decap's built-in i18n support or shared field groups would reduce bloat while keeping content structure intact.【F:admin/config.yml†L116-L639】
- Hero controls now include inline guidance that explains how to swap images and reposition overlay copy without coding knowledge, addressing the main usability complaint.【F:admin/config.yml†L139-L185】【F:admin/config.yml†L325-L371】【F:admin/config.yml†L504-L550】

## How the CMS Is Organised
- **Site-wide settings** live in `Site Settings → Site Configuration`, covering header/footer data and key imagery for About and the homepage hero card.【F:admin/config.yml†L12-L112】 The backing JSON is `content/site.json`, which shows exactly which image paths and copy the widgets edit.【F:content/site.json†L1-L60】
- **Pages collection** contains one entry per locale for each static page (e.g., `Home Page (English)` edits `content/pages/en/home.json`). Every locale repeats the same field list, which keeps translation workflows separate but triples the form length.【F:admin/config.yml†L116-L639】
- **Catalog data** such as product imagery sits under dedicated collections (e.g., `Products`) with `imageUrl` fields that point to files inside `content/uploads`.【F:content/products/index.json†L120-L142】

## Duplication & Potential Bloat
1. **Locale-specific files mirror the same schema.** The Home page configuration is copy-pasted three times for `home_en`, `home_pt`, and `home_es`, each with identical field stacks covering hero, galleries, testimonials, and callouts.【F:admin/config.yml†L116-L639】 Maintaining parity across locales requires editing every block thrice, which increases the chance of mismatched toggles or forgotten media.
2. **Sections repeat across collections.** Within each page entry the `sections` list exposes multiple section types (`imageTextHalf`, `imageGrid`) that repeat similar image fields already present in higher-level objects, making the sidebar dense and potentially overwhelming.【F:admin/config.yml†L459-L480】 Grouping those controls with Decap `group` widgets or limiting visible section types per page would declutter the editor.
3. **Mirrored content for Netlify Visual Editor.** Each change in `content/` is duplicated into `site/content/` during builds; while necessary for Stackbit, it doubles the number of JSON files that store the same assets. Automations already manage the sync, but editors should avoid touching the `site/` mirror manually.【F:AGENTS.md†L34-L41】【F:scripts/postbuild.js†L1-L40】

### Recommendations
- Enable Decap's `i18n: true` option at the collection level so a single form can manage all locales while still outputting locale-specific JSON, reducing duplicate configuration blocks without altering front-end expectations.【F:admin/config.yml†L116-L639】
- Convert recurring media groups (hero, gallery rows, brand snapshots) into reusable `object` or `list` widgets referenced across locales. This would preserve the data model but dramatically shorten each page form.
- Keep the `content/uploads` library organised with subfolders (e.g., `/pages/home/`, `/products/`) so editors can quickly locate assets when using the picker.

## Where to Edit Photos
| Area | Decap location | File & key fields |
| --- | --- | --- |
| Homepage hero background(s) | Pages → Home Page (per locale) → Hero Image (Left/Right) | `content/pages/{locale}/home.json` → `heroImageLeft`, `heroImageRight` determine the large visuals backing the hero split layout.【F:admin/config.yml†L164-L175】【F:content/pages/en/home.json†L19-L75】 |
| Homepage gallery tiles | Pages → Home Page → Gallery Rows | `galleryRows[].items[].image` controls the mosaic imagery; alt text and captions sit beside each image in the same array.【F:admin/config.yml†L395-L412】【F:content/pages/en/home.json†L21-L57】 |
| Homepage section cards | Pages → Home Page → Sections | Each section entry includes an `image` field inside either `imageTextHalf` or `imageGrid` blocks.【F:admin/config.yml†L459-L480】【F:content/pages/en/home.json†L63-L101】 |
| About page photography | Site Settings → About Page Imagery | `storyImage` and `sourcingImage` update the hero and sourcing visuals on the Story page.【F:admin/config.yml†L51-L72】【F:content/site.json†L13-L18】 |
| Product packshots | Products → (select product) | `imageUrl` controls storefront packshots for every SKU listed in `content/products/index.json`.【F:content/products/index.json†L120-L142】 |

_All image fields pull from `/content/uploads`, so uploading a replacement file there will make it available across every picker without path adjustments.【F:admin/config.yml†L8-L9】_

## Controlling Copy Position on Photos
- **Horizontal alignment (`Hero Horizontal Alignment`)** decides whether the hero headline sits on the left or centered over the hero asset. Hints now clarify this behaviour for editors.【F:admin/config.yml†L139-L147】【F:admin/config.yml†L325-L333】【F:admin/config.yml†L504-L512】
- **Vertical alignment (`Hero Vertical Alignment`)** moves the same block up, middle, or down across the hero image. The updated hint explains the mapping.【F:admin/config.yml†L148-L156】【F:admin/config.yml†L334-L342】【F:admin/config.yml†L513-L521】
- **Overlay opacity (`Hero Overlay`)** uses RGBA values so editors can lighten or darken the protective overlay without CSS; guidance is now included inline.【F:admin/config.yml†L158-L163】【F:admin/config.yml†L344-L349】【F:admin/config.yml†L523-L528】
- **Layout hint and image slots** describe when to populate the left/right image fields so non-technical users know which upload drives each layout.【F:admin/config.yml†L164-L185】【F:admin/config.yml†L350-L371】【F:admin/config.yml†L529-L550】

## Next Steps for a Leaner CMS
1. Pilot the i18n form on a lower-risk page (e.g., Videos) to validate that Decap merges locale tabs cleanly before rolling it out to core pages.【F:admin/config.yml†L12-L639】
2. Document a naming convention for uploads and enforce alt text entry during content reviews to keep the library manageable and accessible.【F:admin/config.yml†L55-L72】【F:content/pages/en/home.json†L25-L53】
3. Add quickstart notes (like this guide) to the team wiki or the CMS sidebar so editors can find field explanations without leaving Decap.
