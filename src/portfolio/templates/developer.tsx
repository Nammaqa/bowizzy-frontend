import React, { useEffect, useRef, useState } from "react";
import {
  Github, Linkedin, Twitter, ExternalLink, Briefcase,
  Code2, Mail, Globe, Rocket, ChevronRight, ArrowUpRight, Sparkles, Download
} from "lucide-react";

export interface PortfolioData {
  portfolioName: string;
  portfolioDescription: string;
  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  customUrl: string;
  avatarUrl?: string; // Optional image URL — drives layout switch
  email?: string;
  tagline?: string;
  projects: Array<{ title: string; description: string; link: string; tech: string }>;
  experiences: Array<{ role: string; company: string; duration: string; details: string }>;
  skills: string[];
}

// ── Utility ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  if (!name) return "DEV";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const steps = 40;
    const interval = duration / steps;
    const step = target / steps;
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return count;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge() {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
      style={{
        background: "rgba(99,102,241,0.1)",
        borderColor: "rgba(99,102,241,0.3)",
        color: "#a5b4fc",
      }}
    >
      <span className="relative flex h-2 w-2">
        <span className="ping-anim absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
      </span>
      Available for new opportunities
    </div>
  );
}

function SocialLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="social-link w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
      style={{
        background: "rgba(99,102,241,0.08)",
        border: "0.5px solid rgba(99,102,241,0.25)",
        color: "#94a3b8",
      }}
    >
      <Icon className="w-4 h-4" />
    </a>
  );
}

function StatCard({
  value, label, suffix = "", delay = 0,
}: {
  value: number; label: string; suffix?: string; delay?: number;
}) {
  const count = useCountUp(value, 1200, delay);
  return (
    <div
      className="stat-card flex-1 py-6 text-center"
      style={{ borderRight: "0.5px solid rgba(99,102,241,0.15)" }}
    >
      <div className="text-2xl sm:text-3xl font-semibold text-white" style={{ letterSpacing: "-1px" }}>
        {count}{suffix}
      </div>
      <div className="text-xs mt-1 tracking-widest uppercase" style={{ color: "#475569" }}>{label}</div>
    </div>
  );
}

function SkillChip({ skill }: { skill: string }) {
  return (
    <div className="skill-chip px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-default flex items-center gap-2"
      style={{
        background: "rgba(15,20,40,0.7)",
        border: "0.5px solid rgba(99,102,241,0.2)",
        color: "#94a3b8",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#818cf8" }} />
      {skill}
    </div>
  );
}

function ExpCard({ exp, index }: { exp: PortfolioData["experiences"][0]; index: number }) {
  const icons = [<Briefcase />, <Rocket />, <Code2 />, <Globe />];
  const Icon = icons[index % icons.length];
  return (
    <div
      className="exp-card py-6 flex gap-4 sm:gap-5 transition-all duration-200"
      style={{ borderBottom: "0.5px solid rgba(99,102,241,0.1)" }}
    >
      <div
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: "rgba(99,102,241,0.12)",
          border: "0.5px solid rgba(99,102,241,0.25)",
          color: "#818cf8",
        }}
      >
        {React.cloneElement(Icon as React.ReactElement, { className: "w-4 h-4" } as any)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{exp.role || "Role"}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: "#818cf8" }}>{exp.company || "Company"}</p>
          </div>
          {exp.duration && (
            <span
              className="text-xs whitespace-nowrap px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ color: "#475569", background: "rgba(71,85,105,0.2)", border: "0.5px solid rgba(71,85,105,0.3)" }}
            >
              {exp.duration}
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed mt-2" style={{ color: "#64748b" }}>{exp.details}</p>
      </div>
    </div>
  );
}

function ProjectCard({ proj, index }: { proj: PortfolioData["projects"][0]; index: number }) {
  const projIcons = [<Rocket />, <Code2 />, <Globe />, <Briefcase />];
  const Icon = projIcons[index % projIcons.length];
  const techs = proj.tech ? proj.tech.split(",").map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div
      className="project-card rounded-2xl p-5 sm:p-6 flex flex-col transition-all duration-250 cursor-default relative overflow-hidden"
      style={{
        background: "rgba(15,20,40,0.7)",
        border: "0.5px solid rgba(99,102,241,0.2)",
      }}
    >
      <div className="project-accent absolute top-0 left-0 right-0 h-0.5 transition-all duration-300"
        style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", transform: "scaleX(0)", transformOrigin: "left" }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
        >
          {React.cloneElement(Icon as React.ReactElement, { className: "w-4 h-4" } as any)}
        </div>
        {proj.link && (
          <a href={proj.link} target="_blank" rel="noreferrer"
            className="transition-colors duration-200" style={{ color: "#475569" }}>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        )}
      </div>
      <h3 className="text-sm font-semibold mb-2 transition-colors duration-200" style={{ color: "#e2e8f0" }}>
        {proj.title || "Project Title"}
      </h3>
      <p className="text-xs leading-relaxed flex-1 mb-4" style={{ color: "#64748b" }}>
        {proj.description || "Project description goes here..."}
      </p>
      {techs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {techs.map((t, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-md font-mono"
              style={{ color: "#818cf8", background: "rgba(99,102,241,0.1)", border: "0.5px solid rgba(99,102,241,0.2)" }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hero: WITH image ───────────────────────────────────────────────────────

function HeroWithImage({ data, scrollTo }: { data: PortfolioData; scrollTo: (id: string) => void }) {
  return (
    <div className="hero-with-image px-5 sm:px-8 md:px-10 pt-12 sm:pt-16 pb-12 max-w-4xl mx-auto">
      {/* Two-column layout: text left, image right */}
      <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12">
        {/* Left: text content */}
        <div className="flex-1 text-center md:text-left">
          <div className="anim-1 mb-5 flex justify-center md:justify-start">
            <StatusBadge />
          </div>
          <h1 className="anim-2 text-4xl sm:text-5xl font-semibold text-white mb-4"
            style={{ letterSpacing: "-1.5px", lineHeight: 1.1 }}>
            {data.portfolioName || "Anonymous Developer"}
            <span className="cursor-blink inline-block w-0.5 h-9 ml-1 rounded align-middle" style={{ background: "#818cf8" }} />
          </h1>
          {data.tagline && (
            <p className="anim-2 text-sm font-medium mb-3" style={{ color: "#818cf8" }}>{data.tagline}</p>
          )}
          <p className="anim-3 text-sm leading-relaxed mb-8" style={{ color: "#94a3b8" }}>
            {data.portfolioDescription || "Passionate about building scalable software and creating elegant solutions to complex problems."}
          </p>
          <div className="anim-3 flex flex-wrap gap-3 mb-8 justify-center md:justify-start">
            <button onClick={() => scrollTo("projects")}
              className="cta-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200">
              <Download className="w-4 h-4" /> Download CV
            </button>
            <button onClick={() => scrollTo("contact")}
              className="cta-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ background: "transparent", border: "0.5px solid rgba(148,163,184,0.3)", color: "#94a3b8" }}>
              <Mail className="w-4 h-4" /> Get in touch
            </button>
          </div>
          <div className="anim-4 flex gap-3 justify-center md:justify-start">
            <SocialLink href={data.githubUrl} icon={Github} label="GitHub" />
            <SocialLink href={data.linkedinUrl} icon={Linkedin} label="LinkedIn" />
            <SocialLink href={data.twitterUrl} icon={Twitter} label="Twitter" />
            <SocialLink href={data.customUrl} icon={Globe} label="Website" />
          </div>
        </div>

        {/* Right: image with decorative ring */}
        <div className="anim-2 flex-shrink-0 flex justify-center md:justify-end">
          <div className="relative">
            {/* Outer decorative ring */}
            <div className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #4f46e5, #7c3aed, #4f46e5)",
                padding: "3px",
                borderRadius: "9999px",
                animation: "spin-slow 8s linear infinite",
              }} />
            {/* Glow */}
            <div className="absolute inset-0 rounded-full"
              style={{
                boxShadow: "0 0 60px 15px rgba(99,102,241,0.25)",
                borderRadius: "9999px",
              }} />
            {/* Avatar image */}
            <div className="relative rounded-full overflow-hidden"
              style={{
                width: "clamp(160px, 20vw, 220px)",
                height: "clamp(160px, 20vw, 220px)",
                border: "3px solid #0a0f1e",
                animation: "float 5s ease-in-out infinite",
              }}>
              <img
                src={data.avatarUrl}
                alt={data.portfolioName}
                className="w-full h-full object-cover"
                style={{ display: "block" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hero: WITHOUT image (centered editorial layout) ────────────────────────

function HeroWithoutImage({ data, scrollTo }: { data: PortfolioData; scrollTo: (id: string) => void }) {
  return (
    <div className="hero-no-image px-5 sm:px-8 md:px-10 pt-16 sm:pt-20 pb-14 max-w-4xl mx-auto text-center">
      {/* Initials avatar */}
      <div className="anim-1 flex justify-center mb-6">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              border: "3px solid rgba(99,102,241,0.35)",
              animation: "float 4s ease-in-out infinite",
            }}
          >
            {data.portfolioName ? data.portfolioName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "DEV"}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 flex items-center justify-center"
            style={{ border: "2px solid #0a0f1e" }}>
            <span className="w-2 h-2 rounded-full bg-green-300 ping-anim" />
          </div>
        </div>
      </div>

      <div className="anim-1 mb-5 flex justify-center">
        <StatusBadge />
      </div>

      {/* Name — large editorial */}
      <h1 className="anim-2 font-semibold text-white mb-3"
        style={{ fontSize: "clamp(2.4rem, 7vw, 4.5rem)", letterSpacing: "-2px", lineHeight: 1.05 }}>
        {data.portfolioName || "Anonymous Developer"}
        <span className="cursor-blink inline-block w-0.5 h-10 ml-1 rounded align-middle" style={{ background: "#818cf8" }} />
      </h1>

      {data.tagline && (
        <p className="anim-2 text-base font-medium mb-4" style={{ color: "#818cf8" }}>{data.tagline}</p>
      )}

      <p className="anim-3 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-10" style={{ color: "#94a3b8" }}>
        {data.portfolioDescription || "Passionate about building scalable software and creating elegant solutions to complex problems."}
      </p>

      {/* Skill pills row */}
      {/* {data.skills.length > 0 && (
        <div className="anim-3 flex flex-wrap justify-center gap-2 mb-10">
          {data.skills.slice(0, 5).map((s, i) => (
            <span key={i} className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: "rgba(99,102,241,0.1)", border: "0.5px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}>
              {s}
            </span>
          ))}
          {data.skills.length > 5 && (
            <span className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: "rgba(99,102,241,0.05)", border: "0.5px solid rgba(99,102,241,0.2)", color: "#64748b" }}>
              +{data.skills.length - 5} more
            </span>
          )}
        </div>
      )} */}

      <div className="anim-3 flex flex-wrap gap-3 mb-8 justify-center">
        <button onClick={() => scrollTo("projects")}
          className="cta-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200">
          <Download className="w-4 h-4" /> Download CV
        </button>
        <button onClick={() => scrollTo("contact")}
          className="cta-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{ background: "transparent", border: "0.5px solid rgba(148,163,184,0.3)", color: "#94a3b8" }}>
          <Mail className="w-4 h-4" /> Get in touch
        </button>
      </div>

      <div className="anim-4 flex gap-3 justify-center">
        <SocialLink href={data.githubUrl} icon={Github} label="GitHub" />
        <SocialLink href={data.linkedinUrl} icon={Linkedin} label="LinkedIn" />
        <SocialLink href={data.twitterUrl} icon={Twitter} label="Twitter" />
        <SocialLink href={data.customUrl} icon={Globe} label="Website" />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function DeveloperPortfolio({ data }: { data: PortfolioData }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasImage = Boolean(data.avatarUrl);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let scrollContainer: HTMLElement | Window = window;
    let parent = el.parentElement;
    while (parent) {
      const overflow = window.getComputedStyle(parent).overflowY;
      if (overflow === "auto" || overflow === "scroll") { scrollContainer = parent; break; }
      parent = parent.parentElement;
    }
    const handleScroll = () => {
      const scrollTop = scrollContainer === window ? window.scrollY : (scrollContainer as HTMLElement).scrollTop;
      setNavScrolled(scrollTop > 20);
    };
    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      containerRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const navItems = [
    { id: "skills", label: "Skills" },
    { id: "exp", label: "Experience" },
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div
      ref={containerRef}
      className="w-full relative min-h-screen"
      style={{ background: "#0a0f1e", color: "#c8d3f5", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; } 50% { opacity: 0; }
        }
        @keyframes ping {
          75%,100% { transform: scale(2); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ping-anim { animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }
        .anim-1 { animation: fadeUp 0.65s 0.05s ease both; }
        .anim-2 { animation: fadeUp 0.65s 0.15s ease both; }
        .anim-3 { animation: fadeUp 0.65s 0.25s ease both; }
        .anim-4 { animation: fadeUp 0.65s 0.35s ease both; }
        .cursor-blink { animation: blink 1s step-end infinite; }
        .mobile-menu { animation: slideDown 0.2s ease both; }

        .social-link:hover { color: #818cf8 !important; border-color: #818cf8 !important; transform: translateY(-3px); }
        .cta-primary { background: #4f46e5; border: none; cursor: pointer; font-family: inherit; }
        .cta-primary:hover { background: #4338ca; transform: translateY(-2px); }
        .cta-secondary:hover { color: #fff !important; border-color: rgba(148,163,184,0.6) !important; transform: translateY(-2px); }

        .skill-chip:hover {
          background: rgba(99,102,241,0.12) !important;
          border-color: #818cf8 !important;
          color: #c7d2fe !important;
          transform: translateY(-2px);
        }
        .exp-card:hover { padding-left: 10px; }
        .project-card:hover {
          border-color: rgba(99,102,241,0.5) !important;
          transform: translateY(-4px);
        }
        .project-card:hover .project-accent { transform: scaleX(1) !important; }

        /* Responsive grid */
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }
        @media (max-width: 480px) {
          .projects-grid { grid-template-columns: 1fr; }
          .stat-card { padding: 1rem 0.25rem; }
        }
        @media (max-width: 640px) {
          .stat-label { display: none; }
        }
      `}</style>

      {/* NAV */}
      <nav
        className="flex items-center justify-between px-5 sm:px-8 md:px-10 py-4 sticky top-0 z-50 transition-all duration-300"
        style={{
          background: navScrolled ? "rgba(10,15,30,0.92)" : "transparent",
          backdropFilter: navScrolled ? "blur(12px)" : "none",
          borderBottom: navScrolled ? "0.5px solid rgba(99,102,241,0.2)" : "0.5px solid transparent",
        }}
      >
        {/* Logo */}
        <div className="text-base font-semibold text-white tracking-tight flex-shrink-0">
          {data.portfolioName}
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navItems.map(({ id, label }) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="nav-btn text-xs tracking-wide transition-colors duration-200 capitalize"
              style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#818cf8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#64748b")}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Hire me */}
          <button onClick={() => scrollTo("contact")}
            className="hidden sm:block text-xs px-4 py-2 rounded-lg text-white transition-all duration-200 hover:scale-105"
            style={{ background: "#4f46e5", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#4338ca")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#4f46e5")}>
            Hire me
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg transition-colors"
            style={{ background: "rgba(99,102,241,0.08)", border: "0.5px solid rgba(99,102,241,0.2)" }}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="block w-4 h-0.5 transition-all duration-200"
                style={{
                  background: "#818cf8",
                  transform: mobileMenuOpen
                    ? i === 0 ? "rotate(45deg) translate(4px, 4px)"
                      : i === 1 ? "opacity(0) scaleX(0)"
                        : "rotate(-45deg) translate(4px, -4px)"
                    : "none",
                  opacity: mobileMenuOpen && i === 1 ? 0 : 1,
                }} />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu md:hidden fixed top-[57px] left-0 right-0 z-40 py-4 px-5"
          style={{ background: "rgba(10,15,30,0.97)", backdropFilter: "blur(16px)", borderBottom: "0.5px solid rgba(99,102,241,0.2)" }}
        >
          {navItems.map(({ id, label }) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="block w-full text-left py-3 text-sm border-b transition-colors duration-200"
              style={{ color: "#94a3b8", background: "none", border: "none", borderBottom: "0.5px solid rgba(99,102,241,0.1)", cursor: "pointer", fontFamily: "inherit" }}>
              {label}
            </button>
          ))}
          <button onClick={() => scrollTo("contact")}
            className="mt-4 w-full text-sm py-2.5 rounded-xl text-white font-medium"
            style={{ background: "#4f46e5", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Hire me
          </button>
        </div>
      )}

      {/* HERO — conditional layout */}
      {hasImage
        ? <HeroWithImage data={data} scrollTo={scrollTo} />
        : <HeroWithoutImage data={data} scrollTo={scrollTo} />
      }

      {/* STATS */}
      {/* <div
        className="anim-4 flex overflow-x-auto"
        style={{ borderTop: "0.5px solid rgba(99,102,241,0.15)", borderBottom: "0.5px solid rgba(99,102,241,0.15)" }}
      >
        <StatCard value={6} suffix="+" label="Years exp" delay={200} />
        <StatCard value={40} suffix="+" label="Projects" delay={300} />
        <StatCard value={data.skills.length || 12} label="Technologies" delay={400} />
        <StatCard value={25} suffix="+" label="Clients" delay={500} />
      </div> */}

      {/* SKILLS */}
      <div id="skills" className="px-5 sm:px-8 md:px-10 py-12 sm:py-16 max-w-4xl mx-auto"
        style={{ borderBottom: "0.5px solid rgba(99,102,241,0.1)" }}>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#818cf8" }}>What I work with</p>
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1" style={{ letterSpacing: "-0.6px" }}>Technical skills</h2>
        <p className="text-sm mb-8" style={{ color: "#475569" }}>Technologies and tools in my daily stack</p>
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {data.skills.length === 0
            ? <p className="text-sm" style={{ color: "#475569" }}>No skills added yet.</p>
            : data.skills.map((skill, i) => <SkillChip key={i} skill={skill} />)
          }
        </div>
      </div>

      {/* EXPERIENCE */}
      <div id="exp" className="px-5 sm:px-8 md:px-10 py-12 sm:py-16 max-w-4xl mx-auto"
        style={{ borderBottom: "0.5px solid rgba(99,102,241,0.1)" }}>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#818cf8" }}>Where I've worked</p>
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1" style={{ letterSpacing: "-0.6px" }}>Experience</h2>
        <p className="text-sm mb-8" style={{ color: "#475569" }}>My professional journey so far</p>
        <div>
          {data.experiences.length === 0
            ? <p className="text-sm" style={{ color: "#475569" }}>No experience added yet.</p>
            : data.experiences.map((exp, i) => <ExpCard key={i} exp={exp} index={i} />)
          }
        </div>
      </div>

      {/* PROJECTS */}
      <div id="projects" className="px-5 sm:px-8 md:px-10 py-12 sm:py-16 max-w-4xl mx-auto"
        style={{ borderBottom: "0.5px solid rgba(99,102,241,0.1)" }}>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#818cf8" }}>What I've built</p>
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1" style={{ letterSpacing: "-0.6px" }}>Featured projects</h2>
        <p className="text-sm mb-8" style={{ color: "#475569" }}>A selection of work I'm proud of</p>
        <div className="projects-grid">
          {data.projects.length === 0
            ? <p className="text-sm col-span-2" style={{ color: "#475569" }}>No projects added yet.</p>
            : data.projects.map((proj, i) => <ProjectCard key={i} proj={proj} index={i} />)
          }
        </div>
      </div>

      {/* CONTACT */}
      <div id="contact" className="px-5 sm:px-8 md:px-10 py-12 sm:py-16 max-w-4xl mx-auto">
        <div className="rounded-2xl p-8 sm:p-12 text-center"
          style={{ background: "rgba(99,102,241,0.07)", border: "0.5px solid rgba(99,102,241,0.25)" }}>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3" style={{ letterSpacing: "-1px" }}>Let's work together</h2>
          <p className="text-sm mb-8" style={{ color: "#64748b" }}>
            Have a project in mind? I'm always open to discussing new opportunities.
          </p>
          <div className="flex justify-center flex-wrap gap-3">
            {(data.customUrl || data.githubUrl) ? (
              <>
                <a href={`mailto:${data.email || "hello@example.com"}`}
                  className="cta-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white no-underline transition-all duration-200">
                  <Mail className="w-4 h-4" /> Send an email
                </a>
                {data.linkedinUrl && (
                  <a href={data.linkedinUrl} target="_blank" rel="noreferrer"
                    className="cta-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium no-underline transition-all duration-200"
                    style={{ background: "transparent", border: "0.5px solid rgba(148,163,184,0.3)", color: "#94a3b8" }}>
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                {data.githubUrl && (
                  <a href={data.githubUrl} target="_blank" rel="noreferrer"
                    className="cta-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium no-underline transition-all duration-200"
                    style={{ background: "transparent", border: "0.5px solid rgba(148,163,184,0.3)", color: "#94a3b8" }}>
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm" style={{ color: "#475569" }}>No contact info provided.</p>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between px-5 sm:px-10 py-6 flex-wrap gap-3"
        style={{ borderTop: "0.5px solid rgba(99,102,241,0.12)" }}>
        <p className="text-xs" style={{ color: "#475569" }}>
          All rights reserved © {new Date().getFullYear()} bowizzy.com
        </p>
        <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-xs font-medium" style={{ color: "#64748b" }}>Made with Bowizzy</span>
        </div>
      </div>
    </div>
  );
}