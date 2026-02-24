const STORAGE_KEY = "responsiveInvoiceDataV1";

const itemsBody = document.getElementById("itemsBody");
const addItemBtn = document.getElementById("addItemBtn");
const subtotalValue = document.getElementById("subtotalValue");
const totalValue = document.getElementById("totalValue");
const invoiceDate = document.getElementById("invoiceDate");
const dueDate = document.getElementById("dueDate");
const invoiceNo = document.getElementById("invoiceNo");
const invoiceTitle = document.getElementById("invoiceTitle");
const fromBlock = document.getElementById("fromBlock");
const toBlock = document.getElementById("toBlock");
const notesBlock = document.getElementById("notesBlock");
const logoInput = document.getElementById("logoInput");
const logoPreview = document.getElementById("logoPreview");
const previewBtn = document.getElementById("previewBtn");
const previewModal = document.getElementById("previewModal");
const previewBackdrop = document.getElementById("previewBackdrop");
const previewContainer = document.getElementById("previewContainer");
const closePreviewBtn = document.getElementById("closePreviewBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const saveInvoiceBtn = document.getElementById("saveInvoiceBtn");
const loadInvoiceBtn = document.getElementById("loadInvoiceBtn");
const resetTemplateBtn = document.getElementById("resetTemplateBtn");
const saveStatus = document.getElementById("saveStatus");

let currentLogoData = "";
let activeStorage = null;
let autosaveTimer = null;

function detectStorage() {
  const candidates = [
    { engine: window.localStorage, name: "localStorage" },
    { engine: window.sessionStorage, name: "sessionStorage" }
  ];

  for (const candidate of candidates) {
    try {
      const probeKey = `${STORAGE_KEY}_probe`;
      candidate.engine.setItem(probeKey, "ok");
      candidate.engine.removeItem(probeKey);
      return candidate;
    } catch (error) {
      continue;
    }
  }

  return null;
}

function parseNumber(value) {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

function parseMoney(value) {
  let sanitized = String(value || "").replace(/[^0-9,.-]/g, "");
  if (sanitized.includes(",")) {
    sanitized = sanitized.replace(/\./g, "").replace(/,/g, ".");
  } else {
    const dotCount = (sanitized.match(/\./g) || []).length;
    if (dotCount > 1) {
      sanitized = sanitized.replace(/\./g, "");
    }
  }
  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberId(amount) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatMoney(amount) {
  return `Rp. ${formatNumberId(amount)}`;
}

function generateInvoiceNumber(dateValue = "") {
  const date = dateValue ? new Date(dateValue) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");
  const sequence = String(Math.floor(100 + Math.random() * 900));
  return `INV-${year}${month}${day}-${sequence}`;
}

function setStatus(message, isError = false) {
  saveStatus.textContent = message;
  saveStatus.style.color = isError ? "#c03848" : "#617084";
}

function setLogoFromDataUrl(dataUrl) {
  currentLogoData = dataUrl || "";
  logoPreview.innerHTML = "";

  if (currentLogoData) {
    const image = document.createElement("img");
    image.src = currentLogoData;
    image.alt = "Logo perusahaan";
    logoPreview.appendChild(image);
    return;
  }

  const fallback = document.createElement("span");
  fallback.textContent = "LOGO";
  logoPreview.appendChild(fallback);
}

function createRow(description = "Jasa desain", qty = 1, price = 150000, skipRecalculate = false) {
  const row = document.createElement("tr");

  const descCell = document.createElement("td");
  const descInput = document.createElement("input");
  descInput.type = "text";
  descInput.className = "desc";
  descInput.value = String(description);
  descCell.appendChild(descInput);

  const qtyCell = document.createElement("td");
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.className = "qty";
  qtyInput.min = "0";
  qtyInput.step = "1";
  qtyInput.value = String(qty);
  qtyCell.appendChild(qtyInput);

  const priceCell = document.createElement("td");
  const priceInput = document.createElement("input");
  priceInput.type = "text";
  priceInput.className = "price";
  priceInput.inputMode = "decimal";
  priceInput.value = formatMoney(parseNumber(price));
  priceCell.appendChild(priceInput);

  const totalCell = document.createElement("td");
  totalCell.className = "row-total";
  totalCell.textContent = formatMoney(0);

  const actionCell = document.createElement("td");
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-item";
  removeButton.textContent = "Hapus";
  actionCell.appendChild(removeButton);

  row.appendChild(descCell);
  row.appendChild(qtyCell);
  row.appendChild(priceCell);
  row.appendChild(totalCell);
  row.appendChild(actionCell);

  [descInput, qtyInput, priceInput].forEach((input) => {
    input.addEventListener("input", () => {
      recalculate();
      queueAutosave();
    });
  });

  priceInput.addEventListener("blur", () => {
    priceInput.value = formatMoney(parseMoney(priceInput.value));
    recalculate();
    queueAutosave();
  });

  removeButton.addEventListener("click", () => {
    row.remove();
    if (!itemsBody.querySelector("tr")) {
      createRow("Item baru", 1, 0);
    }
    recalculate();
    queueAutosave();
  });

  itemsBody.appendChild(row);
  if (!skipRecalculate) {
    recalculate();
  }
}

function recalculate() {
  let subtotal = 0;
  const rows = Array.from(itemsBody.querySelectorAll("tr"));

  rows.forEach((row) => {
    const qty = parseNumber(row.querySelector(".qty").value);
    const price = parseMoney(row.querySelector(".price").value);
    const lineTotal = qty * price;
    subtotal += lineTotal;
    row.querySelector(".row-total").textContent = formatMoney(lineTotal);
  });

  subtotalValue.textContent = formatMoney(subtotal);
  totalValue.textContent = formatMoney(subtotal);
}

function toDateInputValue(date) {
  return date.toISOString().split("T")[0];
}

function buildDefaultInvoiceData() {
  const today = new Date();
  const due = new Date(today);
  due.setDate(today.getDate() + 15);

  return {
    title: "Faktur",
    invoiceNo: generateInvoiceNumber(toDateInputValue(today)),
    invoiceDate: toDateInputValue(today),
    dueDate: toDateInputValue(due),
    fromBlock: "Perusahaan Anda\nAlamat Jalan\nKota, Indonesia\nhalo@perusahaan.com",
    toBlock: "Nama Klien\nPerusahaan Klien\nAlamat Klien\nemail@klien.com",
    notes: "Terima kasih atas kerja samanya.",
    logoData: "",
    items: [
      { description: "Desain website", qty: 1, price: 6800000 },
      { description: "Hosting bulanan", qty: 2, price: 450000 }
    ]
  };
}

function clearRows() {
  itemsBody.innerHTML = "";
}

function applyInvoiceData(data) {
  invoiceTitle.textContent = String(data.title || "Faktur");
  invoiceNo.value = String(data.invoiceNo || generateInvoiceNumber(data.invoiceDate));
  invoiceDate.value = String(data.invoiceDate || "");
  dueDate.value = String(data.dueDate || "");
  fromBlock.value = String(data.fromBlock || "");
  toBlock.value = String(data.toBlock || "");
  notesBlock.value = String(data.notes || "");

  clearRows();
  const safeItems = Array.isArray(data.items) && data.items.length > 0
    ? data.items
    : [{ description: "Item baru", qty: 1, price: 0 }];

  safeItems.forEach((item) => {
    createRow(
      String(item.description || "Item baru"),
      parseNumber(item.qty),
      parseMoney(item.price),
      true
    );
  });

  setLogoFromDataUrl(String(data.logoData || ""));
  logoInput.value = "";
  recalculate();
}

function collectItems() {
  const rows = Array.from(itemsBody.querySelectorAll("tr"));
  return rows.map((row) => ({
    description: row.querySelector(".desc").value,
    qty: parseNumber(row.querySelector(".qty").value),
    price: parseMoney(row.querySelector(".price").value)
  }));
}

function getInvoiceData() {
  return {
    title: invoiceTitle.textContent.trim() || "Faktur",
    invoiceNo: invoiceNo.value,
    invoiceDate: invoiceDate.value,
    dueDate: dueDate.value,
    fromBlock: fromBlock.value,
    toBlock: toBlock.value,
    notes: notesBlock.value,
    logoData: currentLogoData,
    items: collectItems()
  };
}

function saveInvoice() {
  if (!activeStorage) {
    setStatus("Gagal menyimpan. Browser memblokir penyimpanan.", true);
    return;
  }

  try {
    activeStorage.engine.setItem(STORAGE_KEY, JSON.stringify(getInvoiceData()));
    const storageName = activeStorage.name === "localStorage" ? "localStorage" : "sessionStorage";
    setStatus(`Berhasil disimpan di ${storageName}.`);
  } catch (error) {
    setStatus("Gagal menyimpan. Kapasitas penyimpanan mungkin penuh.", true);
  }
}

function loadInvoice() {
  if (!activeStorage) {
    setStatus("Gagal memuat. Browser memblokir penyimpanan.", true);
    return false;
  }

  try {
    const raw = activeStorage.engine.getItem(STORAGE_KEY);
    if (!raw) {
      setStatus("Belum ada data faktur tersimpan.", true);
      return false;
    }

    const data = JSON.parse(raw);
    applyInvoiceData(data);
    setStatus("Data faktur berhasil dimuat.");
    return true;
  } catch (error) {
    setStatus("Gagal memuat data. Data tersimpan mungkin tidak valid.", true);
    return false;
  }
}

function queueAutosave() {
  if (autosaveTimer) {
    window.clearTimeout(autosaveTimer);
  }

  autosaveTimer = window.setTimeout(() => {
    saveInvoice();
  }, 500);
}

function resetTemplate() {
  applyInvoiceData(buildDefaultInvoiceData());
  setStatus("Template berhasil direset.");
}

function buildOutputMarkup(forExport = false) {
  const markup = document.querySelector(".invoice-card").cloneNode(true);

  const actions = markup.querySelector(".invoice-actions");
  if (actions) {
    actions.remove();
  }

  const addItem = markup.querySelector("#addItemBtn");
  if (addItem) {
    addItem.remove();
  }

  markup.querySelectorAll(".remove-item").forEach((button) => {
    button.remove();
  });

  if (forExport) {
    markup.classList.add("export-card");
  }

  return markup;
}

function applyExportScale(markup) {
  const a4PortraitHeightPx = 1122;
  const safetyPaddingPx = 60;
  const targetHeight = a4PortraitHeightPx - safetyPaddingPx;
  const measuredHeight = markup.scrollHeight;

  if (!measuredHeight || measuredHeight <= targetHeight) {
    markup.style.setProperty("--export-scale", "1");
    return;
  }

  const computedScale = targetHeight / measuredHeight;
  const clampedScale = Math.max(0.72, Math.min(1, computedScale));
  markup.style.setProperty("--export-scale", clampedScale.toFixed(3));
}

function openPreview() {
  const previewMarkup = buildOutputMarkup(false);

  previewContainer.innerHTML = "";
  previewContainer.appendChild(previewMarkup);
  previewModal.hidden = false;
  setStatus("Pratinjau ditampilkan.");
}

function closePreview() {
  previewModal.hidden = true;
  previewContainer.innerHTML = "";
}

function cleanupPrintMode() {
  document.body.classList.remove("export-print");
}

logoInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    setLogoFromDataUrl(String(reader.result || ""));
    setStatus("Logo berhasil diperbarui.");
    queueAutosave();
  };
  reader.readAsDataURL(file);
});

invoiceDate.addEventListener("change", () => {
  invoiceNo.value = generateInvoiceNumber(invoiceDate.value);
  setStatus("Nomor faktur dibuat otomatis.");
  queueAutosave();
});

addItemBtn.addEventListener("click", () => {
  createRow("Item baru", 1, 0);
  setStatus("Item baru ditambahkan.");
  queueAutosave();
});

previewBtn.addEventListener("click", openPreview);
closePreviewBtn.addEventListener("click", closePreview);
previewBackdrop.addEventListener("click", closePreview);

exportPdfBtn.addEventListener("click", () => {
  const exportMarkup = buildOutputMarkup(true);
  previewContainer.innerHTML = "";
  previewContainer.appendChild(exportMarkup);
  previewModal.hidden = false;

  applyExportScale(exportMarkup);
  document.body.classList.add("export-print");

  const handleAfterPrint = () => {
    cleanupPrintMode();
    window.removeEventListener("afterprint", handleAfterPrint);
    window.removeEventListener("focus", handleFocusReturn);
  };

  const handleFocusReturn = () => {
    window.setTimeout(() => {
      if (document.body.classList.contains("export-print")) {
        cleanupPrintMode();
        window.removeEventListener("afterprint", handleAfterPrint);
      }
      window.removeEventListener("focus", handleFocusReturn);
    }, 250);
  };

  window.addEventListener("afterprint", handleAfterPrint);
  window.addEventListener("focus", handleFocusReturn);
  window.print();

  setStatus("Dialog cetak dibuka. Pilih Save as PDF untuk mengekspor.");
});

saveInvoiceBtn.addEventListener("click", saveInvoice);
loadInvoiceBtn.addEventListener("click", loadInvoice);
resetTemplateBtn.addEventListener("click", resetTemplate);

[invoiceNo, dueDate, fromBlock, toBlock, notesBlock].forEach((input) => {
  input.addEventListener("input", queueAutosave);
  input.addEventListener("change", queueAutosave);
});

invoiceTitle.addEventListener("input", queueAutosave);

activeStorage = detectStorage();
if (activeStorage) {
  const loaded = loadInvoice();
  if (!loaded) {
    applyInvoiceData(buildDefaultInvoiceData());
  }
} else {
  setStatus("Penyimpanan browser diblokir. Data tidak bisa dipertahankan.", true);
  applyInvoiceData(buildDefaultInvoiceData());
}
