import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const err = []; p.on("pageerror", e => err.push("★ " + e.message));
await p.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);
const s = p.locator("button", { hasText: "SALTAR" });
if (await s.count()) { await s.first().click(); await p.waitForTimeout(700); }
await p.locator("button", { hasText: "NUTRICION" }).first().click();
await p.waitForTimeout(900);
await p.screenshot({ path: "nutri.png" });
await b.close();
console.log(err.join("\n") || "sin errores");
