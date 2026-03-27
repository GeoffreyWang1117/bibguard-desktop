# bibguard Desktop

[![Release](https://img.shields.io/github/v/release/GeoffreyWang1117/bibguard-desktop)](https://github.com/GeoffreyWang1117/bibguard-desktop/releases)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

**Cross-platform desktop app for detecting hallucinated citations in academic papers.**

No Python, no terminal, no dependencies — just double-click and verify.

## Download

Go to [Releases](https://github.com/GeoffreyWang1117/bibguard-desktop/releases) and download for your platform:

| Platform | File |
|----------|------|
| **Windows** | `.msi` installer |
| **macOS (Apple Silicon)** | `.dmg` |
| **macOS (Intel)** | `.dmg` |
| **Linux** | `.deb` / `.AppImage` |

## Usage

1. Open bibguard
2. Drag and drop your `.bib` file (or click to browse)
3. Click **Verify** — watch real-time progress
4. Review results: click any entry for detailed checks
5. **Export Report** to Markdown

## Features

- **5-source verification**: arXiv, Crossref, DBLP, Semantic Scholar, OpenAlex
- **Phantom ID detection**: Valid-format DOI/arXiv that doesn't resolve = hallucination signal
- **Kill-shot logic**: Phantom IDs cannot be overridden by similar search results
- **Type-aware**: `@misc`/`@online` entries won't false-alarm as hallucinated
- **Real-time progress**: See each entry verified as it happens
- **Filter & detail view**: Filter by OK/WARN/FAIL, click for field-level checks
- **Report export**: One-click Markdown report with full details

## How it works

The app bundles the [bibguard](https://github.com/GeoffreyWang1117/bibguard) TypeScript verification engine (zero dependencies, 621 LOC) inside a native [Tauri](https://tauri.app) shell. All API queries run directly from your machine — no proxy, no server, no data leaves your control.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Shell | Tauri v2 (Rust) — ~10MB binary |
| Frontend | Vanilla TypeScript + Vite |
| Engine | bibguard-js (zero deps, 5-source cascade) |
| Build | GitHub Actions (Windows, macOS, Linux) |

## Build from source

```bash
# Prerequisites: Rust, Node.js 18+, platform-specific libs
# See https://tauri.app/start/prerequisites/

git clone https://github.com/GeoffreyWang1117/bibguard-desktop.git
cd bibguard-desktop
npm install
npm run tauri build
```

## Related

- [bibguard](https://github.com/GeoffreyWang1117/bibguard) — CLI + Python API
- [bibguard-js](https://github.com/GeoffreyWang1117/bibguard-js) — TypeScript engine (zero deps)
- [bibguard-ext](https://github.com/GeoffreyWang1117/bibguard-ext) — Browser extension
- [IntegriRef](https://github.com/GeoffreyWang1117/IntegriRef) — Full L0-L4 verification with semantic NLI

## License

Apache License 2.0. See [LICENSE](LICENSE) for details.
