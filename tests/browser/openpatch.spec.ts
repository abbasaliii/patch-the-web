import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

const runtimePath = resolve(import.meta.dirname, "../../dist/test/apply-demo-patch.js");

test("the unpatched portal is visibly broken", async ({ page }, testInfo) => {
  await page.goto("/demo/");
  await expect(page.locator(".survey-wall")).toBeVisible();
  if (testInfo.project.name === "mobile-chromium") {
    const brokenShellIsWiderThanViewport = await page.locator(".application-shell").evaluate((element) => element.getBoundingClientRect().width > window.innerWidth * 2);
    expect(brokenShellIsWiderThanViewport).toBe(true);
  }
});

test("the safe patch repairs layout, accessibility, autosave, and keyboard behavior", async ({ page }, testInfo) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(message.text()); });
  await page.goto("/demo/");
  await page.addScriptTag({ path: runtimePath });
  const health = await page.evaluate(() => (window as Window & { __applyOpenPatchDemo: () => { healthy: number; total: number } }).__applyOpenPatchDemo());

  expect(health.healthy).toBe(health.total);
  await expect(page.locator(".survey-wall")).toBeHidden();
  await expect(page.locator(".application-main > .help-card")).toBeVisible();
  await expect(page.locator("#progress-steps")).toHaveAttribute("role", "group");

  if (testInfo.project.name === "mobile-chromium") {
    const documentFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
    expect(documentFits).toBe(true);
  }

  await page.locator("#full-name").fill("Alex Morgan");
  await page.locator("#email").fill("alex@example.com");
  await page.locator("#household-size").selectOption("2");
  await page.locator("#address").fill("12 Green Street");
  await page.reload();
  await page.addScriptTag({ path: runtimePath });
  await page.evaluate(() => (window as Window & { __applyOpenPatchDemo: () => unknown }).__applyOpenPatchDemo());
  await expect(page.locator("#full-name")).toHaveValue("Alex Morgan");
  await expect(page.locator(".openpatch-save-status")).toContainText("Draft restored");

  await page.locator("#email").fill("not-an-email");
  await page.locator("#benefits-form").evaluate((element) => (element as HTMLFormElement).requestSubmit());
  await expect(page.getByRole("alert")).toContainText("name@example.com");

  const firstStep = page.locator("#progress-steps button").nth(0);
  const secondStep = page.locator("#progress-steps button").nth(1);
  await firstStep.focus();
  await firstStep.press("ArrowRight");
  await expect(secondStep).toBeFocused();
  expect(runtimeErrors).toEqual([]);
});

test("the public registry exposes a verifiable patch receipt", async ({ page }) => {
  await page.goto("/");
  const response = await page.request.get("/registry/index.json");
  expect(response.ok()).toBe(true);
  const registry = await response.json() as {
    patches: Array<{ id: string; sha256: string; verification: { status: string; operations: number; assertions: number } }>;
  };
  expect(registry.patches[0].id).toBe("org.openpatch.civicapply-accessible-draft");
  expect(registry.patches[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(registry.patches[0].verification).toEqual({ status: "verified", operations: 19, assertions: 10 });
  await expect(page.locator("#registry-receipt")).toContainText("SHA-256");
  const download = page.getByRole("link", { name: "Download safe patch ↓" });
  await expect(download).toHaveAttribute("download", "");
  const patchResponse = await page.request.get("/registry/patches/civic-apply.openpatch.json");
  expect(patchResponse.ok()).toBe(true);
  expect((await patchResponse.json()).schemaVersion).toBe(1);
});
