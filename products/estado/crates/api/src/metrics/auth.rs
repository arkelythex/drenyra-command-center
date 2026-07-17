use prometheus::{IntCounterVec, Opts, Registry};

pub struct AuthMetrics {
    decisions_total: IntCounterVec,
}

impl AuthMetrics {
    pub fn register(registry: &Registry) -> Result<Self, prometheus::Error> {
        let decisions_total = IntCounterVec::new(
            Opts::new(
                "civictech_auth_decisions_total",
                "Authentication/authorization decisions",
            ),
            &["decision", "endpoint"],
        )?;
        registry.register(Box::new(decisions_total.clone()))?;

        Ok(Self { decisions_total })
    }

    pub fn observe_decision(&self, decision: &str, endpoint: &str) {
        self.decisions_total
            .with_label_values(&[decision, endpoint])
            .inc();
    }
}
