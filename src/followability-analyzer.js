/**
 * Followability Analyzer
 * 
 * Predicts where agents are likely to fail based on:
 * - Context window position (primacy/recency effects)
 * - Instruction complexity and density
 * - Known LLM attention patterns
 * - Cognitive load factors
 * - Structural anti-patterns
 * 
 * This is PREDICTIVE - finds issues before running expensive tests.
 */

export class FollowabilityAnalyzer {
  constructor() {
    this.warnings = [];
    this.criticalIssues = [];
  }

  /**
   * Analyze skill for followability issues
   * @param {string} skillContent - SKILL.md content
   * @param {string} skillName - Skill name
   * @returns {Object} Analysis report with predicted failure points
   */
  analyze(skillContent, skillName) {
    console.log(`\n🔬 Analyzing followability for "${skillName}"...\n`);

    const analysis = {
      skillName,
      timestamp: new Date().toISOString(),
      checks: [],
      predictions: [],
      score: 0,
      summary: {}
    };

    // Parse structure
    const { frontmatter, body } = this._parseFrontmatter(skillContent);
    const structure = this._analyzeStructure(body);
    const tokens = this._estimateTokens(body);

    // Run all checks
    analysis.checks.push(this._checkContextWindowIssues(body, tokens));
    analysis.checks.push(this._checkPositionBias(body, structure));
    analysis.checks.push(this._checkCognitiveLoad(body, structure));
    analysis.checks.push(this._checkInstructionDensity(body, structure));
    analysis.checks.push(this._checkAttentionPatterns(body, structure));
    analysis.checks.push(this._checkBuriedRequirements(body, structure));
    analysis.checks.push(this._checkListOverload(body, structure));
    analysis.checks.push(this._checkNegationComplexity(body));
    analysis.checks.push(this._checkConditionalComplexity(body));
    analysis.checks.push(this._checkPrioritySignaling(body));

    // Generate predictions
    analysis.predictions = this._generatePredictions(analysis.checks);

    // Calculate followability score
    analysis.score = this._calculateFollowabilityScore(analysis.checks);

    // Summary
    analysis.summary = {
      followabilityScore: analysis.score,
      predictedFailurePoints: analysis.predictions.filter(p => p.severity === 'high').length,
      warnings: analysis.predictions.filter(p => p.severity === 'medium').length,
      totalIssues: analysis.predictions.length,
      mostLikelyFailures: analysis.predictions
        .filter(p => p.probability >= 0.6)
        .map(p => p.requirement)
    };

    return analysis;
  }

  _parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { frontmatter: {}, body: content };
    
    const [, yaml, body] = match;
    const frontmatter = {};
    yaml.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        frontmatter[key.trim()] = valueParts.join(':').trim();
      }
    });

    return { frontmatter, body };
  }

  _analyzeStructure(body) {
    const lines = body.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach((line, idx) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          level: headerMatch[1].length,
          title: headerMatch[2],
          startLine: idx,
          content: []
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    });
    if (currentSection) sections.push(currentSection);

    return {
      totalLines: lines.length,
      sections,
      listItems: (body.match(/^[\s]*[-*]\s+/gm) || []).length,
      codeBlocks: (body.match(/```/g) || []).length / 2,
      boldText: (body.match(/\*\*[^*]+\*\*/g) || []).length
    };
  }

  _estimateTokens(text) {
    // Rough estimate: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Check 1: Context Window Position Issues
   * LLMs have primacy (remember start) and recency (remember end) effects
   * Middle content gets forgotten ("lost in the middle" phenomenon)
   */
  _checkContextWindowIssues(body, tokens) {
    const issues = [];
    const lines = body.split('\n');
    const middleStart = Math.floor(lines.length * 0.3);
    const middleEnd = Math.floor(lines.length * 0.7);

    // Find critical requirements (MUST, NEVER, ALWAYS, CRITICAL)
    const criticalPattern = /\b(MUST|NEVER|ALWAYS|CRITICAL|REQUIRED)\b/gi;
    lines.forEach((line, idx) => {
      if (criticalPattern.test(line)) {
        const position = idx / lines.length;
        const inMiddle = idx >= middleStart && idx <= middleEnd;
        
        if (inMiddle) {
          issues.push({
            line: idx + 1,
            content: line.substring(0, 80),
            position: 'middle',
            risk: 'high',
            reason: 'Critical requirement in middle section (most likely to be forgotten)'
          });
        }
      }
    });

    // Token budget check
    if (tokens > 2000) {
      issues.push({
        type: 'token-budget',
        tokens,
        risk: 'medium',
        reason: `Skill is ${tokens} tokens. In crowded context, middle sections may be skimmed.`
      });
    }

    return {
      check: 'Context Window Issues',
      passed: issues.length === 0,
      severity: issues.some(i => i.risk === 'high') ? 'high' : 'medium',
      issues,
      recommendation: issues.length > 0
        ? 'Move critical requirements to top or bottom. Consider progressive disclosure.'
        : 'No position-based risks detected'
    };
  }

  /**
   * Check 2: Position Bias
   * First and last items get more attention than middle items
   */
  _checkPositionBias(body, structure) {
    const issues = [];
    
    // Check for long lists (>5 items)
    const listMatches = body.match(/(?:^|\n)((?:[-*]\s+.+\n?)+)/gm) || [];
    
    listMatches.forEach(listBlock => {
      const items = listBlock.trim().split('\n').filter(l => l.match(/^[-*]\s+/));
      
      if (items.length > 7) {
        issues.push({
          type: 'long-list',
          itemCount: items.length,
          risk: 'medium',
          reason: `List with ${items.length} items. Middle items (3-${items.length-2}) likely to be skipped.`,
          recommendation: 'Break into sub-lists, use progressive disclosure, or highlight critical items'
        });
      }
    });

    return {
      check: 'Position Bias',
      passed: issues.length === 0,
      severity: 'medium',
      issues,
      recommendation: issues.length > 0
        ? 'Lists over 7 items show "serial position effect" - middle items forgotten'
        : 'List lengths are manageable'
    };
  }

  /**
   * Check 3: Cognitive Load
   * Too many requirements to track simultaneously
   */
  _checkCognitiveLoad(body, structure) {
    const issues = [];

    // Count distinct requirements
    const requirements = [
      ...body.matchAll(/\b(MUST|SHOULD|REQUIRED|ALWAYS|NEVER)\b/gi)
    ].length;

    // Human working memory: ~7±2 items
    // LLMs similar constraint when tracking rules
    if (requirements > 12) {
      issues.push({
        type: 'requirement-overload',
        count: requirements,
        risk: 'high',
        reason: `${requirements} distinct requirements exceeds working memory capacity (~7-9 items)`,
        recommendation: 'Group requirements by category, use progressive disclosure, or provide checklist'
      });
    }

    // Check for complex nested structures
    const maxNesting = Math.max(...structure.sections.map(s => s.level));
    if (maxNesting > 4) {
      issues.push({
        type: 'deep-nesting',
        depth: maxNesting,
        risk: 'medium',
        reason: `${maxNesting} levels of nesting makes it hard to track which context applies`,
        recommendation: 'Flatten structure, use clear section headers'
      });
    }

    return {
      check: 'Cognitive Load',
      passed: issues.length === 0,
      severity: issues.some(i => i.risk === 'high') ? 'high' : 'medium',
      issues,
      recommendation: issues.length > 0
        ? 'Reduce simultaneous requirements or provide memory aids'
        : 'Cognitive load is manageable'
    };
  }

  /**
   * Check 4: Instruction Density
   * Too many instructions per section overwhelms
   */
  _checkInstructionDensity(body, structure) {
    const issues = [];

    structure.sections.forEach(section => {
      const sectionText = section.content.join('\n');
      const instructions = [
        ...sectionText.matchAll(/\b(MUST|SHOULD|DO|DON'T|ALWAYS|NEVER|ENSURE)\b/gi)
      ].length;
      
      const lines = section.content.filter(l => l.trim().length > 0).length;
      
      if (lines > 0) {
        const density = instructions / lines;
        
        // More than 1 instruction per 2 lines is overwhelming
        if (density > 0.5 && instructions > 5) {
          issues.push({
            section: section.title,
            instructions,
            lines,
            density: density.toFixed(2),
            risk: 'medium',
            reason: `Section has ${instructions} instructions in ${lines} lines (${(density * 100).toFixed(0)}% density)`,
            recommendation: 'Break into sub-sections or provide summary checklist'
          });
        }
      }
    });

    return {
      check: 'Instruction Density',
      passed: issues.length === 0,
      severity: 'medium',
      issues,
      recommendation: issues.length > 0
        ? 'Dense instruction sections likely to be skimmed'
        : 'Instruction density is reasonable'
    };
  }

  /**
   * Check 5: Known LLM Attention Patterns
   * What LLMs tend to miss or misinterpret
   */
  _checkAttentionPatterns(body, structure) {
    const issues = [];

    // Pattern 1: Negations get missed ("DON'T do X" becomes "do X")
    const negations = [
      ...body.matchAll(/\b(DON'T|NEVER|NOT|AVOID|SHOULDN'T)\s+(\w+)/gi)
    ];
    
    if (negations.length > 5) {
      issues.push({
        type: 'negation-heavy',
        count: negations.length,
        risk: 'high',
        reason: 'LLMs often miss negations - "DON\'T use X" may be read as "use X"',
        examples: negations.slice(0, 3).map(m => m[0]),
        recommendation: 'Reframe as positive statements where possible: "Use Y instead of X"'
      });
    }

    // Pattern 2: Parentheticals and asides get skipped
    const parentheticals = (body.match(/\([^)]{20,}\)/g) || []).length;
    if (parentheticals > 3) {
      issues.push({
        type: 'parenthetical-overload',
        count: parentheticals,
        risk: 'medium',
        reason: 'Parenthetical notes often skipped by LLMs',
        recommendation: 'Move important info to main text, use bold or separate sections'
      });
    }

    // Pattern 3: "Or" alternatives confuse (agent picks first, ignores others)
    const orPatterns = (body.match(/\bor\b/gi) || []).length;
    const lineCount = body.split('\n').length;
    if (orPatterns > lineCount * 0.1) {  // More than 10% of lines have "or"
      issues.push({
        type: 'choice-overload',
        count: orPatterns,
        risk: 'medium',
        reason: 'Many "or" choices - agents tend to pick first option and ignore alternatives',
        recommendation: 'Provide clear default with escape hatch: "Use X. For Y scenario, use Z instead."'
      });
    }

    return {
      check: 'LLM Attention Patterns',
      passed: issues.length === 0,
      severity: issues.some(i => i.risk === 'high') ? 'high' : 'medium',
      issues,
      recommendation: issues.length > 0
        ? 'Rewrite using patterns LLMs process reliably'
        : 'No known attention pitfalls detected'
    };
  }

  /**
   * Check 6: Buried Requirements
   * Important rules hidden in prose paragraphs
   */
  _checkBuriedRequirements(body, structure) {
    const issues = [];
    const lines = body.split('\n');

    // Look for critical keywords in long paragraphs
    let currentParagraph = [];
    
    lines.forEach((line, idx) => {
      if (line.trim().length === 0) {
        if (currentParagraph.length > 3) {
          const paragraphText = currentParagraph.join(' ');
          const hasCritical = /\b(MUST|NEVER|ALWAYS|CRITICAL|REQUIRED)\b/i.test(paragraphText);
          const isNotBold = !/\*\*(MUST|NEVER|ALWAYS)\*\*/i.test(paragraphText);
          
          if (hasCritical && isNotBold) {
            issues.push({
              line: idx - currentParagraph.length + 1,
              type: 'buried-requirement',
              risk: 'high',
              reason: 'Critical requirement embedded in prose paragraph without highlighting',
              snippet: paragraphText.substring(0, 100),
              recommendation: 'Extract to bullet point or bold the requirement'
            });
          }
        }
        currentParagraph = [];
      } else {
        currentParagraph.push(line);
      }
    });

    return {
      check: 'Buried Requirements',
      passed: issues.length === 0,
      severity: 'high',
      issues,
      recommendation: issues.length > 0
        ? 'Extract critical requirements from prose - agents skim paragraphs'
        : 'Requirements are clearly highlighted'
    };
  }

  /**
   * Check 7: List Overload
   * Too many lists make it unclear which is most important
   */
  _checkListOverload(body, structure) {
    const issues = [];
    const totalListItems = structure.listItems;
    const totalLines = structure.totalLines;

    if (totalListItems > totalLines * 0.4) {  // More than 40% of content is lists
      issues.push({
        type: 'list-heavy',
        listItems: totalListItems,
        percentage: ((totalListItems / totalLines) * 100).toFixed(0),
        risk: 'medium',
        reason: 'Over 40% of content is bullet points - unclear which lists matter most',
        recommendation: 'Add priority indicators (CRITICAL, HIGH, MEDIUM) or group by importance'
      });
    }

    return {
      check: 'List Overload',
      passed: issues.length === 0,
      severity: 'medium',
      issues,
      recommendation: issues.length > 0
        ? 'Too many lists blur priorities'
        : 'List usage is balanced'
    };
  }

  /**
   * Check 8: Negation Complexity
   * Double negatives, complex negations
   */
  _checkNegationComplexity(body) {
    const issues = [];

    // Double negatives: "Don't not do X", "Never avoid X"
    const doubleNegatives = body.match(/\b(don't|never|not)\s+\w+\s+(not|never|avoid|skip)\b/gi) || [];
    if (doubleNegatives.length > 0) {
      issues.push({
        type: 'double-negative',
        examples: doubleNegatives,
        risk: 'high',
        reason: 'Double negatives are confusing and often misinterpreted',
        recommendation: 'Rewrite as positive: "Do X" instead of "Don\'t not do X"'
      });
    }

    // Complex negations with exceptions: "Don't use X unless Y"
    const exceptionalNegations = body.match(/\b(don't|never)\s+.+\s+(unless|except|if)\b/gi) || [];
    if (exceptionalNegations.length > 3) {
      issues.push({
        type: 'complex-negation',
        count: exceptionalNegations.length,
        risk: 'medium',
        reason: 'Negations with exceptions are cognitively complex',
        recommendation: 'Rewrite as conditional: "If Y, then do X. Otherwise, do Z."'
      });
    }

    return {
      check: 'Negation Complexity',
      passed: issues.length === 0,
      severity: issues.some(i => i.risk === 'high') ? 'high' : 'medium',
      issues,
      recommendation: issues.length > 0
        ? 'Simplify negations - they\'re error-prone'
        : 'Negations are clear'
    };
  }

  /**
   * Check 9: Conditional Complexity
   * Nested if/then logic agents struggle to track
   */
  _checkConditionalComplexity(body) {
    const issues = [];

    // Count conditional statements
    const conditionals = body.match(/\b(if|when|unless|depending)\b/gi) || [];
    
    if (conditionals.length > 8) {
      issues.push({
        type: 'conditional-overload',
        count: conditionals.length,
        risk: 'medium',
        reason: `${conditionals.length} conditional branches hard to track`,
        recommendation: 'Provide decision tree diagram or flowchart'
      });
    }

    // Nested conditionals: "If X, then if Y, do Z"
    const nested = body.match(/\bif\s+.+,\s+(?:then\s+)?if\s+/gi) || [];
    if (nested.length > 0) {
      issues.push({
        type: 'nested-conditionals',
        examples: nested.map(n => n.substring(0, 60)),
        risk: 'high',
        reason: 'Nested conditionals are hard to follow',
        recommendation: 'Flatten into separate cases or use decision table'
      });
    }

    return {
      check: 'Conditional Complexity',
      passed: issues.length === 0,
      severity: issues.some(i => i.risk === 'high') ? 'high' : 'medium',
      issues,
      recommendation: issues.length > 0
        ? 'Simplify conditional logic'
        : 'Conditional logic is manageable'
    };
  }

  /**
   * Check 10: Priority Signaling
   * Are priorities clear? Do agents know what's most important?
   */
  _checkPrioritySignaling(body) {
    const issues = [];

    const hasCritical = /\b(CRITICAL|MUST|REQUIRED)\b/i.test(body);
    const hasOptional = /\b(OPTIONAL|MAY|CAN)\b/i.test(body);
    const hasPriority = /\b(PRIORITY|IMPORTANT|KEY)\b/i.test(body);

    if (!hasCritical && !hasPriority) {
      issues.push({
        type: 'no-priority-signal',
        risk: 'medium',
        reason: 'No clear priority indicators (CRITICAL, MUST, PRIORITY)',
        recommendation: 'Mark critical requirements explicitly'
      });
    }

    // Check if everything is marked MUST (priority inflation)
    const mustCount = (body.match(/\bMUST\b/g) || []).length;
    const lines = body.split('\n').length;
    if (mustCount > lines * 0.2) {  // More than 20% of lines say MUST
      issues.push({
        type: 'priority-inflation',
        mustCount,
        risk: 'medium',
        reason: 'Too many MUST requirements - unclear what\'s actually critical',
        recommendation: 'Reserve MUST for truly critical items, use SHOULD for others'
      });
    }

    return {
      check: 'Priority Signaling',
      passed: issues.length === 0,
      severity: 'medium',
      issues,
      recommendation: issues.length > 0
        ? 'Clarify priorities to guide agent attention'
        : 'Priorities are well signaled'
    };
  }

  /**
   * Generate failure predictions based on checks
   */
  _generatePredictions(checks) {
    const predictions = [];

    checks.forEach(check => {
      check.issues.forEach(issue => {
        const prediction = {
          requirement: issue.content || issue.section || issue.type,
          failureMode: this._predictFailureMode(issue.type),
          probability: this._estimateProbability(issue.risk),
          severity: issue.risk,
          reason: issue.reason,
          recommendation: issue.recommendation,
          checkName: check.check
        };

        predictions.push(prediction);
      });
    });

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  _predictFailureMode(issueType) {
    const modes = {
      'middle': 'Agent will likely forget this requirement',
      'long-list': 'Agent will skip middle items in list',
      'requirement-overload': 'Agent will miss some requirements due to tracking overload',
      'negation-heavy': 'Agent may misinterpret negations as positive statements',
      'buried-requirement': 'Agent will skim past this requirement in paragraph',
      'nested-conditionals': 'Agent will misapply conditional logic',
      'double-negative': 'Agent will misinterpret this',
      'choice-overload': 'Agent will pick first option, ignore alternatives'
    };

    return modes[issueType] || 'Agent may struggle with this instruction';
  }

  _estimateProbability(risk) {
    const probabilities = {
      'high': 0.7,
      'medium': 0.4,
      'low': 0.2
    };
    return probabilities[risk] || 0.3;
  }

  _calculateFollowabilityScore(checks) {
    let totalScore = 100;

    checks.forEach(check => {
      check.issues.forEach(issue => {
        if (issue.risk === 'high') totalScore -= 8;
        else if (issue.risk === 'medium') totalScore -= 4;
        else totalScore -= 2;
      });
    });

    return Math.max(0, totalScore);
  }
}
