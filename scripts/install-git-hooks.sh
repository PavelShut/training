#!/bin/sh
# Install repository git hooks by configuring core.hooksPath
git config core.hooksPath .githooks
# Ensure hooks are executable on Unix-like systems
chmod +x .githooks/pre-commit || true
echo "Installed git hooks (core.hooksPath set to .githooks)"
