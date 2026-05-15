import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import DevConsoleFilter from "@/components/DevConsoleFilter";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aviora — Interview practice & AI learning companions",
    template: "%s · Aviora",
  },
  description:
    "Practice realistic mock interviews with AI voice sessions, resume-aware questions, and feedback—plus voice companions for structured learning.",
  keywords: [
    "mock interview",
    "interview practice",
    "AI interview",
    "job interview prep",
    "voice tutor",
  ],
  applicationName: "Aviora",
  icons: {
    icon: [
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/images/favicon-32x32.png",
    apple: "/images/favicon-32x32.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Aviora",
    title: "Aviora — Interview practice & AI learning companions",
    description:
      "Practice interviews with AI voice sessions tailored to your resume and target company.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aviora — Interview practice & AI learning companions",
    description:
      "Practice interviews with AI voice sessions tailored to your resume and target company.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** Enables env(safe-area-inset-*) on notched phones (e.g. tall portrait / landscape). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeBootstrap = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark");else if(t==="light")document.documentElement.classList.remove("dark");}catch(e){}})();`;

  const devConsoleFilter =
    process.env.NODE_ENV === "development"
      ? `(function(){var f=["Clerk has been loaded with development keys","[React Flow]: It looks like you've created a new nodeTypes or edgeTypes","Meeting ended due to ejection","Meeting has ended"];var w=console.warn;console.warn=function(){var t=Array.prototype.map.call(arguments,String).join(" ");if(f.some(function(s){return t.indexOf(s)!==-1}))return;w.apply(console,arguments);};var oe=window.onerror;window.onerror=function(m,s,l,c,e){if(f.some(function(x){return String(m||"").indexOf(x)!==-1||(e&&e.message&&e.message.indexOf(x)!==-1);}))return true;if(oe)return oe.apply(this,arguments);return false;};})();`
      : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Aviora",
    url: siteUrl,
    description:
      "Interview practice and AI-powered voice learning companions for job seekers and learners.",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bricolage.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
        {devConsoleFilter ? (
          <Script id="dev-console-filter" strategy="beforeInteractive">
            {devConsoleFilter}
          </Script>
        ) : null}
        <ClerkProvider appearance={{variables:{colorPrimary: '#fe5933'}}}>
        <DevConsoleFilter />
        <Navbar />
        {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
