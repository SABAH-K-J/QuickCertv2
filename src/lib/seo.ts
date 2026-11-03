export const SITE_NAME = "QuickCert";
export const SITE_TAGLINE = "Certificates at any scale";
export const SITE_DESCRIPTION =
  "Design a certificate template, fill placeholders from a spreadsheet, and download one PNG per recipient. Free, open source, and private by default.";

const rawSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "";

/** Absolute site URL without a trailing slash, or "" when unset. */
export const SITE_URL = rawSiteUrl.trim().replace(/\/+$/, "");

export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return SITE_URL ? `${SITE_URL}${clean}` : clean;
}

export interface PageHeadOptions {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Returns TanStack Router head metadata for a public page.
 * Canonical and absolute OG URLs are only emitted when VITE_SITE_URL is set,
 * so preview deployments never advertise a false production domain.
 */
export function pageHead({
  title,
  description,
  path,
  type = "website",
  noindex = false,
  image,
  jsonLd,
}: PageHeadOptions) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image ?? "/og-image.svg");

  const meta: Record<string, string>[] = [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
  ];

  if (SITE_URL) {
    meta.push(
      { property: "og:url", content: canonical },
      { property: "og:image", content: ogImage },
      { property: "og:image:alt", content: `${SITE_NAME} — ${SITE_TAGLINE}` },
      { name: "twitter:image", content: ogImage },
    );
  }

  if (noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  const links = SITE_URL ? [{ rel: "canonical", href: canonical }] : [];

  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const scripts = schemas.map((schema) => ({
    type: "application/ld+json",
    children: JSON.stringify({ "@context": "https://schema.org", ...schema }),
  }));

  return { meta, links, scripts };
}

export function organizationJsonLd() {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL || undefined,
    logo: SITE_URL ? absoluteUrl("/android-chrome-512x512.png") : undefined,
    sameAs: ["https://github.com/SABAH-K-J/QuickCertV2"],
  };
}
