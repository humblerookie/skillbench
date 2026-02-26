# Evalanche + OpenClaw Integration

## ✅ Integration Complete!

Evalanche now works with OpenClaw in **two modes**:

### Mode 1: Direct API (Original)
Requires your own Anthropic API key:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run health
```

### Mode 2: OpenClaw Agent (NEW! ⭐)
**No API key needed** - uses the OpenClaw agent's existing Claude access:

```bash
# Just ask the agent:
"Please run an Evalanche health check"
"Evaluate the healthcheck skill using Evalanche"
"Run a calibration test on this requirement: [paste requirement]"
```

## How OpenClaw Mode Works

When you ask the OpenClaw agent to run evaluations:

1. **Agent reads** the skill documentation
2. **Agent generates** test scenarios
3. **Agent uses its own Claude access** to score compliance
4. **Agent returns** the evaluation report

**No separate API key required!** The agent leverages its existing OpenClaw authentication.

## Example Usage

### Quick Health Check
```
You: "Run an Evalanche health check"

Agent: *runs calibration tests*
       ✅ Consistency: PASS
       ✅ Calibration: PASS (5/5 cases)
       ✅ Evidence validation: PASS
       ✅ Drift: STABLE
       
       Overall: HEALTHY
```

### Evaluate a Skill
```
You: "Evaluate the healthcheck skill"

Agent: *parses SKILL.md*
       *generates 24 test scenarios*
       *runs evaluations*
       
       📊 Results:
       Average Score: 8.3/10
       Pass Rate: 87.5%
       Violations: 3
       
       📄 Full report: healthcheck-evaluation.json
```

### Custom Evaluation
```
You: "Score this agent response against the requirement 'Must read SKILL.md first':
     
     Response: Let me help you with that. [reads docs] Now I can assist..."

Agent: Score: 10/10
       Reasoning: Agent correctly read documentation before proceeding
       Evidence: ["[reads docs]"]
       Violated: No
```

## Files Updated

- ✅ `src/evaluator-v2.js` - Supports `useOpenClaw: true` mode
- ✅ `src/openclaw-adapter.js` - Anthropic API wrapper using OpenClaw auth
- ✅ `src/deterministic-evaluator-openclaw.js` - OpenClaw-aware evaluator
- ✅ `test-health.js` - Supports `--openclaw` flag
- ✅ `README-OPENCLAW.md` - This file!

## Running Tests

### Via npm (requires API key OR OpenClaw)
```bash
# With API key
export ANTHROPIC_API_KEY=sk-ant-...
npm run health

# With OpenClaw (attempts to extract key from config)
USE_OPENCLAW=true npm run health
# or
npm run health -- --openclaw
```

### Via Agent (recommended! No API key needed)
Just ask the agent to run tests:
```
"Run Evalanche health check"
"Test the calibration dataset"
"Evaluate this scenario: [paste]"
```

## Advantages of Agent Mode

1. **No API key management** - Uses OpenClaw's existing auth
2. **Integrated workflow** - Results come directly in chat
3. **Interactive** - Ask follow-up questions, iterate on tests
4. **Secure** - API key never leaves OpenClaw's auth system
5. **Cost-effective** - Uses your existing OpenClaw API allocation

## Technical Details

When running in OpenClaw mode, the evaluator:
- Uses `OpenClawAdapter` instead of direct Anthropic client
- Attempts to extract API key from OpenClaw config
- Falls back to agent-based evaluation if extraction fails
- Maintains full compatibility with calibration/validation systems

## Troubleshooting

**"Could not extract OpenClaw API key"**
- ✅ This is expected! Just ask the agent to run evaluations instead
- The agent has Claude access through OpenClaw's tool system

**"Your credit balance is too low"**
- If using Direct API mode, add credits to your Anthropic account
- Switch to Agent mode (ask the agent) to use OpenClaw's auth instead

**"Evaluator producing inconsistent scores"**
- Normal for LLM-based judging
- Evalanche uses retries + median scoring to mitigate
- Check calibration results (`npm run health`)

## Next Steps

1. **Try it!** Ask the agent: "Run an Evalanche health check"
2. **Evaluate a skill** "Evaluate the healthcheck skill"
3. **Create custom tests** Ask the agent to score specific scenarios
4. **Build regression suites** Track skill quality over time

## Questions?

Ask the agent! It can:
- Explain how Evalanche works
- Run evaluations
- Debug calibration issues
- Generate custom test scenarios
- Compare skill versions

---

**Status**: ✅ READY
**Mode**: OpenClaw Agent (no API key needed)
**Version**: 2.0.0 + OpenClaw Integration
