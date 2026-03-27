use std::fs;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
async fn save_report(app: tauri::AppHandle, content: String) -> Result<(), String> {
    let file_path = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md"])
        .add_filter("All Files", &["*"])
        .set_file_name("bibguard-report.md")
        .blocking_save_file();

    match file_path {
        Some(path) => {
            fs::write(path.as_path().unwrap(), &content)
                .map_err(|e| format!("Failed to save: {}", e))
        }
        None => Err("Cancelled".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_file, save_report])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
