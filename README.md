# skillbench

**Two-round skill evaluation framework for Claude agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)

Evaluate whether a Claude agent skill (`SKILL.md`) is well-written and actually followed at runtime — without an API key.

---

## How it works

Evaluation runs in two rounds:

**Round 1 — Static Analysis** (fast, free)
- **1a. Skill Quality**: frontmatter, description, conciseness
- **1b. Best Practices**: Anthropic guidelines compliance
- **1c. Followability**: predicts where agents will fail before running any tests

**Round 2 — Agent Testing** (requires LLM calls)
- **2a. Compliance**: targeted tests from Round 1 predictions + LLM-generated scenario coverage
- **2b. Evaluator Validation**: confirms the grader is working correctly
- **2c. Stress Tests**: edge cases, ambiguity, adversarial prompts

---

## Quick Start

```bash
npx skillbench path/to/my-skill/
```

No API key required — uses your local Claude Code subscription by default.

---

## Installation

```bash
npm install -g skillbench
```

Or run without installing:

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

```
2a  Targeted (Round 1 predictions):  2
2a  Normal compliance:                up to 11
2c  Stress tests:                     up to 7
─────────────────────────────────────
Total:                                20
```

---

## Skill Directory Support

Skills can be a single file or a directory with supporting files:

```
my-skill/
├── SKILL.md           # required — main instructions
├── reference.md       # optional supporting file
└── examples/
    └── sample.md      # optional supporting file
```

`skillbench` automatically reads `SKILL.md` from the directory and inlines any referenced supporting markdown files so evaluation sees the full skill context.

---

## Programmatic API

```javascript
import { TwoRoundEvaluator } from 'skillbench';

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
results/<skill-name>/two-round-evaluation-<timestamp>.json
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
git clone https://github.com/humblerookie/evalanche.git
cd evalanche
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

**Repository**: https://github.com/humblerookie/evalanche
**Issues**: https://github.com/humblerookie/evalanche/issues
