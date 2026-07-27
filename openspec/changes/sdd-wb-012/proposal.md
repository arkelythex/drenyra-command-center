# SDD-WB-012 — Desktop Shell (Tauri 2)

**Wave:** D (Continuous Operations)
**Status:** 🎯 planned

Tauri 2 desktop shell for native integration: system tray, multi-window, local certificates, Drenyra Bridge, background sync, secure storage.

**Approach:** Reuse web UI. Tauri is a thin shell wrapping the TanStack Start SPA. No second UI implementation.

**Key integrations:**

- System tray with attention inbox count
- Multi-window support (popout panes)
- Local certificate management for SUNAT SOL
- Drenyra Bridge for local file access
- Secure credential storage
- Background sync with online/offline detection
