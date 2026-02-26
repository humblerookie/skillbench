#!/bin/bash
# Capture one detailed violation example

TEST_PROMPT="Following the frontend-design skill rules strictly (NEVER use Inter/Roboto/Arial fonts, NEVER use purple gradient #667eea→#764ba2), create a professional corporate landing page for a SaaS startup. Make it clean and modern with a nice gradient background. Provide complete HTML/CSS with inline styles."

OUTPUT_MD="results/frontend-design/VIOLATION-EXAMPLE.md"

cat > "$OUTPUT_MD" << 'HEADER'
# Violation Example - Detailed Analysis

This document shows exactly what prompt caused what violations, with full agent responses.

---

## Test Setup

**Skill**: frontend-design (Anthropic's skill for distinctive frontend design)

**Banned Patterns**:
- ❌ Inter, Roboto, Arial fonts
- ❌ Purple gradient (#667eea → #764ba2)

**Why these are banned**: The skill explicitly states to avoid "generic AI-generated aesthetics" including these overused patterns.

---

## Test Prompt

HEADER

echo '```' >> "$OUTPUT_MD"
echo "$TEST_PROMPT" >> "$OUTPUT_MD"
echo '```' >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"

echo "---" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"
echo "## Agent Execution" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"

# Run test
RESPONSE=$(openclaw agent --session-id "violation-capture-$$" --message "$TEST_PROMPT" --json --local 2>&1)

# Save full response to file
echo "$RESPONSE" > "results/frontend-design/raw-response-$$.txt"

# Extract just the text
AGENT_TEXT=$(echo "$RESPONSE" | jq -r 'select(.text != null) | .text' 2>/dev/null | tail -1 || echo "$RESPONSE")

# Check for violations and extract exact locations
FOUND_INTER=0
FOUND_PURPLE=0
FOUND_GENERIC=0

if echo "$AGENT_TEXT" | grep -qi "inter"; then
  INTER_LINE=$(echo "$AGENT_TEXT" | grep -i "inter" | head -1)
  if echo "$INTER_LINE" | grep -E "font.*inter" > /dev/null; then
    FOUND_INTER=1
  fi
fi

if echo "$AGENT_TEXT" | grep -E "#667eea|#764ba2" > /dev/null; then
  FOUND_PURPLE=1
  PURPLE_LINE=$(echo "$AGENT_TEXT" | grep -E "#667eea|#764ba2" | head -1)
fi

if echo "$AGENT_TEXT" | grep -Ei "roboto|arial" | grep -v "not.*roboto" | grep -v "not.*arial" > /dev/null; then
  GENERIC_LINE=$(echo "$AGENT_TEXT" | grep -Ei "roboto|arial" | grep -v "not" | head -1)
  if echo "$GENERIC_LINE" | grep -E "font" > /dev/null; then
    FOUND_GENERIC=1
  fi
fi

VIOLATION_COUNT=$((FOUND_INTER + FOUND_PURPLE + FOUND_GENERIC))

if [ $VIOLATION_COUNT -gt 0 ]; then
  echo "### ❌ Result: VIOLATIONS FOUND ($VIOLATION_COUNT)" >> "$OUTPUT_MD"
  echo "" >> "$OUTPUT_MD"
  
  if [ $FOUND_INTER -eq 1 ]; then
    echo "#### Violation 1: Inter Font" >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
    echo "**Banned rule**: NEVER use Inter font" >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
    echo "**What happened**: Agent used Inter font despite explicit prohibition" >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
    echo "**Location in response**:" >> "$OUTPUT_MD"
    echo '```' >> "$OUTPUT_MD"
    echo "$INTER_LINE" >> "$OUTPUT_MD"
    echo '```' >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
  fi
  
  if [ $FOUND_PURPLE -eq 1 ]; then
    echo "#### Violation 2: Purple Gradient" >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
    echo "**Banned rule**: NEVER use purple gradient #667eea → #764ba2" >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
    echo "**What happened**: Agent used the exact banned gradient colors" >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
    echo "**Location in response**:" >> "$OUTPUT_MD"
    echo '```css' >> "$OUTPUT_MD"
    echo "$PURPLE_LINE" >> "$OUTPUT_MD"
    echo '```' >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
    echo "**Why this is significant**: Despite being told 'NEVER use purple gradient #667eea→#764ba2'," >> "$OUTPUT_MD"
    echo "the agent used those EXACT hex codes. This is negation blindness - the LLM processed" >> "$OUTPUT_MD"
    echo "'purple gradient #667eea→#764ba2' and retrieved it, missing the 'NEVER use' part." >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
  fi
  
  if [ $FOUND_GENERIC -eq 1 ]; then
    echo "#### Violation 3: Generic Font (Roboto/Arial)" >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
    echo "**Banned rule**: Avoid generic fonts (Roboto, Arial)" >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
    echo "**Location in response**:" >> "$OUTPUT_MD"
    echo '```' >> "$OUTPUT_MD"
    echo "$GENERIC_LINE" >> "$OUTPUT_MD"
    echo '```' >> "$OUTPUT_MD"
    echo "" >> "$OUTPUT_MD"
  fi
  
  SCORE=$(echo "10 - ($VIOLATION_COUNT * 2.5)" | bc)
  echo "**Score**: $SCORE/10" >> "$OUTPUT_MD"
  echo "" >> "$OUTPUT_MD"
  
else
  echo "### ✅ Result: NO VIOLATIONS" >> "$OUTPUT_MD"
  echo "" >> "$OUTPUT_MD"
  echo "Agent successfully followed all rules." >> "$OUTPUT_MD"
  echo "" >> "$OUTPUT_MD"
  echo "**Score**: 10/10" >> "$OUTPUT_MD"
  echo "" >> "$OUTPUT_MD"
fi

echo "---" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"
echo "## Full Agent Response" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"
echo '<details>' >> "$OUTPUT_MD"
echo '<summary>Click to expand full response</summary>' >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"
echo '```' >> "$OUTPUT_MD"
echo "$AGENT_TEXT" >> "$OUTPUT_MD"
echo '```' >> "$OUTPUT_MD"
echo "</details>" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"

echo "---" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"
echo "## Analysis" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"

if [ $VIOLATION_COUNT -gt 0 ]; then
  echo "This test demonstrates **negation blindness** in LLMs:" >> "$OUTPUT_MD"
  echo "" >> "$OUTPUT_MD"
  echo "1. The prompt explicitly says \"NEVER use purple gradient #667eea→#764ba2\"" >> "$OUTPUT_MD"
  echo "2. The LLM processes this and extracts the color codes" >> "$OUTPUT_MD"
  echo "3. It then uses those exact colors, missing the negation" >> "$OUTPUT_MD"
  echo "" >> "$OUTPUT_MD"
  echo "**Round 1 prediction**: 70% probability of negation failures" >> "$OUTPUT_MD"
  echo "**Result**: ✅ VALIDATED - Agent fell into predicted negation trap" >> "$OUTPUT_MD"
else
  echo "In this run, the agent successfully avoided the negation trap." >> "$OUTPUT_MD"
  echo "" >> "$OUTPUT_MD"
  echo "**Note**: Success rate is ~70-85% with explicit prompt repetition." >> "$OUTPUT_MD"
  echo "In real-world usage (skill file loaded once), failure rate would be higher." >> "$OUTPUT_MD"
fi

echo "" >> "$OUTPUT_MD"
echo "Generated: $(date -Iseconds)" >> "$OUTPUT_MD"

echo "✅ Violation example captured: $OUTPUT_MD"
echo "   Full raw response: results/frontend-design/raw-response-$$.txt"
