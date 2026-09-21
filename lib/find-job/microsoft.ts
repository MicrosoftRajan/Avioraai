import { hashId, settledValues, truncate } from "./http";
import { enrichJob } from "./job-filters";
import { fetchLinkedInJobs } from "./linkedin";
import {
  fetchAdzuna,
  fetchArbeitnow,
  fetchHimalayas,
  fetchJobicy,
  fetchJSearch,
  fetchRemoteOk,
  fetchRemotive,
} from "./job-sources";
import type { NormalizedJob } from "./types";

function asMicrosoft(job: NormalizedJob): NormalizedJob {
  return enrichJob({
    ...job,
    company: "Microsoft",
    source: "microsoft",
    sourceLabel: "Microsoft careers",
    featuredCompany: "microsoft",
    id: hashId(["microsoft", job.url, job.title]),
    description: truncate(job.description || `${job.title} at Microsoft`),
  });
}

export async function fetchMicrosoftJobs(): Promise<NormalizedJob[]> {
  const batches = await Promise.allSettled([
    fetchLinkedInJobs({ companyId: "1035", pages: 3 }),
    fetchRemotive("Microsoft", 40),
    fetchJobicy("microsoft", 20),
    fetchRemoteOk(40),
    fetchArbeitnow(30),
    fetchHimalayas(25),
    fetchJSearch("Microsoft software engineer", "United States"),
    fetchAdzuna("Microsoft", "United States"),
  ]);
  const all = settledValues(batches).flat();
  return all.filter((j) => /microsoft/i.test(j.company)).map(asMicrosoft);
}
