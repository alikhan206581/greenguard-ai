"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileSearch } from "lucide-react";
import { RAGRetrievedChunk } from "../lib/types";

interface EvidenceTraceabilityViewProps {
  chunks: RAGRetrievedChunk[];
  embeddingEngine: string;
}

export function EvidenceTraceabilityView({ chunks, embeddingEngine }: EvidenceTraceabilityViewProps) {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <FileSearch className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-slate-900">
                RAG Evidence Traceability &amp; Source Passages
              </h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {chunks.length} Retrieved Chunks
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Extracted via <span className="font-mono text-emerald-700 font-semibold">{embeddingEngine}</span> with cosine vector search
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

      <div className={`space-y-3 pt-2 ${expanded ? "block" : "hidden sm:block"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {chunks.map((chunk, index) => (
            <div
              key={chunk.chunk_id || index}
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 transition flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                      Page {chunk.page_number}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Score: {(chunk.relevance_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {chunk.chunk_id}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-sans line-clamp-4">
                  &ldquo;{chunk.text_snippet}&rdquo;
                </p>
              </div>

              {chunk.matched_keywords && chunk.matched_keywords.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap gap-1.5">
                  {chunk.matched_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono shadow-2xs"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
