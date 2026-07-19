// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { preflightPatchOnDocument } from "../src/core/preflight";
import civicPatchJson from "../src/registry/patches/civic-apply.openpatch.json";
import type { OpenPatch } from "../src/core/types";

const fixture = readFileSync(resolve(import.meta.dirname, "../src/site/demo/index.html"), "utf8");
const patch = civicPatchJson as OpenPatch;

describe("in-extension selector preflight", () => {
  beforeEach(() => {
    const parsed = new DOMParser().parseFromString(fixture, "text/html");
    document.head.innerHTML = parsed.head.innerHTML;
    document.body.innerHTML = parsed.body.innerHTML;
  });

  it("accepts every operation target on the intended page", () => {
    const result = preflightPatchOnDocument(patch);
    expect(result.total).toBe(19);
    expect(result.healthy).toBe(19);
  });

  it("fails closed when a critical selector drifts", () => {
    document.getElementById("benefits-form")?.removeAttribute("id");
    const result = preflightPatchOnDocument(patch);
    expect(result.healthy).toBeLessThan(result.total);
    expect(result.results.find((entry) => entry.id === "persist-draft")?.healthy).toBe(false);
    expect(result.results.find((entry) => entry.id === "accessible-validation")?.healthy).toBe(false);
  });
});
