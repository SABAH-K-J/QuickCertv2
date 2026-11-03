# QuickCert — Frontend

Live site: https://quick-certv2.vercel.app/

Backend repository: https://github.com/SABAH-K-J/QuickCertV2-backend

## What QuickCert does
Design a certificate template (background image + text/image elements with placeholders such as `{name}`, `{date}`, `{course}`), fill placeholders from a CSV or XLSX, and download one PNG per recipient. Bulk runs return a ZIP. Optional QR codes link individual certificates to a public verification record.

## Stack
- React + TanStack Start (SSR routing)
- Vite
- Tailwind CSS + shadcn/ui
- TanStack Query
- Fabric.js (canvas editor)

## What's in this repo
- Public marketing/help/legal/SEO pages: `/`, `/how-it-works`, `/about`, `/privacy`, `/terms`, `/verify`
- Authenticated app: `/dashboard`, `/templates`, `/editor/$id`, `/generate/$id`, `/history`
- Security Print design system (self-hosted Bodoni Moda / Archivo / Spline Sans Mono)
- SEO, GEO, and AEO assets: `robots.txt`, `sitemap.xml` (env-gated on `VITE_SITE_URL`), `llms.txt`, Open Graph image
- Editor: autosave queue, alignment-origin fix, keyboard nudge, layers, background replacement

## Environment
Copy `.env.example` to `.env`:
- `VITE_API_BASE` — backend URL (default `http://localhost:8000`)
- `VITE_SITE_URL` (optional) — absolute public URL for canonical/OG/sitemap/llms.txt

## Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## License
MIT. Free and open source, no watermark.