# @arkelythex/rust-core

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

Primitivas fiscales Rust en hot-path para ARKELYTHEX — cálculos críticos de rendimiento que necesitan velocidad nativa.

## Estado actual

Este paquete es una **fundación Phase 2**. **No** está conectado al código runtime todavía.
La implementación TypeScript de dominio sigue siendo la fuente de verdad hasta que el puente Rust/WASM tenga paridad total, wrappers tipados, comportamiento de fallback y cobertura en CI.

### Ya implementado

- ✅ Validación RUC SUNAT (Módulo 11) — paridad con la implementación TypeScript

### Próximos pasos

- 🔲 IGV y detracciones SPOT con aritmética decimal/cents-safe
- 🔲 Target de build `wasm-pack`
- 🔲 Wrapper TypeScript con fallback obligatorio a `@arkelythex/domain`
- 🔲 APIs batch para reducir overhead del boundary JS/WASM

## ¿Por qué Rust?

| Aspecto | TypeScript | Rust/WASM |
|---------|------------|-----------|
| Velocidad de cálculo | 1x | ~10-50x |
| Precisión decimal | Número con bibliotecas | Tipos nativos |
| Overhead de FFI | N/A | ∼0.1ms por llamada |
| Bundle size | ∼5KB gzip | ∼50KB wasm gzip |

La estrategia es: **TypeScript por defecto, WASM cuando el perfilado lo justifique**. Siempre con fallback obligatorio a la implementación TS.

## Verification

```bash
cargo test
```
