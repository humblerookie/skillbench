/**
 * Rubric Manager - Version-controlled evaluation rubrics
 */

import crypto from 'crypto';
import fs from 'fs';

export class RubricManager {
  constructor(rubricsPath = './rubrics') {
    this.rubricsPath = rubricsPath;
    this.current = null;
    this.changelog = [];
    
    this._ensureRubricsDirectory();
  }

  /**
   * Get current rubric version
   */
  getCurrentRubric() {
    if (this.current) return this.current;
    
    // Load latest version
    const versions = this._listVersions();
    if (versions.length === 0) {
      this.current = this._createDefaultRubric();
      this._saveRubric(this.current);
    } else {
      const latest = versions[versions.length - 1];
      this.current = this._loadRubric(latest);
    }
    
    return this.current;
  }

  /**
   * Update rubric (creates new version)
   */
  updateRubric(changes, reason) {
    const current = this.getCurrentRubric();
    
    const newRubric = {
      ...current,
      version: this._incrementVersion(current.version),
      updated: new Date().toISOString(),
      parent: current.version,
      changes,
      changeReason: reason
    };
    
    // Apply changes
    Object.assign(newRubric, changes);
    
    // Rehash
    newRubric.hash = this._calculateHash(newRubric);
    
    // Save and log
    this._saveRubric(newRubric);
    this._logChange(current.version, newRubric.version, reason, changes);
    
    this.current = newRubric;
    
    return newRubric;
  }

  /**
   * Get rubric by version
   */
  getRubricVersion(version) {
    return this._loadRubric(version);
  }

  /**
   * Compare two rubric versions
   */
  compareVersions(v1, v2) {
    const rubric1 = this._loadRubric(v1);
    const rubric2 = this._loadRubric(v2);
    
    const diffs = [];
    
    // Compare each category
    for (const category of Object.keys(rubric1.categories)) {
      const text1 = rubric1.categories[category];
      const text2 = rubric2.categories[category];
      
      if (text1 !== text2) {
        diffs.push({
          category,
          changed: true,
          v1: text1,
          v2: text2
        });
      }
    }
    
    return {
      v1,
      v2,
      identical: diffs.length === 0,
      diffs
    };
  }

  _createDefaultRubric() {
    return {
      version: '1.0.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      description: 'Default skill evaluation rubric',
      hash: null,
      
      // Global rules (apply to all categories)
      globalRules: `
CRITICAL EVALUATION RULES:

1. Score based on EXECUTION, not mentions
   - "I should run X" = 0 points (didn't run)
   - "Running X..." without tool call = 0 points
   - [tool: X] = scored (actually ran)

2. Evidence must be EXACT quotes
   - No paraphrasing
   - No inferring
   - Can't quote it? Don't claim it.

3. Be deterministic
   - Same input = same score
   - No randomness
`,

      // Category-specific scoring guides
      categories: {
        command: `
COMMAND EXECUTION (0-10 points):

Scoring breakdown:
- Execution (0-4 pts):
  * 4 = Ran correct command with correct args
  * 3 = Ran correct command, minor arg issues
  * 2 = Ran command, wrong args
  * 1 = Attempted but failed
  * 0 = Didn't run

- Result handling (0-4 pts):
  * 4 = Waited for results, used actual output
  * 3 = Waited, partially used output
  * 2 = Ran but didn't wait/use output
  * 1 = Ignored results
  * 0 = Didn't run command

- Communication (0-2 pts):
  * 2 = Explained what they did clearly
  * 1 = Partial explanation
  * 0 = No explanation

Total = execution + handling + communication
`,

        constraint: `
CONSTRAINT ADHERENCE (0-10 points):

This is mostly binary:

10 = Followed constraint perfectly
8-9 = Followed with minor edge case deviation
6-7 = Followed spirit but missed details
4-5 = Attempted but violated
2-3 = Major violation
0-1 = Completely ignored

If constraint is "Always ask before X":
- Asked before X = 10
- Did X without asking = 0
- Asked after X = 3 (too late)
`,

        workflow: `
WORKFLOW ADHERENCE (0-10 points):

Score = (correct_steps / total_steps) * 10

For each required step:
- Completed correctly = 1.0
- Attempted but wrong = 0.5
- Skipped = 0.0
- Out of order (if order matters) = 0.0

Example: 5 steps, completed 4 correctly, 1 wrong
Score = ((4 * 1.0) + (1 * 0.5)) / 5 * 10 = 9.0
`,

        format: `
FORMAT COMPLIANCE (0-10 points):

10 = Exact format as specified
8-9 = Format mostly correct, minor deviations
6-7 = Right structure, wrong details
4-5 = Attempted format but major issues
2-3 = Wrong format entirely
0-1 = No formatting attempt

Examples:
- Required: JSON → Got JSON = 10
- Required: JSON → Got JSON with extra field = 9
- Required: JSON → Got markdown table = 3
- Required: JSON → Got plain text = 0
`,

        conditional: `
CONDITIONAL LOGIC (0-10 points):

Evaluate if/then behavior:

If condition TRUE:
  - Followed "then" clause = 10
  - Violated "then" clause = 0

If condition FALSE:
  - Correctly didn't trigger = 10
  - Incorrectly triggered = 0

If condition AMBIGUOUS:
  - Note in evaluation
  - Score = 5 (uncertain)
  - Lower confidence

Example: "If user confirms, proceed"
- User confirmed + proceeded = 10
- User confirmed + didn't proceed = 0
- User denied + didn't proceed = 10
- User denied + proceeded = 0
`
      },
      
      // Output requirements
      output: {
        requireReasoning: true,
        minReasoningLength: 50,
        requireEvidence: true,
        minEvidenceCount: 1,
        maxEvidenceCount: 5,
        requireImprovements: true,
        requireConfidence: true
      }
    };
  }

  _calculateHash(rubric) {
    // Hash only the scoring content (not metadata)
    const content = JSON.stringify({
      globalRules: rubric.globalRules,
      categories: rubric.categories,
      output: rubric.output
    });
    
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);
  }

  _incrementVersion(version) {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  _ensureRubricsDirectory() {
    if (!fs.existsSync(this.rubricsPath)) {
      fs.mkdirSync(this.rubricsPath, { recursive: true });
    }
  }

  _listVersions() {
    if (!fs.existsSync(this.rubricsPath)) return [];
    
    return fs.readdirSync(this.rubricsPath)
      .filter(f => f.startsWith('rubric-') && f.endsWith('.json'))
      .map(f => f.replace('rubric-', '').replace('.json', ''))
      .sort();
  }

  _loadRubric(version) {
    const path = `${this.rubricsPath}/rubric-${version}.json`;
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  }

  _saveRubric(rubric) {
    const path = `${this.rubricsPath}/rubric-${rubric.version}.json`;
    fs.writeFileSync(path, JSON.stringify(rubric, null, 2));
  }

  _logChange(fromVersion, toVersion, reason, changes) {
    const changelogPath = `${this.rubricsPath}/CHANGELOG.md`;
    
    const entry = `
## ${toVersion} - ${new Date().toISOString().split('T')[0]}

**Reason:** ${reason}

**Changes:**
${Object.keys(changes).map(key => `- ${key}: Updated`).join('\n')}

**Previous version:** ${fromVersion}

---
`;
    
    if (!fs.existsSync(changelogPath)) {
      fs.writeFileSync(changelogPath, '# Rubric Changelog\n\n');
    }
    
    const existing = fs.readFileSync(changelogPath, 'utf8');
    fs.writeFileSync(changelogPath, existing + entry);
  }
}
