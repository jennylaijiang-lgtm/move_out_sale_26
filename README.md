# September Move-Out Sale

A static, mobile-friendly catalogue for a private move-out sale. It includes search, category filters, sorting, availability states, item details, shareable item URLs, and pre-filled WhatsApp messages.

## Preview locally

The catalogue is loaded with `fetch()`, so do not open `index.html` directly as a file. In this directory, run:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

The virtual environment has no packages to install; it simply keeps the local preview environment isolated. Stop the server with `Control-C`, then run `deactivate` when finished.

## Personalise the site

### 1. Sale and contact details

Edit `SALE_CONFIG` at the top of `app.js`:

```js
const SALE_CONFIG = {
  pickupArea: "Amsterdam",
  pickupDates: "1–30 September 2026",
  currency: "EUR",
  locale: "en-NL",
  whatsappNumber: "31612345678",
  generalMessage: "Hi! I have a question about your September move-out sale.",
};
```

WhatsApp numbers must use the full international number without `+`, spaces, or dashes.

Update the page title and introductory text directly in `index.html`.

Owner mode uses a separate convenience password near the top of `app.js`:

```js
const OWNER_CONFIG = {
  password: "change-me",
};
```

Change this placeholder before deployment. Because the password is delivered to every visitor's
browser, it can be discovered and is not secure authentication. Owner mode never receives GitHub
credentials and cannot publish changes directly.

### 2. Items

Replace the sample entries in `catalog.json`. Each item supports:

```json
{
  "id": "unique-item-name",
  "name": "Item name",
  "category": "Furniture",
  "price": 50,
  "status": "Available",
  "shortNote": "Short card description",
  "description": "Longer item description",
  "condition": "Good condition",
  "dimensions": "100 × 50 × 75 cm",
  "pickup": "Pickup only",
  "images": ["assets/item-1.webp", "assets/item-2.webp"],
  "hidden": false
}
```

Use only `Available`, `Reserved`, or `Sold` as statuses. Set `price` to `null` to display “Price on request”. Keep every `id` unique and URL-friendly.
Set `hidden` to `true` to retain an item in owner drafts and exports without showing it to visitors.
Older catalogue entries without this field default to `false`.

### 3. Photos

Put compressed `.webp` or `.jpg` files in `assets/`, then add their paths to the item’s `images` array. Aim for roughly 1200–1600 px on the longest side and preferably less than 500 KB per image.

Do not publish your exact home address. Share it privately after agreeing on a pickup.

## Manage the catalogue in Owner mode

1. Select **Owner mode** in the footer and enter the password configured in `app.js`.
2. Add or edit items, change their status, duplicate them, hide or restore them, and adjust their order.
3. Confirm that the **Unpublished changes** badge is visible. The draft is stored only in this browser under the versioned key `move-out-sale-owner-draft-v1`.
4. Use **Export JSON** to download a complete, validated `catalog.json`.
5. Replace the repository's `catalog.json` with the exported file and review the Git diff.
6. Commit and push the change; Cloudflare Pages will deploy the published catalogue.

Owner mode also supports validated JSON import. An invalid import leaves the current draft unchanged.
**Reload published** fetches the latest repository file without deleting a local draft. **Discard
draft** permanently removes the browser-local draft after confirmation. Exiting Owner mode keeps a
valid draft for the next unlocked session but returns the page to the published visitor catalogue.

Drafts are local to one browser and device. Export regularly if the draft is important, and do not
clear browser storage until it has been published or backed up.

## Publish with GitHub and Cloudflare Pages

1. Create a GitHub repository and upload all files from this directory.
2. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**.
3. Select the GitHub repository and production branch (`main`).
4. This project has no build step. Leave **Build command** blank and set **Build output directory** to `/`.
5. Select **Save and Deploy**.
6. Cloudflare will provide a free `your-project.pages.dev` URL and publish future GitHub updates automatically.

## Licence

The website source code is licensed under the [MIT License](LICENSE), copyright 2026 Jenny Jiang.

The MIT License does not apply to product photographs, catalogue data, item descriptions, or other personal content in this repository. Those materials remain all rights reserved unless explicitly stated otherwise.
