export interface MetricValue {
	value: number;
	timestamp: number;
	labels: Record<string, string>;
}

export interface CounterMetric {
	name: string;
	help: string;
	type: "counter";
	values: MetricValue[];
}

export interface GaugeMetric {
	name: string;
	help: string;
	type: "gauge";
	values: MetricValue[];
}

export interface HistogramMetric {
	name: string;
	help: string;
	type: "histogram";
	buckets: number[];
	values: Array<{
		value: number;
		timestamp: number;
		labels: Record<string, string>;
		bucket: string;
	}>;
}

export type Metric = CounterMetric | GaugeMetric | HistogramMetric;

export type HistogramMetricValue = HistogramMetric["values"][number];
