# Visual Editor Audit

## Diagnostic Summary
- The Visual Editor mirror previously lived under `site/content`, which diverged from the canonical `content/` directory. Page JSON under that mirror lacked required `type` fields (for example the Learn page mirror omitted `"type": "LearnPage"`), preventing Stackbit from matching `data-sb-object-id` bindings to any registered model.
- Only a subset of pages (about/contact/clinics/home/learn) existed under the mirror, while other routed slugs (`story`, `method`, `training`, etc.) were missing entirely. Requests made by helper loaders such as `fetchVisualEditorJson` therefore skipped the Visual Editor overlay and fell back to raw content files, disabling inline editing.
- The mirror included a verbatim copy of `content/uploads`, adding hundreds of binary JPEG/PNG assets to every sync. Those binaries ballooned PRs and violated the Visual Editor tooling constraint that forbids binary file uploads in review branches.
- The build script never refreshed that mirror, so even after editors updated content the copy remained out of sync, guaranteeing future drift and repeated Visual Editor failures.

## Proposed Fix Plan
1. Add a reusable sync utility that copies the canonical `content/` tree into `.netlify/visual-editor/content/`, deleting the stale mirror before copying so schema updates propagate cleanly.
2. Skip `content/uploads` during the copy to keep large binaries out of the Visual Editor workspace. Canonical binaries continue to live exclusively under `content/uploads`, avoiding PR bloat while keeping paths stable for Visual Editor previews.
3. Call the sync utility from the existing `postbuild` script and expose it as an npm task so developers can update the mirror on demand (before running Visual Editor or committing content changes).
4. Regenerate the `.netlify/visual-editor/content` files to ensure every page and collection mirrors the canonical structure with model `type` fields intact, while the uploads mirror remains lightweight.

## Minimal Diff Overview
- New `scripts/prepare-visual-editor-content.js` utility encapsulates the mirror sync logic and filters out the uploads directory so the workspace stays lightweight.
- `scripts/postbuild.js` imports the helper and runs it after copying build assets, guaranteeing automated refreshes.
- `package.json` exposes a `visual:prepare` script so the sync can be invoked without a full build.
- `.netlify/visual-editor/content/**` is regenerated via the helper, replacing the truncated mirror with the canonical content tree.

## Risk Assessment & Rollback Strategy
- **Risk**: Copying all of `content/` into `.netlify/visual-editor/content/` could inadvertently remove any bespoke files expected exclusively in the mirror. The helper deletes the destination before copying, so untracked mirror-only files would disappear.
  - **Mitigation**: The repo now treats `content/` as the sole source of truth. If an unexpected regression appears, re-run the sync after restoring the prior file from version control or recreate the file in `content/` so it persists through the sync.
- **Risk**: Excluding `content/uploads` from the copy might hide an expectation that mirrored binaries exist.
  - **Mitigation**: Assets now stay canonical in `content/uploads/`, so the Visual Editor mirror remains lightweight. Reverting the change simply involves copying the assets back in and adjusting the exclusion filter if needed.
- **Risk**: Future schema changes might require additional processing beyond a raw copy.
  - **Mitigation**: The sync utility is centralized, making it straightforward to extend with transforms if requirements evolve.

Rollback consists of checking out the previous commit for `scripts/` and regenerating `.netlify/visual-editor/content/` (or restoring the deleted files from Git history), then skipping the new sync step.
