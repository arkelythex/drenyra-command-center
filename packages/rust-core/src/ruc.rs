//! SUNAT RUC validation using modulo 11.
//!
//! Supported prefixes mirror the current TypeScript domain value object:
//! `10`, `15`, `16`, `17`, and `20`.

const RUC_LENGTH: usize = 11;
const CHECKSUM_WEIGHTS: [u32; 10] = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
const ALLOWED_PREFIXES: [&str; 5] = ["10", "15", "16", "17", "20"];

/// Returns true when `ruc` has a supported prefix, 11 numeric digits, and a
/// valid SUNAT modulo 11 check digit.
#[must_use]
pub fn validate_ruc(ruc: &str) -> bool {
    let ruc = ruc.trim();

    if ruc.len() != RUC_LENGTH || !ruc.as_bytes().iter().all(u8::is_ascii_digit) {
        return false;
    }

    if !ALLOWED_PREFIXES.iter().any(|prefix| ruc.starts_with(prefix)) {
        return false;
    }

    checksum_digit(ruc).is_some_and(|expected| {
        ruc.as_bytes()[10]
            .checked_sub(b'0')
            .is_some_and(|actual| u32::from(actual) == expected)
    })
}

/// Calculates the expected modulo 11 check digit for an 11-digit RUC candidate.
///
/// Returns `None` when the value is not 11 numeric digits.
#[must_use]
pub fn checksum_digit(ruc: &str) -> Option<u32> {
    let ruc = ruc.trim();

    if ruc.len() != RUC_LENGTH || !ruc.as_bytes().iter().all(u8::is_ascii_digit) {
        return None;
    }

    let sum: u32 = ruc
        .as_bytes()
        .iter()
        .take(10)
        .zip(CHECKSUM_WEIGHTS)
        .map(|(digit, weight)| u32::from(digit - b'0') * weight)
        .sum();

    let remainder = sum % 11;
    let check_digit = 11 - remainder;

    Some(match check_digit {
        10 => 0,
        11 => 1,
        digit => digit,
    })
}

#[cfg(test)]
mod tests {
    use super::{checksum_digit, validate_ruc};

    #[test]
    fn validates_known_person_and_company_rucs() {
        let valid_rucs = [
            "10123456781",
            "10123456799",
            "15123456782",
            "16123456789",
            "17123456785",
            "20100070970",
            "20100130204",
        ];

        for ruc in valid_rucs {
            assert!(validate_ruc(ruc), "expected valid RUC: {ruc}");
        }
    }

    #[test]
    fn rejects_invalid_checksum_length_and_non_numeric_values() {
        let invalid_rucs = [
            "10123456780",
            "20100070971",
            "2010007097",
            "201000709700",
            "20100070A70",
            "",
        ];

        for ruc in invalid_rucs {
            assert!(!validate_ruc(ruc), "expected invalid RUC: {ruc}");
        }
    }

    #[test]
    fn rejects_unsupported_prefix_even_with_valid_checksum() {
        assert!(!validate_ruc("00000000001"));
    }

    #[test]
    fn trims_input_before_validation() {
        assert!(validate_ruc(" 20100070970 "));
    }

    #[test]
    fn supports_check_digit_zero_edge_case() {
        assert_eq!(checksum_digit("10000000090"), Some(0));
        assert!(validate_ruc("10000000090"));
    }

    #[test]
    fn returns_none_for_non_candidates() {
        assert_eq!(checksum_digit("2010007097"), None);
        assert_eq!(checksum_digit("20100070A70"), None);
    }
}
