use axum::http::StatusCode;
use prometheus::{HistogramOpts, HistogramVec, IntCounterVec, Opts, Registry};

pub struct HttpMetrics {
    requests_total: IntCounterVec,
    request_duration_seconds: HistogramVec,
}

impl HttpMetrics {
    pub fn register(registry: &Registry) -> Result<Self, prometheus::Error> {
        let requests_total = IntCounterVec::new(
            Opts::new(
                "civictech_http_requests_total",
                "Total HTTP requests served",
            ),
            &["method", "route", "status"],
        )?;
        registry.register(Box::new(requests_total.clone()))?;

        let request_duration_seconds = HistogramVec::new(
            HistogramOpts::new(
                "civictech_http_request_duration_seconds",
                "HTTP request latency in seconds",
            ),
            &["method", "route"],
        )?;
        registry.register(Box::new(request_duration_seconds.clone()))?;

        Ok(Self {
            requests_total,
            request_duration_seconds,
        })
    }

    pub fn observe(&self, method: &str, route: &str, status: StatusCode, duration_seconds: f64) {
        self.requests_total
            .with_label_values(&[method, route, status.as_str()])
            .inc();
        self.request_duration_seconds
            .with_label_values(&[method, route])
            .observe(duration_seconds);
    }
}
