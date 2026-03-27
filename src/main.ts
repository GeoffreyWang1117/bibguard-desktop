import { invoke } from "@tauri-apps/api/core";
import { parseBib, verifyAll } from "./engine/index";
import type { BibEntry, VerificationResult } from "./engine/types";

// --- State ---
let entries: BibEntry[] = [];
let results: VerificationResult[] = [];
let currentFilter = "all";
let bibContent = "";

// --- DOM refs ---
const $ = (sel: string) => document.querySelector(sel)!;

const dropZone = $("#drop-zone") as HTMLElement;
const fileInput = $("#file-input") as HTMLInputElement;
const fileBar = $("#file-bar") as HTMLElement;
const fileName = $("#file-name") as HTMLElement;
const fileEntries = $("#file-entries") as HTMLElement;
const btnVerify = $("#btn-verify") as HTMLButtonElement;
const btnClear = $("#btn-clear") as HTMLButtonElement;
const progressSection = $("#progress-section") as HTMLElement;
const progressFill = $("#progress-fill") as HTMLElement;
const progressText = $("#progress-text") as HTMLElement;
const summary = $("#summary") as HTMLElement;
const countOk = $("#count-ok") as HTMLElement;
const countWarn = $("#count-warn") as HTMLElement;
const countFail = $("#count-fail") as HTMLElement;
const countTime = $("#count-time") as HTMLElement;
const resultsSection = $("#results-section") as HTMLElement;
const resultsTable = $("#results-table") as HTMLElement;
const btnExport = $("#btn-export") as HTMLButtonElement;
const modalOverlay = $("#modal-overlay") as HTMLElement;
const modalTitle = $("#modal-title") as HTMLElement;
const modalBody = $("#modal-body") as HTMLElement;
const modalClose = $("#modal-close") as HTMLButtonElement;

// --- File loading ---
async function loadFile(file: File) {
  bibContent = await file.text();
  entries = parseBib(bibContent);
  results = [];

  dropZone.classList.add("hidden");
  fileBar.classList.remove("hidden");
  fileName.textContent = file.name;
  fileEntries.textContent = `${entries.length} entries`;
  progressSection.classList.add("hidden");
  summary.classList.add("hidden");
  resultsSection.classList.add("hidden");
  btnVerify.disabled = false;
}

async function loadFileFromPath(path: string) {
  try {
    bibContent = await invoke<string>("read_file", { path });
    entries = parseBib(bibContent);
    results = [];

    const name = path.split(/[/\\]/).pop() || path;
    dropZone.classList.add("hidden");
    fileBar.classList.remove("hidden");
    fileName.textContent = name;
    fileEntries.textContent = `${entries.length} entries`;
    progressSection.classList.add("hidden");
    summary.classList.add("hidden");
    resultsSection.classList.add("hidden");
    btnVerify.disabled = false;
  } catch (e) {
    console.error("Failed to read file:", e);
  }
}

// --- Verification ---
async function runVerification() {
  btnVerify.disabled = true;
  progressSection.classList.remove("hidden");
  summary.classList.add("hidden");
  resultsSection.classList.add("hidden");
  progressFill.style.width = "0%";
  progressText.textContent = `0 / ${entries.length}`;

  const t0 = performance.now();

  results = await verifyAll(entries, (i, total, _key, _status) => {
    const pct = Math.round((i / total) * 100);
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${i} / ${total}`;
  });

  const elapsed = ((performance.now() - t0) / 1000).toFixed(1);

  // Show summary
  const ok = results.filter(r => r.overall === "OK").length;
  const warn = results.filter(r => r.overall === "WARN").length;
  const fail = results.filter(r => r.overall === "FAIL").length;
  countOk.textContent = String(ok);
  countWarn.textContent = String(warn);
  countFail.textContent = String(fail);
  countTime.textContent = `${elapsed}s`;
  summary.classList.remove("hidden");

  progressFill.style.width = "100%";
  progressText.textContent = `${entries.length} / ${entries.length} — done`;

  // Show results
  currentFilter = "all";
  renderResults();
  resultsSection.classList.remove("hidden");
  btnVerify.disabled = false;
}

// --- Results rendering ---
const STATUS_ICON: Record<string, string> = { OK: "\u2713", WARN: "!", FAIL: "\u2717" };
const STATUS_BADGE: Record<string, string> = { OK: "badge-ok", WARN: "badge-warn", FAIL: "badge-fail" };

function renderResults() {
  const filtered = currentFilter === "all"
    ? results
    : results.filter(r => r.overall === currentFilter);

  resultsTable.innerHTML = "";
  for (let i = 0; i < filtered.length; i++) {
    const r = filtered[i];
    const row = document.createElement("div");
    row.className = "result-row";
    row.innerHTML = `
      <div class="status-badge ${STATUS_BADGE[r.overall]}">${STATUS_ICON[r.overall]}</div>
      <div class="entry-info">
        <div class="entry-key">${escHtml(r.key)}</div>
        <div class="entry-title">${escHtml(r.title)}</div>
      </div>
      <div class="sources">${r.sourcesHit.length ? r.sourcesHit.join(", ") : "no match"}</div>
    `;
    row.addEventListener("click", () => showDetail(r));
    resultsTable.appendChild(row);
  }

  // Update filter buttons
  document.querySelectorAll(".filter").forEach(btn => {
    btn.classList.toggle("active", (btn as HTMLElement).dataset.filter === currentFilter);
  });
}

function showDetail(r: VerificationResult) {
  modalTitle.textContent = `${r.key} — ${r.overall}`;
  let html = `<p style="margin-bottom:12px;color:var(--text-muted);font-size:13px">${escHtml(r.title)}</p>`;
  html += `<p style="margin-bottom:8px;font-size:13px">Sources tried: ${r.sourcesTried.join(", ") || "none"} | Hit: ${r.sourcesHit.join(", ") || "none"}</p>`;

  if (r.checks.length) {
    for (const c of r.checks) {
      html += `<div class="check-row">
        <span class="check-field">${escHtml(c.field)}</span>
        <span class="check-status ${c.status}">${c.status}</span>
        <span>${escHtml(c.detail)}</span>
      </div>`;
    }
  }

  if (Object.keys(r.suggestedFixes).length) {
    html += `<p style="margin-top:12px;font-weight:600;font-size:13px">Suggested fixes:</p>`;
    for (const [k, v] of Object.entries(r.suggestedFixes)) {
      html += `<div style="font-size:13px;padding:2px 0">${escHtml(k)}: <code>${escHtml(v)}</code></div>`;
    }
  }

  modalBody.innerHTML = html;
  modalOverlay.classList.remove("hidden");
}

// --- Export ---
async function exportReport() {
  const lines: string[] = [];
  lines.push("# bibguard Verification Report\n");
  const ok = results.filter(r => r.overall === "OK").length;
  const warn = results.filter(r => r.overall === "WARN").length;
  const fail = results.filter(r => r.overall === "FAIL").length;
  lines.push(`| Total | OK | WARN | FAIL |`);
  lines.push(`|-------|-----|------|------|`);
  lines.push(`| ${results.length} | ${ok} | ${warn} | ${fail} |\n`);

  for (const r of results) {
    const icon = r.overall === "OK" ? "\u2705" : r.overall === "WARN" ? "\u26a0\ufe0f" : "\u274c";
    lines.push(`### ${icon} \`${r.key}\`\n`);
    lines.push(`**${r.title}**  `);
    lines.push(`Sources: ${r.sourcesHit.join(", ") || "none"}\n`);
    for (const c of r.checks) {
      lines.push(`- **${c.field}**: ${c.status} — ${c.detail}`);
    }
    lines.push("");
  }

  const report = lines.join("\n");

  try {
    await invoke("save_report", { content: report });
  } catch {
    // Fallback: download via blob
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bibguard-report.md";
    a.click();
    URL.revokeObjectURL(url);
  }
}

// --- Helpers ---
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// --- Event wiring ---
document.addEventListener("DOMContentLoaded", () => {
  // Drag-drop
  dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = (e as DragEvent).dataTransfer?.files[0];
    if (file && file.name.endsWith(".bib")) loadFile(file);
  });

  // File picker
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) loadFile(file);
  });

  // Verify
  btnVerify.addEventListener("click", runVerification);

  // Clear
  btnClear.addEventListener("click", () => {
    entries = [];
    results = [];
    bibContent = "";
    dropZone.classList.remove("hidden");
    fileBar.classList.add("hidden");
    progressSection.classList.add("hidden");
    summary.classList.add("hidden");
    resultsSection.classList.add("hidden");
    fileInput.value = "";
  });

  // Filters
  document.querySelectorAll(".filter").forEach(btn => {
    btn.addEventListener("click", () => {
      currentFilter = (btn as HTMLElement).dataset.filter || "all";
      renderResults();
    });
  });

  // Export
  btnExport.addEventListener("click", exportReport);

  // Modal
  modalClose.addEventListener("click", () => modalOverlay.classList.add("hidden"));
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.add("hidden");
  });
});
