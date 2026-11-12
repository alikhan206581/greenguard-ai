
"use client";

import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowUpRight,
  Zap,
} from "lucide-react";

import type { PreloadedCaseInfo } from "../lib/types";

interface PresetCaseSelectorProps {
  cases: PreloadedCaseInfo[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  loading: boolean;
}

export function PresetCaseSelector({
  cases,
  selectedCaseId,
  onSelectCase,
  loading,
}: PresetCaseSelectorProps) {
  if (!cases.length) {
    return (
      <section
        id="benchmark-cases"
        className="gg-empty"
        aria-label="Benchmark cases"
      >
        <Zap size={24} />

        <div>
          <strong>No benchmark cases loaded</strong>

          <p>
            Connect your backend and use Retry connection to load
            available cases. You can also upload your own report and
            meter records above.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div id="benchmark-cases" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-emerald-600" />

          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Explore a benchmark case ({cases.length})
          </h3>
        </div>

        <span className="text-xs text-slate-500">
          Click any preset to run immediate verification
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cases.map((item) => {
          const isSelected = selectedCaseId === item.case_id;
          const isSupported =
            item.expected_verdict.includes("SUPPORTED");
          const isContradicted =
            item.expected_verdict.includes("CONTRADICTED");

          return (
            <button
              key={item.case_id}
              type="button"
              onClick={() => onSelectCase(item.case_id)}
              disabled={loading}
              aria-pressed={isSelected}
              className={`text-left p-4 rounded-xl border transition-all duration-200 relative group flex flex-col justify-between ${
                isSelected
                  ? "bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/30"
                  : "bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {item.region} &bull; {item.business_size}
                  </span>

                  {isSupported && (
                    <span className="flex items-center text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Supported
                    </span>
                  )}

                  {isContradicted && (
                    <span className="flex items-center text-[10px] font-semibold text-rose-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Contradicted
                    </span>
                  )}

                  {!isSupported && !isContradicted && (
                    <span className="flex items-center text-[10px] font-semibold text-amber-700">
                      <HelpCircle className="h-3 w-3 mr-1" />
                      Incomplete
                    </span>
                  )}
                </div>

                <div className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-1">
                  {item.company_name}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Claim:{" "}
                  <strong className="text-slate-800">
                    {item.claimed_reduction_pct}%
                  </strong>
                </span>

                <span className="inline-flex items-center font-medium text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                  Run benchmark
                  <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}