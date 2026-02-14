/**
 * Unified Generation Entry Point
 * E6-2: Build optional Gemini generation path
 *
 * Auto-selects between mock and Gemini generators based on:
 *   1. session.demoMode — if true, always use mock
 *   2. API key availability — if absent, use mock
 *
 * On any Gemini error, falls back to mock with a console warning.
 */

import { useAtlasStore } from '../store/atlasStore';
import { mockGenerator } from './mockGenerator';
import type {
  GenerationProvider,
  PathType,
  PathQuestionResult,
  AnswerResult,
  NodeData,
  BranchType,
  BranchResult,
} from './mockGenerator';

// ============================================================
// Lazy-loaded Gemini generator
// ============================================================

let _geminiGenerator: GenerationProvider | null = null;

async function getGeminiGenerator(): Promise<GenerationProvider> {
  if (!_geminiGenerator) {
    const mod = await import('./geminiGenerator');
    _geminiGenerator = mod.geminiGenerator;
  }
  return _geminiGenerator;
}

// ============================================================
// Provider selection logic
// ============================================================

/**
 * Determine whether Gemini should be used for the current session.
 * Returns false when:
 *   - No session exists
 *   - session.demoMode is true
 *   - chrome.storage is unavailable
 *   - No API key is stored
 */
async function shouldUseGemini(): Promise<boolean> {
  const session = useAtlasStore.getState().session;
  if (!session || session.demoMode) return false;

  // 1. Check Vite env (local dev mode)
  if (import.meta.env?.GEMINI_API_KEY) return true;

  // 2. Check chrome.storage (extension mode)
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['MY_API_KEY'], (result: Record<string, string>) => {
        resolve(!!result.MY_API_KEY);
      });
    });
  }

  return false;
}

// ============================================================
// Fallback wrapper
// ============================================================

/**
 * Execute a generation call with automatic fallback.
 * Tries Gemini first (when conditions are met), falls back to mock
 * on any error — network, rate limit, safety filter, malformed JSON, etc.
 */
async function withFallback<T>(
  geminiCall: (provider: GenerationProvider) => Promise<T>,
  mockCall: (provider: GenerationProvider) => Promise<T>,
): Promise<T> {
  if (!(await shouldUseGemini())) {
    return mockCall(mockGenerator);
  }

  try {
    const gemini = await getGeminiGenerator();
    return await geminiCall(gemini);
  } catch (error) {
    console.warn('Gemini generation failed, falling back to mock:', error);

    // Auto-switch to demo mode so subsequent calls skip Gemini
    const session = useAtlasStore.getState().session;
    if (session && !session.demoMode) {
      useAtlasStore.getState().setSession({ ...session, demoMode: true });
      console.warn('Auto-switched to demo mode due to Gemini failure');
    }

    return mockCall(mockGenerator);
  }
}

// ============================================================
// Public API — drop-in replacements for direct mockGenerator calls
// ============================================================

export async function generatePathQuestions(
  sourceText: string,
  pathType: PathType,
): Promise<PathQuestionResult> {
  return withFallback(
    (p) => p.generatePathQuestions(sourceText, pathType),
    (p) => p.generatePathQuestions(sourceText, pathType),
  );
}

export async function generateAnswer(nodeData: NodeData): Promise<AnswerResult> {
  return withFallback(
    (p) => p.generateAnswer(nodeData),
    (p) => p.generateAnswer(nodeData),
  );
}

export async function generateBranches(
  nodeData: NodeData,
  branchType: BranchType,
): Promise<BranchResult> {
  return withFallback(
    (p) => p.generateBranches(nodeData, branchType),
    (p) => p.generateBranches(nodeData, branchType),
  );
}
