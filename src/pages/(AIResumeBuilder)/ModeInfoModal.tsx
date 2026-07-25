import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquareText,
  ListChecks,
  PencilOff,
  AlertTriangle,
  FileSearch,
  Pencil,
  Sparkles,
  Bot,
} from "lucide-react";

interface GuidePoint {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const AI_MODE_POINTS: GuidePoint[] = [
  {
    icon: <MessageSquareText className="w-4 h-4" />,
    title: "It's a guided Q&A, not a chatbot",
    text: "The assistant asks the questions and you provide the answers. It isn't designed to respond to questions you ask it in return.",
  },
  {
    icon: <ListChecks className="w-4 h-4" />,
    title: "Detail drives quality",
    text: "The more specific and complete your answers are, the stronger the resume content generated for you will be.",
  },
  {
    icon: <PencilOff className="w-4 h-4" />,
    title: "Answers are final once sent",
    text: "A submitted answer cannot be edited or retracted, so please review each response carefully before sending it.",
  },
  {
    icon: <AlertTriangle className="w-4 h-4" />,
    title: "Always review the result",
    text: "The AI works hard to get things right, but it can occasionally be inaccurate. Verify your details before downloading.",
  },
];

const JD_MODE_POINTS: GuidePoint[] = [
  {
    icon: <FileSearch className="w-4 h-4" />,
    title: "Tailored to your job description",
    text: "Paste the job description and the assistant extracts your existing details, then enhances them to align with the role.",
  },
  {
    icon: <Pencil className="w-4 h-4" />,
    title: "Edit before you confirm",
    text: "Every extracted field is editable — but once you choose Save & Continue, your entries are locked in and cannot be changed.",
  },
  {
    icon: <AlertTriangle className="w-4 h-4" />,
    title: "Always review the result",
    text: "The AI works hard to get things right, but it can occasionally be inaccurate. Verify your details before downloading.",
  },
];

interface ModeInfoModalProps {
  /** The mode to explain — `null` keeps the modal closed. */
  mode: "jd" | "non-jd" | null;
  onClose: () => void;
}

const ModeInfoModal: React.FC<ModeInfoModalProps> = ({ mode, onClose }) => {
  const isJd = mode === "jd";
  const points = isJd ? JD_MODE_POINTS : AI_MODE_POINTS;

  return (
    <AnimatePresence>
      {mode && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl pointer-events-auto"
              style={{
                background: "linear-gradient(145deg, #ffffff 0%, #fff7f3 100%)",
                border: "1px solid rgba(249,115,22,0.15)",
              }}
            >
              {/* Header band */}
              <div
                className="px-5 pt-5 pb-4"
                style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
              >
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center shrink-0">
                    {isJd ? (
                      <Sparkles className="w-5 h-5 text-orange-400" />
                    ) : (
                      <Bot className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-base leading-tight">
                      {isJd ? "JD Mode — How it works" : "AI Mode — How it works"}
                    </h2>
                    <p className="text-white/50 text-xs leading-tight mt-0.5">
                      {isJd
                        ? "Match your resume to a specific job description"
                        : "A guided interview that builds your resume"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="p-4 flex flex-col gap-2.5">
                {points.map((point) => (
                  <div
                    key={point.title}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-gray-100"
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                      {point.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{point.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{point.text}</p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={onClose}
                  className="w-full mt-1 py-3 rounded-2xl text-white font-bold text-sm transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #F97316 0%, #ea580c 100%)",
                    boxShadow: "0 8px 24px rgba(249,115,22,0.35)",
                  }}
                >
                  Got it — let's begin
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModeInfoModal;
