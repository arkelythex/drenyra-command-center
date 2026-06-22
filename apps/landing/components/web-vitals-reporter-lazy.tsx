"use client";

import { useEffect } from "react";
import { onCLS, onINP, onLCP, onTTFB } from "web-vitals";
import type { Metric } from "web-vitals";

import { analytics } from "@/lib/analytics";

function WebVitalsReporter(): null {
	useEffect(() => {
		const send = (metric: Metric): void => {
			analytics.trackWebVital(metric.name, metric.value, metric.rating);
		};
		onCLS(send);
		onINP(send);
		onLCP(send);
		onTTFB(send);
	}, []);

	return null;
}

export function WebVitalsReporterLazy() {
	return <WebVitalsReporter />;
}
