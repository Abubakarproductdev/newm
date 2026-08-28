import { NextResponse } from "next/server";
import {
  AI_CONFIG,
  aiSynthesizeSpeech,
  aiTranscribeAudio,
  sttConfigured,
  ttsConfigured,
} from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    stt: {
      configured: sttConfigured(),
      provider: AI_CONFIG.provider || "browser",
      endpoint: AI_CONFIG.sttUrl || null,
    },
    tts: {
      configured: ttsConfigured(),
      provider: AI_CONFIG.provider || "browser",
      endpoint: AI_CONFIG.ttsUrl || null,
    },
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      // STT: audio file upload
      const form = await request.formData();
      const audioFile = form.get("audio");
      if (!audioFile) {
        return NextResponse.json({ error: "audio file required" }, { status: 400 });
      }
      const transcript = await aiTranscribeAudio(await (audioFile as Blob).arrayBuffer());
      if (transcript) return NextResponse.json({ transcript });
      return NextResponse.json({ fallback: "browser", message: "Using browser speech recognition." });
    }

    // TTS: JSON body
    const body = await request.json() as { action?: string; text?: string };
    const { action, text } = body;

    if (action === "tts") {
      const audio = await aiSynthesizeSpeech(String(text ?? ""));
      if (audio) {
        return new NextResponse(audio, { headers: { "Content-Type": "audio/mpeg" } });
      }
      return NextResponse.json({ fallback: "browser", message: "Using browser speech synthesis." });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voice request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
