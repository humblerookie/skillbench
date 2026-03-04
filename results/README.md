# Evaluation Results

This directory contains skill evaluation reports organized by skill name.

## Structure

```
results/
├── README.md (this file)
└── <skill-name>/
    ├── <timestamp>-evaluation.json
    └── <timestamp>-full-evaluation.json
```

## Example

```
results/
└── frontend-design/
    ├── frontend-design-evaluation.json
    └── frontend-design-full-evaluation.json
```

## Report Format

Each evaluation report contains:

- `skillName`: Name of the evaluated skill
- `evaluator`: Version, provider, model, timestamp
- `summary`: Overall statistics (average score, pass rate, violations)
- `scoreDistribution`: Score breakdown (0-4, 5-6, 7-8, 9-10)
- `byCategory`: Scores by requirement category
- `evaluations`: Detailed per-test results with evidence
- `conclusion`: Skill quality assessment and recommendations

## Viewing Reports

```bash
# View summary
cat results/<skill-name>/*-evaluation.json | jq '.summary'

# View all scores
cat results/<skill-name>/*-evaluation.json | jq '.evaluations[] | {testId, score, status}'

# View violations
cat results/<skill-name>/*-evaluation.json | jq '.evaluations[] | select(.violated == true)'
```

## Adding New Results

When running evaluations, use the `results/<skill-name>/` path for output:

```javascript
const report = await evaluator.evaluate({
  skillPath: './path/to/SKILL.md',
  outputPath: `results/${skillName}/evaluation-${Date.now()}.json`
});
```

## CI/CD Integration

Results can be used for:
- Regression testing (compare scores over time)
- Model comparison (same skill, different providers)
- Skill quality tracking (monitor compliance rates)
- Documentation (showcase skill effectiveness)

---

**Current Results:**
- `frontend-design/` - Anthropic's frontend design skill (5 tests, 9.8/10 avg)
