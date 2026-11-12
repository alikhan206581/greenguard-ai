import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://greenguard.argrowthlab.pk";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/electricity-claim-check`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/solar-zero-bill-check`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/fairness-and-robustness`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
