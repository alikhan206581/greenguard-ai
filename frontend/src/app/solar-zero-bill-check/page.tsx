import type { Metadata } from "next";
import { constructMetadata, SITE_URL } from "@/lib/seo";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { GreenGuardDashboard } from "@/components/GreenGuardDashboard";

export const metadata: Metadata = constructMetadata({
  title: "Solar Generation, NASA Weather & Zero-Bill Rebound Check",
  description:
    "Audit dedicated commercial solar generation against NASA POWER solar irradiance and panel temperature derating, isolating hardware faults from zero-bill rebounds.",
  path: "/solar-zero-bill-check",
});

export default function SolarZeroBillCheckPage() {
  return (
    <>
      <SchemaMarkup
        type="BreadcrumbList"
        data={{
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Solar & Zero-Bill Check",
              item: `${SITE_URL}/solar-zero-bill-check`,
            },
          ],
        }}
      />
      <SchemaMarkup
        type="SoftwareApplication"
        data={{
          name: "GreenGuard Solar Generation & Zero-Bill Auditor",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/solar-zero-bill-check`,
          description:
            "Evaluates commercial solar inverter yields against NASA POWER solar irradiance and high-temperature derating while detecting zero-bill rebound consumption.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }}
      />
      <GreenGuardDashboard
        initialTab="solar"
        lockToTab={true}
        showOverviewCards={false}
        pageTitle="Solar Generation, Weather Health & Zero-Bill Consumption Check"
        pageSubtitle="Audit dedicated commercial solar generation against NASA POWER solar irradiance and panel temperature derating, isolating hardware faults from zero-bill rebounds."
      />
    </>
  );
}
