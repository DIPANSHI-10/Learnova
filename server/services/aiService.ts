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

const STOP_WORDS = new Set(["about", "after", "also", "and", "are", "because", "been", "being", "between", "but", "can", "could", "each", "from", "have", "into", "more", "most", "not", "only", "other", "over", "should", "that", "the", "their", "there", "these", "this", "those", "through", "using", "very", "was", "were", "what", "when", "which", "with", "would", "your"]);

const clean = (value: string, max = 12000) => value.replace(/\0/g, "").replace(/\r/g, "").trim().slice(0, max);
const sentenceCase = (value: string) => value.trim().replace(/\s+/g, " ") || "your topic";

function sentences(source: string) {
  return clean(source, 50000)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 18);
}

function importantTerms(source: string, limit = 6) {
  const counts = new Map<string, number>();
  clean(source, 50000).toLowerCase().match(/[a-z][a-z0-9-]{3,}/g)?.forEach((word) => {
    if (!STOP_WORDS.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([word]) => word);
}

function chooseSentences(source: string, count: number) {
  const items = sentences(source);
  if (!items.length) return [clean(source, 1200) || "No readable study material was provided."];
  const terms = importantTerms(source, 30);
  const ranked = items.map((item, index) => ({ item, index, score: terms.reduce((total, term) => total + (item.toLowerCase().includes(term) ? 1 : 0), 0) + (index === 0 ? 1 : 0) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.min(count, items.length))
    .sort((a, b) => a.index - b.index)
    .map(({ item }) => item);
  return ranked;
}

function localSummary(source: string, length: "short" | "medium" | "detailed") {
  const sentenceCount = { short: 2, medium: 4, detailed: 7 }[length];
  const selected = chooseSentences(source, sentenceCount);
  const terms = importantTerms(source);
  return `## Summary\n${selected.join(" ")}\n\n## Key points\n${selected.slice(0, Math.min(5, selected.length)).map((item) => `- ${item}`).join("\n")}\n\n## Important terms\n${terms.length ? terms.map((term) => `- **${term}**`).join("\n") : "- Review the main definitions and examples in the material."}\n\n## Revision questions\n1. What is the main claim or purpose of this material?\n2. Which example best supports the main idea?\n3. Which important term would you need to explain in your own words?`;
}

function localDocumentReply(question: string, source: string) {
  const request = question.toLowerCase();
  const selected = chooseSentences(source, 5);
  const terms = importantTerms(source);
  if (request.includes("summar")) return localSummary(source, "medium");
  if (request.includes("key topic") || request.includes("topic")) {
    return `## Key topics\n${selected.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n## Terms to revise\n${terms.length ? terms.map((term) => `- ${term}`).join("\n") : "- Identify the core definitions in the selected passage."}`;
  }
  if (request.includes("question") || request.includes("quiz")) {
    return `## Practice questions\n${selected.slice(0, 4).map((item, index) => `${index + 1}. What does this part mean in your own words: “${item.slice(0, 150)}${item.length > 150 ? "…" : ""}”?`).join("\n")}\n\n## Self-check\nWhich term from the material can you define without looking at your notes?`;
  }
  if (request.includes("explain") || request.includes("simple")) {
    return `## Simple explanation\nThe material is mainly about **${terms.slice(0, 3).join(", ") || "the central idea"}**.\n\n${selected.slice(0, 2).map((item) => `- ${item}`).join("\n")}\n\nTry explaining the first point aloud, then connect it to one example from your course.`;
  }
  return `## Answer from your document\n${selected.slice(0, 3).map((item) => `- ${item}`).join("\n")}\n\n## Next step\nFocus on **${terms.slice(0, 3).join(", ") || "the key definitions"}** and ask a more specific question if you need a deeper explanation.`;
}

function fallbackCoachReply(prompt: string) {
  const materialMarker = "Study material excerpt:";
  const materialIndex = prompt.indexOf(materialMarker);
  if (materialIndex >= 0) return localDocumentReply(prompt.slice(0, materialIndex).trim(), prompt.slice(materialIndex + materialMarker.length));
  const subject = sentenceCase(prompt);
  const lower = subject.toLowerCase();
  if (lower.includes("quiz me")) return `## Let’s build a useful quiz\nTell me the exact topic, your course level, and whether you want easy, medium, or hard questions.\n\nFor example: \`Quiz me on DBMS normalization with 5 medium MCQs.\`\n\nOnce you share that, I will create distinct questions with explanations rather than repeating the same prompt.`;
  if (lower.includes("flashcard")) return `## Let’s create strong flashcards\nShare a topic or paste a short set of notes. I will turn the specific definitions, comparisons, and examples into separate question-and-answer cards.\n\nFor example: \`Create flashcards on ACID properties using these notes: ...\``;
  if (lower.includes("study plan") || lower.includes("plan my")) return `## Study-plan details I need\n1. Subject and topics\n2. Exam date\n3. Hours available each day\n4. Your current confidence level\n\nSend those details and I will help you make a focused schedule.`;
  return `## Let’s work through this\nYou asked about **${subject}**.\n\n1. State the central definition in your own words.\n2. Link it to one concrete example from your course.\n3. Test yourself without notes, then identify the missing detail.\n\nTell me your course level or paste the exact material if you want a tailored explanation, quiz, summary, or flashcard set.`;
}

export async function coachReply(prompt: string, context: string[] = []) {
  const safePrompt = clean(prompt, 4000);
  if (!safePrompt) throw new Error("A message is required.");
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are Learnova, an encouraging and academically precise study coach. Answer the actual request with structured Markdown. For document questions, cite only supplied material. Make quiz and flashcard answers specific, varied, and useful." },
        ...context.slice(-8).map((message) => ({ role: "user" as const, content: clean(message, 1800) })),
        { role: "user", content: safePrompt },
      ],
      maxTokens: 850,
    });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) return content.trim();
  } catch (error) {
    console.warn("[Learnova AI] Using local study response:", error instanceof Error ? error.message : error);
  }
  return fallbackCoachReply(safePrompt);
}

export async function createSummary(source: string, length: "short" | "medium" | "detailed") {
  const input = clean(source);
  if (!input) throw new Error("Text or an uploaded document is required.");
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are Learnova. Make a unique, source-grounded study summary with these Markdown sections: Summary, Key points, Important terms, Revision questions. Do not use generic filler." },
        { role: "user", content: `Requested length: ${length}.\n\nSource:\n${input}` },
      ],
      maxTokens: length === "detailed" ? 900 : 520,
    });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) return content.trim();
  } catch (error) {
    console.warn("[Learnova AI] Using local summary:", error instanceof Error ? error.message : error);
  }
  return localSummary(input, length);
}

export function buildStudyPlan(input: { subject: string; topics: string; availableHours: number; examDate?: Date | null }) {
  const topicList = input.topics.split(/[,\n]/).map((topic) => sentenceCase(topic)).filter(Boolean);
  const focusList = topicList.length ? topicList : ["Core concepts", "Worked examples", "Active recall", "Timed revision"];
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const exam = input.examDate ? new Date(input.examDate) : null;
  const examUtc = exam ? Date.UTC(exam.getFullYear(), exam.getMonth(), exam.getDate()) : null;
  const daysUntilExam = examUtc === null ? null : Math.max(1, Math.ceil((examUtc - todayUtc) / 86_400_000));
  const days = daysUntilExam ?? Math.max(4, Math.min(7, focusList.length + 2));
  const duration = `${Math.max(30, input.availableHours * 60)} min`;
  return Array.from({ length: days }, (_, index): StudyDay => ({
    day: index + 1,
    focus: index < focusList.length ? focusList[index] : index === days - 1 ? "Final recall and confidence check" : `Review ${focusList[index % focusList.length]}`,
    duration,
    complete: false,
  }));
}

export function buildQuiz(topic: string, difficulty: "easy" | "medium" | "hard", count: number, type: "mcq" | "true_false") {
  const safeTopic = sentenceCase(topic);
  const concepts = ["core definition", "key example", "common misconception", "real-world application", "comparison with a related concept", "step-by-step process", "important limitation", "best revision strategy"];
  return Array.from({ length: Math.min(Math.max(count, 5), 20) }, (_, index): QuizQuestion => {
    const concept = concepts[index % concepts.length];
    const number = index + 1;
    if (type === "true_false") {
      const trueStatement = `Understanding the ${concept} of ${safeTopic} with an example is useful before memorising isolated terms.`;
      const falseStatement = `You can master ${safeTopic} without understanding its ${concept} or checking your recall.`;
      const isTrue = index % 2 === 0;
      return { id: `q${number}`, prompt: isTrue ? trueStatement : falseStatement, options: ["True", "False"], answer: isTrue ? 0 : 1, explanation: isTrue ? `Examples make the ${concept} of ${safeTopic} easier to retrieve and apply.` : `Effective revision requires understanding and active recall, not passive memorisation alone.` };
    }
    const prompts = [
      `Which choice best demonstrates the ${concept} of ${safeTopic}?`,
      `What should you check first when applying ${safeTopic} to a new example?`,
      `Which mistake is most likely to weaken understanding of ${safeTopic}?`,
      `How can you test whether you truly understand the ${concept} in ${safeTopic}?`,
    ];
    const correct = ["Use a concrete example and explain the reasoning", "Identify the definition, conditions, and purpose", "Rely only on rereading without self-testing", "Explain the idea from memory and compare it with an example"][index % 4];
    const options = [correct, "Memorise one term without its context", "Skip the example and move to a new topic", "Assume the first answer is correct without checking"];
    return { id: `q${number}`, prompt: prompts[index % prompts.length], options, answer: 0, explanation: `${correct} is the strongest approach because it checks understanding of the ${concept} rather than passive recognition.` };
  });
}

export function buildFlashcards(topic: string, source?: string) {
  const safeTopic = sentenceCase(topic);
  const sourceSentences = clean(source || "", 12000).split(/[.!?\n]+/).map((item) => item.trim()).filter((item) => item.length > 3).slice(0, 8);
  if (sourceSentences.length) {
    return sourceSentences.map((item, index) => ({
      question: `Card ${index + 1}: What does this statement teach about ${safeTopic}?`,
      answer: item,
    }));
  }
  const concepts = ["core definition", "key purpose", "worked example", "common misconception", "comparison", "exam-ready explanation"];
  return concepts.map((concept, index) => ({
    question: `Card ${index + 1}: Explain the ${concept} of ${safeTopic}.`,
    answer: `State the ${concept}, connect it to one relevant example, and explain why it matters when applying ${safeTopic}.`,
  }));
}
