"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  FileCheck,
  Sun,
  Scale,
  History,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Files,
  RefreshCw,
} from "lucide-react";

import { Header } from "./Header";
import { AnimatedNumber } from "./AnimatedNumber";
import { ClaimReviewTab } from "./ClaimReviewTab";
import { SolarVerificationWorkspace } from "./SolarVerificationWorkspace";
import { FairnessAuditTab } from "./FairnessAuditTab";
import { HistoryVaultTab } from "./HistoryVaultTab";

import type {
  PreloadedCaseInfo,
  VerificationResponse,
  AuditHistoryItem,
} from "../lib/types";

import {
  checkBackendHealth,
  fetchPreloadedCases,
  verifyWithPreset,
  verifyWithFiles,
  fetchAuditHistory,
  fetchAuditRecord,
} from "../lib/api";

type DashboardTab = "review" | "solar" | "fairness" | "history";

interface GreenGuardDashboardProps {
  initialTab?: DashboardTab;
  lockToTab?: boolean;
  pageTitle: string;
  pageSubtitle: string;
  showOverviewCards?: boolean;
}

const workspaces = [
  {
    href: "/electricity-claim-check",
    Icon: FileCheck,
    title: "Electricity claims",
    tag: "01 / VERIFY",
    text: "Compare reported savings with 24-month meter evidence.",
    color: "green",
  },
  {
    href: "/solar-zero-bill-check",
    Icon: Sun,
    title: "Solar intelligence",
    tag: "02 / RECONCILE",
    text: "Review solar output, weather signals and site consumption.",
    color: "amber",
  },
  {
    href: "/fairness-and-robustness",
    Icon: Scale,
    title: "Fairness & robustness",
    tag: "03 / EVALUATE",
    text: "Explore subgroup disparities and adversarial stress tests.",
    color: "blue",
  },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function GreenGuardDashboard({
  initialTab = "review",
  lockToTab = false,
  pageTitle,
  pageSubtitle,
  showOverviewCards = false,
}: GreenGuardDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [showEvidenceWindow, setShowEvidenceWindow] = useState(false);

  const [llmProvider, setLlmProvider] = useState("deterministic");
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const [casesReady, setCasesReady] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [cases, setCases] = useState<PreloadedCaseInfo[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [verificationResult, setVerificationResult] =
    useState<VerificationResponse | null>(null);

  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentTab = lockToTab ? initialTab : activeTab;

  const initData = async () => {
    setBackendOnline(null);
    setConnectionError(null);

    try {
      const health = await checkBackendHealth();

      const online = [
        "HEALTHY",
        "ONLINE",
        "OK",
        "HEALTHY_LOCAL",
      ].includes(health.status?.toUpperCase());

      setBackendOnline(online);

      const [caseResult, historyResult] = await Promise.allSettled([
        fetchPreloadedCases(),
        fetchAuditHistory(),
      ]);

      setCasesReady(caseResult.status === "fulfilled");
      setHistoryReady(historyResult.status === "fulfilled");

      if (caseResult.status === "fulfilled") {
        setCases(caseResult.value);
      }

      if (historyResult.status === "fulfilled") {
        setAuditHistory(historyResult.value);
      }

      if (
        online &&
        (caseResult.status === "rejected" ||
          historyResult.status === "rejected")
      ) {
        setConnectionError(
          "Some workspace data could not be loaded. Retry the connection to refresh cases and history."
        );
      }
    } catch (error) {
      setBackendOnline(false);
      setConnectionError(
        getErrorMessage(error, "Could not connect to your backend.")
      );
    }
  };

  useEffect(() => {
    if (
      !lockToTab &&
      new URLSearchParams(window.location.search).get("tab") === "history"
    ) {
      setActiveTab("history");
    }

    void initData();
  }, []);

  const updateHistoryAfterVerification = async () => {
    try {
      const updatedHistory = await fetchAuditHistory();
      setAuditHistory(updatedHistory);
      setHistoryReady(true);
    } catch {
      // Keep the previous history if refreshing fails.
    }
  };

  const handleSelectCase = async (
    caseId: string,
    provider = llmProvider
  ) => {
    if (loading) return;

    setSelectedCaseId(caseId);
    setPdfFile(null);
    setCsvFile(null);
    setLoading(true);
    setVerificationResult(null);
    setErrorMessage(null);

    try {
      const result = await verifyWithPreset(caseId, provider);
      setVerificationResult(result);
      await updateHistoryAfterVerification();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Case verification failed")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRunCustomVerify = async () => {
    if (!pdfFile || !csvFile || loading) return;

    setSelectedCaseId(null);
    setLoading(true);
    setVerificationResult(null);
    setErrorMessage(null);

    try {
      const result = await verifyWithFiles(
        pdfFile,
        csvFile,
        llmProvider
      );

      setVerificationResult(result);
      await updateHistoryAfterVerification();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Evidence verification failed")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInspectAuditFromHistory = async (auditId: string) => {
    if (loading) return;

    setLoading(true);
    setVerificationResult(null);
    setErrorMessage(null);

    try {
      const record = await fetchAuditRecord(auditId);

      setVerificationResult(record);
      setSelectedCaseId(record.case_id || null);
      setActiveTab("review");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not retrieve audit record")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshHistory = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const updated = await fetchAuditHistory();

      setAuditHistory(updated);
      setHistoryReady(true);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not refresh audit history")
      );
    } finally {
      setLoading(false);
    }
  };

  const openAuditHistory = () => {
    setActiveTab("history");

    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? "auto"
        : "smooth",
    });
  };

  const summaryCards = [
    {
      label: "Audit records",
      value: historyReady ? auditHistory.length : null,
      note: "View saved audit records",
      Icon: History,
      target: "history",
    },
    {
      label: "Benchmark cases",
      value: casesReady ? cases.length : null,
      note: "Explore available benchmark cases",
      Icon: Files,
      target: "benchmark-cases",
    },
    {
      label: "Evidence window",
      value: 24,
      note: "Understand the evidence periods",
      Icon: Activity,
      target: "evidence-window",
    },
    {
      label: "Review workspaces",
      value: 3,
      note: "Choose a review workspace",
      Icon: ShieldCheck,
      target: "review-workspaces",
    },
  ];

  return (
    <div className="gg-app">
      <div>
        <Header
          activeTab={currentTab}
          onTabChange={lockToTab ? undefined : setActiveTab}
          llmProvider={llmProvider}
          onLlmProviderChange={(provider: string) => {
            setLlmProvider(provider);

            if (selectedCaseId && !loading) {
              void handleSelectCase(selectedCaseId, provider);
            }
          }}
          busy={loading}
          backendOnline={backendOnline}
          historyCount={auditHistory.length}
        />

        <main id="main-content" className="gg-main">
          <section className="gg-heading reveal-in">
            <div>
              <p className="gg-eyebrow">
                SUSTAINABILITY INTELLIGENCE /{" "}
                {currentTab === "history" ? "RECORDS" : "WORKSPACE"}
              </p>

              <h1>
                {currentTab === "history" ? (
                  "Your audit trail."
                ) : showOverviewCards ? (
                  <>
                    Clarity behind every <em>green claim.</em>
                  </>
                ) : (
                  pageTitle
                )}
              </h1>

              <p>
                {currentTab === "history"
                  ? "Revisit the evidence, calculations and decisions behind your previous reviews."
                  : showOverviewCards
                  ? "Turn sustainability reports into evidence-led decisions. Review claims, reconcile energy data and understand the gaps."
                  : pageSubtitle}
              </p>
            </div>

            <a
              className="gg-primary"
              href={
                currentTab === "review"
                  ? "#evidence-upload"
                  : "/electricity-claim-check#evidence-upload"
              }
            >
              <FileCheck size={17} />
              New verification
              <ArrowUpRight size={17} />
            </a>
          </section>

          {(backendOnline === false || connectionError) && (
            <div className="gg-connection" role="status">
              <Activity size={19} />

              <div>
                <strong>
                  {connectionError
                    ? "Workspace data unavailable"
                    : "Connect your backend to begin"}
                </strong>

                <p>
                  {connectionError ||
                    "Your workspace is ready. Start the backend service to load benchmark cases and audit records."}
                </p>
              </div>

              <button type="button" onClick={() => void initData()}>
                <RefreshCw size={15} />
                Retry connection
              </button>
            </div>
          )}

          {showOverviewCards && currentTab !== "history" && (
            <>
              <section
                className="gg-hero reveal-in"
                aria-label="Verification workflow"
              >
                <div className="gg-hero-copy">
                  <span className="gg-hero-tag">
                    <span />
                    EVIDENCE BEFORE ASSURANCE
                  </span>

                  <h2>
                    From a bold claim.
                    <br />
                    To a clear picture.
                  </h2>

                  <p>
                    Connect the dots between company reports and real
                    energy records, all in one review workspace.
                  </p>

                  <a href="#evidence-upload">
                    Review your evidence
                    <ArrowRight size={17} />
                  </a>
                </div>

                <div
                  className="gg-flow"
                  aria-label="Report and meter data are reconciled to produce a review"
                >
                  <div className="gg-flow-source">
                    <span>
                      <Files size={18} />
                      Company report
                      <small>PDF</small>
                    </span>

                    <span>
                      <Activity size={18} />
                      Energy records
                      <small>CSV</small>
                    </span>
                  </div>

                  <div className="gg-flow-line" />

                  <div className="gg-flow-core">
                    <ShieldCheck size={34} />
                    <strong>GreenGuard AI</strong>
                    <small>Reconcile · Analyse · Explain</small>
                  </div>

                  <div className="gg-flow-out">
                    <span>
                      <ShieldCheck size={16} />
                      Evidence-led review
                    </span>

                    <div className="gg-mini-bars">
                      {[40, 65, 48, 78, 58, 85, 67, 93].map(
                        (height, index) => (
                          <i
                            key={index}
                            style={{
                              height: `${height}%`,
                              animationDelay: `${index * 80}ms`,
                            }}
                          />
                        )
                      )}
                    </div>

                    <small>
                      Workflow illustration · not audit data
                    </small>
                  </div>
                </div>
              </section>

              <section
                className="gg-metrics"
                aria-label="Workspace summary"
              >
                {summaryCards.map(
                  ({ label, value, note, Icon, target }, index) => {
                    const content = (
                      <>
                        <div>
                          <span>{label}</span>
                          <Icon size={18} />
                        </div>

                        <strong>
                          <AnimatedNumber value={value} />
                        </strong>

                        <small>
                          {note}
                          <ArrowUpRight size={13} />
                        </small>
                      </>
                    );

                    const style = {
                      animationDelay: `${index * 70}ms`,
                    };

                    if (target === "history") {
                      return (
                        <button
                          key={target}
                          type="button"
                          className="gg-metric gg-metric-action"
                          style={style}
                          onClick={openAuditHistory}
                        >
                          {content}
                        </button>
                      );
                    }

                    if (target === "evidence-window") {
                      return (
                        <button
                          key={target}
                          type="button"
                          className="gg-metric gg-metric-action"
                          style={style}
                          aria-expanded={showEvidenceWindow}
                          aria-controls="evidence-window"
                          onClick={() =>
                            setShowEvidenceWindow((open) => !open)
                          }
                        >
                          {content}
                        </button>
                      );
                    }

                    return (
                      <a
                        key={target}
                        className="gg-metric gg-metric-action"
                        style={style}
                        href={`#${target}`}
                      >
                        {content}
                      </a>
                    );
                  }
                )}
              </section>

              {showEvidenceWindow && (
                <section
                  id="evidence-window"
                  aria-labelledby="evidence-window-title"
                  className="gg-empty reveal-in"
                >
                  <Activity size={24} />

                  <div>
                    <strong id="evidence-window-title">
                      What does the 24-month evidence window mean?
                    </strong>

                    <p>
                      The review compares a baseline period with a
                      reporting period, typically 12 months each.
                      Upload monthly meter records for both periods
                      alongside the company report. After verification,
                      the result shows the actual month counts, data
                      completeness and calculated savings.
                    </p>

                    <a
                      className="gg-evidence-link"
                      href="#evidence-upload"
                    >
                      Upload your evidence
                      <ArrowRight size={14} />
                    </a>
                  </div>

                  <button
                    type="button"
                    aria-label="Close evidence window explanation"
                    onClick={() => setShowEvidenceWindow(false)}
                  >
                    Close
                  </button>
                </section>
              )}

              <section
                id="review-workspaces"
                className="gg-workspaces"
              >
                <div className="gg-section-title">
                  <h2>Choose your workspace</h2>
                  <span>One platform. Three perspectives.</span>
                </div>

                <div className="gg-workspace-grid">
                  {workspaces.map(
                    ({ href, Icon, title, tag, text, color }) => (
                      <Link
                        href={href}
                        key={href}
                        className={`gg-workspace-card ${color}`}
                      >
                        <div>
                          <span className="gg-card-icon">
                            <Icon size={21} />
                          </span>

                          <small>{tag}</small>
                          <ArrowUpRight size={18} />
                        </div>

                        <h3>{title}</h3>
                        <p>{text}</p>

                        <span className="gg-card-link">
                          Open workspace
                          <ArrowRight size={15} />
                        </span>
                      </Link>
                    )
                  )}
                </div>
              </section>
            </>
          )}

          <div className="gg-content reveal-in" key={currentTab}>
            {currentTab === "review" && (
              <ClaimReviewTab
                cases={cases}
                selectedCaseId={selectedCaseId}
                onSelectCase={handleSelectCase}
                pdfFile={pdfFile}
                csvFile={csvFile}
                onPdfSelect={setPdfFile}
                onCsvSelect={setCsvFile}
                onRunCustomVerify={handleRunCustomVerify}
                verificationResult={verificationResult}
                loading={loading}
                errorMessage={errorMessage}
              />
            )}

            {currentTab === "solar" && (
              <SolarVerificationWorkspace />
            )}

            {currentTab === "fairness" && <FairnessAuditTab />}

            {currentTab === "history" && errorMessage && (
              <div
                role="alert"
                className="p-4 mb-4 rounded-xl bg-rose-50 text-rose-800"
              >
                {errorMessage}
              </div>
            )}

            {currentTab === "history" && (
              <HistoryVaultTab
                history={auditHistory}
                onSelectAudit={handleInspectAuditFromHistory}
                onRefresh={handleRefreshHistory}
                loading={loading}
              />
            )}
          </div>
        </main>
      </div>

      <footer className="gg-footer">
        <span>
          <ShieldCheck size={15} />
          GreenGuard AI
          <span>·</span>
          Evidence-led sustainability review
        </span>

        <span>
          Results support human review and depend on supplied evidence.
        </span>
      </footer>
    </div>
  );
}