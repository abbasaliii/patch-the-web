import civicPatchJson from "../registry/patches/civic-apply.patch-the-web.json";
import { buildPatchCatalog, comparePatchVersions, permissionOrigins } from "../core/registry";
import { parsePublicRegistry, PUBLIC_REGISTRY_URL, type PublicRegistryIndex } from "../core/remote-registry";
import type { CommunityPatch } from "../core/types";

const bundled = [civicPatchJson as CommunityPatch];
const grid = document.querySelector<HTMLElement>("#repair-grid")!;
const template = document.querySelector<HTMLTemplateElement>("#repair-template")!;
const empty = document.querySelector<HTMLElement>("#empty-state")!;
const pageStatus = document.querySelector<HTMLElement>("#page-status")!;

const CAPABILITY_LABELS: Record<string, string> = {
  layout: "Responsive layout", accessibility: "Accessibility", "local-storage": "Local preferences",
  "keyboard-navigation": "Keyboard controls", validation: "Accessible validation", "content-filter": "Private filters",
  "content-compare": "Private comparison", "hide-elements": "Remove obstruction", reorganize: "Simplified workflow"
};

type StoredState = {
  installedPatches: Record<string, CommunityPatch>;
  installedPatchMeta: Record<string, { source?: string }>;
  enabledPatches: Record<string, boolean>;
  patchHistory: Record<string, unknown>;
};

function publicPage(patch: CommunityPatch) {
  const host = patch.match.hosts.find((candidate) => candidate !== "localhost" && candidate !== "127.0.0.1") ?? patch.match.hosts[0];
  const scheme = host === "localhost" || host === "127.0.0.1" ? "http" : "https";
  return `${scheme}://${host}${(patch.match.paths[0] ?? "/").replace(/\*.*$/, "")}`;
}

async function readState(): Promise<StoredState> {
  const stored = await chrome.storage.local.get(["installedPatches", "installedPatchMeta", "enabledPatches", "patchHistory"]);
  return {
    installedPatches: (stored.installedPatches as Record<string, CommunityPatch> | undefined) ?? {},
    installedPatchMeta: (stored.installedPatchMeta as Record<string, { source?: string }> | undefined) ?? {},
    enabledPatches: (stored.enabledPatches as Record<string, boolean> | undefined) ?? {},
    patchHistory: (stored.patchHistory as Record<string, unknown> | undefined) ?? {}
  };
}

async function refreshRuntime() {
  const result = await chrome.runtime.sendMessage({ type: "PATCH_THE_WEB_REFRESH_RUNTIME" }) as { ok?: boolean; error?: string } | undefined;
  if (!result?.ok) throw new Error(result?.error ?? "The repair runtime could not be refreshed.");
}

async function registry(): Promise<PublicRegistryIndex | null> {
  try {
    const response = await fetch(PUBLIC_REGISTRY_URL, { cache: "no-store" });
    if (!response.ok) return null;
    return parsePublicRegistry(await response.json());
  } catch { return null; }
}

function sourceLabel(source: "bundled" | "local", metadata?: { source?: string }) {
  if (source === "bundled") return "Built into the extension";
  return metadata?.source === "public-registry" ? "Verified public registry" : "Local author test";
}

async function removeRepair(id: string, card: HTMLElement, status: HTMLElement) {
  const state = await readState();
  const removed = state.installedPatches[id];
  if (!removed) throw new Error("This repair is no longer installed.");
  delete state.installedPatches[id]; delete state.installedPatchMeta[id]; delete state.enabledPatches[id]; delete state.patchHistory[id];
  await chrome.storage.local.set(state);
  await refreshRuntime();
  const validRemaining = buildPatchCatalog([], state.installedPatches).patches.map(({ patch }) => patch);
  const needed = new Set(validRemaining.flatMap((patch) => permissionOrigins(patch)));
  const unused = permissionOrigins(removed).filter((origin) => !needed.has(origin));
  if (unused.length) await chrome.permissions.remove({ origins: unused }).catch(() => false);
  card.remove();
  status.textContent = "";
  pageStatus.textContent = `${removed.name} was removed with its local settings and version history.`;
  await render();
}

async function render() {
  grid.setAttribute("aria-busy", "true");
  const [state, publicRegistry] = await Promise.all([readState(), registry()]);
  const catalog = buildPatchCatalog(bundled, state.installedPatches);
  const registryById = new Map(publicRegistry?.patches.map((entry) => [entry.id, entry]) ?? []);
  const fragments = catalog.patches.sort((a, b) => a.patch.name.localeCompare(b.patch.name)).map(({ patch, source }) => {
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const card = fragment.querySelector<HTMLElement>(".repair-card")!;
    const enabled = Boolean(state.enabledPatches[patch.id]);
    const statePill = fragment.querySelector<HTMLElement>(".state")!;
    statePill.textContent = enabled ? "ACTIVE" : "PAUSED";
    statePill.classList.toggle("paused", !enabled);
    fragment.querySelector<HTMLElement>(".version")!.textContent = `v${patch.version}`;
    fragment.querySelector<HTMLElement>("h2")!.textContent = patch.name;
    fragment.querySelector<HTMLElement>(".summary")!.textContent = patch.summary;
    fragment.querySelector<HTMLElement>(".scope")!.textContent = `${patch.match.hosts.join(", ")} · ${patch.match.paths.join(", ")}`;
    fragment.querySelector<HTMLElement>(".source")!.textContent = sourceLabel(source, state.installedPatchMeta[patch.id]);
    const chips = fragment.querySelector<HTMLElement>(".capabilities")!;
    patch.capabilities.forEach((capability) => { const chip = document.createElement("span"); chip.textContent = CAPABILITY_LABELS[capability] ?? capability; chips.append(chip); });
    const registryEntry = registryById.get(patch.id);
    const update = fragment.querySelector<HTMLElement>(".update")!;
    if (!publicRegistry) update.textContent = "Registry temporarily unavailable";
    else if (registryEntry && comparePatchVersions(registryEntry.version, patch.version) > 0) {
      const link = document.createElement("a"); link.href = registryEntry.compatibility?.pageUrl ?? publicPage(patch); link.target = "_blank"; link.rel = "noreferrer"; link.textContent = `v${registryEntry.version} available — open site ↗`; update.append(link);
    } else update.textContent = registryEntry ? "Current verified version" : source === "bundled" ? "Maintained with extension" : "Local test version";
    const open = fragment.querySelector<HTMLAnchorElement>(".open-site")!; open.href = publicPage(patch);
    const toggle = fragment.querySelector<HTMLInputElement>(".enabled")!; toggle.checked = enabled;
    const cardStatus = fragment.querySelector<HTMLElement>(".card-status")!;
    toggle.addEventListener("change", async () => {
      toggle.disabled = true;
      try {
        const current = await readState(); current.enabledPatches[patch.id] = toggle.checked;
        await chrome.storage.local.set({ enabledPatches: current.enabledPatches }); await refreshRuntime();
        statePill.textContent = toggle.checked ? "ACTIVE" : "PAUSED"; statePill.classList.toggle("paused", !toggle.checked);
        cardStatus.textContent = `${toggle.checked ? "Enabled" : "Paused"}. Reload matching website tabs to see the change.`;
      } catch (error) { toggle.checked = !toggle.checked; cardStatus.textContent = `Change failed: ${error instanceof Error ? error.message : "unknown error"}`; }
      finally { toggle.disabled = false; }
    });
    const remove = fragment.querySelector<HTMLButtonElement>(".remove")!;
    remove.hidden = source !== "local";
    remove.addEventListener("click", async () => {
      remove.disabled = true; cardStatus.textContent = "Removing repair and local history…";
      try { await removeRepair(patch.id, card, cardStatus); }
      catch (error) { cardStatus.textContent = `Removal failed: ${error instanceof Error ? error.message : "unknown error"}`; remove.disabled = false; }
    });
    return fragment;
  });
  grid.replaceChildren(...fragments);
  grid.setAttribute("aria-busy", "false");
  empty.hidden = catalog.patches.length > 0;
  document.querySelector<HTMLElement>("#repair-count")!.textContent = String(catalog.patches.length);
  document.querySelector<HTMLElement>("#active-count")!.textContent = String(catalog.patches.filter(({ patch }) => state.enabledPatches[patch.id]).length);
  document.querySelector<HTMLElement>("#domain-count")!.textContent = String(new Set(catalog.patches.flatMap(({ patch }) => patch.match.hosts)).size);
}

void render().catch((error) => {
  grid.setAttribute("aria-busy", "false");
  empty.hidden = false;
  pageStatus.textContent = `Repairs could not be loaded: ${error instanceof Error ? error.message : "unknown error"}`;
});
