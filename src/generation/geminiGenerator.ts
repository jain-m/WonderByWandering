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
const API_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}`;
const API_URL = `${API_BASE}:generateContent`;
const STREAM_URL = `${API_BASE}:streamGenerateContent`;

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

/**
 * Call the Gemini Streaming API and yield text chunks via callback.
 * Uses Server-Sent Events (SSE) via streamGenerateContent?alt=sse.
 */
async function callGeminiStream(
  prompt: string,
  onChunk: (delta: string) => void,
): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key configured');

  const response = await fetch(`${STREAM_URL}?key=${apiKey}&alt=sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini streaming error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body for streaming');

  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process SSE lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const data = JSON.parse(jsonStr);
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            accumulated += text;
            onChunk(text);
          }
        } catch {
          // Skip malformed SSE chunks
        }
      }
    }
  }

  if (!accumulated) {
    throw new Error('Empty streaming response from Gemini');
  }

  return accumulated;
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

/**
 * Parse streamed plain-text answer into AnswerResult shape.
 * Expects: a bold summary line, followed by bullet points.
 */
function parseStreamedAnswer(text: string): AnswerResult {
  const lines = text.trim().split('\n').filter((l) => l.trim());

  // First non-empty line is the summary (strip ** bold markers)
  let summary = lines[0] || '';
  summary = summary.replace(/^\*\*(.*)\*\*$/, '$1').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();

  // Remaining lines that start with - or * are bullets
  const bullets: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    if (line.startsWith('- ') || line.startsWith('* ')) {
      bullets.push(line.slice(2).trim());
    } else if (line && bullets.length === 0) {
      // Part of multi-line summary
      summary += ' ' + line;
    } else if (line && bullets.length > 0) {
      // Continuation of last bullet
      bullets[bullets.length - 1] += ' ' + line;
    }
  }

  return { summary, bullets };
}

async function generateAnswer(
  nodeData: NodeData,
  onChunk?: (delta: string) => void,
): Promise<AnswerResult> {
  const prompt = buildAnswerPrompt(nodeData.question, nodeData.sourceText);

  if (onChunk) {
    // Streaming path
    const fullText = await callGeminiStream(prompt, onChunk);
    return parseStreamedAnswer(fullText);
  }

  // Non-streaming fallback
  const text = await callGemini(prompt);
  return parseStreamedAnswer(text);
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
