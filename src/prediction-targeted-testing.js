/**
 * Prediction-Targeted Testing
 * 
 * Uses Round 1 followability predictions to generate Round 2 test scenarios
 * that specifically exploit predicted weaknesses.
 * 
 * Validates predictions and provides targeted evidence of failures.
 */

export class PredictionTargetedTesting {
  /**
   * Generate test scenarios based on Round 1 predictions
   * @param {Object} round1Report - Complete Round 1 report
   * @param {string} skillContent - SKILL.md content
   * @returns {Array} Test scenarios targeting predicted failures
   */
  generateTargetedScenarios(round1Report, skillContent) {
    const predictions = round1Report.phases['1c_followability'].predictions || [];
    const targetedScenarios = [];

    // Filter high-probability predictions
    const highRiskPredictions = predictions.filter(p => p.probability >= 0.6);

    console.log(`\n🎯 Generating targeted tests for ${highRiskPredictions.length} high-risk predictions...\n`);

    highRiskPredictions.forEach((prediction, idx) => {
      const scenario = this._generateScenarioForPrediction(prediction, skillContent, idx);
      if (scenario) {
        targetedScenarios.push(scenario);
      }
    });

    return targetedScenarios;
  }

  _generateScenarioForPrediction(prediction, skillContent, idx) {
    const generators = {
      'Context Window Issues': this._generateMiddleContentTest.bind(this),
      'LLM Attention Patterns': this._generateNegationTest.bind(this),
      'Position Bias': this._generateListBiasTest.bind(this),
      'Cognitive Load': this._generateOverloadTest.bind(this),
      'Buried Requirements': this._generateBuriedRequirementTest.bind(this)
    };

    const generator = generators[prediction.checkName];
    if (generator) {
      return generator(prediction, skillContent, idx);
    }

    return null;
  }

  /**
   * Test: Middle content forgotten
   */
  _generateMiddleContentTest(prediction, skillContent, idx) {
    // Extract the actual requirement that's in the middle
    const requirement = prediction.requirement;

    return {
      id: `TARGETED-MIDDLE-${idx + 1}`,
      type: 'prediction-targeted',
      targetedPrediction: {
        checkName: prediction.checkName,
        probability: prediction.probability,
        reason: prediction.reason
      },
      userPrompt: this._createPromptRequiringMiddleContent(skillContent),
      expectedBehavior: `Agent should follow: ${requirement}`,
      predictedFailure: `Agent will forget this requirement (${(prediction.probability * 100).toFixed(0)}% likely)`,
      requirementToCheck: requirement,
      validationCriteria: [
        'Agent remembered middle-positioned requirement',
        'Requirement was correctly applied in response'
      ]
    };
  }

  _createPromptRequiringMiddleContent(skillContent) {
    // For frontend-design: create scenario that requires bold aesthetic (middle requirement)
    return "Create a landing page for a meditation app. The client wants something unique and memorable.";
  }

  /**
   * Test: Negations missed
   */
  _generateNegationTest(prediction, skillContent, idx) {
    // Find the negations in skill
    const negations = this._extractNegations(skillContent);

    return {
      id: `TARGETED-NEGATION-${idx + 1}`,
      type: 'prediction-targeted',
      targetedPrediction: {
        checkName: prediction.checkName,
        probability: prediction.probability,
        reason: prediction.reason
      },
      userPrompt: this._createPromptTestingNegations(negations),
      expectedBehavior: 'Agent should NOT use banned items (negations)',
      predictedFailure: `Agent will miss negations and use banned items (${(prediction.probability * 100).toFixed(0)}% likely)`,
      negationsToCheck: negations.slice(0, 3),
      validationCriteria: [
        'Agent did not use any banned fonts',
        'Agent did not use purple gradients',
        'Agent respected all negations'
      ]
    };
  }

  _extractNegations(skillContent) {
    const negations = [];
    const negationPatterns = [
      /DON'T\s+use\s+([^.]+)/gi,
      /NEVER\s+use\s+([^.]+)/gi,
      /AVOID\s+([^.]+)/gi
    ];

    negationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(skillContent)) !== null) {
        negations.push({
          type: match[0].split(' ')[0], // DON'T, NEVER, AVOID
          item: match[1].trim()
        });
      }
    });

    return negations;
  }

  _createPromptTestingNegations(negations) {
    // Craft prompt that naturally leads to banned items
    // For frontend-design: prompt that might trigger Inter or purple gradient
    return "Create a professional corporate landing page for a SaaS startup. " +
           "Make it modern and clean with a nice gradient background.";
  }

  /**
   * Test: Position bias in lists
   */
  _generateListBiasTest(prediction, skillContent, idx) {
    return {
      id: `TARGETED-LIST-${idx + 1}`,
      type: 'prediction-targeted',
      targetedPrediction: {
        checkName: prediction.checkName,
        probability: prediction.probability,
        reason: prediction.reason
      },
      userPrompt: "Create a portfolio website. Choose appropriate fonts and styles.",
      expectedBehavior: 'Agent should consider all font options, not just first/last',
      predictedFailure: `Agent will only pick fonts from start/end of list (${(prediction.probability * 100).toFixed(0)}% likely)`,
      validationCriteria: [
        'Font choice is not just first in list',
        'Agent considered middle options'
      ]
    };
  }

  /**
   * Test: Cognitive overload
   */
  _generateOverloadTest(prediction, skillContent, idx) {
    return {
      id: `TARGETED-OVERLOAD-${idx + 1}`,
      type: 'prediction-targeted',
      targetedPrediction: {
        checkName: prediction.checkName,
        probability: prediction.probability,
        reason: prediction.reason
      },
      userPrompt: "Create a complete design system: landing page + dashboard + mobile app UI. " +
                  "Follow all design requirements.",
      expectedBehavior: 'Agent should follow all requirements despite complexity',
      predictedFailure: `Agent will miss ${Math.ceil(prediction.probability * 5)} of ~${Math.ceil(this._countRequirements(skillContent))} requirements`,
      validationCriteria: [
        'All critical requirements followed',
        'No requirements missed due to overload'
      ]
    };
  }

  _countRequirements(skillContent) {
    return (skillContent.match(/\b(MUST|SHOULD|REQUIRED|ALWAYS|NEVER)\b/gi) || []).length;
  }

  /**
   * Test: Buried requirements
   */
  _generateBuriedRequirementTest(prediction, skillContent, idx) {
    return {
      id: `TARGETED-BURIED-${idx + 1}`,
      type: 'prediction-targeted',
      targetedPrediction: {
        checkName: prediction.checkName,
        probability: prediction.probability,
        reason: prediction.reason
      },
      userPrompt: "Design an e-commerce product page with strong visual hierarchy.",
      expectedBehavior: 'Agent should follow requirements even if buried in prose',
      predictedFailure: `Agent will skip requirements hidden in paragraphs (${(prediction.probability * 100).toFixed(0)}% likely)`,
      requirementToCheck: prediction.requirement,
      validationCriteria: [
        'Buried requirement was not missed',
        'All paragraph-embedded rules followed'
      ]
    };
  }

  /**
   * Mix targeted scenarios with normal compliance scenarios
   */
  mixScenarios(targetedScenarios, normalScenarios) {
    // Interleave targeted and normal tests
    const mixed = [];
    const maxLength = Math.max(targetedScenarios.length, normalScenarios.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < normalScenarios.length) {
        mixed.push({ ...normalScenarios[i], type: 'normal-compliance' });
      }
      if (i < targetedScenarios.length) {
        mixed.push(targetedScenarios[i]);
      }
    }

    return mixed;
  }

  /**
   * Analyze results: which predictions were validated?
   */
  analyzeValidation(results, round1Report) {
    const predictions = round1Report.phases['1c_followability'].predictions || [];
    const targetedResults = results.filter(r => r.scenario.type === 'prediction-targeted');

    const validation = {
      totalPredictions: predictions.filter(p => p.probability >= 0.6).length,
      testedPredictions: targetedResults.length,
      validatedPredictions: 0,
      invalidatedPredictions: 0,
      details: []
    };

    targetedResults.forEach(result => {
      const prediction = result.scenario.targetedPrediction;
      const score = result.evaluation?.score || 0;
      const violated = result.evaluation?.violated || false;

      // If agent failed (score < 7) and we predicted failure (prob > 0.6)
      const predicted = prediction.probability >= 0.6;
      const actuallyFailed = score < 7 || violated;

      const validated = (predicted && actuallyFailed) || (!predicted && !actuallyFailed);

      if (validated) {
        validation.validatedPredictions++;
      } else {
        validation.invalidatedPredictions++;
      }

      validation.details.push({
        scenarioId: result.scenario.id,
        checkName: prediction.checkName,
        predicted: `${(prediction.probability * 100).toFixed(0)}% failure`,
        actual: actuallyFailed ? `Failed (${score}/10)` : `Passed (${score}/10)`,
        validated: validated ? '✅' : '❌',
        reason: validated 
          ? 'Prediction matched outcome'
          : `Prediction said ${predicted ? 'fail' : 'pass'}, but actually ${actuallyFailed ? 'failed' : 'passed'}`
      });
    });

    validation.accuracy = validation.testedPredictions > 0
      ? (validation.validatedPredictions / validation.testedPredictions * 100).toFixed(1)
      : 0;

    return validation;
  }

  /**
   * Generate report comparing predictions vs actual results
   */
  generateValidationReport(validation, round1Report, round2Report) {
    return {
      summary: {
        predictionAccuracy: `${validation.accuracy}%`,
        validatedCount: validation.validatedPredictions,
        invalidatedCount: validation.invalidatedPredictions,
        totalTestedPredictions: validation.testedPredictions
      },
      predictionValidation: validation.details,
      insights: this._generateInsights(validation, round1Report, round2Report),
      recommendation: this._generateRecommendation(validation)
    };
  }

  _generateInsights(validation, round1Report, round2Report) {
    const insights = [];

    // High accuracy means predictions are reliable
    if (validation.accuracy >= 80) {
      insights.push({
        type: 'success',
        message: `High prediction accuracy (${validation.accuracy}%) - followability analysis is reliable`
      });
    } else if (validation.accuracy < 60) {
      insights.push({
        type: 'warning',
        message: `Low prediction accuracy (${validation.accuracy}%) - predictions may need calibration`
      });
    }

    // Check if predicted failures actually happened
    const validated = validation.details.filter(d => d.validated === '✅');
    const failurePredictions = validated.filter(d => d.actual.includes('Failed'));

    if (failurePredictions.length > 0) {
      insights.push({
        type: 'evidence',
        message: `${failurePredictions.length} predicted failures confirmed - followability issues are real`,
        examples: failurePredictions.map(f => ({
          issue: f.checkName,
          predicted: f.predicted,
          actual: f.actual
        }))
      });
    }

    return insights;
  }

  _generateRecommendation(validation) {
    if (validation.accuracy >= 80 && validation.validatedPredictions > 0) {
      return 'Round 1 predictions are highly accurate. Fix predicted issues before deployment to prevent failures.';
    } else if (validation.accuracy >= 60) {
      return 'Round 1 predictions are moderately accurate. Address high-probability issues.';
    } else {
      return 'Prediction accuracy is low. Manual review recommended. Predictions may need recalibration.';
    }
  }
}
