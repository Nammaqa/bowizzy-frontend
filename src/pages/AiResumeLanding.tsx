import React, { useState } from "react";
import DashNav from "@/components/dashnav/dashnav";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  FileText,
  Target,
  Zap,
  CheckCircle2,
  Upload,
  X,
  User,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { getProfileProgress } from "@/services/dashboardServices";

const features = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Instant AI suggestions",
    desc: "Get bullet-point rewrites, skill highlights, and tone fixes in seconds.",
    color: "bg-amber-50 text-amber-700",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Section-by-section polish",
    desc: "Chat naturally — ask to strengthen experience, summary, or skills individually.",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "ATS-friendly language",
    desc: "AI rewrites your content with keywords recruiters and ATS systems look for.",
    color: "bg-purple-50 text-purple-700",
  },
];

const jdBenefits = [
  "Keyword matching score vs. the job description",
  "Missing skills flagged with suggestions to address gaps",
  "Summary rewritten to mirror the role's language",
  "Bullet points reordered by relevance to the JD",
];

const profilePerks = [
  "Work experience & projects pre-filled",
  "Skills and certifications auto-loaded",
  "No manual copy-paste from old resumes",
  "AI has full context — smarter suggestions",
];

function ProfilePopup({
  onClose,
  onContinueWithProfile,
  onContinueWithout,
}: {
  onClose: () => void;
  onContinueWithProfile: () => void;
  onContinueWithout: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-orange-500" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  You're one step away
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  A quick tip before you start
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main message */}
          <div className="bg-orange-50 rounded-xl border border-orange-100 px-4 py-3 mb-5">
            <p className="text-sm text-orange-800 font-medium leading-relaxed">
              Filling your profile first lets AI generate a resume{" "}
              <span className="font-bold">3× faster</span> — with no blank
              fields or guesswork.
            </p>
          </div>

          {/* Perks */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            With a complete profile, you get
          </p>
          <ul className="space-y-2 mb-6">
            {profilePerks.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-sm text-gray-700">{p}</span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onContinueWithProfile}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition cursor-pointer"
            >
              Complete my profile first
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onContinueWithout}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
            >
              Continue without profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiResumeLanding() {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  // Which button is mid-flight, so only that one shows a spinner.
  const [loadingMode, setLoadingMode] = useState<"jd" | "non-jd" | null>(null);
  // Remembered while the profile pop-up is open, so "Continue without profile"
  // lands in the mode the user originally picked.
  const [pendingMode, setPendingMode] = useState<"jd" | "non-jd">("non-jd");
  const isLoading = loadingMode !== null;

  const goToBuilder = (mode: "jd" | "non-jd") => {
    // JD mode is passed via navigation state — the builder applies it to the
    // active session on arrival.
    navigate("/ai-resume-builder/chat", mode === "jd" ? { state: { mode } } : undefined);
  };

  const handleStartBuilding = async (mode: "jd" | "non-jd" = "non-jd") => {
    setPendingMode(mode);
    try {
      setLoadingMode(mode);
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const token = user?.token;
      const userId = user?.id || user?.user_id || user?.userId;

      if (!token || !userId) {
        setShowPopup(true);
        return;
      }

      const data = await getProfileProgress(userId, token);

      if (data && data.percentage > 80) {
        goToBuilder(mode);
      } else {
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Failed to fetch profile progress", error);
      setShowPopup(true);
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DashNav heading="AI Resume Builder" />

      {showPopup && (
        <ProfilePopup
          onClose={() => setShowPopup(false)}
          onContinueWithProfile={() => {
            setShowPopup(false);
            navigate("/profile");
          }}
          onContinueWithout={() => {
            setShowPopup(false);
            goToBuilder(pendingMode);
          }}
        />
      )}

      <main className="flex-1 px-4 py-10 sm:py-16 max-w-3xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full bg-orange-100 text-orange-700 mb-4">
            AI-powered
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            Generate great resumes{" "}
            <span className="text-orange-500">with ease</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Upload your resume, chat with AI, and get a polished, job-ready
            document in minutes — no templates, no friction.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button
              onClick={() => handleStartBuilding("non-jd")}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition cursor-pointer disabled:opacity-70"
            >
              {loadingMode === "non-jd" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              AI Builder
              {/* {!isLoading && <ArrowRight className="w-4 h-4" />} */}
            </button>
            <button
              onClick={() => handleStartBuilding("jd")}
              disabled={isLoading}
              style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm hover:brightness-125 transition cursor-pointer disabled:opacity-70"
            >
              {loadingMode === "jd" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              JD Based AI Builder
            </button>
            <button
              onClick={() => navigate("/ResumeBuilder")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm bg-white hover:bg-gray-50 transition cursor-pointer"
            >
              Classic builder
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${f.color}`}
              >
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {f.title}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* JD Mode highlight */}
        <div className="bg-white rounded-2xl border-2 border-orange-200 p-6 sm:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
                JD Mode — best results
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-3 mb-2">
              Paste a job description, get a tailored resume
            </h2>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed max-w-lg">
              When you provide the job description, our AI doesn't just polish —
              it surgically rewrites your resume to match that specific role.
              Here's what you unlock:
            </p>

            <ul className="space-y-2.5 mb-6">
              {jdBenefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-700">{b}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleStartBuilding("jd")}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition cursor-pointer disabled:opacity-70"
            >
              {loadingMode === "jd" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Try with a job description
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
            How it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", label: "Upload your resume", sub: "PDF, DOC, or paste text" },
              { step: "2", label: "Add a job description", sub: "Optional — but powerful" },
              { step: "3", label: "Chat & download", sub: "Iterate until it's perfect" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-orange-600">
                    {item.step}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Your data stays private &nbsp;·&nbsp; No signup required for preview
        </p>
      </main>
    </div>
  );
}