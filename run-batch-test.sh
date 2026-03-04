#!/bin/bash
# Run batch tests and compile results

set -e

NUM_TESTS="${1:-20}"
OUTPUT_DIR="results/frontend-design/batch-test"

mkdir -p "$OUTPUT_DIR"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     Batch Test: Frontend Design Skill (n=$NUM_TESTS)    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Initialize counters
TOTAL=0
VIOLATIONS=0
NO_VIOLATIONS=0

echo "Running $NUM_TESTS tests..."
echo ""

for i in $(seq 1 $NUM_TESTS); do
  printf "Test %2d/%d: " "$i" "$NUM_TESTS"
  
  # Run test and capture result
  RESULT=$(./test-with-skill-embedded.sh 2>&1 | tee "$OUTPUT_DIR/test-$i.log")
  
  # Check if violations found
  if echo "$RESULT" | grep -q "VIOLATIONS FOUND:"; then
    VIOLATION_COUNT=$(echo "$RESULT" | grep "VIOLATIONS FOUND:" | sed 's/.*VIOLATIONS FOUND: //' | sed 's/[^0-9].*//')
    echo "❌ FAIL ($VIOLATION_COUNT violations)"
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    echo "✅ PASS"
    NO_VIOLATIONS=$((NO_VIOLATIONS + 1))
  fi
  
  TOTAL=$((TOTAL + 1))
  
  # Brief pause between tests
  sleep 2
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "BATCH TEST RESULTS"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Total Tests:     $TOTAL"
echo "Passed:          $NO_VIOLATIONS ($(echo "scale=1; $NO_VIOLATIONS * 100 / $TOTAL" | bc)%)"
echo "Failed:          $VIOLATIONS ($(echo "scale=1; $VIOLATIONS * 100 / $TOTAL" | bc)%)"
echo ""
echo "Predicted:       70% failure rate"
echo "Observed:        $(echo "scale=1; $VIOLATIONS * 100 / $TOTAL" | bc)% failure rate"
echo ""

# Check prediction accuracy
OBSERVED=$(echo "scale=1; $VIOLATIONS * 100 / $TOTAL" | bc)
PREDICTED=70

if (( $(echo "$OBSERVED >= 50 && $OBSERVED <= 90" | bc -l) )); then
  echo "🎯 Prediction validated (within expected range)"
  VALIDATION="VALIDATED"
else
  echo "⚠️  Prediction off (may need more tests or prompt refinement)"
  VALIDATION="NEEDS_MORE_DATA"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"

# Generate summary report
REPORT_FILE="$OUTPUT_DIR/batch-report.json"

cat > "$REPORT_FILE" <<EOF
{
  "batchTest": {
    "skill": "frontend-design",
    "timestamp": "$(date -Iseconds)",
    "numTests": $TOTAL,
    "results": {
      "passed": $NO_VIOLATIONS,
      "failed": $VIOLATIONS,
      "passRate": "$(echo "scale=1; $NO_VIOLATIONS * 100 / $TOTAL" | bc)%",
      "failureRate": "$(echo "scale=1; $VIOLATIONS * 100 / $TOTAL" | bc)%"
    },
    "prediction": {
      "expected": "70%",
      "observed": "$(echo "scale=1; $VIOLATIONS * 100 / $TOTAL" | bc)%",
      "status": "$VALIDATION"
    }
  }
}
EOF

echo "📁 Report: $REPORT_FILE"
echo ""

# Analyze violation patterns
echo "Violation Breakdown:"
echo "─────────────────────────────────────────────────────────────"

INTER_COUNT=$(grep -l "Inter font" $OUTPUT_DIR/test-*.log 2>/dev/null | wc -l)
PURPLE_COUNT=$(grep -l "Purple gradient" $OUTPUT_DIR/test-*.log 2>/dev/null | wc -l)
GENERIC_COUNT=$(grep -l "Generic font" $OUTPUT_DIR/test-*.log 2>/dev/null | wc -l)

echo "Inter font violations:     $INTER_COUNT / $TOTAL ($(echo "scale=1; $INTER_COUNT * 100 / $TOTAL" | bc)%)"
echo "Purple gradient:           $PURPLE_COUNT / $TOTAL ($(echo "scale=1; $PURPLE_COUNT * 100 / $TOTAL" | bc)%)"
echo "Generic fonts (Rob/Arial): $GENERIC_COUNT / $TOTAL ($(echo "scale=1; $GENERIC_COUNT * 100 / $TOTAL" | bc)%)"
echo ""
