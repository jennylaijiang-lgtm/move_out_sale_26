# Move-Out Sale Website Implementation Plan

## 1. Objective

Create a friendly, mobile-first catalogue for a private move-out sale in September 2026. Visitors should be able to browse, search, filter, share items, and contact the seller. The owner should be able to manage the catalogue through the website without exposing GitHub credentials or other secrets.

## 2. Recommended Architecture

The first release will remain a static website:

- HTML, CSS, and JavaScript only
- `catalog.json` as the published source of catalogue data
- Product photographs stored in `assets/`
- GitHub for version control
- Cloudflare Pages for hosting and automatic deployments
- WhatsApp links for enquiries
- Browser `localStorage` for unpublished owner drafts

This keeps the site inexpensive, portable, and easy to maintain. No database or server is required for the first release.

## 3. Security Boundary

The proposed Owner mode password is a convenience feature, not secure authentication. A password included in browser code can be discovered by a technically knowledgeable visitor.

To keep this acceptable:

- Owner mode must never contain GitHub tokens, API keys, or private credentials.
- Owner edits must remain local to that browser until exported.
- Owner mode must not directly publish, upload, or overwrite repository files.
- Visitors who discover the password cannot modify the public website.
- The exact collection address must not be stored in the public catalogue.

If direct publishing is required later, Owner mode must be replaced with real server-side authentication.

## 4. Phase 1: Catalogue Foundation

Status: completed in the current prototype.

- Responsive catalogue grid
- Search by item name, category, description, condition, and dimensions
- Category filters with item counts
- Price and alphabetical sorting
- Available, reserved, and sold states
- “Hide sold” control
- Item detail modal
- Multiple-photo gallery support
- Shareable item links using URL hashes
- Pre-filled WhatsApp messages
- Responsive desktop and mobile layouts
- Editable `catalog.json`

## 5. Phase 2: Local Owner Mode

### 5.1 Entry and session

- Add an unobtrusive **Owner mode** link in the footer.
- Open a password dialog when selected.
- Keep the unlocked state only for the current browser session.
- Clearly state that the password only hides editing controls.
- Add an **Exit owner mode** action.

### 5.2 Draft storage

- Load the published `catalog.json` normally.
- On first edit, create a local draft in `localStorage`.
- Restore the local draft when the owner returns in the same browser.
- Display a persistent “Unpublished changes” notice.
- Provide **Discard draft** with a confirmation prompt.
- Provide **Reload published catalogue** without silently deleting a draft.

### 5.3 Catalogue editing

Owner mode will support:

- Add a new item
- Edit item name, category, price, status, descriptions, condition, dimensions, pickup note, and image paths
- Duplicate an item
- Mark an item available, reserved, or sold from its card
- Hide an item without deleting its data
- Restore a hidden item
- Reorder items using up/down controls
- Validate required fields and unique item IDs
- Generate a URL-friendly ID for new items

Permanent deletion will not be included initially. Hiding items is safer and recoverable.

### 5.4 Import and export

- Export the complete draft as `catalog.json`.
- Import an existing `catalog.json` for editing.
- Validate imported JSON before replacing the current draft.
- Show clear errors for invalid statuses, duplicate IDs, missing names, or malformed image lists.
- Explain the publishing workflow after export:
  1. Replace the repository’s `catalog.json`.
  2. Review the Git change.
  3. Commit and push.
  4. Wait for Cloudflare Pages to deploy.

## 6. Phase 3: Photograph Workflow

The static website cannot permanently upload files to GitHub from the browser.

For the first release:

- Owner mode will accept image paths such as `assets/oak-table-1.webp`.
- It will preview images that already exist in `assets/`.
- Missing files will show a helpful warning and placeholder.
- The README will describe how to copy photographs into `assets/`.
- Recommended image format: WebP or compressed JPEG.
- Recommended dimensions: approximately 1200–1600 pixels on the longest side.
- Recommended file size: preferably below 500 KB per image.
- File names should use lowercase letters, numbers, and hyphens.

A future authenticated version could support direct photo uploads.

## 7. Phase 4: Content and Configuration

Replace all prototype content before publishing:

- Sale title
- Seller contact number
- General WhatsApp message
- Collection area
- Collection dates
- Introduction and footer text
- Sample catalogue entries
- Placeholder photographs
- Page title and description metadata

Add a pre-publication warning if the placeholder WhatsApp number is still configured.

## 8. Phase 5: Accessibility and Quality

- Ensure all controls are usable with a keyboard.
- Keep visible focus styles.
- Return focus to the triggering control when dialogs close.
- Trap keyboard focus inside open dialogs.
- Add appropriate labels and error messages to owner forms.
- Confirm status is not communicated by colour alone.
- Add meaningful alternative text for product photographs.
- Respect reduced-motion preferences.
- Test narrow mobile, tablet, laptop, and wide desktop layouts.
- Test current Safari, Chrome, Firefox, and mobile browsers.

## 9. Phase 6: Testing

### Catalogue tests

- Catalogue loads successfully.
- Search and category filters work together.
- Sorting handles missing prices correctly.
- “Hide sold” works with every category.
- Item hash links open the correct item.
- WhatsApp messages contain the correct item and URL.
- Missing photographs fall back gracefully.

### Owner-mode tests

- Incorrect passwords do not open editing controls.
- Correct password unlocks the current session.
- Drafts survive a page refresh.
- Discarding a draft restores published data.
- Import rejects invalid catalogues without losing the current draft.
- Exported JSON can be re-imported unchanged.
- New IDs are unique and URL-safe.
- Hidden items remain editable and recoverable.
- Sold items cannot generate an interest message.

### Deployment tests

- The site works from a local HTTP server.
- Relative paths work on the Cloudflare Pages URL.
- Cloudflare deploys automatically after a GitHub push.
- No `.env`, `.venv`, credentials, or private addresses are committed.

## 10. Phase 7: Documentation and Publishing

- Keep setup and editing instructions in `README.md`.
- Document catalogue fields with an example item.
- Document local preview commands.
- Document the Owner mode import/export workflow.
- Document Git commit and Cloudflare deployment steps.
- Add an MIT licence only if the owner wants the website code to be reusable.
- Explicitly exclude photographs, catalogue data, descriptions, and personal content from the code licence.

## 11. Future Upgrade: Authenticated Publishing

Only consider this if exporting and committing `catalog.json` becomes inconvenient.

Possible future architecture:

- Secure owner login handled server-side
- Catalogue stored in a database or managed content service
- Direct image uploads to private storage
- Immediate public updates after saving
- Reservation requests with timestamps
- Protection against simultaneous reservation attempts
- Change history and rollback

No GitHub personal access token should ever be stored in front-end JavaScript. Direct GitHub publishing would require OAuth or a server-side integration.

## 12. Recommended Implementation Order

1. Add Owner mode shell, password notice, and session unlock.
2. Add local draft storage and unpublished-change indicator.
3. Add item editor and quick status controls.
4. Add hide, restore, duplicate, and reorder actions.
5. Add catalogue import, validation, and export.
6. Improve photograph-path previews and warnings.
7. Complete accessibility behaviour for dialogs and forms.
8. Test all visitor and owner workflows.
9. Replace sample configuration and catalogue content.
10. Commit, connect Cloudflare Pages, and perform a production check.

## 13. Acceptance Criteria for the First Release

The first release is complete when:

- Visitors can find, inspect, share, and enquire about items on mobile and desktop.
- The owner can manage all catalogue fields through the website.
- Owner changes persist locally without altering the published site.
- A valid `catalog.json` can be exported and published through Git.
- No secret or private address is present in the repository or browser code.
- Missing or invalid catalogue data produces understandable errors.
- The documented local and Cloudflare workflows work from a clean checkout.

