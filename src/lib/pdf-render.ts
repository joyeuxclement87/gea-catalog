/**
 * Renders the dedicated /catalogue/print route into an A4 PDF buffer using the
 * same Supabase data and GEA branding as the website — not a screenshot of the
 * web catalogue. A missing or broken image never fails generation: every image
 * load is awaited with an error-tolerant listener.
 */
export async function renderCataloguePdf(baseUrl?: string): Promise<Buffer> {
  const resolvedBase = (
    baseUrl
    ?? process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.CATALOGUE_URL || "http://localhost:3000")
  ).replace(/\/+$/, "");
  const printUrl = new URL("/catalogue/print", resolvedBase).toString();

  // Loaded lazily so pages and routes that only touch PDF status (the admin PDF
  // page, status/download APIs, image uploads that mark the PDF outdated) never
  // pull a browser library into their serverless bundles. puppeteer-core is
  // used instead of playwright-core because it has no browsers.json registry
  // lookup — that file is missed by Vercel's file tracing and broke every
  // route in the pdf-status module graph on deployed (serverless) environments.
  const [{ default: chromium }, { launch }] = await Promise.all([
    import("@sparticuz/chromium"),
    import("puppeteer-core"),
  ]);

  let browser: Awaited<ReturnType<typeof launch>> | null = null;
  try {
    browser = await launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    await page
      .goto(printUrl, { waitUntil: "networkidle0", timeout: 90_000 })
      .catch(() => page.goto(printUrl, { waitUntil: "domcontentloaded", timeout: 90_000 }));

    await page.emulateMediaType("print");

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
      // Give error-fallback placeholders a moment to swap in before printing.
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser?.close();
  }
}