"use client";

import React from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  FileDown,
} from "lucide-react";
import { VerificationResponse } from "../lib/types";
import { formatKwh, formatPercent } from "../lib/utils";
import { getExportPdfUrl } from "../lib/api";

interface VerdictBannerProps {
  data: VerificationResponse;
}

export function VerdictBanner({ data }: VerdictBannerProps) {
  const isSupported = data.verdict === "SUPPORTED BY SUPPLIED EVIDENCE";
  const isContradicted = data.verdict === "CONTRADICTED BY SUPPLIED EVIDENCE";
  const isInsufficient = data.verdict === "INSUFFICIENT EVIDENCE";

  const bannerColor = isSupported
    ? "border-emerald-300 bg-white shadow-sm glow-emerald"
    : isContradicted
    ? "border-rose-300 bg-white shadow-sm glow-crimson"
    : "border-amber-300 bg-white shadow-sm glow-amber";

  const badgeColor = isSupported
    ? "bg-emerald-600 text-white font-bold"
    : isContradicted
    ? "bg-rose-600 text-white font-bold"
    : "bg-amber-600 text-white font-bold";

  return (
    <div className={`rounded-2xl p-6 border transition-all duration-300 ${bannerColor}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-start space-x-4">
          <div
            className={`p-3 rounded-xl mt-0.5 ${
              isSupported
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : isContradicted
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-amber-50 text-amber-600 border border-amber-200"
            }`}
          >
            {isSupported && <ShieldCheck className="h-8 w-8 stroke-[2.2]" />}
            {isContradicted && <AlertTriangle className="h-8 w-8 stroke-[2.2]" />}
            {isInsufficient && <HelpCircle className="h-8 w-8 stroke-[2.2]" />}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-3 py-1 rounded-md text-xs tracking-wider uppercase shadow-xs ${badgeColor}`}>
                {data.verdict}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs bg-slate-50 border border-slate-200 text-slate-700">
                Audit ID: <span className="font-mono text-emerald-700 font-semibold">{data.audit_id}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs bg-slate-50 border border-slate-200 text-slate-600">
                {data.privacy_badge}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-1">
              {data.extracted_claim.company_name}
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              {data.verdict_reason}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start lg:self-auto shrink-0">
          <a
            href={getExportPdfUrl(data.audit_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition shadow-xs hover:shadow-sm"
          >
            <FileDown className="h-4 w-4 text-emerald-600" />
            <span>Download PDF Audit Report</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Claimed Savings (PDF)</div>
          <div className="text-xl font-bold text-slate-900">
            <AnimatedNumber value={data.extracted_claim.claimed_reduction_pct.value} decimals={2} suffix="%"/>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {formatKwh(data.extracted_claim.claimed_reduction_kwh.value)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Calculated Savings (Meter)</div>
          <div
            className={`text-xl font-bold ${
              data.calculations.calculated_total_reduction_pct > 0
                ? "text-emerald-700"
                : "text-slate-800"
            }`}
          >
            <AnimatedNumber value={data.calculations.calculated_total_reduction_pct} decimals={2} suffix="%"/>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {formatKwh(data.calculations.calculated_total_reduction_kwh)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Discrepancy Gap</div>
          <div
            className={`text-xl font-bold font-mono ${
              Math.abs(data.calculations.discrepancy_pct_points) > 2.0
                ? "text-rose-600"
                : "text-emerald-700"
            }`}
          >
            <AnimatedNumber value={data.calculations.discrepancy_pct_points} decimals={2} suffix=" pp" signed/>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {formatKwh(data.calculations.discrepancy_kwh)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Meter Data Completeness</div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {data.meter_evidence.data_completeness}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {data.meter_evidence.baseline_months_count}m baseline / {data.meter_evidence.reporting_months_count}m reporting
          </div>
        </div>
      </div>
    </div>
  );
}
