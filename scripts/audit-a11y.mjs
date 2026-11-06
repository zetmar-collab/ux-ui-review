import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { openPage, parseUrl, run } from "./lib.mjs";

const usage = "Użycie: node audit-a11y.mjs <url> [output.json]";

await run(async (browser) => {
  const url = parseUrl(process.argv[2], usage);
  const output = process.argv[3] || "output/a11y-report.json";
  mkdirSync(dirname(resolve(output)), { recursive: true });

  let AxeBuilder;
  try {
    ({ default: AxeBuilder } = await import("@axe-core/playwright"));
  } catch {
    throw new Error(
      "Brak pakietu @axe-core/playwright. W katalogu skilla uruchom: npm install"
    );
  }

  const { context, page } = await openPage(browser, url);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const summary = {
    url,
    timestamp: new Date().toISOString(),
    violations: results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      description: violation.description,
      wcagTags: violation.tags.filter((tag) => tag.startsWith("wcag")),
      affectedNodes: violation.nodes.map((node) => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
    })),
    // Elementy, których axe nie potrafił jednoznacznie ocenić (np. kontrast
    // na tle obrazka) - wymagają ręcznej weryfikacji.
    needsManualCheck: results.incomplete.map((item) => ({
      id: item.id,
      impact: item.impact,
      help: item.help,
      nodes: item.nodes.length,
    })),
    passes: results.passes.length,
  };

  writeFileSync(output, JSON.stringify(summary, null, 2));

  console.log(`Znaleziono ${summary.violations.length} typów naruszeń.`);
  console.log(`Do ręcznej weryfikacji: ${summary.needsManualCheck.length} reguł.`);
  console.log(`Raport: ${resolve(output)}`);

  await context.close();
});
