# Kapunka Skincare Website Development Guidelines

## 1. Introduction

This document provides a comprehensive set of guidelines for developing and maintaining the Kapunka Skincare website. Its purpose is to ensure consistency, quality, and maintainability across the entire project.

Our core principles are:
- **Premium Feel:** The UI/UX should feel elegant, fluid, and high-end, inspired by sites like `gotes.co`.
- **Minimalism:** Designs, animations, and features should be clean, purposeful, and uncluttered.
- **Performance:** The site must be fast, responsive, and optimized for all devices.
- **Accessibility:** All users, regardless of ability, should have a seamless experience.
- **Maintainability:** The codebase must be clean, well-organized, and easy to understand.

---

## 2. Project Structure

The project follows a standard feature-based directory structure.

- `/admin/`: Contains the configuration and entry point for the Decap CMS.
  - `config.yml`: The "brain" of the CMS. Defines all editable content collections.
- `/components/`: Reusable React components shared across multiple pages (e.g., `ProductCard`, `Header`).
- `/content/`: The single source of truth for all website content, managed by the CMS. Data is stored in JSON format.
- `/contexts/`: Global React Context providers for cross-cutting concerns (e.g., `CartContext`, `LanguageContext`).
- `/pages/`: Top-level components that correspond to a specific page/route.
- `types.ts`: Shared TypeScript type definitions for the entire application.
- `index.html`: The main HTML entry point, containing the import map and Netlify Identity script.
- `index.tsx`: The root of the React application.

---

## 3. Coding Style & Conventions

- **Language:** TypeScript is mandatory. Use strong typing for all props, state, and functions.
- **Framework:** React 18 with functional components and Hooks.
- **Styling:** Use **Tailwind CSS** for all styling. Adhere to the utility-first approach. Custom styles or theme extensions should be defined in the `<script>` tag in `index.html`.
- **Naming Conventions:**
  - Components: `PascalCase` (e.g., `ProductCard.tsx`).
  - Hooks: `camelCase` with a `use` prefix (e.g., `useLanguage`).
  - Types/Interfaces: `PascalCase` (e.g., `interface Product`).
  - Other variables/functions: `camelCase`.
- **Component Design:**
  - Keep components small and focused on a single responsibility.
  - Clearly define component props using TypeScript interfaces.
  - Use descriptive variable and function names.

### 3.1 React performance & safety rules

These rules are enforced across the codebase and should be considered lint blockers:

- **Memoise event handlers.** Do not pass inline arrow functions or `.bind` calls directly in JSX for frequently rendered components. Use `useCallback` (or pre-declare handlers outside render scope) so props remain stable.
- **Handle async promises explicitly.** Avoid the `void` operator to ignore returned promises. Call the async function and attach `.catch` handlers so rejected promises are surfaced.
- **Provide stable React keys.** Never use array indices or derived template strings that depend on indices. Keys must come from deterministic data (ids, slugs, text values) to keep reconciliation predictable.
- **Ban `any`.** Prefer precise types. When receiving unknown CMS data, narrow with type guards and use `unknown` until validation passes.

Follow these patterns whenever you add or refactor components so new code remains compliant without additional clean-up passes.

---

## 4. UI/UX Principles

- **Aesthetic:** The design must remain clean, minimal, and elegant. Use ample whitespace and a muted color palette (primarily `stone` from Tailwind).
- **Animation:** Use `framer-motion` for all animations.
  - Animations must be subtle, fluid, and meaningful (e.g., page transitions, gentle hover effects).
  - Avoid jarring, fast, or distracting movements. Refer to `App.tsx` for the site-wide page transition configuration.
- **Responsiveness:** A **mobile-first** approach is mandatory. All new components and pages must be thoroughly tested across screen sizes from 320px width upwards.
- **Accessibility (a11y):**
  - Use semantic HTML tags (`<main>`, `<nav>`, `<button>`).
  - All images (`<img>`) must have a descriptive `alt` attribute.
  - Interactive elements must have clear focus states for keyboard navigation.
  - Use ARIA attributes where semantic HTML is insufficient.
  - Ensure sufficient color contrast between text and background.

---

## 5. State Management & Data Fetching

- **Global State:** React Context is used for shared state.
  - `LanguageContext`: Manages the current language and provides translation functions.
  - `CartContext`: Manages the shopping cart state, persisting to `localStorage`.
  - `UIContext`: Manages global UI state, like the visibility of the mini-cart.
- **Data Fetching:** All site content is fetched asynchronously from the `/content/` directory.
  - Use `useEffect` and `useState` within components to fetch data.
  - **Always implement loading states** to provide a smooth user experience while data is being fetched.
  - **Always implement empty or error states** (e.g., "No products found," "Article not found").

---

## 6. Content Management (Decap CMS)

- **ALL** user-facing content (text, images, prices, etc.) **MUST** be managed through the CMS. **Do not hardcode content in components.**
- The CMS is configured in `admin/config.yml`. To add a new editable area, a new collection must be defined here.
- Content is stored in `.json` files within the `/content` directory.
- Image uploads via the CMS will be stored in `/content/uploads`. All image paths in content files should point here.

### Decap CMS UX Principles

To keep the editor experience predictable and efficient, every CMS enhancement must uphold these principles:

- **Simplicity:** Streamline field groups and copy to minimise friction during frequent updates.
- **Consistency:** Reuse patterns, naming, and layout conventions so similar content blocks behave the same way across locales and collections.
- **User focus:** Document editor-facing guidance that answers “what does this control change?” before shipping a schema change.
- **Feature leverage:** Prefer built-in Decap capabilities (collections, widgets, i18n, previews) over bespoke workarounds that fragment the experience.
- **Accessibility:** Ensure the authoring surface supports inclusive practices (alt text prompts, clear instructions, keyboard-friendly forms).

### Single-File Page Model

- Unified pages now live in `content/pages_v2/index.json`. Each object in the `pages` array represents one page, consolidating hero copy, metadata, and section blocks in a single location.
- Keep the `sections` arrays intact. The rendering pipeline expects these nested groups, so regrouping or flattening them breaks shared section components.
- Every textual field is an object keyed by locale (`en`, `pt`, `es`). Populate all locales whenever you add fields, and keep translations synchronised to avoid mixed-language renders.

### Netlify Visual Editor Workflow *(legacy — Visual Editor retired 2025-10-09)*

> The Netlify Visual Editor integration has been removed. The details below remain for historical reference only. New work should target the canonical Decap content under `/content/**`, and you should not attempt to regenerate `metadata.json` or `.netlify/visual-editor` mirrors.

---

## 7. Multi-Language Support

- **Static UI Text:** All static text (e.g., button labels, titles) must be added to the `data/translations.ts` file under the appropriate language key (`en`, `pt`, `es`). Use the `t('key.path')` function from the `useLanguage` hook to display it.
- **Dynamic Content:** Content fetched from the CMS is structured with language keys. Use the `translate(contentObject)` function from the `useLanguage` hook to display the correct version.

---

## 8. Testing

While a formal testing suite is not yet implemented, the following principles should be applied when adding one:
- **Unit Tests:** Use **Jest** and **React Testing Library**.
  - Focus on testing component behavior from a user's perspective.
  - Mock contexts and data fetches to test components in isolation.
- **End-to-End (E2E) Tests:** Use **Cypress** or **Playwright**.
  - Create test scripts for critical user flows:
    1. Adding an item to the cart from the shop page.
    2. Navigating to the cart and viewing the subtotal.
    3. Submitting the contact form.
    4. Switching languages and verifying content changes.

---

## 9. Dependencies & Environment

- **Dependencies:** All frontend dependencies are loaded via CDN using the `importmap` in `index.html`.
- **CRITICAL: React Version**
  - This application **MUST** use **React 18.2.0** exclusively.
  - The `importmap` in `index.html` has been carefully configured. Do not add or change entries for `react` or `react-dom`.
  - Adding conflicting entries (especially those pointing to React 19) will cause a fatal `"Minified React error #31"` and break the entire application. This is a known, critical issue in this environment.

### Cloudinary Media Pipeline

- The Netlify runtime injects `process.env.CLOUDINARY_BASE_URL`; Vite exposes it to the client bundle. Treat it as the single source of truth for Cloudinary delivery URLs.
- Always pass CMS-provided image paths through `toCld()` (`src/lib/images.ts`) before rendering images or backgrounds. The helper strips legacy upload prefixes and skips transformation for absolute URLs.
- Do not hardcode Cloudinary domains or transformations. Keep configuration in environment variables so staging and production share the same media settings.

## 10. Branch & Commit Workflow

- Stay on the branch provided in the task/issue and avoid creating additional branches unless explicitly required.
- Use focused, conventional commits with imperative subjects. Never rely on `git commit -am`; stage files explicitly so you review the diff before committing.
- Run required build or lint commands before committing, document the results, and keep diffs minimal to simplify reviews and rollbacks.

---

## 11. Deployment

- **Hosting:** The site is configured for deployment on **Netlify**.
- **CMS Integration:** The Decap CMS relies on **Netlify Identity** for user authentication and **Netlify Git Gateway** to write content back to the GitHub repository. Both must be enabled in the Netlify dashboard for the CMS to function.
