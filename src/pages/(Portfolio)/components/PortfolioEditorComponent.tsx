import React, { useState } from "react";
import { uploadPdfToCloudinary } from "@/utils/uploadPdfToCloudinary";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import {
  ArrowLeft,
  Save,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Plus,
  Trash2,
  Sparkles,
  LayoutTemplate,
  CheckCircle2,
  Loader2,
  Briefcase,
  Terminal,
  Layers,
  Wand2,
  X,
  Mail,
  Image,
  PenTool,
  Link2,
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";

interface Project {
  title: string;
  description: string;
  link: string;
  tech: string;
}

interface Experience {
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  duration: string;
  details: string;
}

interface DesignProcessStep {
  title: string;
  description: string;
}

interface CaseStudy {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  link: string;
  role: string;
}

export interface PortfolioEditorComponentProps {
  portfolioName: string;
  setPortfolioName: (val: string) => void;
  portfolioDescription: string;
  setPortfolioDescription: (val: string) => void;
  portfolioType: string;
  setPortfolioType: (val: string) => void;
  githubUrl: string;
  setGithubUrl: (val: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (val: string) => void;
  twitterUrl: string;
  setTwitterUrl: (val: string) => void;
  customUrl: string;
  setCustomUrl: (val: string) => void;
  cvUrl: string;
  setCvUrl: (val: string) => void;
  profileImageUrl: string;
  setProfileImageUrl: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  themeColor: string;
  setThemeColor: (val: string) => void;
  backgroundColor: string;
  setBackgroundColor: (val: string) => void;
  behanceUrl: string;
  setBehanceUrl: (val: string) => void;
  dribbbleUrl: string;
  setDribbbleUrl: (val: string) => void;
  designProcess: DesignProcessStep[];
  setDesignProcess: React.Dispatch<React.SetStateAction<DesignProcessStep[]>>;
  caseStudies: CaseStudy[];
  setCaseStudies: React.Dispatch<React.SetStateAction<CaseStudy[]>>;

  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  experiences: Experience[];
  setExperiences: React.Dispatch<React.SetStateAction<Experience[]>>;
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;

  onSave: () => void;
  saving: boolean;
  success: boolean;
  error: string | null;
  onBack: () => void;
  onImportFromProfile?: () => void;
  importing?: boolean;
  importSuccess?: boolean;
}

export default function PortfolioEditorComponent({
  portfolioName,
  setPortfolioName,
  portfolioDescription,
  setPortfolioDescription,
  portfolioType,
  setPortfolioType,
  githubUrl,
  setGithubUrl,
  linkedinUrl,
  setLinkedinUrl,
  twitterUrl,
  setTwitterUrl,
  customUrl,
  setCustomUrl,
  cvUrl,
  setCvUrl,
  profileImageUrl,
  setProfileImageUrl,
  email,
  setEmail,
  themeColor,
  setThemeColor,
  backgroundColor,
  setBackgroundColor,
  behanceUrl,
  setBehanceUrl,
  dribbbleUrl,
  setDribbbleUrl,
  designProcess,
  setDesignProcess,
  caseStudies,
  setCaseStudies,
  projects,
  setProjects,
  experiences,
  setExperiences,
  skills,
  setSkills,
  onSave,
  saving,
  success,
  error,
  onBack,
  onImportFromProfile,
  importing = false,
  importSuccess = false,
}: PortfolioEditorComponentProps) {
  const [newSkill, setNewSkill] = useState("");
  const palettePresets: Array<{
    id: string;
    name: string;
    themeColor: string;
    backgroundColor: string;
    accent2: string;
  }> = [
    {
      id: "studio-ink",
      name: "Studio Ink",
      themeColor: "#d84f2a",
      backgroundColor: "#f6f2ea",
      accent2: "#0f766e",
    },
    {
      id: "editorial-mono",
      name: "Editorial Mono",
      themeColor: "#111111",
      backgroundColor: "#f4f4f1",
      accent2: "#a3e635",
    },
    {
      id: "folio-green",
      name: "Folio Green",
      themeColor: "#0f766e",
      backgroundColor: "#eef6f1",
      accent2: "#f59e0b",
    },
    {
      id: "gallery-blue",
      name: "Gallery Blue",
      themeColor: "#2563eb",
      backgroundColor: "#f5f7fb",
      accent2: "#ef4444",
    },
    {
      id: "carbon-lime",
      name: "Carbon Lime",
      themeColor: "#a3e635",
      backgroundColor: "#10110e",
      accent2: "#f4f4f1",
    },
    {
      id: "navy-coral",
      name: "Navy Coral",
      themeColor: "#ff6b4a",
      backgroundColor: "#101827",
      accent2: "#69e3d2",
    },
    {
      id: "paper-ruby",
      name: "Paper Ruby",
      themeColor: "#be123c",
      backgroundColor: "#fff7f2",
      accent2: "#0f766e",
    },
    {
      id: "warm-slate",
      name: "Warm Slate",
      themeColor: "#475569",
      backgroundColor: "#faf7ef",
      accent2: "#d97706",
    },
  ];

  const nameMax = 50;
  const descMax = 300;
  const linkMax = 250;
  const experienceTextMax = 80;
  const techStackMax = 30;
  const maxImageSizeBytes = 5 * 1024 * 1024;
  const allowedImageTypes = ["image/png", "image/jpeg"];
  const mmYYYYRegex = /^(0[1-9]|1[0-2])-\d{4}$/;

  const sanitizePlainText = (val: string) => val.replace(/[^A-Za-z0-9 ]/g, "");

  const isValidImageFile = (file: File) => {
    if (!allowedImageTypes.includes(file.type)) {
      alert("Only PNG and JPG images are allowed.");
      return false;
    }

    if (file.size > maxImageSizeBytes) {
      alert("Image size must be 5 MB or less.");
      return false;
    }

    return true;
  };

  const formatDuration = (startDate?: string, endDate?: string) => {
    const start = (startDate || "").trim();
    const end = (endDate || "").trim();
    if (start && end) return `${start} - ${end}`;
    return start || end || "";
  };

  const splitDuration = (duration: string) => {
    const [start = "", end = ""] = duration.split(/\s+-\s+/);
    return {
      startDate: mmYYYYRegex.test(start.trim()) ? start.trim() : "",
      endDate: mmYYYYRegex.test(end.trim()) ? end.trim() : "",
    };
  };

  const getExperienceDate = (exp: Experience, field: "startDate" | "endDate") =>
    exp[field] || splitDuration(exp.duration)[field];

  const handleUpdateExperienceDate = (index: number, field: "startDate" | "endDate", val: string) => {
    const updated = [...experiences];
    const current = updated[index];
    const dates = {
      startDate: getExperienceDate(current, "startDate"),
      endDate: getExperienceDate(current, "endDate"),
      [field]: val,
    };
    updated[index] = {
      ...current,
      ...dates,
      duration: formatDuration(dates.startDate, dates.endDate),
    };
    setExperiences(updated);
  };

  // Projects helpers
  const handleAddProject = () => {
    setProjects([...projects, { title: "", description: "", link: "", tech: "" }]);
  };

  const handleUpdateProject = (index: number, field: keyof Project, val: string) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: val };
    setProjects(updated);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // Experience helpers
  const handleAddExperience = () => {
    setExperiences([...experiences, { role: "", company: "", startDate: "", endDate: "", duration: "", details: "" }]);
  };

  const handleUpdateExperience = (index: number, field: keyof Experience, val: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: val };
    setExperiences(updated);
  };

  const handleRemoveExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  // Skills helpers
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter((s) => s !== skillName));
  };

  const handleAddProcessStep = () => {
    setDesignProcess([...designProcess, { title: "", description: "" }]);
  };

  const handleUpdateProcessStep = (index: number, field: keyof DesignProcessStep, val: string) => {
    const updated = [...designProcess];
    updated[index] = { ...updated[index], [field]: val };
    setDesignProcess(updated);
  };

  const handleRemoveProcessStep = (index: number) => {
    setDesignProcess(designProcess.filter((_, i) => i !== index));
  };

  const handleAddCaseStudy = () => {
    setCaseStudies([
      ...caseStudies,
      { title: "", subtitle: "", description: "", imageUrl: "", link: "", role: "" },
    ]);
  };

  const handleUpdateCaseStudy = (index: number, field: keyof CaseStudy, val: string) => {
    const updated = [...caseStudies];
    updated[index] = { ...updated[index], [field]: val };
    setCaseStudies(updated);
  };

  const handleRemoveCaseStudy = (index: number) => {
    setCaseStudies(caseStudies.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header / Actions Row (Sticky top bar) */}
      <div className="sticky top-0 -mt-6 -mx-6 px-6 pt-6 pb-4 bg-gray-50 z-20 border-b border-gray-200 shadow-sm flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolios
        </button>

        <div className="flex items-center gap-2">
          {importSuccess && (
            <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg font-semibold animate-fade-in border border-violet-100">
              <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" />
              Imported Profile Data!
            </span>
          )}
          {success && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-semibold animate-fade-in border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved Successfully!
            </span>
          )}
          {onImportFromProfile && (
            <button
              onClick={onImportFromProfile}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-violet-200 bg-white hover:bg-violet-50 text-violet-600 font-bold text-xs transition shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              )}
              Import from Profile
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving || !portfolioName.trim()}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white font-bold text-xs transition shadow-md shadow-violet-200 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-150 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
          {error}
        </div>
      )}

      {/* Section 1: Core Configuration */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Globe className="w-4 h-4 text-violet-500" />
          General Information
        </h2>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            Portfolio Name
          </label>
          <input
            type="text"
            maxLength={nameMax}
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            placeholder="e.g. Himanshu's Interactive Workspace"
            className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white placeholder-gray-400 transition"
          />
          <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-medium">
            <span>Recruiters will see this name</span>
            <span>
              {portfolioName.length}/{nameMax}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            Portfolio Description
          </label>
          <textarea
            maxLength={descMax}
            value={portfolioDescription}
            onChange={(e) => setPortfolioDescription(e.target.value)}
            placeholder="Describe your professional field, background, accomplishments, or career goals..."
            rows={5}
            className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white placeholder-gray-400 transition resize-y"
          />
          <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-medium">
            <span>Summary of your professional field</span>
            <span>
              {portfolioDescription.length}/{descMax}
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Appearance */}
      {["developer", "designer"].includes(portfolioType) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-500" />
            Portfolio Theme
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Curated Color Palettes
            </label>
            <p className="text-[11px] text-gray-400 mb-3">
              Saved with this portfolio and used by the live preview and public portfolio page.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {palettePresets.map((palette) => {
                const isActive =
                  themeColor.toLowerCase() === palette.themeColor.toLowerCase() &&
                  backgroundColor.toLowerCase() === palette.backgroundColor.toLowerCase();

                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => {
                      setThemeColor(palette.themeColor);
                      setBackgroundColor(palette.backgroundColor);
                    }}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition cursor-pointer ${
                      isActive
                        ? "border-violet-400 bg-violet-50"
                        : "border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-xs font-bold text-gray-700">{palette.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-md border border-gray-200"
                        style={{ backgroundColor: palette.backgroundColor }}
                        title="Background"
                      />
                      <span
                        className="w-5 h-5 rounded-md border border-gray-200"
                        style={{ backgroundColor: palette.themeColor }}
                        title="Theme"
                      />
                      <span
                        className="w-5 h-5 rounded-md border border-gray-200"
                        style={{ backgroundColor: palette.accent2 }}
                        title="Accent"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Theme Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="h-10 w-12 rounded-lg border border-gray-200 bg-white cursor-pointer"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#4f46e5"
                  className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-10 w-12 rounded-lg border border-gray-200 bg-white cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#0a0f1e"
                  className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Social Links */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          Contact & Profiles
        </h2>

        {/* Profile Image Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
            Upload Profile Image
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (!isValidImageFile(file)) {
                  e.target.value = "";
                  return;
                }
                try {
                  const result = await uploadToCloudinary(file);
                  setProfileImageUrl(result.url);
                } catch (err) {
                  console.error('Profile image upload failed', err);
                }
              }
            }}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          />
          {profileImageUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img src={profileImageUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              <p className="text-xs text-gray-600">Uploaded Profile Image</p>
            </div>
          )}
        </div>

        {/* CV Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
            Upload CV (PDF)
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const result = await uploadPdfToCloudinary(file);
                  setCvUrl(result.url);
                } catch (err) {
                  console.error('CV upload failed', err);
                }
              }
            }}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          />
          {cvUrl && (
            <p className="mt-2 text-xs text-gray-600">Uploaded CV: <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="underline text-violet-600 font-medium">View CV</a></p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <Mail className="w-3.5 h-3.5 text-rose-500" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <Github className="w-3.5 h-3.5 text-gray-600" /> GitHub URL
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              maxLength={linkMax}
              onBlur={() => {
                if (githubUrl.trim() && !/^https?:\/\//i.test(githubUrl.trim())) {
                  setGithubUrl(`https://${githubUrl.trim()}`);
                }
              }}
              placeholder="https://github.com/..."
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn URL
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              maxLength={linkMax}
              onBlur={() => {
                if (linkedinUrl.trim() && !/^https?:\/\//i.test(linkedinUrl.trim())) {
                  setLinkedinUrl(`https://${linkedinUrl.trim()}`);
                }
              }}
              placeholder="https://linkedin.com/in/..."
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <Twitter className="w-3.5 h-3.5 text-sky-500" /> Twitter URL
            </label>
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              maxLength={linkMax}
              onBlur={() => {
                if (twitterUrl.trim() && !/^https?:\/\//i.test(twitterUrl.trim())) {
                  setTwitterUrl(`https://${twitterUrl.trim()}`);
                }
              }}
              placeholder="https://twitter.com/..."
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-violet-600" /> Custom Domain
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              maxLength={linkMax}
              onBlur={() => {
                if (customUrl.trim() && !/^https?:\/\//i.test(customUrl.trim())) {
                  setCustomUrl(`https://${customUrl.trim()}`);
                }
              }}
              placeholder="https://mywebsite.com"
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white"
            />
          </div>
          {portfolioType === "designer" && (
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                  <Link2 className="w-3.5 h-3.5 text-blue-700" /> Behance URL
                </label>
                <input
                  type="url"
                  value={behanceUrl}
                  onChange={(e) => setBehanceUrl(e.target.value)}
                  maxLength={linkMax}
                  onBlur={() => {
                    if (behanceUrl.trim() && !/^https?:\/\//i.test(behanceUrl.trim())) {
                      setBehanceUrl(`https://${behanceUrl.trim()}`);
                    }
                  }}
                  placeholder="https://behance.net/..."
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Dribbble URL
                </label>
                <input
                  type="url"
                  value={dribbbleUrl}
                  onChange={(e) => setDribbbleUrl(e.target.value)}
                  maxLength={linkMax}
                  onBlur={() => {
                    if (dribbbleUrl.trim() && !/^https?:\/\//i.test(dribbbleUrl.trim())) {
                      setDribbbleUrl(`https://${dribbbleUrl.trim()}`);
                    }
                  }}
                  placeholder="https://dribbble.com/..."
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 3: Skills */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-violet-500" />
          Technical & Core Skills
        </h2>
        <form onSubmit={handleAddSkill} className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="e.g. JavaScript, UI Design, AWS"
            className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-900 transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </form>
        <div className="flex flex-wrap gap-2 pt-1">
          {skills.length === 0 ? (
            <span className="text-xs text-gray-400">No skills added yet.</span>
          ) : (
            skills.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-red-50 hover:text-red-600 transition duration-150 cursor-pointer"
                onClick={() => handleRemoveSkill(s)}
                title="Click to remove"
              >
                {s} <X className="w-3 h-3 text-gray-400 hover:text-red-500 shrink-0" />
              </span>
            ))
          )}
        </div>
      </div>

      {portfolioType === "designer" && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-violet-500" />
                UX Design Process
              </h2>
              <button
                onClick={handleAddProcessStep}
                className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>

            {designProcess.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                <p className="text-xs text-gray-400 font-medium">No process steps added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {designProcess.map((step, idx) => (
                  <div key={idx} className="p-4 border border-gray-150 rounded-xl space-y-3 relative">
                    <button
                      onClick={() => handleRemoveProcessStep(idx)}
                      className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Remove process step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="pr-8">
                      <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                        Step Title
                      </label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleUpdateProcessStep(idx, "title", e.target.value)}
                        placeholder="e.g. Research, Wireframe, Prototype"
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                        Step Description
                      </label>
                      <textarea
                        value={step.description}
                        onChange={(e) => handleUpdateProcessStep(idx, "description", e.target.value)}
                        placeholder="Describe what happens in this phase of your design process..."
                        rows={3}
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 resize-y"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Image className="w-4 h-4 text-violet-500" />
                Case Studies
              </h2>
              <button
                onClick={handleAddCaseStudy}
                className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Case Study
              </button>
            </div>

            {caseStudies.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                <p className="text-xs text-gray-400 font-medium">No case studies added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {caseStudies.map((study, idx) => (
                  <div key={idx} className="p-4 border border-gray-150 rounded-xl space-y-3 relative">
                    <button
                      onClick={() => handleRemoveCaseStudy(idx)}
                      className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Remove case study"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                          Case Study Title
                        </label>
                        <input
                          type="text"
                          value={study.title}
                          onChange={(e) => handleUpdateCaseStudy(idx, "title", e.target.value)}
                          placeholder="e.g. Mobile Banking Redesign"
                          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                          Role
                        </label>
                        <input
                          type="text"
                          value={study.role}
                          onChange={(e) => handleUpdateCaseStudy(idx, "role", e.target.value)}
                          placeholder="e.g. UX Research, UI Design"
                          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                        Short Subtitle
                      </label>
                      <input
                        type="text"
                        value={study.subtitle}
                        onChange={(e) => handleUpdateCaseStudy(idx, "subtitle", e.target.value)}
                        placeholder="e.g. Improving onboarding conversion for first-time users"
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                        Description
                      </label>
                      <RichTextEditor
                        value={study.description}
                        onChange={(val) => handleUpdateCaseStudy(idx, "description", val)}
                        placeholder="Problem, process, solution, and outcome..."
                        minHeight="90px"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                          Cover Image
                        </label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!isValidImageFile(file)) {
                              e.target.value = "";
                              return;
                            }
                            try {
                              const result = await uploadToCloudinary(file);
                              handleUpdateCaseStudy(idx, "imageUrl", result.url);
                            } catch (err) {
                              console.error("Case study image upload failed", err);
                            }
                          }}
                          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                        />
                        {study.imageUrl && (
                          <img
                            src={study.imageUrl}
                            alt={study.title || "Case study cover"}
                            className="mt-2 w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                          Case Study URL
                        </label>
                        <input
                          type="url"
                          value={study.link}
                          onChange={(e) => handleUpdateCaseStudy(idx, "link", e.target.value)}
                          maxLength={linkMax}
                          placeholder="https://..."
                          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Section 4: Projects */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-violet-500" />
            Featured Projects
          </h2>
          <button
            onClick={handleAddProject}
            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
            <p className="text-xs text-gray-400 font-medium">No projects added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((p, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-150 rounded-xl space-y-3 relative group"
              >
                <button
                  onClick={() => handleRemoveProject(idx)}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  title="Remove project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={p.title}
                      onChange={(e) => handleUpdateProject(idx, "title", sanitizePlainText(e.target.value))}
                      placeholder="e.g. Crypto Tracker"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      Tech Stack
                    </label>
                    <input
                      type="text"
                      value={p.tech}
                      onChange={(e) => handleUpdateProject(idx, "tech", sanitizePlainText(e.target.value).slice(0, techStackMax))}
                      maxLength={techStackMax}
                      placeholder="e.g. React Node AWS"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                    Description
                  </label>
                  <RichTextEditor
                    value={p.description}
                    onChange={(val) => handleUpdateProject(idx, "description", val)}
                    placeholder="Detailed description of the build..."
                    minHeight="80px"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                    Demo or Repository URL
                  </label>
                  <input
                    type="url"
                    value={p.link}
                    onChange={(e) => handleUpdateProject(idx, "link", e.target.value)}
                    maxLength={linkMax}
                    placeholder="https://..."
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Experience */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-violet-500" />
            Work Experience
          </h2>
          <button
            onClick={handleAddExperience}
            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Experience
          </button>
        </div>

        {experiences.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
            <p className="text-xs text-gray-400 font-medium">No experience cards added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-150 rounded-xl space-y-3 relative group"
              >
                <button
                  onClick={() => handleRemoveExperience(idx)}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  title="Remove work experience"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pr-8">
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      Role / Job Title
                    </label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => handleUpdateExperience(idx, "role", sanitizePlainText(e.target.value).slice(0, experienceTextMax))}
                      maxLength={experienceTextMax}
                      placeholder="e.g. Lead Engineer"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      Company
                    </label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => handleUpdateExperience(idx, "company", sanitizePlainText(e.target.value).slice(0, experienceTextMax))}
                      maxLength={experienceTextMax}
                      placeholder="e.g. Bowizzy Inc"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      Start Date
                    </label>
                    <input
                      type="text"
                      value={getExperienceDate(exp, "startDate")}
                      onChange={(e) => handleUpdateExperienceDate(idx, "startDate", e.target.value)}
                      placeholder="MM-YYYY"
                      maxLength={7}
                      pattern="(0[1-9]|1[0-2])-[0-9]{4}"
                      title="Use MM-YYYY format, e.g. 04-2024"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      End Date
                    </label>
                    <input
                      type="text"
                      value={getExperienceDate(exp, "endDate")}
                      onChange={(e) => handleUpdateExperienceDate(idx, "endDate", e.target.value)}
                      placeholder="MM-YYYY"
                      maxLength={7}
                      pattern="(0[1-9]|1[0-2])-[0-9]{4}"
                      title="Use MM-YYYY format, e.g. 05-2026"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                    Key Responsibilities or Achievements
                  </label>
                  <RichTextEditor
                    value={exp.details}
                    onChange={(val) => handleUpdateExperience(idx, "details", val)}
                    placeholder="Detailed achievements and key responsibilities..."
                    minHeight="100px"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
