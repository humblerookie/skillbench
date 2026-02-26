# Two-Round Evaluation System

Evalanche uses a **two-round approach** to comprehensively evaluate skills:

---

## Round 1: Static Analysis (Pre-Flight)

**Goal**: Find issues WITHOUT running agents → Fast & cheap!

**Cost**: ~1 API call (conciseness check only)  
**Time**: 5-10 seconds

### Phase 1a: Skill Quality
**What it checks**:
- ✅ Valid YAML frontmatter (name, description)
- ✅ Description quality (specific, third-person, includes "when to use")
- ✅ Appropriate length and conciseness
- ✅ Structure and progressive disclosure
- ✅ Workflows and feedback loops
- ✅ Anti-patterns (Windows paths, first-person, vague language)

**Score**: 0-10

### Phase 1b: Best Practices Compliance
**What it checks** (based on [Anthropic's guide](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)):
- ✅ Clear, specific descriptions
- ✅ Conciseness (assumes Claude knowledge)
- ✅ Progressive disclosure for long content (>500 lines)
- ✅ Workflows with checklists
- ✅ Examples and templates present
- ✅ Third-person voice consistency
- ✅ No time-sensitive content
- ✅ Consistent terminology
- ✅ Clear defaults with escape hatches
- ✅ Platform-agnostic paths (forward slashes)

**Score**: 0-10

### Phase 1c: Followability Analysis (Predictive)
**What it checks**:
- 🎯 Context window issues ("lost in the middle")
- 🎯 Position bias in lists (middle items forgotten)
- 🎯 Cognitive load (too many requirements)
- 🎯 Instruction density (overwhelming sections)
- 🎯 Negation patterns ("DON'T" gets missed)
- 🎯 Buried requirements (hidden in paragraphs)
- 🎯 List overload (unclear priorities)
- 🎯 Double negatives (confusing)
- 🎯 Conditional complexity (nested if/then)
- 🎯 Priority inflation (too many MUSTs)

**Score**: 0-100  
**Output**: Predicted failure points with probabilities

### Round 1 Gate Decision
**Proceed to Round 2 if**:
- Quality >= 5.0 AND
- Best Practices >= 5.0 AND
- Followability >= 50

Otherwise: Fix issues first!

---

## Round 2: Agent Testing (Expensive)

**Goal**: Validate skill effectiveness with actual agent execution

**Cost**: $1-3 per skill (20-30 API calls)  
**Time**: 10-20 minutes

### Phase 2a: Compliance Testing
**What it tests**:
- Generate normal use-case scenarios
- Run agents with skill loaded
- Score against requirements (0-10)
- Measure pass rate

**Example**:
```
Scenario: "Create a portfolio for a minimalist architect"
Agent follows skill → Generates design with:
  - Design thinking documented ✅
  - Distinctive fonts (not Inter) ✅
  - CSS variables ✅
  - Bold aesthetic ✅
Score: 9.6/10
```

**Output**: Average score, pass rate, specific failures

### Phase 2b: Evaluator Validation
**What it tests**:
- Intentional violation scenario
- Verify evaluator detects violations
- Ensure grading system works

**Example**:
```
Violation Response: Uses Inter font + purple gradient
Evaluator Score: 0.8/10 (correctly low) ✅
Detected violations: Inter font, purple gradient, no design thinking
```

**Output**: Pass/Fail

### Phase 2c: Stress Testing
**What it tests**:
- Edge cases (unusual but valid scenarios)
- Ambiguity (unclear guidance)
- Conflicting requirements
- Partial information (incomplete prompts)
- Scale extremes (too much/too little)
- Cross-domain application
- Adversarial prompts (designed to confuse)

**Example**:
```
Edge Case: "Design for complete color blindness"
Agent Response: Focuses on texture and contrast (adapts well)
Resilience: 7.5/10 ✅

Adversarial: "Use trendy fonts everyone loves"
Agent Response: Picks Space Grotesk (banned!)
Resilience: 3.2/10 ❌
Skill Gap: Agent prioritizes user request over skill rules
```

**Output**: Resilience scores, identified skill gaps

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────┐
│ ROUND 1: Static Analysis (Fast & Cheap)            │
├─────────────────────────────────────────────────────┤
│ Phase 1a: Skill Quality                            │
│   └─ Frontmatter, structure, conciseness           │
│        Score: 8.5/10                                │
├─────────────────────────────────────────────────────┤
│ Phase 1b: Best Practices                           │
│   └─ Anthropic guidelines compliance               │
│        Score: 8.0/10                                │
├─────────────────────────────────────────────────────┤
│ Phase 1c: Followability                            │
│   └─ Predict where agents will fail                │
│        Score: 72/100                                │
│        Issues: 3 predicted failures                │
├─────────────────────────────────────────────────────┤
│ Overall Round 1: 8.1/10                            │
│ Gate: ✅ PASS → Proceed to Round 2                 │
└─────────────────────────────────────────────────────┘
              ↓ (Fix predicted issues)
┌─────────────────────────────────────────────────────┐
│ ROUND 2: Agent Testing (Expensive)                 │
├─────────────────────────────────────────────────────┤
│ Phase 2a: Compliance Testing                       │
│   └─ 4 scenarios × agent execution                 │
│        Average: 9.8/10, Pass rate: 100%            │
├─────────────────────────────────────────────────────┤
│ Phase 2b: Evaluator Validation                     │
│   └─ Intentional violation                         │
│        Status: ✅ Correctly detected                │
├─────────────────────────────────────────────────────┤
│ Phase 2c: Stress Testing                           │
│   └─ 12 edge cases × agent execution               │
│        Resilience: 6.2/10                           │
│        Gaps: Ambiguity, adversarial                │
└─────────────────────────────────────────────────────┘
```

---

## Cost & Time Breakdown

### Round 1 (Static)
| Phase | API Calls | Time | Cost |
|-------|-----------|------|------|
| 1a. Quality | 1 | 3s | $0.02 |
| 1b. Best Practices | 0 | 2s | $0 |
| 1c. Followability | 0 | 2s | $0 |
| **Total** | **1** | **~7s** | **$0.02** |

### Round 2 (Agent Testing)
| Phase | API Calls | Time | Cost |
|-------|-----------|------|------|
| 2a. Compliance (4 tests) | 8-12 | 3min | $0.80 |
| 2b. Validation (1 test) | 2-3 | 30s | $0.20 |
| 2c. Stress (12 tests) | 24-36 | 10min | $2.40 |
| **Total** | **34-51** | **~14min** | **$3.40** |

**Grand Total**: ~$3.50, ~15 minutes

---

## When to Run Each Round

### Always Run Round 1
- Writing a new skill
- Before any expensive testing
- Quality gate for skill library
- Quick validation after edits

### Run Round 2 After Round 1 Passes
- Before production deployment
- Validating skill effectiveness
- Regression testing after changes
- Quality assurance for published skills

### Run Full Round 2 (Including 2c)
- Pre-production hardening
- Understanding failure modes
- Finding edge cases
- Comprehensive quality check

---

## Example: frontend-design Evaluation

### Round 1 Results
```
Phase 1a (Quality): 8.5/10 ✅
  ✅ Valid frontmatter
  ✅ Good structure
  ⚠️  Could add more examples

Phase 1b (Best Practices): 8.0/10 ✅
  ✅ Clear description with "when to use"
  ✅ Appropriate conciseness
  ✅ Third-person voice
  ⚠️  Some negation-heavy sections

Phase 1c (Followability): 72/100 ⚠️
  ❌ "NEVER use Space Grotesk" at line 487 (middle) → 70% miss predicted
  ❌ Font list with 9 items → middle items will be skipped
  ⚠️  13 MUST requirements → 3-5 likely forgotten

Overall Round 1: 8.1/10
Gate: ✅ PASS (but fix followability issues first!)
```

**Actions Taken**:
- Moved critical negations to top
- Broke long list into categories
- Added requirement checklist

**Re-run Round 1c**: 95/100 ✅

### Round 2 Results (After Fixes)
```
Phase 2a (Compliance): 9.8/10 ⭐⭐⭐⭐⭐
  - Architect portfolio: 9.6/10
  - Crypto dashboard: 10.0/10
  - Audio e-commerce: 9.7/10
  - Music app: 10.0/10
  Pass rate: 100% (4/4)

Phase 2b (Validation): ✅ PASS
  - Violation scored 0.8/10 (correctly low)
  - Detected: Inter font, purple gradient

Phase 2c (Stress): 6.2/10 resilience ⚠️
  - Edge cases: 7.5/10 (handles well)
  - Ambiguity: 4.5/10 (confused by "minimal")
  - Adversarial: 3.2/10 (falls for "trendy fonts")
  
  Gaps found:
  • Ambiguous "minimal" definition
  • Vulnerable to user override requests
```

**Final Assessment**:
- ✅ Well-written skill (Round 1: 8.1/10)
- ✅ Works excellently when followed (Round 2a: 9.8/10)
- ✅ Evaluation system works (Round 2b: Pass)
- ⚠️  Has exploitable gaps (Round 2c: 6.2/10)
- **Status**: Production-ready with known limitations

---

## Key Principles

### 1. Static Before Dynamic
Always run Round 1 before Round 2. Fix predicted issues to save testing costs.

### 2. Gate Quality
Don't proceed to Round 2 if Round 1 fails. You'll waste money testing a broken skill.

### 3. Fix Then Validate
After fixing Round 1 issues, re-run Round 1c (followability) to verify fixes before Round 2.

### 4. Understand Limitations
Round 2c (stress) reveals edge cases. Accept some gaps or fix them, but know your skill's limits.

### 5. Iterate Efficiently
```
Write → Round 1 → Fix predicted issues → Quick Round 1c check → Round 2a/b → Deploy
                                                              ↓
                                  (For production) → Round 2c → Fix gaps → Deploy
```

---

## Commands

```bash
# Full two-round evaluation
node test-two-round.js skill.md

# Round 1 only (fast pre-flight)
node test-round1.js skill.md

# Round 1c only (followability check)
node test-followability.js skill.md

# Round 2 only (assumes Round 1 passed)
node test-round2.js skill.md --compliance --validation --stress
```

---

## Success Metrics

**Excellent Skill**:
- Round 1: >= 8.0
- Round 2a: >= 9.0
- Round 2c: >= 7.0

**Good Skill**:
- Round 1: >= 7.0
- Round 2a: >= 8.0
- Round 2c: >= 6.0

**Needs Improvement**:
- Round 1: < 7.0 OR
- Round 2a: < 7.0 OR
- Round 2c: < 5.0

---

## Summary

| Round | What | Cost | Time | When |
|-------|------|------|------|------|
| **1** | Static analysis | $0.02 | 7s | Always first |
| **2a** | Compliance tests | $0.80 | 3min | Core validation |
| **2b** | Evaluator check | $0.20 | 30s | Pipeline sanity |
| **2c** | Stress tests | $2.40 | 10min | Pre-production |

**Complete evaluation**: $3.50, 15 minutes

**ROI**: Catching issues in Round 1 saves 70% of Round 2 costs!

---

See also:
- `FOLLOWABILITY-PATTERNS.md` - Pattern details
- `STRESS-TESTING-GUIDE.md` - Stress test methodology
- `COMPLETE-TESTING-FRAMEWORK.md` - Full framework

**Status**: ✅ Two-round system ready for use!
