import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type Guidance = { points: string[]; star: boolean };

export const interviewSessions = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  inputMode: text("input_mode").notNull(), // "title" | "description"
  jobTitle: text("job_title").notNull().default(""),
  company: text("company").notNull().default(""),
  jobDescription: text("job_description").notNull().default(""),
  questionCount: integer("question_count").notNull().default(5),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("in_progress"), // in_progress | completed
  overallScore: integer("overall_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  position: integer("position").notNull(),
  category: text("category").notNull(), // Technical | Behavioral | Culture Fit | HR & Logistics
  skill: text("skill").notNull().default(""),
  question: text("question").notNull(),
  guidance: jsonb("guidance").$type<Guidance>().notNull(),
});

export const interviewAnswers = pgTable("interview_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id").notNull(),
  transcript: text("transcript").notNull(),
  inputMode: text("input_mode").notNull().default("voice"), // voice | text
  clarity: integer("clarity").notNull().default(0),
  structure: integer("structure").notNull().default(0),
  relevance: integer("relevance").notNull().default(0),
  technical: integer("technical").notNull().default(0),
  overall: integer("overall").notNull().default(0),
  issues: jsonb("issues").$type<string[]>().notNull().default([]),
  strengths: jsonb("strengths").$type<string[]>().notNull().default([]),
  improvements: jsonb("improvements").$type<string[]>().notNull().default([]),
  modelAnswerPoints: jsonb("model_answer_points").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const interviewReports = pgTable("interview_reports", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  overall: integer("overall").notNull(),
  clarity: integer("clarity").notNull(),
  structure: integer("structure").notNull(),
  relevance: integer("relevance").notNull(),
  technical: integer("technical").notNull(),
  recommendation: text("recommendation").notNull(),
  summary: text("summary").notNull(),
  categoryScores: jsonb("category_scores").$type<{ label: string; score: number }[]>().notNull().default([]),
  strengths: jsonb("strengths").$type<string[]>().notNull().default([]),
  improvements: jsonb("improvements").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
