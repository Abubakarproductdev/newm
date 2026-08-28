"use client";

import { useState } from "react";
import {
  AlertTriangle, ArrowRight, Calendar, Check, CheckCircle2, ChevronRight, Clock, Download,
  FileText, Lightbulb, Mic, MicOff, Pause, Play, RotateCcw, Send, Sparkles, Star, Target,
  Volume2, VolumeX,
} from "lucide-react";
import type { Evaluation } from "@/lib/interview";
import type { AnswerRow, QuestionRow, ReportRow, SessionRow, VoiceCapabilities } from "@/lib/session-types";
import { Badge, Chip, Field, GhostButton, MetricBar, Panel, PrimaryButton, Progress, ScoreRing, inputClass } from "./ui";
import { SAMPLE_DESCRIPTION } from "@/lib/interview";

const CATEGORY_TONE: Record<string, "green" | "blue" | "gray" | "amber"> = {
  Technical: "green", Behavioral: "blue", "Culture Fit": "gray", "HR & Logistics": "amber",
};

function words(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function clock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/* ─────────────────────────── SETUP ─────────────────────────── */
export function SetupPanel(props: {
  mode: "title" | "description"; setMode: (m: "title" | "description") => void;
  jobTitle: string; setJobTitle: (v: string) => void;
  company: string; setCompany: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  count: number; setCount: (v: number) => void;
  starting: boolean; error: string; onStart: () => void; capabilities: VoiceCapabilities | null;
}) {
  const voiceEngine = props.capabilities?.tts.configured ? `${props.capabilities.tts.provider} (API)` : "Browser voice (built-in)";
  const micEngine = props.capabilities?.stt.configured ? `${props.capabilities.stt.provider} (API)` : "Browser speech (built-in)";

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <Panel title="Set up your interview" subtitle="Choose how the AI should build your questions" icon={Target}>
        <div className="mb-5 flex gap-2 rounded-xl bg-[#f3f7f4] p-1.5">
          <button onClick={() => props.setMode("title")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition ${props.mode === "title" ? "bg-[#4d9b65] text-white" : "text-[#66726c]"}`}><BriefcaseSmall /> Job title</button>
          <button onClick={() => props.setMode("description")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition ${props.mode === "description" ? "bg-[#4d9b65] text-white" : "text-[#66726c]"}`}><FileText size={15} /> Full job description</button>
        </div>

        {props.mode === "title" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title or post"><input className={inputClass} value={props.jobTitle} onChange={(e) => props.setJobTitle(e.target.value)} placeholder="e.g. Junior Frontend Developer" /></Field>
            <Field label="Company (optional)"><input className={inputClass} value={props.company} onChange={(e) => props.setCompany(e.target.value)} placeholder="e.g. ABC Technologies" /></Field>
            <div className="sm:col-span-2"><Field label="Extra details (optional)" hint="Add skills, seniority or requirements to sharpen the questions."><textarea className={`${inputClass} min-h-[96px] resize-y`} value={props.description} onChange={(e) => props.setDescription(e.target.value)} placeholder="React, TypeScript, REST APIs, agile team..." /></Field></div>
          </div>
        ) : (
          <Field label="Job description" hint="Paste the full advert — every question is generated from this text.">
            <textarea className={`${inputClass} min-h-[190px] resize-y`} value={props.description} onChange={(e) => props.setDescription(e.target.value)} placeholder="Paste the job description here..." />
          </Field>
        )}

        <button onClick={() => { props.setMode("description"); props.setDescription(SAMPLE_DESCRIPTION); }} className="mt-3 text-[11px] font-bold text-[#4d9b65] hover:underline">Use sample job description</button>

        <div className="mt-6 rounded-xl border border-[#e6ece8] bg-[#fbfcfb] p-4">
          <div className="mb-3 flex items-center gap-2"><Sparkles size={15} className="text-[#4d9b65]" /><span className="text-xs font-bold text-[#4b5850]">How many questions?</span></div>
          <div className="flex flex-wrap items-center gap-2">
            {[3, 5, 7, 10, 12].map((n) => <Chip key={n} active={props.count === n} onClick={() => props.setCount(n)}>{n}</Chip>)}
            <span className="ml-1 text-[11px] text-[#8a9990]">HR questions about salary and availability are always added at the end.</span>
          </div>
        </div>

        {props.error && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-red-600"><AlertTriangle size={14} />{props.error}</p>}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-[#8a9990]">Voice engine: <strong className="text-[#5f6d65]">{voiceEngine}</strong> · Mic: <strong className="text-[#5f6d65]">{micEngine}</strong></p>
          <PrimaryButton onClick={props.onStart} loading={props.starting} icon={Play}>Start interview</PrimaryButton>
        </div>
      </Panel>

      <Panel title="How this works" subtitle="Everything happens in one interview" icon={Lightbulb}>
        <ol className="space-y-4">
          {[
            ["AI reads your job", "Your title or description builds the question set — change it and the questions change."],
            ["Listen and speak", "Each question is read aloud. Answer with your microphone or type if you prefer."],
            ["Instant coaching", "After every answer you get a score plus the exact issues found in your reply."],
            ["HR round", "Salary expectations, availability and work mode are asked at the end."],
            ["Final report", "Overall score, category breakdown, strengths and what to fix next."],
          ].map(([title, text], i) => (
            <li key={title} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eaf5ed] text-[11px] font-bold text-[#428257]">{i + 1}</span>
              <div><p className="text-xs font-bold text-[#425047]">{title}</p><p className="mt-0.5 text-[11px] leading-5 text-[#849088]">{text}</p></div>
            </li>
          ))}
        </ol>
        <div className="mt-5 rounded-xl bg-[#f5faf6] p-3 text-[11px] leading-5 text-[#568065]">
          Tip: answer in 90–140 words and always finish with a result. That is what the scoring rewards most.
        </div>
      </Panel>
    </div>
  );
}

function BriefcaseSmall() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>;
}

/* ─────────────────────────── LIVE INTERVIEW ─────────────────────────── */
export function LiveInterview(props: {
  session: SessionRow; questions: QuestionRow[]; index: number; phase: "asking" | "answering" | "feedback";
  transcript: string; setTranscript: (v: string) => void; interim: string; listening: boolean; micError: string;
  evaluation: Evaluation | null; voiceOn: boolean; toggleVoice: () => void; autoListen: boolean; toggleAutoListen: () => void;
  showHint: boolean; toggleHint: () => void; elapsed: number; busy: string; error: string;
  onReplay: () => void; onMic: () => void; onSubmit: () => void; onNext: () => void;
  answered: { label: string; transcript: string; score: number }[];
}) {
  const q = props.questions[props.index];
  const speaking = props.phase === "asking";
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
      <div className="overflow-hidden rounded-2xl border border-[#e1e8e3] bg-white shadow-[0_8px_28px_rgba(37,61,44,.05)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1ee] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#4d9b65]">AI mock interview</p>
            <h2 className="text-sm font-bold text-[#2c3a33]">{props.session.role}{props.session.company ? ` · ${props.session.company}` : ""}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#7d8982]">Question {props.index + 1} of {props.questions.length}</span>
            <button onClick={props.toggleVoice} title="Toggle question audio" className="rounded-lg border border-[#e1e8e3] p-2 text-[#66726c] hover:bg-[#f4f8f5]">{props.voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />}</button>
          </div>
        </header>

        <div className="px-5 pt-4"><Progress value={((props.index + (props.phase === "feedback" ? 1 : 0)) / props.questions.length) * 100} /></div>

        <div className="p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone={CATEGORY_TONE[q.category] ?? "gray"}>{q.category}</Badge>
            {q.skill && <Badge tone="gray">{q.skill}</Badge>}
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[#8a9990]"><Clock size={12} />{clock(props.elapsed)}</span>
          </div>

          <blockquote className="mb-5 text-lg font-bold leading-8 text-[#2c3a33] sm:text-xl">“{q.question}”</blockquote>

          {speaking ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-[#dce9df] bg-[#f7fbf8] px-6 py-9 text-center">
              <span className="relative flex h-12 items-end gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => <span key={i} className="w-1.5 animate-pulse rounded-full bg-[#4d9b65]" style={{ height: `${10 + i * 5}%`, animationDelay: `${i * 120}ms` }} />)}
              </span>
              <p className="text-xs font-semibold text-[#5d6b63]">The interviewer is speaking…</p>
              <div className="flex gap-2"><GhostButton onClick={props.onReplay} icon={Volume2}>Replay</GhostButton><GhostButton onClick={props.toggleHint} icon={Lightbulb}>{props.showHint ? "Hide hint" : "Show hint"}</GhostButton></div>
              {props.showHint && <HintBox question={q} />}
            </div>
          ) : props.phase === "feedback" && props.evaluation ? (
            <FeedbackCard evaluation={props.evaluation} question={q} onNext={props.onNext} last={props.index === props.questions.length - 1} busy={props.busy} />
          ) : (
            <>
              <div className={`mb-3 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold ${props.listening ? "bg-[#eef8f1] text-[#3f8154]" : "bg-[#f5f7f6] text-[#718078]"}`}>
                {props.listening ? <Mic size={15} className="animate-pulse" /> : <MicOff size={15} />}
                {props.listening ? "Listening — speak your answer. It stops automatically after a pause." : "Microphone idle. Tap the mic or type below."}
                {props.interim && <span className="ml-auto italic text-[#7c9a86]">“{props.interim}”</span>}
              </div>

              {props.micError && <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-[#9a7140]"><AlertTriangle size={13} />{props.micError}</p>}

              <textarea className={`${inputClass} min-h-[170px] resize-y leading-6`} value={props.transcript} onChange={(e) => props.setTranscript(e.target.value)} placeholder="Your spoken answer appears here. You can also type or edit it before submitting." />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <GhostButton onClick={props.onMic} icon={props.listening ? Pause : Mic}>{props.listening ? "Stop mic" : "Answer with mic"}</GhostButton>
                  <button onClick={props.toggleAutoListen} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold ${props.autoListen ? "text-[#428257]" : "text-[#8a9990]"}`}>
                    <span className={`grid h-4 w-4 place-items-center rounded-full border ${props.autoListen ? "border-[#4d9b65] bg-[#4d9b65] text-white" : "border-[#c3ccc6]"}`}>{props.autoListen && <Check size={9} strokeWidth={3} />}</span>
                    Auto-record
                  </button>
                  <GhostButton onClick={props.toggleHint} icon={Lightbulb}>Hint</GhostButton>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#929d97]">{words(props.transcript)} words</span>
                  <PrimaryButton onClick={props.onSubmit} loading={Boolean(props.busy)} icon={Send} disabled={props.transcript.trim().length < 3}>Submit answer</PrimaryButton>
                </div>
              </div>

              {props.showHint && <div className="mt-4"><HintBox question={q} /></div>}
              {props.error && <p className="mt-3 text-xs font-semibold text-red-600">{props.error}</p>}
            </>
          )}
        </div>
      </div>

      <aside className="h-fit space-y-4">
        <Panel title="Session progress" subtitle={`${props.session.questionCount} questions`}>
          <div className="space-y-2">
            {props.questions.map((item, i) => {
              const state = i < props.index ? "done" : i === props.index ? "active" : "todo";
              return (
                <div key={item.id} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${state === "done" ? "bg-[#4d9b65] text-white" : state === "active" ? "border-2 border-[#4d9b65] text-[#4d9b65]" : "bg-[#edf1ee] text-[#99a39d]"}`}>{state === "done" ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold ${state === "active" ? "text-[#2c3a33]" : "text-[#8a9990]"}`}>{item.category}</p>
                    <p className="truncate text-[11px] text-[#9aa49f]">{item.question}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Voice controls">
          <div className="space-y-3">
            <button onClick={props.toggleVoice} className="flex w-full items-center justify-between rounded-xl border border-[#e6ece8] px-3 py-2.5 text-[11px] font-semibold text-[#56645c] hover:bg-[#f7faf8]"><span className="flex items-center gap-2">{props.voiceOn ? <Volume2 size={14} className="text-[#4d9b65]" /> : <VolumeX size={14} />}Read questions aloud</span><span className={`h-4 w-7 rounded-full ${props.voiceOn ? "bg-[#4d9b65]" : "bg-[#d4dcd6]"} relative`}><span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${props.voiceOn ? "left-3.5" : "left-0.5"}`} /></span></button>
            <button onClick={props.toggleAutoListen} className="flex w-full items-center justify-between rounded-xl border border-[#e6ece8] px-3 py-2.5 text-[11px] font-semibold text-[#56645c] hover:bg-[#f7faf8]"><span className="flex items-center gap-2"><Mic size={14} className="text-[#4d9b65]" />Auto-start mic</span><span className={`relative h-4 w-7 rounded-full ${props.autoListen ? "bg-[#4d9b65]" : "bg-[#d4dcd6]"}`}><span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${props.autoListen ? "left-3.5" : "left-0.5"}`} /></span></button>
          </div>
          <div className="mt-4 border-t border-[#edf1ee] pt-3">
            <button onClick={() => setShowTranscript(!showTranscript)} className="text-[11px] font-bold text-[#4d9b65] hover:underline">{showTranscript ? "Hide" : "Show"} your answers so far</button>
            {showTranscript && (
              <div className="mt-3 max-h-56 space-y-3 overflow-y-auto">
                {props.answered.length ? props.answered.map((item, i) => (
                  <div key={`${item.label}-${i}`} className="rounded-lg bg-[#f7faf8] p-2.5">
                    <p className="mb-1 flex items-center justify-between text-[10px] font-bold text-[#5d6b63]"><span>Answer {i + 1}</span><span className="text-[#428257]">{item.score}/100</span></p>
                    <p className="text-[10px] leading-4 text-[#849088]">{item.transcript}</p>
                  </div>
                )) : <p className="text-[10px] text-[#9aa49f]">No answers submitted yet.</p>}
              </div>
            )}
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function HintBox({ question }: { question: QuestionRow }) {
  return (
    <div className="w-full rounded-xl border border-[#dce9df] bg-white p-4 text-left">
      <p className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#4d9b65]"><Lightbulb size={13} />Strong answer covers</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {question.guidance.points.map((point) => <li key={point} className="flex items-start gap-2 text-[11px] leading-5 text-[#637069]"><Check size={11} className="mt-1 shrink-0 text-[#4d9b65]" strokeWidth={3} />{point}</li>)}
      </ul>
      {question.guidance.star && <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#f5faf6] px-3 py-2 text-[11px] font-semibold text-[#428257]"><Star size={12} />Use STAR: Situation, Task, Action, Result.</p>}
    </div>
  );
}

function FeedbackCard({ evaluation, question, onNext, last, busy }: { evaluation: Evaluation; question: QuestionRow; onNext: () => void; last: boolean; busy: string }) {
  return (
    <div className="rounded-xl border border-[#dce9df] bg-[#f7fbf8] p-5">
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <ScoreRing value={evaluation.overall} size={78} caption="score" />
        <div className="min-w-[180px] flex-1">
          <p className="flex items-center gap-2 text-sm font-bold text-[#2c3a33]"><CheckCircle2 size={15} className="text-[#4d9b65]" />{evaluation.verdict}</p>
          <p className="mt-1 text-xs leading-5 text-[#6d7a72]">{evaluation.feedback}</p>
          <p className="mt-1.5 text-[10px] text-[#929d97]">{evaluation.metrics.words} words · {evaluation.metrics.fillers} filler phrase{evaluation.metrics.fillers === 1 ? "" : "s"} detected</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["Clarity", evaluation.clarity], ["Structure", evaluation.structure], ["Relevance", evaluation.relevance], ["Technical", evaluation.technical]].map(([label, value]) => (
          <div key={label as string} className="rounded-lg bg-white p-3 text-center">
            <p className="text-base font-bold text-[#477f58]">{value}</p>
            <p className="text-[9px] uppercase tracking-wider text-[#89958e]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 rounded-lg bg-white p-4">
        <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#a4572f]"><AlertTriangle size={12} />Issues found in your answer</p>
        {evaluation.issues.map((issue) => <p key={issue} className="mb-1.5 flex gap-2 text-[11px] leading-5 text-[#6d685f]"><ChevronRight size={12} className="mt-0.5 shrink-0 text-[#b28048]" />{issue}</p>)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#428257]">What worked</p>
          {evaluation.strengths.map((x) => <p key={x} className="mb-1.5 flex gap-2 text-[11px] leading-5 text-[#66736b]"><Check size={12} className="mt-0.5 shrink-0 text-[#4d9b65]" />{x}</p>)}
        </div>
        <div className="rounded-lg bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#9a7140]">How to improve</p>
          {evaluation.improvements.map((x) => <p key={x} className="mb-1.5 flex gap-2 text-[11px] leading-5 text-[#66736b]"><ChevronRight size={12} className="mt-0.5 shrink-0 text-[#b28048]" />{x}</p>)}
        </div>
      </div>

      <details className="mt-4 rounded-lg bg-white p-4">
        <summary className="cursor-pointer text-[11px] font-bold text-[#56645c]">Model answer for this question</summary>
        <ul className="mt-3 space-y-1.5">
          {evaluation.modelAnswerPoints.map((p) => <li key={p} className="flex gap-2 text-[11px] leading-5 text-[#637069]"><Check size={11} className="mt-1 shrink-0 text-[#4d9b65]" strokeWidth={3} />{p}</li>)}
        </ul>
        {question.guidance.star && <p className="mt-2 text-[10px] text-[#8a9990]">Behavioural questions are scored on STAR coverage.</p>}
      </details>

      <div className="mt-5 flex justify-end">
        <PrimaryButton onClick={onNext} loading={Boolean(busy)} icon={last ? CheckCircle2 : ArrowRight}>{last ? "See final report" : "Next question"}</PrimaryButton>
      </div>
    </div>
  );
}

/* ─────────────────────────── REPORT ─────────────────────────── */
export function ReportPanel({ session, report, questions, answers, onRestart, onNew, readOnly }: {
  session: SessionRow; report: ReportRow; questions: QuestionRow[]; answers: AnswerRow[]; onRestart: () => void; onNew: () => void; readOnly: boolean;
}) {
  const [open, setOpen] = useState<number | null>(questions[0]?.id ?? null);

  function download() {
    const lines = [
      `CareerMate mock interview report`, `Role: ${session.role}`, `Date: ${new Date(session.createdAt).toLocaleString()}`, "",
      `Overall: ${report.overall}/100 (${report.recommendation})`,
      `Clarity ${report.clarity}% · Structure ${report.structure}% · Relevance ${report.relevance}% · Technical ${report.technical}%`, "",
      `Summary: ${report.summary}`, "", `STRENGTHS`, ...report.strengths.map((s) => `+ ${s}`), "", `IMPROVEMENTS`, ...report.improvements.map((s) => `- ${s}`), "",
    ];
    questions.forEach((q) => {
      const a = answers.find((x) => x.questionId === q.id);
      lines.push(`Q${q.position} [${q.category}] ${q.question}`);
      if (a) { lines.push(`Score: ${a.overall}/100`, `Answer: ${a.transcript}`, ""); }
      else lines.push("Not answered", "");
    });
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `interview-report-${session.id}.txt`; anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <Panel title="Mock interview results" subtitle={`${session.role}${session.company ? ` · ${session.company}` : ""}`} icon={Download} action={<Badge tone={report.overall >= 70 ? "green" : "amber"}>{report.recommendation}</Badge>}>
        <div className="flex flex-col items-center gap-6 border-b border-[#edf1ee] pb-6 text-center sm:flex-row sm:text-left">
          <ScoreRing value={report.overall} size={104} />
          <div className="flex-1">
            <p className="text-lg font-bold text-[#2c3a33]">{report.recommendation}</p>
            <p className="mt-1.5 text-xs leading-5 text-[#758179]">{report.summary}</p>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-[#929d97] sm:justify-start"><Calendar size={11} />{new Date(session.createdAt).toLocaleString()} · {answers.length} of {questions.length} answered</p>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#7c8981]">Core skills</p>
            <div className="space-y-3">
              <MetricBar label="Clarity" value={report.clarity} />
              <MetricBar label="Structure" value={report.structure} />
              <MetricBar label="Relevance" value={report.relevance} />
              <MetricBar label="Technical accuracy" value={report.technical} />
            </div>
          </div>
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#7c8981]">By question category</p>
            <div className="space-y-3">
              {report.categoryScores.map((c) => <MetricBar key={c.label} label={c.label} value={c.score} />)}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-[#edf1ee] pt-6 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f1f8f3] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#428257]">Strengths</p>
            {report.strengths.map((s) => <p key={s} className="mb-2 flex gap-2 text-[11px] leading-5 text-[#617067]"><Check size={12} className="mt-0.5 shrink-0 text-[#4d9b65]" />{s}</p>)}
          </div>
          <div className="rounded-xl bg-[#fbf7f1] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#9a7140]">Needs improvement</p>
            {report.improvements.map((s) => <p key={s} className="mb-2 flex gap-2 text-[11px] leading-5 text-[#6d685f]"><ChevronRight size={12} className="mt-0.5 shrink-0 text-[#b28048]" />{s}</p>)}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3 border-t border-[#edf1ee] pt-6">
          {!readOnly && <PrimaryButton onClick={onRestart} icon={RotateCcw}>Practice again</PrimaryButton>}
          <GhostButton onClick={download} icon={Download}>Download report</GhostButton>
          <GhostButton onClick={onNew} icon={Play}>New interview</GhostButton>
        </div>
      </Panel>

      <Panel title="Answer-by-answer review" subtitle="Your transcript with the issues found in each reply" icon={FileText}>
        <div className="space-y-2.5">
          {questions.map((q) => {
            const answer = answers.find((a) => a.questionId === q.id);
            const expanded = open === q.id;
            return (
              <div key={q.id} className={`overflow-hidden rounded-xl border ${expanded ? "border-[#9bc5a7]" : "border-[#e2e8e4]"}`}>
                <button onClick={() => setOpen(expanded ? null : q.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#f0f4f1] text-[10px] font-bold text-[#78857e]">{q.position}</span>
                  <span className="flex-1 text-[12px] font-semibold leading-5 text-[#3d4943]">{q.question}</span>
                  {answer ? <Badge tone={answer.overall >= 70 ? "green" : "amber"}>{answer.overall}/100</Badge> : <Badge tone="gray">Skipped</Badge>}
                </button>
                {expanded && answer && (
                  <div className="space-y-3 border-t border-[#edf1ee] bg-[#fbfcfb] px-5 py-4">
                    <div><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8a9990]">Your answer</p><p className="text-[11px] leading-5 text-[#5d6b63]">{answer.transcript}</p></div>
                    <div className="flex flex-wrap gap-2">{[["Clarity", answer.clarity], ["Structure", answer.structure], ["Relevance", answer.relevance], ["Technical", answer.technical]].map(([l, v]) => <span key={l as string} className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-[#617067]">{l}: {v}</span>)}</div>
                    <div><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#a4572f]">Issues</p>{answer.issues.map((i) => <p key={i} className="mb-1 flex gap-2 text-[11px] text-[#6d685f]"><ChevronRight size={11} className="mt-0.5 shrink-0 text-[#b28048]" />{i}</p>)}</div>
                    <div><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#9a7140]">Improve</p>{answer.improvements.map((i) => <p key={i} className="mb-1 flex gap-2 text-[11px] text-[#6d685f]"><ChevronRight size={11} className="mt-0.5 shrink-0 text-[#b28048]" />{i}</p>)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── HISTORY ─────────────────────────── */
export function HistoryPanel({ sessions, onOpen }: { sessions: SessionRow[]; onOpen: (id: number) => void }) {
  if (!sessions.length) return null;
  return (
    <Panel title="Previous interviews" subtitle="Saved to your account" icon={Clock}>
      <div className="space-y-2">
        {sessions.map((s) => (
          <button key={s.id} onClick={() => onOpen(s.id)} className="flex w-full items-center gap-3 rounded-xl border border-[#e6ece8] px-3 py-2.5 text-left transition hover:border-[#a9c8b2] hover:bg-[#f7faf8]">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${s.overallScore ? "bg-[#eaf5ed] text-[#428257]" : "bg-[#f0f3f1] text-[#8a9990]"}`}>{s.overallScore ?? "–"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-[#425047]">{s.role}</p>
              <p className="text-[10px] text-[#929d97]">{new Date(s.createdAt).toLocaleDateString()} · {s.questionCount} questions · {s.status === "completed" ? "completed" : "in progress"}</p>
            </div>
            <ChevronRight size={14} className="text-[#9aa49f]" />
          </button>
        ))}
      </div>
    </Panel>
  );
}
