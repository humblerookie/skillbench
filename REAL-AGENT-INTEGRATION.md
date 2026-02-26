# Real Agent Integration for Round 2

## Current Status: MOCK IMPLEMENTATION ⚠️

Round 2 (Agent Testing) currently uses **simulated results** with realistic evidence structure, but does NOT actually run agents.

## What's Mocked

In `src/two-round-evaluator.js`, the `_runScenarios()` method:
- ✅ Generates test scenarios (normal + prediction-targeted)
- ✅ Creates realistic evidence structure
- ❌ Does NOT run actual agents
- ❌ Does NOT get real agent responses
- ❌ Simulates scores based on prediction probability

## What Real Integration Needs

### 1. Agent Execution Engine

```javascript
async _runScenarios(scenarios, skillContent) {
  const results = [];
  
  for (const scenario of scenarios) {
    // STEP 1: Run agent with scenario prompt + skill
    const agentResponse = await this._executeAgent({
      skillContent,
      userPrompt: scenario.userPrompt,
      provider: this.provider
    });
    
    // STEP 2: Evaluate response against requirements
    const evaluation = await this._evaluateResponse({
      scenario,
      agentResponse,
      skillContent,
      requirements: this._extractRequirements(skillContent)
    });
    
    results.push({
      scenario,
      agentResponse,  // Full agent output
      evaluation      // Score + violations + evidence
    });
  }
  
  return results;
}
```

### 2. Agent Execution

```javascript
async _executeAgent({ skillContent, userPrompt, provider }) {
  // Option A: Use OpenClaw's agent execution
  // - Spawn sub-agent with skill loaded
  // - Send user prompt
  // - Capture response
  
  // Option B: Direct LLM call with skill as system prompt
  const messages = [
    {
      role: 'system',
      content: `You are an AI assistant. Follow this skill guide:\n\n${skillContent}`
    },
    {
      role: 'user',
      content: userPrompt
    }
  ];
  
  const response = await provider.chat({
    messages,
    max_tokens: 4000
  });
  
  return {
    text: response.content,
    model: response.model,
    usage: response.usage,
    timestamp: new Date().toISOString()
  };
}
```

### 3. Response Evaluation (LLM-as-Judge)

```javascript
async _evaluateResponse({ scenario, agentResponse, skillContent, requirements }) {
  // Extract requirements from skill
  const requirementsToCheck = this._extractRequirementsForScenario(
    scenario,
    requirements
  );
  
  // LLM-as-judge evaluation
  const evaluationPrompt = `
You are evaluating an AI agent's response against a skill guide.

SKILL GUIDE:
${skillContent}

USER PROMPT:
${scenario.userPrompt}

AGENT RESPONSE:
${agentResponse.text}

REQUIREMENTS TO CHECK:
${requirementsToCheck.map((r, i) => `${i + 1}. ${r}`).join('\n')}

For each requirement, determine:
1. Was it followed? (yes/no)
2. Evidence (specific quotes from agent response)
3. Severity if violated (low/medium/high)

Respond in JSON:
{
  "overallScore": 0-10,
  "violated": true/false,
  "reasoning": "...",
  "evidence": [
    {
      "requirement": "...",
      "followed": true/false,
      "violation": "..." (if not followed),
      "location": "..." (quote from response),
      "severity": "low|medium|high"
    }
  ]
}
`;

  const judgeResponse = await this.provider.chat({
    messages: [{ role: 'user', content: evaluationPrompt }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(judgeResponse.content);
}
```

### 4. Requirement Extraction

```javascript
_extractRequirements(skillContent) {
  // Parse skill content to extract:
  // - MUST/SHOULD statements
  // - DO/DON'T instructions
  // - Best practices
  // - Anti-patterns to avoid
  
  const requirements = [];
  
  // Pattern 1: Bold requirements
  const boldMatches = skillContent.matchAll(/\*\*([^*]+)\*\*/g);
  for (const match of boldMatches) {
    const text = match[1];
    if (text.match(/^(MUST|SHOULD|DO|DON'T|AVOID|NEVER)/i)) {
      requirements.push({
        text,
        type: 'explicit',
        severity: text.match(/^(MUST|NEVER)/i) ? 'high' : 'medium'
      });
    }
  }
  
  // Pattern 2: Lists
  const listItems = skillContent.match(/^[\s]*[-*]\s+(.+)$/gm) || [];
  requirements.push(...listItems.map(item => ({
    text: item.trim(),
    type: 'list-item',
    severity: 'medium'
  })));
  
  return requirements;
}
```

## Integration Points

### OpenClaw Agent Integration

If running inside OpenClaw, can use:

```javascript
import { sessions_spawn } from 'openclaw';

async _executeAgent({ skillContent, userPrompt }) {
  // Spawn sub-agent with skill
  const result = await sessions_spawn({
    task: userPrompt,
    agentId: 'evaluator',
    // How to load skill? Need skill system integration
  });
  
  return result;
}
```

### Direct LLM Integration

Use existing provider abstraction:

```javascript
async _executeAgent({ skillContent, userPrompt, provider }) {
  return await provider.chat({
    messages: [
      { role: 'system', content: skillContent },
      { role: 'user', content: userPrompt }
    ]
  });
}
```

## Evidence Structure (Real vs Mock)

### Current Mock Evidence

```json
{
  "type": "violation",
  "requirement": "DO NOT use Inter font",
  "violation": "Agent used Inter font",
  "location": "font-family: Inter in generated CSS",
  "severity": "high",
  "predictedFailure": true,
  "explanation": "Negation missed (70% probability)"
}
```

### Real Evidence Would Include

```json
{
  "type": "violation",
  "requirement": "DO NOT use Inter font or generic sans-serif",
  "requirementLocation": "Line 42 in SKILL.md",
  "violation": "Agent used Inter font",
  "location": "Line 15: font-family: 'Inter', sans-serif;",
  "quote": "I've chosen Inter for its clean...",
  "severity": "high",
  "predictedFailure": true,
  "predictionProbability": 0.7,
  "agentReasoning": "Agent explicitly mentioned choosing Inter",
  "evaluatorConfidence": 0.95
}
```

## Testing Strategy

### Phase 1: Manual Validation
1. Run agent manually with scenario prompts
2. Manually evaluate responses
3. Validate prediction accuracy by hand

### Phase 2: Semi-Automated
1. Agent execution automated
2. Manual evidence extraction
3. Semi-automated scoring

### Phase 3: Fully Automated
1. Agent execution automated
2. LLM-as-judge evaluation
3. Automatic evidence extraction
4. Prediction validation automated

## Cost Considerations

### Mock (Current)
- Cost: $0
- Time: <1 second
- Accuracy: N/A (simulated)

### Real Implementation
- Cost: ~$2-5 per skill (4-10 scenarios × $0.50 per eval)
- Time: ~10-15 minutes
- Accuracy: Depends on LLM-as-judge quality

### Optimization
- Cache agent responses for repeated evaluations
- Use cheaper models for initial screening
- Only use expensive models for final validation
- Parallel execution of scenarios

## Next Steps

1. **Choose integration approach:**
   - OpenClaw sub-agents (if available)
   - Direct LLM calls (simpler, more portable)

2. **Implement agent execution:**
   - Replace `_runScenarios` mock with real execution
   - Add error handling, timeouts, retries

3. **Implement LLM-as-judge:**
   - Create evaluation prompt template
   - Parse structured responses
   - Extract evidence automatically

4. **Test with real skills:**
   - Start with simple skills
   - Validate prediction accuracy
   - Calibrate scoring thresholds

5. **Compare mock vs real:**
   - Run same scenarios with both
   - Validate that predictions hold
   - Adjust prediction probabilities based on real data

## Questions to Resolve

1. **How to load skills into agents?**
   - System prompt?
   - SKILL.md as context?
   - OpenClaw skill system?

2. **What provider to use for evaluation?**
   - Same as agent execution?
   - Separate "judge" model?
   - Multiple judges for consensus?

3. **How to handle multi-turn interactions?**
   - Current design assumes single-turn
   - Some skills need back-and-forth
   - Need conversation evaluation strategy?

4. **How to validate non-text outputs?**
   - Code, HTML, CSS
   - File operations
   - Tool calls
   - Need specialized validators?

---

**Status**: Mock implementation provides structure and evidence format.  
**Next**: Replace mock with real agent execution + LLM-as-judge evaluation.
