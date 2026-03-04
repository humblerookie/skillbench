#!/bin/bash
# Test with Anthropic API (requires ANTHROPIC_API_KEY in environment)

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ Error: ANTHROPIC_API_KEY not set"
  echo ""
  echo "Set your API key first:"
  echo "  export ANTHROPIC_API_KEY='sk-ant-...'"
  echo ""
  echo "Then run:"
  echo "  ./test-with-anthropic.sh"
  exit 1
fi

# Modify test script to use Anthropic provider
node -e "
import('./test-two-round.js').then(async () => {
  const { TwoRoundEvaluator } = await import('./src/two-round-evaluator.js');
  const evaluator = new TwoRoundEvaluator();
  
  const report = await evaluator.evaluate({
    skillPath: '/tmp/skills/skills/frontend-design/SKILL.md',
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    outputDir: 'results'
  });
  
  process.exit(report.overallAssessment.status === 'EXCELLENT' || report.overallAssessment.status === 'GOOD' ? 0 : 1);
});
"
