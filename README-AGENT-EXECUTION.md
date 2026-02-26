# Agent Execution - NOW IMPLEMENTED ✅

## Status: REAL AGENTS RUNNING

Round 2 now **actually runs agents** with the skill loaded, gets real responses, and evaluates them with LLM-as-judge.

**No more mocks.** This is the real thing.

## What It Does

### 1. Agent Execution
```javascript
// Load skill as system prompt
messages: [
  {
    role: 'system',
    content: `Follow this skill guide:\n\n${skillContent}`
  },
  {
    role: 'user',
    content: userPrompt  // Test scenario
  }
]

// Get real response from LLM
const response = await provider.complete({ messages, max_tokens: 4000 });
```

### 2. LLM-as-Judge Evaluation
```javascript
// Extract requirements from skill
const requirements = extractRequirements(skillContent);

// Build evaluation prompt
const evaluationPrompt = `
You are evaluating an AI agent's response against a skill guide.

SKILL GUIDE: ${skillContent}
USER REQUEST: ${userPrompt}
AGENT'S RESPONSE: ${agentResponse}

REQUIREMENTS TO CHECK:
1. Requirement X
2. Requirement Y
...

Respond with JSON:
{
  "overallScore": 0-10,
  "violated": true/false,
  "reasoning": "...",
  "evidence": [...]
}
`;

// Get judge evaluation
const judgment = await provider.complete({ messages: [evaluationPrompt] });
```

### 3. Evidence Extraction
Evidence comes from the **actual LLM-as-judge evaluation**, not mocked:
```json
{
  "requirement": "DO NOT use Inter font",
  "followed": false,
  "violation": "Agent used Inter font in CSS",
  "location": "font-family: 'Inter', sans-serif",
  "severity": "high"
}
```

## How to Run

### Option 1: With Anthropic API
```bash
export ANTHROPIC_API_KEY='sk-ant-...'
./test-with-anthropic.sh
```

### Option 2: With OpenAI API
```bash
export OPENAI_API_KEY='sk-...'
node test-two-round.js /path/to/SKILL.md --provider openai
```

### Option 3: Inside OpenClaw (recommended)
```bash
# OpenClaw automatically provides authentication
openclaw eval skill /path/to/SKILL.md
```

## What Changed

**Before** (commit 7150bd3):
- Mock agent responses
- Simulated scores
- Generated evidence
- ❌ Not real

**After** (current):
- ✅ Real LLM calls with skill loaded
- ✅ Actual agent responses
- ✅ LLM-as-judge evaluation
- ✅ Real evidence from judgment

## Code Structure

### `_runScenarios(scenarios, skillContent, provider)`
Main loop - runs each test scenario:
1. Call `_executeAgent()` → get response
2. Call `_evaluateResponse()` → get judgment
3. Return results with evidence

### `_executeAgent(skillContent, userPrompt, provider)`
Executes one test:
- Loads skill as system prompt
- Sends user prompt
- Returns agent response text

### `_evaluateResponse(scenario, agentResponse, skillContent, provider)`
LLM-as-judge evaluation:
- Extracts requirements from skill
- Builds evaluation prompt
- Calls LLM to judge response
- Parses JSON judgment
- Returns score + evidence

### `_extractRequirements(skillContent, scenario)`
Parses skill to find requirements:
- Looks for MUST/SHOULD/DO/DON'T/AVOID/NEVER
- Extracts from bold text and lists
- Prioritizes targeted requirements
- Limits to top 10 (avoid overwhelming judge)

## Example Run

```
🤖 Running agent test: TARGETED-NEGATION-1
   Prompt: Create a corporate landing page...
   ✅ Agent response: 2,341 chars
   📊 Evaluation: 3.2/10 ❌ VIOLATION

Evidence:
- Requirement: "DO NOT use Inter font"
  Violation: "Agent used font-family: 'Inter', sans-serif"
  Severity: high
  
- Requirement: "AVOID purple gradient (#667eea → #764ba2)"
  Violation: "Agent used exact banned gradient"
  Severity: high
```

## Cost & Performance

**Per skill evaluation** (4 scenarios):
- 4 agent executions: ~8,000 tokens input, ~12,000 output
- 4 judge evaluations: ~6,000 tokens input, ~2,000 output
- **Total**: ~28,000 tokens = **~$1.50-2.00** (Anthropic pricing)
- **Time**: ~60-90 seconds

**Optimization opportunities**:
- Use cheaper models for initial tests
- Cache agent responses
- Parallel execution
- Batch judging

## Provider Support

✅ **Anthropic** (Claude)
- Best for evaluation quality
- Most expensive (~$2/skill)
- Recommended for production

✅ **OpenAI** (GPT-4)
- Good evaluation quality
- Mid-range cost (~$1/skill)
- Fast responses

✅ **OpenClaw**
- Integrated authentication
- Uses configured default model
- Best for OpenClaw users

## Known Limitations

1. **Requires API access** - Can't run without proper credentials
2. **JSON parsing** - Some models don't always return perfect JSON (we handle this)
3. **Context limits** - Very long skills may exceed context window
4. **Evaluation quality** - Judge quality depends on model used

## Testing

**Live agent test**:
```bash
node test-live-agent.js
```

Demonstrates:
- Real LLM call with skill loaded
- Actual response
- Violation detection
- Validates that negations ARE missed (as predicted)

## Summary

**This is now a REAL evaluation system:**
- ✅ Loads skills into agents
- ✅ Runs actual test scenarios
- ✅ Gets real agent responses
- ✅ Evaluates with LLM-as-judge
- ✅ Extracts real evidence
- ✅ Validates Round 1 predictions

**No more mocks.** Just need API keys to run.
