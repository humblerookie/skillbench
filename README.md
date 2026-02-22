# Evalanche

**Production-ready skill evaluation framework for Claude agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)

Evaluate Claude agent skill compliance with LLM-as-judge scoring that actually works.

---

## Why Evalanche?

**Problem**: Basic LLM-as-judge evaluators are unreliable:
- 🎲 Inconsistent scores (same input → different outputs)
- 🤥 Evidence hallucination (citing quotes that don't exist)
- 🏷️ Keyword bias (scoring mentions instead of execution)
- ❓ No ground truth (can't validate the validator)

**Solution**: Evalanche applies the same rigor to evaluators that we apply to agents:
- ✅ Deterministic execution (temperature 0, retries, median scoring)
- ✅ Evidence grounding (exact quote validation)
- ✅ Regression testing (calibration against known cases)
- ✅ Version control (reproducible evaluations)
- ✅ Self-validation (continuous health monitoring)

---

## Quick Start

```bash
npm install evalanche
```

```javascript
import { SkillEvaluatorV2 } from 'evalanche';

const evaluator = new SkillEvaluatorV2(process.env.ANTHROPIC_API_KEY);

const report = await evaluator.evaluate({
  skillPath: '/path/to/SKILL.md',
  runnerType: 'api'
});

console.log(`Average Score: ${report.summary.averageScore}/10`);
console.log(`Pass Rate: ${report.summary.passRate}`);
```

---

## Features

### 🎯 Deterministic Evaluation

```javascript
// Before: [8, 5, 9, 6, 7] ❌ High variance
// After:  [8, 8, 9, 8, 8] ✅ Variance < 1.0
```

Temperature 0, retry mechanism, median scoring ensure consistency.

### 🔍 Evidence Validation

```javascript
// Hallucinated evidence automatically detected and removed
quality: {
  issues: ["Hallucinated evidence: 1 quote not found in response"],
  score: 5  // Quality score lowered
}
```

### 📊 Calibration System

```bash
✓ CAL-PERFECT-001: Score 10 (expected 10±1)
✓ CAL-VIOLATION-001: Score 0 (expected 0±1)

Status: PASS (5/5 cases)
Avg drift: 0.3
```

### 🏥 Self-Diagnostics

```bash
$ npm run health

✓ Consistency: PASS (variance 0.2)
✓ Calibration: PASS (5/5)
✓ Evidence: PASS
✓ Drift: STABLE

EVALUATOR HEALTH: HEALTHY
```

---

## Documentation

- **[Wiki Home](https://github.com/humblerookie/evalanche/wiki)** - Complete documentation
- **[Getting Started](https://github.com/humblerookie/evalanche/wiki/Getting-Started)** - Installation and first evaluation
- **[Architecture](https://github.com/humblerookie/evalanche/wiki/Architecture)** - How Evalanche works
- **[Solutions](https://github.com/humblerookie/evalanche/wiki/Solutions)** - How we overcome evaluator failure modes
- **[API Reference](https://github.com/humblerookie/evalanche/wiki/API-Reference)** - Complete API docs
- **[Examples](https://github.com/humblerookie/evalanche/wiki/Examples)** - Usage patterns

---

## Installation

```bash
npm install evalanche
```

**Requirements:**
- Node.js 18.0.0 or higher
- Anthropic API key

---

## Basic Usage

### Run Evaluation

```javascript
import { SkillEvaluatorV2 } from 'evalanche';

const evaluator = new SkillEvaluatorV2(process.env.ANTHROPIC_API_KEY);

const report = await evaluator.evaluate({
  skillPath: './SKILL.md',
  runnerType: 'api',
  scenariosPerRequirement: 2,
  outputPath: 'report.json'
});
```

### Health Check

```javascript
const health = await evaluator.runDiagnostics();

if (health.overallStatus === 'HEALTHY') {
  // Proceed with evaluation
}
```

### View Results

```javascript
console.log(`Average Score: ${report.summary.averageScore}/10`);
console.log(`Pass Rate: ${report.summary.passRate}`);
console.log(`Violations: ${report.summary.violations}`);
```

---

## Use Cases

1. **Skill Development** - Test if your SKILL.md is clear and followable
2. **Model Comparison** - Compare Sonnet 4.5 vs Opus 4 skill compliance
3. **Regression Testing** - Ensure skill updates don't break compliance
4. **CI/CD Integration** - Fail builds if skill quality drops

---

## Output Format

```json
{
  "skillName": "healthcheck",
  "summary": {
    "totalTests": 24,
    "averageScore": "8.3",
    "passRate": "87.5%",
    "violations": 3
  },
  "evaluations": [
    {
      "testId": "CMD-001-T1",
      "score": 8,
      "reasoning": "Agent ran audit but didn't wait for results",
      "evidence": ["Executed: openclaw security audit"],
      "improvements": ["Wait for audit completion"]
    }
  ]
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SkillEvaluatorV2                       │
├─────────────────────────────────────────────────────────┤
│  DeterministicEvaluator  │  RubricManager               │
│  CalibrationSystem       │  ScenarioGenerator           │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- **Parser**: Extract testable requirements from SKILL.md
- **Generator**: Create test scenarios (LLM-generated)
- **Runner**: Execute tests against agent
- **Evaluator**: Score compliance with safeguards
- **Calibration**: Regression tests & drift detection
- **Rubrics**: Version-controlled scoring guides

---

## Key Innovations

### 1. Deterministic Scoring
- Temperature 0.0
- Retry with variance check
- Median scoring across attempts

### 2. Evidence Grounding
- Exact quote validation
- Auto-removal of hallucinations
- Quality scoring

### 3. Calibration
- Locked test cases
- Regression testing
- Drift detection

### 4. Versioned Rubrics
- Semantic versioning
- Content hashing
- Change tracking

---

## Examples

### Model Comparison

```javascript
const models = ['claude-sonnet-4', 'claude-opus-4'];
for (const model of models) {
  const report = await evaluator.evaluate({ model });
  console.log(`${model}: ${report.summary.averageScore}/10`);
}
```

### CI/CD Integration

```javascript
const report = await evaluator.evaluate({ skillPath: './SKILL.md' });

if (parseFloat(report.summary.averageScore) < 8.0) {
  console.error('Skill quality below threshold');
  process.exit(1);
}
```

See **[Examples](https://github.com/humblerookie/evalanche/wiki/Examples)** for more.

---

## Development

```bash
# Clone
git clone https://github.com/humblerookie/evalanche.git
cd evalanche

# Install
npm install

# Run demo
npm run demo

# Health check
export ANTHROPIC_API_KEY=sk-ant-...
npm run health

# Run tests
npm test
```

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Update documentation
5. Submit a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Status

- **Version**: 2.0.0
- **Status**: Production-ready ✅
- **Dependencies**: @anthropic-ai/sdk ^0.78.0
- **Node**: >=18.0.0

---

## Credits

Built with Claude Sonnet 4, Node.js, and the Anthropic SDK.

**Repository**: https://github.com/humblerookie/evalanche  
**Wiki**: https://github.com/humblerookie/evalanche/wiki  
**Issues**: https://github.com/humblerookie/evalanche/issues
