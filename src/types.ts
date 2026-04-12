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
