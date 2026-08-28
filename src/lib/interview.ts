/**
 * Deterministic interview engine.
 *
 * Every exported function here is the FALLBACK implementation. The API routes
 * first try the AI provider layer (src/lib/ai-provider.ts) and only use these
 * when no API key is configured, so the whole module works with zero setup.
 */

export type Category = "Technical" | "Behavioral" | "Culture Fit" | "HR & Logistics";
export type InputMode = "title" | "description";

export type PlanInput = {
  mode: InputMode;
  jobTitle: string;
  company: string;
  description: string;
};

export type Guidance = { points: string[]; star: boolean };

export type PlanQuestion = {
  position: number;
  category: Category;
  skill: string;
  question: string;
  guidance: Guidance;
};

export type Plan = {
  role: string;
  skills: string[];
  workStyle: string[];
  questions: PlanQuestion[];
};

export type Evaluation = {
  overall: number;
  clarity: number;
  structure: number;
  relevance: number;
  technical: number;
  verdict: string;
  feedback: string;
  issues: string[];
  strengths: string[];
  improvements: string[];
  modelAnswerPoints: string[];
  metrics: { words: number; fillers: number };
};

export type Report = {
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

const SKILL_MATCHERS: [RegExp, string][] = [
  [/react\b|react\.js/i, "React"], [/next\.?js/i, "Next.js"], [/typescript/i, "TypeScript"],
  [/javascript|es6/i, "JavaScript"], [/rest\b|graphql|api/i, "APIs"], [/\bgit\b|github/i, "Git"],
  [/python/i, "Python"], [/\bsql\b|postgres|mysql/i, "SQL"], [/pandas|numpy/i, "Pandas"],
  [/power ?bi|tableau|dashboard/i, "Data Visualization"], [/machine learning|\bml\b|ai\b/i, "Machine Learning"],
  [/excel/i, "Excel"], [/node/i, "Node.js"], [/java\b|spring/i, "Java"], [/\bphp\b|laravel/i, "PHP"],
  [/\bdocker\b|kubernetes|devops|ci\/cd/i, "DevOps"], [/aws|azure|gcp|cloud/i, "Cloud"],
  [/figma|ui\/ux|design/i, "UI/UX"], [/tailwind|css|html/i, "CSS"], [/seo|marketing|content/i, "Marketing"],
  [/account|finance|invoice|tax/i, "Finance"], [/recruit|hiring|onboard|hr\b|payroll/i, "HR Operations"],
  [/support|helpdesk|customer/i, "Customer Support"], [/sales|crm|lead/i, "Sales"],
];

const STYLE_MATCHERS: [RegExp, string][] = [
  [/agile|scrum|sprint|kanban/i, "Agile teamwork"],
  [/collaborat|cross-functional|team player/i, "Cross-functional collaboration"],
  [/fast.paced|deadline|pressure|startup/i, "Delivery under deadlines"],
  [/remote|hybrid|on.?site/i, "Distributed / hybrid working"],
  [/client|stakeholder|customer/i, "Client & stakeholder communication"],
  [/mentor|lead|own|ownership|independen/i, "Ownership & initiative"],
];

const FILLERS = /\b(um+|uh+|erm+|like,|you know|i mean|kind of|sort of|basically|actually basically)\b/gi;
const HEDGING = /\b(i think maybe|i guess|probably|not really sure|no idea|don't know)\b/gi;
const STRUCTURE_MARKS = /\b(first|second|then|after that|finally|situation|task|action|result|to start|next|in the end)\b/gi;
const OUTCOME_MARKS = /\b(result|resulted|improv\w*|reduc\w*|increas\w*|decreas\w*|saved|grew|delivered|shipped|percent|%|\b\d+%\b|learned)\b/gi;
const EXAMPLE_MARKS = /\b(for example|for instance|in my (last|previous|current)|at my (last|previous)|i worked on|i built|i led|we shipped|during my)\b/gi;
const TECHNICAL_MARKS = /\b(code|component|api|query|database|test|tests|testing|debug|debugged|deploy|deployed|design|architecture|render|state|schema|pipeline|metric|framework|function|endpoint|version control|data|dataset|dataframe|profile|profiled|clean|cleaned|analys\w*|automat\w*|optimi\w*|refactor\w*|script|model|report|chart|dashboard|visual\w*|measure\w*)\b/gi;

function titleCase(value: string) {
  return value.replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function extractSkills(text: string): string[] {
  const found = SKILL_MATCHERS.filter(([re]) => re.test(text)).map(([, label]) => label);
  return [...new Set(found)].slice(0, 8);
}

const DOMAIN_DEFAULTS: [RegExp, string[]][] = [
  [/analyst|analytics|data|scientist/i, ["SQL", "Data Visualization", "Statistics", "Excel"]],
  [/developer|engineer|programmer|software/i, ["Git", "APIs", "Testing", "Debugging"]],
  [/frontend|front-end|ui\b/i, ["CSS", "UI/UX", "Testing"]],
  [/backend|back-end/i, ["APIs", "Databases", "Testing"]],
  [/marketing|content|seo/i, ["Content Strategy", "SEO", "Campaign Analytics"]],
  [/hr\b|recruit|human resource/i, ["HR Operations", "Onboarding", "Communication"]],
  [/support|helpdesk|customer/i, ["Communication", "Ticketing", "Problem Solving"]],
  [/sales|account/i, ["CRM", "Negotiation", "Pipeline Management"]],
];

/** Tops up thin skill lists (common when only a job title was entered). */
export function enrichSkills(found: string[], role: string): string[] {
  const out = [...found];
  if (out.length < 3) {
    for (const [re, defaults] of DOMAIN_DEFAULTS) {
      if (re.test(role)) { for (const skill of defaults) if (!out.includes(skill)) out.push(skill); break; }
    }
  }
  if (out.length < 3) out.push("Problem Solving", "Communication", "Teamwork");
  return [...new Set(out)].slice(0, 8);
}

export function resolveRole(input: PlanInput): string {
  if (input.mode === "title" && input.jobTitle.trim()) return titleCase(input.jobTitle);
  const match = input.description.match(
    /(?:looking for|seeking|hiring|role(?: of|:)?|position(?: of|:)?|vacancy(?: of|:)?|require(?:s|d)?)\s+(?:an?\s+)?([A-Za-z+#./ ]{3,48})/i,
  );
  if (match) return titleCase(match[1].replace(/\b(with|who|to|and|for)\b.*$/i, ""));
  if (/data|analyst|python|pandas/i.test(input.description)) return "Data Analyst";
  if (/frontend|front-end|react/i.test(input.description)) return "Frontend Developer";
  if (/backend|back-end|node/i.test(input.description)) return "Backend Developer";
  if (/market/i.test(input.description)) return "Marketing Specialist";
  if (/recruit|hr\b|human resource/i.test(input.description)) return "HR Officer";
  return "Professional Candidate";
}

/** Builds the question plan. Question count is chosen by the user (3-12). */
export function buildPlan(input: PlanInput, count: number): Plan {
  const total = Math.min(12, Math.max(3, Math.round(count)));
  const source = input.mode === "title"
    ? `${input.jobTitle} ${input.description}`.trim() || input.jobTitle
    : input.description;
  const role = resolveRole(input);
  const skills = enrichSkills(extractSkills(source), role);
  const pool = skills;
  const company = input.company.trim() || "our company";
  const workStyle = (STYLE_MATCHERS.filter(([re]) => re.test(source)).map(([, label]) => label));
  const styles = workStyle.length ? workStyle.slice(0, 3) : ["Structured communication", "Team collaboration", "Continuous learning"];

  const hrCount = total >= 9 ? 3 : total >= 5 ? 2 : 1;
  const core = total - hrCount;
  const technical = Math.max(1, Math.floor(core / 2));
  const behavioral = Math.max(1, Math.floor(core * 0.3));
  const culture = Math.max(0, core - technical - behavioral);

  const questions: PlanQuestion[] = [];
  let position = 1;
  const push = (category: Category, skill: string, question: string, points: string[], star = false) =>
    questions.push({ position: position++, category, skill, question, guidance: { points, star } });

  const technicalPrompts = [
    (s: string) => [`How would you use ${s} on a real project for this ${role} role?`, "Explain your process step by step"],
    (s: string) => [`Walk me through the toughest ${s} problem you have solved.`, "Describe the problem before the solution"],
    (s: string) => [`How do you keep your ${s} work accurate, tested, and maintainable?`, "Mention review and testing habits"],
    (s: string) => [`A ${s} issue reaches production. What do you do first?`, "Show a calm, systematic approach"],
  ];

  for (let i = 0; i < technical; i++) {
    const skill = pool[i % pool.length];
    const [question, hint] = technicalPrompts[i % technicalPrompts.length](skill);
    push("Technical", skill, question, [
      hint,
      `Show working knowledge of ${skill}, not just theory`,
      "Explain the trade-offs behind your decision",
      "Finish with testing and a measurable outcome",
    ]);
  }

  const behavioralPrompts = [
    `Tell me about a time you faced a difficult problem related to ${pool[0]}. How did you handle it?`,
    `Describe a situation where you had to work closely with others to deliver something important.`,
    `Tell me about a time you received critical feedback. What did you change?`,
    `Describe a deadline you nearly missed. What did you do?`,
  ];
  for (let i = 0; i < behavioral; i++) {
    push("Behavioral", "Communication", behavioralPrompts[i % behavioralPrompts.length], [
      "Situation — brief context in one or two lines",
      "Task — what you were personally responsible for",
      "Action — the exact steps you took",
      "Result — the outcome and what you learned",
    ], true);
  }

  const culturePrompts = [
    `How do you prefer to work in a team that follows ${styles[0].toLowerCase()}?`,
    `How would you handle a disagreement with a teammate about the best way to do something?`,
    `What kind of work environment helps you do your best work?`,
  ];
  for (let i = 0; i < culture; i++) {
    push("Culture Fit", "Teamwork", culturePrompts[i % culturePrompts.length], [
      "Be honest about how you actually work",
      "Show flexibility towards other working styles",
      "Relate your answer to this team's environment",
    ]);
  }

  const hrQuestions: [string, string[]][] = [
    [`What are your salary expectations for this ${role} position?`, ["Give a researched range, not a single number", "Show you understand the market for this role", "Stay open to discussing the full package"]],
    [`When are you available to start, and what is your notice period?`, ["Give a clear, specific date", "Mention any notice you must serve", "Show flexibility if they need you sooner"]],
    [`Which working hours and work mode suit you best — on-site, hybrid, or remote?`, ["State the mode you can genuinely commit to", "Mention timezone or hour constraints if relevant", "Show willingness to overlap with the team"]],
    [company ? `Why do you want to work at ${company}?` : `Why do you want this job?`, ["Reference something specific about the company or role", "Connect your skills to their needs", "Show genuine motivation, not flattery"]],
    [`Do you have any questions for us about the role or the team?`, ["Ask about team structure or success measures", "Ask about the first 90 days", "Avoid salary only at this stage"]],
  ];
  for (let i = 0; i < hrCount; i++) {
    const [question, points] = hrQuestions[i % hrQuestions.length];
    push("HR & Logistics", "Professional Fit", question, points);
  }

  return { role, skills: skills.length ? skills : pool, workStyle: styles, questions };
}

function clamp(value: number) {
  return Math.max(8, Math.min(97, Math.round(value)));
}

/** Heuristic evaluator used until the real AI endpoint is connected. */
export function evaluateAnswer(params: {
  answer: string;
  category: string;
  skill: string;
  question: string;
  role: string;
}): Evaluation {
  const raw = params.answer.trim();
  const words = raw.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const fillers = (raw.match(FILLERS) || []).length + (raw.match(HEDGING) || []).length;
  const structure = (raw.match(STRUCTURE_MARKS) || []).length;
  const outcome = (raw.match(OUTCOME_MARKS) || []).length;
  const example = (raw.match(EXAMPLE_MARKS) || []).length;
  const technical = (raw.match(TECHNICAL_MARKS) || []).length;
  const sentences = raw.split(/[.!?]+/).filter((s) => s.trim().length > 2).length;

  const lengthBase = Math.min(90, 34 + wordCount * 1.15);
  const clarity = clamp(lengthBase + (sentences >= 3 ? 8 : 0) - fillers * 3 - (wordCount > 260 ? 8 : 0));
  const structureScore = clamp(lengthBase - 6 + structure * 6 + (params.category === "Behavioral" && structure >= 2 ? 8 : 0) - (wordCount > 260 ? 6 : 0));
  const relevanceScore = clamp(lengthBase + example * 6 + outcome * 4 - (wordCount < 20 ? 15 : 0));
  const technicalScore = clamp(lengthBase - 4 + technical * 5 + (params.skill && raw.toLowerCase().includes(params.skill.toLowerCase()) ? 8 : 0));
  const overall = Math.round((clarity + structureScore + relevanceScore + technicalScore) / 4);

  const issues: string[] = [];
  if (wordCount < 20) issues.push("The answer was too short — the interviewer needs more detail to assess you.");
  if (params.category === "Behavioral" && structure < 2) issues.push("No clear Situation → Task → Action → Result structure was detected.");
  if (params.category !== "Behavioral" && structure < 1) issues.push("The answer jumps around instead of following a clear order of steps.");
  if (!example) issues.push("No specific real example from your own experience was mentioned.");
  if (!outcome) issues.push("No result or measurable impact was given, so the outcome is unclear.");
  if (params.category === "Technical" && technical < 2) issues.push("Not enough technical specifics — name the tools, methods, or decisions you used.");
  if (fillers) issues.push(`${fillers} filler phrase${fillers > 1 ? "s" : ""} or hesitant wording detected, which weakens confidence.`);
  if (wordCount > 260) issues.push("The answer is very long — trim it to the points that matter most.");
  if (!issues.length) issues.push("No major issues found — this answer is close to interview-ready.");

  const strengths: string[] = [];
  if (wordCount >= 45) strengths.push("Gave enough detail for the interviewer to follow.");
  if (example) strengths.push("Backed the answer with a concrete personal example.");
  if (outcome) strengths.push("Closed with an outcome, which shows impact.");
  if (technical >= 2 && params.category === "Technical") strengths.push("Used relevant technical language correctly.");
  if (structure >= 2) strengths.push("Kept the answer organised and easy to follow.");
  if (!strengths.length) strengths.push("Answered the question directly and stayed on topic.");

  const improvements: string[] = [];
  if (params.category === "Behavioral") improvements.push("Use STAR: one line on the situation, your task, your actions, then the result.");
  if (!outcome) improvements.push("End with a measurable result — time saved, quality improved, score, revenue, or feedback.");
  if (!example) improvements.push("Anchor the answer in one real project instead of general statements.");
  if (fillers) improvements.push("Slow down and replace filler words with short pauses.");
  if (wordCount < 45) improvements.push("Expand to around 90–140 spoken words so the interviewer can assess your depth.");
  if (wordCount > 260) improvements.push("Cut to your two strongest points and stop talking once they land.");
  if (params.category === "HR & Logistics") improvements.push("Give a specific, confident answer — dates, figures, and clear preferences.");
  if (!improvements.length) improvements.push("Add one extra layer of detail to push this answer from good to excellent.");

  const verdict = overall >= 85 ? "Strong answer" : overall >= 70 ? "Good answer" : overall >= 55 ? "Needs work" : "Weak answer";

  return {
    overall, clarity, structure: structureScore, relevance: relevanceScore, technical: technicalScore,
    verdict,
    feedback: verdict === "Strong answer"
      ? "Clear, relevant, and well organised. Keep this structure for the rest of the interview."
      : verdict === "Good answer"
        ? "Solid answer with the right idea. Sharpen the details and the outcome to make it stand out."
        : verdict === "Needs work"
          ? "The answer is relevant but underdeveloped. Add structure, a real example, and a result."
          : "This answer needs a rebuild: slow down, use a structure, and give specifics with a measurable result.",
    issues,
    strengths,
    improvements,
    modelAnswerPoints: params.category === "HR & Logistics"
      ? ["A specific and realistic figure or date", "A short reason grounded in research", "Flexibility to reach an agreement"]
      : [`A direct opening line that answers the question about ${params.skill || "the role"}`, "One specific example with your exact contribution", "The tools, methods, or reasoning you applied", "A measurable result and what you would improve next time"],
    metrics: { words: wordCount, fillers },
  };
}

export function aggregateReport(
  answers: { category: string; skill: string; clarity: number; structure: number; relevance: number; technical: number; overall: number; strengths: string[]; improvements: string[] }[],
): Report {
  const avg = (key: "clarity" | "structure" | "relevance" | "technical" | "overall") =>
    answers.length ? Math.round(answers.reduce((sum, a) => sum + a[key], 0) / answers.length) : 0;

  const categories = [...new Set(answers.map((a) => a.category))];
  const categoryScores = categories.map((label) => {
    const rows = answers.filter((a) => a.category === label);
    return { label, score: Math.round(rows.reduce((s, a) => s + a.overall, 0) / rows.length) };
  });

  const strengths = [...new Set(answers.flatMap((a) => a.strengths))].slice(0, 4);
  const improvements = [...new Set(answers.flatMap((a) => a.improvements))].slice(0, 4);
  const overall = avg("overall");
  const recommendation = overall >= 85 ? "Interview ready" : overall >= 70 ? "Nearly ready" : overall >= 55 ? "Needs practice" : "Needs preparation";

  return {
    overall,
    clarity: avg("clarity"),
    structure: avg("structure"),
    relevance: avg("relevance"),
    technical: avg("technical"),
    recommendation,
    summary: answers.length
      ? `You answered ${answers.length} question${answers.length > 1 ? "s" : ""}. Your strongest area was ${(categoryScores.sort((a, b) => b.score - a.score)[0]?.label || "communication").toLowerCase()} at ${categoryScores[0]?.score ?? overall}%. Focus your next practice session on ${(categoryScores[categoryScores.length - 1]?.label || "structure").toLowerCase()}.`
      : "No answers were recorded in this session.",
    categoryScores,
    strengths: strengths.length ? strengths : ["Completed the interview session."],
    improvements: improvements.length ? improvements : ["Extend answers to 90–140 words with a clear result."],
  };
}

export const SAMPLE_DESCRIPTION =
  "We are looking for a Junior Frontend Developer with experience in React, JavaScript, TypeScript, REST APIs and Git. Experience with Next.js is preferred. The candidate should be comfortable working in an agile team and collaborating with designers and backend developers.";
