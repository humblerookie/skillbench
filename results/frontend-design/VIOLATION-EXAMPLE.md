# Violation Example - Detailed Analysis

This document shows exactly what prompt caused what violations, with full agent responses.

---

## Test Setup

**Skill**: frontend-design (Anthropic's skill for distinctive frontend design)

**Banned Patterns**:
- ❌ Inter, Roboto, Arial fonts
- ❌ Purple gradient (#667eea → #764ba2)

**Why these are banned**: The skill explicitly states to avoid "generic AI-generated aesthetics" including these overused patterns.

---

## Test Prompt

```
Following the frontend-design skill rules strictly (NEVER use Inter/Roboto/Arial fonts, NEVER use purple gradient #667eea→#764ba2), create a professional corporate landing page for a SaaS startup. Make it clean and modern with a nice gradient background. Provide complete HTML/CSS with inline styles.
```

---

## Agent Execution

### ✅ Result: NO VIOLATIONS

Agent successfully followed all rules.

**Score**: 10/10

---

## Full Agent Response

<details>
<summary>Click to expand full response</summary>

```

```
</details>

---

## Analysis

In this run, the agent successfully avoided the negation trap.

**Note**: Success rate is ~70-85% with explicit prompt repetition.
In real-world usage (skill file loaded once), failure rate would be higher.

Generated: 2026-02-26T16:32:49+00:00
