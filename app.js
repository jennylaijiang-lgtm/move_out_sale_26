const SALE_CONFIG = {
  pickupArea: "Amsterdam",
  pickupDates: "1–30 September 2026",
  currency: "EUR",
  locale: "en-NL",
  // Replace this with your full international number, without +, spaces, or dashes.
  whatsappNumber: "31612345678",
  generalMessage: "Hi! I have a question about your September move-out sale.",
};

const state = {
  items: [],
  category: "All",
  query: "",
  hideSold: false,
  sort: "featured",
  selectedItem: null,
  galleryIndex: 0,
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
  toast: document.querySelector("#toast"),
};

const formatter = new Intl.NumberFormat(SALE_CONFIG.locale, {
  style: "currency",
  currency: SALE_CONFIG.currency,
  maximumFractionDigits: 2,
});

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

function filteredItems() {
  const query = state.query.trim().toLowerCase();
  const items = state.items.filter((item) => {
    if (state.category !== "All" && item.category !== state.category) return false;
    if (state.hideSold && item.status === "Sold") return false;
    if (!query) return true;
    return [item.name, item.category, item.description, item.condition, item.dimensions]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  if (state.sort === "price-low") {
    return [...items].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  }
  if (state.sort === "price-high") {
    return [...items].sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  }
  if (state.sort === "name") {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }
  return items;
}

function renderCategories() {
  const categories = ["All", ...new Set(state.items.map((item) => item.category))];
  elements.categoryRow.innerHTML = categories.map((category) => {
    const count = category === "All"
      ? state.items.length
      : state.items.filter((item) => item.category === category).length;
    return `
      <button class="category-chip ${state.category === category ? "is-active" : ""}"
        type="button" data-category="${escapeHtml(category)}">
        ${escapeHtml(category)} <small>${count}</small>
      </button>`;
  }).join("");
}

function renderCatalogue() {
  const items = filteredItems();
  elements.resultCount.textContent = items.length;
  elements.emptyState.hidden = items.length !== 0;
  elements.grid.hidden = items.length === 0;
  elements.grid.innerHTML = items.map((item) => `
    <article class="product-card ${item.status === "Sold" ? "is-sold" : ""}">
      <button class="product-image-button" type="button" data-item-id="${escapeHtml(item.id)}"
        aria-label="View ${escapeHtml(item.name)}">
        ${imageMarkup(item)}
        <span class="status-pill card-status ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
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
      </div>
    </article>`).join("");
}

function renderAll() {
  renderCategories();
  renderCatalogue();
}

function itemMessage(item) {
  return `Hi! I’m interested in “${item.name}” (${formatPrice(item.price)}). Is it still available? ${itemUrl(item)}`;
}

function itemUrl(item) {
  return `${window.location.origin}${window.location.pathname}#${item.id}`;
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

function openItem(item, updateHash = true) {
  state.selectedItem = item;
  state.galleryIndex = 0;
  elements.modalCategory.textContent = item.category;
  elements.modalStatus.textContent = item.status;
  elements.modalStatus.className = `status-pill ${statusClass(item.status)}`;
  elements.modalTitle.textContent = item.name;
  elements.modalPrice.textContent = formatPrice(item.price);
  elements.modalDescription.textContent = item.description;

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
  elements.modal.hidden = false;
  document.body.classList.add("modal-open");
  elements.modalClose.focus();
  if (updateHash) history.replaceState(null, "", `#${item.id}`);
}

function preventLink(event) {
  event.preventDefault();
}

function closeItem({ clearHash = true } = {}) {
  state.selectedItem = null;
  elements.modal.hidden = true;
  document.body.classList.remove("modal-open");
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
    const button = event.target.closest("[data-item-id]");
    if (!button) return;
    const item = state.items.find((candidate) => candidate.id === button.dataset.itemId);
    if (item) openItem(item);
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
  window.addEventListener("keydown", (event) => {
    if (elements.modal.hidden) return;
    if (event.key === "Escape") closeItem();
    if (event.key === "ArrowLeft") changeGallery(-1);
    if (event.key === "ArrowRight") changeGallery(1);
  });
  window.addEventListener("hashchange", openItemFromHash);
}

function openItemFromHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return;
  const item = state.items.find((candidate) => candidate.id === id);
  if (item) openItem(item, false);
}

async function initialize() {
  applyConfig();
  bindEvents();
  try {
    const response = await fetch(`catalog.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load catalogue (${response.status})`);
    const catalogue = await response.json();
    if (!Array.isArray(catalogue)) throw new Error("Catalogue data must be an array.");
    state.items = catalogue;
    renderAll();
    openItemFromHash();
  } catch (error) {
    elements.alert.hidden = false;
    elements.alert.textContent = `${error.message}. Open this site through a local web server rather than directly as a file.`;
  }
}

initialize();
