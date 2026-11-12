import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { GreenGuardDashboard } from "@/components/GreenGuardDashboard";

export const metadata: Metadata = constructMetadata({
  title: "Institutional Energy Claim Verification Suite",
  description:
    "Cross-examine industrial energy efficiency and solar generation claims against 24-month meter telemetry and NASA POWER agroclimatology with zero data leakage.",
  path: "/",
});

export default function HomePage() {
  return (
    <GreenGuardDashboard
      initialTab="review"
      lockToTab={false}
      showOverviewCards={true}
      pageTitle="Verify Energy-Saving Claims Against Real Meter & Weather Records"
      pageSubtitle="Institutional green finance audit workbench combining local LLM extraction, deterministic Decimal math, NASA POWER agroclimatology, and subgroup fairness controls."
    />
  );
}
