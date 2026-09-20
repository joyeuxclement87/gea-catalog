import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  // Keep the browser runtime out of the Turbopack bundle: Vercel ships external
  // packages as whole node_modules directories, so the chromium binary under
  // @sparticuz/chromium/bin and puppeteer-core's files (it has no browsers.json
  // registry lookup, unlike playwright-core) are always present at runtime.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/catalogue/pdf": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/api/catalogue/pdf/cron": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/api/admin/pdf/generate": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
