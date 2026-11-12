"use client";

import React, { useState } from "react";
import { Clock, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { PipelineStageTrace } from "../lib/types";

interface PipelineTraceViewProps {
  stages: PipelineStageTrace[];
}

export function PipelineTraceView({ stages }: PipelineTraceViewProps) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const totalDuration = stages.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0);

  return (
    <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-slate-900">
                5-Stage Audit Pipeline Execution Trace
              </h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {stages.length} Stages
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Deterministic evidence verification cycle completed in{" "}
              <span className="font-mono text-emerald-700 font-semibold">{totalDuration.toFixed(1)} ms</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 transition"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <div className={`mt-4 space-y-2.5 transition-all duration-200 ${expanded ? "block" : "hidden sm:block"}`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
          {stages.map((stage) => {
            const isVerified = stage.status === "VERIFIED";
            const isWarning = stage.status === "WARNING";
            const isFailed = stage.status === "FAILED";

            return (
              <div
                key={stage.stage_number}
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isVerified
                    ? "bg-slate-50/80 border-slate-200"
                    : isWarning
                    ? "bg-amber-50/80 border-amber-200"
                    : "bg-rose-50/80 border-rose-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Stage {stage.stage_number}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        isVerified
                          ? "bg-emerald-100 text-emerald-800"
                          : isWarning
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {stage.status}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">
                    {stage.stage_name}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {stage.verification_detail}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center text-[10px] text-slate-500 font-mono">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  <span>{stage.duration_ms.toFixed(1)} ms</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
