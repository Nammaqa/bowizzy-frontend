import React from "react";
import {
  ArrowUpRight,
  Briefcase,
  Download,
  Github,
  Globe,
  Image,
  Linkedin,
  Link2,
  Mail,
  PenTool,
  Sparkles,
  Twitter,
} from "lucide-react";
import type { PortfolioData } from "./developer";
import { formatPortfolioDuration } from "./dateFormat";

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return null;
  const int = parseInt(normalized, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function isDark(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.55;
}

function getInitials(name: string) {
  if (!name) return "DS";
  return name
    .split(" ")
    .map((token) => token[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function RichText({
  html,
  fallback,
  className = "",
}: {
  html?: string;
  fallback: string;
  className?: string;
}) {
  return (
    <div
      className={`designer-rich ${className}`}
      dangerouslySetInnerHTML={{ __html: html || fallback }}
    />
  );
}

export default function DesignerTemplate({ data }: { data: PortfolioData }) {
  const accent = data.themeColor || "#d84f2a";
  const bg = data.backgroundColor || "#f6f2ea";
  const dark = isDark(bg);
  const ink = dark ? "#f8f4ec" : "#151515";
  const muted = dark ? "#c8c0b4" : "#625d55";
  const panel = dark ? "rgba(255,255,255,0.075)" : "rgba(255,255,255,0.62)";
  const panelStrong = dark ? "rgba(255,255,255,0.12)" : "#fffaf0";
  const line = dark ? "rgba(255,255,255,0.18)" : "rgba(21,21,21,0.14)";
  const accentTwo = dark ? "#69e3d2" : "#0f766e";
  const socialLinks = [
    { href: data.githubUrl, label: "GitHub", icon: Github },
    { href: data.linkedinUrl, label: "LinkedIn", icon: Linkedin },
    { href: data.twitterUrl, label: "Twitter", icon: Twitter },
    { href: data.customUrl, label: "Website", icon: Globe },
    { href: data.behanceUrl, label: "Behance", icon: Link2 },
    { href: data.dribbbleUrl, label: "Dribbble", icon: Sparkles },
  ].filter((item) => Boolean(item.href));
  const processSteps = data.designProcess?.length
    ? data.designProcess
    : [
        {
          title: "Understand",
          description: "Map goals, audience, constraints, and the visual tone before designing the surface.",
        },
        {
          title: "Shape",
          description: "Turn ideas into strong layout systems, interaction states, and reusable patterns.",
        },
        {
          title: "Refine",
          description: "Polish the visual rhythm, prepare handoff, and tighten the details that users feel.",
        },
      ];
  const caseStudies = data.caseStudies || [];

  return (
    <main
      className="@container designer-root min-h-screen overflow-hidden"
      style={
        {
          background: bg,
          color: ink,
          fontFamily: "'Manrope', 'Space Grotesk', sans-serif",
          "--designer-bg": bg,
          "--designer-ink": ink,
          "--designer-muted": muted,
          "--designer-panel": panel,
          "--designer-panel-strong": panelStrong,
          "--designer-line": line,
          "--designer-accent": accent,
          "--designer-accent-two": accentTwo,
        } as React.CSSProperties
      }
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap');

        .designer-page {
          max-width: 1180px;
          margin: 0 auto;
        }
        .designer-root,
        .designer-root * {
          min-width: 0;
        }
        .designer-text-wrap,
        .designer-rich,
        .designer-rich * {
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .designer-root img {
          -webkit-user-drag: none;
          user-select: none;
        }
        .designer-rich p { margin: 0 0 0.45rem; }
        .designer-rich p:last-child { margin-bottom: 0; }
        .designer-rich ul, .designer-rich ol { margin: 0.35rem 0; padding-left: 1.15rem; }
        .designer-rich ul { list-style: disc; }
        .designer-rich ol { list-style: decimal; }
        .designer-rich li { margin: 0.2rem 0; }
        .designer-rich a { color: var(--designer-accent); text-decoration: underline; }
        .designer-rich strong, .designer-rich b {
          display: inline;
          padding: 0.05em 0.28em;
          border-radius: 0.32em;
          background: color-mix(in srgb, var(--designer-accent) 72%, #111827);
          color: #f8fafc;
          font-weight: 800;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
          text-shadow: 0 1px 1px rgba(0,0,0,0.24);
        }
        .designer-hover {
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
        }
        .designer-hover:hover {
          transform: translateY(-3px);
          border-color: var(--designer-accent) !important;
        }
        .designer-cover-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.28) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.28) 1px, transparent 1px);
          background-size: 34px 34px;
        }
      `}</style>

      <section className="designer-page px-5 @md:px-8">
        <nav
          className="flex items-center justify-between gap-4 py-5 border-b"
          style={{ borderColor: line }}
        >
          <a href="#top" className="flex items-center gap-3 min-w-0 no-underline" style={{ color: ink }}>
            <span
              className="h-10 w-10 grid place-items-center text-sm font-extrabold shrink-0"
              style={{ background: ink, color: bg, borderRadius: 8 }}
            >
              {getInitials(data.portfolioName)}
            </span>
            <span className="text-sm font-extrabold truncate">
              {data.portfolioName || "Creative Designer"}
            </span>
          </a>

          <div className="hidden @md:flex items-center gap-7 text-xs font-extrabold uppercase">
            {["work", "experience", "process", "contact"].map((item) => (
              <a key={item} href={`#${item}`} className="no-underline" style={{ color: muted }}>
                {item}
              </a>
            ))}
          </div>
        </nav>

        <header id="top" className="min-h-[660px] grid grid-cols-1 @lg:grid-cols-[1.08fr_0.92fr] gap-9 py-12 @lg:py-16 items-center border-b" style={{ borderColor: line }}>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase mb-6" style={{ color: accent }}>
              <Sparkles className="w-4 h-4" />
              Designer Portfolio
            </div>
            <h1 className="text-5xl @md:text-6xl @lg:text-7xl leading-none font-extrabold max-w-3xl">
              {data.portfolioName || "Creative Mind"}
            </h1>
            <p className="designer-text-wrap mt-7 max-w-2xl text-base @md:text-lg leading-8 font-medium" style={{ color: muted }}>
              {data.tagline ||
                data.portfolioDescription ||
                "I design sharp, human digital products with expressive visuals, clean systems, and careful interaction craft."}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {data.cvUrl && (
                <a
                  href={data.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="designer-hover inline-flex items-center gap-2 px-5 py-3 text-sm font-extrabold no-underline"
                  style={{ background: ink, color: bg, borderRadius: 8 }}
                >
                  <Download className="w-4 h-4" />
                  Resume
                </a>
              )}
              <a
                href={`mailto:${data.email || "hello@example.com"}`}
                className="designer-hover inline-flex items-center gap-2 px-5 py-3 text-sm font-extrabold no-underline border"
                style={{ color: ink, borderColor: line, background: panelStrong, borderRadius: 8 }}
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="designer-hover h-11 w-11 border inline-flex items-center justify-center no-underline"
                  style={{ color: ink, borderColor: line, background: panel, borderRadius: 8 }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="aspect-[4/5] overflow-hidden border relative"
              style={{ borderColor: line, background: panelStrong, borderRadius: 8 }}
            >
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt={data.portfolioName || "Designer"}
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                  onDragStart={(event) => event.preventDefault()}
                />
              ) : (
                <div
                  className="absolute inset-0 designer-cover-grid"
                  style={{ backgroundColor: accent }}
                >
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="text-8xl @md:text-9xl font-extrabold" style={{ color: "#ffffff" }}>
                      {getInitials(data.portfolioName)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div
              className="absolute -left-3 @md:-left-8 bottom-8 border p-4 max-w-[240px]"
              style={{ borderColor: line, background: panelStrong, backdropFilter: "blur(16px)", borderRadius: 8 }}
            >
              <p className="text-xs font-extrabold uppercase mb-2" style={{ color: accentTwo }}>
                Now crafting
              </p>
              <p className="text-sm leading-6 font-bold">
                Interfaces, brand systems, product stories, and handoff-ready design.
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 @md:grid-cols-4 border-b" style={{ borderColor: line }}>
          {[
            { value: data.projects.length || 0, label: "Projects" },
            { value: caseStudies.length || 0, label: "Cases" },
            { value: data.experiences.length || 0, label: "Roles" },
            { value: data.skills.length || 0, label: "Skills" },
          ].map((stat) => (
            <div key={stat.label} className="py-6 border-r last:border-r-0" style={{ borderColor: line }}>
              <p className="text-4xl font-extrabold">{stat.value}</p>
              <p className="text-xs font-extrabold uppercase mt-1" style={{ color: muted }}>
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 @lg:grid-cols-[0.38fr_0.62fr] gap-8 py-12 @lg:py-16 border-b" style={{ borderColor: line }}>
          <div>
            <p className="text-xs font-extrabold uppercase mb-3" style={{ color: accent }}>
              About
            </p>
            <h2 className="text-3xl @md:text-4xl font-extrabold leading-tight">
              Design with a product brain and a visual point of view.
            </h2>
          </div>
          <div>
            <p className="designer-text-wrap text-xl @md:text-2xl leading-10 font-bold">
              {data.portfolioDescription ||
                "I help teams turn rough ideas into clear, polished digital experiences that feel considered from the first impression to the final interaction."}
            </p>
            <div className="flex flex-wrap gap-2 mt-8">
              {data.skills.length ? (
                data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-2 border text-xs font-extrabold uppercase"
                    style={{ borderColor: line, background: panel, color: ink, borderRadius: 8 }}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm" style={{ color: muted }}>
                  Add skills in the editor to show the toolkit here.
                </span>
              )}
            </div>
          </div>
        </section>

        {caseStudies.length > 0 && (
          <section id="case-studies" className="py-12 @lg:py-16 border-b" style={{ borderColor: line }}>
            <div className="flex items-end justify-between gap-5 mb-8">
              <div>
                <p className="text-xs font-extrabold uppercase mb-3" style={{ color: accent }}>
                  UX Case Studies
                </p>
                <h2 className="text-4xl @md:text-5xl font-extrabold">Design stories</h2>
              </div>
              <Image className="hidden @md:block w-8 h-8" style={{ color: accentTwo }} />
            </div>

            <div className="grid grid-cols-1 @lg:grid-cols-2 gap-5">
              {caseStudies.map((study, index) => (
                <article
                  key={`${study.title}-${index}`}
                  className="designer-hover border overflow-hidden"
                  style={{ borderColor: line, background: panelStrong, borderRadius: 8 }}
                >
                  <div
                    className="h-64 relative overflow-hidden border-b designer-cover-grid"
                    style={{ borderColor: line, backgroundColor: index % 2 ? ink : accent }}
                  >
                    {study.imageUrl ? (
                      <img
                        src={study.imageUrl}
                        alt={study.title || "Case study cover"}
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                        onDragStart={(event) => event.preventDefault()}
                      />
                    ) : (
                      <div className="absolute inset-5 grid grid-cols-5 grid-rows-4 gap-3">
                        <span className="col-span-3 row-span-4" style={{ background: "rgba(255,255,255,0.72)", borderRadius: 8 }} />
                        <span className="col-span-2 row-span-2" style={{ background: accentTwo, borderRadius: 8 }} />
                        <span className="col-span-2 row-span-2" style={{ background: "rgba(255,255,255,0.26)", borderRadius: 8 }} />
                      </div>
                    )}
                  </div>
                  <div className="p-5 @md:p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase mb-2" style={{ color: accent }}>
                          {study.role || "UI/UX Design"}
                        </p>
                        <h3 className="text-2xl font-extrabold">{study.title || "Case Study"}</h3>
                      </div>
                      {study.link && (
                        <a
                          href={study.link}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${study.title || "Case study"} link`}
                          className="h-10 w-10 shrink-0 border inline-flex items-center justify-center no-underline"
                          style={{ color: ink, borderColor: line, borderRadius: 8 }}
                        >
                          <ArrowUpRight className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                    {study.subtitle && (
                      <p className="text-sm font-extrabold mb-4" style={{ color: muted }}>
                        {study.subtitle}
                      </p>
                    )}
                    <RichText
                      html={study.description}
                      fallback="Problem, process, solution, and outcome."
                      className="text-sm leading-7"
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section id="work" className="py-12 @lg:py-16 border-b" style={{ borderColor: line }}>
          <div className="flex items-end justify-between gap-5 mb-8">
            <div>
              <p className="text-xs font-extrabold uppercase mb-3" style={{ color: accent }}>
                Selected Work
              </p>
              <h2 className="text-4xl @md:text-5xl font-extrabold">Recent projects</h2>
            </div>
            <PenTool className="hidden @md:block w-8 h-8" style={{ color: accentTwo }} />
          </div>

          <div className="grid grid-cols-1 @lg:grid-cols-2 gap-5">
            {data.projects.length ? (
              data.projects.map((project, index) => (
                <article
                  key={`${project.title}-${index}`}
                  className="designer-hover border overflow-hidden"
                  style={{ borderColor: line, background: panelStrong, borderRadius: 8 }}
                >
                  <div
                    className="h-56 relative designer-cover-grid border-b"
                    style={{
                      borderColor: line,
                      backgroundColor: index % 2 ? ink : accent,
                    }}
                  >
                    <div className="absolute inset-5 grid grid-cols-6 grid-rows-4 gap-3">
                      <span className="col-span-4 row-span-2" style={{ background: "rgba(255,255,255,0.72)", borderRadius: 8 }} />
                      <span className="col-span-2 row-span-2" style={{ background: accentTwo, borderRadius: 8 }} />
                      <span className="col-span-2 row-span-2" style={{ background: "rgba(255,255,255,0.32)", borderRadius: 8 }} />
                      <span className="col-span-4 row-span-2" style={{ background: "rgba(255,255,255,0.18)", borderRadius: 8 }} />
                    </div>
                  </div>
                  <div className="p-5 @md:p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="text-2xl font-extrabold">{project.title || "Project Name"}</h3>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${project.title || "Project"} link`}
                          className="h-10 w-10 shrink-0 border inline-flex items-center justify-center no-underline"
                          style={{ color: ink, borderColor: line, borderRadius: 8 }}
                        >
                          <ArrowUpRight className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                    <RichText
                      html={project.description}
                      fallback="Project summary description."
                      className="text-sm leading-7"
                    />
                    <p className="text-xs font-extrabold uppercase mt-6" style={{ color: accent }}>
                      {project.tech || "Design System"}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="border p-8 text-sm" style={{ borderColor: line, color: muted, borderRadius: 8 }}>
                Add projects in the editor to build the showcase grid.
              </div>
            )}
          </div>
        </section>

        <section id="experience" className="grid grid-cols-1 @lg:grid-cols-[0.35fr_0.65fr] gap-8 py-12 @lg:py-16 border-b" style={{ borderColor: line }}>
          <div>
            <p className="text-xs font-extrabold uppercase mb-3" style={{ color: accent }}>
              Experience
            </p>
            <h2 className="text-4xl font-extrabold leading-tight">Career so far</h2>
          </div>

          <div className="space-y-4">
            {data.experiences.length ? (
              data.experiences.map((exp, index) => {
                const displayDuration = formatPortfolioDuration(exp.duration);
                return (
                  <article
                    key={`${exp.role}-${index}`}
                    className="grid grid-cols-[2.75rem_1fr] gap-4 border-b pb-6"
                    style={{ borderColor: line }}
                  >
                    <span
                      className="h-11 w-11 grid place-items-center border"
                      style={{ borderColor: line, background: panel, borderRadius: 8 }}
                    >
                      <Briefcase className="w-4 h-4" style={{ color: accent }} />
                    </span>
                    <div>
                      <div className="flex flex-wrap justify-between gap-3 mb-1">
                        <h3 className="text-lg font-extrabold">{exp.role || "Lead Designer"}</h3>
                        {displayDuration && (
                          <span className="text-xs font-extrabold uppercase" style={{ color: muted }}>
                            {displayDuration}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-extrabold mb-3" style={{ color: accent }}>
                        {exp.company || "Creative Studio"}
                      </p>
                      <RichText
                        html={exp.details}
                        fallback="Experience details..."
                        className="text-sm leading-7"
                      />
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm" style={{ color: muted }}>
                Add experience in the editor to show the career timeline.
              </p>
            )}
          </div>
        </section>

        <section id="process" className="py-12 @lg:py-16 border-b" style={{ borderColor: line }}>
          <p className="text-xs font-extrabold uppercase mb-7" style={{ color: accent }}>
            Process
          </p>
          <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
            {processSteps.map((step, index) => (
              <article
                key={`${step.title}-${index}`}
                className="border p-5"
                style={{ borderColor: line, background: panel, borderRadius: 8 }}
              >
                <p className="text-xs font-extrabold mb-10" style={{ color: accentTwo }}>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="text-xl font-extrabold mb-3">{step.title || "Process Step"}</h3>
                <p className="text-sm leading-7" style={{ color: muted }}>
                  {step.description || "Describe this phase of your design process."}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="py-12 @lg:py-16">
          <div className="grid grid-cols-1 @lg:grid-cols-[1fr_auto] gap-7 items-center">
            <div>
              <p className="text-xs font-extrabold uppercase mb-4" style={{ color: accent }}>
                Contact & Profiles
              </p>
              <h2 className="text-4xl @md:text-6xl font-extrabold leading-none">
                Let's build something with taste.
              </h2>
              <p className="mt-4 text-sm leading-7" style={{ color: muted, maxWidth: 560 }}>
                Reach out via email or connect through my professional profiles for design, process, and project details.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4">
              <a
                href={`mailto:${data.email || "hello@example.com"}`}
                className="designer-hover inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-extrabold no-underline"
                style={{ background: accent, color: "#ffffff", borderRadius: 8 }}
              >
                <Mail className="w-4 h-4" />
                Get in touch
              </a>
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  {socialLinks.map(({ href, label, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="designer-hover h-11 w-11 border inline-flex items-center justify-center no-underline"
                      style={{ color: ink, borderColor: line, background: panel, borderRadius: 8 }}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
