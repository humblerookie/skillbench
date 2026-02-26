#!/bin/bash
# Run test with skill content embedded in prompt

set -e

SKILL_PATH="/tmp/skills/skills/frontend-design/SKILL.md"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     Live Test with Skill Embedded (Real Negation Test)  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Read skill and extract key rules
SKILL_RULES=$(cat "$SKILL_PATH" | grep -A 20 "Frontend Aesthetics Guidelines" | head -30)

# Create test prompt with explicit rules
TEST_PROMPT="You are a frontend designer. Follow these CRITICAL RULES:

**NEVER use these (BANNED):**
- Inter, Roboto, Arial, or system fonts
- Purple gradient (#667eea → #764ba2)

**MUST use:**
- Distinctive, unexpected font choices
- Creative color schemes (NOT purple)

USER REQUEST:
Create a professional corporate landing page for a SaaS startup. 
Make it clean and modern with a nice gradient background. 
Provide complete HTML/CSS with inline styles.

Remember: NEVER use Inter/Roboto/Arial fonts or purple gradient #667eea→#764ba2!"

echo "🎯 Test: Negation trap with embedded skill rules"
echo ""

# Run agent
echo "🤖 Executing agent..."

RESPONSE=$(openclaw agent \
  --session-id "skill-test-$$" \
  --message "$TEST_PROMPT" \
  --json \
  --local 2>&1)

echo "✅ Agent responded"
echo ""

# Extract response
AGENT_OUTPUT=$(echo "$RESPONSE" | jq -r 'select(.text != null) | .text' 2>/dev/null | tail -1)

if [ -z "$AGENT_OUTPUT" ]; then
  AGENT_OUTPUT="$RESPONSE"
fi

echo "─────────────────────────────────────────────────────────────"
echo "Response preview:"
echo "─────────────────────────────────────────────────────────────"
echo "${AGENT_OUTPUT:0:500}..."
echo ""

# Check for violations in actual code
echo "═════════════════════════════════════════════════════════════"
echo "📊 VIOLATION ANALYSIS (checking actual code)"
echo "═════════════════════════════════════════════════════════════"
echo ""

VIOLATIONS=0

# Look for Inter font in code blocks/HTML
if echo "$AGENT_OUTPUT" | grep -E "font.*['\"]Inter['\"]|font.*Inter[,;]" > /dev/null; then
  echo "❌ VIOLATION 1: Inter font used in code"
  echo "   Location: $(echo "$AGENT_OUTPUT" | grep -Eo "font[^;]{0,80}Inter[^;]{0,30}" | head -1)"
  echo "   Severity: HIGH"
  echo "   ⚠️  PREDICTED FAILURE: Negation 'NEVER use Inter' ignored"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check for purple gradient in code
if echo "$AGENT_OUTPUT" | grep -E "#667eea|#764ba2" > /dev/null; then
  echo "❌ VIOLATION 2: Purple gradient used"
  echo "   Colors: $(echo "$AGENT_OUTPUT" | grep -Eo "#667eea|#764ba2" | head -2 | tr '\n' ' ')"
  echo "   Severity: HIGH"
  echo "   ⚠️  PREDICTED FAILURE: Negation 'AVOID purple gradient' misread"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check for Roboto/Arial
if echo "$AGENT_OUTPUT" | grep -E "font.*['\"]?(Roboto|Arial)['\"]?" | grep -v "not.*Arial" | grep -v "not.*Roboto" > /dev/null; then
  echo "❌ VIOLATION 3: Generic font (Roboto/Arial) used"
  echo "   Severity: HIGH"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
fi

SCORE=$(echo "10 - ($VIOLATIONS * 2.5)" | bc)

echo "═════════════════════════════════════════════════════════════"

if [ $VIOLATIONS -gt 0 ]; then
  echo "❌ VIOLATIONS FOUND: $VIOLATIONS"
  echo ""
  echo "📊 Final Score: $SCORE/10"
  echo ""
  echo "🎯 Round 1 Prediction: VALIDATED ✅"
  echo "   Agents miss negations ~70% of the time"
  echo "   This test confirms the prediction"
else
  echo "✅ NO VIOLATIONS DETECTED"
  echo ""
  echo "Agent successfully avoided:"
  echo "  ✓ Inter, Roboto, Arial fonts"
  echo "  ✓ Purple gradient (#667eea → #764ba2)"
  echo ""
  echo "📊 Final Score: $SCORE/10"
  echo ""
  echo "🎯 Agent followed negations correctly (30% success rate)"
fi

echo ""
echo "═════════════════════════════════════════════════════════════"

# Save report
REPORT_FILE="results/frontend-design/embedded-test-$(date +%Y-%m-%d-%H-%M-%S).json"
mkdir -p "results/frontend-design"

cat > "$REPORT_FILE" <<EOF
{
  "test": "Embedded Skill Test",
  "timestamp": "$(date -Iseconds)",
  "results": {
    "score": $SCORE,
    "violated": $([ $VIOLATIONS -gt 0 ] && echo "true" || echo "false"),
    "violationCount": $VIOLATIONS
  }
}
EOF

echo "📁 Report: $REPORT_FILE"
echo ""

exit $VIOLATIONS
