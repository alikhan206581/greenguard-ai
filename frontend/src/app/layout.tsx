import "./globals.css";
import type { Metadata } from "next";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { constructMetadata, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-[#eef0f5] text-slate-800 antialiased selection:bg-emerald-500 selection:text-white min-h-screen">
        <SchemaMarkup
          type="Organization"
          data={{
            name: "GreenGuard AI",
            url: SITE_URL,
            logo: `${SITE_URL}/icon.svg`,
            description:
              "Institutional offline document intelligence and quantitative energy claim verification engine.",
            sameAs: [SITE_URL],
          }}
        />
        <SchemaMarkup
          type="WebSite"
          data={{
            name: "GreenGuard AI",
            url: SITE_URL,
          }}
        />
        {children}
      </body>
    </html>
  );
}
