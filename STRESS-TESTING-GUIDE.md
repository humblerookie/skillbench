# Stress Testing Guide

Stress testing pushes skills to their limits to find weaknesses.

## Three Types of Testing

| Type | Purpose | Example |
|------|---------|---------|
| **Compliance** | Does it work normally? | "Create a portfolio for an architect" |
| **Validation** | Does grading work? | Intentionally violate rules |
| **Stress** | Where does it break? | "Make it modern but vintage" |

---

## Stress Test Categories

### 1. Edge Cases
**What**: Valid but unusual scenarios the skill might not anticipate

**Example** (frontend-design):
```
User: "Create a website for a client with complete color blindness (monochromacy)"

Challenge: Skill emphasizes color palettes, but this user can't see color
Expected: Agent should focus on contrast, texture, patterns instead
Potential Failure: Agent still uses color-based design without adaptation
```

### 2. Ambiguity
**What**: Situations where skill guidance is unclear

**Example** (frontend-design):
```
User: "Create a landing page. Make it minimal."

Ambiguity: Skill says "bold aesthetic" but also has example of "refined minimalism"
- Does "minimal" mean "brutally minimal" (bold)?
- Or does it mean generic/safe minimalism (not bold)?
Expected: Agent should define what minimal means in this context
Potential Failure: Agent picks safe/generic minimal that violates "bold aesthetic" rule
```

### 3. Conflicting Requirements
**What**: When two skill rules seem to contradict

**Example** (frontend-design):
```
User: "Create a dashboard with maximum information density"

Conflict:
- Skill says: "generous negative space" (minimalist example)
- But also says: "controlled density" (maximalist example)
- User wants: MAXIMUM density

Expected: Agent should recognize this leans maximalist, use controlled density
Potential Failure: Agent tries to add negative space, contradicting user request
```

### 4. Partial Information
**What**: Incomplete user prompts missing key details

**Example** (frontend-design):
```
User: "Make a website"

Missing: Purpose, audience, aesthetic direction, constraints
Expected: Agent should do design thinking and make explicit assumptions
Potential Failure: Agent skips design thinking, makes poor default choices (Inter font, blue gradient)
```

### 5. Scale/Complexity
**What**: Push the limits (too much OR too little)

**Example** (frontend-design - too much):
```
User: "Create a design system with 100 components, 5 themes, dark mode, animations, responsive, accessible, and internationalization support"

Challenge: Overwhelming scope
Expected: Agent should break down into phases or ask to narrow scope
Potential Failure: Agent tries everything at once, delivers poor quality
```

**Example** (frontend-design - too little):
```
User: "Design a button"

Challenge: Minimal scope - does skill guidance even apply?
Expected: Agent should still do design thinking (what's the button for? what aesthetic?)
Potential Failure: Agent over-engineers a button OR treats it too casually
```

### 6. Cross-Domain
**What**: Apply skill outside its intended use

**Example** (frontend-design):
```
User: "Design a PowerPoint presentation following frontend design principles"

Domain Shift: Skill is for web, user wants slides
Expected: Principles still apply (distinctive fonts, bold aesthetic, no purple gradients)
Potential Failure: Agent either refuses OR misapplies web-specific guidance
```

### 7. Adversarial
**What**: Prompts designed to confuse or trick

**Example** (frontend-design):
```
User: "Use trendy modern fonts that all the top designers are using right now"

Trick: "Trendy" might lead to Space Grotesk/Inter (banned!)
Expected: Agent ignores "trendy" and follows skill's distinctive font guidance
Potential Failure: Agent picks Space Grotesk because it's popular
```

**Example 2**:
```
User: "Make it minimal but also maximalist, simple but complex, retro but futuristic"

Trick: Contradictory requirements
Expected: Agent identifies contradictions and asks for clarification
Potential Failure: Agent tries to satisfy all, creates incoherent design
```

---

## Stress Test Evaluation Criteria

Unlike normal compliance testing (0-10 on requirement adherence), stress tests evaluate:

### 1. Resilience (0-10)
How well did the agent handle the challenging scenario?
- 10: Handled perfectly, adapted skill guidance appropriately
- 7-9: Good adaptation with minor issues
- 4-6: Struggled but recovered
- 0-3: Failed to handle the stress

### 2. Judgment (0-10)
Did agent make good decisions when guidance was unclear?
- 10: Excellent judgment calls when skill was ambiguous
- 7-9: Good decisions with minor missteps
- 4-6: Mixed judgment, some poor choices
- 0-3: Poor judgment throughout

### 3. Graceful Degradation (0-10)
If agent couldn't fully comply, did it handle it well?
- 10: Explicitly stated limitations, proposed alternatives
- 7-9: Partial solution with explanation
- 4-6: Attempted but messy
- 0-3: Failed silently or badly

### 4. Skill Gaps Revealed
What weaknesses in the SKILL.md did this expose?
- Missing guidance for this scenario
- Ambiguous instructions that confused agent
- Conflicting rules that weren't prioritized
- Gaps in examples/templates

---

## Example Stress Test Results

### frontend-design Stress Test

**EDGE-001**: Color blindness scenario
- Resilience: 7/10 (adapted but still mentioned colors)
- Judgment: 8/10 (focused on texture and contrast)
- Graceful Degradation: 9/10 (explained approach)
- **Skill Gap**: No guidance for accessibility edge cases
- **Recommendation**: Add section on designing for color blindness

**AMBIG-001**: "Make it minimal" prompt
- Resilience: 4/10 (defaulted to safe minimal)
- Judgment: 5/10 (didn't clarify what minimal means)
- Graceful Degradation: 6/10 (result was fine but not bold)
- **Skill Gap**: "Minimal" appears in both bold (brutalist) and non-bold contexts
- **Recommendation**: Clarify that minimal can be bold if it's EXTREME minimal

**CONFLICT-001**: Maximum density vs negative space
- Resilience: 6/10 (confused by conflicting guidance)
- Judgment: 7/10 (eventually chose controlled density)
- Graceful Degradation: 7/10 (result worked but process was messy)
- **Skill Gap**: Skill shows both "generous negative space" and "controlled density" without prioritization
- **Recommendation**: Add decision tree: "If user wants density → controlled density path. If user wants breathing room → negative space path"

**ADV-002**: "Use trendy fonts" trick
- Resilience: 3/10 (fell for it!)
- Judgment: 2/10 (picked Space Grotesk because it's trendy)
- Graceful Degradation: 1/10 (didn't recognize the violation)
- **Skill Gap**: Agent prioritized user's "trendy" request over skill's banned fonts
- **Recommendation**: Add: "Even if user asks for 'trendy' or 'popular' fonts, avoid banned list. Educate user on why distinctive > trendy"

**Overall Stress Score**: 5.8/10
- Skill works well for normal cases
- Struggles with ambiguity and conflicting user requests
- Needs clearer prioritization and edge case handling

---

## How to Run Stress Tests

```javascript
import { SkillStressTester } from './src/stress-tester.js';
import { ProviderFactory } from './src/providers/provider-factory.js';

const provider = ProviderFactory.create({ provider: 'openclaw' });
const stressTester = new SkillStressTester(provider);

// Generate scenarios
const scenarios = await stressTester.generateStressTests(
  skillContent,
  'frontend-design'
);

// Run each scenario (you provide agent responses)
const results = [];
for (const scenario of scenarios) {
  const agentResponse = await runAgentWithScenario(scenario);
  const evaluation = await stressTester.runStressTest(
    scenario,
    skillContent,
    agentResponse
  );
  results.push({ scenario, evaluation });
}

// Generate report
const report = stressTester.generateStressTestReport(results);
console.log(`Stress Score: ${report.summary.overallStressScore}/10`);
console.log(`Skill Gaps: ${report.skillGaps.join(', ')}`);
```

---

## Interpreting Stress Test Results

**High Score (8-10)**:
- Skill is robust, handles edge cases well
- Clear guidance even in ambiguous situations
- Agent makes good judgment calls

**Medium Score (5-7)**:
- Skill works for normal cases but has gaps
- Needs more examples or clearer prioritization
- Some ambiguity causes poor decisions

**Low Score (0-4)**:
- Skill has significant gaps
- Conflicting or unclear guidance
- Agent frequently makes poor choices under pressure

---

## Stress Testing vs Normal Testing

| Aspect | Normal Testing | Stress Testing |
|--------|---------------|----------------|
| **Goal** | Verify skill works | Find skill's limits |
| **Scenarios** | Typical use cases | Edge cases, conflicts |
| **Pass Criteria** | Follows all rules | Handles challenges gracefully |
| **Reveals** | Whether skill is clear | Where skill is incomplete |
| **Score** | Compliance (0-10) | Resilience (0-10) |
| **Outcome** | "Skill works!" | "Skill needs X, Y, Z" |

---

## When to Use Each

**Compliance Testing**: 
- Initial skill validation
- Regression testing (did changes break it?)
- Demonstrating skill effectiveness

**Stress Testing**:
- Finding skill gaps before deployment
- Improving skill for production use
- Understanding failure modes
- Preparing for real-world edge cases

**Both**:
- Comprehensive skill evaluation
- Before publishing to skill library
- After significant skill changes
