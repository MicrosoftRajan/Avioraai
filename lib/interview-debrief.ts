import { buildLiveInterviewRoadmap } from "@/lib/interview-roadmap";
import type {
  InterviewDebriefPayload,
  InterviewModeType,
  InterviewTranscriptLine,
} from "@/lib/interview-session-storage";

const UNCERTAIN =
  /\b(don't know|dont know|not sure|no idea|i forgot|i'm stuck|i am stuck|unsure|maybe|i guess)\b/i;
const HEDGE = /\b(sort of|kind of|probably|might be|approximately)\b/i;

export function collectWeaknessHintsFromUserLine(text: string): string[] {
  const hints: string[] = [];
  if (UNCERTAIN.test(text)) hints.push("Confidence under uncertainty");
  if (HEDGE.test(text)) hints.push("Precision / hedge language");
  if (text.length > 400) hints.push("Answer length — tighten structure");
  return hints;
}

export function buildMockImprovements(p: InterviewDebriefPayload): string[] {
  const topics = extractTopics(p.messages);
  const base = [
    `Study ${p.company}'s product narrative and how your resume achievements map to their pillars.`,
    "Practice 3 STAR stories that mirror scope and metrics already on your CV.",
    "Record yourself answering a technical deep-dive in under 90 seconds — tighten pacing.",
  ];
  if (topics.includes("optimize") || topics.includes("performance"))
    base.push(
      "Drill complexity trade-offs: Big-O, memory vs CPU, and profiling anecdotes.",
    );
  if (topics.includes("system") || topics.includes("scale"))
    base.push(
      "Sketch one system design weekly — caching, sharding, back-pressure.",
    );
  if (p.weaknessHints.some((w) => w.includes("Confidence")))
    base.push(
      "Rehearse bridging phrases when unsure: clarify assumptions, then propose a path.",
    );
  if (p.codingQuestion)
    base.push(
      "Redo today's coding prompt timed — aim for working solution + tests first pass.",
    );
  return dedupe(base).slice(0, 8);
}

export function buildRoadmapWeeks(p: InterviewDebriefPayload): {
  title: string;
  focus: string[];
}[] {
  if (p.liveRoadmap?.weeks?.length) {
    return p.liveRoadmap.weeks.map((w) => ({
      title: w.title,
      focus: w.focus,
    }));
  }
  return buildLiveInterviewRoadmap({
    company: p.company,
    roundStage: p.roundStage ?? "technical",
    messages: p.messages,
    weaknessHints: p.weaknessHints,
    codingQuestion: p.codingQuestion,
  }).weeks.map((w) => ({ title: w.title, focus: w.focus }));
}

function extractTopics(messages: InterviewTranscriptLine[]): string[] {
  const blob = messages.map((m) => m.content.toLowerCase()).join(" ");
  const keys = [
    "optimize",
    "performance",
    "scale",
    "system",
    "coding",
    "algorithm",
  ];
  return keys.filter((k) => blob.includes(k));
}

function dedupe(arr: string[]) {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

export function buildDebriefSummary(
  mode: InterviewModeType,
  payload: InterviewDebriefPayload,
) {
  if (mode === "mock") {
    return {
      headline: `Sharpen your loop at ${payload.company}`,
      bullets: buildMockImprovements(payload),
      roadmap: null as null | ReturnType<typeof buildRoadmapWeeks>,
    };
  }
  return {
    headline:
      payload.liveRoadmap?.headline ??
      `Personalized roadmap after your ${payload.company} interview drill`,
    bullets: buildMockImprovements(payload),
    roadmap: buildRoadmapWeeks(payload),
  };
}
