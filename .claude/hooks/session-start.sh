#!/bin/bash
# SessionStart hook: install dependencies so linting, type-checking, and builds
# work immediately in Claude Code on the web sessions.
set -euo pipefail

# Only run in the remote (web) environment; local users manage their own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# npm install (not ci) so the cached container layer is reused across sessions.
# Idempotent and non-interactive.
npm install --no-audit --no-fund
