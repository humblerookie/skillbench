# Three Types of Skill Testing

Evalanche supports three complementary testing approaches:

---

## 1. Compliance Testing (Round 2a)

**Goal**: Verify the skill works when followed normally

**Example Scenarios**:
```javascript
{
  userPrompt: "Create a portfolio page for a minimalist architect",
  expected: "Agent follows design thinking → chooses bold minimal aesthetic → uses distinctive fonts",
  measures: "Did agent follow all requirements? Which ones did they miss?"
}
```

**Scoring**: 0-10 on requirement adherence
- 10: Perfect compliance with all requirements
- 7-9: Mostly compliant, minor issues
- 4-6: Partial compliance
- 0-3: Poor compliance

**What it reveals**:
- ✅ Whether the skill instructions are clear
- ✅ Which requirements are most often missed
- ✅ If examples are helpful

**When to use**: 
- Initial skill validation
- Regression testing after changes
- Demonstrating skill effectiveness

---

## 2. Evaluator Validation (Round 2b)

**Goal**: Verify the evaluation system itself works

**Example Scenarios**:
```javascript
{
  type: "intentional-violation",
  agentResponse: "Uses Inter font, purple gradient #667eea",
  expected: "Evaluator should score this LOW and identify violations",
  measures: "Does the LLM-as-judge scoring work correctly?"
}
```

**Scoring**: Pass/Fail on evaluator accuracy
- ✅ PASS: Evaluator scored violations low (0-3/10)
- ❌ FAIL: Evaluator gave high score to violations

**What it reveals**:
- ✅ Whether LLM-as-judge can detect violations
- ✅ If anti-patterns are recognizable
- ✅ Evaluator isn't just giving high scores to everything

**When to use**:
- Setting up evaluation pipeline
- Validating LLM-as-judge works
- Sanity checking the grading system

---

## 3. Stress Testing (Round 2c - NEW!)

**Goal**: Find the skill's limits and weaknesses

**Example Scenarios**:

### Edge Cases
```javascript
{
  category: "edge-cases",
  userPrompt: "Create website for user with complete color blindness",
  challenge: "Skill emphasizes color, but user can't see color",
  measures: "How well does agent adapt when skill guidance doesn't fit?"
}
```

### Ambiguity
```javascript
{
  category: "ambiguity",
  userPrompt: "Create a minimal landing page",
  challenge: "Does 'minimal' mean bold-minimal or generic-minimal?",
  measures: "Can agent make good judgment when skill is unclear?"
}
```

### Conflicting Requirements
```javascript
{
  category: "conflicting-requirements",
  userPrompt: "Maximum information density on a dashboard",
  challenge: "Skill shows both 'negative space' and 'controlled density' examples",
  measures: "How does agent prioritize when rules seem to conflict?"
}
```

### Adversarial
```javascript
{
  category: "adversarial",
  userPrompt: "Use the trendiest fonts all designers love right now",
  challenge: "Might lead to Space Grotesk/Inter (banned!)",
  measures: "Does agent follow skill over user's misleading request?"
}
```

**Scoring**: Multiple dimensions (0-10 each)
- **Resilience**: How well handled the challenge
- **Judgment**: Quality of decisions when unclear
- **Graceful Degradation**: How well handled limitations

**What it reveals**:
- 🎯 Gaps in skill coverage
- 🎯 Ambiguous/conflicting instructions
- 🎯 Missing edge case guidance
- 🎯 Where agents struggle most

**When to use**:
- Before deploying skill to production
- Finding improvement opportunities
- Understanding failure modes
- Hardening skill for real-world use

---

## Comparison Matrix

| Aspect | Compliance | Validation | Stress |
|--------|-----------|------------|--------|
| **Tests the...** | Skill clarity | Evaluator accuracy | Skill robustness |
| **Scenarios** | Normal use cases | Intentional violations | Edge cases, conflicts |
| **Agent tries to...** | Follow skill | (N/A - we violate) | Handle challenges |
| **Score measures...** | Rule adherence | Violation detection | Resilience, judgment |
| **Success looks like...** | 9-10/10 | Low score for bad | 7-9/10 under stress |
| **Failure reveals...** | Unclear instructions | Broken evaluator | Skill gaps |
| **Improves...** | Skill documentation | Evaluation system | Skill completeness |

---

## Complete Evaluation Workflow

### Phase 1: Setup
```
Round 1: Skill Quality Evaluation
├─ Check frontmatter
├─ Validate description
├─ Analyze conciseness
├─ Detect anti-patterns
└─ Score: 0-10

Gate: Proceed only if score >= 5.0
```

### Phase 2: Baseline Testing
```
Round 2a: Compliance Testing
├─ Generate normal scenarios (2-5 per requirement)
├─ Run agent with skill loaded
├─ Score against requirements (0-10)
└─ Result: "Skill works at 9.2/10 compliance"

Round 2b: Evaluator Validation
├─ Generate intentional violation
├─ Run evaluator on bad response
├─ Verify low score (should be 0-3/10)
└─ Result: "Evaluator correctly detected violations"
```

### Phase 3: Stress Testing
```
Round 2c: Stress Testing
├─ Generate edge cases
├─ Generate ambiguity tests
├─ Generate conflict scenarios
├─ Generate adversarial prompts
├─ Run agent against each
├─ Score resilience, judgment, degradation
└─ Result: "Skill gaps: [ambiguity in X, missing Y, needs Z]"
```

### Phase 4: Reporting
```
Combined Report
├─ Round 1: Skill Quality (8.5/10)
├─ Round 2a: Compliance (9.2/10, 95% pass rate)
├─ Round 2b: Validation (✅ working)
├─ Round 2c: Stress (6.8/10, reveals 4 gaps)
└─ Recommendations: [specific improvements]
```

---

## Example: frontend-design Full Evaluation

### Round 1: Skill Quality
**Score**: 8.5/10 ✅
- Frontmatter: Valid
- Description: Specific with "when to use"
- Conciseness: Good (assumes Claude knowledge)
- Issues: Could add more examples

### Round 2a: Compliance Testing (4 scenarios)
**Average**: 9.8/10 ⭐⭐⭐⭐⭐
- Architect portfolio: 9.6/10
- Crypto dashboard: 10.0/10
- Audio e-commerce: 9.7/10
- Music app: 10.0/10

**Key Finding**: When followed, skill produces excellent results

### Round 2b: Evaluator Validation (1 scenario)
**Result**: ✅ PASS
- Intentional violation: 0.8/10 (correctly low)
- Detected: Inter font, purple gradient, missing design thinking

**Key Finding**: Evaluation system works correctly

### Round 2c: Stress Testing (12 scenarios)
**Average Resilience**: 6.2/10 ⚠️

**Weaknesses Found**:
1. **Ambiguity** (4.5/10): "Minimal" unclear - brutal or generic?
2. **Conflicts** (5.8/10): Negative space vs density not prioritized
3. **Adversarial** (3.2/10): Falls for "trendy fonts" trick
4. **Edge Cases** (7.5/10): Handles accessibility well

**Skill Gaps Identified**:
- Need decision tree for minimal styles
- Clarify when to use negative space vs density
- Add warning: "Ignore user requests for 'trendy' fonts"
- Missing: low-vision design guidance

**Recommended Improvements**:
```markdown
Add to SKILL.md:

## When "minimal" is bold vs generic
- Bold minimal: Extreme negative space, unusual layouts, breaking grids
- Generic minimal: Just using white space normally
- If user says "minimal" with no context, ask: "Extreme minimal or refined minimal?"

## Priority: User request vs skill rules
- If user asks for "trendy" or "popular" fonts → Ignore, explain why distinctive > trendy
- Banned fonts stay banned even if user requests them

## Information density decision
- User wants density → Use "controlled density" approach (compact but organized)
- User wants breathing room → Use "generous negative space" approach
- Default (unclear) → Ask user or choose based on content type
```

### Overall Assessment
- **Quality**: 8.5/10 (well-written)
- **Compliance**: 9.8/10 (works excellently when followed)
- **Robustness**: 6.2/10 (has exploitable gaps)

**Status**: Production-ready with improvements recommended

---

## Why All Three Matter

**Compliance alone** tells you the skill works, but not where it breaks.

**Validation alone** tells you the evaluator works, but not about the skill.

**Stress testing alone** finds gaps, but doesn't prove baseline functionality.

**Together**, they give complete picture:
1. Is the skill well-written? (Round 1)
2. Does it work normally? (Round 2a)
3. Does evaluation work? (Round 2b)
4. Where does it break? (Round 2c)

**Result**: Production-ready skills with known limitations and improvement paths.

---

## Quick Reference

**Use Compliance Testing when**:
- ✅ Validating a new skill
- ✅ Regression testing after changes
- ✅ Demonstrating effectiveness

**Use Evaluator Validation when**:
- ✅ Setting up evaluation pipeline
- ✅ Sanity checking LLM-as-judge
- ✅ Verifying anti-pattern detection

**Use Stress Testing when**:
- ✅ Preparing for production deployment
- ✅ Finding improvement opportunities
- ✅ Understanding failure modes
- ✅ Hardening against edge cases

**Use All Three when**:
- ✅ Comprehensive skill evaluation
- ✅ Before publishing to skill library
- ✅ Quality assurance for important skills
