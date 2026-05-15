# PowerShell install script for git hooks
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
git config core.hooksPath .githooks
Write-Output "Installed git hooks (core.hooksPath set to .githooks)"
