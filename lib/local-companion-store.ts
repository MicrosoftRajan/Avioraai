import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type LocalCompanion = {
  id: string;
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
  author: string | null;
  createdAt: string;
};

export type LocalSession = {
  id: string;
  companion_id: string;
  user_id: string | null;
  created_at: string;
};

type LocalDb = {
  companions: LocalCompanion[];
  sessions: LocalSession[];
};

function dbPath(): string {
  const root = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), ".data");
  return path.join(root, "aviora-local.json");
}

async function readDb(): Promise<LocalDb> {
  try {
    const raw = await readFile(dbPath(), "utf8");
    const parsed = JSON.parse(raw) as LocalDb;
    return {
      companions: Array.isArray(parsed.companions) ? parsed.companions : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return { companions: [], sessions: [] };
  }
}

async function writeDb(db: LocalDb): Promise<void> {
  const file = dbPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(db, null, 2), "utf8");
}

function matchesFilter(value: string, filter?: string | string[]): boolean {
  if (filter == null) return true;
  const needles = (Array.isArray(filter) ? filter : [filter])
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!needles.length) return true;
  const hay = value.toLowerCase();
  return needles.some((n) => hay.includes(n));
}

export async function localCreateCompanion(
  input: CreateCompanion,
  author: string | null,
): Promise<LocalCompanion> {
  const db = await readDb();
  const row: LocalCompanion = {
    id: crypto.randomUUID(),
    name: input.name,
    subject: input.subject,
    topic: input.topic,
    voice: input.voice,
    style: input.style,
    duration: Number(input.duration) || 15,
    author,
    createdAt: new Date().toISOString(),
  };
  db.companions.unshift(row);
  await writeDb(db);
  return row;
}

export async function localGetCompanions(input: GetAllCompanions): Promise<LocalCompanion[]> {
  const db = await readDb();
  const filtered = db.companions.filter((c) => {
    const subjectOk = matchesFilter(c.subject, input.subject);
    const topicOk =
      matchesFilter(c.topic, input.topic) || matchesFilter(c.name, input.topic);
    return subjectOk && topicOk;
  });
  const page = input.page ?? 1;
  const limit = input.limit ?? 10;
  const start = (page - 1) * limit;
  return filtered.slice(start, start + limit);
}

export async function localGetCompanion(id: string): Promise<LocalCompanion | null> {
  const db = await readDb();
  return db.companions.find((c) => c.id === id) ?? null;
}

export async function localGetUserCompanions(userId: string): Promise<LocalCompanion[]> {
  const db = await readDb();
  return db.companions.filter((c) => !c.author || c.author === userId);
}

export async function localAddSession(
  companionId: string,
  userId: string | null,
): Promise<LocalSession> {
  const db = await readDb();
  const row: LocalSession = {
    id: crypto.randomUUID(),
    companion_id: companionId,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  db.sessions.unshift(row);
  await writeDb(db);
  return row;
}

export async function localGetSessions(input: {
  userId?: string;
  limit?: number;
}): Promise<(LocalCompanion & { sessionRowId: string })[]> {
  const db = await readDb();
  const limit = input.limit ?? 10;
  const rows = db.sessions.filter((s) =>
    input.userId ? s.user_id === input.userId : true,
  );
  const out: (LocalCompanion & { sessionRowId: string })[] = [];
  for (const session of rows) {
    const companion = db.companions.find((c) => c.id === session.companion_id);
    if (!companion) continue;
    out.push({ ...companion, sessionRowId: session.id });
    if (out.length >= limit) break;
  }
  return out;
}
