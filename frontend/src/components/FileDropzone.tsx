"use client";

import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  Table2,
  X,
  ArrowRight,
  Loader2,
  Check,
  Info,
} from "lucide-react";

import { checkEvidence, downloadText } from "../lib/review-tools";

interface FileDropzoneProps {
  pdfFile: File | null;
  csvFile: File | null;
  onPdfSelect: (file: File | null) => void;
  onCsvSelect: (file: File | null) => void;
  onSubmit: () => void;
  loading: boolean;
}

interface UploadSlotProps {
  type: "pdf" | "csv";
  file: File | null;
  onSelect: (file: File | null) => void;
  disabled: boolean;
  evidence?: "electricity" | "solar";
}

export function UploadSlot({
  type,
  file,
  onSelect,
  disabled,
  evidence = "electricity",
}: UploadSlotProps) {
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);

  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState("");
  const [checking, setChecking] = useState(false);

  async function select(candidate?: File) {
    if (disabled || !candidate) return;

    const id = ++request.current;

    onSelect(null);
    setValidation("");
    setError("");
    setChecking(false);

    if (!candidate.name.toLowerCase().endsWith(`.${type}`)) {
      setError(`Please choose a .${type} file.`);
      return;
    }

    if (!candidate.size) {
      setError("This file is empty. Choose a file containing evidence.");
      return;
    }

    if (type === "csv") {
      if (candidate.size > 10 * 1024 * 1024) {
        setError("CSV exceeds the 10 MB preview limit.");
        return;
      }

      setChecking(true);

      try {
        const result = checkEvidence(await candidate.text());

        if (id !== request.current) return;

        if (result.errors.length) {
          setError(
            result.errors.slice(0, 5).join(" ") +
              (result.errors.length > 5
                ? ` Plus ${result.errors.length - 5} other issues.`
                : ""),
          );
          return;
        }

        setValidation(
          `${result.count} rows checked. ` +
            result.warnings.slice(0, 4).join(" ") +
            " Backend schema validation still applies.",
        );
      } catch (error) {
        if (id === request.current) {
          setError(
            error instanceof Error
              ? error.message
              : "Cannot read this CSV.",
          );
        }
        return;
      } finally {
        if (id === request.current) {
          setChecking(false);
        }
      }
    }

    if (id === request.current) {
      onSelect(candidate);
    }
  }

  function remove() {
    request.current++;
    onSelect(null);
    setError("");
    setValidation("");
    setChecking(false);
  }

  function downloadSample() {
    const solar = evidence === "solar";

    const header = solar
      ? "month,grid_import_kwh,solar_generated_kwh,grid_export_kwh"
      : "facility_id,facility_name,month,period,grid_kwh,solar_kwh,total_kwh";

    const rows = Array.from(
      { length: solar ? 12 : 24 },
      (_, index) => {
        const date =
          `${2024 + Math.floor(index / 12)}-` +
          String((index % 12) + 1).padStart(2, "0");

        if (solar) {
          return `${date},500,600,100`;
        }

        return [
          "DEMO-01",
          "Demo facility",
          date,
          index < 12 ? "baseline" : "reporting",
          index < 12 ? 1000 : 700,
          index < 12 ? 0 : 100,
          index < 12 ? 1000 : 800,
        ].join(",");
      },
    );

    downloadText(
      `demo-${evidence}-records.csv`,
      [header, ...rows].join("\n"),
    );
  }

  const Icon = type === "pdf" ? FileText : Table2;

  return (
    <div className="gg-upload-slot">
      <div className="gg-upload-label">
        <span>{type === "pdf" ? "01" : "02"}</span>

        {type === "pdf"
          ? "Sustainability report"
          : evidence === "solar"
            ? "Solar inverter records"
            : "Electricity meter records"}

        <small>{type.toUpperCase()}</small>
      </div>

      <div
        className={`gg-dropzone ${dragging ? "dragging" : ""} ${
          file ? "has-file" : ""
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void select(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={input}
          type="file"
          accept={`.${type}`}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          aria-label={`Select ${type.toUpperCase()} evidence`}
          onChange={(event) => {
            void select(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <button
          type="button"
          disabled={disabled}
          className="gg-file-picker"
          onClick={() => input.current?.click()}
        >
          <span className="gg-upload-icon">
            {file ? <Check size={24} /> : <Icon size={24} />}
          </span>

          <strong>
            {file ? file.name : `Drop your ${type.toUpperCase()} file here`}
          </strong>

          <span>
            {file ? (
              `${(file.size / 1024).toFixed(1)} KB · Ready to verify`
            ) : (
              <>
                or <b>browse files</b> from your device
              </>
            )}
          </span>

          {!file && (
            <small>
              {type === "pdf"
                ? "Company sustainability report or energy declaration"
                : "Monthly readings for the review period"}
            </small>
          )}
        </button>

        {file && (
          <button
            type="button"
            className="gg-remove-file"
            disabled={disabled}
            aria-label={`Remove ${type.toUpperCase()} file`}
            onClick={remove}
          >
            <X size={17} />
          </button>
        )}
      </div>

      {checking && <p role="status">Checking CSV records…</p>}

      {validation && (
        <p className="gg-validation" role="status">
          {validation}
        </p>
      )}

      {type === "csv" && (
        <div className="gg-sample">
          <button
            type="button"
            onClick={downloadSample}
            className="gg-evidence-link"
          >
            Download example CSV
          </button>

          <small>
            Synthetic example only. Confirm column names with your
            backend’s accepted schema before uploading.
          </small>
        </div>
      )}

      {error && (
        <p className="gg-file-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FileDropzone({
  pdfFile,
  csvFile,
  onPdfSelect,
  onCsvSelect,
  onSubmit,
  loading,
}: FileDropzoneProps) {
  const ready = !!pdfFile && !!csvFile;

  return (
    <section
      id="evidence-upload"
      className="gg-upload-panel"
      aria-labelledby="upload-title"
    >
      <div className="gg-section-title">
        <div>
          <span className="gg-eyebrow">START A REVIEW</span>
          <h2 id="upload-title">Let the evidence speak.</h2>
          <p>
            Upload both files to compare your company’s claim with its
            energy records.
          </p>
        </div>

        <span className={`gg-ready ${ready ? "complete" : ""}`}>
          <span />
          {Number(!!pdfFile) + Number(!!csvFile)} of 2 files ready
        </span>
      </div>

      <div className="gg-upload-grid">
        <UploadSlot
          type="pdf"
          file={pdfFile}
          onSelect={onPdfSelect}
          disabled={loading}
        />

        <UploadSlot
          type="csv"
          file={csvFile}
          onSelect={onCsvSelect}
          disabled={loading}
        />
      </div>

      <div className="gg-upload-bottom">
        <p>
          <Info size={16} />
          Files are processed by your configured backend and selected
          engine.
        </p>

        <button
          type="button"
          className="gg-primary"
          onClick={onSubmit}
          disabled={!ready || loading}
        >
          {loading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <UploadCloud size={17} />
          )}

          {loading ? "Verifying evidence…" : "Verify evidence"}

          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}