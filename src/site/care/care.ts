import { applyPatch } from "../../core/engine";
import metroCarePatchJson from "../../registry/patches/metrocare-service-navigator.openpatch.json";
import type { OpenPatch } from "../../core/types";

document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.hash);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const preview = document.querySelector<HTMLButtonElement>("#judge-preview");
preview?.addEventListener("click", () => {
  const health = applyPatch(metroCarePatchJson as OpenPatch);
  preview.disabled = true;
  preview.dataset.healthy = String(health.healthy);
  preview.dataset.total = String(health.total);
  preview.textContent = health.applied
    ? `✓ OpenPatch active · ${health.healthy}/${health.total} healthy`
    : `OpenPatch needs review · ${health.healthy}/${health.total} healthy`;
  document.querySelector(".openpatch-navigator")?.scrollIntoView({ behavior: "smooth", block: "center" });
});
