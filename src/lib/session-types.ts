export type SessionRow = {
  id: number;
  role: string;
  inputMode: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  questionCount: number;
  skills: string[];
  status: string;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
};

export type QuestionRow = {
  id: number;
  sessionId: number;
  position: number;
  category: string;
  skill: string;
  question: string;
  guidance: { points: string[]; star: boolean };
};

export type AnswerRow = {
  id: number;
  questionId: number;
  transcript: string;
  inputMode: string;
  clarity: number;
  structure: number;
  relevance: number;
  technical: number;
  overall: number;
  issues: string[];
  strengths: string[];
  improvements: string[];
  modelAnswerPoints: string[];
};

export type ReportRow = {
  overall: number;
  clarity: number;
  structure: number;
  relevance: number;
  technical: number;
  recommendation: string;
  summary: string;
  categoryScores: { label: string; score: number }[];
  strengths: string[];
  improvements: string[];
};

export type VoiceCapabilities = {
  stt: { configured: boolean; provider: string };
  tts: { configured: boolean; provider: string };
};
