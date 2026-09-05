import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const ARTIFACTS = "/opt/cursor/artifacts";
await mkdir(ARTIFACTS, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: false,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--window-size=430,940",
    "--window-position=40,40",
  ],
  defaultViewport: { width: 430, height: 844, isMobile: true, hasTouch: true },
});

const page = await browser.newPage();
const results = [];

async function shot(name) {
  const path = `${ARTIFACTS}/${name}`;
  await page.screenshot({ path, fullPage: false });
  results.push(path);
}

async function clickText(text) {
  await page.locator(`::-p-text(${text})`).setTimeout(8000).click();
}

async function clickExactButton(label) {
  await page.evaluate((text) => {
    const btn = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === text);
    if (!btn) throw new Error(`Missing button ${text}`);
    btn.click();
  }, label);
}

try {
  await page.goto("http://127.0.0.1:3100/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(800);
  await clickText("Enter HomEx");
  await page.waitForFunction(() => location.pathname !== "/", { timeout: 15000 });
  await sleep(800);

  await page.goto("http://127.0.0.1:3100/search", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("a[href*='/movies/']", { timeout: 15000 });
  await sleep(800);
  const titles = await page.$$eval("a[href*='/movies/'] p.display", (nodes) =>
    nodes.map((n) => n.textContent.trim()),
  );
  results.push(`search-titles:${JSON.stringify(titles)}`);
  await shot("ghana_search_list.png");

  await clickText("King of Tɛma");
  await page.waitForSelector("iframe", { timeout: 15000 });
  await sleep(2000);
  const temaPlayer = await page.evaluate(() => ({
    iframe: document.querySelector("iframe")?.src ?? null,
    title: document.querySelector("h1")?.textContent ?? "",
  }));
  results.push(`tema-player:${JSON.stringify(temaPlayer)}`);
  await shot("ghana_king_of_tema_trailer.png");

  const frame = page.frames().find((f) => f.url().includes("youtube"));
  if (frame) {
    await frame.locator("button.ytp-large-play-button").setTimeout(4000).click().catch(() => undefined);
    await sleep(2000);
    await shot("ghana_king_of_tema_playing.png");
  }

  await page.goto("http://127.0.0.1:3100/search", { waitUntil: "domcontentloaded" });
  await clickText("The Burial of Kojo");
  await page.waitForSelector("iframe", { timeout: 15000 });
  await sleep(1800);
  const kojoPlayer = await page.evaluate(() => ({
    iframe: document.querySelector("iframe")?.src ?? null,
    title: document.querySelector("h1")?.textContent ?? "",
  }));
  results.push(`kojo-player:${JSON.stringify(kojoPlayer)}`);
  await shot("ghana_burial_of_kojo_trailer.png");

  await page.goto("http://127.0.0.1:3100/discover", { waitUntil: "domcontentloaded" });
  await sleep(1000);
  for (let i = 0; i < 2; i += 1) {
    await page.evaluate(() => {
      const skip = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "✕");
      skip?.click();
    });
    await sleep(600);
  }
  await sleep(700);
  await clickExactButton("Trailer");
  await page.waitForSelector("iframe", { timeout: 10000 });
  await sleep(2000);
  const overlay = await page.evaluate(() => ({
    iframe: document.querySelector("iframe")?.src ?? null,
    heading: document.querySelector("h1")?.textContent ?? "",
  }));
  results.push(`discover-overlay:${JSON.stringify(overlay)}`);
  await shot("ghana_discover_trailer_overlay.png");

  console.log(JSON.stringify(results, null, 2));
} catch (error) {
  await shot("ghana_trailers_error.png").catch(() => undefined);
  console.error(error);
  process.exitCode = 1;
} finally {
  await sleep(600);
  await browser.close();
}
