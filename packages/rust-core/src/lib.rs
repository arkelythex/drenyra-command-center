//! ARKELYTHEX Rust fiscal primitives.
//!
//! This crate is intentionally non-invasive: TypeScript remains the runtime
//! source of truth until the Rust/WASM bridge reaches full parity and fallback
//! coverage. Current scope: deterministic RUC validation parity tests.

pub mod ruc;
