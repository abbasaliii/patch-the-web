import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const runtimePath = resolve(import.meta.dirname, "../../dist/test/apply-demo-patch.js");
const fixture = readFileSync(resolve(import.meta.dirname, "../fixtures/punjab-zakat-hospitals.html"), "utf8");
const evidenceDir = resolve(import.meta.dirname, "../../submission-assets/repairs");

test("the Punjab Zakat repair makes the eligible-hospital directory privately searchable", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.setContent(fixture);
  await page.screenshot({ path: resolve(evidenceDir, `punjab-zakat-hospitals-${testInfo.project.name}-before.png`), fullPage: true });
  await page.addScriptTag({ path: runtimePath });
  const health = await page.evaluate(() => (window as Window & { __applyPunjabZakatHospitalPatch: () => { healthy: number; total: number } }).__applyPunjabZakatHospitalPatch());
  expect(health).toMatchObject({ healthy: 1, total: 1 });

  const search = page.getByRole("searchbox", { name: "Search eligible hospitals" });
  await expect(search).toBeVisible();
  await expect(page.locator(".patch-the-web-list-search__status")).toHaveText("43 public hospitals available");
  await search.fill("cardiology");
  await expect(page.locator("[data-patch-the-web-list-search-match='true']:visible")).toHaveCount(5);
  await expect(page.locator(".patch-the-web-list-search__status")).toHaveText("5 of 43 hospitals match");
  await search.press("Escape");
  await expect(search).toHaveValue("");
  await page.keyboard.press("/");
  await expect(search).toBeFocused();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: resolve(evidenceDir, `punjab-zakat-hospitals-${testInfo.project.name}-after.png`), fullPage: true });
});
