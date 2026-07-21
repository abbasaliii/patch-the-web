import { describe, expect, it } from "vitest";
import civicPatch from "../src/registry/patches/civic-apply.patch-the-web.json";
import { archivePatch, removeHistoryEntry, restoreCandidate, validHistoryEntries, type PatchInstallMeta } from "../src/core/patch-history";
import type { CommunityPatch } from "../src/core/types";

const patch = civicPatch as CommunityPatch;
function version(value: string) { return { ...patch, version: value, changelog: `Release ${value}` }; }
function meta(candidate: CommunityPatch, seed = "a"): PatchInstallMeta { return { sha256: seed.repeat(64), installedAt: 1_700_000_000_000, source: "public-registry", sourceJson: JSON.stringify(candidate) }; }

describe("bounded local patch history", () => {
  it("archives only validated patch sources and returns the newest restore candidate", () => {
    const old = version("1.0.0");
    const middle = version("1.1.0");
    let history = archivePatch([], old, meta(old), 100);
    history = archivePatch(history, middle, meta(middle, "b"), 200);
    expect(history.map((entry) => entry.patch.version)).toEqual(["1.1.0", "1.0.0"]);
    expect(restoreCandidate(history, patch.id, "1.2.0")?.patch.version).toBe("1.1.0");
  });

  it("rejects malformed, mismatched, and oversized history entries", () => {
    const old = version("1.0.0");
    const wrongSource = { ...meta(old), sourceJson: JSON.stringify(version("9.9.9")) };
    expect(archivePatch([], old, wrongSource, 100)).toEqual([]);
    expect(validHistoryEntries([{ patch: old, meta: { ...meta(old), sha256: "bad" }, archivedAt: 100 }], patch.id)).toEqual([]);
  });

  it("deduplicates receipts, stays bounded, and removes the selected restore point", () => {
    let history: unknown = [];
    for (let index = 0; index < 5; index += 1) {
      const candidate = version(`1.${index}.0`);
      history = archivePatch(history, candidate, meta(candidate, String(index)), 100 + index);
    }
    const entries = validHistoryEntries(history, patch.id);
    expect(entries.map((entry) => entry.patch.version)).toEqual(["1.4.0", "1.3.0", "1.2.0"]);
    expect(removeHistoryEntry(entries, patch.id, entries[0])).toHaveLength(2);
  });
});
