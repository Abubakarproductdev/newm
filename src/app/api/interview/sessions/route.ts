import { NextResponse } from "next/server";
import { sessionsStore, questionsStore, counter } from "@/lib/memory-db";
import { aiGenerateQuestions, textAiConfigured } from "@/lib/ai-provider";
import { buildPlan, type PlanInput } from "@/lib/interview";
import type { SessionRow, QuestionRow } from "@/lib/session-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = Array.from(sessionsStore.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    return NextResponse.json({ sessions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load sessions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const mode: PlanInput["mode"] = body.mode === "title" ? "title" : "description";
    const input: PlanInput = {
      mode,
      jobTitle: String(body.jobTitle ?? "").slice(0, 120),
      company: String(body.company ?? "").slice(0, 120),
      description: String(body.description ?? "").slice(0, 6000),
    };

    if (mode === "title" && !input.jobTitle.trim()) {
      return NextResponse.json({ error: "Enter a job title to start the interview." }, { status: 400 });
    }
    if (mode === "description" && !input.description.trim()) {
      return NextResponse.json({ error: "Paste the job description to start the interview." }, { status: 400 });
    }

    const questionCount = Math.min(12, Math.max(3, Number(body.questionCount) || 5));
    const plan = buildPlan(input, questionCount);

    // Try AI question generation; fall back to deterministic engine if unavailable
    const aiQuestions = await aiGenerateQuestions({ input, count: questionCount });
    const usingAi = Boolean(aiQuestions) && textAiConfigured();

    const sessionId = counter.session++;
    const session: SessionRow = {
      id: sessionId,
      role: plan.role,
      inputMode: mode,
      jobTitle: input.jobTitle || plan.role,
      company: input.company,
      jobDescription: mode === "description" ? input.description : (input.description || input.jobTitle),
      questionCount: plan.questions.length,
      skills: plan.skills,
      status: "in_progress",
      overallScore: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    sessionsStore.set(sessionId, session);

    const sourcePlanQuestions = aiQuestions?.length ? aiQuestions : plan.questions;
    const questions: QuestionRow[] = sourcePlanQuestions.map((q, i) => ({
      id: counter.question++,
      sessionId,
      position: i + 1,
      category: q.category,
      skill: q.skill,
      question: q.question,
      guidance: q.guidance,
    }));
    questionsStore.set(sessionId, questions);

    return NextResponse.json({
      session,
      questions: questions.sort((a, b) => a.position - b.position),
      workStyle: plan.workStyle,
      generatedBy: usingAi ? "ai" : "builtin",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start the interview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
