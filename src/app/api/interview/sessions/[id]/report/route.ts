import { NextResponse } from "next/server";
import { answersStore, questionsStore, reportsStore, sessionsStore } from "@/lib/memory-db";
import { aggregateReport } from "@/lib/interview";
import type { ReportRow } from "@/lib/session-types";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = Number(id);
    if (!Number.isFinite(sessionId)) {
      return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
    }

    const answers = answersStore.get(sessionId) ?? [];
    const questions = questionsStore.get(sessionId) ?? [];

    if (!answers.length) {
      return NextResponse.json(
        { error: "Answer at least one question to generate a report." },
        { status: 400 }
      );
    }

    const enriched = answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      return {
        category: question?.category ?? "Technical",
        skill: question?.skill ?? "",
        clarity: answer.clarity,
        structure: answer.structure,
        relevance: answer.relevance,
        technical: answer.technical,
        overall: answer.overall,
        strengths: answer.strengths,
        improvements: answer.improvements,
      };
    });

    const report = aggregateReport(enriched);
    const reportRow: ReportRow = { ...report };
    reportsStore.set(sessionId, reportRow);

    const session = sessionsStore.get(sessionId);
    if (session) {
      session.status = "completed";
      session.overallScore = report.overall;
      session.completedAt = new Date().toISOString();
    }

    return NextResponse.json({ report: reportRow });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
