import React, { useEffect, useState } from "react";
import {
  FileText,
  Loader2,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Award,
  Link as LinkIcon,
  Wrench,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  analyzeJobDescription,
  saveJdResumeData,
  type JdResumeData,
  type JdProjectItem,
  type JdExperienceItem,
  type JdEducationItem,
  type JdSkillItem,
  type JdCertificateItem,
  type JdLinkItem,
} from "@/services/aiResumeService";

const LOADING_MESSAGES = [
  "Reading the job description...",
  "Identifying key skills & requirements...",
  "Matching your experience to the role...",
  "Crafting tailored resume content...",
  "Polishing the final details...",
];

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
const WORK_MODES = ["On-site", "Remote", "Hybrid"];
const CERTIFICATE_TYPES = [
  "Course Completion",
  "Professional Certification",
  "Achievement",
  "Training",
  "Workshop",
  "Other",
];
const RESULT_FORMATS: { label: string; value: string }[] = [
  { label: "CGPA", value: "cgpa" },
  { label: "Percentage", value: "percentage" },
];

// School-level records have no degree or field of study — those only apply to
// higher education, so the inputs are hidden for these types.
const SCHOOL_EDUCATION_TYPES = ["sslc", "puc"];

const isSchoolEducation = (educationType?: string) =>
  SCHOOL_EDUCATION_TYPES.includes((educationType || "").toLowerCase());

const fieldClass =
  "w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white placeholder-gray-400 transition disabled:bg-gray-100 disabled:text-gray-400";
const itemClass = "flex flex-col gap-2.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        {icon}
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>
      <div className="p-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

/**
 * Only one experience may be marked "Currently working here". If the analyzer
 * (or an older saved draft) flags several, the first one wins and the rest are
 * cleared.
 */
function enforceSingleCurrentExperience(experiences: JdExperienceItem[]): JdExperienceItem[] {
  let alreadyFlagged = false;
  return experiences.map((exp) => {
    if (!exp.currently_working_here) return exp;
    if (alreadyFlagged) return { ...exp, currently_working_here: false };
    alreadyFlagged = true;
    return exp;
  });
}

/**
 * The analyzer returns two separate lists per project, and every template
 * renders them as one bullet list — so roles used to appear in the preview
 * without ever being shown in review. Fold them into the description up front:
 * one editable field, and the preview matches it line for line.
 */
function mergeProjectDescriptions(projects: JdProjectItem[]): JdProjectItem[] {
  return projects.map((project) => {
    const roles = Array.isArray(project.roles_responsibilities)
      ? project.roles_responsibilities.filter(Boolean)
      : [];
    if (roles.length === 0) return project;

    const description = Array.isArray(project.enhanced_description)
      ? project.enhanced_description
      : [];

    return {
      ...project,
      enhanced_description: [...description, ...roles],
      roles_responsibilities: [],
    };
  });
}

function normalizeJdData(raw: JdResumeData): JdResumeData {
  const rawAny = raw as any;
  const experiences: JdExperienceItem[] = Array.isArray(rawAny.work_experience)
    ? rawAny.work_experience
    : raw.work_experience?.experiences || [];
  const technicalSummary =
    raw.technical_summary_generated ??
    rawAny.enhanced_technical_summary ??
    rawAny.technical_summary ??
    "";

  return {
    ...raw,
    technical_summary_generated: technicalSummary,
    work_experience: { experiences: enforceSingleCurrentExperience(experiences) },
    projects: mergeProjectDescriptions(raw.projects || []),
    education: raw.education || [],
    skills: raw.skills || [],
    ai_skills: raw.ai_skills || [],
    certificates: raw.certificates || [],
    links: raw.links || [],
  };
}
//testign
interface JdResumeFlowProps {
  sessionId: string;
  token: string;
  initialJdText?: string;
  onComplete: (data: JdResumeData) => void;
}

type Stage = "input" | "loading" | "review" | "saving" | "success";

function draftKey(sessionId: string): string {
  return `jd_resume_draft_${sessionId}`;
}

export default function JdResumeFlow({ sessionId, token, onComplete }: JdResumeFlowProps) {
  const [stage, setStage] = useState<Stage>("input");
  const [jdText, setJdText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<JdResumeData | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // ── restore any in-progress draft for this session on mount ──────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(sessionId));
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft?.data) {
        // Older drafts may predate the single-current-experience and
        // merged-project-description rules.
        const experiences = draft.data?.work_experience?.experiences;
        setData({
          ...draft.data,
          ...(Array.isArray(experiences)
            ? {
                work_experience: {
                  ...draft.data.work_experience,
                  experiences: enforceSingleCurrentExperience(experiences),
                },
              }
            : {}),
          ...(Array.isArray(draft.data.projects)
            ? { projects: mergeProjectDescriptions(draft.data.projects) }
            : {}),
        });
        setStage("review");
      } else if (draft?.jdText) {
        setJdText(draft.jdText);
      }
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── keep the draft in sync so a refresh doesn't lose progress ────────────
  useEffect(() => {
    try {
      if (stage === "review" && data) {
        localStorage.setItem(draftKey(sessionId), JSON.stringify({ data }));
      } else if (stage === "input") {
        if (jdText.trim()) {
          localStorage.setItem(draftKey(sessionId), JSON.stringify({ jdText }));
        } else {
          localStorage.removeItem(draftKey(sessionId));
        }
      }
    } catch { }
  }, [stage, data, jdText, sessionId]);

  useEffect(() => {
    if (stage !== "loading") return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [stage]);

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    setError(null);
    setStage("loading");
    try {
      const result = await analyzeJobDescription(sessionId, jdText.trim(), token);
      // eslint-disable-next-line no-console
      console.log("[JD analyze] raw response:", result);
      setData(normalizeJdData(result));
      setStage("review");
    } catch (err) {
      console.error("Failed to analyze job description", err);
      setError("We couldn't analyze this job description. Please try again.");
      setStage("input");
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setError(null);
    setStage("saving");
    try {
      await saveJdResumeData(sessionId, data, token);
      try { localStorage.removeItem(draftKey(sessionId)); } catch { }
      setStage("success");
    } catch (err) {
      console.error("Failed to save JD resume data", err);
      setError("We couldn't save your changes. Please try again.");
      setStage("review");
    }
  };

  // ── field update helpers ──────────────────────────────────────────────────
  const updateField = <K extends keyof JdResumeData>(key: K, value: JdResumeData[K]) => {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateProject = (index: number, patch: Partial<JdProjectItem>) => {
    setData((prev) => {
      if (!prev?.projects) return prev;
      const projects = [...prev.projects];
      projects[index] = { ...projects[index], ...patch };
      return { ...prev, projects };
    });
  };

  const updateExperience = (index: number, patch: Partial<JdExperienceItem>) => {
    setData((prev) => {
      if (!prev?.work_experience?.experiences) return prev;
      const experiences = [...prev.work_experience.experiences];
      experiences[index] = { ...experiences[index], ...patch };
      return { ...prev, work_experience: { ...prev.work_experience, experiences } };
    });
  };

  // "Currently working here" is exclusive — checking one entry clears every other.
  const setCurrentExperience = (index: number, checked: boolean) => {
    setData((prev) => {
      if (!prev?.work_experience?.experiences) return prev;
      const experiences = prev.work_experience.experiences.map((exp, i) => {
        if (i === index) {
          return {
            ...exp,
            currently_working_here: checked,
            end_date: checked ? null : exp.end_date,
          };
        }
        return checked && exp.currently_working_here
          ? { ...exp, currently_working_here: false }
          : exp;
      });
      return { ...prev, work_experience: { ...prev.work_experience, experiences } };
    });
  };

  const updateEducation = (index: number, patch: Partial<JdEducationItem>) => {
    setData((prev) => {
      if (!prev?.education) return prev;
      const education = [...prev.education];
      education[index] = { ...education[index], ...patch };
      return { ...prev, education };
    });
  };

  const updateSkill = (listKey: "skills" | "ai_skills", index: number, patch: Partial<JdSkillItem>) => {
    setData((prev) => {
      const list = prev?.[listKey];
      if (!Array.isArray(list)) return prev;
      const next = [...(list as JdSkillItem[])];
      next[index] = { ...next[index], ...patch };
      return { ...prev, [listKey]: next };
    });
  };

  const updateCertificate = (index: number, patch: Partial<JdCertificateItem>) => {
    setData((prev) => {
      if (!prev?.certificates) return prev;
      const certificates = [...prev.certificates];
      certificates[index] = { ...certificates[index], ...patch };
      return { ...prev, certificates };
    });
  };

  const updateLink = (index: number, patch: Partial<JdLinkItem>) => {
    setData((prev) => {
      if (!prev?.links) return prev;
      const links = [...prev.links];
      links[index] = { ...links[index], ...patch };
      return { ...prev, links };
    });
  };

  // ── input stage ────────────────────────────────────────────────────────────
  if (stage === "input") {
    return (
      <div className="flex flex-col items-center text-center gap-4 w-full max-w-lg mx-auto">
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          rows={9}
          placeholder="Paste the job description here..."
          className="w-full text-sm p-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white placeholder-gray-400 resize-none transition"
        />
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
        <button
          onClick={handleAnalyze}
          disabled={!jdText.trim()}
          className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          Analyze Job Description
        </button>
      </div>
    );
  }

  // ── loading / saving stage ──────────────────────────────────────────────────
  if (stage === "loading" || stage === "saving") {
    const heading = stage === "saving" ? "Saving your details" : "Scanning your job description";
    const sub =
      stage === "saving"
        ? "Applying your edits to your resume profile"
        : "Tailoring your resume content to match this role";
    const message = stage === "saving" ? "Saving your changes..." : LOADING_MESSAGES[loadingMsgIndex];
    return (
      <div className="flex flex-col items-center justify-center text-center gap-5 py-16 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">{heading}</h2>
          <p className="text-sm text-gray-400">{sub}</p>
        </div>
        <p className="text-sm font-medium text-purple-600 bg-purple-50 px-4 py-2 rounded-full">
          {message}
        </p>
      </div>
    );
  }

  // ── success stage ────────────────────────────────────────────────────────────
  if (stage === "success") {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-16 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Details saved successfully</h2>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Your resume content has been tailored to this job description. Let's continue building
            your resume.
          </p>
        </div>
        <button
          onClick={() => data && onComplete(data)}
          className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 active:scale-95 transition"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── review stage ─────────────────────────────────────────────────────────────
  if (!data) return null;

  return (
    <div className="w-full max-w-2xl mx-auto text-left flex flex-col gap-4 pb-2">
      <div className="text-center mb-1">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Review your tailored content</h2>
        <p className="text-sm text-gray-400">Make any edits you'd like, then save to continue.</p>
      </div>

      <SectionCard icon={<Sparkles className="w-4 h-4 text-orange-500" />} title="Technical Summary">
        <textarea
          value={data.technical_summary_generated || ""}
          onChange={(e) => updateField("technical_summary_generated", e.target.value)}
          rows={5}
          placeholder="No technical summary was generated — feel free to write one."
          className={`${fieldClass} resize-none`}
        />
      </SectionCard>

      {!!data.projects?.length && (
        <SectionCard icon={<Briefcase className="w-4 h-4 text-orange-500" />} title="Projects">
          {data.projects.map((p, i) => (
            <div key={p.project_id ?? i} className={itemClass}>
              <Field label="Project Title">
                <input
                  className={fieldClass}
                  value={p.project_title || ""}
                  onChange={(e) => updateProject(i, { project_title: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date">
                  <input
                    type="date"
                    className={fieldClass}
                    value={p.start_date || ""}
                    onChange={(e) => updateProject(i, { start_date: e.target.value })}
                  />
                </Field>
                <Field label="End Date">
                  <input
                    type="date"
                    disabled={!!p.currently_working}
                    className={fieldClass}
                    value={p.end_date || ""}
                    onChange={(e) => updateProject(i, { end_date: e.target.value })}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={!!p.currently_working}
                  onChange={(e) =>
                    updateProject(i, {
                      currently_working: e.target.checked,
                      end_date: e.target.checked ? null : p.end_date,
                    })
                  }
                />
                Currently pursuing
              </label>
              <Field label="Description & Responsibilities">
                <textarea
                  rows={5}
                  className={`${fieldClass} resize-none`}
                  value={(p.enhanced_description || []).join("\n")}
                  onChange={(e) => updateProject(i, { enhanced_description: e.target.value.split("\n") })}
                />
              </Field>
            </div>
          ))}
        </SectionCard>
      )}

      {!!data.work_experience?.experiences?.length && (
        <SectionCard icon={<Briefcase className="w-4 h-4 text-orange-500" />} title="Work Experience">
          {data.work_experience.experiences.map((e, i) => (
            <div key={e.experience_id ?? i} className={itemClass}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Job Title">
                  <input
                    className={fieldClass}
                    value={e.job_title || ""}
                    onChange={(ev) => updateExperience(i, { job_title: ev.target.value })}
                  />
                </Field>
                <Field label="Company Name">
                  <input
                    className={fieldClass}
                    value={e.company_name || ""}
                    onChange={(ev) => updateExperience(i, { company_name: ev.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Employment Type">
                  <select
                    className={fieldClass}
                    value={e.employment_type || ""}
                    onChange={(ev) => updateExperience(i, { employment_type: ev.target.value })}
                  >
                    <option value="">Select</option>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Work Mode">
                  <select
                    className={fieldClass}
                    value={e.work_mode || ""}
                    onChange={(ev) => updateExperience(i, { work_mode: ev.target.value })}
                  >
                    <option value="">Select</option>
                    {WORK_MODES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Location">
                <input
                  className={fieldClass}
                  value={e.location || ""}
                  onChange={(ev) => updateExperience(i, { location: ev.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date">
                  <input
                    type="date"
                    className={fieldClass}
                    value={e.start_date || ""}
                    onChange={(ev) => updateExperience(i, { start_date: ev.target.value })}
                  />
                </Field>
                <Field label="End Date">
                  <input
                    type="date"
                    disabled={!!e.currently_working_here}
                    className={fieldClass}
                    value={e.end_date || ""}
                    onChange={(ev) => updateExperience(i, { end_date: ev.target.value })}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={!!e.currently_working_here}
                  onChange={(ev) => setCurrentExperience(i, ev.target.checked)}
                />
                Currently working here
              </label>
              <Field label="Description">
                <textarea
                  rows={4}
                  className={`${fieldClass} resize-none`}
                  value={(e.enhanced_description || []).join("\n")}
                  onChange={(ev) => updateExperience(i, { enhanced_description: ev.target.value.split("\n") })}
                />
              </Field>
            </div>
          ))}
        </SectionCard>
      )}

      {!!data.education?.length && (
        <SectionCard icon={<GraduationCap className="w-4 h-4 text-orange-500" />} title="Education">
          {data.education.map((edu, i) => (
            <div key={edu.education_id ?? i} className={itemClass}>
              <span className="self-start text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase">
                {edu.education_type}
              </span>
              <Field label="Institution Name">
                <input
                  className={fieldClass}
                  value={edu.institution_name || ""}
                  onChange={(e) => updateEducation(i, { institution_name: e.target.value })}
                />
              </Field>
              {!isSchoolEducation(edu.education_type) && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Degree">
                    <input
                      className={fieldClass}
                      value={edu.degree || ""}
                      onChange={(e) => updateEducation(i, { degree: e.target.value })}
                    />
                  </Field>
                  <Field label="Field of Study">
                    <input
                      className={fieldClass}
                      value={edu.field_of_study || ""}
                      onChange={(e) => updateEducation(i, { field_of_study: e.target.value })}
                    />
                  </Field>
                </div>
              )}
              <Field label="University Name">
                <input
                  className={fieldClass}
                  value={edu.university_name || ""}
                  onChange={(e) => updateEducation(i, { university_name: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Year">
                  <input
                    type="month"
                    disabled={!!edu.currently_pursuing}
                    className={fieldClass}
                    value={edu.start_year || ""}
                    onChange={(e) => updateEducation(i, { start_year: e.target.value })}
                  />
                </Field>
                <Field label="End Year">
                  <input
                    type="month"
                    disabled={!!edu.currently_pursuing}
                    className={fieldClass}
                    value={edu.end_year || ""}
                    onChange={(e) => updateEducation(i, { end_year: e.target.value })}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={!!edu.currently_pursuing}
                  onChange={(e) => updateEducation(i, { currently_pursuing: e.target.checked })}
                />
                Currently pursuing
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Result Format">
                  <select
                    className={fieldClass}
                    value={edu.result_format || ""}
                    onChange={(e) => updateEducation(i, { result_format: e.target.value })}
                  >
                    <option value="">Select</option>
                    {RESULT_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Result">
                  <input
                    className={fieldClass}
                    value={edu.result || ""}
                    onChange={(e) => updateEducation(i, { result: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {!!data.skills?.length && (
        <SectionCard icon={<Wrench className="w-4 h-4 text-orange-500" />} title="Skills">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.skills.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={fieldClass}
                  value={s.skill_name || ""}
                  onChange={(e) => updateSkill("skills", i, { skill_name: e.target.value })}
                />
                <select
                  className={`${fieldClass} max-w-[130px]`}
                  value={s.skill_level || ""}
                  onChange={(e) => updateSkill("skills", i, { skill_level: e.target.value })}
                >
                  {SKILL_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {!!data.ai_skills?.length && (
        <SectionCard icon={<Sparkles className="w-4 h-4 text-orange-500" />} title="Skills Matched from JD">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.ai_skills.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={fieldClass}
                  value={s.skill_name || ""}
                  onChange={(e) => updateSkill("ai_skills", i, { skill_name: e.target.value })}
                />
                <select
                  className={`${fieldClass} max-w-[130px]`}
                  value={s.skill_level || ""}
                  onChange={(e) => updateSkill("ai_skills", i, { skill_level: e.target.value })}
                >
                  {SKILL_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {!!data.certificates?.length && (
        <SectionCard icon={<Award className="w-4 h-4 text-orange-500" />} title="Certificates">
          {data.certificates.map((c, i) => (
            <div key={c.certificate_id ?? i} className={itemClass}>
              <Field label="Certificate Title">
                <input
                  className={fieldClass}
                  value={c.certificate_title || ""}
                  onChange={(e) => updateCertificate(i, { certificate_title: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Certificate Type">
                  <select
                    className={fieldClass}
                    value={c.certificate_type || ""}
                    onChange={(e) => updateCertificate(i, { certificate_type: e.target.value })}
                  >
                    <option value="">Select</option>
                    {CERTIFICATE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Date">
                  <input
                    type="date"
                    className={fieldClass}
                    value={c.date || ""}
                    onChange={(e) => updateCertificate(i, { date: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Provided By">
                  <input
                    className={fieldClass}
                    value={c.certificate_provided_by || ""}
                    onChange={(e) => updateCertificate(i, { certificate_provided_by: e.target.value })}
                  />
                </Field>
                <Field label="Domain">
                  <input
                    className={fieldClass}
                    value={c.domain || ""}
                    onChange={(e) => updateCertificate(i, { domain: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  rows={3}
                  className={`${fieldClass} resize-none`}
                  value={c.description || ""}
                  onChange={(e) => updateCertificate(i, { description: e.target.value })}
                />
              </Field>
            </div>
          ))}
        </SectionCard>
      )}

      {!!data.links?.length && (
        <SectionCard icon={<LinkIcon className="w-4 h-4 text-orange-500" />} title="Links">
          {data.links.map((l, i) => (
            <div key={l.link_id ?? i} className="grid grid-cols-3 gap-3">
              <Field label="Type">
                <input
                  className={fieldClass}
                  value={l.link_type || ""}
                  onChange={(e) => updateLink(i, { link_type: e.target.value })}
                />
              </Field>
              <div className="col-span-2">
                <Field label="URL">
                  <input
                    className={fieldClass}
                    value={l.url || ""}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500 justify-center">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-2 w-full sm:w-auto sm:self-center px-8 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 active:scale-95 transition"
      >
        <CheckCircle2 className="w-4 h-4" />
        Save & Continue
      </button>
    </div>
  );
}