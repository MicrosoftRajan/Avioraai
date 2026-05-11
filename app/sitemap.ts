import type { MetadataRoute } from "next";

/** Public routes only (no auth). Set NEXT_PUBLIC_SITE_URL in production (https://yourdomain.com). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000";

  const root = base.replace(/\/$/, "");

  return [
    {
      url: root,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${root}/landing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
  ];
}
