/**
 * Structured Prompt Schema
 * E6-3: Define structured prompt schema
 *
 * Prompt templates for Gemini API generation.
 * Each template includes path-specific instructions and few-shot examples.
 */

import { PathType } from './mockGenerator';

// ============================================================
// Path Descriptions (for prompt context)
// ============================================================

export const PATH_DESCRIPTIONS: Record<PathType, string> = {
  clarify: "Disambiguate meaning, define terms precisely, and identify hidden assumptions. Focus on what things actually mean rather than what people assume they mean.",
  'go-deeper': "Explore underlying mechanisms, cause-and-effect chains, and hidden complexity. Focus on how and why things work at a fundamental level.",
  challenge: "Find counterarguments, identify weaknesses, and test robustness. Focus on what could be wrong, what evidence is missing, and where the logic breaks down.",
  apply: "Find practical applications, real-world use cases, and actionable steps. Focus on how someone would actually use this knowledge.",
  connect: "Find relationships to other fields, analogies, and systemic connections. Focus on how this idea fits into a broader web of knowledge.",
  surprise: "Find counterintuitive angles, paradoxes, and unexpected implications. Focus on what would surprise or challenge conventional thinking.",
};

// ============================================================
// Few-Shot Examples (for path questions prompt)
// ============================================================

const FEW_SHOT_EXAMPLES: Record<PathType, string> = {
  clarify: `Example input: "Quantum entanglement allows particles to be connected regardless of distance."
Example output: { "rootQuestion": "What does 'connected' actually mean in the context of quantum entanglement?", "branches": [{ "question": "Does entanglement imply faster-than-light communication?", "context": "The word 'connected' is often misinterpreted as allowing information transfer" }, { "question": "What precisely is shared between entangled particles?", "context": "The nature of the correlation is more subtle than everyday notions of connection" }] }`,

  'go-deeper': `Example input: "Vaccines work by training the immune system to recognize pathogens."
Example output: { "rootQuestion": "What specific molecular mechanisms allow the immune system to 'remember' a pathogen after vaccination?", "branches": [{ "question": "How do memory B cells and T cells differ in their roles during immune recall?", "context": "The immune memory system has multiple specialized components" }, { "question": "Why do some vaccines require boosters while others provide lifetime immunity?", "context": "Duration of immunity reveals differences in immune response depth" }] }`,

  challenge: `Example input: "Democracy is the best form of government."
Example output: { "rootQuestion": "What systematic evidence exists that democracies produce better outcomes than alternatives?", "branches": [{ "question": "Are there measurable outcomes where non-democratic systems consistently outperform?", "context": "Empirical comparison reveals a more nuanced picture than the claim suggests" }, { "question": "Does the claim confuse correlation with causation — are wealthy nations democratic because of wealth, not the reverse?", "context": "The causal direction between prosperity and democracy is genuinely debated" }] }`,

  apply: `Example input: "Compound interest means money grows exponentially over time."
Example output: { "rootQuestion": "How would someone starting with $100/month actually build wealth through compound interest?", "branches": [{ "question": "What specific accounts or instruments offer the best compound growth for beginners?", "context": "Knowing the principle is useless without knowing where to apply it" }, { "question": "What common mistakes prevent people from benefiting from compound interest?", "context": "Behavioral barriers often matter more than mathematical understanding" }] }`,

  connect: `Example input: "Natural selection drives evolution through differential reproductive success."
Example output: { "rootQuestion": "Where else does the logic of selection and variation appear outside biology?", "branches": [{ "question": "How does natural selection parallel the process of scientific theory development?", "context": "Kuhn's model of paradigm shifts mirrors evolutionary dynamics" }, { "question": "Can market competition be understood as a form of natural selection?", "context": "Economic and biological competition share deep structural similarities" }] }`,

  surprise: `Example input: "The brain uses about 20% of the body's energy."
Example output: { "rootQuestion": "Why does the brain consume so much energy when it's only 2% of body mass — and what would happen if it used less?", "branches": [{ "question": "Is most brain energy spent on actual thinking, or just on maintaining readiness to think?", "context": "The answer challenges our assumption that brain activity equals conscious thought" }, { "question": "Could an energy-efficient brain be smarter, or is the inefficiency somehow essential?", "context": "What seems like waste might be a feature rather than a bug" }] }`,
};

// ============================================================
// Prompt Templates
// ============================================================

/**
 * Generate the prompt for path-based question generation
 */
export function buildPathQuestionsPrompt(sourceText: string, pathType: PathType): string {
  const description = PATH_DESCRIPTIONS[pathType];
  const example = FEW_SHOT_EXAMPLES[pathType];

  return `You are a Socratic thinking partner. Your job is to generate thought-provoking questions about a given text.

LENS: "${pathType}" — ${description}

INSTRUCTIONS:
- Generate exactly 1 root question and 2-3 branch questions
- Each question should be specific to the given text (not generic)
- Questions should invite deep exploration, not simple yes/no answers
- Branch questions should explore different facets of the root question
- Each branch must include a "context" field explaining why this question matters

${example}

Now generate questions for this text:
"${sourceText}"

Return ONLY valid JSON matching this exact schema, no markdown fences, no preamble:
{ "rootQuestion": "...", "branches": [{ "question": "...", "context": "..." }] }`;
}

/**
 * Generate the prompt for answering a question
 */
export function buildAnswerPrompt(question: string, sourceText: string): string {
  return `You are a knowledgeable and concise explainer. Answer the following question about a text.

QUESTION: "${question}"

ORIGINAL TEXT: "${sourceText}"

INSTRUCTIONS:
- Provide a concise, insightful answer
- Start with a single-sentence summary capturing the key insight
- Follow with 3-4 bullet points that develop the answer
- Each bullet should add new information, not restate the summary
- Be specific and evidence-based, avoid vague generalizations
- If the text doesn't contain enough information, say what's known and what's uncertain

Return ONLY valid JSON matching this exact schema, no markdown fences, no preamble:
{ "summary": "One sentence capturing the key insight", "bullets": ["Point 1", "Point 2", "Point 3"] }`;
}

/**
 * Generate the prompt for branch question generation
 */
export function buildBranchPrompt(
  content: string,
  branchType: 'question' | 'answer',
  sourceText: string
): string {
  const branchContext = branchType === 'question'
    ? "Generate follow-up questions that explore different dimensions of the QUESTION itself. Consider: assumptions in the question, alternative framings, prerequisite questions, and meta-questions about what kind of answer we're seeking."
    : "Generate follow-up questions that probe specific claims or points in the ANSWER. Consider: which claims need more evidence, what implications follow, what was left unsaid, and where the reasoning might be weakest.";

  return `You are a Socratic thinking partner generating follow-up questions.

${branchType === 'question' ? 'PARENT QUESTION' : 'PARENT ANSWER'}: "${content}"

ORIGINAL TEXT: "${sourceText}"

INSTRUCTIONS:
- ${branchContext}
- Generate exactly 2-3 follow-up questions
- Each question must be more specific than the parent, not more general
- Questions should invite exploration, not simple yes/no answers
- Avoid generating questions that are just rephrasing of the parent
- Each must include a "context" field explaining why this follow-up matters

Return ONLY valid JSON matching this exact schema, no markdown fences, no preamble:
[{ "question": "...", "context": "..." }]`;
}

// ============================================================
// Retry prompt modifier (for quality gate retries)
// ============================================================

export function appendRetryInstruction(prompt: string): string {
  return prompt + "\n\nIMPORTANT: Your previous response was too generic or too similar to existing questions. Be MORE SPECIFIC and EXPLORATORY. Avoid starting questions with 'What is' and avoid yes/no question structures.";
}
