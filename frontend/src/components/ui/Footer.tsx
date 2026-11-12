import React from "react";
import Link from "next/link";
import { ShieldCheck, FileCheck, Sun, Scale, FileCode, Map } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-[#09090B] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-[#059669]" />
              </div>
              <span className="text-lg font-black tracking-tight text-[#09090B]">
                GreenGuard AI
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed font-medium">
              Institutional offline ESG verification architecture. We audit corporate energy efficiency and solar generation claims against 24-month meter telemetry, bi-directional inverter logs, and NASA POWER agroclimatology data with zero external data leakage.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold space-y-1">
              <div className="text-[#09090B] font-black uppercase tracking-wider text-[11px]">
                Deterministic Offline Trust Statement
              </div>
              <div>
                All mathematical reconciliations run locally using high-precision Decimal arithmetic adhering to ISO 14064-2 greenhouse gas verification principles and IPMVP standards.
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#09090B] mb-4">
              Verification Workspaces
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600 list-none p-0 m-0">
              <li>
                <Link
                  href="/electricity-claim-check"
                  className="flex items-center space-x-2 hover:text-[#059669] transition"
                >
                  <FileCheck className="h-3.5 w-3.5 text-[#059669]" />
                  <span>Electricity Claim Check</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/solar-zero-bill-check"
                  className="flex items-center space-x-2 hover:text-[#2563EB] transition"
                >
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span>Solar &amp; Zero-Bill Check</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/fairness-and-robustness"
                  className="flex items-center space-x-2 hover:text-[#09090B] transition"
                >
                  <Scale className="h-3.5 w-3.5 text-[#09090B]" />
                  <span>Fairness &amp; Adversarial Audit</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="flex items-center space-x-2 hover:text-[#059669] transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Platform Overview</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#09090B] mb-4">
              Machine &amp; Crawler Specs
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600 list-none p-0 m-0">
              <li>
                <Link
                  href="/sitemap.xml"
                  className="flex items-center space-x-2 hover:text-[#059669] transition"
                >
                  <Map className="h-3.5 w-3.5 text-blue-600" />
                  <span>XML Sitemap (sitemap.xml)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/llms.txt"
                  className="flex items-center space-x-2 hover:text-[#059669] transition"
                >
                  <FileCode className="h-3.5 w-3.5 text-emerald-600" />
                  <span>LLMs Manifest (llms.txt)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/robots.txt"
                  className="flex items-center space-x-2 hover:text-[#059669] transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
                  <span>Robots Policy (robots.txt)</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-3">
          <div>
            &copy; {new Date().getFullYear()} GreenGuard AI &bull; Sovereign FinTech Audit Architecture.
          </div>
          <div className="flex items-center space-x-4">
            <span>Air-Gapped Local Inference</span>
            <span>&bull;</span>
            <span>NASA POWER Climatology</span>
            <span>&bull;</span>
            <span>FPR Parity Audited</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
