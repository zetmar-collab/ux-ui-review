import { existsSync } from "node:fs";

/** Sprawdza adres: tylko http/https. */
export function parseUrl(raw, usage) {
  if (!raw) {
    throw new Error(usage);
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Niepoprawny adres: ${raw}. ${usage}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Obsługiwane są tylko adresy http i https, otrzymano: ${url.protocol}`);
  }
  return url.href;
}

/**
 * Uruchamia zadanie z przeglądarką Chromium, zawsze ją zamyka
 * i zamiast stosu wywołań wypisuje krótki komunikat błędu.
 */
export async function run(task) {
  let browser;
  try {
    let chromium;
    try {
      ({ chromium } = await import("playwright"));
    } catch {
      throw new Error(
        "Brak pakietu playwright. W katalogu skilla uruchom: npm install && npx playwright install chromium"
      );
    }
    browser = await chromium.launch();
    await task(browser);
  } catch (error) {
    const message = String(error?.message ?? error).split("\n")[0];
    console.error(`Błąd: ${message}`);
    if (message.includes("Executable doesn't exist")) {
      console.error("Zainstaluj przeglądarkę: npx playwright install chromium");
    }
    process.exitCode = 1;
  } finally {
    await browser?.close();
  }
}

/**
 * Otwiera stronę. Jeśli ustawiono zmienną STORAGE_STATE, używa zapisanej
 * sesji (ekrany za logowaniem). Nie czeka bez końca na "networkidle",
 * bo aplikacje deweloperskie (HMR, websockety) często nigdy się nie wyciszają.
 */
export async function openPage(browser, url, contextOptions = {}) {
  const storageState = process.env.STORAGE_STATE;
  if (storageState && !existsSync(storageState)) {
    throw new Error(`Nie znaleziono pliku sesji STORAGE_STATE: ${storageState}`);
  }

  const context = await browser.newContext({
    ...contextOptions,
    ...(storageState ? { storageState } : {}),
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
  } catch (error) {
    const reason = String(error?.message ?? error).split("\n")[0];
    throw new Error(`Nie można otworzyć ${url} (${reason}). Sprawdź, czy aplikacja działa i adres jest poprawny.`);
  }
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

  return { context, page };
}
