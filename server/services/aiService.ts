import { invokeLLM } from "../_core/llm";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type StudyDay = {
  day: number;
  focus: string;
  duration: string;
  complete: boolean;
};

const clean = (value: string, max = 12000) => value.replace(/\0/g, "").trim().slice(0, max);

function sentenceCase(value: string) {
  return value.trim().replace(/\s+/g, " ") || "your topic";
}

function fallbackCoachReply(prompt: string) {
  const subject = sentenceCase(prompt);
  return `Here is a focused way to work through **${subject}**:\n\n1. Start by identifying the core definition or learning objective.\n2. Work through one concrete example in your own words.\n3. Test recall without looking at your notes, then record the part that felt uncertain.\n\nIf you share your course level or a specific passage, I can tailor the explanation and a short revision plan.`;
}

export async function coachReply(prompt: string, context: string[] = []) {
  const safePrompt = clean(prompt, 4000);
  if (!safePrompt) throw new Error("A message is required.");
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are NovaMind, an encouraging and academically precise study coach. Give practical, structured answers, use clear markdown, and never claim to have accessed material the user did not provide.",
        },
        ...context.slice(-8).map((message) => ({ role: "user" as const, content: clean(message, 1800) })),
        { role: "user", content: safePrompt },
      ],
      maxTokens: 700,
    });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) return content.trim();
  } catch (error) {
    console.warn("[NovaMind AI] Falling back to local study coach:", error instanceof Error ? error.message : error);
  }
  return fallbackCoachReply(safePrompt);
}

export async function createSummary(source: string, length: "short" | "medium" | "detailed") {
  const input = clean(source);
  if (!input) throw new Error("Text or an uploaded document is required.");
  const words = input.split(/\s+/).filter(Boolean);
  const limits = { short: 55, medium: 125, detailed: 220 } as const;
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are NovaMind. Create a precise study summary with a Summary, Key points, Important terms, and Revision questions section. Use concise markdown." },
        { role: "user", content: `Requested length: ${length}.\n\nSource:\n${input}` },
      ],
      maxTokens: length === "detailed" ? 900 : 520,
    });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) return content.trim();
  } catch (error) {
    console.warn("[NovaMind AI] Falling back to local summarizer:", error instanceof Error ? error.message : error);
  }
  const excerpt = words.slice(0, limits[length]).join(" ");
  const keyTerms = Array.from(new Set(words.filter((word) => word.length > 6).slice(0, 6))).join(", ") || "the main concepts";
  return `## Summary\n${excerpt}${words.length > limits[length] ? "…" : ""}\n\n## Key points\n- Identify the central concept and its purpose.\n- Connect the explanation to one worked example.\n- Revisit the parts that require memorisation or comparison.\n\n## Important terms\n${keyTerms}\n\n## Revision questions\n1. What is the main idea in this material?\n2. How would you explain it simply?\n3. Which detail needs another review?`;
}

export function buildStudyPlan(input: { subject: string; topics: string; availableHours: number; examDate?: Date | null }) {
  const topics = input.topics.split(/[,\n]/).map((topic) => sentenceCase(topic)).filter(Boolean);
  const focusList = topics.length ? topics : ["Core concepts", "Worked examples", "Active recall", "Timed revision"];
  const days = Math.max(4, Math.min(7, focusList.length + 2));
  const duration = `${Math.max(30, input.availableHours * 60)} min`;
  const plan: StudyDay[] = Array.from({ length: days }, (_, index) => ({
    day: index + 1,
    focus: index < focusList.length ? focusList[index] : index === days - 1 ? "Mock recall and confidence check" : `Review ${focusList[index % focusList.length]}`,
    duration,
    complete: false,
  }));
  return plan;
}

export function buildQuiz(topic: string, difficulty: "easy" | "medium" | "hard", count: number, type: "mcq" | "true_false") {
  const safeTopic = sentenceCase(topic);
  return Array.from({ length: Math.min(Math.max(count, 5), 20) }, (_, index): QuizQuestion => {
    const number = index + 1;
    const statement = `A strong first step when learning ${safeTopic} is to identify its core definition and test it with an example.`;
    if (type === "true_false") {
      return { id: `q${number}`, prompt: statement, options: ["True", "False"], answer: 0, explanation: "Starting with the definition and a worked example creates a reliable foundation before moving to more complex questions." };
    }
    return {
      id: `q${number}`,
      prompt: `Which revision approach best strengthens your understanding of ${safeTopic}?`,
      options: ["Active recall with a concrete example", "Rereading without checking understanding", "Skipping definitions and focusing only on terminology", "Memorising isolated facts without context"],
      answer: 0,
      explanation: `Active recall helps you retrieve and apply the central ideas in ${safeTopic}.`,
    };
  });
}

export function buildFlashcards(topic: string, source?: string) {
  const safeTopic = sentenceCase(topic);
  const terms = (source || safeTopic).split(/[\n,.]/).map((value) => value.trim()).filter((value) => value.length > 4).slice(0, 8);
  const items = terms.length ? terms : ["Core concept", "Worked example", "Common misconception", "Exam strategy"];
  return items.map((term, index) => ({
    question: index === 0 ? `What is the central idea behind ${safeTopic}?` : `How does “${term}” connect to ${safeTopic}?`,
    answer: `Explain the concept in your own words, give one concise example, and connect it back to the learning objective for ${safeTopic}.`,
  }));
}
