"use client";

import React from "react";
import { SubgroupFairnessMetric } from "../lib/types";

interface FairnessChartsProps {
  regionMetrics: SubgroupFairnessMetric[];
  sizeMetrics: SubgroupFairnessMetric[];
  threshold: number;
}

export function FairnessCharts({
  regionMetrics,
  sizeMetrics,
  threshold,
}: FairnessChartsProps) {
  const maxFpr = Math.max(
    ...regionMetrics.map((m) => m.ci_upper || m.fpr),
    ...sizeMetrics.map((m) => m.ci_upper || m.fpr),
    0.2
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              False Positive Rate by Geographic Region (FPR_g)
            </h4>
            <p className="text-xs text-slate-500">
              Evaluated across Sindh, Punjab, KP, and Balochistan
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            Target &le; 10%
          </span>
        </div>

        <div className="pt-4 space-y-4">
          {regionMetrics.map((metric) => {
            const barWidth = Math.min(100, (metric.fpr / maxFpr) * 100);
            const ciLowerPct = (metric.ci_lower / maxFpr) * 100;
            const ciUpperPct = (metric.ci_upper / maxFpr) * 100;
            const isPassing = metric.fpr <= threshold;

            return (
              <div key={metric.group_name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {metric.group_name} Region
                  </span>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className={isPassing ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                      {(metric.fpr * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500">
                      [{(metric.ci_lower * 100).toFixed(1)}% &ndash; {(metric.ci_upper * 100).toFixed(1)}%]
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (N={metric.sample_size_n})
                    </span>
                  </div>
                </div>

                <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center">
                  <div
                    style={{ left: `${(threshold / maxFpr) * 100}%` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                    title={`Maximum Tolerance Threshold: ${(threshold * 100).toFixed(1)}%`}
                  />
                  <div
                    style={{
                      left: `${Math.max(0, ciLowerPct)}%`,
                      width: `${Math.max(2, ciUpperPct - ciLowerPct)}%`,
                    }}
                    className="absolute h-2 bg-emerald-500/25 rounded-full"
                  />
                  <div
                    style={{ width: `${Math.max(barWidth > 0 ? 4 : 0, barWidth)}%` }}
                    className={`h-full rounded transition-all duration-500 ${
                      isPassing ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>FPR Point Estimate</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-1.5 w-6 rounded bg-emerald-500/25" />
            <span>95% Wilson Confidence Interval</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-0.5 bg-amber-500" />
            <span>10% Limit</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              False Positive Rate by Enterprise Size (FPR_g)
            </h4>
            <p className="text-xs text-slate-500">
              Evaluated across Small, Medium, and Large commercial enterprises
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            Target &le; 10%
          </span>
        </div>

        <div className="pt-4 space-y-4">
          {sizeMetrics.map((metric) => {
            const barWidth = Math.min(100, (metric.fpr / maxFpr) * 100);
            const ciLowerPct = (metric.ci_lower / maxFpr) * 100;
            const ciUpperPct = (metric.ci_upper / maxFpr) * 100;
            const isPassing = metric.fpr <= threshold;

            return (
              <div key={metric.group_name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {metric.group_name} Business
                  </span>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className={isPassing ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                      {(metric.fpr * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500">
                      [{(metric.ci_lower * 100).toFixed(1)}% &ndash; {(metric.ci_upper * 100).toFixed(1)}%]
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (N={metric.sample_size_n})
                    </span>
                  </div>
                </div>

                <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center">
                  <div
                    style={{ left: `${(threshold / maxFpr) * 100}%` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                    title={`Maximum Tolerance Threshold: ${(threshold * 100).toFixed(1)}%`}
                  />
                  <div
                    style={{
                      left: `${Math.max(0, ciLowerPct)}%`,
                      width: `${Math.max(2, ciUpperPct - ciLowerPct)}%`,
                    }}
                    className="absolute h-2 bg-emerald-500/25 rounded-full"
                  />
                  <div
                    style={{ width: `${Math.max(barWidth > 0 ? 4 : 0, barWidth)}%` }}
                    className={`h-full rounded transition-all duration-500 ${
                      isPassing ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>FPR Point Estimate</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-1.5 w-6 rounded bg-emerald-500/25" />
            <span>95% Wilson Confidence Interval</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-0.5 bg-amber-500" />
            <span>10% Limit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
