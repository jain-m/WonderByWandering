/**
 * Gemini Generation Provider
 * E6-2: Build optional Gemini generation path
 *
 * Implements GenerationProvider using the Gemini API (gemini-2.5-flash).
 * Reads API key from chrome.storage.local. Throws on failure so the
 * unified entry point (index.ts) can catch and fall back to mock.
 */

import type {
  GenerationProvider,
  PathType,
  PathQuestionResult,
  AnswerResult,
  NodeData,
  BranchType,
  BranchResult,
} from './mockGenerator';
import { buildPathQuestionsPrompt, buildAnswerPrompt, buildBranchPrompt } from './prompts';

// ============================================================
// API Key Access
// ============================================================

async function getApiKey(): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return null;
  }
  return new Promise((resolve) => {
    chrome.storage.local.get(['MY_API_KEY'], (result: Record<string, string>) => {
      resolve(result.MY_API_KEY || null);
    });
  });
}

// ============================================================
// Gemini API Helpers
// ============================================================

const MODEL_ID = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

/**
 * Call the Gemini API and return the raw text response.
 * Throws on missing key, HTTP errors, API-level errors, or empty responses.
 */
async function callGemini(prompt: string): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key configured');

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message}`);
  }

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Empty response from Gemini');
  }

  return data.candidates[0].content.parts[0].text;
}

// ============================================================
// JSON Parsing & Validation
// ============================================================

/**
 * Parse JSON from Gemini response text.
 * Strips optional markdown code fences (```json ... ```) before parsing.
 */
function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned) as T;
}

/** Validate that parsed data matches the PathQuestionResult shape. */
function validatePathQuestionResult(obj: unknown): PathQuestionResult {
  const result = obj as PathQuestionResult;
  if (typeof result.rootQuestion !== 'string' || !Array.isArray(result.branches)) {
    throw new Error('Invalid PathQuestionResult shape');
  }
  for (const branch of result.branches) {
    if (typeof branch.question !== 'string' || typeof branch.context !== 'string') {
      throw new Error('Invalid branch shape in PathQuestionResult');
    }
  }
  return result;
}

/** Validate that parsed data matches the AnswerResult shape. */
function validateAnswerResult(obj: unknown): AnswerResult {
  const result = obj as AnswerResult;
  if (typeof result.summary !== 'string' || !Array.isArray(result.bullets)) {
    throw new Error('Invalid AnswerResult shape');
  }
  return result;
}

/** Validate that parsed data matches the BranchResult shape. */
function validateBranchResult(obj: unknown): BranchResult {
  if (!Array.isArray(obj)) throw new Error('Invalid BranchResult shape');
  for (const item of obj) {
    if (typeof item.question !== 'string' || typeof item.context !== 'string') {
      throw new Error('Invalid branch item shape in BranchResult');
    }
  }
  return obj as BranchResult;
}

// ============================================================
// GenerationProvider Implementation
// ============================================================

async function generatePathQuestions(
  sourceText: string,
  pathType: PathType,
): Promise<PathQuestionResult> {
  const prompt = buildPathQuestionsPrompt(sourceText, pathType);
  const text = await callGemini(prompt);
  const parsed = parseJsonResponse(text);
  return validatePathQuestionResult(parsed);
}

async function generateAnswer(nodeData: NodeData): Promise<AnswerResult> {
  const prompt = buildAnswerPrompt(nodeData.question, nodeData.sourceText);
  const text = await callGemini(prompt);
  const parsed = parseJsonResponse(text);
  return validateAnswerResult(parsed);
}

async function generateBranches(
  nodeData: NodeData,
  branchType: BranchType,
): Promise<BranchResult> {
  const content =
    branchType === 'question' ? nodeData.question : (nodeData.answer?.summary || '');
  const prompt = buildBranchPrompt(content, branchType, nodeData.sourceText);
  const text = await callGemini(prompt);
  const parsed = parseJsonResponse(text);
  return validateBranchResult(parsed);
}

// ============================================================
// Export
// ============================================================

export const geminiGenerator: GenerationProvider = {
  generatePathQuestions,
  generateAnswer,
  generateBranches,
};

export default geminiGenerator;
