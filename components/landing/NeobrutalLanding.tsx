"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import AppMindMap from "@/components/landing/AppMindMap";

const ChartAreaAxes = dynamic(
  () =>
    import("@/components/landing/PerformanceCharts").then((m) => m.ChartAreaAxes),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[260px] w-full rounded-xl border-[3px] border-black bg-neutral-100 shadow-[6px_6px_0_0_#000]"
        aria-hidden
      />
    ),
  },
);

const ChartPieDonutText = dynamic(
  () =>
    import("@/components/landing/PerformanceCharts").then(
      (m) => m.ChartPieDonutText,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[280px] w-full rounded-xl border-[3px] border-black bg-neutral-100 shadow-[6px_6px_0_0_#000]"
        aria-hidden
      />
    ),
  },
);
import { LightRays } from "@/components/ui/light-rays";
import { MorphingText } from "@/components/ui/morphing-text";
import { ComicText } from "@/components/ui/comic-text";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { SparklesText } from "@/components/ui/sparkles-text";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const neoBorder = "border-[3px] border-black";
const neoShadow = "shadow-[6px_6px_0_0_#000]";
const neoShadowSm = "shadow-[4px_4px_0_0_#000]";

const testimonials = [
  {
    quote:
      "Sessions feel structured and fast. Our team adopted Aviora without a long onboarding curve.",
    name: "Alex R.",
    role: "Founder, NovaLab",
  },
  {
    quote:
      "The voice-first flow keeps students engaged. We track progress in one place now.",
    name: "Priya S.",
    role: "Head of Learning, Northline",
  },
  {
    quote:
      "Finally a teaching companion that matches how we actually run cohorts.",
    name: "Jordan M.",
    role: "Curriculum Lead",
  },
  {
    quote:
      "Neat integration with our weekly rhythm—less prep, more live practice.",
    name: "Casey L.",
    role: "Engineering Educator",
  },
  {
    quote:
      "Parents see clearer outcomes; instructors get time back every week.",
    name: "Sam T.",
    role: "Program Director",
  },
  {
    quote:
      "We stress-tested it across subjects; consistency stayed high across groups.",
    name: "Riley D.",
    role: "Ops Manager",
  },
] as const;

const testimonialStackBgs = ["bg-white", "bg-[#fef9c3]", "bg-[#fce7f3]"] as const;

const faq = [
  {
    q: "How does Aviora handle social media advertising integration?",
    a: "We connect to your workflow via secure APIs and structured prompts. You keep control; Aviora helps you plan, draft, and review faster.",
  },
  {
    q: "Can I manage multiple social media accounts from a single dashboard?",
    a: "Yes. Aviora is designed to handle multiple brands/accounts while keeping performance insights and action items organized per workspace.",
  },
  {
    q: "Is there a mobile app available?",
    a: "A mobile-friendly experience is supported today; a dedicated mobile app can be added as the product roadmap evolves.",
  },
  {
    q: "How does Aviora ensure data security and privacy?",
    a: "We minimize stored data, use secure authentication, and follow least-privilege access patterns for integrations.",
  },
] as const;

export default function NeobrutalLanding() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const testimonialCount = testimonials.length;
  const stackLayers = [2, 1, 0] as const; // back → front draw order
  const testimonialFrontRef = useRef<HTMLElement | null>(null);

  const goPrevTestimonial = () =>
    setTestimonialIndex((i) => (i - 1 + testimonialCount) % testimonialCount);
  const goNextTestimonial = () =>
    setTestimonialIndex((i) => (i + 1) % testimonialCount);

  const activeTestimonials = useMemo(() => testimonials, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const liftCleanups: (() => void)[] = [];

    const ctx = gsap.context(() => {
      if (!reduced) {
        const intro = root.querySelectorAll(".landing-hero-intro > *");
        if (intro.length) {
          gsap.from(intro, {
            opacity: 0,
            y: 32,
            duration: 0.65,
            stagger: 0.11,
            ease: "power3.out",
            delay: 0.05,
          });
        }

      }

      const revealEls = root.querySelectorAll<HTMLElement>("[data-gsap-reveal]");
      revealEls.forEach((el) => {
        if (reduced) return;
        gsap.set(el, { opacity: 0, y: 26 });
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 86%",
            toggleActions: "play none none none",
          },
        });
      });

      root.querySelectorAll<HTMLElement>("[data-neo-lift]").forEach((el) => {
        const enter = () => {
          gsap.to(el, {
            y: -10,
            scale: 1.02,
            rotation: -0.75,
            duration: 0.38,
            ease: "power2.out",
          });
        };
        const leave = () => {
          gsap.to(el, {
            y: 0,
            scale: 1,
            rotation: 0,
            duration: 0.45,
            ease: "power2.out",
          });
        };
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
        liftCleanups.push(() => {
          el.removeEventListener("mouseenter", enter);
          el.removeEventListener("mouseleave", leave);
        });
      });

      const hero = heroSectionRef.current;
      const title = root.querySelector<HTMLElement>(".landing-hero-title");
      if (hero && title && !reduced) {
        const moveX = gsap.quickTo(title, "x", {
          duration: 0.55,
          ease: "power3.out",
        });
        const moveY = gsap.quickTo(title, "y", {
          duration: 0.55,
          ease: "power3.out",
        });
        const onMove = (e: MouseEvent) => {
          const r = hero.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          moveX(px * 14);
          moveY(py * 10);
        };
        const onLeave = () => {
          moveX(0);
          moveY(0);
        };
        hero.addEventListener("mousemove", onMove);
        hero.addEventListener("mouseleave", onLeave);
        liftCleanups.push(() => {
          hero.removeEventListener("mousemove", onMove);
          hero.removeEventListener("mouseleave", onLeave);
        });
      }
    }, root);

    return () => {
      liftCleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    const el = testimonialFrontRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { scale: 0.96, opacity: 0.85 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.6)" }
    );
  }, [testimonialIndex]);

  return (
    <div
      ref={rootRef}
      className="relative isolate w-full overflow-x-hidden bg-transparent text-black tracking-wide"
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <div className="relative h-full min-h-[100dvh] w-full">
          <LightRays
            className="rounded-none"
            count={10}
            color="rgba(165, 210, 255, 0.42)"
            blur={44}
            speed={14}
            length="120vh"
          />
        </div>
      </div>

      <div className="relative z-10">
      {/* Hero */}
      <section
        ref={heroSectionRef}
        className="relative flex min-h-[100dvh] flex-col overflow-hidden border-b-[3px] border-black bg-transparent"
      >
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-16 pt-8">
          <div className="landing-hero-intro w-full max-w-5xl text-center">
            <div className="landing-hero-title will-change-transform">
              <MorphingText
                texts={[
                  "WELCOME TO AVIORA",
                  "PODCAST",
                  "INTERVIEW MODE",
                  "LEARNING MODE",
                ]}
                className="mx-auto h-auto min-h-[5rem] w-full max-w-5xl px-2 text-center font-extrabold tracking-tight text-balance text-3xl leading-none filter-[url(#threshold)_blur(0.6px)] sm:text-4xl md:h-auto md:min-h-[7rem] md:text-5xl lg:min-h-[8.5rem] lg:text-6xl xl:text-7xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Analytics and Reporting */}
      <section
        id="advanced"
        className="border-b-[3px] border-black bg-transparent px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <p
            data-gsap-reveal
            className={`mx-auto mb-6 inline-block ${neoBorder} ${neoShadowSm} bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest`}
          >
            Advanced Analytics and Reporting
          </p>
          <h2
            data-gsap-reveal
            className="mx-auto max-w-3xl text-center text-3xl font-extrabold leading-tight md:text-5xl"
          >
            Track performance. Optimize in real time. Report with confidence.
          </h2>
          <p
            data-gsap-reveal
            className="mx-auto mt-8 max-w-2xl text-center text-base font-semibold text-black/80 md:text-lg"
          >
            A clean dashboard that answers the only questions that matter: what is
            working, why it is working, and what to do next.
          </p>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Target Audiences",
                body: "Understand who engages, when they engage, and which creatives actually convert.",
                bg: "bg-[#fde047]",
              },
              {
                title: "Optimized Performance",
                body: "Spot bottlenecks instantly and apply improvements that lift reach and retention.",
                bg: "bg-[#a5f3fc]",
              },
            ].map((card) => (
              <article
                key={card.title}
                data-gsap-reveal
                data-neo-lift
                className={`flex flex-col gap-4 p-6 text-left ${neoBorder} ${neoShadow} ${card.bg}`}
              >
                <h3 className="text-2xl font-extrabold">{card.title}</h3>
                <p className="text-sm font-semibold leading-relaxed text-black/85">
                  {card.body}
                </p>
                <div className="mt-2 inline-flex w-fit items-center gap-2 border-[3px] border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-widest">
                  Live insights
                  <ArrowRight className="size-4" aria-hidden />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-2">
            <div className="min-w-0" data-gsap-reveal data-neo-lift>
              <ChartAreaAxes />
            </div>
            <div className="min-w-0" data-gsap-reveal data-neo-lift>
              <ChartPieDonutText />
            </div>
          </div>
        </div>
      </section>

      {/* ChatGPT / Deepseek / Gemini */}
      <section
        id="models"
        className="border-b-[3px] border-black bg-transparent px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center" data-gsap-reveal>
            <p
              className={`mx-auto mb-4 inline-block ${neoBorder} ${neoShadowSm} bg-white px-5 py-2 text-xs font-bold uppercase`}
            >
              AI Models
            </p>
            <h2 className="text-3xl font-extrabold md:text-4xl">
              ChatGPT, Deepseek, and Gemini—aligned to your workflow.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-semibold text-black/75">
              Pick the right brain for the right job: ideation, optimization, and
              deep analysis.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "ChatGPT",
                body: "Fast content drafts, hooks, and iterations—without losing brand voice.",
                bg: "bg-[#d9f99d]",
              },
              {
                title: "Deepseek",
                body: "Deep research and structured analysis for campaigns and competitors.",
                bg: "bg-[#fef08e]",
              },
              {
                title: "Gemini",
                body: "Multimodal-friendly workflows that connect visuals, text, and context.",
                bg: "bg-[#a5b4fc]",
              },
            ].map((m) => (
              <article
                key={m.title}
                data-gsap-reveal
                data-neo-lift
                className={`flex flex-col gap-4 p-6 ${neoBorder} ${neoShadow} ${m.bg}`}
              >
                <h3 className="text-2xl font-extrabold uppercase tracking-wide">
                  {m.title}
                </h3>
                <p className="text-sm font-semibold text-black/85">{m.body}</p>
                <div className="mt-auto inline-flex w-fit items-center gap-2 border-[3px] border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-widest">
                  Plug & play
                  <ArrowRight className="size-4" aria-hidden />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & AIM */}
      <section
        id="vision"
        className="border-b-[3px] border-black bg-transparent px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center" data-gsap-reveal>
            <p
              className={`mx-auto mb-4 inline-block ${neoBorder} ${neoShadowSm} bg-white px-5 py-2 text-xs font-bold uppercase`}
            >
              Vision & AIM
            </p>
            <h2 className="text-3xl font-extrabold md:text-4xl">
              A bold vision. A practical aim.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-semibold text-black/75">
              Built for teams that want creative speed without sacrificing clarity.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Vision",
                body: "Make every creator feel supported by an intelligent system that scales with ambition.",
                bg: "bg-white",
              },
              {
                title: "AIM",
                body: "Deliver actionable insights and recommendations in real-time—so decisions are always one step ahead.",
                bg: "bg-[#a5f3fc]",
              },
            ].map((c) => (
              <article
                key={c.title}
                data-gsap-reveal
                data-neo-lift
                className={`flex flex-col gap-4 p-7 ${neoBorder} ${neoShadow} ${c.bg}`}
              >
                <h3 className="text-2xl font-extrabold uppercase tracking-wide">
                  {c.title}
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-black/85">
                  {c.body}
                </p>
                <div className="mt-auto inline-flex w-fit items-center gap-2 border-[3px] border-black bg-[#fde047] px-3 py-2 text-xs font-black uppercase tracking-widest">
                  Built for action
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* App mindmap */}
      <section
        id="mindmap"
        className="border-b-[3px] border-black bg-transparent px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center" data-gsap-reveal>
            <p
              className={`mx-auto mb-4 inline-block ${neoBorder} ${neoShadowSm} bg-white px-5 py-2 text-xs font-bold uppercase`}
            >
              Application Flow
            </p>
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Mindmap of how Aviora connects.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-semibold text-black/75">
              Pan, zoom, and drag nodes to explore the journey from landing →
              sessions → subtitles → history.
            </p>
          </div>

          <div data-gsap-reveal data-neo-lift>
            <AppMindMap />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        id="stats"
        className="border-b-[3px] border-black bg-transparent px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center" data-gsap-reveal>
            <p
              className={`mx-auto mb-4 inline-block ${neoBorder} ${neoShadowSm} bg-white px-5 py-2 text-xs font-bold uppercase`}
            >
              Outcomes
            </p>
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Current users. Increased performance. 24/7 assistance.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                k: "1000+",
                t: "Current Users",
                d: "Teams and creators using Aviora to plan and publish consistently.",
                bg: "bg-white",
              },
              {
                k: "8×",
                t: "Increase Performance",
                d: "Iterate faster with insights that highlight what works in minutes.",
                bg: "bg-[#fef08e]",
              },
              {
                k: "24/7",
                t: "Personal Assistance",
                d: "Always-on support for content, analytics, and next-step recommendations.",
                bg: "bg-[#fda4af]",
              },
            ].map((s) => (
              <article
                key={s.t}
                data-gsap-reveal
                data-neo-lift
                className={`flex flex-col gap-3 p-7 ${neoBorder} ${neoShadow} ${s.bg}`}
              >
                <div className="text-5xl font-black tracking-tight">{s.k}</div>
                <div className="text-sm font-black uppercase tracking-widest">
                  {s.t}
                </div>
                <p className="text-sm font-semibold text-black/80">{s.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="border-b-[3px] border-black bg-transparent px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p
              data-gsap-reveal
              className={`mx-auto mb-4 inline-block ${neoBorder} ${neoShadowSm} bg-white px-5 py-2 text-xs font-bold uppercase`}
            >
              Testimonials
            </p>
            <h2
              data-gsap-reveal
              className="text-3xl font-extrabold md:text-4xl"
            >
              Built for teams. Backed by real outcomes.
            </h2>
          </div>

          <div
            data-gsap-reveal
            className="mx-auto flex max-w-3xl flex-col items-center gap-6 md:flex-row md:items-stretch md:gap-4"
          >
            <button
              type="button"
              onClick={goPrevTestimonial}
              aria-label="Previous testimonial"
              data-neo-lift
              className={`flex size-12 shrink-0 items-center justify-center self-center md:self-auto ${neoBorder} ${neoShadowSm} bg-white text-black md:mt-24`}
            >
              <span className="text-2xl font-black" aria-hidden>
                ‹
              </span>
            </button>

            <div
              data-neo-lift
              className="relative mx-auto h-[min(72vw,340px)] w-full max-w-lg md:h-[360px]"
              aria-roledescription="carousel"
            >
              <p className="sr-only" aria-live="polite">
                {activeTestimonials[testimonialIndex].name}:{" "}
                {activeTestimonials[testimonialIndex].quote}
              </p>

              {stackLayers.map((depth) => {
                const cardIndex = (testimonialIndex + depth) % testimonialCount;
                const t = activeTestimonials[cardIndex];
                const isFront = depth === 0;
                const tx = depth * 14;
                const ty = depth * 12;
                const scale = 1 - depth * 0.035;
                const z = 30 - depth;

                return (
                  <figure
                    ref={isFront ? testimonialFrontRef : undefined}
                    key={`stack-slot-${depth}`}
                    className={`absolute left-0 right-0 top-0 flex min-h-[260px] flex-col gap-4 p-6 md:min-h-[300px] ${neoBorder} ${neoShadow} ${
                      testimonialStackBgs[depth % testimonialStackBgs.length]
                    } ${isFront ? "cursor-default" : "pointer-events-none"}`}
                    style={{
                      zIndex: z,
                      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                      opacity: isFront ? 1 : 0.92 - depth * 0.06,
                      transition:
                        "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease",
                    }}
                    aria-hidden={!isFront}
                  >
                    <blockquote className="text-sm font-semibold leading-relaxed md:text-base">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-auto border-t-[3px] border-black pt-4 text-xs font-extrabold uppercase md:text-sm">
                      {t.name}
                      <span className="mt-1 block font-bold text-black/70">
                        {t.role}
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>

            <button
              type="button"
              onClick={goNextTestimonial}
              aria-label="Next testimonial"
              data-neo-lift
              className={`flex size-12 shrink-0 items-center justify-center self-center md:self-auto ${neoBorder} ${neoShadowSm} bg-white text-black md:mt-24`}
            >
              <span className="text-2xl font-black" aria-hidden>
                ›
              </span>
            </button>
          </div>

          <p className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-black/60">
            {testimonialIndex + 1} / {testimonialCount}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="border-b-[3px] border-black bg-transparent px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center" data-gsap-reveal>
            <p
              className={`mx-auto mb-4 inline-block ${neoBorder} ${neoShadowSm} bg-[#fde047] px-5 py-2 text-xs font-bold uppercase`}
            >
              Frequently Asked Questions
            </p>
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Quick answers, no fluff.
            </h2>
          </div>

          <div className="grid gap-4">
            {faq.map((item) => (
              <details
                key={item.q}
                data-gsap-reveal
                className={`${neoBorder} ${neoShadowSm} bg-[#fef9c3] p-5`}
              >
                <summary className="cursor-pointer list-none text-base font-extrabold">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-black/80">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Moto + nested sign-in card */}
      <section
        id="moto"
        className="relative overflow-hidden bg-transparent px-4 py-24 md:py-32"
      >
        <div
          data-gsap-reveal
          className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 text-center md:gap-12"
        >
          <SparklesText className="text-balance text-4xl uppercase tracking-tight text-black sm:text-5xl md:text-6xl lg:text-7xl">
            SIGNUP NOW
          </SparklesText>
          <ComicText fontSize={3.5} className="max-w-full px-2">
            TO EXPLORE
          </ComicText>
          <InteractiveHoverButton
            type="button"
            className={`rounded-none border-[3px] border-black px-8 py-3 text-base font-black uppercase tracking-wide ${neoShadowSm}`}
            onClick={() => router.push("/sign-up")}
          >
            Sign UP Now
          </InteractiveHoverButton>
        </div>
      </section>
      </div>
    </div>
  );
}

