#!/usr/bin/env pwsh
# PowerShell pre-commit hook for Windows (Git for Windows / PowerShell)
try {
  if (Get-Command node -ErrorAction SilentlyContinue) {
    node tools/cartographer.js analyze --out docs --depth 4 | Out-Default
    git add docs/project-map.html docs/project-summary.json docs/project-summary.md
  }
} catch {
}
exit 0

