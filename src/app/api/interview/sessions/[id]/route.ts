import { NextResponse } from "next/server";
import { answersStore, questionsStore, sessionsStore } from "@/lib/memory-db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = Number(id);
    if (!Number.isFinite(sessionId)) {
      return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
    }

    const session = sessionsStore.get(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const questions = (questionsStore.get(sessionId) ?? []).sort(
      (a, b) => a.position - b.position
    );
    const answers = answersStore.get(sessionId) ?? [];

    return NextResponse.json({ session, questions, answers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
