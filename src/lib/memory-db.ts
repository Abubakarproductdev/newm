import type { SessionRow, QuestionRow, AnswerRow, ReportRow } from "./session-types";

/**
 * In-memory store that replaces PostgreSQL.
 * Uses globalThis to survive Next.js HMR reloads in development.
 */
const g = globalThis as typeof globalThis & {
  __DB_SESSIONS?: Map<number, SessionRow>;
  __DB_QUESTIONS?: Map<number, QuestionRow[]>;
  __DB_ANSWERS?: Map<number, AnswerRow[]>;
  __DB_REPORTS?: Map<number, ReportRow>;
  __DB_COUNTER?: { session: number; question: number; answer: number };
};

if (!g.__DB_SESSIONS) {
  g.__DB_SESSIONS = new Map<number, SessionRow>();
  g.__DB_QUESTIONS = new Map<number, QuestionRow[]>();
  g.__DB_ANSWERS = new Map<number, AnswerRow[]>();
  g.__DB_REPORTS = new Map<number, ReportRow>();
  g.__DB_COUNTER = { session: 1, question: 1, answer: 1 };
}

export const sessionsStore = g.__DB_SESSIONS!;
export const questionsStore = g.__DB_QUESTIONS!;
export const answersStore = g.__DB_ANSWERS!;
export const reportsStore = g.__DB_REPORTS!;
export const counter = g.__DB_COUNTER!;
