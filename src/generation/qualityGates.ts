/**
 * Quality Gates for Generated Questions
 * E6-4: Pre-render validation for generated questions
 *
 * Three gates run against every generated question:
 *   1. Specificity  — rejects questions <8 words or starting with "What is"
 *   2. Uniqueness   — rejects questions >80% Jaccard-similar to existing ones
 *   3. Branchability — rejects yes/no questions (Is/Are/Do/Does/Can/Will/…)
 *
 * Only applied to Gemini-generated content. Mock data bypasses these gates
 * because the quality gate logic lives exclusively in geminiGenerator.ts.
 */

import type { PathQuestionResult, BranchResult } from './mockGenerator';

// ============================================================
// Gate Functions
// ============================================================

/** Reject questions shorter than 8 words or starting with "What is" */
function passesSpecificityGate(question: string): boolean {
  const wordCount = question.trim().split(/\s+/).length;
  if (wordCount < 8) return false;
  if (question.trim().toLowerCase().startsWith('what is')) return false;
  return true;
}

/** Compute Jaccard similarity between two strings (word-level) */
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter(w => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/** Reject if >80% similar to any existing question */
function passesUniquenessGate(question: string, existingQuestions: string[]): boolean {
  for (const existing of existingQuestions) {
    if (jaccardSimilarity(question, existing) > 0.8) return false;
  }
  return true;
}

/** Reject yes/no questions */
const YES_NO_STARTERS = [
  'is ', 'are ', 'do ', 'does ', 'can ', 'will ',
  'has ', 'have ', 'was ', 'were ', 'should ',
];

function passesBranchabilityGate(question: string): boolean {
  const lower = question.trim().toLowerCase();
  return !YES_NO_STARTERS.some(starter => lower.startsWith(starter));
}

// ============================================================
// Public API
// ============================================================

export interface QualityResult {
  passed: boolean;
  failedQuestions: string[];
  reasons: string[];
}

/** Validate questions from a PathQuestionResult */
export function validatePathQuestions(
  result: PathQuestionResult,
  existingQuestions: string[] = [],
): QualityResult {
  const failedQuestions: string[] = [];
  const reasons: string[] = [];

  const allQuestions = [result.rootQuestion, ...result.branches.map(b => b.question)];

  for (const q of allQuestions) {
    if (!passesSpecificityGate(q)) {
      failedQuestions.push(q);
      reasons.push(`Too short or generic: "${q.substring(0, 50)}..."`);
    }
    if (!passesUniquenessGate(q, existingQuestions)) {
      failedQuestions.push(q);
      reasons.push(`Too similar to existing: "${q.substring(0, 50)}..."`);
    }
    if (!passesBranchabilityGate(q)) {
      failedQuestions.push(q);
      reasons.push(`Yes/no question: "${q.substring(0, 50)}..."`);
    }
  }

  return {
    passed: failedQuestions.length === 0,
    failedQuestions,
    reasons,
  };
}

/** Validate questions from a BranchResult */
export function validateBranches(
  branches: BranchResult,
  existingQuestions: string[] = [],
): QualityResult {
  const failedQuestions: string[] = [];
  const reasons: string[] = [];

  for (const branch of branches) {
    if (!passesSpecificityGate(branch.question)) {
      failedQuestions.push(branch.question);
      reasons.push(`Too short or generic: "${branch.question.substring(0, 50)}..."`);
    }
    if (!passesUniquenessGate(branch.question, existingQuestions)) {
      failedQuestions.push(branch.question);
      reasons.push(`Too similar to existing: "${branch.question.substring(0, 50)}..."`);
    }
    if (!passesBranchabilityGate(branch.question)) {
      failedQuestions.push(branch.question);
      reasons.push(`Yes/no question: "${branch.question.substring(0, 50)}..."`);
    }
  }

  return {
    passed: failedQuestions.length === 0,
    failedQuestions,
    reasons,
  };
}
