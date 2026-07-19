import civicPatchJson from "../registry/patches/civic-apply.openpatch.json";
import type { OpenPatch, PatchHealth } from "../core/types";
import { buildRepairBrief, collectPageInventory } from "./repair-brief";

type PageState = {
  matched: boolean;
  enabled: boolean;
  health: PatchHealth | null;
  patch: Pick<OpenPatch, "id" | "name" | "summary" | "version" | "capabilities" | "author">;
};

const patch = civicPatchJson as OpenPatch;
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const host = byId<HTMLElement>("site-host");
const icon = byId<HTMLElement>("site-icon");
const matchDot = byId<HTMLElement>("match-dot");
const card = byId<HTMLElement>("patch-card");
const empty = byId<HTMLElement>("empty-state");
const toggle = byId<HTMLInputElement>("patch-toggle");
const authorButton = byId<HTMLButtonElement>("author-button");
const complaint = byId<HTMLTextAreaElement>("repair-complaint");
const briefStatus = byId<HTMLElement>("brief-status");

const CAPABILITY_LABELS: Record<string, string> = {
  layout: "Change allowlisted layout and visual properties",
  accessibility: "Add ARIA and safe interaction attributes",
  "local-storage": "Save non-sensitive form fields on this device",
  "keyboard-navigation": "Add arrow-key navigation within matched controls",
  validation: "Add local, accessible field validation",
  "hide-elements": "Hide explicitly matched obstructive elements",
  reorganize: "Move matched elements within the same page"
};

async function activeTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function renderState(state: PageState) {
  if (!state.matched) return;
  matchDot.classList.add("active");
  card.hidden = false;
  empty.hidden = true;
  byId("patch-name").textContent = state.patch.name;
  byId("patch-version").textContent = `v${state.patch.version}`;
  byId("patch-summary").textContent = state.patch.summary;
  byId("patch-author").textContent = state.patch.author.name;
  byId("publisher-status").textContent = state.patch.author.verified ? "✓ Verified publisher" : "✓ Policy checked";
  toggle.checked = state.enabled;
  byId("toggle-title").textContent = state.enabled ? "Repair is active" : "Apply this repair";
  byId("permissions-list").replaceChildren(...state.patch.capabilities.map((capability) => {
    const item = document.createElement("li");
    item.textContent = CAPABILITY_LABELS[capability] ?? capability;
    return item;
  }));
  if (state.enabled && state.health) {
    byId("health-title").textContent = `${state.health.healthy}/${state.health.total} operations healthy`;
    byId("health-detail").textContent = state.health.applied
      ? "All selectors matched · patch applied safely"
      : "Some selectors may need an update";
    byId("health-row").classList.toggle("warning", !state.health.applied);
  }
}

async function init() {
  const tab = await activeTab();
  let hostname = "This page";
  try { hostname = new URL(tab.url ?? "").hostname || hostname; } catch { /* use fallback */ }
  host.textContent = hostname;
  icon.textContent = hostname.charAt(0).toUpperCase();
  if (!tab.id) return;
  try {
    const state = await chrome.tabs.sendMessage(tab.id, { type: "OPENPATCH_GET_STATE" }) as PageState;
    renderState(state);
  } catch {
    empty.hidden = false;
  }
}

toggle.addEventListener("change", async () => {
  toggle.disabled = true;
  const stored = await chrome.storage.local.get("enabledPatches");
  const enabledPatches = (stored.enabledPatches as Record<string, boolean> | undefined) ?? {};
  enabledPatches[patch.id] = toggle.checked;
  await chrome.storage.local.set({ enabledPatches });
  const tab = await activeTab();
  if (tab.id) await chrome.tabs.reload(tab.id);
  window.close();
});

authorButton.addEventListener("click", async () => {
  const request = complaint.value.trim();
  if (request.length < 12) {
    briefStatus.textContent = "Add a little more detail about what is broken.";
    complaint.focus();
    return;
  }
  const tab = await activeTab();
  if (!tab.id || !tab.url?.startsWith("http")) {
    briefStatus.textContent = "Open a normal website tab, then try again.";
    return;
  }
  authorButton.disabled = true;
  briefStatus.textContent = "Inspecting page structure…";
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectPageInventory
    });
    const inventory = results[0]?.result;
    if (!inventory) throw new Error("No page inventory returned");
    await navigator.clipboard.writeText(buildRepairBrief(request, inventory));
    briefStatus.textContent = "Repair brief copied — paste it into Codex.";
  } catch {
    briefStatus.textContent = "This page blocks inspection. Try another website tab.";
  } finally {
    authorButton.disabled = false;
  }
});

void init();
