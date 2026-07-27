use tauri::Manager;

/// Drenyra Desktop — thin Tauri 2 shell.
///
/// Architecture: the web SPA (TanStack Start) is the full application.
/// Tauri adds: system tray, multi-window, native notifications,
/// local certificate loading, Drenyra Bridge file access.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // System tray — optional, ignore if not configured
            if let Some(_tray) = app.tray_by_id("main") {
                // tray exists
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Drenyra desktop");
}
