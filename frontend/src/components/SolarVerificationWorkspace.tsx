"use client";

import { useEffect, useState } from "react";

import {
  Sun,
  Download,
  Wrench,
  CheckCircle2,
  Zap,
  BarChart3,
  ThermometerSun,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import type {
  SolarPresetCaseInfo,
  SolarVerificationResponse,
} from "../lib/types";

import {
  fetchSolarPresetCases,
  verifySolarWithPreset,
  verifySolarWithFiles,
  getExportSolarPdfUrl,
} from "../lib/api";

import { SolarWeatherForecast } from "./SolarWeatherForecast";
import { AnimatedNumber } from "./AnimatedNumber";
import { UploadSlot } from "./FileDropzone";
import { formatKwh } from "../lib/utils";
import { AuditReviewEditor } from "./LocalAuditReview";

const DEFAULT_SOLAR_PRESETS: SolarPresetCaseInfo[] = [
  {
    solar_case_id: "solar_case_1_healthy",
    title: "Sitara Textile Solar Plant (Faisalabad, 500 kW)",
    facility_name: "Sitara Textile Solar Plant",
    city: "Faisalabad",
    region: "Punjab",
    installed_capacity_kw: 500,
    status_badge: "NORMAL WEATHER & CONSUMPTION MATCH",
    summary:
      "Demonstration scenario: solar generation closely matches the weather-based expectation and site electricity demand falls as planned.",
    pdf_filename: "solar_case_1_healthy.pdf",
    csv_filename: "solar_case_1_healthy.csv",
  },
  {
    solar_case_id: "solar_case_2_zero_bill_rebound",
    title: "Karachi ColdChain Net-Metering Site (Karachi, 500 kW)",
    facility_name: "Karachi ColdChain Net-Metering Site",
    city: "Karachi",
    region: "Sindh",
    installed_capacity_kw: 500,
    status_badge: "SOLAR REBOUND OVER-CONSUMPTION",
    summary:
      "Demonstration scenario: the grid bill falls after solar installation, but total site electricity consumption rises above the expected target.",
    pdf_filename: "solar_case_2_zero_bill_rebound.pdf",
    csv_filename: "solar_case_2_zero_bill_rebound.csv",
  },
  {
    solar_case_id: "solar_case_3_hardware_fault",
    title: "Indus Solar Cold Storage (Multan, 400 kW)",
    facility_name: "Indus Solar Cold Storage",
    city: "Multan",
    region: "Punjab",
    installed_capacity_kw: 400,
    status_badge: "TECHNICAL FAULT / MAINTENANCE NEEDED",
    summary:
      "Demonstration scenario: inverter generation falls below the weather-based expectation. The result flags possible maintenance or equipment issues for review.",
    pdf_filename: "solar_case_3_hardware_fault.pdf",
    csv_filename: "solar_case_3_hardware_fault.csv",
  },
];

const CITY_OPTIONS = [
  "Karachi - Sindh",
  "Lahore - Punjab",
  "Faisalabad - Punjab",
  "Multan - Punjab",
  "Peshawar - KP",
  "Quetta - Balochistan",
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getPresetBadgeClass(badge: string) {
  if (badge.includes("NORMAL")) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }

  if (badge.includes("REBOUND")) {
    return "bg-rose-50 text-rose-800 border-rose-200";
  }

  return "bg-amber-50 text-amber-800 border-amber-200";
}

function getVerdictClasses(
  status: SolarVerificationResponse["verdict_status"]
) {
  if (status === "NORMAL_OPERATION") {
    return {
      background: "bg-emerald-700",
      border: "border-emerald-700",
      badge: "bg-white text-emerald-800",
    };
  }

  if (status === "TECHNICAL_FAULT_SUSPECTED") {
    return {
      background: "bg-slate-800",
      border: "border-amber-400",
      badge: "bg-amber-100 text-amber-900",
    };
  }

  return {
    background: "bg-rose-700",
    border: "border-rose-700",
    badge: "bg-white text-rose-800",
  };
}

export function SolarVerificationWorkspace() {
  const [solarCases, setSolarCases] = useState<SolarPresetCaseInfo[]>(
    DEFAULT_SOLAR_PRESETS
  );

  const [presetsLoading, setPresetsLoading] = useState(true);
  const [presetsError, setPresetsError] = useState<string | null>(null);

  const [selectedSolarCaseId, setSelectedSolarCaseId] = useState<
    string | null
  >(null);

  const [solarCsvFile, setSolarCsvFile] = useState<File | null>(null);
  const [solarPdfFile, setSolarPdfFile] = useState<File | null>(null);

  const [cityRegion, setCityRegion] = useState("Lahore - Punjab");
  const [installedKw, setInstalledKw] = useState<number>(500);

  const [solarReport, setSolarReport] =
    useState<SolarVerificationResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPresets = async () => {
    setPresetsLoading(true);
    setPresetsError(null);

    try {
      const loaded = await fetchSolarPresetCases();
      setSolarCases(loaded);
    } catch (error) {
      setPresetsError(
        getErrorMessage(
          error,
          "Could not load solar benchmark cases from the backend."
        )
      );
    } finally {
      setPresetsLoading(false);
    }
  };

  useEffect(() => {
    void loadPresets();
  }, []);

  const handleSelectSolarPreset = async (solarCaseId: string) => {
    if (loading) return;

    setSelectedSolarCaseId(solarCaseId);
    setSolarCsvFile(null);
    setSolarPdfFile(null);
    setLoading(true);
    setSolarReport(null);
    setErrorMsg(null);

    try {
      const result = await verifySolarWithPreset(solarCaseId);
      setSolarReport(result);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(error, "Failed to generate the solar report.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRunSolarUpload = async () => {
    if (loading) return;

    if (!solarCsvFile) {
      setErrorMsg("Please select your solar inverter CSV file first.");
      return;
    }

    if (
      !Number.isFinite(installedKw) ||
      installedKw < 10 ||
      installedKw > 25000
    ) {
      setErrorMsg(
        "Enter an installed capacity between 10 and 25,000 kW."
      );
      return;
    }

    setSelectedSolarCaseId(null);
    setLoading(true);
    setSolarReport(null);
    setErrorMsg(null);

    try {
      const result = await verifySolarWithFiles(
        solarCsvFile,
        solarPdfFile,
        cityRegion,
        installedKw
      );

      setSolarReport(result);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(error, "Solar file verification failed.")
      );
    } finally {
      setLoading(false);
    }
  };

  const monthlySeries =
    solarReport?.weather_health_check.monthly_solar_series ?? [];

  const maxSolarChartKwh = Math.max(
    1,
    ...monthlySeries.map((month) =>
      Math.max(
        month.nasa_expected_solar_kwh,
        month.actual_inverter_solar_kwh
      )
    )
  );

  const maxConsumptionChartKwh = Math.max(
    1,
    ...monthlySeries.map((month) =>
      Math.max(
        month.should_have_used_kwh,
        month.actually_used_kwh
      )
    )
  );

  const verdictClasses = solarReport
    ? getVerdictClasses(solarReport.verdict_status)
    : null;

  const panelClass =
    "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

  return (
    <div className="space-y-8 gg-solar">
      {/* Quick navigation */}

      <nav
        className="gg-section-nav"
        aria-label="Solar page sections"
      >
        <a href="#solar-weather">Weather & energy forecast</a>

        <a href="#solar-evidence">Review solar evidence</a>

        {solarReport && !loading && (
          <a href="#solar-result">View audit result</a>
        )}
      </nav>

      {/* Live weather, animated sun/moon and future generation */}

      <div id="solar-weather">
        <SolarWeatherForecast />
      </div>

      {/* Historical solar evidence upload */}

      <section
        id="solar-evidence"
        className={panelClass}
        aria-labelledby="solar-evidence-title"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-950 p-3 text-amber-300">
              <Sun className="h-6 w-6" />
            </div>

            <div>
              <span className="gg-eyebrow">
                SOLAR INTELLIGENCE / EVIDENCE REVIEW
              </span>

              <h2
                id="solar-evidence-title"
                className="text-lg font-semibold tracking-tight text-slate-900"
              >
                Check your actual solar performance.
              </h2>
            </div>
          </div>

          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Solar generation · Weather · Consumption
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          The weather panel above estimates future energy generation.
          This section reviews your uploaded historical solar records
          using your connected backend.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
          {/* Upload form */}

          <div className="lg:col-span-5 flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Upload your solar records
                </h3>

                <span className="text-xs font-medium text-emerald-700">
                  CSV required · PDF optional
                </span>
              </div>

              <div>
                <p className="mb-2 text-xs text-slate-600">
                  Solar inverter / net-metering CSV
                </p>

                <UploadSlot
                  evidence="solar"
                  type="csv"
                  file={solarCsvFile}
                  onSelect={setSolarCsvFile}
                  disabled={loading}
                />
              </div>

              <div>
                <p className="mb-2 text-xs text-slate-600">
                  Solar claim report — optional
                </p>

                <UploadSlot
                  type="pdf"
                  file={solarPdfFile}
                  onSelect={setSolarPdfFile}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="solar-audit-city"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Facility city / region
                  </label>

                  <select
                    id="solar-audit-city"
                    disabled={loading}
                    value={cityRegion}
                    onChange={(event) =>
                      setCityRegion(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {CITY_OPTIONS.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="solar-audit-capacity"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Installed capacity (kW)
                  </label>

                  <input
                    id="solar-audit-capacity"
                    type="number"
                    min={10}
                    max={25000}
                    step="any"
                    disabled={loading}
                    value={
                      Number.isNaN(installedKw) ? "" : installedKw
                    }
                    onChange={(event) =>
                      setInstalledKw(
                        event.target.value === ""
                          ? NaN
                          : Number(event.target.value)
                      )
                    }
                    aria-describedby="solar-capacity-help"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <p
                id="solar-capacity-help"
                className="text-xs text-slate-500"
              >
                Historical audit capacity: 10–25,000 kW. These settings
                are separate from the weather forecast above.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunSolarUpload}
              disabled={loading || !solarCsvFile}
              className="gg-primary w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}

              <span>
                {loading ? "Reviewing evidence…" : "Generate solar report"}
              </span>

              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>

          {/* Benchmark cases */}

          <div className="lg:col-span-7 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Or explore a sample solar plant
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Choose a benchmark to run a demonstration review.
                These are sample scenarios, not your facility’s data.
              </p>
            </div>

            {presetsLoading && (
              <p
                role="status"
                className="flex items-center gap-2 text-xs text-slate-500"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading benchmark cases…
              </p>
            )}

            {presetsError && (
              <div
                role="status"
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
              >
                <p>
                  Backend cases could not be loaded. Any cards shown
                  below are bundled demonstration descriptions.
                  Running a review still requires the backend.
                </p>

                <button
                  type="button"
                  disabled={presetsLoading || loading}
                  onClick={() => void loadPresets()}
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-2 font-medium"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry loading cases
                </button>
              </div>
            )}

            {!presetsLoading &&
              !presetsError &&
              solarCases.length === 0 && (
                <div className="gg-empty">
                  <Sun size={24} />

                  <div>
                    <strong>No benchmark cases available</strong>
                    <p>
                      Upload your own solar CSV to start a review.
                    </p>
                  </div>
                </div>
              )}

            <div className="grid grid-cols-1 gap-3">
              {solarCases.map((solarCase) => {
                const isSelected =
                  selectedSolarCaseId === solarCase.solar_case_id;

                return (
                  <button
                    key={solarCase.solar_case_id}
                    type="button"
                    onClick={() =>
                      handleSelectSolarPreset(solarCase.solar_case_id)
                    }
                    disabled={loading}
                    aria-pressed={isSelected}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/20"
                    }`}
                  >
                    <div className="mb-3 flex flex-col items-start gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {solarCase.title}
                      </h4>

                      <span
                        className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${getPresetBadgeClass(
                          solarCase.status_badge
                        )}`}
                      >
                        {solarCase.status_badge}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-600">
                      {solarCase.summary}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500">
                        {solarCase.city}, {solarCase.region} ·{" "}
                        {solarCase.installed_capacity_kw} kW
                      </span>

                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        Run sample review
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Loading state */}

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className={`${panelClass} flex flex-col items-center justify-center gap-3 py-12 text-center`}
        >
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />

          <h3 className="text-base font-semibold text-slate-900">
            Reviewing your solar evidence…
          </h3>

          <p className="max-w-md text-xs leading-relaxed text-slate-500">
            Comparing solar generation, grid imports and exports with
            the backend’s weather-based expectations.
          </p>
        </div>
      )}

      {/* Error state */}

      {errorMsg && !loading && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <strong className="mb-1 block">
            We couldn’t complete this review.
          </strong>

          <p>{errorMsg}</p>

          <p className="mt-2 text-xs">
            Check that your backend is running, then try the upload
            or sample case again.
          </p>
        </div>
      )}

      {/* Empty state */}

      {!solarReport && !loading && !errorMsg && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center">
          <Sun className="mx-auto mb-3 h-8 w-8 text-amber-500" />

          <h3 className="text-sm font-semibold text-slate-900">
            Your solar report will appear here
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-slate-500">
            Upload a solar inverter CSV or choose an available
            benchmark. The report will explain generation,
            consumption and possible performance issues.
          </p>
        </div>
      )}

      {solarReport && !loading && (
        <AuditReviewEditor
          key={solarReport.solar_audit_id}
          data={solarReport}
        />
      )}

      {/* Audit results */}

      {solarReport && verdictClasses && !loading && (
        <div
          id="solar-result"
          className="space-y-8 animate-fadeIn"
        >
          {/* Verdict and PDF download */}

          <section
            className={`rounded-2xl border p-6 text-white shadow-sm ${verdictClasses.background} ${verdictClasses.border}`}
            aria-labelledby="solar-result-title"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-3 py-1 text-xs font-semibold ${verdictClasses.badge}`}
                  >
                    {solarReport.status_badge}
                  </span>

                  <span className="break-all text-xs text-white/80">
                    Audit ID: {solarReport.solar_audit_id}
                  </span>
                </div>

                <h2
                  id="solar-result-title"
                  className="text-xl font-semibold tracking-tight"
                >
                  {solarReport.verdict_headline}
                </h2>

                <p className="mt-2 text-xs text-white/85">
                  {solarReport.facility_name} · {solarReport.city},{" "}
                  {solarReport.region} ·{" "}
                  {solarReport.installed_capacity_kw} kW
                </p>

                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/95">
                  {solarReport.verdict_summary}
                </p>
              </div>

              <a
                href={getExportSolarPdfUrl(
                  solarReport.solar_audit_id
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
                Download PDF report
              </a>
            </div>
          </section>

          {/* Consumption comparison */}

          <section className={`${panelClass} space-y-6`}>
            <div className="border-b border-slate-200 pb-4">
              <span className="gg-eyebrow">
                PART A / SITE CONSUMPTION
              </span>

              <h3 className="text-base font-semibold text-slate-900">
                A lower bill doesn’t always mean lower energy use.
              </h3>

              <p className="mt-2 text-xs text-slate-500">
                Total site use = grid imports + solar generation −
                electricity exported to the grid.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-medium text-slate-600">
                  Electricity imported from the grid
                </p>

                <div className="my-4 text-2xl font-semibold text-slate-900">
                  <AnimatedNumber
                    value={solarReport.zero_bill_check.grid_import_kwh}
                    suffix=" kWh"
                  />
                </div>

                <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">
                  Exported to grid:{" "}
                  <strong className="font-medium text-emerald-700">
                    {formatKwh(
                      solarReport.zero_bill_check.grid_export_kwh
                    )}
                  </strong>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
                <p className="text-xs font-medium text-slate-600">
                  Expected total electricity use
                </p>

                <div className="my-4 text-2xl font-semibold text-slate-900">
                  <AnimatedNumber
                    value={
                      solarReport.zero_bill_check.should_have_used_kwh
                    }
                    suffix=" kWh"
                  />
                </div>

                <div className="border-t border-blue-100 pt-3 text-xs text-slate-500">
                  Baseline demand:{" "}
                  <strong className="font-medium text-slate-700">
                    {formatKwh(
                      solarReport.zero_bill_check
                        .baseline_consumption_kwh
                    )}
                  </strong>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-950 bg-emerald-950 p-5 text-white">
                <p className="text-xs font-medium text-emerald-100">
                  Actual total electricity use
                </p>

                <div className="my-4 text-2xl font-semibold">
                  <AnimatedNumber
                    value={
                      solarReport.zero_bill_check.actually_used_kwh
                    }
                    suffix=" kWh"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3 text-xs">
                  <span className="text-white/75">
                    Difference from expected
                  </span>

                  <span
                    className={`rounded px-2 py-1 font-medium ${
                      solarReport.zero_bill_check.rebound_detected
                        ? "bg-rose-600"
                        : "bg-emerald-700"
                    }`}
                  >
                    {solarReport.zero_bill_check.overused_pct > 0
                      ? "+"
                      : ""}
                    {solarReport.zero_bill_check.overused_pct.toFixed(
                      1
                    )}
                    %
                  </span>
                </div>

                <p className="mt-2 text-xs text-white/75">
                  {solarReport.zero_bill_check.overused_kwh > 0
                    ? "+"
                    : ""}
                  {formatKwh(
                    solarReport.zero_bill_check.overused_kwh
                  )}
                </p>
              </div>
            </div>

            {solarReport.zero_bill_check.rebound_reasons.length >
              0 && (
              <details className="gg-disclosure">
                <summary>
                  Why did consumption change?
                  <span>
                    Explanations provided by the verification engine
                  </span>
                </summary>

                <div className="gg-disclosure-body grid grid-cols-1 md:grid-cols-3 gap-4">
                  {solarReport.zero_bill_check.rebound_reasons.map(
                    (reason, index) => (
                      <article
                        key={index}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <h4 className="text-sm font-semibold text-slate-900">
                          {reason.title}
                        </h4>

                        {reason.impact_kwh > 0 && (
                          <span className="mt-2 inline-block rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-800">
                            +{Math.round(reason.impact_kwh).toLocaleString()}{" "}
                            kWh ({reason.impact_share_pct.toFixed(0)}%)
                          </span>
                        )}

                        <p className="mt-3 text-xs leading-relaxed text-slate-600">
                          {reason.explanation}
                        </p>
                      </article>
                    )
                  )}
                </div>
              </details>
            )}
          </section>

          {/* Solar generation and weather comparison */}

          <section className={`${panelClass} space-y-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="gg-eyebrow">
                  PART B / SOLAR PERFORMANCE
                </span>

                <h3 className="text-base font-semibold text-slate-900">
                  Compare expected and recorded solar generation.
                </h3>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-600">
                <ThermometerSun className="h-4 w-4 shrink-0 text-amber-600" />

                <span>
                  {solarReport.weather_health_check.avg_irradiance_kwh_m2.toFixed(
                    2
                  )}{" "}
                  kWh/m²/day
                  <br />
                  {solarReport.weather_health_check.avg_temp_c.toFixed(
                    1
                  )}
                  °C average temperature
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-medium text-slate-600">
                  Weather-based expected output
                </p>

                <div className="my-4 text-2xl font-semibold text-slate-900">
                  <AnimatedNumber
                    value={
                      solarReport.weather_health_check
                        .nasa_expected_solar_kwh
                    }
                    suffix=" kWh"
                  />
                </div>

                <p className="text-xs leading-relaxed text-slate-500">
                  Backend expectation based on sunlight and
                  temperature for {solarReport.city}.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
                <p className="text-xs font-medium text-slate-600">
                  Recorded inverter output
                </p>

                <div className="my-4 text-2xl font-semibold text-emerald-800">
                  <AnimatedNumber
                    value={
                      solarReport.weather_health_check
                        .actual_inverter_solar_kwh
                    }
                    suffix=" kWh"
                  />
                </div>

                <p className="text-xs leading-relaxed text-slate-500">
                  Solar generation reported in the supplied records.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-800 p-5 text-white">
                <p className="text-xs font-medium text-slate-300">
                  Generation difference
                </p>

                <div className="my-4 text-2xl font-semibold">
                  <AnimatedNumber
                    value={
                      solarReport.weather_health_check
                        .generation_gap_pct
                    }
                    decimals={1}
                    signed
                    suffix="%"
                  />
                </div>

                <span
                  className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium ${
                    solarReport.weather_health_check.health_status ===
                    "NORMAL_WEATHER_VARIANCE"
                      ? "bg-emerald-700"
                      : solarReport.weather_health_check.health_status ===
                        "TECHNICAL_FAULT_SUSPECTED"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-rose-700"
                  }`}
                >
                  {solarReport.weather_health_check.health_status ===
                  "NORMAL_WEATHER_VARIANCE" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <Wrench className="h-4 w-4 shrink-0" />
                  )}

                  {solarReport.weather_health_check.health_badge}
                </span>

                <p className="mt-3 text-xs leading-relaxed text-slate-300">
                  {solarReport.weather_health_check.health_headline}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Backend temperature adjustment:{" "}
              {solarReport.weather_health_check.temp_derating_pct.toFixed(
                1
              )}
              % heat derating.
            </p>

            {solarReport.weather_health_check.health_status ===
              "TECHNICAL_FAULT_SUSPECTED" && (
              <div className="space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                    <Wrench className="h-4 w-4" />
                    Possible technical issues to investigate
                  </h4>

                  {solarReport.weather_health_check
                    .flagged_fault_months.length > 0 && (
                    <span className="rounded-md bg-amber-100 px-3 py-1 text-xs text-amber-900">
                      Flagged months:{" "}
                      {solarReport.weather_health_check.flagged_fault_months.join(
                        ", "
                      )}
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-amber-950">
                  {solarReport.weather_health_check.health_detail}
                </p>

                <p className="text-xs text-amber-900">
                  A performance gap can indicate equipment or
                  maintenance issues; it does not by itself establish
                  fraud.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {solarReport.weather_health_check.technical_fault_checklist.map(
                    (cause, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-amber-200 bg-white p-3 text-xs leading-relaxed text-slate-700"
                      >
                        {cause}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Monthly charts */}

          {monthlySeries.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Generation chart */}

              <section className={`${panelClass} space-y-4`}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <BarChart3 className="h-4 w-4 shrink-0 text-emerald-600" />
                  Monthly solar generation
                </h3>

                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
                    Weather-based expectation
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                    Recorded inverter output
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                    Flagged month
                  </span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div
                    className="grid min-w-[420px] items-end gap-2 pt-4"
                    style={{
                      gridTemplateColumns: `repeat(${monthlySeries.length}, minmax(0, 1fr))`,
                    }}
                    role="img"
                    aria-label="Monthly expected and recorded solar generation. Exact values are available in the table below."
                  >
                    {monthlySeries.map((month) => {
                      const expectedHeight = Math.max(
                        0,
                        (month.nasa_expected_solar_kwh /
                          maxSolarChartKwh) *
                          100
                      );

                      const actualHeight = Math.max(
                        0,
                        (month.actual_inverter_solar_kwh /
                          maxSolarChartKwh) *
                          100
                      );

                      return (
                        <div
                          key={month.month}
                          className="flex flex-col items-center"
                        >
                          <div className="flex h-36 w-full items-end justify-center gap-1">
                            <div
                              style={{ height: `${expectedHeight}%` }}
                              className="gg-chart-bar w-1/2 rounded-t bg-slate-300"
                              title={`${month.month}: expected ${formatKwh(
                                month.nasa_expected_solar_kwh
                              )}`}
                            />

                            <div
                              style={{ height: `${actualHeight}%` }}
                              className={`gg-chart-bar w-1/2 rounded-t ${
                                month.fault_flag
                                  ? "bg-amber-500"
                                  : "bg-emerald-600"
                              }`}
                              title={`${month.month}: recorded ${formatKwh(
                                month.actual_inverter_solar_kwh
                              )}`}
                            />
                          </div>

                          <span
                            className="mt-2 max-w-full truncate text-[10px] text-slate-500"
                            title={month.month}
                          >
                            {month.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Consumption chart */}

              <section className={`${panelClass} space-y-4`}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <BarChart3 className="h-4 w-4 shrink-0 text-blue-600" />
                  Monthly site electricity use
                </h3>

                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                    Expected use
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-slate-800" />
                    Actual use
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-rose-600" />
                    More than 5% above expected
                  </span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div
                    className="grid min-w-[420px] items-end gap-2 pt-4"
                    style={{
                      gridTemplateColumns: `repeat(${monthlySeries.length}, minmax(0, 1fr))`,
                    }}
                    role="img"
                    aria-label="Monthly expected and actual site electricity use. Exact values are available in the table below."
                  >
                    {monthlySeries.map((month) => {
                      const targetHeight = Math.max(
                        0,
                        (month.should_have_used_kwh /
                          maxConsumptionChartKwh) *
                          100
                      );

                      const actualHeight = Math.max(
                        0,
                        (month.actually_used_kwh /
                          maxConsumptionChartKwh) *
                          100
                      );

                      const isOver =
                        month.actually_used_kwh >
                        month.should_have_used_kwh * 1.05;

                      return (
                        <div
                          key={month.month}
                          className="flex flex-col items-center"
                        >
                          <div className="flex h-36 w-full items-end justify-center gap-1">
                            <div
                              style={{ height: `${targetHeight}%` }}
                              className="gg-chart-bar w-1/2 rounded-t bg-blue-500"
                              title={`${month.month}: expected ${formatKwh(
                                month.should_have_used_kwh
                              )}`}
                            />

                            <div
                              style={{ height: `${actualHeight}%` }}
                              className={`gg-chart-bar w-1/2 rounded-t ${
                                isOver
                                  ? "bg-rose-600"
                                  : "bg-slate-800"
                              }`}
                              title={`${month.month}: actual ${formatKwh(
                                month.actually_used_kwh
                              )}`}
                            />
                          </div>

                          <span
                            className="mt-2 max-w-full truncate text-[10px] text-slate-500"
                            title={month.month}
                          >
                            {month.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Exact monthly values */}

          {monthlySeries.length > 0 && (
            <details className="gg-disclosure">
              <summary>
                View monthly data
                <span>
                  Exact generation and consumption values in kWh
                </span>
              </summary>

              <div className="overflow-x-auto p-4">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <caption className="sr-only">
                    Monthly solar generation and site consumption
                  </caption>

                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th scope="col" className="p-3">
                        Month
                      </th>
                      <th scope="col" className="p-3">
                        Expected solar
                      </th>
                      <th scope="col" className="p-3">
                        Recorded solar
                      </th>
                      <th scope="col" className="p-3">
                        Expected site use
                      </th>
                      <th scope="col" className="p-3">
                        Actual site use
                      </th>
                      <th scope="col" className="p-3">
                        Fault flag
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {monthlySeries.map((month) => (
                      <tr
                        key={month.month}
                        className="border-t border-slate-100 text-slate-700"
                      >
                        <th scope="row" className="p-3 font-medium">
                          {month.month}
                        </th>

                        <td className="p-3">
                          {formatKwh(month.nasa_expected_solar_kwh)}
                        </td>

                        <td className="p-3">
                          {formatKwh(month.actual_inverter_solar_kwh)}
                        </td>

                        <td className="p-3">
                          {formatKwh(month.should_have_used_kwh)}
                        </td>

                        <td className="p-3">
                          {formatKwh(month.actually_used_kwh)}
                        </td>

                        <td className="p-3">
                          {month.fault_flag ? "Review required" : "None"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
