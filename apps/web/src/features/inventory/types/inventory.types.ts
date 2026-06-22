export interface Movement {
  id: string;
  type: 'IN' | 'OUT';
  item: string;
  qty: string;
  cost: string;
  total: string;
  date: string;
  user: string;
}

export interface Prediction {
  item: string;
  status: 'Critical' | 'Warning' | 'Stable';
  days: number;
  usage: 'High' | 'Medium' | 'Low';
  action: string;
}

export interface CostMetric {
  label: string;
  value: number; // Percentage 0-100
  color?: string;
}
