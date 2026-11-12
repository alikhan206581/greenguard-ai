import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://greenguard.argrowthlab.pk";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/_next/static/", "/_next/image"],
      disallow: [
        "/api/",
        "/_next/data/",
        "/*?sort=",
        "/*?filter=",
        "/*?search=",
        "/*?utm_",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
