# Complete Skill Testing Framework

Evalanche now provides **four levels** of skill evaluation:

---

## The Four Levels

```
┌────────────────────────────────────────────────────────┐
│ Level 1: Skill Quality (Best Practices)               │
│ Question: Is the skill well-written?                  │
│ Method: Static analysis against Anthropic guidelines  │
│ Score: 0-10                                            │
│ Cost: 1 LLM call (conciseness check)                 │
└────────────────────────────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────────────┐
│ Level 2: Followability (Predictive)           ⭐ NEW! │
│ Question: Where will agents likely fail?              │
│ Method: Pattern matching + structural analysis        │
│ Score: 0-100                                           │
│ Cost: 0 LLM calls (pure analysis)                    │
└────────────────────────────────────────────────────────┘
             ↓ (Fix predicted issues)
┌────────────────────────────────────────────────────────┐
│ Level 3a: Compliance Testing                          │
│ Question: Do agents follow the skill normally?        │
│ Method: Generate scenarios, run agents, score         │
│ Score: 0-10 per requirement                           │
│ Cost: N scenarios × (generation + evaluation)         │
└────────────────────────────────────────────────────────┘
             +
┌────────────────────────────────────────────────────────┐
│ Level 3b: Evaluator Validation                        │
│ Question: Does the grading system work?               │
│ Method: Intentional violations + scoring              │
│ Score: Pass/Fail                                       │
│ Cost: 1 scenario × evaluation                         │
└────────────────────────────────────────────────────────┘
             +
┌────────────────────────────────────────────────────────┐
│ Level 3c: Stress Testing                      ⭐ NEW! │
│ Question: Where does the skill break?                 │
│ Method: Edge cases, conflicts, adversarial prompts    │
│ Score: Resilience, judgment, degradation (0-10 each) │
│ Cost: M stress scenarios × (generation + evaluation)  │
└────────────────────────────────────────────────────────┘
```

---

## When to Use Each Level

### Level 1: Skill Quality
**Use when**:
- ✅ Writing a new skill
- ✅ Before any testing
- ✅ Quality gate for skill library

**Catches**:
- Missing/invalid frontmatter
- Vague descriptions
- Over-explanation
- Anti-patterns (Windows paths, time-sensitive info)

**Output**:
```
Skill Quality: 8.5/10
Issues:
- Description could include more "when to use" guidance
- One section over 100 lines (consider splitting)
Status: ✅ PASS (proceed to next level)
```

---

### Level 2: Followability Analysis (NEW!)
**Use when**:
- ✅ After Level 1 passes
- ✅ Before expensive testing
- ✅ Finding **predictive** issues

**Catches**:
- Critical requirements in middle (will be forgotten)
- Negations that will be missed
- Lists too long (middle items skipped)
- Buried requirements in paragraphs
- Cognitive overload (too many rules)

**Output**:
```
Followability: 72/100
Predicted Failures (before testing!):
1. "NEVER use Inter" (line 487, middle 93%) → 70% miss rate
2. List of 9 fonts (positions 4-7) → 50% will be skipped
3. 13 MUST requirements → Agent will miss 3-5
Recommendation: Fix these 3 issues, then test
```

**🎯 Key Benefit**: Find issues **before spending on API calls**!

---

### Level 3a: Compliance Testing
**Use when**:
- ✅ After fixing Level 2 issues
- ✅ Validating skill effectiveness
- ✅ Regression testing after changes

**Catches**:
- Requirements that are unclear
- Examples that don't help
- Instructions that agents misinterpret

**Output**:
```
Compliance: 9.8/10 (4/4 tests passed)
- Architect portfolio: 9.6/10
- Crypto dashboard: 10.0/10
- Audio e-commerce: 9.7/10
- Music app: 10.0/10
Status: ✅ Skill works when followed
```

---

### Level 3b: Evaluator Validation
**Use when**:
- ✅ Setting up evaluation pipeline
- ✅ Sanity checking scoring
- ✅ Verifying anti-pattern detection

**Catches**:
- Broken evaluation logic
- Evaluator giving high scores to bad responses
- Missing violation detection

**Output**:
```
Validation: ✅ PASS
- Intentional violations scored 0.8/10 (correctly low)
- Detected: Inter font, purple gradient, no design thinking
Status: ✅ Evaluation system works
```

---

### Level 3c: Stress Testing (NEW!)
**Use when**:
- ✅ Preparing for production
- ✅ Finding edge cases
- ✅ Understanding limitations

**Catches**:
- Edge cases skill doesn't handle
- Ambiguous instructions
- Conflicting requirements
- Adversarial prompts that trick agents

**Output**:
```
Stress Testing: 6.2/10 resilience
Weaknesses found:
1. Ambiguity: "minimal" unclear (4.5/10)
2. Conflict: density vs space (5.8/10)
3. Adversarial: "trendy fonts" trick (3.2/10)
Skill Gaps: [specific improvements needed]
```

---

## Complete Workflow

### Phase 1: Pre-Flight (Free!)
```bash
# Level 1: Check best practices
node test-two-round.js skill.md
→ Score: 8.5/10 ✅

# Level 2: Predict failures
node test-followability.js skill.md
→ Score: 72/100 ⚠️
→ 3 predicted issues found

# Fix predicted issues (no testing needed!)
# Edit SKILL.md based on recommendations
```

**Cost so far**: ~1 API call (conciseness check)

### Phase 2: Validation (Moderate Cost)
```bash
# Level 3a: Compliance testing
node evaluate-skill.js skill.md --scenarios 4
→ Average: 9.8/10 ✅

# Level 3b: Evaluator validation
# (included in above)
→ Validation: ✅ PASS

# Level 3c: Stress testing
node test-stress.js skill.md
node run-stress-tests.js
→ Resilience: 6.2/10 ⚠️
→ Found 3 new gaps
```

**Cost**: ~20-30 API calls (4 compliance + ~15 stress)

### Phase 3: Refinement
```bash
# Fix stress test issues
# Edit SKILL.md for edge cases

# Rerun quick validation
node test-followability.js skill.md
→ Score: 95/100 ✅ (improvement!)

# Spot-check with 2 compliance tests
→ Still passing ✅
```

**Cost**: ~3 API calls (spot check)

**Total Cost**: ~25-35 API calls vs. 50-100 without prediction

---

## Cost Comparison

### Without Followability Analysis:
```
1. Write skill
2. Run 20 compliance tests → Find 6 issues
3. Don't know why they fail → Trial and error
4. Fix (guess) → Rerun 20 tests
5. Still failing → Try different fixes
6. Rerun 10 tests → Still issues
7. Finally works after 50 test runs

Total: 50 test runs = $5-10 in API costs
Time: 2-3 hours of iteration
```

### With Followability Analysis:
```
1. Write skill
2. Run followability (free) → Predict 6 issues
3. Fix predicted issues (targeted)
4. Run 10 compliance tests → Mostly passing
5. Fix 2 unpredicted issues
6. Rerun 5 tests → All passing

Total: 15 test runs = $1.50-3.00 in API costs
Time: 30-45 minutes of iteration
```

**Savings**: 70% cost reduction, 75% time savings

---

## Feature Matrix

| Feature | Level 1 | Level 2 | Level 3a | Level 3b | Level 3c |
|---------|---------|---------|----------|----------|----------|
| **Cost** | ~Free | Free | $$$ | $ | $$$ |
| **Speed** | Fast | Instant | Slow | Fast | Slow |
| **Predicts failures** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Validates functionality** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Finds edge cases** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **No API calls needed** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Can run before testing** | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Example: frontend-design Evaluation

### Level 1: Skill Quality
```
Score: 8.5/10 ✅
Issues: Minor - could add more examples
Time: 30 seconds
Cost: $0.02
```

### Level 2: Followability
```
Score: 72/100 ⚠️
Predicted Issues:
1. "NEVER use Space Grotesk" at line 487 (middle) → 70% miss
2. 9-item font list → positions 4-7 will be skipped
3. 13 MUST requirements → 3-5 will be forgotten

Fixes applied:
- Moved critical items to top
- Broke list into sections
- Prioritized requirements

New score: 95/100 ✅
Time: 5 seconds
Cost: $0 (no API calls!)
```

### Level 3a: Compliance
```
Score: 9.8/10 ⭐⭐⭐⭐⭐
Tests: 4 scenarios
Pass rate: 100%
Time: 5 minutes
Cost: $0.40 (4 scenarios × 2 API calls)
```

### Level 3b: Validation
```
Status: ✅ PASS
Violations detected correctly
Time: 1 minute
Cost: $0.10
```

### Level 3c: Stress
```
Score: 6.2/10 resilience ⚠️
Tests: 12 scenarios
Weaknesses: Ambiguity, conflicts, adversarial
Time: 15 minutes
Cost: $1.20 (12 scenarios × 2 API calls)

Fixes applied:
- Added decision tree for ambiguity
- Clarified priority in conflicts
- Added anti-adversarial guidance

New score: 8.5/10 ✅
```

**Total Time**: ~25 minutes  
**Total Cost**: ~$1.80  
**Result**: Production-ready skill with known limitations

---

## Decision Tree: Which Tests to Run?

```
Start → Level 1 (Skill Quality)
         ↓
      Score ≥ 7?
         ↓ YES
      Level 2 (Followability)
         ↓
      Issues found?
         ↓ YES → Fix issues → Re-check followability
         ↓ NO
      
      Need full validation?
         ↓ YES → Level 3a (Compliance) + 3b (Validation)
         ↓
      Pass rate ≥ 80%?
         ↓ YES
      
      Production deployment?
         ↓ YES → Level 3c (Stress)
         ↓
      Resilience ≥ 7?
         ↓ YES → ✅ Deploy
         ↓ NO → Fix gaps → Spot-check → Deploy
```

---

## Quick Commands

```bash
# Full evaluation (all levels)
npm run evaluate-full skill.md

# Pre-flight only (Levels 1-2, free!)
npm run pre-flight skill.md

# Validation only (Level 3a-b)
npm run validate skill.md

# Stress test only (Level 3c)
npm run stress skill.md

# Followability only (Level 2, instant!)
npm run followability skill.md
```

---

## Key Innovations

### 1. **Predictive Analysis** (Level 2)
- Finds issues **before testing**
- Based on research + known patterns
- Zero API cost

### 2. **Stress Testing** (Level 3c)
- Tests **edge cases** and **limits**
- Reveals skill **gaps**
- Prepares for **production**

### 3. **Integrated Pipeline**
- Four complementary levels
- Each finds different issues
- Optimized workflow

---

## Summary

| Level | Question | Method | Output | When |
|-------|----------|--------|--------|------|
| **1** | Well-written? | Best practices | Score + issues | Always first |
| **2** | Followable? | Pattern analysis | Predictions | Before testing |
| **3a** | Works? | Compliance tests | Pass rate | Core validation |
| **3b** | Grading works? | Intentional violations | Pass/fail | Pipeline check |
| **3c** | Robust? | Stress tests | Resilience | Pre-production |

**Together**: Complete quality assurance for agent skills.

---

See individual guides for details:
- `FOLLOWABILITY-PATTERNS.md` - Pattern analysis details
- `STRESS-TESTING-GUIDE.md` - Stress testing methodology
- `TESTING-TYPES.md` - Comparison of test types
- `README-PROVIDERS.md` - Multi-provider setup

**Status**: ✅ Complete testing framework ready for use!
