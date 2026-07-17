use prometheus::{HistogramOpts, HistogramVec, IntCounter, IntCounterVec, Opts, Registry};

pub struct DomainMetrics {
    report_transition_total: IntCounterVec,
    report_workflows_completed_total: IntCounterVec,
    ingest_runs_total: IntCounterVec,
    ingest_rows_total: IntCounter,
    ingest_duration_seconds: HistogramVec,
    report_resolution_seconds: HistogramVec,
}

impl DomainMetrics {
    pub fn register(registry: &Registry) -> Result<Self, prometheus::Error> {
        let report_transition_total = IntCounterVec::new(
            Opts::new(
                "civictech_report_transition_total",
                "Report workflow transitions by from/to status and action",
            ),
            &["from_status", "to_status", "action"],
        )?;
        registry.register(Box::new(report_transition_total.clone()))?;

        let report_workflows_completed_total = IntCounterVec::new(
            Opts::new(
                "civictech_report_workflows_completed_total",
                "Completed report workflows by outcome",
            ),
            &["outcome"],
        )?;
        registry.register(Box::new(report_workflows_completed_total.clone()))?;

        let ingest_runs_total = IntCounterVec::new(
            Opts::new(
                "civictech_ingest_runs_total",
                "Ingest runs executed by result",
            ),
            &["result"],
        )?;
        registry.register(Box::new(ingest_runs_total.clone()))?;

        let ingest_rows_total = IntCounter::new(
            "civictech_ingest_rows_total",
            "Total rows ingested successfully",
        )?;
        registry.register(Box::new(ingest_rows_total.clone()))?;

        let ingest_duration_seconds = HistogramVec::new(
            HistogramOpts::new(
                "civictech_ingest_duration_seconds",
                "Ingest execution time in seconds by result",
            ),
            &["result"],
        )?;
        registry.register(Box::new(ingest_duration_seconds.clone()))?;

        let report_resolution_seconds = HistogramVec::new(
            HistogramOpts::new(
                "civictech_report_resolution_seconds",
                "Time from SUBMITTED to terminal outcome in seconds",
            ),
            &["outcome"],
        )?;
        registry.register(Box::new(report_resolution_seconds.clone()))?;

        Ok(Self {
            report_transition_total,
            report_workflows_completed_total,
            ingest_runs_total,
            ingest_rows_total,
            ingest_duration_seconds,
            report_resolution_seconds,
        })
    }

    pub fn observe_report_transition(&self, from_status: &str, to_status: &str, action: &str) {
        self.report_transition_total
            .with_label_values(&[from_status, to_status, action])
            .inc();
    }

    pub fn observe_workflow_outcome(&self, outcome: &str) {
        self.report_workflows_completed_total
            .with_label_values(&[outcome])
            .inc();
    }

    pub fn observe_ingest_success(&self, rows_ingested: u64, duration_seconds: f64) {
        self.ingest_runs_total.with_label_values(&["success"]).inc();
        self.ingest_rows_total.inc_by(rows_ingested);
        self.ingest_duration_seconds
            .with_label_values(&["success"])
            .observe(duration_seconds);
    }

    pub fn observe_ingest_failure(&self, duration_seconds: f64) {
        self.ingest_runs_total.with_label_values(&["failure"]).inc();
        self.ingest_duration_seconds
            .with_label_values(&["failure"])
            .observe(duration_seconds);
    }

    pub fn observe_report_resolution(&self, outcome: &str, duration_seconds: f64) {
        self.report_resolution_seconds
            .with_label_values(&[outcome])
            .observe(duration_seconds);
    }
}
