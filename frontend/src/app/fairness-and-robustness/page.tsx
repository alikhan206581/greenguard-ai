import type { Metadata } from "next";
import { constructMetadata, SITE_URL } from "@/lib/seo";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { GreenGuardDashboard } from "@/components/GreenGuardDashboard";

export const metadata: Metadata = constructMetadata({
  title: "Regional Fairness (C03) & Adversarial Robustness (C09) Audit",
  description:
    "Audit GreenGuard AI algorithmic fairness across Pakistani provinces and enterprise tiers with FPR disparity <= 10%, plus 3-stage adversarial defense testing.",
  path: "/fairness-and-robustness",
});

export default function FairnessAndRobustnessPage() {
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
              name: "Fairness & Adversarial Audit",
              item: `${SITE_URL}/fairness-and-robustness`,
            },
          ],
        }}
      />
      <SchemaMarkup
        type="SoftwareApplication"
        data={{
          name: "GreenGuard Algorithmic Fairness & Adversarial Defense Auditor",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/fairness-and-robustness`,
          description:
            "Evaluates slice-based algorithmic bias and FPR disparity across Pakistani industrial regions while executing 3-stage adversarial input defense.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }}
      />
      <GreenGuardDashboard
        initialTab="fairness"
        lockToTab={true}
        showOverviewCards={false}
        pageTitle="Regional Fairness & Adversarial Robustness Audit"
        pageSubtitle="Slice-based algorithmic bias evaluation across regional provinces and enterprise sizes (C03), plus 3-stage defense against adversarial input perturbations (C09)."
      />
    </>
  );
}
