"use client";

import React, { useState } from "react";
import { Table, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { SubgroupFairnessMetric } from "../lib/types";

interface FairnessSliceTableProps {
  metrics: SubgroupFairnessMetric[];
  threshold: number;
}

export function FairnessSliceTable({ metrics, threshold }: FairnessSliceTableProps) {
  const [filterType, setFilterType] = useState<"ALL" | "Region" | "Business Size" | "Combined">("ALL");

  const filteredMetrics = metrics.filter((m) => {
    if (filterType === "ALL") return true;
    return m.group_type === filterType;
  });

  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Table className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              Subgroup Slice Audit Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Granular evaluation of False Positive Rates and Incomplete Record abstentions
          </p>
        </div>

        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          {(["ALL", "Region", "Business Size", "Combined"] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === ft
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {ft === "ALL" ? "All Subgroups" : ft}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pt-2">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50">
              <th className="py-3 px-3">Subgroup Slice</th>
              <th className="py-3 px-3">Slice Dimension</th>
              <th className="py-3 px-3 text-center">Sample (N)</th>
              <th className="py-3 px-3 text-center">Genuinely Supported</th>
              <th className="py-3 px-3 text-center">False Flags</th>
              <th className="py-3 px-3">False Positive Rate (FPR_g)</th>
              <th className="py-3 px-3">95% Wilson CI</th>
              <th className="py-3 px-3 text-right">Incomplete Records Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredMetrics.map((row, index) => {
              const isPassing = row.fpr <= threshold;
              const fprPct = (row.fpr * 100).toFixed(1);
              const ciLowerPct = (row.ci_lower * 100).toFixed(1);
              const ciUpperPct = (row.ci_upper * 100).toFixed(1);
              const incompletePct = (row.insufficient_evidence_rate * 100).toFixed(1);

              return (
                <tr key={`${row.group_name}-${index}`} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {row.group_name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                      {row.group_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                    {row.sample_size_n}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-700">
                    {row.genuinely_supported_n}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        row.false_positives_n > 0
                          ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      {row.false_positives_n}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${isPassing ? "text-emerald-700" : "text-rose-600"}`}>
                        {fprPct}%
                      </span>
                      {isPassing ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    [{ciLowerPct}% &ndash; {ciUpperPct}%]
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        row.insufficient_evidence_count > 0
                          ? "bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                          : "text-slate-400"
                      }`}
                    >
                      {incompletePct}% ({row.insufficient_evidence_count})
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600 shadow-2xs">
        <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800">Abstention &amp; Incomplete Records Protection:</strong> Tracking the Incomplete Records Rate ensures that smaller commercial entities with seasonal utility billing are classified under <em>Insufficient Evidence</em> rather than falsely flagged as <em>Contradicted</em>, eliminating disparate algorithmic attrition.
        </p>
      </div>
    </div>
  );
}
