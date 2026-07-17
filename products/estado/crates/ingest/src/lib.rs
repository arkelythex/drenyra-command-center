use csv::ReaderBuilder;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{fs, path::Path};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum IngestError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("csv error: {0}")]
    Csv(#[from] csv::Error),
}

#[derive(Debug, Clone, Deserialize)]
pub struct CsvExpenseRow {
    pub entity: String,
    pub category: String,
    pub amount: f64,
    pub occurred_on: Option<String>,
    pub doc_ref: Option<String>,
}

pub fn checksum_sha256(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    hex::encode(digest)
}

pub fn parse_expense_csv(content: &str) -> Result<Vec<CsvExpenseRow>, IngestError> {
    let mut reader = ReaderBuilder::new()
        .trim(csv::Trim::All)
        .from_reader(content.as_bytes());

    let mut rows = Vec::new();
    for row in reader.deserialize() {
        rows.push(row?);
    }

    Ok(rows)
}

pub fn load_csv_with_checksum(path: &Path) -> Result<(String, Vec<CsvExpenseRow>), IngestError> {
    let bytes = fs::read(path)?;
    let checksum = checksum_sha256(&bytes);
    let rows = parse_expense_csv(&String::from_utf8_lossy(&bytes))?;
    Ok((checksum, rows))
}

#[cfg(test)]
mod tests {
    use super::{checksum_sha256, parse_expense_csv};

    #[test]
    fn checksum_is_stable() {
        let checksum = checksum_sha256(b"demo");
        assert_eq!(checksum.len(), 64);
    }

    #[test]
    fn parses_demo_csv() {
        let csv = "entity,category,amount,occurred_on,doc_ref\nMunicipio Demo,OBRAS,1200.5,2026-01-01,DOC-1\n";
        let rows = parse_expense_csv(csv).expect("csv should parse");
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].entity, "Municipio Demo");
    }
}
