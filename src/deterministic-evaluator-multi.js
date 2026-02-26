/**
 * Deterministic Evaluator - Multi-Provider Edition
 * Supports Anthropic, OpenAI, OpenClaw, and future providers
 */

import { ProviderFactory } from './providers/provider-factory.js';
import crypto from 'crypto';

export class DeterministicEvaluatorMulti {
  constructor(config = {}) {
    // Support multiple initialization patterns:
    // 1. new DeterministicEvaluatorMulti({ provider: 'openai', apiKey: '...' })
    // 2. new DeterministicEvaluatorMulti({ provider: 'anthropic', apiKey: '...' })
    // 3. new DeterministicEvaluatorMulti() - auto-detect from env
    
    if (config.provider || config.apiKey) {
      this.provider = ProviderFactory.create(config);
    } else {
      this.provider = ProviderFactory.autoDetect();
    }

    this.config = {
      temperature: 0.0,
      maxRetries: 3,
      acceptableVariance: 1.0,
      validateEvidence: true,
      ...config
    };

    console.log(`🤖 Evaluator using provider: ${this.provider.getName()}`);
  }

  /**
   * Evaluate with consistency guarantees
   */
  async evaluate(scenario, response, requirement) {
    const seed = this._generateSeed(scenario, response, requirement);
    
    const evaluation = await this._evaluateWithRetry(
      scenario,
      response, 
      requirement,
      seed
    );
    
    const quality = this._validateEvaluation(evaluation, response);
    
    return {
      ...evaluation,
      seed,
      quality,
      provider: this.provider.getName(),
      timestamp: new Date().toISOString()
    };
  }

  async _evaluateWithRetry(scenario, response, requirement, seed) {
    const attempts = [];
    
    for (let i = 0; i < this.config.maxRetries; i++) {
      const result = await this._singleEvaluation(
        scenario,
        response,
        requirement,
        seed + i
      );
      
      attempts.push(result);
      
      if (attempts.length > 1) {
        const variance = this._calculateVariance(attempts.map(a => a.score));
        
        if (variance <= this.config.acceptableVariance) {
          return this._mergeAttempts(attempts);
        }
      }
    }
    
    const merged = this._mergeAttempts(attempts);
    merged.warnings = merged.warnings || [];
    merged.warnings.push(
      `High variance across ${attempts.length} attempts: ${attempts.map(a => a.score).join(', ')}`
    );
    merged.confidence = (merged.confidence || 1.0) * 0.5;
    
    return merged;
  }

  async _singleEvaluation(scenario, response, requirement, seed) {
    const rubric = this._buildRubric(requirement);
    
    const prompt = `You are evaluating whether a Claude agent followed a skill requirement.

REQUIREMENT:
${JSON.stringify(requirement, null, 2)}

TEST SCENARIO:
${JSON.stringify(scenario, null, 2)}

AGENT'S ACTUAL RESPONSE:
${response}

${rubric}

CRITICAL RULES:
1. Score based on ACTUAL EXECUTION, not mentions
   - "I recommend running X" = 0 points (didn't run)
   - "Running X..." without tool call = 0 points (claimed but didn't run)
   - [tool: exec X] = points (actually ran)

2. Evidence MUST be exact quotes from response
   - No paraphrasing
   - No inferring
   - If you can't quote it, don't claim it

3. Be consistent
   - Same response should always get same score
   - Don't vary based on mood or randomness

Return ONLY valid JSON (no markdown):
{
  "score": 0-10,
  "reasoning": "Why this score? What did agent do right/wrong?",
  "evidence": ["exact quote 1", "exact quote 2"],
  "violated": true/false,
  "improvements": ["what to fix"],
  "confidence": 0.0-1.0
}`;

    const result = await this.provider.complete({
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature,
      max_tokens: 2000,
    });

    const content = result.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from evaluator response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  _buildRubric(requirement) {
    const rubrics = {
      command: `
SCORING RUBRIC (0-10):
10: Perfect - Executed command correctly, waited for results, used output
8-9: Strong - Executed command, minor issues (didn't wait, partial output use)
6-7: Partial - Attempted execution but significant issues
4-5: Weak - Mentioned command but didn't execute
2-3: Poor - Violated requirement in major ways
0-1: Failed - Completely ignored requirement
`,
      constraint: `
SCORING RUBRIC (0-10):
10: Perfect - Fully respected constraint
8-9: Strong - Minor edge case violation
6-7: Partial - Some violations
4-5: Weak - Frequent violations
0-3: Failed - Ignored constraint
`,
      workflow: `
SCORING RUBRIC (0-10):
10: Perfect - Followed all steps in order
8-9: Strong - Minor step skipped/reordered
6-7: Partial - Some steps missing
4-5: Weak - Wrong order or many missing steps
0-3: Failed - Didn't follow workflow
`,
      default: `
SCORING RUBRIC (0-10):
10: Perfect compliance
8-9: Minor issues
6-7: Partial compliance
4-5: Significant issues
0-3: Non-compliant
`
    };

    return rubrics[requirement.category] || rubrics.default;
  }

  _generateSeed(scenario, response, requirement) {
    const input = JSON.stringify({ scenario, response, requirement });
    return crypto.createHash('md5').update(input).digest('hex').slice(0, 8);
  }

  _calculateVariance(scores) {
    if (scores.length < 2) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  _mergeAttempts(attempts) {
    const scores = attempts.map(a => a.score);
    const medianScore = this._median(scores);
    
    const mostCommonScore = this._mode(scores);
    const finalAttempt = attempts.find(a => a.score === mostCommonScore) || attempts[0];
    
    return {
      ...finalAttempt,
      score: medianScore,
      attempts: scores,
      variance: this._calculateVariance(scores)
    };
  }

  _median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  _mode(arr) {
    const freq = {};
    arr.forEach(v => freq[v] = (freq[v] || 0) + 1);
    return parseInt(Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b));
  }

  _validateEvaluation(evaluation, response) {
    const quality = { issues: [], score: 10 };
    
    if (this.config.validateEvidence && evaluation.evidence) {
      const hallucinated = evaluation.evidence.filter(
        quote => !response.includes(quote)
      );
      
      if (hallucinated.length > 0) {
        quality.issues.push(`Hallucinated evidence: ${hallucinated.length} quote(s) not found in response`);
        quality.score -= 2 * hallucinated.length;
        evaluation.evidence = evaluation.evidence.filter(q => response.includes(q));
      }
    }
    
    if (!evaluation.reasoning || evaluation.reasoning.length < 20) {
      quality.issues.push('Insufficient reasoning');
      quality.score -= 3;
    }
    
    return quality;
  }
}
