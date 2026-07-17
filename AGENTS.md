# AGENTS.md

## Project purpose

This repository contains a mobile-first catalogue for a private move-out sale in September 2026. Visitors should be able to browse, search, filter, inspect, share, and enquire about items. The owner should be able to manage catalogue drafts without exposing credentials or giving anonymous visitors write access to the published site.

Read `IMPLEMENTATION_PLAN.md` before making feature or architecture changes. Treat it as the current product plan and update it when the user changes the agreed scope.

## Current architecture

- Static HTML, CSS, and JavaScript; no framework or build step
- `index.html` contains the page structure and copy
- `styles.css` contains all presentation and responsive rules
- `app.js` contains configuration, catalogue rendering, filtering, item dialogs, sharing, and WhatsApp links
- `catalog.json` is the published catalogue source
- `assets/` contains product photographs
- GitHub is the intended version-control host
- Cloudflare Pages is the intended deployment host
- `.venv` is optional and only used for an isolated local preview server

Prefer extending this simple architecture over introducing dependencies. Add a framework, package manager, database, CMS, or server only when the user explicitly approves that change and the benefit justifies the added maintenance.

## Product priorities

In order of importance:

1. Simple catalogue maintenance for a non-technical owner
2. Clear browsing and enquiry flow on mobile devices
3. Accurate availability and pricing information
4. Privacy and protection of credentials
5. Fast loading, especially for photographs
6. Accessible keyboard and screen-reader behaviour
7. Straightforward Git and Cloudflare deployment

## Security and privacy rules

- Never place GitHub tokens, API keys, OAuth secrets, passwords with real security value, or other credentials in front-end code, catalogue data, commits, or documentation.
- A client-side Owner mode password is cosmetic only. Always describe it as a convenience gate, never secure authentication.
- Local Owner mode may edit browser-local drafts and export files, but it must not directly publish or modify GitHub.
- Do not implement direct publishing without server-side authentication or a secure OAuth integration approved by the user.
- Do not publish the seller’s exact home address. Store only a broad collection area and share the address privately.
- Do not add visitor tracking, analytics, cookies, or data collection without explicit approval.
- WhatsApp numbers and messages are public once included in the deployed front end. Flag placeholder contact details before deployment.

## Catalogue contract

`catalog.json` must contain an array of item objects. Preserve this shape unless a documented migration is included:

```json
{
  "id": "unique-url-safe-id",
  "name": "Item name",
  "category": "Furniture",
  "price": 50,
  "status": "Available",
  "shortNote": "Short card description",
  "description": "Longer item description",
  "condition": "Good condition",
  "dimensions": "100 × 50 × 75 cm",
  "pickup": "Pickup only",
  "images": ["assets/item-1.webp", "assets/item-2.webp"]
}
```

Catalogue requirements:

- `id` must be present, unique, stable, lowercase, and URL-safe.
- `name` and `category` must be non-empty strings.
- `price` must be a non-negative number or `null` for “Price on request”.
- `status` must be exactly `Available`, `Reserved`, or `Sold`.
- `images` must be an array of repository-relative paths or intentionally approved remote URLs.
- Never silently discard unknown or hidden item data during import/export.
- New schema fields require defaults for existing catalogue entries.
- Exports should be deterministic and readable with two-space JSON indentation.

## Photograph rules

- Prefer WebP or compressed JPEG.
- Aim for approximately 1200–1600 pixels on the longest side.
- Prefer files below 500 KB when image quality remains acceptable.
- Use lowercase, URL-safe names with hyphens and meaningful item prefixes.
- Provide useful alternative text based on the item and image position.
- Missing or broken photographs must fall back to a clear placeholder.
- Do not add photographs from third-party websites without a compatible licence or the owner’s permission.

## Owner mode implementation rules

Follow Phase 2 of `IMPLEMENTATION_PLAN.md` when implementing Owner mode.

- Keep published catalogue data separate from browser-local draft data.
- Store draft data under a versioned `localStorage` key.
- Never overwrite or discard a draft without an explicit user action and confirmation.
- Display an obvious unpublished-changes indicator.
- Validate imports fully before replacing the active draft.
- Export a complete, valid `catalog.json`.
- Prefer hide/restore over permanent deletion.
- Keep editing controls absent or disabled outside Owner mode.
- Keep the visitor experience unchanged when no local draft exists.

## UI and accessibility rules

- Preserve the existing visual language unless the user requests a redesign.
- Design mobile-first and verify common narrow and wide breakpoints.
- Use semantic HTML before adding ARIA.
- All interactive controls must work with a keyboard and show visible focus.
- Dialogs must move focus inside when opened, keep focus contained, close with Escape, and return focus to the triggering control.
- Status must not be communicated by colour alone.
- Form validation errors must be associated with the relevant fields and understandable without visual context.
- Respect `prefers-reduced-motion`.
- Avoid horizontal scrolling at 320 px viewport width.

## Local development

No dependency installation is required. Preview through an HTTP server because `catalog.json` is loaded with `fetch()`:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m http.server 8080
```

Open `http://localhost:8080`. Stop the server with `Control-C` and leave the environment with `deactivate`.

Do not assume that opening `index.html` directly through a `file://` URL is a valid test.

## Required verification

Run checks proportionate to every change. At minimum:

```bash
node --check app.js
python3 -m json.tool catalog.json >/dev/null
```

For UI changes, also verify:

- Catalogue load and error state
- Search, categories, sort, and “Hide sold” in combination
- Item dialog open, close, keyboard behaviour, and hash links
- WhatsApp and share links
- Available, reserved, and sold items
- Missing and multiple images
- Mobile and desktop layouts
- Owner draft persistence, import, validation, export, and discard behaviour when applicable

Do not claim visual or browser verification if only syntax checks were run. If the environment prevents local serving or browser inspection, state that limitation clearly.

## Documentation

Update `README.md` when changing:

- Setup or preview steps
- Configuration fields
- Catalogue schema
- Photograph workflow
- Owner workflow
- Deployment process

Update `IMPLEMENTATION_PLAN.md` when a phase is completed, replaced, or materially re-scoped. Keep security caveats visible in both user-facing instructions and relevant UI.

## Git and deployment hygiene

- Inspect `git status` before editing and preserve unrelated user changes.
- Do not commit, push, create branches, connect remotes, or deploy unless the user explicitly requests it.
- Do not commit `.venv`, `.env*`, credentials, private addresses, OS files, logs, or generated temporary files.
- Keep commits focused and use clear imperative messages when the user asks for commits.
- Never rewrite history, force-push, reset, or delete branches without explicit approval.
- Cloudflare Pages should deploy the repository root with no build command and `/` as the output directory while this remains a static site.

## Licensing

- Do not copy code, photographs, descriptions, branding, or distinctive visual assets from the reference website unless permission or a compatible licence is documented.
- General product ideas and independently implemented interaction patterns are acceptable.
- Do not add an MIT licence until the user confirms that they want the code reusable and provides the preferred copyright holder name.
- If a code licence is added, explicitly exclude product photographs, catalogue data, descriptions, and personal content unless the user says otherwise.

## Definition of done

A change is done only when:

- It satisfies the user’s stated goal without expanding scope unexpectedly.
- Existing visitor functionality is preserved or intentionally migrated.
- Relevant validation and browser behaviour have been checked.
- Security and privacy boundaries remain intact.
- Documentation is updated when the workflow or data contract changes.
- Remaining placeholders, limitations, and manual steps are clearly reported.

