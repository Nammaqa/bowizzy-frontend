import React, { useState, useEffect } from "react";
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
  Phone,
  Award,
  Trophy,
  Languages,
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import ImageCropModal from "./ImageCropModal";

interface Project {
  title: string;
  description: string;
  link: string;
  tech: string;
  imageUrl?: string;
  imagePublicId?: string;
  imageDeleteToken?: string | null;
}

interface Experience {
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  duration: string;
  details: string;
  currentlyWorking?: boolean;
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
  imagePublicId?: string;
  imageDeleteToken?: string | null;
  link: string;
  role: string;
}

interface Certification {
  name: string;
  issuer: string;
  year: string;
  link?: string;
}

interface Achievement {
  title: string;
  description: string;
}

interface UploadedAsset {
  url: string;
  publicId?: string | null;
  deleteToken?: string | null;
}

export interface PortfolioEditorComponentProps {
  portfolioName: string;
  setPortfolioName: (val: string) => void;
  portfolioDescription: string;
  setPortfolioDescription: (val: string) => void;
  aboutTitle: string;
  setAboutTitle: (val: string) => void;
  aboutDescription: string;
  setAboutDescription: (val: string) => void;
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
  onCvUploaded?: (asset: UploadedAsset) => Promise<void>;
  onCvRemoved?: () => Promise<void>;
  profileImageUrl: string;
  setProfileImageUrl: (val: string) => void;
  onProfileImageUploaded?: (asset: UploadedAsset) => Promise<void>;
  onProfileImageRemoved?: () => Promise<void>;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
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
  onCaseStudyImageUploaded?: (index: number, asset: UploadedAsset) => Promise<void>;
  onCaseStudyImageRemoved?: (index: number) => Promise<void>;

  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onProjectImageUploaded?: (index: number, asset: UploadedAsset) => Promise<void>;
  onProjectImageRemoved?: (index: number) => Promise<void>;
  experiences: Experience[];
  setExperiences: React.Dispatch<React.SetStateAction<Experience[]>>;
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
  certifications: Certification[];
  setCertifications: React.Dispatch<React.SetStateAction<Certification[]>>;
  languages: string[];
  setLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  achievements: Achievement[];
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;

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
  aboutTitle,
  setAboutTitle,
  aboutDescription,
  setAboutDescription,
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
  onCvUploaded,
  onCvRemoved,
  profileImageUrl,
  setProfileImageUrl,
  onProfileImageUploaded,
  onProfileImageRemoved,
  email,
  setEmail,
  phone,
  setPhone,
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
  onCaseStudyImageUploaded,
  onCaseStudyImageRemoved,
  projects,
  setProjects,
  onProjectImageUploaded,
  onProjectImageRemoved,
  experiences,
  setExperiences,
  skills,
  setSkills,
  certifications,
  setCertifications,
  languages,
  setLanguages,
  achievements,
  setAchievements,
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
  const [newLanguage, setNewLanguage] = useState("");
  const [removingProfileImage, setRemovingProfileImage] = useState(false);
  const [removingCv, setRemovingCv] = useState(false);
  const [removingCaseStudyImageIndex, setRemovingCaseStudyImageIndex] = useState<number | null>(null);
  const [removingProjectImageIndex, setRemovingProjectImageIndex] = useState<number | null>(null);
  const [uploadingProjectImageIndex, setUploadingProjectImageIndex] = useState<number | null>(null);
  // Holds the picked file while the crop dialog is open — nothing is sent to
  // Cloudinary until the user confirms the crop.
  const [profileImageToCrop, setProfileImageToCrop] = useState<File | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  // Block drag and drop into text fields in the portfolio editor
  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (
        (target.tagName === "INPUT" && (target as HTMLInputElement).type !== "file") ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("drop", handleDrop, { capture: true });
    return () => {
      document.removeEventListener("drop", handleDrop, { capture: true });
    };
  }, []);
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
  const maxImageSizeBytes = 5 * 1024 * 1024;
  const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];
  const mmYYYYRegex = /^(0[1-9]|1[0-2])-\d{4}$/;

  const pad = (n: number) => String(n).padStart(2, "0");
  const monthOffset = (years: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  };
  const minMonth = monthOffset(-60); // 60 years back
  const maxMonth = monthOffset(40); // 40 years ahead

  const isValidImageFile = (file: File) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const isTypeAllowed = allowedImageTypes.includes(file.type);
    const fileName = file.name.toLowerCase();
    const isExtensionAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isTypeAllowed && !isExtensionAllowed) {
      alert("Only PNG, JPG, JPEG, and WEBP images are allowed.");
      return false;
    }

    if (file.size > maxImageSizeBytes) {
      alert("Image size must be 5 MB or less.");
      return false;
    }

    return true;
  };

  const formatDuration = (startDate?: string, endDate?: string, currentlyWorking?: boolean) => {
    let start = (startDate || "").trim();
    let end = (endDate || "").trim();
    if (/^\d{2}-\d{4}$/.test(start)) start = start.replace("-", " - ");
    if (/^\d{2}-\d{4}$/.test(end)) end = end.replace("-", " - ");
    if (currentlyWorking) return start ? `${start} - Present` : "Present";
    if (start && end) return `${start} - ${end}`;
    return start || end || "";
  };

  const normalizeMonthYear = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      const [year, month] = trimmed.split("-");
      return `${month} - ${year}`;
    }
    return trimmed;
  };

  const toMonthInputValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const match = trimmed.match(/^(\d{2})\s*-\s*(\d{4})$/);
    if (match) {
      return `${match[2]}-${match[1]}`;
    }
    return trimmed;
  };

  const splitDuration = (duration: string) => {
    const match = duration.match(/^(\d{2}\s*-\s*\d{4})(?:\s*-\s*(\d{2}\s*-\s*\d{4}))?$/);
    if (match) {
      const start = match[1] || "";
      const end = match[2] || "";
      return {
        startDate: mmYYYYRegex.test(start) ? start : "",
        endDate: mmYYYYRegex.test(end) ? end : "",
      };
    }
    const parts = duration.split(/\s+-\s+/);
    if (parts.length === 2 && mmYYYYRegex.test(parts[0]) && mmYYYYRegex.test(parts[1])) {
       return { startDate: parts[0], endDate: parts[1] };
    }
    return { startDate: "", endDate: "" };
  };

  const getExperienceDate = (exp: Experience, field: "startDate" | "endDate") =>
    exp[field] || splitDuration(exp.duration)[field];

  const handleUpdateExperienceDate = (index: number, field: "startDate" | "endDate", val: string) => {
    const normalizedValue = normalizeMonthYear(val);
    const updated = [...experiences];
    const current = updated[index];
    const dates = {
      startDate: getExperienceDate(current, "startDate"),
      endDate: getExperienceDate(current, "endDate"),
      [field]: normalizedValue,
    };
    updated[index] = {
      ...current,
      ...dates,
      duration: formatDuration(dates.startDate, dates.endDate, current.currentlyWorking),
    };
    setExperiences(updated);
  };

  // Projects helpers
  const handleAddProject = () => {
    setProjects([...projects, { title: "", description: "", link: "", tech: "", imageUrl: "" }]);
  };

  const handleUpdateProject = (index: number, field: keyof Project, val: string) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: val };
    setProjects(updated);
  };

  const removeProjectImage = async (index: number) => {
    try {
      setRemovingProjectImageIndex(index);
      if (onProjectImageRemoved) {
        await onProjectImageRemoved(index);
      } else {
        handleUpdateProject(index, "imageUrl", "");
      }
    } catch (err) {
      console.error("Project image removal failed", err);
      alert("Unable to remove project image right now.");
    } finally {
      setRemovingProjectImageIndex(null);
    }
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // Experience helpers
  const handleAddExperience = () => {
    setExperiences([...experiences, { role: "", company: "", startDate: "", endDate: "", duration: "", details: "" }]);
  };

  const handleUpdateExperience = (index: number, field: keyof Experience, val: any) => {
    let updated = [...experiences];
    if (field === "currentlyWorking") {
      const isChecked = val === true;
      updated = updated.map((exp, i) => {
        if (i === index) {
          if (isChecked) {
            const start = getExperienceDate(exp, "startDate");
            return {
              ...exp,
              currentlyWorking: true,
              endDate: "",
              duration: start ? `${start} - Present` : "Present"
            };
          }
          return { ...exp, currentlyWorking: false };
        }
        return { ...exp, currentlyWorking: isChecked ? false : exp.currentlyWorking };
      });
    } else {
      updated[index] = { ...updated[index], [field]: val };
    }
    setExperiences(updated);
  };

  const handleRemoveExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  // Skills helpers
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    setSkills([...skills, trimmed]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter((s) => s !== skillName));
  };

  // Languages helpers
  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLanguage.trim();
    if (!trimmed) return;
    setLanguages([...languages, trimmed]);
    setNewLanguage("");
  };

  const handleRemoveLanguage = (languageName: string) => {
    setLanguages(languages.filter((l) => l !== languageName));
  };

  // Certifications helpers
  const handleAddCertification = () => {
    setCertifications([...certifications, { name: "", issuer: "", year: "" }]);
  };

  const handleUpdateCertification = (index: number, field: keyof Certification, val: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: val };
    setCertifications(updated);
  };

  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Achievements helpers
  const handleAddAchievement = () => {
    setAchievements([...achievements, { title: "", description: "" }]);
  };

  const handleUpdateAchievement = (index: number, field: keyof Achievement, val: string) => {
    const updated = [...achievements];
    updated[index] = { ...updated[index], [field]: val };
    setAchievements(updated);
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
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

  const uploadProfileImage = async (croppedFile: File) => {
    try {
      setUploadingProfileImage(true);
      const result = await uploadToCloudinary(croppedFile);
      if (onProfileImageUploaded) {
        await onProfileImageUploaded(result);
      } else {
        setProfileImageUrl(result.url);
      }
      setProfileImageToCrop(null);
    } catch (err) {
      console.error("Profile image upload failed", err);
      alert("Unable to upload profile image right now. Please try again.");
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const removeProfileImage = async () => {
    try {
      setRemovingProfileImage(true);
      if (onProfileImageRemoved) {
        await onProfileImageRemoved();
      } else {
        setProfileImageUrl("");
      }
    } catch (err) {
      console.error("Profile image removal failed", err);
      alert("Unable to remove profile image right now.");
    } finally {
      setRemovingProfileImage(false);
    }
  };

  const removeCv = async () => {
    try {
      setRemovingCv(true);
      if (onCvRemoved) {
        await onCvRemoved();
      } else {
        setCvUrl("");
      }
    } catch (err) {
      console.error("CV removal failed", err);
      alert("Unable to remove CV right now.");
    } finally {
      setRemovingCv(false);
    }
  };

  const removeCaseStudyImage = async (index: number) => {
    try {
      setRemovingCaseStudyImageIndex(index);
      if (onCaseStudyImageRemoved) {
        await onCaseStudyImageRemoved(index);
      } else {
        handleUpdateCaseStudy(index, "imageUrl", "");
      }
    } catch (err) {
      console.error("Case study image removal failed", err);
      alert("Unable to remove case study image right now.");
    } finally {
      setRemovingCaseStudyImageIndex(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {profileImageToCrop && (
        <ImageCropModal
          file={profileImageToCrop}
          title="Crop profile image"
          shape="circle"
          busy={uploadingProfileImage}
          onCancel={() => {
            if (uploadingProfileImage) return;
            setProfileImageToCrop(null);
          }}
          onCropped={uploadProfileImage}
        />
      )}

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

      {/* Section: About */}
      {portfolioType === "designer" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <PenTool className="w-4 h-4 text-violet-500" />
            About Section
          </h2>
          <p className="text-[11px] text-gray-400 -mt-2">
            Replaces the default heading and text in the About block of your portfolio.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              About Title
            </label>
            <input
              type="text"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              placeholder="e.g. Design with a product brain and a visual point of view."
              className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white placeholder-gray-400 transition"
            />
            <div className="mt-1 text-[10px] text-gray-400 font-medium">
              <span>Headline shown beside the About label</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              About Description
            </label>
            <textarea
              value={aboutDescription}
              onChange={(e) => setAboutDescription(e.target.value)}
              placeholder="Tell recruiters how you work, what you care about, and the kind of problems you solve..."
              rows={5}
              className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white placeholder-gray-400 transition resize-y"
            />
            <div className="mt-1 text-[10px] text-gray-400 font-medium">
              <span>Leave empty to reuse the portfolio description</span>
            </div>
          </div>
        </div>
      )}

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
          {profileImageUrl ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-2">
              <div className="flex items-center gap-2">
              <img src={profileImageUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              <p className="text-xs text-gray-600">Uploaded Profile Image</p>
              </div>
              <button
                type="button"
                onClick={removeProfileImage}
                disabled={removingProfileImage}
                className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              >
                {removingProfileImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Remove
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingProfileImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  // Always clear the input so re-picking the same file still fires.
                  e.target.value = "";
                  if (!file) return;
                  if (!isValidImageFile(file)) return;
                  setProfileImageToCrop(file);
                }}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 disabled:opacity-60"
              />
              {uploadingProfileImage ? (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-violet-600">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-gray-400 font-medium">
                  You'll be able to crop the image before it's uploaded.
                </p>
              )}
            </>
          )}
        </div>

        {/* CV Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
            Upload CV (PDF)
          </label>
          {cvUrl ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-2">
              <p className="text-xs text-gray-600">Uploaded CV: <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="underline text-violet-600 font-medium">View CV</a></p>
              <button
                type="button"
                onClick={removeCv}
                disabled={removingCv}
                className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              >
                {removingCv ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Remove
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const result = await uploadPdfToCloudinary(file);
                    if (onCvUploaded) {
                      await onCvUploaded(result);
                    } else {
                      setCvUrl(result.url);
                    }
                  } catch (err) {
                    console.error('CV upload failed', err);
                  }
                }
              }}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <Mail className="w-3.5 h-3.5 text-rose-500" /> Email Address
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <Phone className="w-3.5 h-3.5 text-emerald-500" /> Contact Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-500 bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <Github className="w-3.5 h-3.5 text-gray-600" /> GitHub URL
            </label>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
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
              type="text"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
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
              type="text"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
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
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
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
                  type="text"
                  value={behanceUrl}
                  onChange={(e) => setBehanceUrl(e.target.value)}
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
                  type="text"
                  value={dribbbleUrl}
                  onChange={(e) => setDribbbleUrl(e.target.value)}
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

      {/* Section: Languages */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Languages className="w-4 h-4 text-violet-500" />
          Languages
        </h2>
        <form onSubmit={handleAddLanguage} className="flex gap-2">
          <input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="e.g. English, Hindi, Kannada"
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
          {languages.length === 0 ? (
            <span className="text-xs text-gray-400">No languages added yet.</span>
          ) : (
            languages.map((l, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-red-50 hover:text-red-600 transition duration-150 cursor-pointer"
                onClick={() => handleRemoveLanguage(l)}
                title="Click to remove"
              >
                {l} <X className="w-3 h-3 text-gray-400 hover:text-red-500 shrink-0" />
              </span>
            ))
          )}
        </div>
      </div>

      {/* Section: Certifications */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-500" />
            Certifications
          </h2>
          <button
            onClick={handleAddCertification}
            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Certification
          </button>
        </div>

        {certifications.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
            <p className="text-xs text-gray-400 font-medium">No certifications added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert, idx) => (
              <div key={idx} className="p-4 border border-gray-150 rounded-xl space-y-3 relative">
                <button
                  onClick={() => handleRemoveCertification(idx)}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  title="Remove certification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="pr-8">
                  <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                    Certification Name
                  </label>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => handleUpdateCertification(idx, "name", e.target.value)}
                    placeholder="e.g. AWS Certified Solutions Architect"
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      Issued By
                    </label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => handleUpdateCertification(idx, "issuer", e.target.value)}
                      placeholder="e.g. Amazon Web Services"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      Year
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cert.year}
                      onChange={(e) => handleUpdateCertification(idx, "year", e.target.value)}
                      placeholder="e.g. 2024"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                    Certification URL
                  </label>
                  <input
                    type="text"
                    value={cert.link || ""}
                    onChange={(e) => handleUpdateCertification(idx, "link", e.target.value)}
                    onBlur={() => {
                      const trimmed = (cert.link || "").trim();
                      if (trimmed && !/^https?:\/\//i.test(trimmed)) {
                        handleUpdateCertification(idx, "link", `https://${trimmed}`);
                      }
                    }}
                    placeholder="https://credential.example.com/..."
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  />
                  <div className="mt-1 text-[10px] text-gray-400 font-medium">
                    Link to the credential or verification page
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Achievements */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-violet-500" />
            Achievements
          </h2>
          <button
            onClick={handleAddAchievement}
            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Achievement
          </button>
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
            <p className="text-xs text-gray-400 font-medium">No achievements added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {achievements.map((achievement, idx) => (
              <div key={idx} className="p-4 border border-gray-150 rounded-xl space-y-3 relative">
                <button
                  onClick={() => handleRemoveAchievement(idx)}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  title="Remove achievement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="pr-8">
                  <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                    Achievement Title
                  </label>
                  <input
                    type="text"
                    value={achievement.title}
                    onChange={(e) => handleUpdateAchievement(idx, "title", e.target.value)}
                    placeholder="e.g. Winner, National Hackathon 2024"
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    value={achievement.description}
                    onChange={(e) => handleUpdateAchievement(idx, "description", e.target.value)}
                    placeholder="What did you accomplish, and why does it matter?"
                    rows={3}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 resize-y"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
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
                        {study.imageUrl && (
                          <div className="rounded-lg border border-gray-200 p-2">
                            <img
                              src={study.imageUrl}
                              alt={study.title || "Case study cover"}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeCaseStudyImage(idx)}
                              disabled={removingCaseStudyImageIndex === idx}
                              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                            >
                              {removingCaseStudyImageIndex === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                              Remove
                            </button>
                          </div>
                        )}
                        {!study.imageUrl && (
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!isValidImageFile(file)) {
                                e.target.value = "";
                                return;
                              }
                              try {
                                const result = await uploadToCloudinary(file);
                                if (onCaseStudyImageUploaded) {
                                  await onCaseStudyImageUploaded(idx, result);
                                } else {
                                  handleUpdateCaseStudy(idx, "imageUrl", result.url);
                                }
                              } catch (err) {
                                console.error("Case study image upload failed", err);
                              }
                            }}
                            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                          Case Study URL
                        </label>
                        <input
                          type="text"
                          value={study.link}
                          onChange={(e) => handleUpdateCaseStudy(idx, "link", e.target.value)}
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
                      onChange={(e) => handleUpdateProject(idx, "title", e.target.value)}
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
                      onChange={(e) => handleUpdateProject(idx, "tech", e.target.value)}
                      placeholder="e.g. React, Node, AWS"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      Demo or Repository URL
                    </label>
                    <input
                      type="text"
                      value={p.link}
                      onChange={(e) => handleUpdateProject(idx, "link", e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      Project Image
                    </label>
                    {p.imageUrl && (
                      <div className="rounded-lg border border-gray-200 p-2">
                        <img
                          src={p.imageUrl}
                          alt={p.title || "Project cover"}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeProjectImage(idx)}
                          disabled={removingProjectImageIndex === idx}
                          className="mt-2 inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          {removingProjectImageIndex === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Remove
                        </button>
                      </div>
                    )}
                    {!p.imageUrl && (
                      <>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={uploadingProjectImageIndex === idx}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!isValidImageFile(file)) {
                              e.target.value = "";
                              return;
                            }
                            try {
                              setUploadingProjectImageIndex(idx);
                              const result = await uploadToCloudinary(file);
                              if (onProjectImageUploaded) {
                                await onProjectImageUploaded(idx, result);
                              } else {
                                handleUpdateProject(idx, "imageUrl", result.url);
                              }
                            } catch (err) {
                              console.error("Project image upload failed", err);
                              alert("Unable to upload project image right now.");
                            } finally {
                              setUploadingProjectImageIndex(null);
                              e.target.value = "";
                            }
                          }}
                          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 disabled:opacity-60"
                        />
                        {uploadingProjectImageIndex === idx && (
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-violet-600">
                            <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                          </p>
                        )}
                      </>
                    )}
                  </div>
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
                      onChange={(e) => handleUpdateExperience(idx, "role", e.target.value)}
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
                      onChange={(e) => handleUpdateExperience(idx, "company", e.target.value)}
                      placeholder="e.g. Bowizzy Inc"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      Start Date
                    </label>
                    <input
                      type="month"
                      value={toMonthInputValue(getExperienceDate(exp, "startDate"))}
                      onChange={(e) => handleUpdateExperienceDate(idx, "startDate", e.target.value)}
                      title="Use month-year format, e.g. April 2024"
                      min={minMonth}
                      max={maxMonth}
                      onKeyDown={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      onInput={(e) => e.preventDefault()}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">
                      End Date
                    </label>
                    <input
                      type="month"
                      disabled={!!exp.currentlyWorking}
                      value={exp.currentlyWorking ? "" : toMonthInputValue(getExperienceDate(exp, "endDate"))}
                      onChange={(e) => handleUpdateExperienceDate(idx, "endDate", e.target.value)}
                      title="Use month-year format, e.g. May 2026"
                      min={minMonth}
                      max={maxMonth}
                      onKeyDown={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      onInput={(e) => e.preventDefault()}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/20 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1 mb-2">
                  <input
                    type="checkbox"
                    id={`currently-working-${idx}`}
                    checked={!!exp.currentlyWorking}
                    onChange={(e) => {
                      handleUpdateExperience(idx, "currentlyWorking", e.target.checked);
                    }}
                    className="w-3 h-3 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                  />
                  <label htmlFor={`currently-working-${idx}`} className="text-[11px] text-gray-500 font-medium">
                    Currently working here
                  </label>
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
