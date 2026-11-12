"use client";

import { VerificationResponse } from "../lib/types";
import { fmt } from "../lib/review-tools";

export function ResultExplanation({
  data,
}: {
  data: VerificationResponse;
}) {
  const claim = data.extracted_claim;
  const meter = data.meter_evidence;
  const calculations = data.calculations;

  const fields = [
    ["Baseline energy", claim.claimed_baseline_kwh],
    ["Reporting energy", claim.claimed_reporting_kwh],
    ["Claimed saving", claim.claimed_reduction_pct],
  ] as const;

  return (
    <section className="gg-tool-panel">
      <span className="gg-eyebrow">UNDERSTAND YOUR RESULT</span>

      <h3>Why this finding?</h3>

      <p>{data.verdict_reason}</p>

      <div className="gg-tool-grid">
        <div>
          <h4>Calculation from meter records</h4>

          <p>
            Baseline: <b>{fmt(meter.baseline_total_kwh)} kWh</b>
            <br />
            Reporting: <b>{fmt(meter.reporting_total_kwh)} kWh</b>
            <br />
            Saving:{" "}
            <b>
              {fmt(calculations.calculated_total_reduction_kwh)} kWh (
              {fmt(calculations.calculated_total_reduction_pct)}%)
            </b>
          </p>

          <small>
            Reduction = (baseline − reporting) ÷ baseline × 100.
            Percentage is undefined when baseline is zero. Backend
            values are displayed above.
          </small>
        </div>

        <div>
          <h4>Evidence coverage</h4>

          <p>
            {meter.baseline_months_count} baseline months ·{" "}
            {meter.reporting_months_count} reporting months
          </p>

          <p>{meter.data_completeness}</p>

          <p>
            Claim vs calculated saving:{" "}
            {fmt(calculations.discrepancy_pct_points)} percentage points.
          </p>

          <p>
            {calculations.boundary_mismatch_detected
              ? "Different claim and meter boundaries were flagged. Review total consumption versus grid purchases."
              : "No boundary mismatch was flagged by the backend."}
          </p>
        </div>
      </div>

      <details>
        <summary>Source references and missing evidence</summary>

        {fields.map(([label, field]) => (
          <div className="gg-source-row" key={label}>
            <b>{label}</b>

            <p>
              {field?.verbatim_quote || "No source quotation provided."}
            </p>

            <small>
              {field?.page_number
                ? `PDF page ${field.page_number}`
                : "Page reference unavailable"}
              {" · "}
              {field?.quote_verified_in_pdf
                ? "Quote matched in PDF"
                : "Quote not verified"}
              {" · "}
              Extraction: {field?.extraction_confidence || "not provided"}
            </small>
          </div>
        ))}

        <ul>
          {(data.reviewer_checklist || []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </details>

      <small>
        {data.limitations_notice ||
          "This finding depends on supplied evidence and requires human review."}
      </small>
    </section>
  );
}