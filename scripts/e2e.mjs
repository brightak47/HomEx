import puppeteer from "puppeteer-core";
import fs from "node:fs";

const outDir = "/opt/cursor/artifacts";
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=390,844"],
  defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
});

const page = await browser.newPage();
page.setDefaultTimeout(25000);
const notes = [];

async function shot(name) {
  const path = `${outDir}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  notes.push(`screenshot ${path} @ ${page.url()}`);
}

async function login(email) {
  const response = await fetch("http://127.0.0.1:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "homex123" }),
  });
  const setCookie = response.headers.getSetCookie?.() ?? [];
  const cookieHeader = response.headers.get("set-cookie") || "";
  const raw = setCookie.length ? setCookie.join("\n") : cookieHeader;
  const match = raw.match(/homex_session=([^;]+)/);
  if (!match) throw new Error(`No session cookie for ${email}: ${await response.text()}`);
  await page.setCookie({
    name: "homex_session",
    value: decodeURIComponent(match[1]),
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
  });
}

try {
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle0" });
  notes.push(`splash: ${(await page.evaluate(() => document.body.innerText)).slice(0, 200)}`);
  await shot("login_splash");

  await login("viewer@homex.app");
  await page.goto("http://127.0.0.1:3000/discover", { waitUntil: "networkidle0" });
  await sleep(1500);
  notes.push(`discover url ${page.url()}`);
  notes.push(`discover: ${(await page.evaluate(() => document.body.innerText)).slice(0, 500)}`);
  await shot("discover_swipe");

  const neonId = await page.evaluate(async () => {
    const data = await fetch("/api/premieres").then((r) => r.json());
    return data.premieres.find((p) => p.title === "Neon Harbor")?.id;
  });
  notes.push(`neon id ${neonId}`);
  await page.goto(`http://127.0.0.1:3000/premiere/${neonId}`, { waitUntil: "networkidle0" });
  await sleep(2500);
  notes.push(`premiere: ${(await page.evaluate(() => document.body.innerText)).slice(0, 500)}`);
  await shot("premiere_room");

  await page.goto("http://127.0.0.1:3000/tickets", { waitUntil: "networkidle0" });
  await sleep(800);
  notes.push(`tickets: ${(await page.evaluate(() => document.body.innerText)).slice(0, 400)}`);
  await shot("my_tickets");

  const tideId = await page.evaluate(async () => {
    const data = await fetch("/api/premieres").then((r) => r.json());
    return data.premieres.find((p) => p.title === "The Last Overture")?.id;
  });
  await page.goto(`http://127.0.0.1:3000/checkout/${tideId}`, { waitUntil: "networkidle0" });
  await sleep(800);
  notes.push(`checkout: ${(await page.evaluate(() => document.body.innerText)).slice(0, 300)}`);
  await shot("checkout");
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /Confirm ticket/i.test(b.textContent || ""));
    btn?.click();
  });
  await page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {});
  await sleep(1000);
  notes.push(`confirmed: ${(await page.evaluate(() => document.body.innerText)).slice(0, 300)}`);
  await shot("ticket_confirmed");

  await page.goto("http://127.0.0.1:3000/profile", { waitUntil: "networkidle0" });
  await sleep(600);
  notes.push(`profile: ${(await page.evaluate(() => document.body.innerText)).slice(0, 300)}`);
  await shot("viewer_profile");

  await page.deleteCookie({ name: "homex_session" });
  await login("producer@homex.app");
  await page.goto("http://127.0.0.1:3000/producer", { waitUntil: "networkidle0" });
  await sleep(800);
  notes.push(`producer: ${(await page.evaluate(() => document.body.innerText)).slice(0, 400)}`);
  await shot("producer_dashboard");

  await page.deleteCookie({ name: "homex_session" });
  await login("admin@homex.app");
  await page.goto("http://127.0.0.1:3000/admin", { waitUntil: "networkidle0" });
  await sleep(800);
  notes.push(`admin: ${(await page.evaluate(() => document.body.innerText)).slice(0, 400)}`);
  await shot("admin_dashboard");

  fs.writeFileSync("/tmp/homex-e2e-notes.txt", notes.join("\n"));
  console.log(notes.join("\n"));
} catch (error) {
  await shot("error_state");
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
