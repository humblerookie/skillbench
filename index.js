/**
 * Evalanche - Skill evaluation framework for Claude agents
 *
 * @module skillbench
 *
 * @example
 * import { TwoRoundEvaluator } from 'skillbench';
 *
 * const evaluator = new TwoRoundEvaluator();
 * const report = await evaluator.evaluate({
 *   skillPath: './my-skill/',   // SKILL.md file or skill directory
 *   provider: 'anthropic',
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 * });
 */

// Primary API
export { TwoRoundEvaluator } from './src/two-round-evaluator.js';

// Building blocks (for custom evaluation pipelines)
export { SkillParser } from './src/parser.js';
export { ScenarioGenerator } from './src/generator.js';
export { SkillEvaluatorV2 } from './src/evaluator-v2.js';
export { CalibrationSystem } from './src/calibration.js';
export { RubricManager } from './src/rubric-manager.js';
