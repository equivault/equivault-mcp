// --- Company ---

export interface Company {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  industry?: string;
  description?: string;
  exchange?: string;
  market_cap?: number;
  country?: string;
}

export interface CompanyDetail extends Company {
  website?: string;
  employees?: number;
  founded?: string;
  ceo?: string;
  headquarters?: string;
}

// --- Financials ---

export interface FinancialStatement {
  period: string;
  period_type: "annual" | "quarterly";
  currency: string;
  items: Record<string, number | null>;
}

export interface FinancialsResponse {
  company_id: string;
  income_statement: FinancialStatement[];
  balance_sheet: FinancialStatement[];
  cash_flow: FinancialStatement[];
}

// --- Metrics ---

export interface MetricDataPoint {
  period: string;
  value: number | null;
}

export interface MetricSeries {
  name: string;
  category: string;
  unit: string;
  data: MetricDataPoint[];
}

export interface MetricsResponse {
  company_id: string;
  metrics: MetricSeries[];
}

// --- Stock Quote ---

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

// --- Screening ---

export interface ScreenFilters {
  sector?: string;
  industry?: string;
  market_cap_min?: number;
  market_cap_max?: number;
  pe_ratio_min?: number;
  pe_ratio_max?: number;
  revenue_growth_min?: number;
  revenue_growth_max?: number;
  dividend_yield_min?: number;
  [key: string]: string | number | undefined;
}

export interface ScreenResult {
  company: Company;
  metrics: Record<string, number | null>;
}

// --- Comparison ---

export interface ComparisonColumn {
  company: Company;
  metrics: Record<string, number | null>;
}

export interface ComparisonResponse {
  columns: ComparisonColumn[];
  metric_names: string[];
}

// --- Billing ---

export interface BillingStatus {
  tier: string;
  status: string;
  query_limit: number;
  query_count: number;
  companies_limit: number;
  companies_count: number;
  api_access: boolean;
  trial_days_remaining?: number;
  overage_enabled: boolean;
}

// --- Narrative ---

export interface CompanyNarrative {
  company_id: string;
  thesis: string;
  drivers: string[];
  headwinds: string[];
  tailwinds: string[];
  updated_at: string;
  history?: NarrativeVersion[];
}

export interface NarrativeVersion {
  version: number;
  generated_at: string;
  thesis: string;
}

// --- Guidance ---

export interface GuidanceItem {
  period: string;
  metric: string;
  value: number | null;
  unit: string;
  source: string;
  given_at: string;
  outcome?: "beat" | "miss" | "in_line" | "pending";
}

export interface GuidanceResponse {
  company_id: string;
  items: GuidanceItem[];
}

// --- Segments ---

export interface SegmentBreakdown {
  name: string;
  revenue: number | null;
  operating_income: number | null;
  margin: number | null;
  yoy_growth: number | null;
}

export interface SegmentsResponse {
  company_id: string;
  period: string;
  currency: string;
  segments: SegmentBreakdown[];
}

// --- Capital Allocation ---

export interface CapitalAllocationItem {
  period: string;
  buybacks: number | null;
  dividends: number | null;
  debt_repayment: number | null;
  acquisitions: number | null;
  capex: number | null;
}

export interface CapitalAllocationResponse {
  company_id: string;
  currency: string;
  items: CapitalAllocationItem[];
}

// --- Risk Factors ---

export interface RiskFactor {
  id: string;
  category: string;
  description: string;
  first_seen: string;
  last_updated: string;
  status: "new" | "ongoing" | "resolved" | "elevated";
}

export interface RiskFactorsResponse {
  company_id: string;
  factors: RiskFactor[];
}

// --- Insider Transactions ---

export interface InsiderTransaction {
  filer: string;
  role: string;
  transaction_type: "buy" | "sell" | "grant" | "exercise";
  shares: number;
  price: number | null;
  value: number | null;
  filed_at: string;
  is_10b5_1: boolean;
}

export interface InsiderTransactionsResponse {
  company_id: string;
  transactions: InsiderTransaction[];
}

// --- Earnings Quality ---

export interface EarningsQualityResponse {
  company_id: string;
  period: string;
  score: number;
  accruals_ratio: number | null;
  cash_conversion: number | null;
  non_gaap_adjustments: number | null;
  flags: string[];
}

// --- Debt Maturities ---

export interface DebtMaturity {
  year: number;
  principal: number;
  interest_rate: number | null;
  instrument: string;
}

export interface DebtMaturitiesResponse {
  company_id: string;
  currency: string;
  maturities: DebtMaturity[];
}

// --- Competitive Signals ---

export interface CompetitiveSignal {
  signal_type: string;
  description: string;
  severity: "low" | "medium" | "high";
  detected_at: string;
  source: string;
}

export interface CompetitiveSignalsResponse {
  company_id: string;
  signals: CompetitiveSignal[];
}

// --- Management Statements ---

export interface ManagementStatement {
  speaker: string;
  role: string;
  topic: string;
  quote: string;
  sentiment: "positive" | "neutral" | "negative";
  source: string;
  stated_at: string;
}

export interface ManagementStatementsResponse {
  company_id: string;
  statements: ManagementStatement[];
}

// --- Accounting Snapshots ---

export interface AccountingSnapshot {
  period: string;
  policies: Record<string, string>;
  changes_from_prior: string[];
}

export interface AccountingSnapshotsResponse {
  company_id: string;
  snapshots: AccountingSnapshot[];
}

// --- Strategy Profiles ---

export interface StrategyProfile {
  id: string;
  name: string;
  type: "system" | "custom";
  description: string;
  criteria: Record<string, unknown>;
  created_at: string;
}

// --- Signals ---

export interface Signal {
  id: string;
  company_id: string;
  signal_type: string;
  severity: "low" | "medium" | "high";
  sentiment: "positive" | "neutral" | "negative";
  speaker?: string;
  quote?: string;
  source: string;
  detected_at: string;
  read: boolean;
}

export interface SignalListResponse {
  signals: Signal[];
  total: number;
  page: number;
}

export interface SignalSummary {
  company_id: string;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  unread_count: number;
}

export interface SignalDashboard {
  portfolio_signals: Signal[];
  unread_total: number;
  by_company: Array<{ company_id: string; count: number; last_detected: string }>;
}

export interface SignalTrendPoint {
  bucket: string; // ISO date or period label
  count: number;
  by_severity?: Record<string, number>;
}

export interface SignalTrendsResponse {
  trends: SignalTrendPoint[];
  window: string;
}

export interface TrendingSignal {
  company_id: string;
  ticker: string;
  signal_type: string;
  severity: "low" | "medium" | "high";
  momentum_score: number;
  detected_at: string;
}

// --- Alerts ---

export interface AlertRule {
  id: string;
  name: string;
  company_id?: string;
  metric: string;
  condition: "above" | "below" | "crosses_above" | "crosses_below" | "equals";
  threshold: number;
  enabled: boolean;
  created_at: string;
}

export interface CreateAlertInput {
  name: string;
  company_id?: string;
  metric: string;
  condition: "above" | "below" | "crosses_above" | "crosses_below" | "equals";
  threshold: number;
}

export interface UpdateAlertInput {
  name?: string;
  threshold?: number;
  condition?: "above" | "below" | "crosses_above" | "crosses_below" | "equals";
  enabled?: boolean;
}

// --- Briefs ---

export interface BriefSummary {
  id: string;
  company_id: string;
  title: string;
  period: string;
  generated_at: string;
  scorecard?: Record<string, number>;
  strategy_score?: number;
}

export interface Brief extends BriefSummary {
  content: string;
  sections: Array<{ heading: string; body: string }>;
}

// --- Portfolio ---

export interface PortfolioAnalytics {
  portfolio_id: string;
  total_return: number | null;
  sharpe_ratio: number | null;
  sector_allocation: Record<string, number>;
  winners: Array<{ company_id: string; return: number }>;
  losers: Array<{ company_id: string; return: number }>;
  updated_at: string;
}

// --- Media ---

export interface MediaItem {
  id: string;
  company_id: string;
  type: "earnings_call" | "podcast" | "presentation" | "investor_day" | "press_release";
  title: string;
  published_at: string;
  status: "pending" | "processing" | "ready" | "failed";
  duration_seconds?: number;
  transcript_available: boolean;
}

export interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
}

// --- Gurus ---

export interface GuruHolding {
  company_id: string;
  ticker: string;
  shares: number;
  value: number;
  change_type: "new" | "increased" | "decreased" | "sold";
  change_shares: number;
  as_of: string;
}

// --- Markets ---

export interface Market {
  code: string;
  name: string;
  country: string;
  currency: string;
  mic: string;
}

// --- Error ---

export interface EquiVaultErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
    feature?: string;
    current_tier?: string;
    required_tier?: string;
    upgrade_url?: string;
    monthly_delta_cents?: number;
  };
}
