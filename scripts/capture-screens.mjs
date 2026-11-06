import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { openPage, parseUrl, run } from "./lib.mjs";

const usage = "Użycie: node capture-screens.mjs <url> [output-dir]";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844, isMobile: true },
];

await run(async (browser) => {
  const url = parseUrl(process.argv[2], usage);
  const outputDir = process.argv[3] || "output/screenshots";
  mkdirSync(outputDir, { recursive: true });

  for (const viewport of viewports) {
    const { context, page } = await openPage(browser, url, {
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 2,
      isMobile: Boolean(viewport.isMobile),
      hasTouch: Boolean(viewport.isMobile),
    });

    const file = resolve(outputDir, `${viewport.name}.png`);
    await page.screenshot({ path: file, fullPage: true });

    console.log(`Zapisano: ${file}`);
    await context.close();
  }
});
