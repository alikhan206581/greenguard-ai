"use client";

import { useEffect, useState } from "react";
import {
  VerificationResponse,
  SolarVerificationResponse,
} from "../lib/types";

import {
  readSaved,
  writeSaved,
  downloadText,
  fmt,
} from "../lib/review-tools";

const STORAGE_KEY = "greenguard-review-v1";

const STATUSES = [
  "Pending",
  "Reviewed",
  "More evidence needed",
] as const;

type ReviewStatus = (typeof STATUSES)[number];

interface SavedReview {
  id: string;
  kind: "Electricity" | "Solar";
  company: string;
  facility: string;
  timestamp: string;
  period: string;
  verdict: string;
  metric: number;
  metricName: string;
  status: ReviewStatus;
  notes: string;
  savedAt: string;
}

function getReviews(): SavedReview[] {
  const reviews = readSaved<SavedReview>(STORAGE_KEY);

  if (
    reviews.some(
      (review) =>
        !review ||
        typeof review.id !== "string" ||
        typeof review.company !== "string" ||
        typeof review.metric !== "number",
    )
  ) {
    throw new Error("Saved review data has an unsupported format.");
  }

  return reviews;
}

function makeReview(
  data: VerificationResponse | SolarVerificationResponse,
): SavedReview {
  const common = {
    status: "Pending" as ReviewStatus,
    notes: "",
    savedAt: new Date().toISOString(),
    timestamp: data.timestamp,
  };

  if ("audit_id" in data) {
    return {
      ...common,
      id: `electricity:${data.audit_id}`,
      kind: "Electricity",
      company: data.extracted_claim.company_name,
      facility:
        data.meter_evidence.facility_id ||
        data.meter_evidence.facility_name,
      period:
        `${data.meter_evidence.baseline_period} → ` +
        data.meter_evidence.reporting_period,
      verdict: data.verdict,
      metric: data.calculations.calculated_total_reduction_pct,
      metricName: "Calculated saving (%)",
    };
  }

  const dates = data.weather_health_check.monthly_solar_series
    .map((record) => record.month)
    .sort();

  return {
    ...common,
    id: `solar:${data.solar_audit_id}`,
    kind: "Solar",
    company: data.facility_name,
    facility:
      `${data.facility_name} / ${data.city} / ` +
      `${data.installed_capacity_kw} kW`,
    period: dates.length
      ? `${dates[0]} → ${dates[dates.length - 1]}`
      : "Period not supplied",
    verdict: data.status_badge,
    metric: data.weather_health_check.generation_gap_pct,
    metricName: "Backend generation gap (%)",
  };
}

export function AuditReviewEditor({
  data,
}: {
  data: VerificationResponse | SolarVerificationResponse;
}) {
  const base = makeReview(data);

  const [status, setStatus] = useState<ReviewStatus>("Pending");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const existing = getReviews().find(
        (review) => review.id === base.id,
      );

      setStatus(existing?.status || "Pending");
      setNotes(existing?.notes || "");
      setMessage(existing ? "Saved review loaded." : "");
    } catch (error) {
      setMessage(String(error));
    }
  }, [base.id]);

  function save() {
    try {
      const previous = getReviews();

      const next = [
        { ...base, status, notes },
        ...previous.filter((review) => review.id !== base.id),
      ].slice(0, 100);

      writeSaved(STORAGE_KEY, next);

      setMessage(
        "Saved in this browser. Open Audit history → Saved reviews.",
      );
    } catch {
      setMessage(
        "Could not save. Browser storage may be unavailable or full. Copy your notes before leaving.",
      );
    }
  }

  return (
    <section className="gg-tool-panel">
      <span className="gg-eyebrow">HUMAN REVIEW</span>

      <h3>Save this audit & reviewer notes</h3>

      <p>
        Saved only in this browser and device. Notes do not change the
        backend verdict or PDF. The latest 100 saved reviews are retained.
      </p>

      <label>
        Review status
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ReviewStatus)
          }
        >
          {STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>

      <label>
        Reviewer notes
        <textarea
          rows={3}
          maxLength={5000}
          value={notes}
          placeholder="Record evidence requested, checks completed and next actions…"
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      <button type="button" className="gg-primary" onClick={save}>
        Save review
      </button>

      <p role="status">{message}</p>
    </section>
  );
}

export function SavedAuditReviews() {
  const [reviews, setReviews] = useState<SavedReview[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ReviewStatus>("Pending");

  useEffect(() => {
    function load() {
      try {
        setReviews(getReviews());
        setError("");
      } catch (error) {
        setError(String(error));
      }
    }

    load();

    window.addEventListener("greenguard-saved", load);
    window.addEventListener("storage", load);

    return () => {
      window.removeEventListener("greenguard-saved", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const filtered = reviews.filter((review) =>
    `${review.company} ${review.facility} ${review.status}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const first = reviews.find((review) => review.id === firstId);
  const second = reviews.find((review) => review.id === secondId);

  const comparable =
    first &&
    second &&
    first.id !== second.id &&
    first.kind === second.kind &&
    first.company === second.company &&
    first.facility === second.facility &&
    first.period === second.period &&
    first.period !== "Period not supplied";

  function updateNotes() {
    try {
      const next = getReviews().map((review) =>
        review.id === editingId
          ? {
              ...review,
              status,
              notes,
              savedAt: new Date().toISOString(),
            }
          : review,
      );

      writeSaved(STORAGE_KEY, next);
      setEditingId(null);
    } catch {
      setError("Unable to save changes. Copy your notes before leaving.");
    }
  }

  return (
    <section className="gg-tool-panel">
      <span className="gg-eyebrow">SAVED REVIEWS · THIS BROWSER</span>

      <h3>Review, revisit & compare</h3>

      <p>
        These summaries and notes are separate from server history.
        Export a backup before clearing browser data. Original PDF and
        CSV files are not saved here.
      </p>

      {error && <p role="alert">{error}</p>}

      <div className="gg-tool-actions">
        <label>
          Find saved reviews
          <input
            value={query}
            placeholder="Company, facility or status"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="gg-secondary"
          disabled={!reviews.length}
          onClick={() =>
            downloadText(
              "greenguard-reviews.json",
              JSON.stringify(reviews, null, 2),
              "application/json",
            )
          }
        >
          Export saved reviews
        </button>
      </div>

      {!reviews.length ? (
        <p>
          No saved reviews yet. Run a verification, add notes and select
          “Save review”.
        </p>
      ) : (
        <>
          <div className="gg-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Company / facility</th>
                  <th>Audit date</th>
                  <th>Review status</th>
                  <th>Finding</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <b>{review.company}</b>
                      <small>
                        {review.kind} · {review.period}
                      </small>
                    </td>

                    <td>
                      {new Date(review.timestamp).toLocaleString()}
                    </td>

                    <td>{review.status}</td>
                    <td>{review.verdict}</td>

                    <td>
                      <button
                        type="button"
                        className="gg-secondary"
                        onClick={() => {
                          setEditingId(review.id);
                          setNotes(review.notes);
                          setStatus(review.status);
                        }}
                      >
                        View notes
                      </button>
                    </td>
                  </tr>
                ))}

                {!filtered.length && (
                  <tr>
                    <td colSpan={5}>No matching saved reviews.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {editingId && (
            <div className="gg-note-editor">
              <h4>
                {reviews.find((review) => review.id === editingId)?.company}
                {" · "}Reviewer notes
              </h4>

              <label>
                Status
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ReviewStatus)
                  }
                >
                  {STATUSES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Notes
                <textarea
                  rows={4}
                  maxLength={5000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>

              <div className="gg-tool-actions">
                <button
                  type="button"
                  className="gg-primary"
                  onClick={updateNotes}
                >
                  Save changes
                </button>

                <button
                  type="button"
                  className="gg-secondary"
                  onClick={() => setEditingId(null)}
                >
                  Close without saving
                </button>
              </div>
            </div>
          )}

          <h4>Compare two saved audits</h4>

          <div className="gg-tool-grid">
            <label>
              First audit
              <select
                value={firstId}
                onChange={(event) => setFirstId(event.target.value)}
              >
                <option value="">Select a review</option>
                {reviews.map((review) => (
                  <option key={review.id} value={review.id}>
                    {review.company} · {review.kind} · {review.timestamp}
                    {" · "}
                    {review.id}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Second audit
              <select
                value={secondId}
                onChange={(event) => setSecondId(event.target.value)}
              >
                <option value="">Select a review</option>
                {reviews.map((review) => (
                  <option key={review.id} value={review.id}>
                    {review.company} · {review.kind} · {review.timestamp}
                    {" · "}
                    {review.id}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {first && second && (
            <>
              <div className="gg-tool-grid">
                {[first, second].map((review, index) => (
                  <div key={index}>
                    <b>{review.company}</b>
                    <p>{review.period}</p>
                    <p>{review.verdict}</p>
                    <p>
                      {review.metricName}: {fmt(review.metric)}
                    </p>
                    <small>{review.status}</small>
                  </div>
                ))}
              </div>

              {comparable ? (
                <p>
                  Second − first:{" "}
                  <b>{fmt(second.metric - first.metric)} percentage points</b>.
                  {" "}Same facility and period. This measures a change
                  between audit results, not proof of improved performance.
                </p>
              ) : (
                <p>
                  Select different audits of the same company, facility,
                  review type and period to calculate a like-for-like
                  change. Other selections can be viewed side by side only.
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}