/**
 * AI Provider — Groq integration
 *
 * Environment variables:
 *   AI_PROVIDER      Must be "groq" to activate AI features
 *   AI_API_KEY       Groq API key
 *   AI_MODEL         Text model (default: openai/gpt-oss-120b)
 *   STT_API_URL      Groq Whisper endpoint
 *   STT_API_KEY      Groq API key for STT (usually same as AI_API_KEY)
 *   TTS_API_URL      Leave empty — browser TTS is used
 *   TTS_API_KEY      Leave empty
 */

export const AI_CONFIG = {
  provider: process.env.AI_PROVIDER ?? "",
  apiKey: process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  model: process.env.AI_MODEL ?? "openai/gpt-oss-120b",
  sttUrl: process.env.STT_API_URL ?? "",
  sttKey: process.env.STT_API_KEY ?? "",
  ttsUrl: process.env.TTS_API_URL ?? "",
  ttsKey: process.env.TTS_API_KEY ?? "",
};

/** Text AI is active only when provider is "groq" and a key is present */
export const textAiConfigured = () =>
  Boolean(AI_CONFIG.apiKey && AI_CONFIG.provider === "groq");

/** STT is active when a Groq STT URL and key are present */
export const sttConfigured = () =>
  Boolean(AI_CONFIG.sttUrl && AI_CONFIG.sttKey);

/** TTS: browser-only for now */
export const ttsConfigured = () => false;

export type AiQuestion = {
  category: string;
  skill: string;
  question: string;
  guidance: { points: string[]; star: boolean };
};

type GroqChatResponse = {
  choices: { message: { content: string } }[];
};

/** Call Groq chat completions endpoint */
async function groqChat(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      console.error("[Groq] Chat error:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as GroqChatResponse;
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[Groq] Chat exception:", err);
    return null;
  }
}

/** Generate interview questions using Groq */
export async function aiGenerateQuestions(
  input: { input: { mode: string; jobTitle: string; company: string; description: string }; count: number }
): Promise<AiQuestion[] | null> {
  if (!textAiConfigured()) return null;

  const roleHint = input.input.jobTitle || "professional candidate";
  const context =
    input.input.mode === "description"
      ? input.input.description
      : `Job title: ${input.input.jobTitle}${input.input.company ? `, Company: ${input.input.company}` : ""}`;

  const prompt = `You are an expert technical interviewer. Generate exactly ${input.count} diverse interview questions for a ${roleHint} role.

Context:
${context}

Requirements:
- Mix question categories: Technical, Behavioral, Culture Fit, HR & Logistics
- Each question must be specific and relevant to the role
- guidance.points must have 3-4 coaching tips for a strong answer
- Set guidance.star to true only for Behavioral questions
- skill should be a concise label (e.g. "React", "Communication", "Problem Solving")

Respond with ONLY a valid JSON object in this exact format:
{"questions": [{"category": "Technical", "skill": "React", "question": "...", "guidance": {"points": ["...", "...", "..."], "star": false}}]}`;

  const content = await groqChat(prompt);
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as { questions?: AiQuestion[] };
    const questions = parsed.questions;
    if (!Array.isArray(questions) || questions.length === 0) return null;
    return questions;
  } catch {
    console.error("[Groq] Failed to parse question JSON:", content);
    return null;
  }
}

export type AiEvaluation = {
  clarity: number;
  structure: number;
  relevance: number;
  technical: number;
  overall: number;
  verdict: string;
  feedback: string;
  issues: string[];
  strengths: string[];
  improvements: string[];
  modelAnswerPoints: string[];
  metrics: { words: number; fillers: number };
};

/** Evaluate a candidate answer using Groq */
export async function aiEvaluateAnswer(input: {
  jobDescription: string;
  question: string;
  answer: string;
}): Promise<AiEvaluation | null> {
  if (!textAiConfigured()) return null;

  const wordCount = input.answer.trim().split(/\s+/).filter(Boolean).length;
  const fillerCount = (input.answer.match(/\b(um+|uh+|like,|you know|i mean|basically|actually)\b/gi) ?? []).length;

  const prompt = `You are an expert interview coach. Evaluate the following interview answer.

Job Context: ${input.jobDescription.slice(0, 800)}
Interview Question: ${input.question}
Candidate Answer: ${input.answer}

Scoring criteria (0-100 integers):
- clarity: How clear and well-expressed is the answer?
- structure: Does it follow a logical order (STAR for behavioral, steps for technical)?
- relevance: How directly does it answer the question with relevant examples?
- technical: How technically accurate and specific is the answer?
- overall: Weighted average of all four scores

Also provide:
- verdict: one of "Strong answer", "Good answer", "Needs work", "Weak answer"
- feedback: one coaching sentence
- issues: array of 1-3 specific issues found (be concrete, e.g. "No measurable result was given")
- strengths: array of 1-3 things done well
- improvements: array of 1-3 actionable improvement tips
- modelAnswerPoints: array of 3-4 bullet points that a model answer would cover

Respond with ONLY a valid JSON object:
{"clarity": 75, "structure": 70, "relevance": 80, "technical": 65, "overall": 73, "verdict": "Good answer", "feedback": "...", "issues": ["..."], "strengths": ["..."], "improvements": ["..."], "modelAnswerPoints": ["..."]}`;

  const content = await groqChat(prompt);
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as Partial<AiEvaluation>;
    // Validate required numeric fields
    const clarity = Number(parsed.clarity ?? 0);
    const structure = Number(parsed.structure ?? 0);
    const relevance = Number(parsed.relevance ?? 0);
    const technical = Number(parsed.technical ?? 0);
    const overall = Number(parsed.overall ?? Math.round((clarity + structure + relevance + technical) / 4));

    return {
      clarity: Math.max(0, Math.min(100, clarity)),
      structure: Math.max(0, Math.min(100, structure)),
      relevance: Math.max(0, Math.min(100, relevance)),
      technical: Math.max(0, Math.min(100, technical)),
      overall: Math.max(0, Math.min(100, overall)),
      verdict: String(parsed.verdict ?? "Good answer"),
      feedback: String(parsed.feedback ?? "Keep practising."),
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : ["Review your answer for clarity."],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : ["Answered the question."],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : ["Add more detail."],
      modelAnswerPoints: Array.isArray(parsed.modelAnswerPoints) ? parsed.modelAnswerPoints.map(String) : ["Structure your answer clearly."],
      metrics: { words: wordCount, fillers: fillerCount },
    };
  } catch {
    console.error("[Groq] Failed to parse evaluation JSON:", content);
    return null;
  }
}

/** Transcribe audio using Groq Whisper */
export async function aiTranscribeAudio(audio: ArrayBuffer): Promise<string | null> {
  if (!sttConfigured()) return null;

  try {
    const formData = new FormData();
    formData.append("file", new Blob([audio], { type: "audio/webm" }), "recording.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("language", "en");
    formData.append("response_format", "json");

    const res = await fetch(AI_CONFIG.sttUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${AI_CONFIG.sttKey}` },
      body: formData,
    });

    if (!res.ok) {
      console.error("[Groq STT] Error:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { text?: string };
    return data.text?.trim() ?? null;
  } catch (err) {
    console.error("[Groq STT] Exception:", err);
    return null;
  }
}

/** TTS: browser-only — no server-side provider configured */
export async function aiSynthesizeSpeech(_text: string): Promise<ArrayBuffer | null> {
  return null;
}
