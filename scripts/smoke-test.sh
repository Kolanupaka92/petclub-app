#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  PETclub Deployment Smoke Test
#  Verifies both the Vercel frontend and Cloud Run backend are
#  reachable and returning healthy responses after each deploy.
#
#  Usage (local):   bash scripts/smoke-test.sh
#  Usage (CI):      called by .github/workflows/deploy.yml
#
#  Exit codes:
#    0 — all checks passed
#    1 — one or more checks failed
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-https://app.mypetclub.app}"
BACKEND_URL="${BACKEND_URL:-https://api.mypetclub.app}"
MAX_RETRIES=5
RETRY_DELAY=10   # seconds between retries (Vercel / Cloud Run cold start)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Colour

passed=0
failed=0

# ── Helper: retry curl with exponential-ish back-off ─────────────
check_url() {
  local label="$1"
  local url="$2"
  local expected_status="${3:-200}"
  local jq_check="${4:-}"   # optional jq expression to validate JSON body

  local attempt=0
  local status

  while [[ $attempt -lt $MAX_RETRIES ]]; do
    attempt=$((attempt + 1))
    echo -n "  [attempt $attempt/$MAX_RETRIES] $label ... "

    status=$(curl -s -o /tmp/smoke_body -w "%{http_code}" \
      --max-time 15 \
      --location \
      "$url" 2>/dev/null || echo "000")

    if [[ "$status" == "$expected_status" ]]; then
      # Optional: validate JSON body with jq
      if [[ -n "$jq_check" ]]; then
        local jq_result
        jq_result=$(jq -r "$jq_check" /tmp/smoke_body 2>/dev/null || echo "")
        if [[ "$jq_result" != "true" ]]; then
          echo -e "${YELLOW}HTTP $status but body check failed (got: $jq_result)${NC}"
          sleep $RETRY_DELAY
          continue
        fi
      fi
      echo -e "${GREEN}✓ HTTP $status${NC}"
      passed=$((passed + 1))
      return 0
    fi

    echo -e "${YELLOW}HTTP $status (expected $expected_status)${NC}"
    if [[ $attempt -lt $MAX_RETRIES ]]; then
      echo "    Retrying in ${RETRY_DELAY}s..."
      sleep $RETRY_DELAY
    fi
  done

  echo -e "  ${RED}✗ FAILED after $MAX_RETRIES attempts — $label ($url)${NC}"
  echo "    Last HTTP status: $status"
  if [[ -f /tmp/smoke_body ]]; then
    echo "    Response body: $(cat /tmp/smoke_body | head -c 500)"
  fi
  failed=$((failed + 1))
  return 1
}

# ── Smoke Tests ───────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
echo "  PETclub Deployment Smoke Test"
echo "  $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "═══════════════════════════════════════════"
echo ""

echo "── Frontend (Vercel) ───────────────────────"
# 1. Frontend index — must return 200 (SPA shell)
check_url "Frontend index" "$FRONTEND_URL" "200" || true

echo ""
echo "── Backend (Cloud Run) ─────────────────────"
# 2. Health endpoint — must return 200 with a non-null version field.
#    The status string is descriptive ("🐾 PETclub API running"), not "ok",
#    so we validate presence of the version key instead.
#    Auth-route probes are intentionally omitted: specific backend routes
#    depend on the Cloud Run deploy pipeline (separate from this frontend
#    workflow) and would cause false failures when backend is mid-deploy.
check_url "Backend /health" "$BACKEND_URL/api/health" "200" '.version != null' || true

echo ""
echo "═══════════════════════════════════════════"
if [[ $failed -eq 0 ]]; then
  echo -e "  ${GREEN}All $passed checks passed ✓${NC}"
  echo "═══════════════════════════════════════════"
  echo ""
  exit 0
else
  echo -e "  ${RED}$failed check(s) FAILED, $passed passed${NC}"
  echo "═══════════════════════════════════════════"
  echo ""
  exit 1
fi
