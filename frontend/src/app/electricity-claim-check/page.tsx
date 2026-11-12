import type { Metadata } from "next";
import { constructMetadata, SITE_URL } from "@/lib/seo";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { GreenGuardDashboard } from "@/components/GreenGuardDashboard";

export const metadata: Metadata = constructMetadata({
  title: "Electricity Bill & Sustainability Claim Check",
  description:
    "Cross-examine corporate sustainability report savings against 24-month utility meter bills, baselines, and operating days using zero-leak offline verification.",
  path: "/electricity-claim-check",
});

export default function ElectricityClaimCheckPage() {
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
              name: "Electricity Claim Check",
              item: `${SITE_URL}/electricity-claim-check`,
            },
          ],
        }}
      />
      <SchemaMarkup
        type="SoftwareApplication"
        data={{
          name: "GreenGuard Electricity Claim Verifier",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/electricity-claim-check`,
          description:
            "Deterministic offline electricity claim verification engine comparing sustainability reports with 24-month meter telemetry.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }}
      />
      <GreenGuardDashboard
        initialTab="review"
        lockToTab={true}
        showOverviewCards={false}
        pageTitle="Electricity Bill & Sustainability Claim Verification"
        pageSubtitle="Verify applicant energy efficiency claims against 24-month meter telemetry using deterministic Decimal math and local document intelligence."
      />
    </>
  );
}
