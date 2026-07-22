import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "..");
const iconDir = resolve(root, "src/extension/icons");
const storeDir = resolve(root, "submission-assets/chrome-web-store");
const repairDir = resolve(root, "submission-assets/repairs");
await mkdir(iconDir, { recursive: true });
await mkdir(storeDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

const dataUrl = async (path) => `data:image/png;base64,${(await readFile(path)).toString("base64")}`;
const before = await dataUrl(resolve(repairDir, "nu-karachi-desktop-live-before.png"));
const after = await dataUrl(resolve(repairDir, "nu-karachi-desktop-live-after.png"));

function icon(size) { return `<!doctype html><style>html,body{margin:0;width:${size}px;height:${size}px;background:transparent}.mark{position:relative;width:100%;height:100%;border-radius:${Math.round(size*.27)}px;background:#087a55;box-shadow:inset 0 0 0 ${Math.max(1,Math.round(size*.025))}px #065c41}.mark i{position:absolute;width:${Math.round(size*.38)}px;height:${Math.max(2,Math.round(size*.12))}px;border:${Math.max(1,Math.round(size*.055))}px solid white;border-left:0;border-right:0;transform:rotate(-38deg)}.mark i:first-child{left:${Math.round(size*.14)}px;top:${Math.round(size*.27)}px}.mark i:last-child{right:${Math.round(size*.14)}px;bottom:${Math.round(size*.25)}px}</style><div class="mark"><i></i><i></i></div>`; }

const base = `*{box-sizing:border-box}html,body{margin:0}body{color:#132b21;background:#f4fbf7;font-family:Inter,Arial,sans-serif}.mark{display:grid;place-items:center;border-radius:24%;color:#fff;background:#087a55;font-weight:900}.mark:after{content:'//';transform:rotate(-36deg)}.eyebrow{color:#087a55;font-size:12px;font-weight:900;letter-spacing:.13em}h1{margin:15px 0;line-height:.94;letter-spacing:-.065em}p{color:#527066;line-height:1.5}.safe{color:#08724f;background:#e7f8ef;font-weight:850}.panel{border:1px solid #cfe5d9;background:#fff;box-shadow:0 24px 70px #1655361c}`;

function screenshotBeforeAfter(){return `<!doctype html><style>${base}html,body{width:1280px;height:800px}body{padding:56px 70px}.top{display:flex;align-items:center;gap:16px}.mark{width:48px;height:48px}.mark:after{font-size:23px}.top strong{font-size:19px}.top .safe{margin-left:auto;padding:9px 12px;border-radius:999px;font-size:11px}h1{font-size:54px}.lead{margin:0 0 25px;font-size:18px}.compare{display:grid;grid-template-columns:1fr 1fr;gap:18px}.shot{position:relative;overflow:hidden;height:420px;border-radius:18px;background:#e8efeb}.shot img{width:100%;height:100%;object-fit:cover;object-position:top}.shot span{position:absolute;top:14px;left:14px;padding:8px 11px;border-radius:999px;color:#fff;background:#172e25e8;font-size:11px;font-weight:900}.shot.after span{background:#087a55}.caption{position:absolute;right:15px;bottom:15px;padding:11px 14px;border-radius:10px;color:#153328;background:#ffffffe8;font-size:12px;font-weight:850}</style><main><div class="top"><div class="mark"></div><strong>Patch the Web</strong><span class="safe">SAFE DSL · DOMAIN SCOPED</span></div><h1>Turn an unusable page into a focused tool.</h1><p class="lead">A verified repair keeps only Karachi programs, fixes the table layout, and adds accessible labels—without changing the original website.</p><div class="compare"><div class="shot"><img src="${before}"><span>BEFORE</span></div><div class="shot after"><img src="${after}"><span>AFTER</span><div class="caption">✓ 4/4 operations healthy</div></div></div></main>`;}

function screenshotWorkflow(){return `<!doctype html><style>${base}html,body{width:1280px;height:800px}body{padding:65px 78px;background:radial-gradient(circle at 85% 10%,#bff2d9,transparent 27%),#f4fbf7}.layout{display:grid;grid-template-columns:.9fr 1.1fr;gap:65px;align-items:center;height:100%}.mark{width:64px;height:64px}.mark:after{font-size:31px}h1{font-size:67px}.copy p{font-size:19px}.steps{display:grid;gap:14px}.step{display:grid;grid-template-columns:45px 1fr;gap:15px;padding:20px;border-radius:16px}.step b{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;color:#087a55;background:#e5f7ee}.step strong{display:block;font-size:18px}.step p{margin:5px 0 0;font-size:12px}.receipt{margin-top:18px;padding:18px;border-radius:14px}.receipt strong{display:block}.receipt span{display:block;margin-top:5px;font:12px monospace}</style><main class="layout"><section class="copy"><div class="mark"></div><p class="eyebrow">ONE SIMPLE FLOW</p><h1>Find it. Review it. Repair it.</h1><p>Open a supported website, review the exact scope and selector health, then activate the feature locally.</p><div class="receipt safe"><strong>No account. No API key. No arbitrary JavaScript.</strong><span>SHA-256 receipts · live compatibility checks</span></div></section><section class="steps"><article class="step panel"><b>1</b><div><strong>Open a website</strong><p>The extension discovers only repairs matching this exact host and path.</p></div></article><article class="step panel"><b>2</b><div><strong>Review the receipt</strong><p>See permissions, tested selectors, publisher, version, and compatibility status.</p></div></article><article class="step panel"><b>3</b><div><strong>Allow this domain</strong><p>Chrome requests access only for the repair you chose.</p></div></article><article class="step panel"><b>4</b><div><strong>The page works better</strong><p>Disable, update, restore, or remove the repair whenever you want.</p></div></article></section></main>`;}

function smallPromo(){return `<!doctype html><style>${base}html,body{width:440px;height:280px}body{display:grid;place-items:center;background:radial-gradient(circle at 90% 0,#b9f4d8,transparent 35%),#f4fbf7}.wrap{width:365px}.brand{display:flex;align-items:center;gap:12px}.mark{width:48px;height:48px}.mark:after{font-size:23px}.brand strong{font-size:21px}h1{font-size:38px}.safe{display:inline-block;padding:8px 10px;border-radius:9px;font-size:10px}</style><main class="wrap"><div class="brand"><div class="mark"></div><strong>Patch the Web</strong></div><h1>Make broken websites work for you.</h1><span class="safe">Verified · local · reversible</span></main>`;}

function marquee(){return `<!doctype html><style>${base}html,body{width:1400px;height:560px}body{display:grid;place-items:center;background:radial-gradient(circle at 75% 20%,#a9efd0,transparent 30%),#f4fbf7}.wrap{display:grid;grid-template-columns:1fr .75fr;gap:85px;align-items:center;width:1200px}.brand{display:flex;align-items:center;gap:18px}.mark{width:72px;height:72px}.mark:after{font-size:35px}.brand strong{font-size:30px}h1{font-size:73px}.card{padding:30px;border-radius:24px}.card .safe{display:inline-block;padding:8px 10px;border-radius:999px;font-size:10px}.card h2{font-size:27px}.card p{font-size:14px}.proof{margin-top:22px;padding:13px;border-radius:10px;color:#08724f;background:#e7f8ef;font:800 12px monospace}</style><main class="wrap"><section><div class="brand"><div class="mark"></div><strong>Patch the Web</strong></div><h1>The public repair layer for the web.</h1><p>Safe, shareable usability fixes for websites you don’t own.</p></section><section class="card panel"><span class="safe">VERIFIED COMMUNITY REPAIR</span><h2>Accessible, searchable, mobile-friendly.</h2><p>Every transformation is constrained, domain-scoped, selector-tested, and reversible.</p><div class="proof">✓ Policy checked · Live compatibility healthy</div></section></main>`;}

async function capture(name, width, height, html) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: resolve(storeDir, name) });
  await page.close();
}

try {
  for (const size of [16, 48, 128]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(icon(size));
    await page.screenshot({ path: resolve(iconDir, `icon-${size}.png`), omitBackground: true });
    await page.close();
  }
  await capture("screenshot-1-before-after-1280x800.png", 1280, 800, screenshotBeforeAfter());
  await capture("screenshot-2-how-it-works-1280x800.png", 1280, 800, screenshotWorkflow());
  await capture("small-promo-440x280.png", 440, 280, smallPromo());
  await capture("marquee-1400x560.png", 1400, 560, marquee());
} finally {
  await browser.close();
}
