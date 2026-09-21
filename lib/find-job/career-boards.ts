import type { FeaturedCompanyId } from "./types";

export type NamedBoard = { company: string; token: string };

export type WorkdayBoard = {
  id: FeaturedCompanyId;
  company: string;
  host: string;
  tenant: string;
  site: string;
  careerUrl: string;
  maxPages: number;
};

/** Public Greenhouse job-board tokens (Job Board API, no auth). */
export const GREENHOUSE_BOARDS: NamedBoard[] = [
  { company: "Anthropic", token: "anthropic" },
  { company: "Stripe", token: "stripe" },
  { company: "Airbnb", token: "airbnb" },
  { company: "Figma", token: "figma" },
  { company: "Databricks", token: "databricks" },
  { company: "Cloudflare", token: "cloudflare" },
  { company: "Discord", token: "discord" },
  { company: "Vercel", token: "vercel" },
  { company: "Coinbase", token: "coinbase" },
  { company: "Datadog", token: "datadog" },
  { company: "Dropbox", token: "dropbox" },
  { company: "Robinhood", token: "robinhood" },
  { company: "GitLab", token: "gitlab" },
  { company: "Instacart", token: "instacart" },
  { company: "Affirm", token: "affirm" },
  { company: "Brex", token: "brex" },
  { company: "Block", token: "block" },
  { company: "Pinterest", token: "pinterest" },
  { company: "Reddit", token: "reddit" },
  { company: "Duolingo", token: "duolingo" },
  { company: "Scale AI", token: "scaleai" },
  { company: "Glean", token: "gleanwork" },
];

/** Public Lever job-site tokens. */
export const LEVER_BOARDS: NamedBoard[] = [
  { company: "Sentry", token: "sentry" },
  { company: "Postman", token: "postman" },
  { company: "Twilio", token: "twilio" },
  { company: "Palantir", token: "palantir" },
  { company: "Mixpanel", token: "mixpanel" },
  { company: "Spotify", token: "spotify" },
];

/** Public Ashby job-board tokens. */
export const ASHBY_BOARDS: NamedBoard[] = [
  { company: "OpenAI", token: "openai" },
  { company: "Linear", token: "linear" },
  { company: "Ramp", token: "ramp" },
  { company: "Mercury", token: "mercury" },
  { company: "Retool", token: "retool" },
  { company: "Perplexity", token: "perplexity" },
];

/** Extra Workday career sites verified against the public CXS jobs API. */
export const WORKDAY_BOARDS: WorkdayBoard[] = [
  {
    id: "wellsfargo",
    company: "Wells Fargo",
    host: "wf.wd1.myworkdayjobs.com",
    tenant: "wf",
    site: "WellsFargoJobs",
    careerUrl: "https://wf.wd1.myworkdayjobs.com/WellsFargoJobs",
    maxPages: 60,
  },
  {
    id: "spglobal",
    company: "S&P Global",
    host: "spgi.wd5.myworkdayjobs.com",
    tenant: "spgi",
    site: "SPGI_Careers",
    careerUrl: "https://spgi.wd5.myworkdayjobs.com/SPGI_Careers",
    maxPages: 20,
  },
  {
    id: "samsung",
    company: "Samsung",
    host: "sec.wd3.myworkdayjobs.com",
    tenant: "sec",
    site: "Samsung_Careers",
    careerUrl: "https://sec.wd3.myworkdayjobs.com/Samsung_Careers",
    maxPages: 35,
  },
  {
    id: "nvidia",
    company: "NVIDIA",
    host: "nvidia.wd5.myworkdayjobs.com",
    tenant: "nvidia",
    site: "NVIDIAExternalCareerSite",
    careerUrl: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite",
    maxPages: 20,
  },
  {
    id: "adobe",
    company: "Adobe",
    host: "adobe.wd5.myworkdayjobs.com",
    tenant: "adobe",
    site: "external_experienced",
    careerUrl: "https://adobe.wd5.myworkdayjobs.com/external_experienced",
    maxPages: 35,
  },
  {
    id: "salesforce",
    company: "Salesforce",
    host: "salesforce.wd12.myworkdayjobs.com",
    tenant: "salesforce",
    site: "External_Career_Site",
    careerUrl: "https://salesforce.wd12.myworkdayjobs.com/External_Career_Site",
    maxPages: 18,
  },
  {
    id: "intel",
    company: "Intel",
    host: "intel.wd1.myworkdayjobs.com",
    tenant: "intel",
    site: "External",
    careerUrl: "https://intel.wd1.myworkdayjobs.com/External",
    maxPages: 18,
  },
  {
    id: "cisco",
    company: "Cisco",
    host: "cisco.wd5.myworkdayjobs.com",
    tenant: "cisco",
    site: "Cisco_Careers",
    careerUrl: "https://cisco.wd5.myworkdayjobs.com/Cisco_Careers",
    maxPages: 18,
  },
  {
    id: "disney",
    company: "Disney",
    host: "disney.wd5.myworkdayjobs.com",
    tenant: "disney",
    site: "disneycareer",
    careerUrl: "https://disney.wd5.myworkdayjobs.com/disneycareer",
    maxPages: 18,
  },
  {
    id: "warnerbros",
    company: "Warner Bros. Discovery",
    host: "warnerbros.wd5.myworkdayjobs.com",
    tenant: "warnerbros",
    site: "global",
    careerUrl: "https://warnerbros.wd5.myworkdayjobs.com/global",
    maxPages: 18,
  },
];
