import { isRemoteJobSource, type JobBoardId, type NormalizedJob } from "./types";

export type ExperienceLevel = "intern" | "entry" | "mid" | "senior" | "lead";

export const EXPERIENCE_FILTERS: { id: "all" | ExperienceLevel; label: string }[] =
  [
    { id: "all", label: "All experience" },
    { id: "intern", label: "Internship" },
    { id: "entry", label: "Entry (0–2 yrs)" },
    { id: "mid", label: "Mid (3–5 yrs)" },
    { id: "senior", label: "Senior (5–8 yrs)" },
    { id: "lead", label: "Lead / Staff (8+ yrs)" },
  ];

const COUNTRY_ALIASES: [RegExp, string][] = [
  [/\b(united states of america|united states|u\.s\.a\.?|u\.s\.|usa|\bus\b)\b/i, "United States"],
  [/\b(united kingdom|great britain|england|scotland|wales|northern ireland|u\.k\.?|\buk\b)\b/i, "United Kingdom"],
  [/\b(south korea|korea, republic of|republic of korea|\bkorea\b)\b/i, "South Korea"],
  [/\b(united arab emirates|\buae\b|dubai|abu dhabi)\b/i, "United Arab Emirates"],
  [/\b(czech republic|czechia)\b/i, "Czechia"],
  [/\bhong kong\b/i, "Hong Kong"],
  [/\bnew zealand\b/i, "New Zealand"],
  [/\bsouth africa\b/i, "South Africa"],
  [/\bsaudi arabia\b/i, "Saudi Arabia"],
  [/\bcosta rica\b/i, "Costa Rica"],
  [/\b(the )?netherlands|\bholland\b/i, "Netherlands"],
  [/\bindia\b/i, "India"],
  [/\bcanada\b/i, "Canada"],
  [/\bireland\b/i, "Ireland"],
  [/\bgermany\b/i, "Germany"],
  [/\bfrance\b/i, "France"],
  [/\bpoland\b/i, "Poland"],
  [/\bromania\b/i, "Romania"],
  [/\bspain\b/i, "Spain"],
  [/\bitaly\b/i, "Italy"],
  [/\bsweden\b/i, "Sweden"],
  [/\bswitzerland\b/i, "Switzerland"],
  [/\baustralia\b/i, "Australia"],
  [/\bsingapore\b/i, "Singapore"],
  [/\bjapan\b/i, "Japan"],
  [/\bchina\b/i, "China"],
  [/\bmexico\b/i, "Mexico"],
  [/\bbrazil\b/i, "Brazil"],
  [/\bphilippines\b/i, "Philippines"],
  [/\bisrael\b/i, "Israel"],
  [/\bvietnam\b/i, "Vietnam"],
  [/\bmalaysia\b/i, "Malaysia"],
  [/\bindonesia\b/i, "Indonesia"],
  [/\bthailand\b/i, "Thailand"],
  [/\btaiwan\b/i, "Taiwan"],
  [/\bportugal\b/i, "Portugal"],
  [/\bbelgium\b/i, "Belgium"],
  [/\baustria\b/i, "Austria"],
  [/\bdenmark\b/i, "Denmark"],
  [/\bnorway\b/i, "Norway"],
  [/\bfinland\b/i, "Finland"],
  [/\bhungary\b/i, "Hungary"],
  [/\bturkey\b/i, "Turkey"],
  [/\begypt\b/i, "Egypt"],
  [/\bargentina\b/i, "Argentina"],
  [/\bchile\b/i, "Chile"],
  [/\bcolombia\b/i, "Colombia"],
  [/\bperu\b/i, "Peru"],
];

const US_STATE_CODES = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia","ks",
  "ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj","nm","ny",
  "nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt","va","wa","wv",
  "wi","wy","dc",
]);

export function countryFromLocation(
  location: string,
  remote = false,
): string {
  const text = location.trim();
  if (!text || /^unspecified$/i.test(text)) {
    return remote ? "Remote" : "Unspecified";
  }
  for (const [re, name] of COUNTRY_ALIASES) {
    if (re.test(text)) return name;
  }
  if (/remote|anywhere|distributed|work from home/i.test(text)) return "Remote";
  const parts = text
    .split(/[,|/•·]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1];
  if (last) {
    const code = last.replace(/\./g, "").toLowerCase();
    if (US_STATE_CODES.has(code) || /^[a-z]{2}\s*\d{5}/i.test(last)) {
      return "United States";
    }
    if (last.length > 3 && !/^\d/.test(last)) return last;
  }
  return remote ? "Remote" : "Unspecified";
}

export function experienceFromText(
  title: string,
  description = "",
  tags: string[] = [],
): ExperienceLevel {
  const hay = `${title} ${description.slice(0, 500)} ${tags.join(" ")}`.toLowerCase();
  if (
    /\b(intern(ship)?|co-?op|student|campus hire|university (grad|recruit)|graduate (program|programme)|apprentice)\b/.test(
      hay,
    )
  ) {
    return "intern";
  }
  if (
    /\b(principal|staff|distinguished|fellow|director|vice president|\bvp\b|head of|chief |architect)\b/.test(
      hay,
    )
  ) {
    return "lead";
  }
  if (/\b(senior|sr\.? |lead\b|manager|expert)\b/.test(hay)) return "senior";
  if (
    /\b(junior|jr\.? |associate|entry[- ]level|new grad|early career|0-2)\b/.test(
      hay,
    )
  ) {
    return "entry";
  }
  return "mid";
}

export function experienceFromYears(
  min?: number,
  max?: number,
): ExperienceLevel | undefined {
  if (min == null && max == null) return undefined;
  const lo = min ?? 0;
  const hi = max ?? min ?? 0;
  if (hi <= 0) return "intern";
  if (hi <= 2) return "entry";
  if (lo >= 8) return "lead";
  if (lo >= 5 || hi >= 8) return "senior";
  return "mid";
}

export function enrichJob<T extends NormalizedJob>(job: T): T {
  return {
    ...job,
    country: job.country || countryFromLocation(job.location, job.remote),
    experienceLevel:
      job.experienceLevel ||
      experienceFromText(job.title, job.description, job.tags),
  };
}

export function jobPostingUrl(job: Pick<NormalizedJob, "applyUrl" | "url">): string {
  return (job.applyUrl || job.url || "").trim();
}

export function jobMatchesCountry(
  job: NormalizedJob,
  country: string,
): boolean {
  if (country === "all") return true;
  if (country === "remote") return job.remote || job.country === "Remote";
  const value = job.country || countryFromLocation(job.location, job.remote);
  return value === country;
}

export function jobMatchesExperience(
  job: NormalizedJob,
  experience: "all" | ExperienceLevel,
): boolean {
  if (experience === "all") return true;
  const level =
    job.experienceLevel ||
    experienceFromText(job.title, job.description, job.tags);
  return level === experience;
}

export function jobMatchesBoard(
  job: NormalizedJob,
  board: JobBoardId,
): boolean {
  if (board === "naukri" || board === "linkedin") return job.source === board;
  if (board === "tech") {
    return (
      job.source === "greenhouse" ||
      job.source === "lever" ||
      job.source === "ashby"
    );
  }
  if (board === "remote") {
    return isRemoteJobSource(job.source);
  }
  return job.featuredCompany === board;
}
