import { historyToCsv } from "../background/history.js";
import { telemetryFailureRate } from "../background/telemetry.js";
import { LANGUAGES } from "../shared/languages.js";
import type { DictionaryLanguageId } from "../shared/languages.js";
import type { BackgroundRequest, BackgroundResponse } from "../shared/messages.js";
import type { ProviderHealthInfo, TelemetrySnapshot } from "../shared/telemetry-types.js";
import type { UserSettings } from "../shared/types.js";

const dictSelect = document.getElementById(
  "dictionary-language",
) as HTMLSelectElement;
const targetSelect = document.getElementById(
  "target-language",
) as HTMLSelectElement;
const saveHistoryCheck = document.getElementById(
  "save-history",
) as HTMLInputElement;
const allowExternalCheck = document.getElementById(
  "allow-external",
) as HTMLInputElement;
const allowedIdsInput = document.getElementById(
  "allowed-ids",
) as HTMLTextAreaElement;
const historyCountEl = document.getElementById("history-count") as HTMLParagraphElement;
const telemetryView = document.getElementById("telemetry-view") as HTMLPreElement;
const telemetryAlert = document.getElementById("telemetry-alert") as HTMLParagraphElement;
const reportsCountEl = document.getElementById("reports-count") as HTMLParagraphElement;
const statusEl = document.getElementById("status") as HTMLParagraphElement;
const providerHealthBody = document.getElementById(
  "provider-health-body",
) as HTMLTableSectionElement;

function fillSelect(select: HTMLSelectElement): void {
  for (const lang of LANGUAGES) {
    const opt = document.createElement("option");
    opt.value = lang.id;
    opt.textContent = lang.label;
    select.appendChild(opt);
  }
}

async function send(message: BackgroundRequest): Promise<BackgroundResponse> {
  return browser.runtime.sendMessage(message) as Promise<BackgroundResponse>;
}

function showStatus(text: string): void {
  statusEl.textContent = text;
  window.setTimeout(() => {
    statusEl.textContent = "";
  }, 2500);
}

function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function load(): Promise<UserSettings> {
  const response = await send({ type: "getSettings" });
  if (response.type !== "settings") {
    throw new Error("Expected settings");
  }
  return response.settings;
}

async function save(partial: Partial<UserSettings>): Promise<void> {
  await send({ type: "saveSettings", settings: partial });
  showStatus("Settings saved.");
}

function renderProviderHealth(providers: ProviderHealthInfo[]): void {
  providerHealthBody.replaceChildren();

  for (const p of providers) {
    const row = document.createElement("tr");

    const name = document.createElement("td");
    name.textContent = p.label;

    const status = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = `status-pill status-pill--${p.status}`;
    pill.textContent =
      p.status === "unavailable"
        ? "Unavailable"
        : p.status === "degraded"
          ? "Degraded"
          : "Healthy";
    status.append(pill);

    const rate = document.createElement("td");
    rate.textContent =
      p.recentCalls === 0 ? "—" : `${(p.successRate * 100).toFixed(0)}%`;

    const p50 = document.createElement("td");
    p50.textContent = p.p50Ms > 0 ? `${p.p50Ms}ms` : "—";

    const p95 = document.createElement("td");
    p95.textContent = p.p95Ms > 0 ? `${p.p95Ms}ms` : "—";

    const err = document.createElement("td");
    err.textContent = p.lastError ?? "—";

    row.append(name, status, rate, p50, p95, err);
    providerHealthBody.append(row);
  }
}

function renderTelemetry(snap: TelemetrySnapshot): void {
  telemetryView.textContent = JSON.stringify(snap, null, 2);

  const rate = telemetryFailureRate(snap);
  if (rate > 0.2 && snap.lookups >= 10) {
    telemetryAlert.hidden = false;
    telemetryAlert.textContent = `High failure rate: ${(rate * 100).toFixed(0)}% of ${snap.lookups} lookups (${snap.lookups} total).`;
  } else {
    telemetryAlert.hidden = true;
  }
}

async function refreshHistoryCount(): Promise<void> {
  const res = await send({ type: "getHistory" });
  if (res.type === "history") {
    historyCountEl.textContent = `${res.entries.length} saved entries`;
  }
}

async function refreshReportsCount(): Promise<void> {
  const res = await send({ type: "getBrokenReports" });
  if (res.type === "brokenReports") {
    reportsCountEl.textContent = `${res.reports.length} reported words`;
  }
}

async function init(): Promise<void> {
  fillSelect(dictSelect);
  fillSelect(targetSelect);

  const settings = await load();
  dictSelect.value = settings.dictionaryLanguage;
  targetSelect.value = settings.targetLanguage;
  saveHistoryCheck.checked = settings.saveHistory;
  allowExternalCheck.checked = settings.allowExternalHistory;
  allowedIdsInput.value = settings.allowedExtensionIds.join("\n");

  dictSelect.addEventListener("change", () => {
    void save({ dictionaryLanguage: dictSelect.value as DictionaryLanguageId });
  });
  targetSelect.addEventListener("change", () => {
    void save({ targetLanguage: targetSelect.value as DictionaryLanguageId });
  });

  saveHistoryCheck.addEventListener("change", () => {
    void save({ saveHistory: saveHistoryCheck.checked });
  });

  allowExternalCheck.addEventListener("change", () => {
    void save({ allowExternalHistory: allowExternalCheck.checked });
  });

  allowedIdsInput.addEventListener("change", () => {
    const ids = allowedIdsInput.value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    void save({ allowedExtensionIds: ids });
  });

  document.getElementById("download-history")!.addEventListener("click", async () => {
    const res = await send({ type: "getHistory" });
    if (res.type === "history") {
      downloadFile(
        "dictionary-history.csv",
        historyToCsv(res.entries),
        "text/csv",
      );
      showStatus("History CSV downloaded.");
    }
  });

  document.getElementById("clear-history")!.addEventListener("click", async () => {
    await send({ type: "clearHistory" });
    await refreshHistoryCount();
    showStatus("History cleared.");
  });

  document.getElementById("export-telemetry")!.addEventListener("click", async () => {
    const res = await send({ type: "getTelemetry" });
    if (res.type === "telemetry") {
      downloadFile(
        "dictionary-telemetry.json",
        JSON.stringify(res.snapshot, null, 2),
        "application/json",
      );
      showStatus("Telemetry exported.");
    }
  });

  document.getElementById("clear-telemetry")!.addEventListener("click", async () => {
    await send({ type: "clearTelemetry" });
    const res = await send({ type: "getTelemetry" });
    if (res.type === "telemetry") {
      renderTelemetry(res.snapshot);
    }
    showStatus("Telemetry cleared.");
  });

  document.getElementById("export-reports")!.addEventListener("click", async () => {
    const res = await send({ type: "getBrokenReports" });
    if (res.type === "brokenReports") {
      downloadFile(
        "broken-words.json",
        JSON.stringify(res.reports, null, 2),
        "application/json",
      );
      showStatus("Reports exported.");
    }
  });

  document.getElementById("clear-reports")!.addEventListener("click", async () => {
    await send({ type: "clearBrokenReports" });
    await refreshReportsCount();
    showStatus("Reports cleared.");
  });

  const tel = await send({ type: "getTelemetry" });
  if (tel.type === "telemetry") {
    renderTelemetry(tel.snapshot);
  }

  const health = await send({ type: "getProviderHealth" });
  if (health.type === "providerHealth") {
    renderProviderHealth(health.providers);
  }

  await refreshHistoryCount();
  await refreshReportsCount();
}

void init();
