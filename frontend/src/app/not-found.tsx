import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { FileQuestion, Home, FileCheck, Sun, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The requested energy audit verification route could not be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#eef0f5] flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      <div>
        <Header activeTab="home" />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex flex-col justify-center items-center text-center">
          <div className="p-4 rounded-2xl bg-[#09090B] text-white shadow-md mb-6">
            <FileQuestion className="h-12 w-12 text-amber-400 stroke-[2]" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-[#DC2626] border border-red-200 mb-3">
            Error 404 &bull; Missing Route
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-[#09090B] tracking-tight mb-3">
            404 — Verification Page Not Found
          </h1>

          <p className="text-sm text-slate-600 max-w-lg mb-8 leading-relaxed font-medium">
            The requested energy verification audit route or document record does not exist. Please navigate to one of our core audit workspaces:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
            <Link
              href="/"
              className="p-5 rounded-2xl bg-[#FFFFFF] border-2 border-[#09090B] hover:bg-slate-50 transition shadow-xs group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-lg bg-[#09090B] text-white">
                  <Home className="h-4 w-4 text-emerald-400" />
                </div>
                <h2 className="text-sm font-black text-[#09090B] group-hover:text-[#059669] transition">
                  Platform Overview
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Unified institutional energy claim verification suite and audit vault.
              </p>
            </Link>

            <Link
              href="/electricity-claim-check"
              className="p-5 rounded-2xl bg-[#FFFFFF] border-2 border-slate-300 hover:border-[#059669] hover:bg-slate-50 transition shadow-xs group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-[#059669] border border-emerald-200">
                  <FileCheck className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-black text-[#09090B] group-hover:text-[#059669] transition">
                  Electricity Claim Check
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Compare PDF sustainability claims against 24-month meter records.
              </p>
            </Link>

            <Link
              href="/solar-zero-bill-check"
              className="p-5 rounded-2xl bg-[#FFFFFF] border-2 border-slate-300 hover:border-[#2563EB] hover:bg-slate-50 transition shadow-xs group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200">
                  <Sun className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-black text-[#09090B] group-hover:text-[#2563EB] transition">
                  Solar &amp; Zero-Bill Check
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Evaluate net-metering telemetry and NASA weather expected yields.
              </p>
            </Link>

            <Link
              href="/fairness-and-robustness"
              className="p-5 rounded-2xl bg-[#FFFFFF] border-2 border-slate-300 hover:border-[#09090B] hover:bg-slate-50 transition shadow-xs group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-lg bg-slate-100 text-[#09090B] border border-slate-300">
                  <Scale className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-black text-[#09090B] group-hover:text-[#09090B] transition">
                  Fairness &amp; Adversarial Audit
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                C03 Subgroup FPR parity (&le; 10%) and C09 &plusmn;2% adversarial defense.
              </p>
            </Link>
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-200/80 bg-white/70 py-6 text-xs text-slate-500 text-center">
        <span>GreenGuard AI &bull; Institutional Energy Claim Verification &bull; 404 Recovery</span>
      </footer>
    </div>
  );
}
