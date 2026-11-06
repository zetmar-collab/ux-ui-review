import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { openPage, parseUrl, run } from "./lib.mjs";

const usage = "Użycie: node extract-ui-copy.mjs <url> [output.json]";

await run(async (browser) => {
  const url = parseUrl(process.argv[2], usage);
  const output = process.argv[3] || "output/ui-copy.json";
  mkdirSync(dirname(resolve(output)), { recursive: true });

  const { context, page } = await openPage(browser, url);

  const { items, skippedLong } = await page.evaluate(() => {
    const selector = [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "span", "label", "legend", "button", "a", "summary",
      "input", "textarea", "select", "img",
      "[role='button']", "[role='link']", "[role='alert']", "[role='status']",
      "[aria-label]", "[placeholder]", "[title]",
    ].join(",");

    const clean = (value) => (value ?? "").replace(/\s+/g, " ").trim();
    const seen = new Set();
    const found = [];
    let skippedLong = 0;

    for (const element of document.querySelectorAll(selector)) {
      // Pomijamy elementy niewidoczne dla użytkownika.
      if (element.checkVisibility && !element.checkVisibility()) continue;

      const text = clean(element.innerText);
      const ariaLabel = clean(element.getAttribute("aria-label"));
      const placeholder = clean(element.getAttribute("placeholder"));
      const title = clean(element.getAttribute("title"));
      const isImage = element.tagName === "IMG";
      const alt = isImage ? element.getAttribute("alt") : null;
      // Obrazy zawsze trafiają do wyniku, także bez atrybutu alt (to jest właśnie błąd).
      const src = isImage ? (element.getAttribute("src") || "").slice(0, 120) : null;

      if (!isImage && !text && !ariaLabel && !placeholder && !title) continue;

      // Pomijamy zagnieżdżone duplikaty (np. <button><span>Zapisz</span></button>).
      const parentMatch = element.parentElement?.closest(selector);
      if (text && parentMatch && clean(parentMatch.innerText) === text) continue;

      if (text.length > 300) {
        skippedLong += 1;
        continue;
      }

      const tag = element.tagName.toLowerCase();
      const key = JSON.stringify([tag, text, ariaLabel, placeholder, title, alt, src]);
      if (seen.has(key)) continue;
      seen.add(key);

      found.push({
        tag,
        role: element.getAttribute("role"),
        type: element.getAttribute("type"),
        text: text || null,
        ariaLabel: ariaLabel || null,
        placeholder: placeholder || null,
        title: title || null,
        alt, // dla <img>: "" = obraz dekoracyjny, null = brak atrybutu alt (błąd)
        src,
        required: "required" in element ? Boolean(element.required) : null,
        href: element.getAttribute("href"),
      });
    }

    return { items: found, skippedLong };
  });

  writeFileSync(output, JSON.stringify({ url, items, skippedLongTexts: skippedLong }, null, 2));

  console.log(`Wyekstrahowano ${items.length} elementów tekstowych.`);
  if (skippedLong > 0) {
    console.log(`Pominięto ${skippedLong} bardzo długich tekstów (>300 znaków).`);
  }
  console.log(`Wynik: ${resolve(output)}`);

  await context.close();
});
