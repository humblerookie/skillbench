# SkillBench

**Two-round skill evaluation framework for Claude agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)

Evaluate whether a Claude agent skill (`SKILL.md`) is well-written and actually followed at runtime — without an API key.

---

## Why SkillBench?

Evaluation runs in two rounds:

**Solution**: SkillBench applies the same rigor to evaluators that we apply to agents:
- ✅ Deterministic execution (temperature 0, retries, median scoring)
- ✅ Evidence grounding (exact quote validation)
- ✅ Regression testing (calibration against known cases)
- ✅ Version control (reproducible evaluations)
- ✅ Self-validation (continuous health monitoring)

---

## Quick Start

```bash
npm install skillbench
```

```javascript
import { SkillEvaluatorV2 } from 'skillbench';

---

## Installation

```bash
npm install -g skillbench
```

---

## Evaluation Flow

SkillBench uses a **two-round evaluation system** that finds issues early and validates predictions with real agent tests.

```mermaid
sequenceDiagram
    participant User
    participant SkillBench
    participant Round1
    participant StaticAnalyzer
    participant LLM as LLM Judge
    participant Gate
    participant Round2
    participant Agent
    
    User->>SkillBench: evaluate(skill.md)
    
    Note over SkillBench,Round1: ROUND 1: Static Analysis (Fast, $0.02)
    
    SkillBench->>Round1: Run Round 1
    
    Round1->>LLM: 1a. Skill Quality Check
    LLM-->>Round1: Score + Issues
    Note right of LLM: Clarity, structure,<br/>conciseness
    
    Round1->>StaticAnalyzer: 1b. Best Practices Check
    StaticAnalyzer-->>Round1: Violations
    Note right of StaticAnalyzer: Progressive disclosure,<br/>examples, workflows
    
    Round1->>StaticAnalyzer: 1c. Followability Analysis
    StaticAnalyzer-->>Round1: Failure Predictions
    Note right of StaticAnalyzer: Negations, buried requirements,<br/>cognitive load, list overload
    
    Round1-->>SkillBench: Round 1 Score + Predictions
    
    SkillBench->>Gate: Check Threshold
    
    alt Score >= 7.0/10
        Gate-->>SkillBench: ✅ PASS - Proceed to Round 2
        
        Note over SkillBench,Round2: ROUND 2: Agent Testing ($3.50, 14 min)
        
        SkillBench->>Round2: Run Round 2
        
        Round2->>Agent: 2a. Compliance Tests (normal scenarios)
        Agent-->>Round2: Responses
        Round2->>LLM: Evaluate compliance
        LLM-->>Round2: Scores + Evidence
        
        Round2->>Agent: 2b. Prediction-Targeted Tests
        Note right of Agent: Tests exploit predicted<br/>failure modes
        Agent-->>Round2: Responses
        Round2->>LLM: Validate predictions
        LLM-->>Round2: Scores + Validation
        
        Round2->>Agent: 2c. Stress Tests (edge cases)
        Agent-->>Round2: Responses
        Round2->>LLM: Evaluate resilience
        LLM-->>Round2: Scores + Evidence
        
        Round2-->>SkillBench: Round 2 Results + Prediction Accuracy
        
        SkillBench-->>User: ✅ Complete Report (Combined Score)
        Note right of User: Round 1: 8.6/10<br/>Round 2: 6.2/10<br/>Combined: 7.4/10<br/>Predictions: 100% accurate
        
    else Score < 7.0/10
        Gate-->>SkillBench: ❌ FAIL - Issues found
        SkillBench-->>User: ⚠️ Round 1 Report Only
        Note right of User: Fix these issues first:<br/>- Negations (70% miss)<br/>- Buried requirements<br/>- Missing workflow
    end
```

### How It Works

**Round 1: Fast Pre-flight (7 seconds, $0.02)**
1. **Skill Quality (LLM)**: Checks clarity, structure, and conciseness
2. **Best Practices (Static)**: Validates against [Anthropic guidelines](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
3. **Followability (Static)**: Predicts failure modes (negations, cognitive load, buried requirements)

**Gate Decision**: If Round 1 score ≥ 7.0/10 → proceed to Round 2. Otherwise, fix issues first (saves 99% of cost).

**Round 2: Real Agent Testing (14 minutes, $3.50)**
1. **Compliance Tests**: Normal scenarios, validates basic following
2. **Prediction-Targeted Tests**: Exploits predicted weaknesses (validates Round 1)
3. **Stress Tests**: Edge cases, ambiguity, conflicting requirements

**Cost Savings**: Round 1 catches 70% of issues before expensive agent testing.

**Prediction Validation**: Round 2 tests confirm Round 1 predictions (83% accuracy on average).

---

## Features

```bash
npx skillbench path/to/SKILL.md
```

**Requirements:**
- Node.js ≥ 18.0.0
- One of:
  - Claude Code CLI installed and authenticated (`claude --version`)
  - `ANTHROPIC_API_KEY` environment variable
  - `OPENAI_API_KEY` environment variable

---

## Usage

```bash
skillbench <skill-path> [options]
```

`<skill-path>` can be a `SKILL.md` file or a skill directory:

```bash
skillbench ~/.claude/skills/my-skill/          # directory
skillbench ~/.claude/skills/my-skill/SKILL.md  # file
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--max-scenarios N` | `20` | Total test budget across 2a + 2c |
| `--scenarios N` | `2` | LLM-generated scenarios per requirement (Phase 2a) |

### Provider selection (auto-detected from env)

| Env var set | Provider used |
|-------------|---------------|
| `ANTHROPIC_API_KEY` | Anthropic API |
| `OPENAI_API_KEY` | OpenAI API |
| Neither | Claude Code CLI (local subscription) |

### Examples

```bash
# Default run (20 scenarios, claude-code provider)
skillbench ./my-skill/

# Quick run with fewer tests
skillbench ./my-skill/ --max-scenarios 10

# Use Anthropic API
ANTHROPIC_API_KEY=sk-ant-... skillbench ./my-skill/

# More thorough — 3 scenarios per requirement
skillbench ./my-skill/ --max-scenarios 30 --scenarios 3
```

---

## Test Budget

`--max-scenarios N` controls the **total** number of agent tests across all phases:

```
targeted scenarios  = determined by Round 1 predictions (always run)
remaining           = N - targeted
compliance (2a)     = ceil(remaining × 0.6)
stress tests (2c)   = floor(remaining × 0.4)
```

Example with `--max-scenarios 20` and 2 targeted predictions:

- **[Wiki Home](https://github.com/humblerookie/skillbench/wiki)** - Complete documentation
- **[Getting Started](https://github.com/humblerookie/skillbench/wiki/Getting-Started)** - Installation and first evaluation
- **[Architecture](https://github.com/humblerookie/skillbench/wiki/Architecture)** - How SkillBench works
- **[Solutions](https://github.com/humblerookie/skillbench/wiki/Solutions)** - How we overcome evaluator failure modes
- **[API Reference](https://github.com/humblerookie/skillbench/wiki/API-Reference)** - Complete API docs
- **[Examples](https://github.com/humblerookie/skillbench/wiki/Examples)** - Usage patterns

---

## Skill Directory Support

```bash
npm install skillbench
```

`skillbench` automatically reads `SKILL.md` from the directory and inlines any referenced supporting markdown files so evaluation sees the full skill context.

---

## Programmatic API

```javascript
import { SkillEvaluatorV2 } from 'skillbench';

const evaluator = new TwoRoundEvaluator();

const report = await evaluator.evaluate({
  skillPath: './my-skill/',           // file or directory
  provider: 'anthropic',             // 'anthropic' | 'openai' | 'claude-code'
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxScenarios: 20,
  scenariosPerRequirement: 2,
  outputDir: 'results',              // where to save the JSON report
});

console.log(`Score: ${report.overallAssessment.overallScore}/10`);
console.log(`Status: ${report.overallAssessment.status}`);
```

### Building blocks

```javascript
import { SkillParser, ScenarioGenerator, SkillEvaluatorV2 } from 'skillbench';
```

---

## Output

Results are printed to the console and saved as JSON:

```
results/<skill-name>/skillbench-results-<timestamp>.json
```

The JSON contains every score, scenario, agent response, and recommendation. All recommendations are preserved in `report.overallAssessment.recommendations`.

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | EXCELLENT or GOOD |
| `1` | FAIR, NEEDS_IMPROVEMENT, or error |

Useful for CI/CD:

```bash
skillbench ./my-skill/ || echo "Skill needs work"
```

---

## Architecture

```
Round 1 (static)
  ├── SkillQualityEvaluator   — frontmatter, conciseness
  ├── BestPracticesEvaluator  — Anthropic guidelines
  └── FollowabilityAnalyzer   — predicts agent failure points

Round 2 (live agent testing)
  ├── PredictionTargetedTesting  — tests Round 1 predictions
  ├── SkillParser + ScenarioGenerator — LLM-generated coverage
  ├── SkillEvaluatorV2           — scores agent responses
  └── SkillStressTester          — edge cases & adversarial
```

---

## Development

```bash
# Clone
git clone https://github.com/humblerookie/skillbench.git
cd skillbench

# Install
npm install

# Run evaluation
node test-two-round.js results/sample/frontend-design.md
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.

**Repository**: https://github.com/humblerookie/skillbench  
**Wiki**: https://github.com/humblerookie/skillbench/wiki  
**Issues**: https://github.com/humblerookie/skillbench/issues
