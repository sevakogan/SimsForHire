import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/blog/"],
        disallow: [
          "/dashboard",
          "/leads",
          "/clients",
          "/projects",
          "/marketing",
          "/admin",
          "/profile",
          "/customizations",
          "/company",
          "/notifications",
          "/payment-setup",
          "/portal",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: "https://simsforhire.com/sitemap.xml",
  };
}
