"use client";

import React, { useState } from "react";
import { History, FileDown, Search, ArrowUpRight, ShieldCheck, AlertTriangle, HelpCircle, RefreshCw } from "lucide-react";
import { AuditHistoryItem } from "../lib/types";
import { getExportPdfUrl } from "../lib/api";
import { SavedAuditReviews } from "./LocalAuditReview";

interface HistoryVaultTabProps {
  history: AuditHistoryItem[];
  onSelectAudit: (auditId: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function HistoryVaultTab({
  history,
  onSelectAudit,
  onRefresh,
  loading,
}: HistoryVaultTabProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [verdictFilter, setVerdictFilter] = useState<string>("ALL");

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.audit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.case_id && item.case_id.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (verdictFilter === "ALL") return true;
    return item.verdict.includes(verdictFilter);
  });

  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-6">
      <SavedAuditReviews />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <History className="h-4 w-4 text-emerald-600" />
            <h3 className="text-base font-semibold text-slate-900">
              Audit history
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Review your saved sustainability report and meter verification runs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search audit history"
              placeholder="Search company or audit ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-60 shadow-2xs"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition"
            title="Refresh Vault Records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">Filter by verdict:</span>
        {(["ALL", "SUPPORTED", "CONTRADICTED", "INSUFFICIENT"] as const).map((vf) => (
          <button
            key={vf}
            aria-pressed={verdictFilter === vf}
            onClick={() => setVerdictFilter(vf)}
            className={`px-2.5 py-1 rounded-lg transition ${
              verdictFilter === vf
                ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {vf === "ALL" ? "All Runs" : vf}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50">
              <th className="py-3 px-3">Audit ID</th>
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3">Borrower / Facility</th>
              <th className="py-3 px-3">Engine</th>
              <th className="py-3 px-3">Verdict</th>
              <th className="py-3 px-3">Duration</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredHistory.map((item) => {
              const isSupported = item.verdict.includes("SUPPORTED");
              const isContradicted = item.verdict.includes("CONTRADICTED");

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 group">
                  <td className="py-3 px-3 font-mono font-semibold text-emerald-700">
                    {item.audit_id}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {new Date(item.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {item.company_name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                      {item.active_llm_mode}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        isSupported
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : isContradicted
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {isSupported && <ShieldCheck className="h-3 w-3 mr-1" />}
                      {isContradicted && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {!isSupported && !isContradicted && <HelpCircle className="h-3 w-3 mr-1" />}
                      <span>{item.verdict}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {item.duration_ms ? `${item.duration_ms} ms` : "---"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onSelectAudit(item.audit_id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                      <a
                        href={getExportPdfUrl(item.audit_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-emerald-700 transition"
                        title="Download Signed PDF"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filteredHistory.length && <tr><td colSpan={7} className="py-12 text-center text-slate-500">{searchTerm || verdictFilter !== "ALL" ? "No audits match these filters. Try another search or choose All Runs." : "No audit records loaded. Connect your backend and run a verification to begin."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
