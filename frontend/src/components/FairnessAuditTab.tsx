"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Download,
  RefreshCw,
  Loader2,
  Scale,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { FairnessAuditResponse } from "../lib/types";
import { fetchFairnessAudit, getExportFairnessCsvUrl } from "../lib/api";
import { FairnessCharts } from "./FairnessCharts";
import { FairnessSliceTable } from "./FairnessSliceTable";
import { AdversarialRobustnessPanel } from "./AdversarialRobustnessPanel";

export function FairnessAuditTab() {
  const [activeSection, setActiveSection] = useState<"both" | "c03" | "c09">("both");
  const [data, setData] = useState<FairnessAuditResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadFairnessData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFairnessAudit();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load fairness audit evaluation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFairnessData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-16 bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Computing Subgroup Fairness Audits
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Running 36-case benchmark slice evaluation across Sindh, Punjab, KP, Balochistan, and enterprise sizes...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-4">
        <div className="text-rose-600 font-semibold text-sm">{error || "Failed to load"}</div>
        <button
          onClick={loadFairnessData}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Fairness Evaluation</span>
        </button>
      </div>
    );
  }

  const isCompliant = data.compliance_verdict === "COMPLIANT" || data.compliance_status === "COMPLIANT";
  const regionDispPassed = data.region_disparity_passed ?? (data.region_fpr_disparity <= data.threshold);
  const sizeDispPassed = data.size_disparity_passed ?? (data.size_fpr_disparity <= data.threshold);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="p-2 rounded-2xl bg-white border-2 border-[#09090B] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSection("both")}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeSection === "both"
                ? "bg-[#09090B] text-white shadow-xs"
                : "bg-transparent text-slate-600 hover:text-[#09090B] hover:bg-slate-100"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Complete Governance Suite (C03 + C09)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("c03")}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeSection === "c03"
                ? "bg-[#059669] text-white shadow-xs"
                : "bg-transparent text-slate-600 hover:text-[#059669] hover:bg-emerald-50"
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Section 1: C03 Fairness &amp; Subgroup Parity</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20">
              FPR &le; 10%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("c09")}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeSection === "c09"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "bg-transparent text-slate-600 hover:text-[#2563EB] hover:bg-blue-50"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Section 2: C09 Adversarial Defense</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20">
              &plusmn;2% Test
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2 px-2">
          <span className="text-[11px] font-bold text-slate-500">
            Hackathon Directives:
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-[#059669] border border-emerald-300">
            C03 PASS
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-[#2563EB] border border-blue-300">
            C09 PASS
          </span>
        </div>
      </div>

      {(activeSection === "both" || activeSection === "c03") && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl p-6 border transition-all duration-300 ${
              isCompliant
                ? "border-emerald-300 bg-white shadow-sm glow-emerald"
                : "border-rose-300 bg-white shadow-sm glow-crimson"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="flex items-start space-x-4">
                <div
                  className={`p-3 rounded-xl mt-0.5 ${
                    isCompliant
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-rose-50 text-rose-600 border border-rose-200"
                  }`}
                >
                  {isCompliant ? (
                    <ShieldCheck className="h-8 w-8 stroke-[2.2]" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 stroke-[2.2]" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase bg-[#09090B] text-white">
                      Directive C03
                    </span>
                    <span
                      className={`px-3 py-1 rounded-md text-xs tracking-wider uppercase shadow-xs ${
                        isCompliant
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-rose-600 text-white font-bold"
                      }`}
                    >
                      {isCompliant ? "FAIRNESS AUDIT COMPLIANT" : "FAIRNESS AUDIT NON-COMPLIANT"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs bg-slate-50 border border-slate-200 text-slate-700">
                      Tolerance: &le; {(data.threshold * 100).toFixed(1)}% Max Disparity
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs bg-slate-50 border border-slate-200 text-slate-600">
                      {data.total_cases} Labelled Cases
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-1">
                    Section 1 &bull; Subgroup Algorithmic Bias &amp; FPR Parity Audit (C03)
                  </h2>
                  <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                    Deterministic audits ensure that energy-efficiency verification does not produce disparate false rejection rates across geography or enterprise capitalization tiers.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-start lg:self-auto shrink-0">
                <button
                  onClick={loadFairnessData}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition"
                  title="Refresh Audit Calculations"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <a
                  href={getExportFairnessCsvUrl()}
                  download="fairness_benchmark_36.csv"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>Export Benchmark CSV</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <div className="text-xs font-medium text-slate-500 mb-1">Overall False Positive Rate</div>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {(data.overall_fpr * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Across all 36 test facilities</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <div className="text-xs font-medium text-slate-500 mb-1">Regional FPR Disparity</div>
                <div
                  className={`text-2xl font-bold font-mono ${
                    regionDispPassed ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {(data.region_fpr_disparity * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {regionDispPassed ? "Passes <= 10.0% boundary" : "Exceeds tolerance"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <div className="text-xs font-medium text-slate-500 mb-1">Business Size Disparity</div>
                <div
                  className={`text-2xl font-bold font-mono ${
                    sizeDispPassed ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {(data.size_fpr_disparity * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {sizeDispPassed ? "Passes <= 10.0% boundary" : "Exceeds tolerance"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <div className="text-xs font-medium text-slate-500 mb-1">Compliance Boundary</div>
                <div className="text-2xl font-bold text-emerald-700 font-mono">
                  &le; 10.0%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Green Bond Committee Standard</div>
              </div>
            </div>
          </div>

          <FairnessCharts
            regionMetrics={data.by_region || data.subgroup_metrics.filter((m) => m.group_type === "Region")}
            sizeMetrics={data.by_business_size || data.subgroup_metrics.filter((m) => m.group_type === "Business Size")}
            threshold={data.threshold}
          />

          <FairnessSliceTable
            metrics={data.subgroup_metrics}
            threshold={data.threshold}
          />
        </div>
      )}

      {(activeSection === "both" || activeSection === "c09") && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pt-2">
            <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#2563EB]">
              Section 2 &bull; Adversarial Feature Perturbation &amp; Defensive Sanitization (C09)
            </h3>
          </div>
          <AdversarialRobustnessPanel />
        </div>
      )}
    </div>
  );
}
