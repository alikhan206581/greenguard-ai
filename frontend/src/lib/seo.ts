import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://greenguard.argrowthlab.pk";

export const DEFAULT_SEO = {
  title: "GreenGuard AI — Offline Energy Claim & Green Finance Verification",
  description:
    "Institutional offline document intelligence and quantitative audit engine. Cross-examine corporate electricity-saving claims, solar telemetry, and NASA agroclimatology with zero data leakage.",
  ogImage: "/images/og-default.webp",
};

interface MetadataProps {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noindex?: boolean;
}

export function constructMetadata({
  title,
  description = DEFAULT_SEO.description,
  path = "",
  ogImage = DEFAULT_SEO.ogImage,
  noindex = false,
}: MetadataProps = {}): Metadata {
  const fullTitle = title ? `${title} | GreenGuard AI` : DEFAULT_SEO.title;
  const canonicalUrl = path ? `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}` : SITE_URL;
  const fullOgImage = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage.startsWith("/") ? ogImage : `/${ogImage}`}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: "GreenGuard AI",
      locale: "en_PK",
      type: "website",
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [fullOgImage],
    },
    icons: {
      icon: "/icon.svg",
      shortcut: "/favicon.svg",
      apple: "/icon.svg",
    },
  };
}
