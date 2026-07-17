use chrono::{DateTime, NaiveDate, Utc};
use civictech_domain::ReportStatus;
use civictech_ingest::CsvExpenseRow;
use serde::Serialize;
use sqlx::{postgres::PgPoolOptions, PgPool, QueryBuilder, Row};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum PgAdapterError {
    #[error("database error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("invalid report status in database: {0}")]
    InvalidStatus(String),
}

#[derive(Clone)]
pub struct PgStore {
    pool: PgPool,
}

#[derive(Debug, Clone, Serialize)]
pub struct DatasetSummary {
    pub id: Uuid,
    pub name: String,
    pub versions: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExpenseRow {
    pub entity: String,
    pub category: String,
    pub amount: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReportRow {
    pub id: Uuid,
    pub status: String,
    pub category: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PublicReportRow {
    pub id: Uuid,
    pub public_text: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PublicationRow {
    pub id: Uuid,
    pub report_id: Uuid,
    pub public_text: String,
}

#[derive(Debug, Clone)]
pub struct AuditEventInput {
    pub actor_type: String,
    pub actor_id: Option<String>,
    pub action: String,
    pub target_type: String,
    pub target_id: Option<String>,
    pub metadata: serde_json::Value,
}

impl PgStore {
    pub async fn connect(database_url: &str) -> Result<Self, PgAdapterError> {
        let pool = PgPoolOptions::new()
            .max_connections(10)
            .connect(database_url)
            .await?;
        Ok(Self { pool })
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    pub async fn append_audit_event(&self, event: AuditEventInput) -> Result<(), PgAdapterError> {
        sqlx::query(
            r#"
            insert into audit_events
              (id, occurred_at, actor_type, actor_id, action, target_type, target_id, metadata)
            values
              ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(Utc::now())
        .bind(event.actor_type)
        .bind(event.actor_id)
        .bind(event.action)
        .bind(event.target_type)
        .bind(event.target_id)
        .bind(event.metadata)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn list_datasets(&self) -> Result<Vec<DatasetSummary>, PgAdapterError> {
        let rows = sqlx::query(
            r#"
            select
              ds.id,
              coalesce(ds.owner, 'Municipality source') as name,
              count(dv.id)::bigint as versions
            from dataset_sources ds
            left join dataset_versions dv on dv.source_id = ds.id
            group by ds.id, ds.owner
            order by max(dv.ingested_at) desc nulls last, ds.created_at desc
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|row| DatasetSummary {
                id: row.get("id"),
                name: row.get("name"),
                versions: row.get("versions"),
            })
            .collect())
    }

    pub async fn query_expenses(
        &self,
        entity: Option<&str>,
        category: Option<&str>,
    ) -> Result<Vec<ExpenseRow>, PgAdapterError> {
        let mut qb = QueryBuilder::new(
            "select entity, category, amount::float8 as amount from expense_records",
        );

        let mut has_where = false;
        if let Some(entity) = entity {
            qb.push(if has_where { " and " } else { " where " });
            has_where = true;
            qb.push("entity = ").push_bind(entity);
        }
        if let Some(category) = category {
            qb.push(if has_where { " and " } else { " where " });
            qb.push("category = ").push_bind(category);
        }

        qb.push(" order by occurred_on desc nulls last limit 200");

        let rows = qb.build().fetch_all(&self.pool).await?;

        Ok(rows
            .into_iter()
            .map(|row| ExpenseRow {
                entity: row.get("entity"),
                category: row.get("category"),
                amount: row.get("amount"),
            })
            .collect())
    }

    pub async fn create_report(
        &self,
        category: &str,
        description: &str,
    ) -> Result<ReportRow, PgAdapterError> {
        let id = Uuid::new_v4();
        sqlx::query(
            r#"
            insert into reports (id, status, category, description, created_at)
            values ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(id)
        .bind(ReportStatus::Draft.as_db_str())
        .bind(category)
        .bind(description)
        .bind(Utc::now())
        .execute(&self.pool)
        .await?;

        Ok(ReportRow {
            id,
            status: ReportStatus::Draft.as_db_str().to_string(),
            category: category.to_string(),
            description: description.to_string(),
        })
    }

    pub async fn report_status(
        &self,
        report_id: Uuid,
    ) -> Result<Option<ReportStatus>, PgAdapterError> {
        let row = sqlx::query("select status from reports where id = $1")
            .bind(report_id)
            .fetch_optional(&self.pool)
            .await?;

        let Some(row) = row else {
            return Ok(None);
        };

        let value: String = row.get("status");
        let status = ReportStatus::from_db_str(&value)
            .map_err(|_| PgAdapterError::InvalidStatus(value.clone()))?;

        Ok(Some(status))
    }

    pub async fn update_report_status(
        &self,
        report_id: Uuid,
        next: ReportStatus,
    ) -> Result<bool, PgAdapterError> {
        let result = sqlx::query("update reports set status = $2 where id = $1")
            .bind(report_id)
            .bind(next.as_db_str())
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() == 1)
    }

    pub async fn append_report_status_event(
        &self,
        report_id: Uuid,
        from_status: &str,
        to_status: &str,
        action: &str,
    ) -> Result<(), PgAdapterError> {
        sqlx::query(
            r#"
            insert into report_status_events (id, report_id, from_status, to_status, action, occurred_at)
            values ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(report_id)
        .bind(from_status)
        .bind(to_status)
        .bind(action)
        .bind(Utc::now())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn first_transition_to_status_at(
        &self,
        report_id: Uuid,
        to_status: &str,
    ) -> Result<Option<DateTime<Utc>>, PgAdapterError> {
        let row = sqlx::query(
            r#"
            select occurred_at
            from report_status_events
            where report_id = $1 and to_status = $2
            order by occurred_at asc
            limit 1
            "#,
        )
        .bind(report_id)
        .bind(to_status)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|r| r.get("occurred_at")))
    }

    pub async fn register_evidence(
        &self,
        report_id: Uuid,
        storage_ref: &str,
        sha256: &str,
    ) -> Result<Uuid, PgAdapterError> {
        let id = Uuid::new_v4();
        sqlx::query(
            r#"
            insert into evidence (id, report_id, storage_ref, sha256, uploaded_at)
            values ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(id)
        .bind(report_id)
        .bind(storage_ref)
        .bind(sha256)
        .bind(Utc::now())
        .execute(&self.pool)
        .await?;

        Ok(id)
    }

    pub async fn list_public_reports(&self) -> Result<Vec<PublicReportRow>, PgAdapterError> {
        let rows = sqlx::query(
            r#"
            select p.id as publication_id, p.public_text, r.status
            from publications p
            join reports r on r.id = p.report_id
            order by p.published_at desc
            limit 200
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|row| PublicReportRow {
                id: row.get("publication_id"),
                public_text: row.get("public_text"),
                status: row.get("status"),
            })
            .collect())
    }

    pub async fn create_publication(
        &self,
        report_id: Uuid,
        public_text: &str,
    ) -> Result<PublicationRow, PgAdapterError> {
        let publication_id = Uuid::new_v4();
        sqlx::query(
            r#"
            insert into publications (id, report_id, public_text, published_at)
            values ($1, $2, $3, $4)
            "#,
        )
        .bind(publication_id)
        .bind(report_id)
        .bind(public_text)
        .bind(Utc::now())
        .execute(&self.pool)
        .await?;

        Ok(PublicationRow {
            id: publication_id,
            report_id,
            public_text: public_text.to_string(),
        })
    }

    pub async fn ingest_expense_rows(
        &self,
        owner: &str,
        source_kind: &str,
        source_url: Option<&str>,
        checksum_sha256: &str,
        rows: &[CsvExpenseRow],
    ) -> Result<Uuid, PgAdapterError> {
        let mut tx = self.pool.begin().await?;
        let source_id = Uuid::new_v4();
        let version_id = Uuid::new_v4();

        sqlx::query(
            r#"
            insert into dataset_sources (id, kind, url, owner, license, created_at)
            values ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(source_id)
        .bind(source_kind)
        .bind(source_url)
        .bind(owner)
        .bind("open")
        .bind(Utc::now())
        .execute(tx.as_mut())
        .await?;

        sqlx::query(
            r#"
            insert into dataset_versions (id, source_id, checksum_sha256, ingested_at)
            values ($1, $2, $3, $4)
            "#,
        )
        .bind(version_id)
        .bind(source_id)
        .bind(checksum_sha256)
        .bind(Utc::now())
        .execute(tx.as_mut())
        .await?;

        for row in rows {
            let occurred_on = row
                .occurred_on
                .as_ref()
                .and_then(|value| NaiveDate::parse_from_str(value, "%Y-%m-%d").ok());

            sqlx::query(
                r#"
                insert into expense_records (id, version_id, entity, category, amount, occurred_on, doc_ref)
                values ($1, $2, $3, $4, $5, $6, $7)
                "#,
            )
            .bind(Uuid::new_v4())
            .bind(version_id)
            .bind(&row.entity)
            .bind(&row.category)
            .bind(row.amount)
            .bind(occurred_on)
            .bind(&row.doc_ref)
            .execute(tx.as_mut())
            .await?;
        }

        tx.commit().await?;
        Ok(version_id)
    }
}
