/**
 * Deterministic Mock Generation
 * E6-1: Build deterministic mock generation
 *
 * Provides pre-written, deterministic content for all generation functions.
 * Used in demo mode and as fallback when Gemini API is unavailable.
 */

// ============================================================
// Types (shared with GenerationProvider interface)
// ============================================================

export type PathType = 'clarify' | 'go-deeper' | 'challenge' | 'apply' | 'connect' | 'surprise';

export interface BranchItem {
  question: string;
  context: string;
}

export interface PathQuestionResult {
  rootQuestion: string;
  branches: BranchItem[];
}

export interface AnswerResult {
  summary: string;
  bullets: string[];
}

export type BranchType = 'question' | 'answer';

export interface NodeData {
  question: string;
  context?: string;
  answer?: AnswerResult;
  pathType: PathType;
  sourceText: string;
}

export interface GenerationProvider {
  generatePathQuestions(sourceText: string, pathType: PathType): Promise<PathQuestionResult>;
  generateAnswer(nodeData: NodeData): Promise<AnswerResult>;
  generateBranches(nodeData: NodeData, branchType: BranchType): Promise<BranchResult>;
}

export type BranchResult = BranchItem[];

// ============================================================
// Deterministic hash for input → consistent output selection
// ============================================================

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ============================================================
// Mock Data: Path Questions (3-4 sets per path type)
// ============================================================

const PATH_QUESTION_SETS: Record<PathType, PathQuestionResult[]> = {
  clarify: [
    {
      rootQuestion: "What exactly is meant by the core concept here?",
      branches: [
        { question: "How would you define this in plain language for someone unfamiliar?", context: "Stripping away jargon reveals the essential meaning" },
        { question: "Are there multiple interpretations of this idea?", context: "Ambiguity often hides important distinctions" },
        { question: "What assumptions are embedded in this statement?", context: "Unstated assumptions can change the meaning entirely" },
      ]
    },
    {
      rootQuestion: "What does each key term actually refer to?",
      branches: [
        { question: "Which words here carry specialized meaning?", context: "Technical terms often differ from everyday usage" },
        { question: "What context is needed to fully understand this?", context: "Meaning depends heavily on surrounding context" },
      ]
    },
    {
      rootQuestion: "What's the precise scope of this claim?",
      branches: [
        { question: "Does this apply universally or only in specific conditions?", context: "Scope limitations are often implicit" },
        { question: "What boundaries separate this concept from related ideas?", context: "Clear boundaries prevent conflation" },
        { question: "How has the meaning of this evolved over time?", context: "Historical context shapes current understanding" },
      ]
    },
  ],
  'go-deeper': [
    {
      rootQuestion: "What underlying mechanisms make this work?",
      branches: [
        { question: "What's the chain of cause and effect here?", context: "Understanding causation reveals deeper structure" },
        { question: "What would happen if a key component were removed?", context: "Removing parts reveals which are essential" },
        { question: "How does this operate at a more fundamental level?", context: "Zooming in often reveals surprising complexity" },
      ]
    },
    {
      rootQuestion: "What layers of complexity are hidden beneath the surface?",
      branches: [
        { question: "What feedback loops or self-reinforcing dynamics exist here?", context: "Systems often have hidden feedback mechanisms" },
        { question: "What are the second-order effects people usually miss?", context: "Indirect consequences are often more impactful" },
      ]
    },
    {
      rootQuestion: "Why does this work the way it does and not some other way?",
      branches: [
        { question: "What constraints shaped this particular design or outcome?", context: "Constraints explain why alternatives weren't chosen" },
        { question: "What trade-offs were made to achieve this?", context: "Every design involves trade-offs worth examining" },
        { question: "What historical path led to this specific solution?", context: "Path dependence shapes current reality" },
      ]
    },
  ],
  challenge: [
    {
      rootQuestion: "What's the strongest argument against this idea?",
      branches: [
        { question: "What evidence would disprove this if it existed?", context: "Falsifiability is the hallmark of robust claims" },
        { question: "Who disagrees with this and what's their best point?", context: "Steelmanning opposition reveals blind spots" },
        { question: "Under what conditions does this claim break down?", context: "Edge cases expose the limits of any framework" },
      ]
    },
    {
      rootQuestion: "What biases might be influencing this perspective?",
      branches: [
        { question: "Is there cherry-picked evidence supporting this view?", context: "Confirmation bias is the most common reasoning error" },
        { question: "What would a skeptic demand as proof?", context: "Raising the evidence bar strengthens understanding" },
      ]
    },
    {
      rootQuestion: "Is this actually true, or just widely believed?",
      branches: [
        { question: "What's the origin of this claim and has it been verified?", context: "Many 'facts' are actually unverified traditions" },
        { question: "Could the opposite be equally well-supported?", context: "Some debates have legitimately strong arguments on both sides" },
        { question: "What would change your mind about this?", context: "Identifying cruxes clarifies what actually matters" },
      ]
    },
  ],
  apply: [
    {
      rootQuestion: "How could you use this idea in practice right now?",
      branches: [
        { question: "What's the simplest first step to apply this?", context: "Starting small reduces the barrier to action" },
        { question: "What tools or resources would you need?", context: "Practical application requires concrete resources" },
        { question: "What mistakes do people commonly make when applying this?", context: "Learning from others' mistakes saves time" },
      ]
    },
    {
      rootQuestion: "What real-world problem does this help solve?",
      branches: [
        { question: "Can you think of a specific scenario where this would be valuable?", context: "Concrete scenarios make abstract ideas tangible" },
        { question: "How would you explain the practical value to someone skeptical?", context: "Articulating value forces clarity of thought" },
      ]
    },
    {
      rootQuestion: "What would a step-by-step implementation look like?",
      branches: [
        { question: "What are the prerequisites before you can start?", context: "Dependencies determine the order of operations" },
        { question: "How would you measure whether the application is working?", context: "Measurement turns theory into testable practice" },
        { question: "What adaptations would different contexts require?", context: "No solution works identically everywhere" },
      ]
    },
  ],
  connect: [
    {
      rootQuestion: "What other fields or ideas does this relate to?",
      branches: [
        { question: "What pattern here appears in completely different domains?", context: "Cross-domain patterns reveal deep structural similarities" },
        { question: "How does this interact with things you already know?", context: "Building on existing knowledge creates stronger understanding" },
        { question: "What surprising connection exists that most people miss?", context: "Non-obvious connections often yield the richest insights" },
      ]
    },
    {
      rootQuestion: "What's the broader system this belongs to?",
      branches: [
        { question: "What depends on this and what does it depend on?", context: "Dependency mapping reveals system structure" },
        { question: "How does changing this ripple through connected areas?", context: "Interconnection means changes propagate" },
      ]
    },
    {
      rootQuestion: "What analogy best captures the essence of this idea?",
      branches: [
        { question: "What concept from everyday life mirrors this?", context: "Familiar analogies make complex ideas accessible" },
        { question: "Where does the analogy break down and what does that reveal?", context: "Analogy limits are as instructive as analogy strengths" },
        { question: "What historical parallel exists for this situation?", context: "History often rhymes in instructive ways" },
      ]
    },
  ],
  surprise: [
    {
      rootQuestion: "What's the most counterintuitive thing about this?",
      branches: [
        { question: "What would surprise most people about this topic?", context: "Surprises indicate gaps between perception and reality" },
        { question: "What's the opposite of the common belief here, and could it be true?", context: "Inverting assumptions is a powerful thinking tool" },
        { question: "What weird edge case reveals something profound?", context: "Edge cases often illuminate core principles" },
      ]
    },
    {
      rootQuestion: "How might this look completely different in 50 years?",
      branches: [
        { question: "What current assumption about this will seem absurd in the future?", context: "Every era has blind spots only visible in retrospect" },
        { question: "What emerging trend could radically transform this?", context: "Exponential changes are hard to predict but easy to imagine" },
      ]
    },
    {
      rootQuestion: "What would happen if you took this idea to its logical extreme?",
      branches: [
        { question: "Where does the logic lead if you remove all practical constraints?", context: "Thought experiments reveal hidden implications" },
        { question: "What paradox or contradiction lurks within this idea?", context: "Paradoxes often point to deeper truths" },
        { question: "What would an alien civilization think about this?", context: "Radical perspective shifts break habitual thinking" },
      ]
    },
  ],
};

// ============================================================
// Mock Data: Answers
// ============================================================

const MOCK_ANSWERS: AnswerResult[] = [
  {
    summary: "The key insight is that this concept operates through interconnected layers that reinforce each other.",
    bullets: [
      "The surface-level explanation only captures about 30% of what's actually happening",
      "Multiple feedback loops create stability but also resistance to change",
      "Understanding the historical context reveals why this particular form emerged",
      "Practical applications require adapting the core principle to local conditions",
    ]
  },
  {
    summary: "This idea challenges conventional thinking by revealing hidden complexity beneath apparent simplicity.",
    bullets: [
      "What seems like a single phenomenon is actually several interacting processes",
      "The most important factor is often the one least discussed in popular accounts",
      "Evidence from multiple fields converges on this same conclusion",
      "The implications extend far beyond the original domain of discovery",
    ]
  },
  {
    summary: "The practical significance lies in how this framework changes the questions we ask.",
    bullets: [
      "Reframing the problem this way opens up previously invisible solutions",
      "The approach has been independently validated across different contexts",
      "Common misconceptions arise from confusing correlation with causation here",
      "The biggest barrier to application is not knowledge but existing habits of thought",
    ]
  },
  {
    summary: "Recent developments have fundamentally shifted how experts understand this topic.",
    bullets: [
      "The old model was useful but incomplete — the new view adds crucial nuance",
      "Key experiments in the last decade resolved long-standing debates",
      "The updated understanding has direct implications for practice",
    ]
  },
];

// ============================================================
// Mock Data: Branch Questions
// ============================================================

const BRANCH_FROM_QUESTION: BranchItem[][] = [
  [
    { question: "What assumptions does this question itself carry?", context: "Questions shape the answers we find" },
    { question: "How would an expert in a different field reframe this question?", context: "Cross-disciplinary framing reveals blind spots" },
    { question: "What simpler question should we answer first?", context: "Complex questions often decompose into simpler parts" },
  ],
  [
    { question: "Why hasn't this question been satisfactorily answered yet?", context: "Persistent questions often have structural barriers" },
    { question: "What would change if we asked the opposite question?", context: "Inversion is a powerful reasoning technique" },
  ],
  [
    { question: "What would we need to observe to confidently answer this?", context: "Identifying evidence requirements sharpens the inquiry" },
    { question: "Who would be the ideal person to answer this and why?", context: "Expertise mapping reveals knowledge gaps" },
    { question: "How does the framing of this question constrain possible answers?", context: "Frame effects shape conclusions more than we realize" },
  ],
];

const BRANCH_FROM_ANSWER: BranchItem[][] = [
  [
    { question: "Which of these points has the strongest evidence behind it?", context: "Not all claims within an answer are equally supported" },
    { question: "What practical experiment could test the main claim?", context: "Testability separates speculation from knowledge" },
    { question: "How would this answer change if a key assumption were wrong?", context: "Sensitivity analysis reveals robustness" },
  ],
  [
    { question: "What's the most important implication that wasn't explicitly stated?", context: "Implicit conclusions are often the most interesting" },
    { question: "Where does this explanation seem to hand-wave over complexity?", context: "Gaps in explanations point to unsolved problems" },
  ],
  [
    { question: "How does this answer compare to what you expected?", context: "Expectation violations drive the deepest learning" },
    { question: "What follow-up evidence would make you more confident in this?", context: "Calibrating confidence requires knowing what's missing" },
    { question: "If you had to summarize this for a friend in one sentence, what's lost?", context: "Compression reveals what we consider essential" },
  ],
];

// ============================================================
// Mock Generator Implementation
// ============================================================

/** Simulate network delay for realistic demo feel */
function mockDelay(ms: number = 800): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generatePathQuestions(
  sourceText: string,
  pathType: PathType
): Promise<PathQuestionResult> {
  await mockDelay(600 + Math.random() * 400);

  const sets = PATH_QUESTION_SETS[pathType];
  const index = simpleHash(sourceText) % sets.length;
  return sets[index];
}

export async function generateAnswer(
  nodeData: NodeData
): Promise<AnswerResult> {
  await mockDelay(800 + Math.random() * 600);

  const index = simpleHash(nodeData.question) % MOCK_ANSWERS.length;
  return MOCK_ANSWERS[index];
}

export async function generateBranches(
  nodeData: NodeData,
  branchType: BranchType
): Promise<BranchResult> {
  await mockDelay(500 + Math.random() * 500);

  const pool = branchType === 'question' ? BRANCH_FROM_QUESTION : BRANCH_FROM_ANSWER;
  const index = simpleHash(nodeData.question + branchType) % pool.length;
  return pool[index];
}

// ============================================================
// Export as GenerationProvider
// ============================================================

export const mockGenerator: GenerationProvider = {
  generatePathQuestions,
  generateAnswer,
  generateBranches,
};

export default mockGenerator;
