use anyhow::{Context, Result};
use aws_config::BehaviorVersion;
use aws_sdk_s3::{
    config::{Builder as S3ConfigBuilder, Credentials, Region},
    presigning::PresigningConfig,
    Client,
};
use std::{env, time::Duration};
use uuid::Uuid;

#[derive(Clone)]
pub struct S3EvidenceStore {
    client: Client,
    bucket: String,
    expires_in: Duration,
}

#[derive(Debug, Clone)]
pub struct PresignedUpload {
    pub object_key: String,
    pub upload_url: String,
    pub expires_in_seconds: u64,
}

impl S3EvidenceStore {
    pub async fn from_env() -> Result<Self> {
        let endpoint =
            env::var("S3_ENDPOINT").unwrap_or_else(|_| "http://localhost:9000".to_string());
        let region = env::var("S3_REGION").unwrap_or_else(|_| "us-east-1".to_string());
        let access_key = env::var("S3_ACCESS_KEY").unwrap_or_else(|_| "minio".to_string());
        let secret_key = env::var("S3_SECRET_KEY").unwrap_or_else(|_| "minio12345".to_string());
        let bucket = env::var("S3_EVIDENCE_BUCKET").unwrap_or_else(|_| "evidence".to_string());
        let expires_in_seconds = env::var("S3_PRESIGN_EXPIRES_SECONDS")
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(900);

        let shared = aws_config::defaults(BehaviorVersion::latest())
            .region(Region::new(region.clone()))
            .endpoint_url(endpoint)
            .credentials_provider(Credentials::new(
                access_key,
                secret_key,
                None,
                None,
                "local-minio",
            ))
            .load()
            .await;

        let s3_config = S3ConfigBuilder::from(&shared)
            .force_path_style(true)
            .region(Region::new(region))
            .build();

        let client = Client::from_conf(s3_config);

        Ok(Self {
            client,
            bucket,
            expires_in: Duration::from_secs(expires_in_seconds),
        })
    }

    pub async fn presign_put_for_report(
        &self,
        report_id: Uuid,
        content_type: Option<&str>,
    ) -> Result<PresignedUpload> {
        let object_key = format!("reports/{}/{}.bin", report_id, Uuid::new_v4());

        let mut request = self
            .client
            .put_object()
            .bucket(&self.bucket)
            .key(&object_key);

        if let Some(content_type) = content_type {
            request = request.content_type(content_type);
        }

        let presigned = request
            .presigned(
                PresigningConfig::expires_in(self.expires_in)
                    .context("invalid presign expiration window")?,
            )
            .await
            .context("failed to generate presigned upload URL")?;

        Ok(PresignedUpload {
            object_key,
            upload_url: presigned.uri().to_string(),
            expires_in_seconds: self.expires_in.as_secs(),
        })
    }

    pub fn storage_ref(&self, object_key: &str) -> String {
        format!("s3://{}/{}", self.bucket, object_key)
    }
}
