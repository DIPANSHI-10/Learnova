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

type StudyFact = { term: string; detail: string; example: string };

const STOP_WORDS = new Set(["about", "after", "also", "and", "are", "because", "been", "being", "between", "but", "can", "could", "each", "from", "have", "into", "more", "most", "not", "only", "other", "over", "should", "that", "the", "their", "there", "these", "this", "those", "through", "using", "very", "was", "were", "what", "when", "which", "with", "would", "your"]);
const clean = (value: string, max = 12000) => value.replace(/\0/g, "").replace(/\r/g, "").trim().slice(0, max);
const sentenceCase = (value: string) => value.trim().replace(/\s+/g, " ") || "your topic";

const STUDY_KNOWLEDGE: Array<{ matches: string[]; label: string; facts: StudyFact[] }> = [
  {
    matches: ["dbms", "database", "normalization", "sql", "primary key", "foreign key", "acid", "er model", "relational"], label: "Database management systems", facts: [
      { term: "Primary key", detail: "A primary key uniquely identifies every row in a table, so its value must be unique and non-null.", example: "In a Student table, student_id can identify one specific student." },
      { term: "Foreign key", detail: "A foreign key stores a value that refers to a key in another table and creates a relationship between the tables.", example: "Enrollment.student_id can refer to Student.student_id." },
      { term: "Normalization", detail: "Normalization organizes related data into well-designed tables to reduce unnecessary duplication and update anomalies.", example: "Store a department once in a Department table instead of repeating its details for every student." },
      { term: "First normal form", detail: "First normal form requires each field to contain one atomic value rather than a repeating list.", example: "Keep one phone number per field or move multiple phone numbers to a related table." },
      { term: "Second normal form", detail: "Second normal form removes partial dependency so every non-key attribute depends on the complete key.", example: "In a composite-key table, move a value that depends on only one key part to its own table." },
      { term: "Third normal form", detail: "Third normal form removes transitive dependency so non-key attributes depend directly on the key, not on another non-key attribute.", example: "Store department name with its department ID rather than repeating it in each employee row." },
      { term: "SQL", detail: "SQL is used to define, query, insert, update, and control data in relational databases.", example: "A SELECT statement retrieves rows that match a condition." },
      { term: "ACID transaction", detail: "ACID properties help a transaction remain reliable by making its work atomic, consistent, isolated, and durable.", example: "A bank transfer should not subtract money from one account unless the destination update also succeeds." },
    ],
  },
  {
    matches: ["python", "programming", "function", "list", "dictionary", "loop", "exception"], label: "Python programming", facts: [
      { term: "Variable", detail: "A variable names a value so a program can use or update it later.", example: "total = 0 stores a number that can be changed while a loop runs." },
      { term: "Function", detail: "A function groups reusable instructions behind a name and can receive inputs and return a result.", example: "def average(values) can calculate a result for many different lists." },
      { term: "List", detail: "A list keeps an ordered collection of items and can be changed after it is created.", example: "subjects = ['DBMS', 'OS', 'Python'] keeps study subjects in order." },
      { term: "Dictionary", detail: "A dictionary maps a unique key to a value for fast labelled lookup.", example: "marks['DBMS'] can return the DBMS score." },
      { term: "Loop", detail: "A loop repeats a block of code over a sequence or while a condition remains true.", example: "for subject in subjects processes each subject once." },
      { term: "Exception handling", detail: "Exception handling lets a program respond safely when an expected operation fails.", example: "try/except can show a useful message when a file cannot be opened." },
      { term: "Module", detail: "A module is a Python file or library that provides reusable code for another program to import.", example: "import math gives access to mathematical functions." },
      { term: "Class", detail: "A class defines a reusable blueprint that combines related data and behaviour.", example: "A Student class can keep a name, marks, and methods for calculation." },
    ],
  },
  {
    matches: ["operating system", "os", "process", "thread", "scheduling", "paging", "deadlock", "memory management"], label: "Operating systems", facts: [
      { term: "Process", detail: "A process is a running program with its own memory and operating-system resources.", example: "A browser and a code editor can run as separate processes." },
      { term: "Thread", detail: "A thread is an execution path inside a process; threads in the same process can share resources.", example: "One thread can keep a user interface responsive while another performs work." },
      { term: "CPU scheduling", detail: "CPU scheduling decides which ready process or thread receives processor time next.", example: "Round robin gives each ready task a small time slice in turn." },
      { term: "Paging", detail: "Paging divides memory into fixed-size pages and frames so a program can use non-contiguous physical memory.", example: "The OS can place different pages of one program in different memory frames." },
      { term: "Deadlock", detail: "Deadlock occurs when processes wait indefinitely for resources held by one another.", example: "Two processes can each hold one lock while waiting for the other lock." },
      { term: "Virtual memory", detail: "Virtual memory lets the OS use disk-backed pages to give each process an address space larger than physical RAM.", example: "Inactive pages can be moved out of RAM when memory is needed elsewhere." },
    ],
  },
  {
    matches: ["network", "computer network", "tcp", "udp", "osi", "ip address", "dns", "http"], label: "Computer networks", facts: [
      { term: "OSI model", detail: "The OSI model separates network communication into layers so each layer has a focused responsibility.", example: "Application protocols use lower layers to move data across a network." },
      { term: "TCP", detail: "TCP provides reliable ordered delivery by establishing a connection and recovering from lost data.", example: "A web page can use TCP so its response arrives in the intended order." },
      { term: "UDP", detail: "UDP sends datagrams with lower overhead but does not guarantee delivery or order.", example: "A live call may prefer speed over retransmitting an old packet." },
      { term: "IP address", detail: "An IP address identifies a network interface so routers can direct packets toward the destination.", example: "A router uses the destination IP address to choose a next hop." },
      { term: "DNS", detail: "DNS translates a human-readable domain name into an IP address that network software can use.", example: "A browser asks DNS for the address of a website before connecting." },
      { term: "HTTP", detail: "HTTP defines request-and-response communication between a client and a web server.", example: "A browser sends an HTTP request and receives page data in a response." },
    ],
  },
  {
    matches: ["data structure", "array", "linked list", "stack", "queue", "tree", "graph", "hash"], label: "Data structures", facts: [
      { term: "Array", detail: "An array stores items in indexed positions, making direct access by index efficient.", example: "marks[2] can retrieve the third mark directly." },
      { term: "Linked list", detail: "A linked list stores nodes that point to the next node, making insertion flexible when the location is known.", example: "A new node can be linked between two existing nodes without moving every later item." },
      { term: "Stack", detail: "A stack follows last-in, first-out order: the newest item is removed first.", example: "Undo actions are often managed as a stack." },
      { term: "Queue", detail: "A queue follows first-in, first-out order: the earliest item is served first.", example: "Print jobs can wait in a queue." },
      { term: "Tree", detail: "A tree organizes nodes in parent-child relationships, often for hierarchical searching or categorisation.", example: "A file system can be represented as a tree of folders and files." },
      { term: "Hash table", detail: "A hash table maps keys to positions so lookups are usually fast.", example: "A dictionary can retrieve a student record using the student ID as a key." },
    ],
  },
];

function sentences(source: string, minimum = 18) {
  return clean(source, 50000).split(/(?<=[.!?])\s+|\n+/).map((item) => item.replace(/\s+/g, " ").trim()).filter((item) => item.length >= minimum);
}

function importantTerms(source: string, limit = 6) {
  const counts = new Map<string, number>();
  clean(source, 50000).toLowerCase().match(/[a-z][a-z0-9-]{3,}/g)?.forEach((word) => {
    if (!STOP_WORDS.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([word]) => word);
}

function chooseSentences(source: string, count: number, query = "") {
  const items = sentences(source);
  if (!items.length) return [clean(source, 1200) || "No readable study material was provided."];
  const terms = [...importantTerms(source, 24), ...importantTerms(query, 8)];
  return items.map((item, index) => ({ item, index, score: terms.reduce((total, term) => total + (item.toLowerCase().includes(term) ? 2 : 0), 0) + (index === 0 ? 1 : 0) }))
    .sort((a, b) => b.score - a.score || a.index - b.index).slice(0, Math.min(count, items.length)).sort((a, b) => a.index - b.index).map(({ item }) => item);
}

function knowledgeFor(topic: string) {
  const lower = topic.toLowerCase();
  return STUDY_KNOWLEDGE.find((entry) => entry.matches.some((match) => lower.includes(match)));
}

function genericFacts(topic: string): StudyFact[] {
  const readableTopic = sentenceCase(topic);
  const words = importantTerms(readableTopic, 5);
  const anchors = words.length ? words : [readableTopic];
  return [
    { term: `${readableTopic}: central idea`, detail: `The central idea of ${readableTopic} is the definition, purpose, and conditions that make it useful.`, example: `Explain ${readableTopic} in your own words before memorising terms.` },
    { term: `${readableTopic}: purpose`, detail: `${readableTopic} should be connected to the problem it solves rather than learned as an isolated definition.`, example: `Ask which real situation would require ${readableTopic}.` },
    { term: `${readableTopic}: process`, detail: `A strong answer should describe the steps, order, or conditions involved in ${readableTopic}.`, example: `Write the process as a short numbered explanation.` },
    { term: `${readableTopic}: example`, detail: `A concrete example makes the meaning and limits of ${readableTopic} easier to recall and apply.`, example: `Create one example involving ${anchors.join(", ")}.` },
    { term: `${readableTopic}: misconception`, detail: `A common revision mistake is repeating a definition without checking when ${readableTopic} applies or does not apply.`, example: `Contrast a correct example with a near-miss case.` },
    { term: `${readableTopic}: comparison`, detail: `Comparing ${readableTopic} with a related idea reveals its distinguishing features.`, example: `List two similarities and two differences with a related concept.` },
  ];
}

function sourceFacts(topic: string, source: string): StudyFact[] {
  const items = sentences(source, 4).slice(0, 10);
  return items.map((detail, index) => {
    const term = importantTerms(detail, 1)[0] || `${sentenceCase(topic)} idea ${index + 1}`;
    return { term: term.replace(/\b\w/g, (letter) => letter.toUpperCase()), detail, example: `Find one course example that demonstrates: ${detail}` };
  });
}

function factsFor(topic: string, source?: string) {
  const fromSource = source ? sourceFacts(topic, source) : [];
  const library = knowledgeFor(topic)?.facts || genericFacts(topic);
  const unique = new Map<string, StudyFact>();
  [...fromSource, ...library].forEach((fact) => {
    const key = `${fact.term}|${fact.detail}`.toLowerCase();
    if (!unique.has(key)) unique.set(key, fact);
  });
  return Array.from(unique.values()).slice(0, 8);
}

function inferTopic(prompt: string) {
  const known = knowledgeFor(prompt);
  if (known) return known.label;
  const withoutInstructions = prompt.replace(/^(please\s+)?(explain|teach|define|compare|quiz me on|create (a )?(study )?plan for|make|turn).*?(?:about|on|for)?\s*/i, "");
  return sentenceCase(withoutInstructions.split(/[.!?\n]/)[0].slice(0, 120) || prompt);
}

function localSummary(source: string, length: "short" | "medium" | "detailed") {
  const selected = chooseSentences(source, { short: 2, medium: 4, detailed: 7 }[length]);
  const terms = importantTerms(source);
  const keyQuestions = terms.slice(0, 3).map((term, index) => `${index + 1}. How would you define **${term}** using an example from this material?`);
  return `## Summary\n${selected.join(" ")}\n\n## Key points\n${selected.map((item) => `- ${item}`).join("\n")}\n\n## Important terms\n${terms.length ? terms.map((term) => `- **${term}**`).join("\n") : "- Revisit the central definition and the examples in the material."}\n\n## Revision questions\n${keyQuestions.length ? keyQuestions.join("\n") : "1. What is the main claim of this material?\n2. Which example supports that claim?\n3. What could you explain without looking at the notes?"}`;
}

function localDocumentReply(question: string, source: string) {
  const request = question.toLowerCase();
  const selected = chooseSentences(source, 5, question);
  const terms = importantTerms(`${question}\n${source}`, 6);
  if (request.includes("summar")) return localSummary(source, "medium");
  if (request.includes("question") || request.includes("quiz")) return `## Revision questions from your material\n${selected.slice(0, 5).map((item, index) => `${index + 1}. Explain this idea in your own words: “${item.slice(0, 180)}${item.length > 180 ? "…" : ""}”`).join("\n")}\n\n## Focus terms\n${terms.slice(0, 5).map((term) => `- ${term}`).join("\n")}`;
  if (request.includes("explain") || request.includes("simple") || request.includes("what")) return `## Answer from your uploaded material\n${selected.slice(0, 3).map((item) => `- ${item}`).join("\n")}\n\n## In simple words\nThese passages point to **${terms.slice(0, 3).join(", ") || "the main idea"}**. Connect each point to one example from your course to check that you can apply it, not only recognise it.`;
  return `## Answer from your uploaded material\n${selected.slice(0, 4).map((item) => `- ${item}`).join("\n")}\n\n## Best next revision step\nWrite a one-sentence explanation of **${terms[0] || "the central idea"}** and support it with one detail from the material.`;
}

function fallbackCoachReply(prompt: string) {
  const marker = "Study material excerpt:";
  const materialIndex = prompt.indexOf(marker);
  if (materialIndex >= 0) return localDocumentReply(prompt.slice(0, materialIndex).trim(), prompt.slice(materialIndex + marker.length));
  const topic = inferTopic(prompt);
  const facts = factsFor(topic);
  const lower = prompt.toLowerCase();
  if (lower.includes("quiz")) {
    const questions = buildQuiz(topic, "medium", 5, "mcq");
    return `## Five practice questions: ${topic}\n${questions.map((question, index) => `${index + 1}. ${question.prompt}\n   **Answer:** ${question.options[question.answer]}\n   **Why:** ${question.explanation}`).join("\n\n")}`;
  }
  if (lower.includes("flashcard")) {
    const cards = buildFlashcards(topic);
    return `## Revision cards: ${topic}\n${cards.slice(0, 5).map((card, index) => `**${index + 1}. ${card.question}**\n${card.answer}`).join("\n\n")}`;
  }
  if (lower.includes("study plan") || lower.includes("plan") || lower.includes("revise")) {
    const plan = buildStudyPlan({ subject: topic, topics: facts.slice(0, 3).map((fact) => fact.term).join(", "), availableHours: 1 });
    return `## Three focused study days for ${topic}\n${plan.slice(0, 3).map((day) => `- **Day ${day.day}: ${day.focus}** — ${day.duration}. Use one definition, one example, and one recall question.`).join("\n")}`;
  }
  return `## ${topic}\n${facts.slice(0, 3).map((fact) => `### ${fact.term}\n${fact.detail}\n*Example:* ${fact.example}`).join("\n\n")}\n\n## Quick self-check\nExplain **${facts[0]?.term || topic}** in one sentence, then give a different example without looking at this answer.`;
}

function parseQuiz(value: unknown, count: number, optionCount: number): QuizQuestion[] | null {
  if (!value || typeof value !== "object" || !Array.isArray((value as { questions?: unknown }).questions)) return null;
  const questions = (value as { questions: unknown[] }).questions.slice(0, count).map((item, index) => {
    const question = item as Partial<QuizQuestion>;
    if (typeof question.prompt !== "string" || !Array.isArray(question.options) || question.options.length !== optionCount || typeof question.answer !== "number" || question.answer < 0 || question.answer >= optionCount || typeof question.explanation !== "string" || new Set(question.options).size !== optionCount) return null;
    return { id: `q${index + 1}`, prompt: question.prompt.trim(), options: question.options.map(String), answer: question.answer, explanation: question.explanation.trim() };
  });
  return questions.some((question) => question === null) || new Set(questions.map((question) => question!.prompt.toLowerCase())).size !== questions.length ? null : questions as QuizQuestion[];
}

function parseCards(value: unknown, count: number) {
  if (!value || typeof value !== "object" || !Array.isArray((value as { cards?: unknown }).cards)) return null;
  const cards = (value as { cards: unknown[] }).cards.slice(0, count).map((item) => {
    const card = item as { question?: unknown; answer?: unknown };
    if (typeof card.question !== "string" || typeof card.answer !== "string" || card.question.trim().length < 8 || card.answer.trim().length < 8) return null;
    return { question: card.question.trim(), answer: card.answer.trim() };
  });
  return cards.some((card) => card === null) || new Set(cards.map((card) => card!.question.toLowerCase())).size !== cards.length ? null : cards as Array<{ question: string; answer: string }>;
}

export async function coachReply(prompt: string, context: string[] = []) {
  const safePrompt = clean(prompt, 12000);
  if (!safePrompt) throw new Error("A message is required.");
  try {
    const response = await invokeLLM({ model: "gpt-5-mini", messages: [
      { role: "system", content: "You are Learnova, an academically accurate study coach. Answer the exact question, not a generic coaching template. Use supplied document material as your evidence when it is present. Write concise Markdown with a direct answer, a concrete example, and one self-check. Never claim to have read material that was not supplied." },
      ...context.slice(-8).map((message) => ({ role: "user" as const, content: clean(message, 1800) })),
      { role: "user", content: safePrompt },
    ], maxTokens: 1200 });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim().length > 40) return content.trim();
  } catch (error) {
    console.warn("[Learnova AI] Using local topic-aware response:", error instanceof Error ? error.message : error);
  }
  return fallbackCoachReply(safePrompt);
}

export async function createSummary(source: string, length: "short" | "medium" | "detailed") {
  const input = clean(source);
  if (!input) throw new Error("Text or an uploaded document is required.");
  try {
    const response = await invokeLLM({ model: "gpt-5-mini", messages: [
      { role: "system", content: "Create a source-grounded study summary in Markdown with exactly these sections: Summary, Key points, Important terms, Revision questions. Every key point and question must be traceable to the source. Do not use generic filler." },
      { role: "user", content: `Requested length: ${length}.\n\nSource:\n${input}` },
    ], maxTokens: length === "detailed" ? 1100 : length === "medium" ? 720 : 460 });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim().length > 80) return content.trim();
  } catch (error) {
    console.warn("[Learnova AI] Using local source summary:", error instanceof Error ? error.message : error);
  }
  return localSummary(input, length);
}

export function buildStudyPlan(input: { subject: string; topics: string; availableHours: number; examDate?: Date | null }) {
  const topicList = input.topics.split(/[,\n]/).map((topic) => sentenceCase(topic)).filter(Boolean);
  const focusList = topicList.length ? topicList : factsFor(input.subject).slice(0, 4).map((fact) => fact.term);
  const today = new Date(); const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()); const exam = input.examDate ? new Date(input.examDate) : null; const examUtc = exam ? Date.UTC(exam.getFullYear(), exam.getMonth(), exam.getDate()) : null;
  const daysUntilExam = examUtc === null ? null : Math.max(1, Math.ceil((examUtc - todayUtc) / 86_400_000)); const days = daysUntilExam ?? Math.max(4, Math.min(7, focusList.length + 2)); const duration = `${Math.max(30, input.availableHours * 60)} min`;
  return Array.from({ length: days }, (_, index): StudyDay => ({ day: index + 1, focus: index < focusList.length ? focusList[index] : index === days - 1 ? "Final recall and confidence check" : `Apply ${focusList[index % focusList.length]} to a new example`, duration, complete: false }));
}

export function buildQuiz(topic: string, difficulty: "easy" | "medium" | "hard", count: number, type: "mcq" | "true_false", source?: string): QuizQuestion[] {
  const safeTopic = sentenceCase(topic); const facts = factsFor(safeTopic, source); const total = Math.min(Math.max(count, 5), 20);
  return Array.from({ length: total }, (_, index) => {
    const fact = facts[index % facts.length] || genericFacts(safeTopic)[index % 6]; const number = index + 1;
    if (type === "true_false") {
      const isTrue = index % 2 === 0;
      const prompt = isTrue ? `${fact.term}: ${fact.detail}` : `${fact.term} has no practical purpose in ${safeTopic} and should be memorised without examples.`;
      return { id: `q${number}`, prompt, options: ["True", "False"], answer: isTrue ? 0 : 1, explanation: isTrue ? fact.detail : `${fact.term} matters because ${fact.detail.toLowerCase()}` };
    }
    const distractors = facts.filter((item) => item.term !== fact.term).map((item) => item.detail).concat([`It has no conditions, examples, or limits that need to be checked.`]).filter((value, itemIndex, list) => list.indexOf(value) === itemIndex).slice(0, 3);
    while (distractors.length < 3) distractors.push(`It is unrelated to the purpose and application of ${safeTopic}.`);
    const correctIndex = index % 4; const options = [...distractors]; options.splice(correctIndex, 0, fact.detail);
    const style = difficulty === "easy" ? "Which statement best describes" : difficulty === "hard" ? "Which statement most accurately applies" : "Which explanation correctly connects";
    return { id: `q${number}`, prompt: `${style} **${fact.term}** in ${safeTopic}?`, options, answer: correctIndex, explanation: `${fact.detail} ${fact.example}` };
  });
}

export async function createQuiz(topic: string, difficulty: "easy" | "medium" | "hard", count: number, type: "mcq" | "true_false") {
  const safeTopic = sentenceCase(topic); const total = Math.min(Math.max(count, 5), 20);
  try {
    const response = await invokeLLM({ model: "gpt-5-mini", messages: [
      { role: "system", content: "Generate factually accurate, topic-specific study questions. Every question must test a different concept. For MCQ, produce four distinct and plausible options, vary the correct option position, and explain why the correct answer is right. Avoid generic study-skills questions." },
      { role: "user", content: `Topic: ${safeTopic}\nDifficulty: ${difficulty}\nQuestion type: ${type}\nCreate exactly ${total} questions.` },
    ], maxTokens: 2600, response_format: { type: "json_schema", json_schema: { name: "learnova_quiz", strict: true, schema: { type: "object", properties: { questions: { type: "array", minItems: total, maxItems: total, items: { type: "object", properties: { prompt: { type: "string" }, options: { type: "array", minItems: type === "mcq" ? 4 : 2, maxItems: type === "mcq" ? 4 : 2, items: { type: "string" } }, answer: { type: "integer", minimum: 0, maximum: type === "mcq" ? 3 : 1 }, explanation: { type: "string" } }, required: ["prompt", "options", "answer", "explanation"], additionalProperties: false } } }, required: ["questions"], additionalProperties: false } } } });
    const content = response.choices?.[0]?.message?.content; const parsed = typeof content === "string" ? parseQuiz(JSON.parse(content), total, type === "mcq" ? 4 : 2) : null; if (parsed) return parsed;
  } catch (error) { console.warn("[Learnova AI] Using local varied quiz:", error instanceof Error ? error.message : error); }
  return buildQuiz(safeTopic, difficulty, total, type);
}

export function buildFlashcards(topic: string, source?: string) {
  const safeTopic = sentenceCase(topic); const facts = factsFor(safeTopic, source);
  return facts.map((fact, index) => ({ question: `${index + 1}. What is **${fact.term}** and why does it matter in ${safeTopic}?`, answer: `${fact.detail}\n\nExample: ${fact.example}` }));
}

export async function createFlashcards(topic: string, source?: string) {
  const safeTopic = sentenceCase(topic); const sourceText = clean(source || "", 12000);
  try {
    const response = await invokeLLM({ model: "gpt-5-mini", messages: [
      { role: "system", content: "Create eight distinct, exam-useful flashcards. Each card needs a specific question and a concise factual answer. Cover different definitions, comparisons, processes, applications, limits, or examples. If source material is supplied, ground every card in it. Never use Card 1/Card 2 template wording." },
      { role: "user", content: `Topic: ${safeTopic}\n${sourceText ? `Source material:\n${sourceText}` : "Create cards from established core concepts for the topic."}` },
    ], maxTokens: 2000, response_format: { type: "json_schema", json_schema: { name: "learnova_flashcards", strict: true, schema: { type: "object", properties: { cards: { type: "array", minItems: 6, maxItems: 8, items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } }, required: ["question", "answer"], additionalProperties: false } } }, required: ["cards"], additionalProperties: false } } } });
    const content = response.choices?.[0]?.message?.content; const parsed = typeof content === "string" ? parseCards(JSON.parse(content), 8) : null; if (parsed) return parsed;
  } catch (error) { console.warn("[Learnova AI] Using local distinct flashcards:", error instanceof Error ? error.message : error); }
  return buildFlashcards(safeTopic, sourceText);
}
