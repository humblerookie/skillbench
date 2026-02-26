/**
 * Skill Quality Evaluator - Round 1
 * Evaluates if SKILL.md follows Anthropic's best practices
 * 
 * Based on: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
 */

export class SkillQualityEvaluator {
  constructor(provider) {
    this.provider = provider;
  }

  /**
   * Evaluate skill quality against best practices
   * @param {string} skillContent - The SKILL.md content
   * @param {string} skillName - Name of the skill
   * @returns {Promise<Object>} Quality evaluation report
   */
  async evaluate(skillContent, skillName) {
    console.log(`\n🔍 Round 1: Evaluating skill quality for "${skillName}"...\n`);

    const checks = [];

    // Extract frontmatter and body
    const { frontmatter, body } = this._parseFrontmatter(skillContent);

    // Check 1: YAML Frontmatter
    checks.push(await this._checkFrontmatter(frontmatter));

    // Check 2: Description Quality
    checks.push(await this._checkDescription(frontmatter.description));

    // Check 3: Conciseness
    checks.push(await this._checkConciseness(body, skillName));

    // Check 4: Structure & Progressive Disclosure
    checks.push(this._checkStructure(body));

    // Check 5: Workflows & Feedback Loops
    checks.push(this._checkWorkflows(body));

    // Check 6: Anti-patterns
    checks.push(this._checkAntiPatterns(body));

    // Check 7: Content Guidelines
    checks.push(this._checkContentGuidelines(body));

    // Calculate overall score
    const overallScore = this._calculateOverallScore(checks);

    return {
      skillName,
      round: 1,
      type: 'skill-quality',
      summary: {
        overallScore,
        checksTotal: checks.length,
        checksPassed: checks.filter(c => c.passed).length,
        checksFailed: checks.filter(c => !c.passed).length,
        criticalIssues: checks.filter(c => c.severity === 'critical' && !c.passed).length
      },
      checks,
      frontmatter,
      metadata: {
        bodyLength: body.split('\n').length,
        descriptionLength: frontmatter.description?.length || 0,
        hasReferences: body.includes('.md]'),
        hasCodeBlocks: body.includes('```')
      },
      recommendation: this._generateRecommendation(overallScore, checks)
    };
  }

  _parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { frontmatter: {}, body: content };
    }

    const [, yaml, body] = match;
    const frontmatter = {};
    
    // Simple YAML parsing
    yaml.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        frontmatter[key.trim()] = valueParts.join(':').trim();
      }
    });

    return { frontmatter, body };
  }

  async _checkFrontmatter(frontmatter) {
    const issues = [];
    let score = 10;

    // Check name field
    if (!frontmatter.name) {
      issues.push('Missing required "name" field');
      score = 0;
    } else {
      if (frontmatter.name.length > 64) {
        issues.push('Name exceeds 64 characters');
        score -= 3;
      }
      if (!/^[a-z0-9-]+$/.test(frontmatter.name)) {
        issues.push('Name must contain only lowercase letters, numbers, and hyphens');
        score -= 3;
      }
      if (frontmatter.name.includes('anthropic') || frontmatter.name.includes('claude')) {
        issues.push('Name contains reserved words (anthropic, claude)');
        score -= 2;
      }
    }

    // Check description field
    if (!frontmatter.description) {
      issues.push('Missing required "description" field');
      score = Math.min(score, 2);
    } else {
      if (frontmatter.description.length > 1024) {
        issues.push('Description exceeds 1024 characters');
        score -= 2;
      }
      if (frontmatter.description.length < 20) {
        issues.push('Description too short (should be descriptive)');
        score -= 2;
      }
    }

    return {
      check: 'YAML Frontmatter',
      passed: score >= 7,
      score: Math.max(0, score),
      severity: score < 5 ? 'critical' : 'warning',
      issues,
      recommendation: issues.length > 0
        ? 'Fix frontmatter validation issues'
        : 'Frontmatter is compliant'
    };
  }

  async _checkDescription(description) {
    if (!description) {
      return {
        check: 'Description Quality',
        passed: false,
        score: 0,
        severity: 'critical',
        issues: ['No description provided'],
        recommendation: 'Add a description field'
      };
    }

    const issues = [];
    let score = 10;

    // Check for first-person language (should be third-person)
    if (/\b(I|me|my|we|our)\b/i.test(description)) {
      issues.push('Description uses first person (should be third person)');
      score -= 3;
    }
    if (/\b(you|your)\b/i.test(description)) {
      issues.push('Description uses second person (should be third person)');
      score -= 2;
    }

    // Check for "when to use" guidance
    if (!/\b(use when|when|for)\b/i.test(description)) {
      issues.push('Description should include "when to use" guidance');
      score -= 2;
    }

    // Check for vagueness
    const vagueWords = ['helps', 'stuff', 'things', 'does'];
    const foundVague = vagueWords.filter(word => description.toLowerCase().includes(word));
    if (foundVague.length > 0) {
      issues.push(`Description contains vague words: ${foundVague.join(', ')}`);
      score -= 2;
    }

    // Check for key terms/specificity
    const wordCount = description.split(/\s+/).length;
    if (wordCount < 10) {
      issues.push('Description may be too brief to be specific');
      score -= 1;
    }

    return {
      check: 'Description Quality',
      passed: score >= 7,
      score: Math.max(0, score),
      severity: score < 5 ? 'critical' : 'warning',
      issues,
      recommendation: issues.length > 0
        ? 'Make description more specific, third-person, with "when to use" guidance'
        : 'Description follows best practices'
    };
  }

  async _checkConciseness(body, skillName) {
    const issues = [];
    let score = 10;

    const lines = body.split('\n').length;
    const words = body.split(/\s+/).length;

    // Check body length (should be under 500 lines)
    if (lines > 500) {
      issues.push(`Body has ${lines} lines (recommended: <500). Consider splitting into separate files.`);
      score -= 3;
    }

    // Use LLM to detect over-explanation
    const prompt = `Analyze this SKILL.md body for over-explanation. Claude already knows:
- What common file formats are (PDF, Excel, JSON, etc.)
- How libraries and packages work
- Basic programming concepts
- Common software patterns

Does this skill over-explain things Claude already knows? Rate 0-10:
- 10: Perfectly concise, assumes Claude's knowledge
- 7-9: Mostly concise, minor over-explanation
- 4-6: Some unnecessary explanation
- 0-3: Heavily over-explained, treating Claude like a novice

SKILL BODY (first 1000 chars):
${body.substring(0, 1000)}

Return ONLY JSON:
{
  "conciseness_score": 0-10,
  "over_explained_concepts": ["concept1", "concept2"],
  "reasoning": "brief explanation"
}`;

    try {
      const result = await this.provider.complete({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0,
        max_tokens: 500
      });

      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) {
        const analysis = JSON.parse(match[0]);
        
        if (analysis.conciseness_score < 7) {
          issues.push(`Over-explanation detected: ${analysis.reasoning}`);
          if (analysis.over_explained_concepts?.length > 0) {
            issues.push(`Over-explained: ${analysis.over_explained_concepts.join(', ')}`);
          }
          score = Math.min(score, analysis.conciseness_score);
        }
      }
    } catch (error) {
      // Skip LLM check if it fails
      console.warn('  ⚠️  Conciseness LLM check skipped:', error.message);
    }

    return {
      check: 'Conciseness',
      passed: score >= 7 && lines <= 500,
      score: Math.max(0, score),
      severity: lines > 500 ? 'warning' : 'info',
      issues,
      metadata: { lines, words },
      recommendation: issues.length > 0
        ? 'Remove unnecessary explanations, assume Claude knowledge, split into files if >500 lines'
        : 'Skill is appropriately concise'
    };
  }

  _checkStructure(body) {
    const issues = [];
    let score = 10;

    // Check for deeply nested references (>1 level)
    const referencePattern = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
    const references = [...body.matchAll(referencePattern)];
    
    // Check progressive disclosure pattern
    const hasProgressiveDisclosure = references.length > 0;
    const bodyLines = body.split('\n').length;

    if (bodyLines > 500 && references.length === 0) {
      issues.push('Skill over 500 lines without progressive disclosure (split into files)');
      score -= 3;
    }

    // Check for table of contents in long sections
    if (bodyLines > 100 && !body.includes('## Contents') && !body.includes('## Table of Contents')) {
      issues.push('Consider adding table of contents for long skill (>100 lines)');
      score -= 1;
    }

    return {
      check: 'Structure & Progressive Disclosure',
      passed: score >= 7,
      score: Math.max(0, score),
      severity: 'info',
      issues,
      metadata: {
        references: references.length,
        bodyLines,
        hasProgressiveDisclosure
      },
      recommendation: issues.length > 0
        ? 'Use progressive disclosure: split long skills, add references to detailed files'
        : 'Structure follows best practices'
    };
  }

  _checkWorkflows(body) {
    const issues = [];
    let score = 10;

    const hasWorkflow = /##\s+(workflow|process|steps)/i.test(body);
    const hasChecklist = /- \[ \]/.test(body);
    const hasFeedbackLoop = /(validate|verify|check|review|iterate)/i.test(body);

    // Complex skills should have workflows
    const looksComplex = body.length > 2000 || body.split('##').length > 5;

    if (looksComplex && !hasWorkflow) {
      issues.push('Complex skill without clear workflow - consider adding step-by-step process');
      score -= 2;
    }

    if (hasWorkflow && !hasChecklist) {
      issues.push('Workflow present but no checklist - consider adding checklist for Claude to track progress');
      score -= 1;
    }

    if (!hasFeedbackLoop && looksComplex) {
      issues.push('No validation/verification steps - consider adding feedback loops');
      score -= 2;
    }

    return {
      check: 'Workflows & Feedback Loops',
      passed: score >= 7,
      score: Math.max(0, score),
      severity: 'info',
      issues,
      metadata: { hasWorkflow, hasChecklist, hasFeedbackLoop, looksComplex },
      recommendation: issues.length > 0
        ? 'Add workflows with checklists and validation steps for complex tasks'
        : 'Workflows are appropriate for skill complexity'
    };
  }

  _checkAntiPatterns(body) {
    const issues = [];
    let score = 10;

    // Check for Windows-style paths
    if (/\\[a-zA-Z]/.test(body)) {
      issues.push('Windows-style paths detected (use forward slashes)');
      score -= 2;
    }

    // Check for multiple options without clear default
    const hasMultipleOptions = /(you can use|or|alternatively)/gi.test(body);
    const matchCount = (body.match(/(you can use|or|alternatively)/gi) || []).length;
    if (matchCount > 3) {
      issues.push('Too many options presented - provide a default with escape hatch');
      score -= 2;
    }

    // Check for first/second person in body (should be third person or imperative)
    const firstPersonMatches = (body.match(/\b(I'll|I'm|we'll|we're)\b/g) || []).length;
    if (firstPersonMatches > 2) {
      issues.push('Use third person or imperative mood, not first person');
      score -= 1;
    }

    return {
      check: 'Anti-patterns',
      passed: score >= 8,
      score: Math.max(0, score),
      severity: 'warning',
      issues,
      recommendation: issues.length > 0
        ? 'Fix anti-patterns: use forward slashes, provide clear defaults, use third person'
        : 'No anti-patterns detected'
    };
  }

  _checkContentGuidelines(body) {
    const issues = [];
    let score = 10;

    // Check for time-sensitive information
    const timeSensitivePatterns = [
      /\b(before|after)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i,
      /\buntil\s+\d{4}/i,
      /\bcurrently\s+in\s+\d{4}/i
    ];
    
    timeSensitivePatterns.forEach(pattern => {
      if (pattern.test(body)) {
        issues.push('Time-sensitive information detected - use "Old patterns" section instead');
        score -= 2;
      }
    });

    // Check for inconsistent terminology (basic check)
    const checkTermConsistency = (terms) => {
      const found = terms.filter(term => 
        new RegExp(`\\b${term}\\b`, 'i').test(body)
      );
      return found.length > 1 ? found : null;
    };

    const inconsistentSets = [
      ['API endpoint', 'URL', 'API route', 'endpoint', 'path'],
      ['extract', 'pull', 'get', 'retrieve', 'fetch']
    ];

    inconsistentSets.forEach(terms => {
      const found = checkTermConsistency(terms);
      if (found && found.length > 2) {
        issues.push(`Possibly inconsistent terminology: ${found.join(', ')} - choose one term`);
        score -= 1;
      }
    });

    return {
      check: 'Content Guidelines',
      passed: score >= 7,
      score: Math.max(0, score),
      severity: 'info',
      issues,
      recommendation: issues.length > 0
        ? 'Remove time-sensitive info, use consistent terminology'
        : 'Content follows guidelines'
    };
  }

  _calculateOverallScore(checks) {
    const weights = {
      'YAML Frontmatter': 15,
      'Description Quality': 15,
      'Conciseness': 15,
      'Structure & Progressive Disclosure': 15,
      'Workflows & Feedback Loops': 15,
      'Anti-patterns': 15,
      'Content Guidelines': 10
    };

    let totalWeighted = 0;
    let totalWeight = 0;

    checks.forEach(check => {
      const weight = weights[check.check] || 10;
      totalWeighted += check.score * weight;
      totalWeight += weight * 10; // max score is 10
    });

    return (totalWeighted / totalWeight * 10).toFixed(1);
  }

  _generateRecommendation(score, checks) {
    const criticalIssues = checks.filter(c => c.severity === 'critical' && !c.passed);
    const warnings = checks.filter(c => c.severity === 'warning' && !c.passed);

    if (score >= 9.0) {
      return 'Excellent! Skill follows best practices. Ready for Round 2 (agent compliance testing).';
    } else if (score >= 7.0) {
      return `Good skill quality. Minor improvements recommended: ${warnings.map(w => w.check).join(', ')}. Proceed to Round 2 with caution.`;
    } else if (score >= 5.0) {
      return `Moderate skill quality. Fix these issues before Round 2: ${[...criticalIssues, ...warnings].map(c => c.check).join(', ')}.`;
    } else {
      return `Poor skill quality (${score}/10). Address critical issues before testing agent compliance: ${criticalIssues.map(c => c.check).join(', ')}.`;
    }
  }
}
