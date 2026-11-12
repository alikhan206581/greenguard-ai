"use client";

import React from "react";
import { Loader2, FileSearch } from "lucide-react";
import { PreloadedCaseInfo, VerificationResponse } from "../lib/types";
import { PresetCaseSelector } from "./PresetCaseSelector";
import { FileDropzone } from "./FileDropzone";
import { VerdictBanner } from "./VerdictBanner";
import { PipelineTraceView } from "./PipelineTraceView";
import { SideBySideComparison } from "./SideBySideComparison";
import { MonthlyReconciliationChart } from "./MonthlyReconciliationChart";
import { EvidenceTraceabilityView } from "./EvidenceTraceabilityView";
import { ReviewerChecklist } from "./ReviewerChecklist";
import { ResultExplanation } from "./ResultExplanation";
import { AuditReviewEditor } from "./LocalAuditReview";

interface ClaimReviewTabProps {
  cases: PreloadedCaseInfo[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  pdfFile: File | null;
  csvFile: File | null;
  onPdfSelect: (file: File | null) => void;
  onCsvSelect: (file: File | null) => void;
  onRunCustomVerify: () => void;
  verificationResult: VerificationResponse | null;
  loading: boolean;
  errorMessage: string | null;
}

export function ClaimReviewTab({
  cases,
  selectedCaseId,
  onSelectCase,
  pdfFile,
  csvFile,
  onPdfSelect,
  onCsvSelect,
  onRunCustomVerify,
  verificationResult,
  loading,
  errorMessage,
}: ClaimReviewTabProps) {
  return (
    <div className="space-y-8">
      <FileDropzone
        pdfFile={pdfFile}
        csvFile={csvFile}
        onPdfSelect={onPdfSelect}
        onCsvSelect={onCsvSelect}
        onSubmit={onRunCustomVerify}
        loading={loading}
      />

      <PresetCaseSelector
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelectCase={onSelectCase}
        loading={loading}
      />


      {!verificationResult && !loading && !errorMessage && <div className="gg-empty"><FileSearch size={28}/><div><strong>Your next insight starts with evidence</strong><p>Upload a report and meter records above, or select an available benchmark to explore the verification workflow.</p></div></div>}

      {loading && (
        <div role="status" aria-live="polite" className="rounded-2xl p-12 bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-emerald-600 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Running Multi-Stage Electricity Saving Verification</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Ingesting PDF chunks, matching verbatim quotes, aggregating 24-month utility electricity bills, and computing deterministic Decimal bounds...
            </p>
          </div>
        </div>
      )}

      {errorMessage && !loading && (
        <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <strong className="block font-semibold mb-0.5">Verification Request Error:</strong>
          {errorMessage}
        </div>
      )}

      {verificationResult && !loading && (
        <div className="space-y-8 animate-fadeIn">
          <VerdictBanner data={verificationResult} />
          <ResultExplanation data={verificationResult} />

          <AuditReviewEditor
            key={verificationResult.audit_id}
            data={verificationResult}
          />
          <PipelineTraceView stages={verificationResult.pipeline_trace} />
          <SideBySideComparison data={verificationResult} />
          {verificationResult.meter_evidence.monthly_breakdown &&
            verificationResult.meter_evidence.monthly_breakdown.length > 0 && (
              <MonthlyReconciliationChart meter={verificationResult.meter_evidence} />
            )}
          {verificationResult.rag_retrieved_chunks &&
            verificationResult.rag_retrieved_chunks.length > 0 && (
              <EvidenceTraceabilityView
                chunks={verificationResult.rag_retrieved_chunks}
                embeddingEngine={verificationResult.embedding_engine}
              />
            )}
          <ReviewerChecklist
            checklist={verificationResult.reviewer_checklist || []}
            limitationsNotice={verificationResult.limitations_notice}
          />
        </div>
      )}
    </div>
  );
}
