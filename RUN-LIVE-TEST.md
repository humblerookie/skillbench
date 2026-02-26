# How to Run the Live Test RIGHT NOW

## Quick Start (2 minutes)

### Step 1: Get your Anthropic API key
Visit: https://console.anthropic.com/settings/keys

Copy your API key (starts with `sk-ant-`)

### Step 2: Set environment variable
```bash
export ANTHROPIC_API_KEY="your-key-here"
```

### Step 3: Run the live test
```bash
cd /home/ubuntu/.openclaw/workspace/evalanche
node test-real-live.js
```

## What You'll See

The test will:
1. ✅ Load the frontend-design skill
2. ✅ Execute a REAL agent with the skill loaded
3. ✅ Send a test prompt designed to trigger negation failures
4. ✅ Analyze the response for violations
5. ✅ Generate a detailed report with evidence

## Expected Output

```
╔═══════════════════════════════════════════════════════════╗
║         LIVE END-TO-END TEST (REAL AGENTS)              ║
╚═══════════════════════════════════════════════════════════╝

📄 Skill: frontend-design
🎯 Test: Negation trap (banned patterns)

Test Scenario:
  Name: Corporate SaaS Landing Page
  Prompt: Create a professional corporate landing page...
  Banned: Inter font, Roboto font, Arial font, Purple gradient

🤖 Executing agent with skill loaded...

✅ Agent responded (4523ms, 2847 chars)

──────────────────────────────────────────────────────────────
Agent Response (first 800 chars):
──────────────────────────────────────────────────────────────
<!DOCTYPE html>
<html>
<head>
<style>
body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  ...
}
</style>
...

════════════════════════════════════════════════════════════
📊 VIOLATION ANALYSIS
════════════════════════════════════════════════════════════

❌ VIOLATIONS FOUND: 2

Violation 1:
  Requirement: NEVER use Inter font (explicitly banned)
  What Failed: Agent used Inter font
  Location: font-family: 'Inter', sans-serif
  Severity: HIGH
  ⚠️  PREDICTED FAILURE: Negation "NEVER use Inter" was ignored - common LLM failure mode

Violation 2:
  Requirement: AVOID purple gradient (#667eea → #764ba2)
  What Failed: Agent used the exact banned purple gradient
  Location: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  Severity: HIGH
  ⚠️  PREDICTED FAILURE: Negation "AVOID X" was interpreted as suggestion to use X

📊 Final Score: 5.0/10

🎯 Round 1 Prediction: VALIDATED ✅
   Round 1 predicted agents would miss negations (70% probability)
   This test confirms the prediction was accurate.

════════════════════════════════════════════════════════════
📁 Report saved: results/frontend-design/live-test-2026-02-26...json
════════════════════════════════════════════════════════════
```

## Full Report JSON

Check `results/frontend-design/live-test-*.json` for the complete report with:
- Execution timing
- Full agent response
- Detailed violation evidence
- Prediction validation

## Cost

- Single test: ~5,000 tokens
- Cost: ~$0.03-0.05
- Time: ~5-10 seconds

## Alternative: Run Full Two-Round Evaluation

```bash
export ANTHROPIC_API_KEY="your-key-here"
./test-with-anthropic.sh
```

This runs:
- Round 1: Static analysis (fast, free)
- Round 2: 4 agent tests (targeted + normal)
- Full prediction validation
- Cost: ~$1.50-2.00
- Time: ~90 seconds

## No API Key?

The test script will give you a clear error and instructions:
```
❌ Error: ANTHROPIC_API_KEY not set

Please set your API key:
  export ANTHROPIC_API_KEY="sk-ant-..."
```

---

**Ready to run?** Just set your API key and execute `node test-real-live.js`
