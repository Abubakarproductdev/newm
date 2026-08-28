import { NextResponse } from "next/server";
import { answersStore, counter, questionsStore, sessionsStore } from "@/lib/memory-db";
import { aiEvaluateAnswer, textAiConfigured } from "@/lib/ai-provider";
import { evaluateAnswer } from "@/lib/interview";
import type { AnswerRow } from "@/lib/session-types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const sessionId = Number(body.sessionId);
    const questionId = Number(body.questionId);
    const transcript = String(body.transcript ?? "").trim();
    const inputMode = body.inputMode === "text" ? "text" : "voice";

    if (!Number.isFinite(sessionId) || !Number.isFinite(questionId)) {
      return NextResponse.json(
        { error: "sessionId and questionId are required" },
        { status: 400 }
      );
    }
    if (transcript.length < 3) {
      return NextResponse.json(
        { error: "Please answer before submitting." },
        { status: 400 }
      );
    }

    const fallbackSession = body.session as any;
    const fallbackQuestion = body.question as any;

    const session = sessionsStore.get(sessionId) || fallbackSession;
    const questions = questionsStore.get(sessionId) ?? [];
    const question = questions.find(
      (q) => q.id === questionId && q.sessionId === sessionId
    ) || fallbackQuestion;

    if (!session || !question) {
      return NextResponse.json(
        { error: "Question not found in this session" },
        { status: 404 }
      );
    }


    // Try AI evaluation; fall back to heuristic engine
    const aiEvaluation = await aiEvaluateAnswer({
      jobDescription: session.jobDescription,
      question: question.question,
      answer: transcript,
    });
    const evaluation =
      aiEvaluation ??
      evaluateAnswer({
        answer: transcript,
        category: question.category,
        skill: question.skill,
        question: question.question,
        role: session.role,
      });

    const answerId = counter.answer++;
    const saved: AnswerRow = {
      id: answerId,
      questionId,
      transcript,
      inputMode,
      clarity: evaluation.clarity,
      structure: evaluation.structure,
      relevance: evaluation.relevance,
      technical: evaluation.technical,
      overall: evaluation.overall,
      issues: evaluation.issues,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      modelAnswerPoints: evaluation.modelAnswerPoints,
    };

    if (!answersStore.has(sessionId)) {
      answersStore.set(sessionId, []);
    }
    answersStore.get(sessionId)!.push(saved);

    return NextResponse.json({
      answer: saved,
      evaluation,
      generatedBy:
        aiEvaluation && textAiConfigured() ? "ai" : "builtin",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not evaluate the answer.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
