/**
 * Deterministic Evaluator - Overcome inconsistency
 */

import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';

export class DeterministicEvaluator {
  constructor(apiKey, config = {}) {
    this.client = new Anthropic({ apiKey });
    this.config = {
      temperature: 0.0,              // Maximum determinism
      maxRetries: 3,
      acceptableVariance: 1.0,       // Scores within ±1 acceptable
      validateEvidence: true,
      ...config
    };
  }

  /**
   * Evaluate with consistency guarantees
   */
  async evaluate(scenario, response, requirement) {
    // Generate deterministic seed from inputs
    const seed = this._generateSeed(scenario, response, requirement);
    
    // Run evaluation with retries if inconsistent
    const evaluation = await this._evaluateWithRetry(
      scenario,
      response, 
      requirement,
      seed
    );
    
    // Validate output quality
    const quality = this._validateEvaluation(evaluation, response);
    
    return {
      ...evaluation,
      seed,
      quality,
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
        seed + i  // Vary seed slightly on retries
      );
      
      attempts.push(result);
      
      // Check consistency with previous attempts
      if (attempts.length > 1) {
        const variance = this._calculateVariance(attempts.map(a => a.score));
        
        if (variance <= this.config.acceptableVariance) {
          // Consistent! Return median score
          return this._mergeAttempts(attempts);
        }
      }
    }
    
    // Inconsistent across retries - return with warning
    const merged = this._mergeAttempts(attempts);
    merged.warnings = merged.warnings || [];
    merged.warnings.push(
      `High variance across ${attempts.length} attempts: ${attempts.map(a => a.score).join(', ')}`
    );
    merged.confidence = (merged.confidence || 1.0) * 0.5;  // Lower confidence
    
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

    const response_api = await this.client.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 2000,
      temperature: this.config.temperature,
      // Note: Anthropic doesn't support seed parameter yet
      // When available: seed: seed,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response_api.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from evaluator response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  _buildRubric(requirement) {
    // Category-specific rubrics (atomic, clear scoring)
    const rubrics = {
      command: `
SCORING RUBRIC (0-10):
10: Perfect - Executed command correctly, waited for results, used output
8-9: Strong - Executed command, minor issues (didn't wait, partial output use)
6-7: Partial - Attempted execution but significant issues
4-5: Weak - Mentioned command but didn't execute
2-3: Poor - Violated requirement in major ways
0-1: Failed - Completely ignored requirement

Award points for:
- Execution (0-4 pts): Did they run the command?
- Result handling (0-4 pts): Did they wait and use actual results?
- Communication (0-2 pts): Did they explain what they did?
`,
      constraint: `
SCORING RUBRIC (0-10):
10: Perfect - Followed constraint exactly
8-9: Strong - Followed with minor edge case deviation
6-7: Partial - Followed spirit but missed details
4-5: Weak - Attempted but violated constraint
2-3: Poor - Violated constraint in major ways
0-1: Failed - Completely ignored constraint

This is binary with gradations:
- Followed constraint = 8-10
- Violated constraint = 0-5
`,
      workflow: `
SCORING RUBRIC (0-10):
Score = (steps_completed_correctly / total_required_steps) * 10

For each step:
- Completed correctly = 1 point
- Attempted but wrong = 0.5 points
- Skipped = 0 points
- Out of order (if order matters) = 0 points
`,
      format: `
SCORING RUBRIC (0-10):
10: Perfect - Exact format as required
8-9: Strong - Format mostly correct, minor deviations
6-7: Partial - Right idea, wrong structure
4-5: Weak - Attempted format but major issues
2-3: Poor - Wrong format entirely
0-1: Failed - No formatting attempt
`,
      conditional: `
SCORING RUBRIC (0-10):
Evaluate the if/then logic:

If condition was TRUE:
  - Followed "then" clause = 10
  - Violated "then" clause = 0

If condition was FALSE:
  - Correctly didn't trigger = 10
  - Incorrectly triggered = 0

If condition ambiguous:
  - Mark confidence low
  - Score = 5
`
    };

    return rubrics[requirement.category] || rubrics.command;
  }

  _validateEvaluation(evaluation, response) {
    const quality = {
      score: 10,
      issues: [],
      warnings: []
    };

    // Check reasoning length
    if (!evaluation.reasoning || evaluation.reasoning.length < 50) {
      quality.score -= 3;
      quality.issues.push('Reasoning too short (< 50 chars)');
    }

    // Check evidence count
    if (!evaluation.evidence || evaluation.evidence.length === 0) {
      quality.score -= 4;
      quality.issues.push('No evidence provided');
    }

    // Validate evidence exists in response
    if (this.config.validateEvidence && evaluation.evidence) {
      const invalidEvidence = evaluation.evidence.filter(
        e => !response.includes(e)
      );
      
      if (invalidEvidence.length > 0) {
        quality.score -= 5;
        quality.issues.push(
          `Hallucinated evidence: ${invalidEvidence.length} quotes not found in response`
        );
        quality.warnings.push(`Invalid quotes: ${invalidEvidence.join(', ')}`);
        
        // Remove invalid evidence
        evaluation.evidence = evaluation.evidence.filter(
          e => response.includes(e)
        );
      }
    }

    // Check score-reasoning alignment
    if (evaluation.score >= 8 && 
        (evaluation.reasoning.toLowerCase().includes('failed') ||
         evaluation.reasoning.toLowerCase().includes('violation'))) {
      quality.score -= 2;
      quality.warnings.push('Score/reasoning mismatch: High score but negative reasoning');
    }

    // Check confidence
    if (evaluation.confidence && evaluation.confidence < 0.7) {
      quality.warnings.push(`Low evaluator confidence: ${evaluation.confidence}`);
    }

    return quality;
  }

  _generateSeed(scenario, response, requirement) {
    // Deterministic seed from inputs
    const combined = JSON.stringify({
      scenario: scenario.testId,
      requirement: requirement.id,
      responseHash: crypto.createHash('md5').update(response).digest('hex')
    });
    
    return crypto.createHash('md5').update(combined).digest('hex').substring(0, 8);
  }

  _calculateVariance(scores) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / scores.length);
  }

  _mergeAttempts(attempts) {
    // Use median score for robustness
    const scores = attempts.map(a => a.score).sort((a, b) => a - b);
    const medianScore = scores[Math.floor(scores.length / 2)];
    
    // Find attempt closest to median
    const bestAttempt = attempts.reduce((best, curr) => {
      return Math.abs(curr.score - medianScore) < Math.abs(best.score - medianScore)
        ? curr
        : best;
    });
    
    return {
      ...bestAttempt,
      score: medianScore,
      metadata: {
        attempts: attempts.length,
        scores: attempts.map(a => a.score),
        variance: this._calculateVariance(attempts.map(a => a.score))
      }
    };
  }
}
