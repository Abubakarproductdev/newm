"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft, Bell, BriefcaseBusiness, ClipboardCheck, FileText, Home, LogOut, Menu,
  MessageSquareText, Settings, User, X,
} from "lucide-react";
import { aggregateReport, type Evaluation } from "@/lib/interview";
import { recognitionSupported, speak, stopSpeaking, synthesisSupported, useDictation } from "@/lib/speech";
import type { AnswerRow, QuestionRow, ReportRow, SessionRow, VoiceCapabilities } from "@/lib/session-types";
import { HistoryPanel, LiveInterview, ReportPanel, SetupPanel } from "./studio/panels";
import { GhostButton } from "./studio/ui";

type Stage = "setup" | "live" | "report";
type Phase = "asking" | "answering" | "feedback";

const NAV = [
  { label: "Dashboard", icon: Home }, { label: "Jobs", icon: BriefcaseBusiness },
  { label: "Resume Analyzer", icon: FileText }, { label: "Interview Prep", icon: MessageSquareText, active: true },
  { label: "Applications", icon: ClipboardCheck }, { label: "Profile", icon: User },
];

export default function InterviewStudio() {
  const [navOpen, setNavOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("setup");
  const [phase, setPhase] = useState<Phase>("asking");

  const [mode, setMode] = useState<"title" | "description">("title");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [count, setCount] = useState(5);

  const [session, setSession] = useState<SessionRow | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [index, setIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [report, setReport] = useState<ReportRow | null>(null);
  const [readOnly, setReadOnly] = useState(false);

  const [voiceOn, setVoiceOn] = useState(true);
  const [autoListen, setAutoListen] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [starting, setStarting] = useState(false);
  const [busy, setBusy] = useState("");
  const [formError, setFormError] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [history, setHistory] = useState<SessionRow[]>([]);
  const [capabilities, setCapabilities] = useState<VoiceCapabilities | null>(null);

  const dictation = useDictation((text) => setTranscript((prev) => (prev ? `${prev} ${text}` : text)));
  const currentQuestion = questions[index];

  const loadHistory = useCallback(async () => {
    try {
      // Always load from localStorage first (it's the source of truth)
      const stored = localStorage.getItem("careermate_history");
      if (stored) {
        const parsed = JSON.parse(stored) as SessionRow[];
        setHistory(parsed);
        return;
      }
      // Fallback: fetch from server (only relevant for first load)
      const res = await fetch("/api/interview/sessions");
      const data = await res.json() as { sessions?: SessionRow[] };
      if (Array.isArray(data.sessions)) {
        setHistory(data.sessions);
        localStorage.setItem("careermate_history", JSON.stringify(data.sessions));
      }
    } catch { /* history is optional */ }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
    fetch("/api/interview/voice").then((r) => r.json()).then(setCapabilities).catch(() => setCapabilities(null));

    try {
      const activeRaw = localStorage.getItem("careermate_active");
      if (activeRaw) {
        const active = JSON.parse(activeRaw);
        if (active && active.session && active.stage === "live") {
          setSession(active.session);
          setQuestions(active.questions || []);
          setAnswers(active.answers || []);
          setIndex(active.index || 0);
          setPhase(active.phase || "asking");
          setStage("live");
        }
      }
    } catch { /* ignore parse errors */ }

    return () => stopSpeaking();
  }, [loadHistory]);

  useEffect(() => {
    if (stage === "live" && session) {
      try {
        localStorage.setItem("careermate_active", JSON.stringify({
          stage, phase, session, questions, answers, index
        }));
      } catch { /* ignore quota errors */ }
    } else if (stage === "setup") {
      localStorage.removeItem("careermate_active");
    }
  }, [stage, phase, session, questions, answers, index]);

  /* Reads each question aloud, then hands over to the microphone. */
  useEffect(() => {
    if (stage !== "live" || phase !== "asking" || !currentQuestion) return;
    let cancelled = false;
    (async () => {
      if (voiceOn && synthesisSupported()) await speak(currentQuestion.question);
      if (cancelled) return;
      setPhase("answering");
      if (autoListen && recognitionSupported()) dictation.start();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, phase, index, voiceOn, autoListen, currentQuestion?.id]);

  useEffect(() => {
    if (stage !== "live" || phase !== "answering") return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [stage, phase, index]);

  async function startInterview() {
    if (mode === "title" && !jobTitle.trim()) { setFormError("Enter the job title to continue."); return; }
    if (mode === "description" && !description.trim()) { setFormError("Paste the job description to continue."); return; }
    setStarting(true); setFormError(""); setReadOnly(false);
    try {
      const res = await fetch("/api/interview/sessions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, jobTitle, company, description, questionCount: count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start the interview.");
      setSession(data.session); setQuestions(data.questions); setAnswers([]);
      setIndex(0); setTranscript(""); setEvaluation(null); setReport(null);
      setElapsed(0); setShowHint(false); setPhase("asking"); setStage("live");
      loadHistory();
      // Save new session to localStorage history
      try {
        const stored = localStorage.getItem("careermate_history");
        const existing: SessionRow[] = stored ? (JSON.parse(stored) as SessionRow[]) : [];
        const updated = [data.session as SessionRow, ...existing.filter((s) => s.id !== (data.session as SessionRow).id)];
        localStorage.setItem("careermate_history", JSON.stringify(updated.slice(0, 20)));
      } catch { /* ignore localStorage errors */ }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not start the interview.");
    } finally { setStarting(false); }
  }

  async function submitAnswer() {
    if (!session || !currentQuestion) return;
    dictation.stop(); stopSpeaking();
    setBusy("Scoring your answer…"); setAnswerError("");
    try {
      const res = await fetch("/api/interview/answers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: session.id, 
          questionId: currentQuestion.id, 
          transcript, 
          inputMode: dictation.listening || transcript.length > 0 ? "voice" : "text",
          session, question: currentQuestion, questions // fallback for serverless memory wipes
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not evaluate the answer.");
      setEvaluation(data.evaluation);
      setAnswers((prev) => [...prev, data.answer]);
      setPhase("feedback");
    } catch (e) {
      setAnswerError(e instanceof Error ? e.message : "Could not evaluate the answer.");
    } finally { setBusy(""); }
  }

  async function finishInterview() {
    if (!session) return;
    setBusy("Preparing your report…"); setAnswerError("");
    try {
      const res = await fetch(`/api/interview/sessions/${session.id}/report`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, questions, answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not build the report.");
      setReport(data.report); setStage("report"); loadHistory();
      localStorage.removeItem("careermate_active");
      // Update session status in localStorage
      try {
        const stored = localStorage.getItem("careermate_history");
        if (stored && session) {
          const existing: SessionRow[] = JSON.parse(stored) as SessionRow[];
          const updated = existing.map((s) =>
            s.id === session.id
              ? { ...s, status: "completed", overallScore: (data.report as ReportRow).overall, completedAt: new Date().toISOString() }
              : s
          );
          localStorage.setItem("careermate_history", JSON.stringify(updated));
        }
      } catch { /* ignore */ }
    } catch (e) {
      setAnswerError(e instanceof Error ? e.message : "Could not build the report.");
    } finally { setBusy(""); }
  }

  function nextQuestion() {
    if (index + 1 >= questions.length) { finishInterview(); return; }
    setIndex((i) => i + 1); setTranscript(""); setEvaluation(null);
    setShowHint(false); setElapsed(0); setPhase("asking");
  }

  async function reviewSession(id: number) {
    setBusy("Loading interview…"); setAnswerError("");
    try {
      const res = await fetch(`/api/interview/sessions/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load that session.");
      const rows: AnswerRow[] = data.answers ?? [];
      const enriched = rows.map((a) => {
        const q = (data.questions as QuestionRow[]).find((item) => item.id === a.questionId);
        return { category: q?.category ?? "Technical", skill: q?.skill ?? "", clarity: a.clarity, structure: a.structure, relevance: a.relevance, technical: a.technical, overall: a.overall, strengths: a.strengths, improvements: a.improvements };
      });
      stopSpeaking(); dictation.stop();
      setSession(data.session); setQuestions(data.questions); setAnswers(rows);
      setReport(aggregateReport(enriched)); setReadOnly(true); setStage("report");
    } catch (e) {
      setAnswerError(e instanceof Error ? e.message : "Could not load that session.");
    } finally { setBusy(""); }
  }

  function leaveInterview() {
    stopSpeaking(); dictation.stop(); setStage("setup"); setPhase("asking"); loadHistory();
  }

  const answered = answers.map((a, i) => ({ label: `Answer ${i + 1}`, transcript: a.transcript, score: a.overall }));

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-[#26322d]">
      {navOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/25 lg:hidden" onClick={() => setNavOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-[#e5ebe6] bg-white transition-transform lg:translate-x-0 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[86px] items-center justify-between px-7">
          <div className="text-[25px] font-bold tracking-[-1px]"><span className="text-[#4d9b65]">Career</span><span className="text-[#36433d]">Mate</span></div>
          <button className="lg:hidden" onClick={() => setNavOpen(false)}><X size={20} /></button>
        </div>
        <div className="px-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[.15em] text-[#8a9990]">Main menu</p>
          <nav className="space-y-1.5">
            {NAV.map((item) => (
              <button key={item.label} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-semibold transition ${item.active ? "bg-[#4d9b65] text-white shadow-[0_6px_16px_rgba(77,155,101,.22)]" : "text-[#66726c] hover:bg-[#f0f6f1]"}`}>
                <item.icon size={18} strokeWidth={1.8} />{item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto space-y-1 px-5 pb-6">
          <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold text-[#66726c] hover:bg-[#f0f6f1]"><Settings size={18} />Settings</button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold text-[#66726c] hover:bg-[#f0f6f1]"><LogOut size={18} />Log out</button>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#e5ebe6] bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 hover:bg-[#f0f6f1] lg:hidden" onClick={() => setNavOpen(true)}><Menu size={21} /></button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#82a38c]">Dashboard</p>
              <p className="text-sm font-semibold text-[#405048]">{stage === "setup" ? "Interview preparation" : stage === "live" ? "Live mock interview" : "Interview report"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-[#66726c] hover:bg-[#f0f6f1]"><Bell size={19} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#4d9b65]" /></button>
            <div className="hidden text-right sm:block"><p className="text-xs font-semibold">Alex Morgan</p><p className="text-[9px] uppercase tracking-wider text-[#8a9990]">Job seeker</p></div>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#4d9b65] text-sm font-bold text-white">A</div>
          </div>
        </header>

        <main className="mx-auto max-w-[1240px] px-4 py-7 sm:px-7 sm:py-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#4d9b65]"><MessageSquareText size={14} /> AI voice interviewer</div>
              <h1 className="text-[28px] font-bold tracking-[-.7px] sm:text-[34px]">Mock Interview</h1>
              <p className="mt-1 text-sm text-[#79847e]">Answer out loud, get scored after every question, and finish with a full report.</p>
            </div>
            {stage !== "setup" && <GhostButton onClick={leaveInterview} icon={ArrowLeft}>{stage === "live" ? "End interview" : "Back to setup"}</GhostButton>}
          </div>

          {busy && !starting && <div className="mb-4 rounded-xl border border-[#dce9df] bg-[#f7fbf8] px-4 py-3 text-xs font-semibold text-[#428257]">{busy}</div>}
          {answerError && stage !== "live" && <div className="mb-4 rounded-xl border border-[#f0ded3] bg-[#fdf7f2] px-4 py-3 text-xs font-semibold text-[#a4572f]">{answerError}</div>}

          {stage === "setup" && (
            <>
              <SetupPanel
                mode={mode} setMode={setMode} jobTitle={jobTitle} setJobTitle={setJobTitle}
                company={company} setCompany={setCompany} description={description} setDescription={setDescription}
                count={count} setCount={setCount} starting={starting} error={formError}
                onStart={startInterview} capabilities={capabilities}
              />
              <div className="mt-5"><HistoryPanel sessions={history} onOpen={reviewSession} /></div>
            </>
          )}

          {stage === "live" && session && questions.length > 0 && (
            <LiveInterview
              session={session} questions={questions} index={index} phase={phase}
              transcript={transcript} setTranscript={setTranscript} interim={dictation.interim}
              listening={dictation.listening} micError={dictation.error} evaluation={evaluation}
              voiceOn={voiceOn} toggleVoice={() => { if (voiceOn) stopSpeaking(); setVoiceOn(!voiceOn); }}
              autoListen={autoListen} toggleAutoListen={() => setAutoListen(!autoListen)}
              showHint={showHint} toggleHint={() => setShowHint(!showHint)}
              elapsed={elapsed} busy={busy} error={answerError} answered={answered}
              onReplay={() => currentQuestion && speak(currentQuestion.question)}
              onMic={() => (dictation.listening ? dictation.stop() : dictation.start())}
              onSubmit={submitAnswer} onNext={nextQuestion}
            />
          )}

          {stage === "report" && session && report && (
            <ReportPanel
              session={session} report={report} questions={questions} answers={answers}
              readOnly={readOnly} onRestart={startInterview} onNew={leaveInterview}
            />
          )}
        </main>
      </div>
    </div>
  );
}
