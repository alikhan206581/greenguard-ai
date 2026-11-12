export interface RAGRetrievedChunk {
  chunk_id: string;
  page_number: number;
  text_snippet: string;
  relevance_score: number;
  matched_keywords: string[];
}

export interface PipelineStageTrace {
  stage_number: number;
  stage_name: string;
  status: "VERIFIED" | "WARNING" | "FAILED";
  duration_ms: number;
  verification_detail: string;
}

export interface TraceableField<T = any> {
  value: T;
  page_number?: number | null;
  verbatim_quote?: string | null;
  quote_verified_in_pdf?: boolean;
  extraction_confidence?: "EXPLICIT" | "AMBIGUOUS" | "MISSING";
}

export interface ExtractedClaimSchema {
  company_name: string;
  facility_name: TraceableField<string>;
  region: "Sindh" | "Punjab" | "KP" | "Balochistan";
  business_size: "Small" | "Medium" | "Large";
  baseline_period: TraceableField<string>;
  reporting_period: TraceableField<string>;
  claim_boundary_type: "TOTAL_CONSUMPTION_REDUCTION" | "GRID_PURCHASE_ONLY" | "UNSPECIFIED";
  claim_type: TraceableField<string>;
  claimed_baseline_kwh: TraceableField<number>;
  claimed_reporting_kwh: TraceableField<number>;
  claimed_reduction_kwh: TraceableField<number>;
  claimed_reduction_pct: TraceableField<number>;
  stated_intervention: TraceableField<string>;
}

export interface MonthlyReading {
  month: string;
  period: "baseline" | "reporting";
  grid_kwh: number;
  solar_kwh: number;
  total_kwh: number;
}

export interface MeterEvidenceSummary {
  facility_id: string;
  facility_name: string;
  baseline_period: string;
  reporting_period: string;
  baseline_months_count: number;
  reporting_months_count: number;
  baseline_total_kwh: number;
  reporting_total_kwh: number;
  baseline_grid_kwh: number;
  reporting_grid_kwh: number;
  baseline_solar_kwh: number;
  reporting_solar_kwh: number;
  data_completeness: string;
  monthly_breakdown: MonthlyReading[];
}

export interface DeterministicCalculationResult {
  calculated_total_reduction_kwh: number;
  calculated_total_reduction_pct: number;
  calculated_grid_reduction_kwh: number;
  calculated_grid_reduction_pct: number;
  discrepancy_kwh: number;
  discrepancy_pct_points: number;
  excess_over_calculated_pct: number;
  unverified_claim_share_pct: number;
  boundary_mismatch_detected: boolean;
  tolerance_passed: boolean;
}

export interface VerificationResponse {
  audit_id: string;
  timestamp: string;
  case_id?: string | null;
  active_llm_mode: "OFFLINE_LOCAL_OLLAMA" | "CLOUD_OPENAI_API" | "DETERMINISTIC_RAG_FALLBACK";
  embedding_engine: string;
  privacy_badge: string;
  verdict: "SUPPORTED BY SUPPLIED EVIDENCE" | "CONTRADICTED BY SUPPLIED EVIDENCE" | "INSUFFICIENT EVIDENCE";
  verdict_reason: string;
  pipeline_trace: PipelineStageTrace[];
  rag_retrieved_chunks: RAGRetrievedChunk[];
  extracted_claim: ExtractedClaimSchema;
  meter_evidence: MeterEvidenceSummary;
  calculations: DeterministicCalculationResult;
  reviewer_checklist: string[];
  limitations_notice: string;
}

export interface PreloadedCaseInfo {
  case_id: string;
  title: string;
  company_name: string;
  region: string;
  business_size: string;
  description: string;
  summary: string;
  claimed_reduction_pct: number;
  expected_verdict: string;
  pdf_filename: string;
  csv_filename: string;
}

export interface SolarPresetCaseInfo {
  solar_case_id: string;
  title: string;
  facility_name: string;
  city: string;
  region: "Sindh" | "Punjab" | "KP" | "Balochistan";
  installed_capacity_kw: number;
  status_badge: string;
  summary: string;
  pdf_filename: string;
  csv_filename: string;
}

export interface SolarReboundReason {
  title: string;
  impact_kwh: number;
  impact_share_pct: number;
  explanation: string;
}

export interface SolarZeroBillCheck {
  grid_import_kwh: number;
  solar_generated_kwh: number;
  grid_export_kwh: number;
  baseline_consumption_kwh: number;
  should_have_used_kwh: number;
  actually_used_kwh: number;
  overused_kwh: number;
  overused_pct: number;
  rebound_detected: boolean;
  rebound_reasons: SolarReboundReason[];
}

export interface SolarMonthlySeriesItem {
  month: string;
  nasa_expected_solar_kwh: number;
  actual_inverter_solar_kwh: number;
  grid_import_kwh: number;
  grid_export_kwh: number;
  should_have_used_kwh: number;
  actually_used_kwh: number;
  generation_gap_pct: number;
  nasa_irradiance_kwh_m2: number;
  nasa_temp_c: number;
  fault_flag: boolean;
  status_flag: "NORMAL_WEATHER_VARIANCE" | "TECHNICAL_FAULT_SUSPECTED" | "OVERCLAIMED_SOLAR_OUTPUT";
}

export interface SolarWeatherHealthCheck {
  nasa_expected_solar_kwh: number;
  actual_inverter_solar_kwh: number;
  claimed_solar_kwh: number;
  generation_gap_kwh: number;
  generation_gap_pct: number;
  health_status: "NORMAL_WEATHER_VARIANCE" | "TECHNICAL_FAULT_SUSPECTED" | "OVERCLAIMED_SOLAR_OUTPUT";
  health_badge: string;
  health_headline: string;
  health_detail: string;
  avg_irradiance_kwh_m2: number;
  avg_temp_c: number;
  temp_derating_pct: number;
  flagged_fault_months: string[];
  technical_fault_checklist: string[];
  monthly_solar_series: SolarMonthlySeriesItem[];
}

export interface SolarVerificationResponse {
  solar_audit_id: string;
  timestamp: string;
  solar_case_id?: string | null;
  facility_name: string;
  city: string;
  region: "Sindh" | "Punjab" | "KP" | "Balochistan";
  installed_capacity_kw: number;
  verdict_status:
    | "NORMAL_OPERATION"
    | "REBOUND_OVERCONSUMPTION"
    | "TECHNICAL_FAULT_SUSPECTED"
    | "OVERCLAIMED_SOLAR_OUTPUT";
  status_badge: string;
  verdict_headline: string;
  verdict_summary: string;
  zero_bill_check: SolarZeroBillCheck;
  weather_health_check: SolarWeatherHealthCheck;
  reviewer_actions: string[];
}

export interface SubgroupFairnessMetric {
  group_type: "Region" | "Business Size" | "Combined";
  group_name: string;
  sample_size_n: number;
  genuinely_supported_n: number;
  false_positives_n: number;
  fpr: number;
  ci_lower: number;
  ci_upper: number;
  insufficient_evidence_count: number;
  insufficient_evidence_rate: number;
}

export interface FairnessAuditResponse {
  timestamp: string;
  total_cases: number;
  overall_fpr: number;
  region_disparity: number;
  region_fpr_disparity: number;
  region_disparity_passed: boolean;
  size_disparity: number;
  size_fpr_disparity: number;
  size_disparity_passed: boolean;
  max_allowed_disparity: number;
  threshold: number;
  compliance_verdict: "COMPLIANT" | "NON_COMPLIANT";
  compliance_status: "COMPLIANT" | "NON_COMPLIANT";
  subgroup_metrics: SubgroupFairnessMetric[];
  by_region: SubgroupFairnessMetric[];
  by_business_size: SubgroupFairnessMetric[];
  combined_slices: SubgroupFairnessMetric[];
}

export interface AuditHistoryItem {
  id: string;
  audit_id: string;
  timestamp: string;
  case_id?: string;
  company_name: string;
  active_llm_mode: string;
  verdict: "SUPPORTED BY SUPPLIED EVIDENCE" | "CONTRADICTED BY SUPPLIED EVIDENCE" | "INSUFFICIENT EVIDENCE";
  verdict_reason: string;
  duration_ms: number;
  run_label: string;
}

export interface PerturbationVectorTest {
  case_id: string;
  attack_vector: string;
  field_name: string;
  original_value: string;
  perturbed_value: string;
  sanitized_value: string;
  perturbation_pct: number;
  unprotected_verdict: string;
  defended_verdict: string;
  drift_kwh: number;
  evasion_prevented: boolean;
}

export interface AdversarialAuditResponse {
  timestamp: string;
  perturbation_magnitude_pct: number;
  total_adversarial_trials: number;
  unprotected_flip_count: number;
  unprotected_consistency_rate_pct: number;
  defended_flip_count: number;
  defended_consistency_rate_pct: number;
  max_prediction_drift_before_kwh: number;
  max_prediction_drift_after_kwh: number;
  c09_status: string;
  defensive_layers_active: string[];
  perturbation_vectors_tested: PerturbationVectorTest[];
}
