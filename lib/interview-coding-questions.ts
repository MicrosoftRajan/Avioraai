import type { InterviewCodingLanguage } from "@/components/interviewmode/coding-languages";

export type CodingTestCase = {
  label: string;
  input: string;
  output: string;
};

export type CompanyCodingChallenge = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  frequency: string;
  prompt: string;
  constraints: string[];
  testCases: CodingTestCase[];
};

const GOOGLE: CompanyCodingChallenge[] = [
  {
    id: "google-two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    frequency: "Very frequently asked",
    prompt:
      "Given an integer array nums and an integer target, return indices of the two numbers such that they add up to target. You may assume exactly one solution and you may not use the same element twice.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i], target <= 10^9",
      "Exactly one valid answer exists.",
    ],
    testCases: [
      {
        label: "Test 1",
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
      },
      {
        label: "Test 2",
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
      },
      {
        label: "Test 3",
        input: "nums = [3, 3], target = 6",
        output: "[0, 1]",
      },
    ],
  },
  {
    id: "google-valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    frequency: "Often asked in phone screens",
    prompt:
      'Given a string s containing only "(", ")", "{", "}", "[" and "]", determine if the input string is valid. Open brackets must be closed by the same type in correct order.',
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only."],
    testCases: [
      { label: "Test 1", input: 's = "()"', output: "true" },
      { label: "Test 2", input: 's = "()[]{}"', output: "true" },
      { label: "Test 3", input: 's = "(]"', output: "false" },
    ],
  },
];

const AMAZON: CompanyCodingChallenge[] = [
  {
    id: "amazon-lru-cache",
    title: "LRU Cache",
    difficulty: "Medium",
    frequency: "Classic Amazon OA / onsite",
    prompt:
      "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement LRUCache with get(key) and put(key, value) in O(1) average time.",
    constraints: ["1 <= capacity <= 3000", "0 <= key <= 10^4"],
    testCases: [
      {
        label: "Test 1",
        input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
        output: "[null,null,null,2,null,-1,null,-1,3,4]",
      },
    ],
  },
  {
    id: "amazon-max-subarray",
    title: "Maximum Subarray (Kadane)",
    difficulty: "Medium",
    frequency: "Leadership principles + coding loop",
    prompt:
      "Given an integer array nums, find the contiguous subarray with the largest sum and return that sum.",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    testCases: [
      {
        label: "Test 1",
        input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        output: "6",
      },
      { label: "Test 2", input: "nums = [1]", output: "1" },
      { label: "Test 3", input: "nums = [5, 4, -1, 7, 8]", output: "23" },
    ],
  },
];

const META: CompanyCodingChallenge[] = [
  {
    id: "meta-merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    frequency: "Common Meta (Facebook) screen",
    prompt:
      "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return the result.",
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start_i <= end_i <= 10^4",
    ],
    testCases: [
      {
        label: "Test 1",
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
      },
      { label: "Test 2", input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" },
    ],
  },
  {
    id: "meta-binary-tree-level-order",
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    frequency: "Frequently asked for E4/E5",
    prompt:
      "Given the root of a binary tree, return the level order traversal of its nodes' values (left to right, level by level).",
    constraints: [
      "The number of nodes is in the range [0, 2000]",
      "-1000 <= Node.val <= 1000",
    ],
    testCases: [
      {
        label: "Test 1",
        input: "root = [3,9,20,null,null,15,7]",
        output: "[[3],[9,20],[15,7]]",
      },
      { label: "Test 2", input: "root = [1]", output: "[[1]]" },
    ],
  },
];

const MICROSOFT: CompanyCodingChallenge[] = [
  {
    id: "ms-reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    frequency: "Very common Microsoft screen",
    prompt:
      "Given the head of a singly linked list, reverse the list and return the reversed head.",
    constraints: ["The number of nodes is in the range [0, 5000]", "-5000 <= Node.val <= 5000"],
    testCases: [
      { label: "Test 1", input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { label: "Test 2", input: "head = [1,2]", output: "[2,1]" },
      { label: "Test 3", input: "head = []", output: "[]" },
    ],
  },
];

const STRIPE: CompanyCodingChallenge[] = [
  {
    id: "stripe-rate-limiter",
    title: "Rate Limiter Design",
    difficulty: "Medium",
    frequency: "Stripe engineering interview staple",
    prompt:
      "Implement a class RateLimiter that can determine if a request should be allowed given a max number of requests allowed per fixed time window (in seconds). Method: allow(timestamp: number): boolean.",
    constraints: [
      "Timestamps are non-decreasing integers.",
      "1 <= maxRequests <= 10^4",
      "1 <= windowSeconds <= 3600",
    ],
    testCases: [
      {
        label: "Test 1",
        input: "max=3, window=10s, calls at t=1,2,3,11,12",
        output: "true,true,true,false,true",
      },
    ],
  },
  {
    id: "stripe-string-compression",
    title: "String Compression",
    difficulty: "Easy",
    frequency: "Often in Stripe phone screen",
    prompt:
      'Given an array of characters chars, compress it using counts of consecutive duplicate characters. Replace groups with the character followed by digits if count > 1. Return the new length.',
    constraints: ["1 <= chars.length <= 2000", "chars[i] is lowercase English letter."],
    testCases: [
      {
        label: "Test 1",
        input: 'chars = ["a","a","b","b","c","c","c"]',
        output: '["a","2","b","2","c","3"] length 6',
      },
    ],
  },
];

const NETFLIX: CompanyCodingChallenge[] = [
  {
    id: "netflix-top-k-frequent",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    frequency: "Common in Netflix SWE loops",
    prompt:
      "Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.",
    constraints: ["1 <= nums.length <= 10^5", "k is in the range [1, unique elements]"],
    testCases: [
      { label: "Test 1", input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]" },
      { label: "Test 2", input: "nums = [1], k = 1", output: "[1]" },
    ],
  },
];

const APPLE: CompanyCodingChallenge[] = [
  {
    id: "apple-climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    frequency: "Frequent Apple phone screen",
    prompt:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    constraints: ["1 <= n <= 45"],
    testCases: [
      { label: "Test 1", input: "n = 2", output: "2" },
      { label: "Test 2", input: "n = 3", output: "3" },
      { label: "Test 3", input: "n = 5", output: "8" },
    ],
  },
];

const GENERIC: CompanyCodingChallenge[] = [
  {
    id: "generic-valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    frequency: "Common across tech companies",
    prompt:
      "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    testCases: [
      { label: "Test 1", input: 's = "anagram", t = "nagaram"', output: "true" },
      { label: "Test 2", input: 's = "rat", t = "car"', output: "false" },
    ],
  },
  {
    id: "generic-binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    frequency: "Universal screening question",
    prompt:
      "Given a sorted array of distinct integers nums and a target, return the index of target or -1 if not found. O(log n) required.",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 < nums[i], target < 10^4", "nums is sorted ascending."],
    testCases: [
      { label: "Test 1", input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
      { label: "Test 2", input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
    ],
  },
];

const COMPANY_BANK: Record<string, CompanyCodingChallenge[]> = {
  google: GOOGLE,
  alphabet: GOOGLE,
  amazon: AMAZON,
  aws: AMAZON,
  meta: META,
  facebook: META,
  microsoft: MICROSOFT,
  msft: MICROSOFT,
  stripe: STRIPE,
  netflix: NETFLIX,
  apple: APPLE,
  uber: GENERIC,
  airbnb: GENERIC,
};

function normalizeCompanyKey(company: string): string {
  const c = company.trim().toLowerCase();
  for (const key of Object.keys(COMPANY_BANK)) {
    if (c.includes(key)) return key;
  }
  return "generic";
}

function hashPick<T>(items: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return items[Math.abs(h) % items.length]!;
}

export function pickCompanyCodingQuestion(
  company: string,
  sessionSeed = "default",
): CompanyCodingChallenge {
  const key = normalizeCompanyKey(company);
  const pool = COMPANY_BANK[key] ?? GENERIC;
  return hashPick(pool, `${key}:${sessionSeed}`);
}

export function findCodingQuestionById(
  id: string,
): CompanyCodingChallenge | null {
  for (const pool of Object.values(COMPANY_BANK)) {
    const hit = pool.find((q) => q.id === id);
    if (hit) return hit;
  }
  return GENERIC.find((q) => q.id === id) ?? null;
}

/** Merge company bank question with optional AI override text. */
export function resolveCodingChallenge(
  company: string,
  options?: {
    aiQuestion?: string;
    questionId?: string;
    sessionSeed?: string;
  },
): CompanyCodingChallenge {
  if (options?.questionId) {
    const found = findCodingQuestionById(options.questionId);
    if (found) return found;
  }

  const base = pickCompanyCodingQuestion(
    company,
    options?.sessionSeed ?? "v1",
  );

  if (options?.aiQuestion?.trim()) {
    return {
      ...base,
      prompt: `${options.aiQuestion.trim()}\n\n(Interviewer note — also study the classic ${base.title} pattern common at ${company}.)`,
    };
  }

  return base;
}

function blockComment(
  lang: InterviewCodingLanguage,
  lines: string[],
): string {
  if (lang === "Python") {
    return lines.map((l) => (l ? ` * ${l}` : " *")).join("\n");
  }
  return lines.map((l) => (l ? ` * ${l}` : " *")).join("\n");
}

/** Marks where the editable solution starts (used when switching languages). */
export const CODING_SOLUTION_MARKER = "---AVORA_SOLUTION---";

function solutionMarkerLine(language: InterviewCodingLanguage): string {
  if (language === "Python") {
    return `# ${CODING_SOLUTION_MARKER}`;
  }
  return `// ${CODING_SOLUTION_MARKER}`;
}

export function extractCodingSolution(code: string): string | null {
  const lines = code.split("\n");
  const markerIdx = lines.findIndex((line) =>
    line.includes(CODING_SOLUTION_MARKER),
  );
  if (markerIdx === -1) return null;
  return lines.slice(markerIdx + 1).join("\n");
}

function defaultSolutionBody(language: InterviewCodingLanguage): string {
  switch (language) {
    case "Python":
      return `def solve():\n    # TODO: implement\n    pass\n\n\nif __name__ == "__main__":\n    solve()\n`;
    case "Java":
      return `public class Solution {\n    public static void main(String[] args) {\n        // TODO: implement\n    }\n}\n`;
    case "C++":
      return `#include <iostream>\nusing namespace std;\n\nint main() {\n    // TODO: implement\n    return 0;\n}\n`;
    case "C":
      return `#include <stdio.h>\n\nint main(void) {\n    /* TODO: implement */\n    return 0;\n}\n`;
    case "Go":
      return `package main\n\nimport "fmt"\n\nfunc main() {\n    // TODO: implement\n    fmt.Println("ready")\n}\n`;
    default:
      return "";
  }
}

/** Compact editor starter: brief header + marker + solution scaffold (question lives in UI panel). */
export function buildCodingSolutionStarter(
  language: InterviewCodingLanguage,
  company: string,
  challenge: CompanyCodingChallenge,
  preservedSolution?: string | null,
): string {
  const companyLabel = company.trim() || "Tech";
  const header =
    language === "Python"
      ? [
          `"""`,
          ` * ${companyLabel} — ${challenge.title} (${challenge.difficulty})`,
          ` * Question and test cases are shown in the panel on the left.`,
          `"""`,
        ].join("\n")
      : [
          `/*`,
          ` * ${companyLabel} — ${challenge.title} (${challenge.difficulty})`,
          ` * Question and test cases are shown in the panel on the left.`,
          ` */`,
        ].join("\n");

  const body =
    preservedSolution?.trim() || defaultSolutionBody(language);

  return `${header}\n\n${solutionMarkerLine(language)}\n\n${body}`;
}

export function buildCodingEditorTemplate(
  language: InterviewCodingLanguage,
  company: string,
  challenge: CompanyCodingChallenge,
): string {
  const companyLabel = company.trim() || "Tech";
  const testLines = challenge.testCases.map(
    (tc) => `${tc.label}: ${tc.input}  →  Expected: ${tc.output}`,
  );
  const constraintLines = challenge.constraints.map((c) => ` *   - ${c}`);

  const headerLines = [
    `${companyLabel} — ${challenge.frequency}`,
    `Problem: ${challenge.title} (${challenge.difficulty})`,
    "",
    "QUESTION:",
    ...challenge.prompt.split("\n").map((l) => ` * ${l}`),
    "",
    "TEST CASES:",
    ...testLines.map((l) => ` * ${l}`),
    "",
    "CONSTRAINTS:",
    ...constraintLines,
    "",
    "Write your solution below. The interviewer continues on voice.",
  ];

  const header = blockComment(language, headerLines);
  const marker = solutionMarkerLine(language);
  const body = defaultSolutionBody(language);

  if (language === "Python") {
    return `"""\n${header}\n"""\n\n${marker}\n\n${body}`;
  }
  return `/*\n${header}\n */\n\n${marker}\n\n${body}`;
}

export function challengeDisplayTitle(challenge: CompanyCodingChallenge): string {
  return `${challenge.title} (${challenge.difficulty})`;
}
