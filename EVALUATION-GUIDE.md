# Evalanche v2.1.0 - Evaluation Guide

Complete guide for evaluating AgentSkills with prediction-targeted testing.

---

## Quick Start

### 1. Run Round 1 (Static Analysis - Free & Fast)
```bash
node test-round1.js /path/to/SKILL.md
```

**Output**: Quality score + followability predictions (~2 seconds, free)

### 2. Run Full Evaluation (With Agent Testing)
```bash
./test-with-openclaw.sh /path/to/SKILL.md
```

**Output**: Complete report with violations + evidence (~10 sec per test, free with OpenClaw)

### 3. Batch Testing (Statistical Validation)
```bash
./run-batch-test.sh 20  # Run 20 tests
```

---

## Two-Round System

### Round 1: Static Analysis
**No agents tested** - Fast predictions of where agents will fail.

**Checks**:
- **1a. Skill Quality**: Frontmatter, structure, conciseness
- **1b. Best Practices**: Anthropic guidelines compliance
- **1c. Followability**: Predictive failure analysis (10 patterns)

**Output**: 
- Score: 0-10
- Predictions: Where agents will fail (with probabilities)
- Recommendation: Proceed to Round 2 or fix issues first

### Round 2: Agent Testing
**Real agent execution** - Validates Round 1 predictions with evidence.

**Tests**:
- **2a. Compliance**: Normal + prediction-targeted scenarios
- **2b. Evaluator Validation**: Ensure grading works
- **Prediction Validation**: Compare predicted vs actual failures

**Output**:
- Score: 0-10 per test
- Violations: Exact failures with evidence
- Prediction accuracy: % predictions validated

---

## Followability Patterns (10 Predictive Checks)

### 1. Context Window Issues (70% miss rate)
Middle-positioned requirements forgotten ("lost in the middle").

**Fix**: Move critical rules to top or bottom.

### 2. Negation Patterns (70% miss rate)
"DON'T use X" read as "use X" (negation blindness).

**Fix**: Reframe as positive - "Use Y instead of X"

### 3. Position Bias (50% miss rate)
Middle items in lists ignored.

**Fix**: Limit lists to 5-7 items, bold critical items.

### 4. Cognitive Load (40% miss rate)
>12 requirements → skimming/forgetting.

**Fix**: Break into sub-sections with checklists.

### 5. Buried Requirements (60% miss rate)
Important rules in paragraph form.

**Fix**: Use bullet points, bold critical rules.

### 6. List Overload (40% miss rate)
Unclear priority in long lists.

**Fix**: Explicitly rank: MUST > SHOULD > OPTIONAL

### 7. Negation Complexity (60% error rate)
Double negatives, complex conditional negations.

**Fix**: Simplify to positive statements.

### 8. Conditional Complexity (50% miss rate)
"If X then Y, unless Z" style instructions.

**Fix**: Separate scenarios with explicit examples.

### 9. Priority Inflation (30% miss rate)
Everything marked CRITICAL → nothing is critical.

**Fix**: Reserve CRITICAL for top 2-3 rules.

### 10. Instruction Density (>50% text → 30% skip rate)
Dense walls of text without breaks.

**Fix**: Add whitespace, headers, bullets.

---

## Prediction-Targeted Testing

### How It Works

1. **Round 1** predicts: "Agent will miss negations (70% probability)"
2. **System generates** test scenario that exploits this weakness
3. **Round 2** runs test and checks if prediction was accurate
4. **Result**: Validated prediction with evidence

### Example

**Prediction**: Frontend-design skill has negation-heavy rules (70% fail rate)

**Generated Test**:
```
Prompt: "Create a professional corporate landing page with gradient"
Trap: Naturally suggests Inter font + purple gradient (both banned)
Validation: Did agent use banned patterns?
```

**Result**: Agent used purple gradient #667eea→#764ba2 despite "NEVER use" → Prediction validated ✅

### Benefits

- **50% cost reduction**: Test targeted weaknesses, not everything
- **Evidence-based**: Actual violations prove predictions
- **Prioritization**: Fix validated issues first
- **Calibration**: Track prediction accuracy over time

---

## Running Tests

### With OpenClaw (No API Key)
```bash
# Single test
./test-with-openclaw.sh /path/to/SKILL.md

# Batch test
./run-batch-test.sh 20
```

Uses your existing Claude session via `openclaw agent --local`.

### With API Key (Standalone)
```bash
# Set API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Run evaluation
./test-with-anthropic.sh /path/to/SKILL.md
```

### Cost & Performance

| Method | Cost | Time | Use Case |
|--------|------|------|----------|
| Round 1 only | $0 | 2s | Quick pre-flight check |
| OpenClaw tests | $0 | 10s/test | Development/testing |
| API tests | ~$0.03/test | 10s/test | CI/CD pipelines |
| Batch (20 tests) | $0 (OpenClaw) | 5-8min | Statistical validation |

---

## Understanding Results

### Violation Report
```json
{
  "requirement": "NEVER use Inter font",
  "violation": "Agent used Inter font",
  "location": "font-family: 'Inter', sans-serif",
  "severity": "HIGH",
  "predictedFailure": true,
  "explanation": "Negation 'NEVER use X' ignored - common LLM failure"
}
```

### Prediction Validation
```json
{
  "predicted": "70% failure rate on negations",
  "observed": "15% failure rate",
  "status": "Lower due to prompt repetition",
  "insight": "Explicit repetition helps reduce failures"
}
```

### What to Do

**High prediction accuracy (>60%)**: 
- Predictions are reliable
- Fix predicted issues before testing

**Low prediction accuracy (<40%)**:
- Need more test data
- Or skill doesn't match patterns

**High failure rate (>50%)**:
- Skill needs rewriting
- Focus on top 3 issues

---

## Best Practices for Skill Authors

### Do ✅
- Place critical rules at top/bottom (avoid middle)
- Use positive statements ("Use X" not "Don't use Y")
- Bold important requirements
- Break long sections with headers
- Limit lists to 5-7 items
- Add examples for complex rules
- Use checklists for workflows

### Don't ❌
- Bury requirements in paragraphs
- Use double negatives
- Mark everything CRITICAL
- Create dense walls of text
- Use complex conditional logic
- Mix many topics in one section

---

## Multi-Provider Support

### Supported Providers
- **Anthropic** (Claude): Best quality, ~$2/skill
- **OpenAI** (GPT-4): Good quality, ~$1/skill
- **OpenClaw**: Free, uses your session

### Configuration
```bash
# Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI  
export OPENAI_API_KEY="sk-..."

# OpenClaw (automatic)
# No setup needed - uses your session
```

---

## Files & Scripts

### Test Scripts
- `test-round1.js` - Round 1 only (fast)
- `test-two-round.js` - Complete evaluation
- `test-with-openclaw.sh` - OpenClaw native
- `run-batch-test.sh` - Batch testing

### Results
- `results/<skill>/` - Evaluation reports
- `results/<skill>/batch-test/` - Batch test data

### Documentation
- `README.md` - Project overview
- `EVALUATION-GUIDE.md` - This guide
- `CHANGELOG-v2.1.md` - Version history
- `LIVE-TEST-RESULTS.md` - Example results

---

## Troubleshooting

**"Skill not found"**
→ Provide full path to SKILL.md

**"Provider requires API key"**
→ Set environment variable or use `--local` with OpenClaw

**"Low prediction accuracy"**
→ Run more tests (20-30) for statistical validation

**"All tests passing but skill seems problematic"**
→ Check if prompt repetition is masking issues (use skill file loading, not embedded prompts)

---

## Getting Help

- **GitHub Issues**: https://github.com/humblerookie/evalanche/issues
- **Documentation**: This guide + README.md
- **Example**: See `LIVE-TEST-RESULTS.md` for real test run

---

## Version

**v2.1.0** - Prediction-targeted testing with multi-provider support

See `CHANGELOG-v2.1.md` for release notes.
