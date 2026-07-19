// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { buildRepairBrief, collectPageInventory } from "../src/extension/repair-brief";

describe("privacy-safe Codex repair briefs", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main id="application-shell">
        <h1>Application</h1>
        <form id="benefits-form">
          <label for="full-name">Full name</label>
          <input id="full-name" name="fullName" value="PRIVATE VALUE">
          <input id="email" name="email" value="private@example.com">
          <button type="submit">Continue</button>
        </form>
        <img src="illustration.png">
      </main>
    `;
  });

  it("captures structural and accessibility signals without field values", () => {
    const inventory = collectPageInventory();
    const serialized = JSON.stringify(inventory);
    expect(inventory.structure.forms).toBe(1);
    expect(inventory.structure.fields).toBe(2);
    expect(inventory.accessibilitySignals.unlabeledFields).toBe(1);
    expect(inventory.accessibilitySignals.imagesMissingAlt).toBe(1);
    expect(inventory.selectorCandidates).toContain("#benefits-form");
    expect(serialized).not.toContain("PRIVATE VALUE");
    expect(serialized).not.toContain("private@example.com");
  });

  it("produces a ready-to-run constrained skill prompt", () => {
    const brief = buildRepairBrief("The form loses my progress and the error is inaccessible.", collectPageInventory());
    expect(brief).toContain("Use $openpatch-author");
    expect(brief).toContain("The form loses my progress");
    expect(brief).toContain("never collect field values");
    expect(brief).toContain("run unit and browser tests");
  });
});
