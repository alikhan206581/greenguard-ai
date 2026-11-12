"use client";

import React from "react";
import {
  FileText,
  Table,
  AlertTriangle,
  Quote,
  Scale,
} from "lucide-react";
import { VerificationResponse } from "../lib/types";
import { formatKwh, formatPercent } from "../lib/utils";

interface SideBySideComparisonProps {
  data: VerificationResponse;
}

export function SideBySideComparison({ data }: SideBySideComparisonProps) {
  const claim = data.extracted_claim;
  const meter = data.meter_evidence;
  const calcs = data.calculations;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Scale className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Side-By-Side Evidence Reconciliation
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          Source PDF claims cross-checked against 24-month utility telemetry
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Claimed in Sustainability Report</h4>
                  <p className="text-xs text-slate-500">Self-reported company declaration</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                Borrower PDF
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <span className="text-xs text-slate-500 block mb-1">Company &amp; Facility</span>
                <span className="text-sm font-semibold text-slate-900 block truncate">
                  {claim.company_name}
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block truncate">
                  {claim.facility_name.value || "Main Plant"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <span className="text-xs text-slate-500 block mb-1">Region &amp; Size</span>
                <span className="text-sm font-semibold text-slate-900 block">
                  {claim.region}
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {claim.business_size} Enterprise
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <span className="text-xs text-slate-500 block mb-1">Claimed Savings Percentage</span>
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {formatPercent(claim.claimed_reduction_pct.value)}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Reported target reduction
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <span className="text-xs text-slate-500 block mb-1">Claimed Energy Volume</span>
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {formatKwh(claim.claimed_reduction_kwh.value)}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Electricity savings claimed
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Claim Boundary Scope</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {claim.claim_boundary_type.replace(/_/g, " ")}
                </span>
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">
                Intervention: <strong className="text-slate-900">{claim.stated_intervention.value || "Energy conservation"}</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-800">
                  <Quote className="h-3.5 w-3.5" />
                  <span>Verbatim Quote from Report</span>
                </div>
                {claim.claimed_reduction_pct.page_number && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Page {claim.claimed_reduction_pct.page_number}
                  </span>
                )}
              </div>
              <p className="text-xs italic text-slate-800 leading-relaxed">
                &ldquo;{claim.claimed_reduction_pct.verbatim_quote || claim.facility_name.verbatim_quote || "Energy reduction claimed in official company report."}&rdquo;
              </p>
              <div className="mt-2 pt-2 border-t border-emerald-200/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  Quote verified against source PDF text:
                </span>
                <span className="font-semibold text-emerald-700">
                  {claim.claimed_reduction_pct.quote_verified_in_pdf ? "Exact Match Verified" : "Not verified"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
                  <Table className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Calculated from Meter Records</h4>
                  <p className="text-xs text-slate-500">Deterministic utility bill aggregation</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-medium">
                Verified Bills CSV
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Baseline Meter Period</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {meter.baseline_months_count} mos
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900 block">
                  {meter.baseline_period}
                </span>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  {formatKwh(meter.baseline_total_kwh)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Reporting Meter Period</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {meter.reporting_months_count} mos
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900 block">
                  {meter.reporting_period}
                </span>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  {formatKwh(meter.reporting_total_kwh)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <span className="text-xs text-slate-500 block mb-1">Deterministic Total Savings</span>
                <span className="text-2xl font-bold text-emerald-700 font-mono">
                  {formatPercent(calcs.calculated_total_reduction_pct)}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Across entire facility
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <span className="text-xs text-slate-500 block mb-1">Verified Net Reduction</span>
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {formatKwh(calcs.calculated_total_reduction_kwh)}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Measured meter decrease
                </span>
              </div>
            </div>

            {calcs.boundary_mismatch_detected && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 mb-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-rose-700 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Boundary Misclassification Detected</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Borrower reported solar generation as energy efficiency reduction. Total site consumption remained flat at {formatKwh(meter.baseline_total_kwh)}, while grid purchases fell by {formatPercent(calcs.calculated_grid_reduction_pct)}.
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <div className="text-xs font-semibold text-slate-800 mb-2">
                Quantitative Discrepancy Breakdown
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Variance (% Points)</span>
                  <span className={`font-mono font-bold text-sm ${Math.abs(calcs.discrepancy_pct_points) > 2 ? "text-rose-600" : "text-emerald-700"}`}>
                    {formatPercent(calcs.discrepancy_pct_points, true)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Variance (kWh)</span>
                  <span className="font-mono font-bold text-sm text-slate-800">
                    {formatKwh(calcs.discrepancy_kwh)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Excess Over Verified</span>
                  <span className="font-mono font-bold text-sm text-slate-800">
                    {formatPercent(calcs.excess_over_calculated_pct)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unverified Claim Share</span>
                  <span className="font-mono font-bold text-sm text-slate-800">
                    {formatPercent(calcs.unverified_claim_share_pct)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
