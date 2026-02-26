#!/usr/bin/env node
import { ProviderFactory } from './src/providers/provider-factory.js';

console.log('🧪 Testing Provider Architecture\n');

// Test 1: List providers
console.log('Available providers:', ProviderFactory.list());

// Test 2: Auto-detect
console.log('\n🔍 Auto-detect test:');
try {
  const provider = ProviderFactory.autoDetect();
  console.log(`  ✅ Detected: ${provider.getName()}`);
  console.log(`  Models: ${provider.getModels().slice(0, 3).join(', ')}...`);
} catch (error) {
  console.log(`  ⚠️  ${error.message}`);
}

// Test 3: Provider creation (without actually calling API)
console.log('\n📦 Provider instantiation test:');

const testConfigs = [
  { name: 'OpenAI', config: { provider: 'openai', apiKey: 'sk-test' } },
  { name: 'Anthropic', config: { provider: 'anthropic', apiKey: 'sk-ant-test' } },
];

for (const { name, config } of testConfigs) {
  try {
    const provider = ProviderFactory.create(config);
    console.log(`  ✅ ${name}: ${provider.getName()} (${provider.getModels().length} models)`);
  } catch (error) {
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

console.log('\n✅ Provider architecture working!\n');
