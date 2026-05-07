import React from "react";
import { useNavigate } from "react-router-dom";
import DashNav from "@/components/dashnav/dashnav";
import {
  Globe,
  Sparkles,
  Palette,
  ArrowRight,
  LayoutTemplate,
  Share2,
  TrendingUp,
  CheckCircle2,
  Zap,
  Star,
  Monitor,
} from "lucide-react";

const features = [
  {
    icon: <LayoutTemplate className="w-5 h-5" />,
    title: "Professional Templates",
    desc: "Choose from beautiful, recruiter-approved templates designed to make you stand out.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "AI-Powered Content",
    desc: "Let AI craft compelling project descriptions and summaries tailored to your skills.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Live Public URL",
    desc: "Share a single link with recruiters. Your portfolio is always online, always impressive.",
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: <Palette className="w-5 h-5" />,
    title: "Custom Branding",
    desc: "Pick your colors, fonts, and layout. Make it unmistakably yours.",
    color: "bg-pink-50 text-pink-600",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Analytics Dashboard",
    desc: "See who viewed your portfolio, how long they stayed, and what they clicked.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: <Share2 className="w-5 h-5" />,
    title: "One-Click Sharing",
    desc: "Share across LinkedIn, WhatsApp, or email in seconds — no login required for viewers.",
    color: "bg-orange-50 text-orange-600",
  },
];

const steps = [
  { step: "1", label: "Pay ₹10 or use credits", sub: "One-time unlock — no hidden charges" },
  { step: "2", label: "Fill in your details", sub: "Projects, skills, bio & more" },
  { step: "3", label: "Pick a template", sub: "Dozens of premium designs to choose from" },
  { step: "4", label: "Publish & share", sub: "Go live with a unique URL instantly" },
];

const highlights = [
  "No coding required",
  "Mobile-friendly by default",
  "Hosted & maintained for you",
  "Update anytime, instantly live",
];

export default function PortfolioLanding() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DashNav heading="Portfolio Builder" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10 sm:py-16">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full bg-violet-100 text-violet-700 mb-5">
            <Star className="w-3 h-3 fill-violet-500 text-violet-500" />
            Portfolio Builder
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-5">
            Your work deserves a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-orange-500">
              home on the web
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed mb-8">
            Build a stunning personal portfolio in minutes — no coding, no
            designer needed. Show recruiters and clients exactly what you're
            capable of, with a link they'll actually remember.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="portfolio-get-started-btn"
              onClick={() => navigate("/portfolio/list")}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm hover:from-violet-700 hover:to-violet-600 transition shadow-md shadow-violet-200 cursor-pointer"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="portfolio-view-demo-btn"
              onClick={() => navigate("/portfolio/list")}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
              View My Portfolios
            </button>
          </div>
        </div>

        {/* ── Hero visual strip ── */}
        <div className="relative mb-14 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-violet-500 to-orange-400 p-px shadow-xl shadow-violet-200">
          <div className="bg-white rounded-2xl px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-2">Why portfolio matters</p>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                73% of recruiters visit a candidate's portfolio before an interview
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                A resume tells them what you've done. A portfolio <em>shows</em> them. Stand out from hundreds of applicants with a living proof of your work.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              {highlights.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="text-sm text-gray-700">{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature grid ── */}
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
          Everything you need
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${f.color}`}>
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{f.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── How it works ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
            How it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-violet-600">{s.step}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA banner ── */}
        <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-orange-500 p-px shadow-xl shadow-violet-200">
          <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-orange-500 px-8 py-10 text-center">
            <Zap className="w-8 h-8 text-white/80 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Ready to build your portfolio?
            </h2>
            <p className="text-sm text-white/80 mb-6 max-w-md mx-auto">
              Unlock your portfolio for just <strong className="text-white">₹10</strong> — or use your Bowizzy credits. No subscription, no recurring fee.
            </p>
            <button
              id="portfolio-cta-bottom-btn"
              onClick={() => navigate("/portfolio/list")}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-violet-700 font-bold text-sm hover:bg-gray-50 transition cursor-pointer shadow-lg"
            >
              Create My Portfolio
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
