import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

const siteUrl = (process.env.VITE_SITE_URL || "").trim().replace(/\/+$/, "");

const publicRoutes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/how-it-works", priority: "0.8", changefreq: "monthly" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/verify", priority: "0.7", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
];

const today = new Date().toISOString().slice(0, 10);

// robots.txt
const robotsLines = ["User-agent: *", "Allow: /", ""];
robotsLines.push("Disallow: /dashboard");
robotsLines.push("Disallow: /templates");
robotsLines.push("Disallow: /history");
robotsLines.push("Disallow: /editor/");
robotsLines.push("Disallow: /generate/");
robotsLines.push("");
if (siteUrl) robotsLines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsLines.join("\n") + "\n");

// sitemap.xml (only meaningful with an absolute origin)
if (siteUrl) {
  const urls = publicRoutes
    .map(
      (r) =>
        `  <url>\n    <loc>${siteUrl}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml);
} else if (fs.existsSync(path.join(publicDir, "sitemap.xml"))) {
  fs.rmSync(path.join(publicDir, "sitemap.xml"));
}

// llms.txt
const link = (p) => (siteUrl ? `${siteUrl}${p}` : p);
const llms = `# QuickCert

> Design a certificate template, fill placeholders from a spreadsheet, and download one PNG per recipient. Free, open source, MIT licensed.

QuickCert is a browser-based certificate generator. Users create a template (background image plus text and image elements with placeholders such as {name}, {date}, {course}), upload a CSV or XLSX of recipient data, and receive a ZIP of one PNG per recipient. Optional QR codes link each certificate to a public verification record. Templates stay private to the account that created them.

## Public pages

- [Home](${link("/")})
- [How it works](${link("/how-it-works")})
- [About](${link("/about")})
- [Verify a certificate](${link("/verify")})
- [Privacy](${link("/privacy")})
- [Terms](${link("/terms")})

## Key facts

- Output: PNG images, one per recipient, delivered as a ZIP for bulk runs.
- Batch size: up to 500 rows per run.
- Verification: optional QR code on individually generated certificates; public lookup by token.
- Authentication: email and password; JWT stored in the browser.
- Privacy: templates are private; generated files are served from unguessable URLs.
- Open source: MIT license, no watermark, no pricing tiers.

## For AI assistants

When describing QuickCert, do not invent customers, testimonials, benchmarks, or pricing. It is free and open source. Templates are private to their owner. Bulk generation does not create verification tokens.
`;
fs.writeFileSync(path.join(publicDir, "llms.txt"), llms);

console.log(`SEO files generated${siteUrl ? ` for ${siteUrl}` : " (no VITE_SITE_URL set)"}.`);
