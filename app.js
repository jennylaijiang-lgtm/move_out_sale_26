const SALE_CONFIG = {
  pickupArea: "Amsterdam",
  pickupDates: "1–30 September 2026",
  currency: "EUR",
  locale: "en-NL",
  // Replace this with your full international number, without +, spaces, or dashes.
  whatsappNumber: "31612345678",
  generalMessage: "Hi! I have a question about your September move-out sale.",
};

const OWNER_CONFIG = {
  // This is a convenience gate only. Anyone can discover a password stored in front-end code.
  password: "change-me",
};

const DRAFT_STORAGE_KEY = "move-out-sale-owner-draft-v1";
const OWNER_SESSION_KEY = "move-out-sale-owner-session-v1";
const VALID_STATUSES = ["Available", "Reserved", "Sold"];
const STRING_FIELDS = ["shortNote", "description", "condition", "dimensions", "pickup"];

const state = {
  publishedItems: [],
  items: [],
  category: "All",
  query: "",
  hideSold: false,
  sort: "featured",
  selectedItem: null,
  galleryIndex: 0,
  ownerUnlocked: storageGet(sessionStorage, OWNER_SESSION_KEY) === "true",
  hasDraft: false,
  hasInvalidDraft: false,
  editingOriginalId: null,
  editingBase: null,
  editorIdTouched: false,
  activeDialog: null,
  dialogReturnFocus: null,
};

const elements = {
  search: document.querySelector("#search"),
  sort: document.querySelector("#sort"),
  hideSold: document.querySelector("#hide-sold"),
  categoryRow: document.querySelector("#category-row"),
  grid: document.querySelector("#product-grid"),
  resultCount: document.querySelector("#result-count"),
  emptyState: document.querySelector("#empty-state"),
  alert: document.querySelector("#catalogue-alert"),
  resetFilters: document.querySelector("#reset-filters"),
  modal: document.querySelector("#item-modal"),
  modalClose: document.querySelector("#modal-close"),
  modalMainImage: document.querySelector("#modal-main-image"),
  modalCategory: document.querySelector("#modal-category"),
  modalStatus: document.querySelector("#modal-status"),
  modalTitle: document.querySelector("#modal-title"),
  modalPrice: document.querySelector("#modal-price"),
  modalDescription: document.querySelector("#modal-description"),
  modalFacts: document.querySelector("#modal-facts"),
  modalContact: document.querySelector("#modal-contact"),
  modalShare: document.querySelector("#modal-share"),
  galleryPrev: document.querySelector("#gallery-prev"),
  galleryNext: document.querySelector("#gallery-next"),
  galleryDots: document.querySelector("#gallery-dots"),
  ownerEntry: document.querySelector("#owner-entry"),
  ownerPanel: document.querySelector("#owner-panel"),
  draftBadge: document.querySelector("#draft-badge"),
  ownerMessage: document.querySelector("#owner-message"),
  ownerAddItem: document.querySelector("#owner-add-item"),
  ownerImport: document.querySelector("#owner-import"),
  ownerImportFile: document.querySelector("#owner-import-file"),
  ownerExport: document.querySelector("#owner-export"),
  ownerReload: document.querySelector("#owner-reload"),
  ownerDiscard: document.querySelector("#owner-discard"),
  ownerExit: document.querySelector("#owner-exit"),
  ownerLoginModal: document.querySelector("#owner-login-modal"),
  ownerLoginForm: document.querySelector("#owner-login-form"),
  ownerPassword: document.querySelector("#owner-password"),
  ownerLoginError: document.querySelector("#owner-login-error"),
  ownerEditorModal: document.querySelector("#owner-editor-modal"),
  ownerEditorForm: document.querySelector("#owner-editor-form"),
  ownerEditorTitle: document.querySelector("#owner-editor-title"),
  ownerEditorErrors: document.querySelector("#owner-editor-errors"),
  editorName: document.querySelector("#editor-name"),
  editorId: document.querySelector("#editor-id"),
  editorCategory: document.querySelector("#editor-category"),
  editorPrice: document.querySelector("#editor-price"),
  editorStatus: document.querySelector("#editor-status"),
  editorShortNote: document.querySelector("#editor-short-note"),
  editorDescription: document.querySelector("#editor-description"),
  editorCondition: document.querySelector("#editor-condition"),
  editorDimensions: document.querySelector("#editor-dimensions"),
  editorPickup: document.querySelector("#editor-pickup"),
  editorImages: document.querySelector("#editor-images"),
  toast: document.querySelector("#toast"),
};

const formatter = new Intl.NumberFormat(SALE_CONFIG.locale, {
  style: "currency",
  currency: SALE_CONFIG.currency,
  maximumFractionDigits: 2,
});

function storageGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function storageRemove(storage, key) {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatPrice(price) {
  return typeof price === "number" ? formatter.format(price) : "Price on request";
}

function contactUrl(message) {
  return `https://wa.me/${SALE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function placeholderMarkup() {
  return `
    <div class="product-placeholder" aria-label="Photo coming soon">
      <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <rect x="13" y="17" width="54" height="46" rx="6" stroke="currentColor" stroke-width="2"/>
        <circle cx="29" cy="32" r="6" stroke="currentColor" stroke-width="2"/>
        <path d="m16 58 15-15 10 9 8-8 15 14" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>`;
}

function imageMarkup(item, index = 0) {
  const source = item.images?.[index];
  if (!source) return placeholderMarkup();
  return `<img src="${escapeHtml(source)}" alt="${escapeHtml(item.name)}, photo ${index + 1}" />`;
}

function statusClass(status) {
  return String(status).toLowerCase().replace(/\s+/g, "-");
}

function normalizeCatalogue(items) {
  return items.map((item) => ({ ...item, hidden: item.hidden === true }));
}

function validateCatalogue(value) {
  const errors = [];
  if (!Array.isArray(value)) return ["Catalogue data must be an array."];

  const ids = new Map();
  value.forEach((item, index) => {
    const label = `Item ${index + 1}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`${label} must be an object.`);
      return;
    }

    if (typeof item.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) {
      errors.push(`${label} has an invalid ID.`);
    } else if (ids.has(item.id)) {
      errors.push(`${label} duplicates ID “${item.id}” from item ${ids.get(item.id)}.`);
    } else {
      ids.set(item.id, index + 1);
    }

    if (typeof item.name !== "string" || !item.name.trim()) errors.push(`${label} needs a name.`);
    if (typeof item.category !== "string" || !item.category.trim()) errors.push(`${label} needs a category.`);
    if (item.price !== null && (typeof item.price !== "number" || !Number.isFinite(item.price) || item.price < 0)) {
      errors.push(`${label} price must be a non-negative number or null.`);
    }
    if (!VALID_STATUSES.includes(item.status)) errors.push(`${label} has an invalid status.`);
    if (!Array.isArray(item.images) || item.images.some((image) => typeof image !== "string" || !image.trim())) {
      errors.push(`${label} images must be an array of non-empty paths.`);
    }
    if (item.hidden !== undefined && typeof item.hidden !== "boolean") errors.push(`${label} hidden must be true or false.`);
    STRING_FIELDS.forEach((field) => {
      if (item[field] !== undefined && typeof item[field] !== "string") {
        errors.push(`${label} ${field} must be text.`);
      }
    });
  });
  return errors;
}

function availableItems() {
  return state.ownerUnlocked ? state.items : state.items.filter((item) => !item.hidden);
}

function filteredItems() {
  const query = state.query.trim().toLowerCase();
  const items = availableItems().filter((item) => {
    if (state.category !== "All" && item.category !== state.category) return false;
    if (state.hideSold && item.status === "Sold") return false;
    if (!query) return true;
    return [item.name, item.category, item.shortNote, item.description, item.condition, item.dimensions]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  if (state.sort === "price-low") return [...items].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  if (state.sort === "price-high") return [...items].sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  if (state.sort === "name") return [...items].sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

function renderCategories() {
  const visibleItems = availableItems();
  const categories = ["All", ...new Set(visibleItems.map((item) => item.category))];
  if (!categories.includes(state.category)) state.category = "All";
  elements.categoryRow.innerHTML = categories.map((category) => {
    const count = category === "All"
      ? visibleItems.length
      : visibleItems.filter((item) => item.category === category).length;
    return `
      <button class="category-chip ${state.category === category ? "is-active" : ""}"
        type="button" data-category="${escapeHtml(category)}">
        ${escapeHtml(category)} <small>${count}</small>
      </button>`;
  }).join("");
}

function ownerCardControls(item) {
  if (!state.ownerUnlocked) return "";
  const index = state.items.findIndex((candidate) => candidate.id === item.id);
  return `
    <div class="owner-card-actions" aria-label="Manage ${escapeHtml(item.name)}">
      <label class="sr-only" for="status-${escapeHtml(item.id)}">Status for ${escapeHtml(item.name)}</label>
      <select id="status-${escapeHtml(item.id)}" data-owner-status="${escapeHtml(item.id)}">
        ${VALID_STATUSES.map((status) => `<option${item.status === status ? " selected" : ""}>${status}</option>`).join("")}
      </select>
      <button class="owner-card-button" type="button" data-owner-action="edit" data-owner-id="${escapeHtml(item.id)}">Edit</button>
      <button class="owner-card-button" type="button" data-owner-action="duplicate" data-owner-id="${escapeHtml(item.id)}">Duplicate</button>
      <button class="owner-card-button is-wide" type="button" data-owner-action="toggle-hidden" data-owner-id="${escapeHtml(item.id)}">${item.hidden ? "Restore item" : "Hide item"}</button>
      <button class="owner-card-button" type="button" data-owner-action="move-up" data-owner-id="${escapeHtml(item.id)}" ${index === 0 ? "disabled" : ""} aria-label="Move ${escapeHtml(item.name)} up">↑ Up</button>
      <button class="owner-card-button" type="button" data-owner-action="move-down" data-owner-id="${escapeHtml(item.id)}" ${index === state.items.length - 1 ? "disabled" : ""} aria-label="Move ${escapeHtml(item.name)} down">↓ Down</button>
    </div>`;
}

function renderCatalogue() {
  const items = filteredItems();
  elements.resultCount.textContent = items.length;
  elements.emptyState.hidden = items.length !== 0;
  elements.grid.hidden = items.length === 0;
  elements.grid.innerHTML = items.map((item) => `
    <article class="product-card ${item.status === "Sold" ? "is-sold" : ""} ${item.hidden ? "is-hidden" : ""}">
      <button class="product-image-button" type="button" data-item-id="${escapeHtml(item.id)}"
        aria-label="View ${escapeHtml(item.name)}">
        ${imageMarkup(item)}
        <span class="status-pill card-status ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
        ${item.hidden ? '<span class="hidden-badge">Hidden</span>' : ""}
        ${(item.images?.length || 0) > 1 ? `<span class="photo-count">${item.images.length} photos</span>` : ""}
      </button>
      <div class="product-info">
        <div class="product-topline">
          <div>
            <p class="product-category">${escapeHtml(item.category)}</p>
            <button class="product-title" type="button" data-item-id="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button>
          </div>
          <p class="product-price">${formatPrice(item.price)}</p>
        </div>
        <p class="product-note">${escapeHtml(item.shortNote || item.description)}</p>
        ${ownerCardControls(item)}
      </div>
    </article>`).join("");
}

function renderOwnerState() {
  elements.ownerPanel.hidden = !state.ownerUnlocked;
  elements.ownerEntry.textContent = state.ownerUnlocked ? "Owner workspace" : "Owner mode";
  elements.draftBadge.textContent = state.hasInvalidDraft
    ? "Saved draft needs attention"
    : state.hasDraft ? "Unpublished changes" : "Published catalogue";
  elements.draftBadge.classList.toggle("has-draft", state.hasDraft);
  elements.ownerDiscard.disabled = !state.hasDraft;
}

function renderAll() {
  renderOwnerState();
  renderCategories();
  renderCatalogue();
}

function itemMessage(item) {
  return `Hi! I’m interested in “${item.name}” (${formatPrice(item.price)}). Is it still available? ${itemUrl(item)}`;
}

function itemUrl(item) {
  return `${window.location.origin}${window.location.pathname}#${item.id}`;
}

function focusableElements(container) {
  return [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length > 0);
}

function openDialog(backdrop, initialFocus, trigger = document.activeElement) {
  state.activeDialog = backdrop;
  state.dialogReturnFocus = trigger instanceof HTMLElement ? trigger : null;
  backdrop.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => initialFocus?.focus());
}

function closeDialog(backdrop) {
  if (backdrop.hidden) return;
  backdrop.hidden = true;
  document.body.classList.remove("modal-open");
  state.activeDialog = null;
  const returnFocus = state.dialogReturnFocus;
  state.dialogReturnFocus = null;
  if (returnFocus?.isConnected) returnFocus.focus();
}

function renderModalImage() {
  const item = state.selectedItem;
  if (!item) return;
  const imageCount = item.images?.length || 0;
  elements.modalMainImage.innerHTML = imageMarkup(item, state.galleryIndex);
  elements.galleryPrev.hidden = imageCount < 2;
  elements.galleryNext.hidden = imageCount < 2;
  elements.galleryDots.hidden = imageCount < 2;
  elements.galleryDots.innerHTML = Array.from({ length: imageCount }, (_, index) => `
    <button class="${index === state.galleryIndex ? "is-active" : ""}"
      type="button" data-gallery-index="${index}" aria-label="View photo ${index + 1}"></button>
  `).join("");
}

function openItem(item, updateHash = true, trigger = document.activeElement) {
  state.selectedItem = item;
  state.galleryIndex = 0;
  elements.modalCategory.textContent = item.category;
  elements.modalStatus.textContent = item.status;
  elements.modalStatus.className = `status-pill ${statusClass(item.status)}`;
  elements.modalTitle.textContent = item.name;
  elements.modalPrice.textContent = formatPrice(item.price);
  elements.modalDescription.textContent = item.description || item.shortNote || "";

  const facts = [
    ["Condition", item.condition],
    ["Dimensions", item.dimensions],
    ["Collection", item.pickup || SALE_CONFIG.pickupArea],
  ].filter(([, value]) => value);
  elements.modalFacts.innerHTML = facts.map(([label, value]) => `
    <div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>
  `).join("");

  elements.modalContact.textContent = item.status === "Sold" ? "This item is sold" : "I’m interested";
  elements.modalContact.href = item.status === "Sold" ? "#" : contactUrl(itemMessage(item));
  elements.modalContact.setAttribute("aria-disabled", item.status === "Sold" ? "true" : "false");
  elements.modalContact.onclick = item.status === "Sold" ? preventLink : null;

  renderModalImage();
  openDialog(elements.modal, elements.modalClose, trigger);
  if (updateHash) history.replaceState(null, "", `#${item.id}`);
}

function preventLink(event) {
  event.preventDefault();
}

function closeItem({ clearHash = true } = {}) {
  state.selectedItem = null;
  closeDialog(elements.modal);
  if (clearHash) history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

function changeGallery(direction) {
  const count = state.selectedItem?.images?.length || 0;
  if (count < 2) return;
  state.galleryIndex = (state.galleryIndex + direction + count) % count;
  renderModalImage();
}

let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimeout = setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
}

async function shareSelectedItem() {
  const item = state.selectedItem;
  if (!item) return;
  const shareData = {
    title: `${item.name} — September Move-Out Sale`,
    text: `${item.name} · ${formatPrice(item.price)} · ${item.status}`,
    url: itemUrl(item),
  };

  if (navigator.share) {
    try { await navigator.share(shareData); } catch { /* Share was cancelled. */ }
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(shareData.url);
    showToast("Item link copied");
  } else {
    window.prompt("Copy this item link:", shareData.url);
  }
}

function resetFilters() {
  state.category = "All";
  state.query = "";
  state.hideSold = false;
  state.sort = "featured";
  elements.search.value = "";
  elements.hideSold.checked = false;
  elements.sort.value = "featured";
  renderAll();
}

function applyConfig() {
  document.querySelectorAll("[data-pickup-area]").forEach((node) => { node.textContent = SALE_CONFIG.pickupArea; });
  document.querySelectorAll("[data-pickup-dates]").forEach((node) => { node.textContent = SALE_CONFIG.pickupDates; });
  document.querySelectorAll("[data-contact-link]").forEach((link) => {
    link.href = contactUrl(SALE_CONFIG.generalMessage);
    link.target = "_blank";
    link.rel = "noreferrer";
  });
}

function showOwnerMessage(message, isError = false) {
  elements.ownerMessage.textContent = message;
  elements.ownerMessage.style.color = isError ? "#8b211a" : "";
}

function readStoredDraft() {
  const raw = storageGet(localStorage, DRAFT_STORAGE_KEY);
  if (!raw) return { items: null, exists: false, invalid: false };
  try {
    const stored = JSON.parse(raw);
    if (stored?.version !== 1 || !Array.isArray(stored.items)) throw new Error("Unsupported draft format.");
    const errors = validateCatalogue(stored.items);
    if (errors.length) throw new Error(errors.join(" "));
    return { items: normalizeCatalogue(stored.items), exists: true, invalid: false };
  } catch (error) {
    showOwnerMessage(`The saved draft could not be loaded: ${error.message}`, true);
    return { items: null, exists: true, invalid: true };
  }
}

function persistDraft(message = "Draft saved in this browser.") {
  if (state.hasInvalidDraft && !window.confirm("The existing saved draft is invalid and cannot be loaded. Replace it with the current catalogue?")) {
    showOwnerMessage("The invalid saved draft was kept unchanged.", true);
    return false;
  }
  const errors = validateCatalogue(state.items);
  if (errors.length) {
    showOwnerMessage(`Draft was not saved: ${errors.join(" ")}`, true);
    return false;
  }
  const value = JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), items: state.items });
  if (!storageSet(localStorage, DRAFT_STORAGE_KEY, value)) {
    showOwnerMessage("Draft could not be saved. Browser storage may be unavailable or full.", true);
    return false;
  }
  state.hasDraft = true;
  state.hasInvalidDraft = false;
  showOwnerMessage(message);
  renderAll();
  return true;
}

function activateOwnerWorkspace() {
  const draft = readStoredDraft();
  state.hasDraft = draft.exists;
  state.hasInvalidDraft = draft.invalid;
  state.items = draft.items || clone(state.publishedItems);
  state.ownerUnlocked = true;
  renderAll();
}

function openOwnerLogin() {
  if (state.ownerUnlocked) {
    elements.ownerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    elements.ownerAddItem.focus({ preventScroll: true });
    return;
  }
  elements.ownerLoginForm.reset();
  elements.ownerLoginError.textContent = "";
  elements.ownerPassword.removeAttribute("aria-invalid");
  openDialog(elements.ownerLoginModal, elements.ownerPassword, elements.ownerEntry);
}

function unlockOwner(event) {
  event.preventDefault();
  if (elements.ownerPassword.value !== OWNER_CONFIG.password) {
    elements.ownerLoginError.textContent = "That password is incorrect.";
    elements.ownerPassword.setAttribute("aria-invalid", "true");
    elements.ownerPassword.focus();
    return;
  }
  storageSet(sessionStorage, OWNER_SESSION_KEY, "true");
  closeDialog(elements.ownerLoginModal);
  activateOwnerWorkspace();
  if (!state.hasInvalidDraft) {
    showOwnerMessage(state.hasDraft ? "Your saved local draft has been restored." : "Owner mode unlocked. Edits will create a local draft.");
  }
  elements.ownerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitOwnerMode() {
  storageRemove(sessionStorage, OWNER_SESSION_KEY);
  state.ownerUnlocked = false;
  state.items = clone(state.publishedItems);
  state.hasDraft = Boolean(storageGet(localStorage, DRAFT_STORAGE_KEY));
  state.hasInvalidDraft = false;
  showOwnerMessage("");
  resetFilters();
  elements.ownerEntry.focus();
}

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "new-item";
}

function uniqueId(base, excludedId = null) {
  const ids = new Set(state.items.filter((item) => item.id !== excludedId).map((item) => item.id));
  if (!ids.has(base)) return base;
  let suffix = 2;
  while (ids.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function setEditorValue(element, value = "") {
  element.value = value ?? "";
  element.removeAttribute("aria-invalid");
}

function openEditor(item = null, trigger = document.activeElement) {
  state.editingOriginalId = item?.id || null;
  state.editingBase = item ? clone(item) : {};
  state.editorIdTouched = Boolean(item);
  elements.ownerEditorTitle.textContent = item ? `Edit ${item.name}` : "Add item";
  elements.ownerEditorErrors.textContent = "";
  setEditorValue(elements.editorName, item?.name);
  setEditorValue(elements.editorId, item?.id);
  setEditorValue(elements.editorCategory, item?.category);
  setEditorValue(elements.editorPrice, item?.price);
  setEditorValue(elements.editorStatus, item?.status || "Available");
  setEditorValue(elements.editorShortNote, item?.shortNote);
  setEditorValue(elements.editorDescription, item?.description);
  setEditorValue(elements.editorCondition, item?.condition);
  setEditorValue(elements.editorDimensions, item?.dimensions);
  setEditorValue(elements.editorPickup, item?.pickup);
  setEditorValue(elements.editorImages, item?.images?.join("\n"));
  openDialog(elements.ownerEditorModal, elements.editorName, trigger);
}

function displayEditorErrors(errors, invalidFields = []) {
  [elements.editorName, elements.editorId, elements.editorCategory, elements.editorPrice]
    .forEach((field) => field.removeAttribute("aria-invalid"));
  invalidFields.forEach((field) => field.setAttribute("aria-invalid", "true"));
  elements.ownerEditorErrors.textContent = errors.join(" ");
  elements.ownerEditorErrors.focus();
}

function saveEditor(event) {
  event.preventDefault();
  const name = elements.editorName.value.trim();
  const id = elements.editorId.value.trim();
  const category = elements.editorCategory.value.trim();
  const priceText = elements.editorPrice.value.trim();
  const errors = [];
  const invalidFields = [];

  if (!name) { errors.push("Name is required."); invalidFields.push(elements.editorName); }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    errors.push("ID must use lowercase letters, numbers, and single hyphens.");
    invalidFields.push(elements.editorId);
  } else if (state.items.some((item) => item.id === id && item.id !== state.editingOriginalId)) {
    errors.push("ID must be unique.");
    invalidFields.push(elements.editorId);
  }
  if (!category) { errors.push("Category is required."); invalidFields.push(elements.editorCategory); }
  const price = priceText === "" ? null : Number(priceText);
  if (priceText !== "" && (!Number.isFinite(price) || price < 0)) {
    errors.push("Price must be zero or more, or left blank.");
    invalidFields.push(elements.editorPrice);
  }
  if (errors.length) {
    displayEditorErrors(errors, invalidFields);
    return;
  }

  const updatedItem = {
    ...state.editingBase,
    id,
    name,
    category,
    price,
    status: elements.editorStatus.value,
    shortNote: elements.editorShortNote.value.trim(),
    description: elements.editorDescription.value.trim(),
    condition: elements.editorCondition.value.trim(),
    dimensions: elements.editorDimensions.value.trim(),
    pickup: elements.editorPickup.value.trim(),
    images: elements.editorImages.value.split(/\r?\n/).map((path) => path.trim()).filter(Boolean),
    hidden: state.editingBase.hidden === true,
  };
  const candidate = clone(state.items);
  const index = candidate.findIndex((item) => item.id === state.editingOriginalId);
  if (index >= 0) candidate[index] = updatedItem;
  else candidate.push(updatedItem);
  const catalogueErrors = validateCatalogue(candidate);
  if (catalogueErrors.length) {
    displayEditorErrors(catalogueErrors);
    return;
  }

  const previousItems = state.items;
  state.items = candidate;
  if (persistDraft(index >= 0 ? `Changes to “${name}” saved locally.` : `“${name}” added to the local draft.`)) {
    closeDialog(elements.ownerEditorModal);
    if (index >= 0) {
      document.querySelector(`[data-owner-action="edit"][data-owner-id="${CSS.escape(updatedItem.id)}"]`)?.focus();
    }
  } else {
    state.items = previousItems;
  }
}

function duplicateItem(item) {
  const previousItems = clone(state.items);
  const copy = clone(item);
  copy.id = uniqueId(`${item.id}-copy`);
  copy.name = `${item.name} copy`;
  copy.hidden = false;
  const index = state.items.findIndex((candidate) => candidate.id === item.id);
  state.items.splice(index + 1, 0, copy);
  if (!persistDraft(`“${item.name}” duplicated. Review the copy before exporting.`)) {
    state.items = previousItems;
    renderAll();
  }
}

function mutateItem(id, action) {
  const index = state.items.findIndex((item) => item.id === id);
  if (index < 0) return;
  const previousItems = clone(state.items);
  action(state.items[index], index);
  if (!persistDraft()) {
    state.items = previousItems;
    renderAll();
  }
}

function handleOwnerAction(button) {
  const item = state.items.find((candidate) => candidate.id === button.dataset.ownerId);
  if (!item) return;
  switch (button.dataset.ownerAction) {
    case "edit":
      openEditor(item, button);
      break;
    case "duplicate":
      duplicateItem(item);
      break;
    case "toggle-hidden":
      mutateItem(item.id, (target) => { target.hidden = !target.hidden; });
      break;
    case "move-up":
      mutateItem(item.id, (_, index) => {
        if (index > 0) [state.items[index - 1], state.items[index]] = [state.items[index], state.items[index - 1]];
      });
      break;
    case "move-down":
      mutateItem(item.id, (_, index) => {
        if (index < state.items.length - 1) [state.items[index], state.items[index + 1]] = [state.items[index + 1], state.items[index]];
      });
      break;
    default:
      break;
  }
}

async function importCatalogue(file) {
  const previousItems = clone(state.items);
  const previousHasDraft = state.hasDraft;
  const previousHasInvalidDraft = state.hasInvalidDraft;
  try {
    const parsed = JSON.parse(await file.text());
    const errors = validateCatalogue(parsed);
    if (errors.length) throw new Error(errors.slice(0, 8).join(" "));
    if (state.hasDraft && !window.confirm("Replace the current local draft with this imported catalogue? The existing draft cannot be recovered from this browser.")) return;
    state.hasInvalidDraft = false;
    state.items = normalizeCatalogue(clone(parsed));
    if (persistDraft(`Imported ${state.items.length} items into the local draft.`)) {
      resetFilters();
    } else {
      state.items = previousItems;
      state.hasDraft = previousHasDraft;
      state.hasInvalidDraft = previousHasInvalidDraft;
      renderAll();
    }
  } catch (error) {
    state.items = previousItems;
    state.hasDraft = previousHasDraft;
    state.hasInvalidDraft = previousHasInvalidDraft;
    showOwnerMessage(`Import failed. The current draft was kept. ${error.message}`, true);
  } finally {
    elements.ownerImportFile.value = "";
  }
}

function exportCatalogue() {
  const errors = validateCatalogue(state.items);
  if (errors.length) {
    showOwnerMessage(`Export blocked: ${errors.join(" ")}`, true);
    return;
  }
  const blob = new Blob([`${JSON.stringify(state.items, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "catalog.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showOwnerMessage("Exported catalog.json. Replace the repository file, review the Git change, then commit and push to publish.");
}

async function fetchPublishedCatalogue() {
  const response = await fetch(`catalog.json?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load catalogue (${response.status})`);
  const catalogue = await response.json();
  const errors = validateCatalogue(catalogue);
  if (errors.length) throw new Error(errors.join(" "));
  return normalizeCatalogue(catalogue);
}

async function reloadPublishedCatalogue() {
  try {
    state.publishedItems = await fetchPublishedCatalogue();
    if (!state.hasDraft) state.items = clone(state.publishedItems);
    renderAll();
    showOwnerMessage(state.hasDraft
      ? "Published catalogue reloaded for reference. Your local draft was kept unchanged."
      : "Published catalogue reloaded.");
  } catch (error) {
    showOwnerMessage(`Published catalogue could not be reloaded: ${error.message}`, true);
  }
}

function discardDraft() {
  if (!state.hasDraft) return;
  if (!window.confirm("Discard all unpublished changes and return to the published catalogue? This cannot be undone.")) return;
  if (!storageRemove(localStorage, DRAFT_STORAGE_KEY)) {
    showOwnerMessage("The draft could not be removed from browser storage.", true);
    return;
  }
  state.hasDraft = false;
  state.hasInvalidDraft = false;
  state.items = clone(state.publishedItems);
  resetFilters();
  showOwnerMessage("Local draft discarded. You are viewing the published catalogue.");
}

function closeOwnerModal(kind) {
  if (kind === "login") closeDialog(elements.ownerLoginModal);
  if (kind === "editor") closeDialog(elements.ownerEditorModal);
}

function handleGlobalKeydown(event) {
  const dialog = state.activeDialog;
  if (!dialog) return;
  if (event.key === "Escape") {
    event.preventDefault();
    if (dialog === elements.modal) closeItem();
    else closeDialog(dialog);
    return;
  }
  if (dialog === elements.modal && event.key === "ArrowLeft") changeGallery(-1);
  if (dialog === elements.modal && event.key === "ArrowRight") changeGallery(1);
  if (event.key !== "Tab") return;
  const focusable = focusableElements(dialog);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function bindEvents() {
  elements.search.addEventListener("input", (event) => { state.query = event.target.value; renderCatalogue(); });
  elements.sort.addEventListener("change", (event) => { state.sort = event.target.value; renderCatalogue(); });
  elements.hideSold.addEventListener("change", (event) => { state.hideSold = event.target.checked; renderCatalogue(); });
  elements.resetFilters.addEventListener("click", resetFilters);
  elements.categoryRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderAll();
  });
  elements.grid.addEventListener("click", (event) => {
    const ownerButton = event.target.closest("[data-owner-action]");
    if (ownerButton) {
      handleOwnerAction(ownerButton);
      return;
    }
    const button = event.target.closest("[data-item-id]");
    if (!button) return;
    const item = state.items.find((candidate) => candidate.id === button.dataset.itemId);
    if (item) openItem(item, true, button);
  });
  elements.grid.addEventListener("change", (event) => {
    const select = event.target.closest("[data-owner-status]");
    if (!select) return;
    mutateItem(select.dataset.ownerStatus, (item) => { item.status = select.value; });
  });
  elements.modalClose.addEventListener("click", () => closeItem());
  elements.modal.addEventListener("click", (event) => { if (event.target === elements.modal) closeItem(); });
  elements.galleryPrev.addEventListener("click", () => changeGallery(-1));
  elements.galleryNext.addEventListener("click", () => changeGallery(1));
  elements.galleryDots.addEventListener("click", (event) => {
    const button = event.target.closest("[data-gallery-index]");
    if (!button) return;
    state.galleryIndex = Number(button.dataset.galleryIndex);
    renderModalImage();
  });
  elements.modalShare.addEventListener("click", shareSelectedItem);
  elements.ownerEntry.addEventListener("click", openOwnerLogin);
  elements.ownerLoginForm.addEventListener("submit", unlockOwner);
  elements.ownerAddItem.addEventListener("click", (event) => openEditor(null, event.currentTarget));
  elements.ownerImport.addEventListener("click", () => elements.ownerImportFile.click());
  elements.ownerImportFile.addEventListener("change", () => {
    const [file] = elements.ownerImportFile.files;
    if (file) importCatalogue(file);
  });
  elements.ownerExport.addEventListener("click", exportCatalogue);
  elements.ownerReload.addEventListener("click", reloadPublishedCatalogue);
  elements.ownerDiscard.addEventListener("click", discardDraft);
  elements.ownerExit.addEventListener("click", exitOwnerMode);
  elements.editorName.addEventListener("input", () => {
    if (!state.editingOriginalId && !state.editorIdTouched) {
      elements.editorId.value = uniqueId(slugify(elements.editorName.value));
    }
  });
  elements.editorId.addEventListener("input", () => { state.editorIdTouched = true; });
  elements.ownerEditorForm.addEventListener("submit", saveEditor);
  document.querySelectorAll("[data-owner-close]").forEach((button) => {
    button.addEventListener("click", () => closeOwnerModal(button.dataset.ownerClose));
  });
  [elements.ownerLoginModal, elements.ownerEditorModal].forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeDialog(backdrop); });
  });
  window.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("hashchange", openItemFromHash);
}

function openItemFromHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return;
  const item = state.items.find((candidate) => candidate.id === id && (state.ownerUnlocked || !candidate.hidden));
  if (item) openItem(item, false, null);
}

async function initialize() {
  applyConfig();
  bindEvents();
  try {
    state.publishedItems = await fetchPublishedCatalogue();
    if (state.ownerUnlocked) activateOwnerWorkspace();
    else state.items = clone(state.publishedItems);
    renderAll();
    openItemFromHash();
  } catch (error) {
    elements.alert.hidden = false;
    elements.alert.textContent = `${error.message}. Open this site through a local web server rather than directly as a file.`;
  }
}

initialize();
