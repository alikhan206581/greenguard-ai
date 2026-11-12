import {
  VerificationResponse,
  PreloadedCaseInfo,
  SolarPresetCaseInfo,
  SolarVerificationResponse,
  FairnessAuditResponse,
  AdversarialAuditResponse,
  AuditHistoryItem,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(apiUrl("/health"), { method: "GET" });
  if (!res.ok) {
    throw new Error(`Backend health check failed: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchPreloadedCases(): Promise<PreloadedCaseInfo[]> {
  const res = await fetch(apiUrl("/api/v1/cases"));
  if (!res.ok) {
    throw new Error(`Failed to load benchmark cases: ${res.statusText}`);
  }
  return await res.json();
}

export async function verifyWithPreset(
  caseId: string,
  llmProvider: string = "deterministic"
): Promise<VerificationResponse> {
  const res = await fetch(
    apiUrl(`/api/v1/verify?case_id=${encodeURIComponent(caseId)}&llm_provider=${encodeURIComponent(llmProvider)}`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        case_id: caseId,
        llm_provider: llmProvider,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Verification failed" }));
    throw new Error(err.detail || "Verification failed");
  }
  return await res.json();
}

export async function verifyWithFiles(
  pdfFile: File,
  csvFile: File,
  llmProvider: string = "deterministic"
): Promise<VerificationResponse> {
  const formData = new FormData();
  formData.append("report_pdf", pdfFile);
  formData.append("meter_csv", csvFile);
  formData.append("llm_provider", llmProvider);

  const res = await fetch(apiUrl("/api/v1/verify"), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Verification failed" }));
    throw new Error(err.detail || "Verification failed");
  }
  return await res.json();
}

export async function fetchSolarPresetCases(): Promise<SolarPresetCaseInfo[]> {
  const res = await fetch(apiUrl("/api/v1/solar/cases"));
  if (!res.ok) {
    throw new Error("Failed to load solar preset cases");
  }
  return await res.json();
}

export async function verifySolarWithPreset(
  solarCaseId: string
): Promise<SolarVerificationResponse> {
  const res = await fetch(
    apiUrl(`/api/v1/solar/verify?solar_case_id=${encodeURIComponent(solarCaseId)}`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ solar_case_id: solarCaseId }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Solar verification failed" }));
    throw new Error(err.detail || "Solar verification failed");
  }
  return await res.json();
}

export async function verifySolarWithFiles(
  solarCsvFile: File,
  solarPdfFile: File | null,
  cityRegion: string,
  installedCapacityKw: number
): Promise<SolarVerificationResponse> {
  const parts = cityRegion.split("-").map((s) => s.trim());
  const city = parts[0] || "Lahore";
  const region = parts[1] || "Punjab";

  const formData = new FormData();
  formData.append("solar_inverter_csv", solarCsvFile);
  if (solarPdfFile) {
    formData.append("solar_report_pdf", solarPdfFile);
  }
  formData.append("city", city);
  formData.append("region", region);
  formData.append("installed_capacity_kw", String(installedCapacityKw));

  const res = await fetch(apiUrl("/api/v1/solar/verify"), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Solar upload verification failed" }));
    throw new Error(err.detail || "Solar upload verification failed");
  }
  return await res.json();
}

export function getExportSolarPdfUrl(solarAuditId: string): string {
  return apiUrl(`/api/v1/solar/${encodeURIComponent(solarAuditId)}/export-pdf`);
}

export async function fetchAuditHistory(): Promise<AuditHistoryItem[]> {
  const res = await fetch(apiUrl("/api/v1/history"));
  if (!res.ok) {
    throw new Error("Failed to fetch audit history");
  }
  return await res.json();
}

export async function fetchAuditRecord(auditId: string): Promise<VerificationResponse> {
  const res = await fetch(apiUrl(`/api/v1/verify/${encodeURIComponent(auditId)}`));
  if (!res.ok) {
    throw new Error(`Failed to fetch audit record: ${auditId}`);
  }
  return await res.json();
}

export function getExportPdfUrl(auditId: string): string {
  return apiUrl(`/api/v1/verify/${encodeURIComponent(auditId)}/export-pdf`);
}

export async function fetchFairnessAudit(): Promise<FairnessAuditResponse> {
  const res = await fetch(apiUrl("/api/v1/fairness/audit"));
  if (!res.ok) {
    throw new Error("Failed to fetch fairness evaluation");
  }
  return await res.json();
}

export function getExportFairnessCsvUrl(): string {
  return apiUrl("/api/v1/fairness/export-csv");
}

export async function fetchAdversarialAudit(
  perturbationPct: number = 2.0
): Promise<AdversarialAuditResponse> {
  const res = await fetch(
    apiUrl(`/api/v1/fairness/adversarial-audit?perturbation_pct=${encodeURIComponent(
      perturbationPct
    )}`)
  );
  if (!res.ok) {
    throw new Error("Failed to fetch adversarial perturbation audit");
  }
  return await res.json();
}
