import { chromium } from "playwright";

const baseUrl = process.env.CATALOGUE_URL ?? "http://localhost:3000/catalogue";
const outputPath = process.argv[2] ?? "./gea-catalogue-2026.pdf";

async function exportPdf() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images).map((image) => {
          if (image.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }),
      );
    });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log(`Catalogue PDF written to ${outputPath}`);
  } finally {
    await browser.close();
  }
}

exportPdf().catch((error) => {
  console.error("PDF export failed.", error);
  process.exitCode = 1;
});
