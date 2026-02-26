# Using OpenClaw's Native Agent Execution (No API Key!)

## You're Right!

OpenClaw **already has** agent execution built-in via `openclaw agent` command. No need for separate API keys!

## What OpenClaw Provides

```bash
openclaw agent --message "your prompt" --local --json
```

This:
- ✅ Uses your existing Claude login (no API key needed)
- ✅ Runs agent turns locally  
- ✅ Returns structured output
- ✅ Supports session management

## How to Run Evaluation

### Quick Test (Single Scenario)

```bash
cd /home/ubuntu/.openclaw/workspace/evalanche
./test-with-openclaw.sh
```

This runs:
1. Loads frontend-design skill
2. Executes agent via `openclaw agent --local`
3. Analyzes response for violations
4. Generates report

**Cost**: $0 (uses your existing session)  
**Time**: ~10 seconds

### Example Output

```
╔═══════════════════════════════════════════════════════════╗
║     Live Evaluation Using OpenClaw (No API Key!)        ║
╚═══════════════════════════════════════════════════════════╝

📄 Skill: frontend-design
🎯 Test Scenario: Corporate SaaS Landing Page (Negation Trap)

🤖 Running agent with skill loaded...
✅ Agent responded

─────────────────────────────────────────────────────────────
Agent Response (first 800 chars):
─────────────────────────────────────────────────────────────
<!DOCTYPE html>...

═════════════════════════════════════════════════════════════
📊 VIOLATION ANALYSIS
═════════════════════════════════════════════════════════════

❌ VIOLATION 1: Inter font detected
   Location: font-family: 'Inter', sans-serif
   Severity: HIGH
   ⚠️  PREDICTED FAILURE: Negation 'NEVER use Inter' was ignored

❌ VIOLATION 2: Purple gradient detected
   Location: #667eea
   Severity: HIGH
   ⚠️  PREDICTED FAILURE: Negation 'AVOID purple gradient' misread

═════════════════════════════════════════════════════════════
❌ VIOLATIONS FOUND: 2
📊 Final Score: 5.0/10

🎯 Round 1 Prediction: VALIDATED ✅
   Round 1 predicted agents would miss negations (70% probability)
   This test confirms the prediction was accurate.

📁 Report saved: results/frontend-design/openclaw-test-2026-02-26-11-15-30.json
```

## Integration with Two-Round System

Update `src/two-round-evaluator.js` to use OpenClaw's agent command:

```javascript
async _executeAgent(skillContent, userPrompt) {
  // Use openclaw agent instead of direct API calls
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  const fullPrompt = `${skillContent}\n\nUSER: ${userPrompt}`;
  
  const { stdout } = await execAsync(
    `openclaw agent --message ${JSON.stringify(fullPrompt)} --local --json`,
    { maxBuffer: 10 * 1024 * 1024 }
  );
  
  const result = JSON.parse(stdout);
  return {
    text: result.reply || result.content,
    model: 'openclaw-session',
    timestamp: new Date().toISOString()
  };
}
```

## Benefits

✅ **No API keys** - uses your existing Claude session  
✅ **No separate auth** - already logged in via OpenClaw  
✅ **Session management** - OpenClaw handles state  
✅ **Integrated** - works with OpenClaw's agent system  
✅ **Free** - no additional API costs

## Full Two-Round Evaluation

To run complete evaluation using OpenClaw:

```bash
# Round 1: Static analysis (instant, free)
node test-round1.js /path/to/SKILL.md

# Round 2: Agent testing via OpenClaw (uses your session)
./test-with-openclaw.sh /path/to/SKILL.md
```

## Why This is Better

**Before** (with API keys):
- Required separate Anthropic/OpenAI account
- Needed API key management
- Separate authentication
- Additional costs

**After** (with OpenClaw native):
- ✅ Uses existing Claude session
- ✅ No extra setup
- ✅ Integrated with OpenClaw
- ✅ No additional costs

## Current Status

- ✅ `test-with-openclaw.sh` created
- ✅ Uses `openclaw agent --local`
- ✅ Violation detection working
- ✅ Evidence extraction working
- ⏸️  Full two-round integration pending

## Next Steps

1. Update `src/two-round-evaluator.js` to use `openclaw agent` by default
2. Fall back to direct API only when running outside OpenClaw
3. Document OpenClaw-native workflow
4. Test multi-scenario execution

---

**You were right!** OpenClaw already has everything we need. No API keys required.
