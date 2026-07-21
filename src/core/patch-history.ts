import type { CommunityPatch } from "./types";
import { validatePatch } from "./validator";

export type PatchInstallMeta = {
  sha256: string;
  installedAt: number;
  source: "local-file" | "public-registry";
  sourceJson: string;
};

export type PatchHistoryEntry = {
  patch: CommunityPatch;
  meta: PatchInstallMeta;
  archivedAt: number;
};

export type PatchHistory = Record<string, PatchHistoryEntry[]>;

const sha256Pattern = /^[a-f0-9]{64}$/;

function validMeta(value: unknown): value is PatchInstallMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const meta = value as Partial<PatchInstallMeta>;
  return sha256Pattern.test(meta.sha256 ?? "")
    && Number.isFinite(meta.installedAt)
    && meta.installedAt! > 0
    && (meta.source === "local-file" || meta.source === "public-registry")
    && typeof meta.sourceJson === "string"
    && new TextEncoder().encode(meta.sourceJson).byteLength <= 256_000;
}

export function validHistoryEntries(value: unknown, patchId: string): PatchHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  const result: PatchHistoryEntry[] = [];
  for (const candidate of value.slice(0, 12)) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const entry = candidate as Partial<PatchHistoryEntry>;
    const archivedAt = entry.archivedAt;
    const validation = validatePatch(entry.patch);
    if (!validation.ok || validation.patch.id !== patchId || !validMeta(entry.meta) || typeof archivedAt !== "number" || !Number.isFinite(archivedAt) || archivedAt <= 0) continue;
    try {
      const sourceValidation = validatePatch(JSON.parse(entry.meta.sourceJson) as unknown);
      if (!sourceValidation.ok || sourceValidation.patch.id !== patchId || sourceValidation.patch.version !== validation.patch.version) continue;
    } catch { continue; }
    result.push({ patch: validation.patch, meta: entry.meta, archivedAt });
  }
  return result.sort((left, right) => right.archivedAt - left.archivedAt);
}

export function archivePatch(
  history: unknown,
  patch: CommunityPatch,
  meta: unknown,
  archivedAt = Date.now(),
  limit = 3
): PatchHistoryEntry[] {
  const validation = validatePatch(patch);
  if (!validation.ok || !validMeta(meta) || !Number.isFinite(archivedAt) || archivedAt <= 0) return validHistoryEntries(history, patch.id).slice(0, limit);
  let sourcePatch: CommunityPatch;
  try {
    const sourceValidation = validatePatch(JSON.parse(meta.sourceJson) as unknown);
    if (!sourceValidation.ok || sourceValidation.patch.id !== validation.patch.id || sourceValidation.patch.version !== validation.patch.version) return validHistoryEntries(history, patch.id).slice(0, limit);
    sourcePatch = sourceValidation.patch;
  } catch { return validHistoryEntries(history, patch.id).slice(0, limit); }
  const existing = validHistoryEntries(history, sourcePatch.id).filter((entry) => !(entry.patch.version === sourcePatch.version && entry.meta.sha256 === meta.sha256));
  return [{ patch: sourcePatch, meta, archivedAt }, ...existing].slice(0, Math.max(1, Math.min(limit, 5)));
}

export function restoreCandidate(history: unknown, patchId: string, currentVersion: string) {
  return validHistoryEntries(history, patchId).find((entry) => entry.patch.version !== currentVersion);
}

export function removeHistoryEntry(history: unknown, patchId: string, entry: PatchHistoryEntry) {
  return validHistoryEntries(history, patchId).filter((candidate) => !(candidate.patch.version === entry.patch.version && candidate.meta.sha256 === entry.meta.sha256));
}
