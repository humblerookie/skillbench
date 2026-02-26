# Prediction Validation System

**Innovative Feature**: Round 1 predictions automatically generate targeted Round 2 tests!

---

## The Problem

Traditional testing:
```
Round 1: "Negations will be missed (70% probability)"
Round 2: Run generic tests → Maybe catch it, maybe not
```

We don't know if the prediction was accurate!

---

## The Solution

**Prediction-Targeted Testing**:
```
Round 1: "Negations will be missed (70% probability)"
         ↓
Round 2: Generate test that SPECIFICALLY uses negations
         ↓
Result: Agent missed negations → Prediction VALIDATED ✅
```

---

## How It Works

### Step 1: Round 1 Predictions
```json
{
  "predictions": [
    {
      "checkName": "LLM Attention Patterns",
      "requirement": "negation-heavy",
      "probability": 0.7,
      "reason": "LLMs often miss negations"
    },
    {
      "checkName": "Context Window Issues",
      "requirement": "Choose bold aesthetic",
      "probability": 0.65,
      "reason": "Critical requirement in middle"
    }
  ]
}
```

### Step 2: Auto-Generate Targeted Tests
```javascript
For each high-probability prediction (≥60%):
  Generate a test scenario that exploits that weakness

Example:
  Prediction: "Negations missed"
  ↓
  Targeted Test: "Create professional SaaS landing with gradient"
  (This naturally leads to banned items: Inter font, purple gradient)
```

### Step 3: Mix with Normal Tests
```
Round 2 Test Suite:
1. Normal: Architect portfolio (compliance)
2. Targeted: Negation test (validates prediction #1)
3. Normal: Crypto dashboard (compliance)
4. Targeted: Middle content test (validates prediction #2)
5. Validation: Intentional violation
6. Targeted: List bias test (validates prediction #3)
```

### Step 4: Validation Report
```json
{
  "predictionAccuracy": "83%",
  "validatedPredictions": 5,
  "invalidatedPredictions": 1,
  "details": [
    {
      "scenarioId": "TARGETED-NEGATION-1",
      "predicted": "70% failure",
      "actual": "Failed (3.2/10)",
      "validated": "✅",
      "reason": "Agent used Inter font and purple gradient"
    },
    {
      "scenarioId": "TARGETED-MIDDLE-1",
      "predicted": "65% failure",
      "actual": "Failed (4.5/10)",
      "validated": "✅",
      "reason": "Agent forgot bold aesthetic requirement"
    }
  ]
}
```

---

## Example: frontend-design Skill

### Round 1 Predictions (High Risk)

**Prediction 1**: Negations will be missed (70%)
- Issue: Skill uses "DON'T use Inter", "NEVER use purple gradient"
- Why: LLMs misread negations as positive

**Prediction 2**: Middle content forgotten (65%)
- Issue: "Choose bold aesthetic direction" at line 234 (middle)
- Why: "Lost in the middle" phenomenon

**Prediction 3**: Parenthetical overload (40%)
- Issue: Important guidance in parentheses
- Why: LLMs skip parenthetical notes

### Round 2 Targeted Tests

**Test 1: TARGETED-NEGATION-1** (Exploits Prediction 1)
```
User Prompt: "Create a professional corporate landing page for a 
             SaaS startup. Make it modern and clean with a nice 
             gradient background."

Natural Temptations:
- "Professional corporate" → Inter font (BANNED!)
- "Nice gradient" → Purple gradient (BANNED!)

Expected: Agent should use distinctive fonts, avoid purple gradient
Predicted: Agent will fall into traps (70% likely)

Actual Result: Agent used Inter font + purple gradient
Score: 3.2/10 ❌
Validation: ✅ Prediction was CORRECT!
```

**Test 2: TARGETED-MIDDLE-1** (Exploits Prediction 2)
```
User Prompt: "Create a landing page for a meditation app. 
             The client wants something unique and memorable."

Requires: Bold aesthetic direction (middle requirement)

Expected: Agent should choose BOLD aesthetic
Predicted: Agent will forget this requirement (65% likely)

Actual Result: Agent created generic minimal design (no bold choice)
Score: 4.5/10 ❌
Validation: ✅ Prediction was CORRECT!
```

**Test 3: NORMAL-COMPLIANCE-1** (Baseline)
```
User Prompt: "Create a portfolio for a minimalist architect"

Expected: Agent follows all requirements normally

Actual Result: Agent performed well
Score: 9.6/10 ✅
(Shows skill CAN work when not hitting predicted weaknesses)
```

### Validation Summary

```
Prediction Accuracy: 83% (5/6 validated)

Validated Predictions:
✅ Negations missed (predicted 70%, actual failure)
✅ Middle content forgotten (predicted 65%, actual failure)
✅ List bias (predicted 50%, actual partial failure)

Invalidated Predictions:
❌ Parenthetical overload (predicted 40%, but agent handled it)

Insights:
- Followability analysis is 83% accurate
- Negation and position predictions are highly reliable
- Parenthetical issue was minor (false positive)

Recommendation:
Fix negation and position issues BEFORE deployment.
Predictions are validated - these failures WILL happen in production.
```

---

## Benefits

### 1. Validates Predictions
Know if Round 1 is accurate!

### 2. Provides Evidence
Not just "might fail" - actual test shows it DOES fail

### 3. Saves Cost
Target high-risk areas instead of testing blindly

### 4. Prioritizes Fixes
Fix validated issues first (proven failures)

### 5. Calibrates System
Low accuracy? Recalibrate predictions.

---

## Comparison: Traditional vs Targeted

### Traditional Testing
```
Round 1: Analyze skill
Round 2: Run 10 generic tests
- 8 tests pass (skill works!)
- 2 tests fail (unclear why)
Cost: $1.00
Learning: "Skill mostly works, 80% pass rate"
```

### Prediction-Targeted Testing
```
Round 1: Analyze skill + predict 3 weaknesses
Round 2: Run 6 tests (3 targeted + 3 normal)
- 3 normal tests pass (skill CAN work)
- 3 targeted tests fail (weaknesses CONFIRMED)
Cost: $0.60
Learning: "Skill works EXCEPT when hitting these 3 specific issues:
          1. Negations (70% miss) ✅ Confirmed
          2. Middle content (65% miss) ✅ Confirmed  
          3. List bias (50% miss) ✅ Confirmed
          Fix these 3 before deployment."
```

**Benefits**:
- ✅ 40% cost reduction (fewer tests needed)
- ✅ Targeted evidence (know exactly what to fix)
- ✅ Prediction validation (know Round 1 works)
- ✅ Prioritized fixes (proven issues first)

---

## Test Generation Strategy

### For Each Prediction Type:

**Negation Missed** (DON'T/NEVER/AVOID)
```javascript
Prompt: Naturally lead to banned items
  "Professional corporate SaaS" → Inter font (banned)
  "Nice gradient background" → Purple gradient (banned)

Check: Did agent use banned items?
```

**Middle Content Forgotten**
```javascript
Prompt: Require middle-positioned requirement
  "Unique and memorable" → Bold aesthetic (middle req)

Check: Did agent remember middle requirement?
```

**List Position Bias**
```javascript
Prompt: Require font choice (tests list selection)
  "Choose appropriate fonts" → Font list check

Check: Did agent only pick first/last? Or consider all?
```

**Cognitive Overload**
```javascript
Prompt: Complex multi-part request
  "Design system: landing + dashboard + mobile"

Check: How many requirements were missed?
```

**Buried Requirements**
```javascript
Prompt: Trigger paragraph-embedded rule
  "Strong visual hierarchy" → Buried requirement

Check: Was buried rule followed?
```

---

## Integration

### Automatic in Two-Round Evaluator

```javascript
// Round 1
const round1Report = await round1Evaluator.evaluate(skillContent);

// Extract predictions
const predictions = round1Report.phases['1c_followability'].predictions;

// Round 2: Auto-generate targeted tests
const targetedTests = generateTargetedTests(predictions);
const normalTests = generateNormalTests();
const allTests = mix(targetedTests, normalTests);

// Run tests
const results = await runTests(allTests);

// Validate predictions
const validation = validatePredictions(results, predictions);

// Report
return {
  round1,
  round2,
  predictionValidation: validation  // NEW!
};
```

### Manual Usage

```bash
# Full evaluation with validation
node test-two-round.js skill.md

# Output includes:
# - Round 1 predictions
# - Round 2 results (targeted + normal)
# - Prediction validation report
# - Accuracy metrics
```

---

## Validation Metrics

**Prediction Accuracy**:
```
Accuracy = (Correct Predictions / Total Predictions) × 100

Where Correct Prediction:
  (Predicted failure AND actual failure) OR
  (Predicted success AND actual success)
```

**Confidence Calibration**:
```
High confidence (70%+) predictions should fail ~70% of time
Medium confidence (40-69%) should fail ~50% of time

If calibration is off → Adjust prediction probabilities
```

**Evidence Quality**:
```
Gold Standard: Prediction validated with actual test
Silver: Prediction plausible but not tested
Bronze: Prediction unvalidated or contradicted
```

---

## Real-World Impact

### Before Targeted Testing:
```
Developer: "Round 1 says negations might be missed. Should I fix it?"
Manager: "Maybe, but we're not sure. Let's deploy and see."
→ Production issues when negations are missed
```

### After Targeted Testing:
```
Developer: "Round 1 says negations will be missed (70%)."
Validation: "Tested - agent DID miss negations (3.2/10 score)"
Manager: "Clear evidence. Fix before deploy."
→ Issue prevented, no production failures
```

**ROI**:
- Catch issues pre-deployment
- Prioritize fixes with evidence
- Reduce production incidents
- Trust Round 1 predictions

---

## Future Enhancements

1. **Adaptive Testing**: If prediction fails, generate more tests for that pattern
2. **Confidence Tuning**: Adjust prediction probabilities based on validation accuracy
3. **Cross-Skill Learning**: Patterns validated in one skill inform others
4. **Production Telemetry**: Real-world usage validates/refines predictions

---

**Status**: ✅ Implemented in `src/prediction-targeted-testing.js`

**Try it**:
```bash
node test-two-round.js skill.md --validate-predictions
```

**See also**:
- FOLLOWABILITY-PATTERNS.md - Prediction patterns
- TWO-ROUND-SYSTEM.md - Complete evaluation system
- STRESS-TESTING-GUIDE.md - Stress test methodology
