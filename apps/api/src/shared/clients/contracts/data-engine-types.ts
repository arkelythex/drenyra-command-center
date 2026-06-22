export interface DataEngineHealthResponse {
  status: "online" | "offline";
  service: string;
  version?: string;
  engine?: string;
}

export interface DataEngineSireResponse {
  status: "success" | "error";
  recordCount?: number;
  totalAmount?: number;
  totalIGV?: number;
  errors?: Array<{ line: number; field: string; message: string }>;
  warnings?: Array<{ line?: number; field?: string; message?: string }>;
}

export interface DataEngineCashflowAnalyzeResponse {
  status: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
  };
}

export interface DataEngineReconcileResponse {
  matched: Array<{
    bankIndex: number;
    systemIndex: number;
    confidence: number;
  }>;
  unmatched: {
    bank: number[];
    system: number[];
  };
}
