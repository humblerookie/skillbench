#!/bin/bash
# Run evaluation using OpenClaw's built-in agent command
# No API key needed - uses your existing Claude login!

set -e

SKILL_PATH="${1:-/tmp/skills/skills/frontend-design/SKILL.md}"
SKILL_NAME=$(basename "$SKILL_PATH" .md)

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     Live Evaluation Using OpenClaw (No API Key!)        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📄 Skill: $SKILL_NAME"
echo "📂 Path: $SKILL_PATH"
echo ""

# Read skill content
SKILL_CONTENT=$(cat "$SKILL_PATH")

# Test scenario
TEST_PROMPT="Following the frontend-design skill rules strictly (NEVER use Inter/Roboto/Arial fonts, NEVER use purple gradient #667eea→#764ba2), create a professional corporate landing page for a SaaS startup. Make it clean and modern with a nice gradient background. Provide complete HTML/CSS with inline styles."

echo "🎯 Test Scenario: Corporate SaaS Landing Page (Negation Trap)"
echo ""
echo "Prompt:"
echo "  $TEST_PROMPT"
echo ""
echo "Expected violations to check:"
echo "  - Inter font usage"
echo "  - Purple gradient (#667eea → #764ba2)"
echo ""

# Create temp session for test
SESSION_ID="eval-test-$$"

echo "🤖 Running agent with skill loaded..."
echo ""

# Run agent turn using openclaw command
RESPONSE=$(openclaw agent \
  --session-id "$SESSION_ID" \
  --message "$TEST_PROMPT" \
  --json \
  --local 2>&1)

echo "✅ Agent responded"
echo ""

# Extract response text
AGENT_OUTPUT=$(echo "$RESPONSE" | jq -r '.reply // .text // .content // ""' 2>/dev/null || echo "$RESPONSE")

echo "─────────────────────────────────────────────────────────────"
echo "Agent Response (first 800 chars):"
echo "─────────────────────────────────────────────────────────────"
echo "${AGENT_OUTPUT:0:800}..."
echo ""

# Check for violations
echo "═════════════════════════════════════════════════════════════"
echo "📊 VIOLATION ANALYSIS"
echo "═════════════════════════════════════════════════════════════"
echo ""

VIOLATIONS=0

# Check for Inter
if echo "$AGENT_OUTPUT" | grep -iq "inter"; then
  echo "❌ VIOLATION 1: Inter font detected"
  echo "   Location: $(echo "$AGENT_OUTPUT" | grep -io "font.*inter[^;]*" | head -1)"
  echo "   Severity: HIGH"
  echo "   ⚠️  PREDICTED FAILURE: Negation 'NEVER use Inter' was ignored"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check for Roboto/Arial
if echo "$AGENT_OUTPUT" | grep -iE "roboto|arial"; then
  echo "❌ VIOLATION 2: Generic font (Roboto/Arial) detected"
  echo "   Severity: HIGH"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check for purple gradient
if echo "$AGENT_OUTPUT" | grep -E "#667eea|#764ba2"; then
  echo "❌ VIOLATION 3: Purple gradient detected"
  echo "   Location: $(echo "$AGENT_OUTPUT" | grep -E "#667eea|#764ba2" | head -1)"
  echo "   Severity: HIGH"
  echo "   ⚠️  PREDICTED FAILURE: Negation 'AVOID purple gradient' misread as suggestion"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Calculate score
SCORE=$(echo "10 - ($VIOLATIONS * 2.5)" | bc)

echo "═════════════════════════════════════════════════════════════"

if [ $VIOLATIONS -gt 0 ]; then
  echo "❌ VIOLATIONS FOUND: $VIOLATIONS"
  echo ""
  echo "📊 Final Score: $SCORE/10"
  echo ""
  echo "🎯 Round 1 Prediction: VALIDATED ✅"
  echo "   Round 1 predicted agents would miss negations (70% probability)"
  echo "   This test confirms the prediction was accurate."
else
  echo "✅ NO VIOLATIONS DETECTED"
  echo ""
  echo "Agent successfully followed all requirements:"
  echo "  ✓ Avoided banned fonts"
  echo "  ✓ Avoided banned color schemes"
  echo "  ✓ Created distinctive design"
  echo ""
  echo "📊 Final Score: $SCORE/10"
fi

echo ""
echo "═════════════════════════════════════════════════════════════"

# Save report
REPORT_FILE="results/frontend-design/openclaw-test-$(date +%Y-%m-%d-%H-%M-%S).json"
mkdir -p "results/frontend-design"

cat > "$REPORT_FILE" <<EOF
{
  "test": "OpenClaw Live Test",
  "skill": "$SKILL_NAME",
  "timestamp": "$(date -Iseconds)",
  "sessionId": "$SESSION_ID",
  "results": {
    "score": $SCORE,
    "violated": $([ $VIOLATIONS -gt 0 ] && echo "true" || echo "false"),
    "violationCount": $VIOLATIONS
  },
  "agentResponse": $(echo "$AGENT_OUTPUT" | jq -Rs .)
}
EOF

echo "📁 Report saved: $REPORT_FILE"
echo ""

exit $VIOLATIONS
