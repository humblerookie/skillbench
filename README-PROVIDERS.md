# Evalanche Multi-Provider Support

**Version 2.1.0** - Now supports multiple LLM providers!

---

## Supported Providers

- ✅ **Anthropic (Claude)** - Original, best for Claude skills
- ✅ **OpenAI (GPT-4, Codex)** - Cost-effective, faster
- ✅ **OpenClaw** - No API key needed (uses OpenClaw's auth)
- 🔜 **Extensible** - Easy to add new providers

---

## Quick Start

### 1. OpenAI (GPT-4)

```bash
# Install OpenAI SDK
npm install openai

# Set API key
export OPENAI_API_KEY=sk-...

# Run evaluation
npm run health:openai
```

**Code:**
```javascript
import { SkillEvaluatorV2 } from 'evalanche';

const evaluator = new SkillEvaluatorV2({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});

const report = await evaluator.evaluate({
  skillPath: './SKILL.md'
});
```

---

### 2. Anthropic (Claude)

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run evaluation
npm run health:anthropic
```

**Code:**
```javascript
const evaluator = new SkillEvaluatorV2({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY
});
```

---

### 3. OpenClaw (No API Key!)

```bash
# Just run - uses OpenClaw's configured auth
npm run health

# Or ask the OpenClaw agent:
"Run an Evalanche health check"
```

**Code:**
```javascript
const evaluator = new SkillEvaluatorV2({
  provider: 'openclaw'
});
```

---

### 4. Auto-Detect

```bash
# Detects from environment (OPENAI_API_KEY or ANTHROPIC_API_KEY)
npm run health
```

**Code:**
```javascript
// Auto-detects provider from environment
const evaluator = new SkillEvaluatorV2({});
```

---

## Usage Examples

### Basic Evaluation

```javascript
import { SkillEvaluatorV2 } from './src/evaluator-v2.js';

// OpenAI
const evaluator = new SkillEvaluatorV2({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview'
});

const report = await evaluator.evaluate({
  skillPath: './skills/frontend-design/SKILL.md',
  scenariosPerRequirement: 2,
  outputPath: 'report.json'
});

console.log(`Score: ${report.summary.averageScore}/10`);
console.log(`Pass Rate: ${report.summary.passRate}`);
```

### Compare Providers

```javascript
const providers = ['anthropic', 'openai'];
const results = {};

for (const provider of providers) {
  const evaluator = new SkillEvaluatorV2({
    provider,
    apiKey: process.env[`${provider.toUpperCase()}_API_KEY`]
  });
  
  const report = await evaluator.evaluate({
    skillPath: './SKILL.md'
  });
  
  results[provider] = report.summary.averageScore;
}

console.log('Provider Comparison:');
console.log(`  Claude: ${results.anthropic}/10`);
console.log(`  GPT-4:  ${results.openai}/10`);
```

### Model-Specific Evaluation

```javascript
// Use specific GPT-4 variant
const evaluator = new SkillEvaluatorV2({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o'  // Or gpt-4, gpt-4-turbo, etc.
});
```

---

## Provider-Specific Notes

### OpenAI
- **Cost**: ~10x cheaper than Claude
- **Speed**: ~2x faster API responses
- **Models**: gpt-4, gpt-4-turbo, gpt-4o, gpt-3.5-turbo
- **Best for**: Cost-sensitive evaluations, high volume
- **Caveat**: Different scoring behavior than Claude

### Anthropic
- **Cost**: Higher, but more accurate for Claude skills
- **Speed**: Moderate
- **Models**: claude-opus-4, claude-sonnet-4-5, claude-haiku-3-5
- **Best for**: Evaluating Claude skills accurately
- **Caveat**: Requires funded API key

### OpenClaw
- **Cost**: Uses your OpenClaw allocation
- **Speed**: Slower (routing overhead)
- **Models**: Whatever OpenClaw is configured with
- **Best for**: No API key management, integrated workflow
- **Caveat**: Requires running inside OpenClaw

---

## Architecture

### Provider Abstraction Layer

```
┌─────────────────────────────────────┐
│     SkillEvaluatorV2                │
├─────────────────────────────────────┤
│  DeterministicEvaluatorMulti        │
│           ↓                         │
│     ProviderFactory                 │
│           ↓                         │
│  ┌─────────────────────────────┐   │
│  │  BaseProvider (interface)   │   │
│  └─────────────────────────────┘   │
│     ↓          ↓          ↓         │
│  Anthropic  OpenAI    OpenClaw      │
└─────────────────────────────────────┘
```

### Files

```
evalanche/
├── src/
│   ├── evaluator-v2.js (main - multi-provider support)
│   ├── deterministic-evaluator-multi.js (provider-aware)
│   └── providers/
│       ├── base-provider.js (interface)
│       ├── anthropic-provider.js
│       ├── openai-provider.js
│       ├── openclaw-provider.js
│       └── provider-factory.js
├── test-multi-provider.js (demo)
└── package.json (updated deps)
```

---

## Adding New Providers

Want to add Gemini, Mistral, or local models? Easy!

### 1. Create Provider Class

```javascript
// src/providers/gemini-provider.js
import { BaseProvider } from './base-provider.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async complete(params) {
    const model = this.client.getGenerativeModel({ 
      model: params.model || 'gemini-pro' 
    });
    
    const result = await model.generateContent(params.messages[0].content);
    const response = result.response;
    
    return {
      content: response.text(),
      usage: {
        input_tokens: 0,  // Gemini doesn't expose this easily
        output_tokens: 0
      }
    };
  }

  getName() {
    return 'gemini';
  }

  getModels() {
    return ['gemini-pro', 'gemini-pro-vision'];
  }
}
```

### 2. Register in Factory

```javascript
// src/providers/provider-factory.js
import { GeminiProvider } from './gemini-provider.js';

static create(config) {
  switch (provider.toLowerCase()) {
    // ... existing cases ...
    case 'gemini':
    case 'google':
      return new GeminiProvider(rest);
    // ...
  }
}
```

### 3. Use It

```javascript
const evaluator = new SkillEvaluatorV2({
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY
});
```

---

## Testing

```bash
# Test with OpenAI
export OPENAI_API_KEY=sk-...
npm run health:openai

# Test with Anthropic
export ANTHROPIC_API_KEY=sk-ant-...
npm run health:anthropic

# Test with OpenClaw (no key needed)
npm run health

# Test auto-detect
npm run health
```

---

## Troubleshooting

### "openai is not installed"
```bash
npm install openai
```

### "Your credit balance is too low"
- OpenAI: Add credits at https://platform.openai.com/account/billing
- Anthropic: Add credits at https://console.anthropic.com/settings/billing

### "Could not extract OpenClaw API key"
- Normal! Just means you're not running inside OpenClaw
- Use `provider: 'openai'` or `provider: 'anthropic'` with explicit API key

### Different scores between providers
- **Expected!** Different LLMs = different evaluation behavior
- OpenAI tends to be more lenient
- Claude tends to be stricter
- Use same provider for regression testing

---

## Best Practices

1. **Use Claude for Claude skills** - Most accurate evaluation
2. **Use OpenAI for cost/speed** - Good for rapid iteration
3. **Use OpenClaw for convenience** - No API key management
4. **Compare providers** - Understand scoring differences
5. **Version control provider** - Track which was used in reports

---

## Roadmap

- [ ] Gemini support
- [ ] Mistral support
- [ ] Ollama support (local models)
- [ ] LM Studio support
- [ ] Parallel multi-provider evaluation
- [ ] Provider comparison reports

---

**Questions?** Check the main README or ask the OpenClaw agent!

**Status**: ✅ READY (v2.1.0)
**Providers**: Anthropic, OpenAI, OpenClaw
**Next**: Your choice!
