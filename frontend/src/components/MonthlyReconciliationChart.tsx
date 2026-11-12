"use client";

import React, { useState } from "react";
import { BarChart3, Table, ChevronDown, ChevronUp } from "lucide-react";
import { MeterEvidenceSummary } from "../lib/types";
import { formatKwh } from "../lib/utils";

interface MonthlyReconciliationChartProps {
  meter: MeterEvidenceSummary;
}

export function MonthlyReconciliationChart({ meter }: MonthlyReconciliationChartProps) {
  const [showTable, setShowTable] = useState<boolean>(false);

  const baselineReadings = meter.monthly_breakdown.filter((r) => r.period === "baseline");
  const reportingReadings = meter.monthly_breakdown.filter((r) => r.period === "reporting");

  const maxKwh = Math.max(
    ...meter.monthly_breakdown.map((r) => r.total_kwh || 0),
    1000
  );

  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Monthly Meter Readings Reconciliation
          </h3>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-400 inline-block" />
            <span className="text-slate-600">Baseline ({meter.baseline_period})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500 inline-block" />
            <span className="text-slate-600">Reporting ({meter.reporting_period})</span>
          </div>
          <button
            aria-expanded={showTable}
            onClick={() => setShowTable(!showTable)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition"
          >
            <Table className="h-3 w-3" />
            <span>{showTable ? "Hide Table" : "View Table"}</span>
            {showTable ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      <div className="pt-4 pb-2">
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 h-auto sm:h-44 items-end">
          {baselineReadings.map((bReading, idx) => {
            const rReading = reportingReadings[idx];
            const bHeight = Math.max(8, (bReading.total_kwh / maxKwh) * 100);
            const rHeight = rReading ? Math.max(8, (rReading.total_kwh / maxKwh) * 100) : 0;
            const monthLabel = bReading.month.slice(0, 3);

            return (
              <div key={bReading.month} className="flex flex-col items-center h-44 justify-end group">
                <div className="w-full flex items-end justify-center space-x-1 h-36">
                  <div
                    style={{ height: `${bHeight}%` }}
                    className="gg-chart-bar w-1/2 bg-slate-300 hover:bg-slate-400 rounded-t transition-all relative"
                    title={`Baseline ${bReading.month}: ${formatKwh(bReading.total_kwh)}`}
                  />
                  {rReading ? (
                    <div
                      style={{ height: `${rHeight}%` }}
                      className="gg-chart-bar w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all relative"
                      title={`Reporting ${rReading.month}: ${formatKwh(rReading.total_kwh)}`}
                    />
                  ) : (
                    <div
                      className="w-1/2 border border-dashed border-rose-300 bg-rose-50/50 rounded-t flex items-center justify-center text-[8px] text-rose-500 font-bold"
                      style={{ height: "20%" }}
                      title="Missing billing period"
                    >
                      &times;
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1.5 truncate">
                  {monthLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showTable && (
        <div className="mt-4 pt-4 border-t border-slate-200 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Grid Consumption</th>
                <th className="py-2.5 px-3">Solar Generation</th>
                <th className="py-2.5 px-3">Total Site Usage</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {meter.monthly_breakdown.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-mono font-medium text-slate-800">{row.month}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        row.period === "baseline"
                          ? "bg-slate-100 text-slate-700 border border-slate-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {row.period}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono">{formatKwh(row.grid_kwh)}</td>
                  <td className="py-2 px-3 font-mono">{formatKwh(row.solar_kwh)}</td>
                  <td className="py-2 px-3 font-mono font-semibold text-slate-900">{formatKwh(row.total_kwh)}</td>
                  <td className="py-2 px-3">
                    <span className="text-emerald-700 font-medium">Recorded</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
