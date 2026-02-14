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
import { buildPathQuestionsPrompt, buildAnswerPrompt, buildBranchPrompt, appendRetryInstruction } from './prompts';
import { validatePathQuestions, validateBranches } from './qualityGates';
import { useAtlasStore } from '../store/atlasStore';

// ============================================================
// API Key Access
// ============================================================

async function getApiKey(): Promise<string | null> {
  // 1. Check Vite env (local dev mode)
  const envKey = import.meta.env?.GEMINI_API_KEY;
  if (envKey) return envKey;

  // 2. Check chrome.storage (extension mode)
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['MY_API_KEY'], (result: Record<string, string>) => {
        resolve(result.MY_API_KEY || null);
      });
    });
  }

  return null;
}

// ============================================================
// Gemini API Helpers
// ============================================================

const MODEL_ID = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000]; // exponential: 1s, 2s, 4s

/**
 * Call the Gemini API and return the raw text response.
 * Throws on missing key, HTTP errors, API-level errors, or empty responses.
 * Retries with exponential backoff on 429 (rate limit) responses.
 */
async function callGemini(prompt: string): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key configured');

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Wait before retry (skip on first attempt)
    if (attempt > 0) {
      const delay = BACKOFF_MS[attempt - 1] ?? 4000;
      console.warn(
        `Gemini rate limited, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    // Retry on rate limit
    if (response.status === 429 && attempt < MAX_RETRIES) {
      lastError = new Error('Rate limited (429)');
      continue;
    }

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

  // All retries exhausted
  throw lastError ?? new Error('Gemini call failed after retries');
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
// Quality Gate Retry Config
// ============================================================

const MAX_QUALITY_RETRIES = 2;

// ============================================================
// GenerationProvider Implementation
// ============================================================

async function generatePathQuestions(
  sourceText: string,
  pathType: PathType,
): Promise<PathQuestionResult> {
  const existingQuestions = useAtlasStore.getState().nodes.map(n => n.data.question);
  let prompt = buildPathQuestionsPrompt(sourceText, pathType);

  for (let attempt = 0; attempt <= MAX_QUALITY_RETRIES; attempt++) {
    const text = await callGemini(prompt);
    const parsed = parseJsonResponse(text);
    const result = validatePathQuestionResult(parsed);

    const quality = validatePathQuestions(result, existingQuestions);
    if (quality.passed || attempt === MAX_QUALITY_RETRIES) {
      if (!quality.passed) {
        console.warn('Quality gates failed after retries, accepting result:', quality.reasons);
      }
      return result;
    }

    console.warn(`Quality gate retry ${attempt + 1}/${MAX_QUALITY_RETRIES}:`, quality.reasons);
    prompt = appendRetryInstruction(prompt);
  }

  // Unreachable, but TypeScript needs it
  throw new Error('Quality gate loop exited unexpectedly');
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
  const existingQuestions = useAtlasStore.getState().nodes.map(n => n.data.question);
  const content =
    branchType === 'question' ? nodeData.question : (nodeData.answer?.summary || '');
  let prompt = buildBranchPrompt(content, branchType, nodeData.sourceText);

  for (let attempt = 0; attempt <= MAX_QUALITY_RETRIES; attempt++) {
    const text = await callGemini(prompt);
    const parsed = parseJsonResponse(text);
    const result = validateBranchResult(parsed);

    const quality = validateBranches(result, existingQuestions);
    if (quality.passed || attempt === MAX_QUALITY_RETRIES) {
      if (!quality.passed) {
        console.warn('Quality gates failed after retries, accepting result:', quality.reasons);
      }
      return result;
    }

    console.warn(`Quality gate retry ${attempt + 1}/${MAX_QUALITY_RETRIES}:`, quality.reasons);
    prompt = appendRetryInstruction(prompt);
  }

  throw new Error('Quality gate loop exited unexpectedly');
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
