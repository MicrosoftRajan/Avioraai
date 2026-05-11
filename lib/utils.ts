import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { subjects, voices } from "@/constants";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

const SUBJECT_ICON_SLUGS = new Set<string>(subjects);

/** Public path for subject SVG; falls back when DB value doesn't match a known icon file. */
export function getSubjectIconSrc(subject: string): string {
  const slug = subject.trim().toLowerCase();
  if (SUBJECT_ICON_SLUGS.has(slug)) {
    return `/icons/${slug}.svg`;
  }
  return "/icons/bookmark.svg";
}

export const subjectsColors = {
  science: "#E5D0FF",
  maths: "#FFDA6E",
  language: "#BDE7FF",
  coding: "#FFC8E4",
  history: "#FFECC8",
  economics: "#C8FFDF",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSubjectColor(subject: string): string {
  return subjectsColors[subject.toLowerCase() as keyof typeof subjectsColors] || "#D9D9D9";
}

export const configureAssistant = (voice: string, style: string) => {
  const voiceId = voices[voice as keyof typeof voices][
          style as keyof (typeof voices)[keyof typeof voices]
          ] || "sarah";

  const vapiAssistant = {
    name: "Companion",
    firstMessage:
        "Hello, let's start the session. Today we'll be talking about {{topic}}.",
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 1,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.

                    Tutor Guidelines:
                    Stick to the given topic - {{ topic }} and subject - {{ subject }} and teach the student about it.
                    Keep the conversation flowing smoothly while maintaining control.
                    From time to time make sure that the student is following you and understands you.
                    Break down the topic into smaller parts and teach the student one part at a time.
                    Keep your style of conversation {{ style }}.
                    Keep your responses short, like in a real voice conversation.
                    Do not include any special characters in your responses - this is a voice conversation.
              `,
        },
      ],
    },
    clientMessages: ['transcript'],
    serverMessages: [],
  } as unknown as CreateAssistantDTO;
  return vapiAssistant;
};

