import React, { useState } from "react";
import { Menu, Sparkles, Wand2, Brain, Rocket, Plus } from "lucide-react";
import { motion } from "framer-motion";
import DashNav from "@/components/dashnav/dashnav";
import ChatList from "./Chatlist";
import ChatBox from "./Chatbox";
import type { DataChip } from "./DataChips";

import type { ChatSession, ChatMessage } from "./types";
import {
  createAiSession,
  deleteAiSession,
  getAiSessions,
  startAiSession,
  getSessionChats,
  createChat,
} from "@/services/aiResumeService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextSessionNumber(sessions: ChatSession[]): number {
  const nums = sessions
    .map((s) => {
      const match = s.title.match(/^Session (\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// ── Question generator ────────────────────────────────────────────────────────

function getQuestion(index: number, resumeData?: Record<string, unknown> | null): string {
  const data = (resumeData as Record<string, unknown>) || {};

  const hasProjects = Array.isArray(data.projects) && (data.projects as unknown[]).length > 0;
  const hasExperience = Array.isArray((data.work_experience as Record<string, unknown>)?.experiences)
    && ((data.work_experience as Record<string, unknown>).experiences as unknown[]).length > 0;
  const hasEducation = Array.isArray(data.education) && (data.education as unknown[]).length > 0;
  const hasSkills = Array.isArray(data.skills) && (data.skills as unknown[]).length > 0;
  const hasLinks = Array.isArray(data.links) && (data.links as unknown[]).length > 0;
  const hasCerts = Array.isArray(data.certificates) && (data.certificates as unknown[]).length > 0;

  switch (index) {
    case 0:
      return "Could you please share a brief introduction about yourself?";

    case 1:
      return hasProjects
        ? "Great! Are these your projects? Feel free to remove any that are not relevant or add additional projects you'd like to include. For any new project, please provide the project title, start date, and end date."
        : "Great! Please do mention your projects. For each project, please provide the project title, start date, and end date."

    case 2:
      return hasExperience
        ? "Wonderful! Are these your work experiences? Feel free to remove any that do not apply or add additional experiences you'd like to include. For any new work experience, please provide the company name, job title, start date, and end date."
        : "Wonderful! Please do mention your work experiences. For each experience, please provide the company name, job title, start date, and end date.";

    case 3:
      return hasEducation
        ? "Excellent! Are these your education details? Feel free to remove any that are not relevant or add additional education records you'd like to include. For any new education entry, please provide the institution name, board/university type, start date, and end date."
        : "Excellent! Please do mention your education details. For each entry, please provide the institution name, board/university type, start date, and end date.";

    case 4:
      return hasSkills
        ? "Looks good! Are these your skills? Feel free to remove any that do not apply or add additional skills you'd like to include. For each new skill, please mention the skill name and your proficiency level (Beginner, Intermediate, Advanced, or Expert)."
        : "Looks good! Please do mention your skills. For each skill, please mention the skill name and your proficiency level (Beginner, Intermediate, Advanced, or Expert).";

    case 5:
      return hasLinks
        ? "Nice! Are these your professional links? Feel free to remove any you do not want included or add any additional links you'd like to showcase."
        : "Nice! Please do mention your professional links. Feel free to add any links you'd like to showcase (e.g. LinkedIn, GitHub, portfolio).";

    case 6:
      return hasCerts
        ? "Are these your certifications? Feel free to remove any that are not relevant or add additional certifications you'd like to include. For each new certification, please provide the certificate title, month and year achieved, and certificate type (Course Completion, Professional Certification, Achievement, Training, Workshop, or Other)."
        : "Please do mention your certifications. For each certification, please provide the certificate title, month and year achieved, and certificate type (Course Completion, Professional Certification, Achievement, Training, Workshop, or Other).";

    default:
      return "";
  }
}

const QUESTION_COUNT = 7;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionAnswers {
  about_yourself?: string;
  additional_projects?: string;
  additional_experience?: string;
  additional_education?: string;
  additional_skills?: string;
  additional_links?: string;
  additional_certificates?: string;
  retained_project_ids?: number[];
  retained_experience_ids?: number[];
  retained_education_ids?: number[];
  retained_skill_ids?: number[];
  retained_link_ids?: number[];
  retained_certificate_ids?: number[];
}

interface ChipState {
  chips: DataChip[];
  messageId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AIBuilder() {
  let token = "";
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    token = u?.token || "";
  } catch { }

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<"jd" | "non-jd">("non-jd");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState<Record<string, number>>({});
  const [chatAnswers, setChatAnswers] = useState<Record<string, SessionAnswers>>({});
  const [chipStates, setChipStates] = useState<Record<string, ChipState>>({});
  const [resumeDataCache, setResumeDataCache] = useState<Record<string, unknown> | null>(null);
  // ── NEW: track which sessions have completed resume generation ────────────
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean>>({});

  // ── Fetch sessions ────────────────────────────────────────────────────────

  React.useEffect(() => {
    async function fetchSessions() {
      try {
        const sessions = await getAiSessions(token);
        setChatSessions(
          sessions.map((s) => ({
            ...s,
            id: String(s.id),
            messages: s.messages || [],
            started: s.started ?? false,
            createdAt: s.createdAt,
            infoJson: s.infoJson || null,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      }
    }
    fetchSessions();
  }, [token]);

  React.useEffect(() => {
    if (chatSessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(chatSessions[0].id);
    }
  }, [chatSessions, currentSessionId]);

  const currentSession = chatSessions.find((s) => s.id === currentSessionId);
  const activeChipState = currentSessionId ? chipStates[currentSessionId] : undefined;

  // ── Fetch /resume-data and build chips ───────────────────────────────────

  const fetchAndBuildChips = async (
    sessionId: string,
    category: "projects" | "experience" | "education" | "skills" | "links" | "certificates",
    botMessageId: string
  ) => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    const authToken = u?.token;
    const base = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000";

    try {
      const res = await fetch(`${base}/resume-data`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data || json;

      // Cache resume data for question generation
      setResumeDataCache(data);

      let chips: DataChip[] = [];

      if (category === "projects" && Array.isArray(data.projects)) {
        chips = data.projects.map((p: {
          project_id: number; project_title: string; project_type?: string;
          start_date?: string; end_date?: string; currently_working?: boolean;
        }) => ({
          id: `proj-${p.project_id}`,
          label: p.project_title,
          sublabel: [
            p.project_type,
            formatDate(p.start_date),
            p.currently_working ? "→ Present" : p.end_date ? `→ ${formatDate(p.end_date)}` : "",
          ].filter(Boolean).join(" · "),
          deleted: false,
        }));
      }

      if (category === "experience" && data.work_experience?.experiences) {
        chips = data.work_experience.experiences.map((e: {
          experience_id: number; company_name: string; job_title: string;
          start_date?: string; end_date?: string; currently_working_here?: boolean;
        }) => ({
          id: `exp-${e.experience_id}`,
          label: `${e.job_title} @ ${e.company_name}`,
          sublabel: [
            formatDate(e.start_date),
            e.currently_working_here ? "→ Present" : formatDate(e.end_date),
          ].filter(Boolean).join(" "),
          deleted: false,
        }));
      }

      if (category === "education" && Array.isArray(data.education)) {
        chips = data.education.map((e: {
          education_id: number; education_type: string; institution_name: string;
          degree?: string; field_of_study?: string; end_year?: string;
        }) => ({
          id: `edu-${e.education_id}`,
          label: e.degree
            ? `${e.degree}${e.field_of_study ? ` in ${e.field_of_study}` : ""}`
            : e.education_type.toUpperCase(),
          sublabel: [e.institution_name, formatDate(e.end_year)].filter(Boolean).join(" · "),
          deleted: false,
        }));
      }

      if (category === "skills" && Array.isArray(data.skills)) {
        chips = data.skills.map((s: {
          skill_id: number; skill_name: string; skill_level?: string;
        }) => ({
          id: `skill-${s.skill_id}`,
          label: s.skill_name,
          sublabel: s.skill_level ?? "",
          deleted: false,
        }));
      }

      if (category === "links" && Array.isArray(data.links)) {
        chips = data.links.map((l: {
          link_id: number; link_type: string; url: string;
        }) => ({
          id: `link-${l.link_id}`,
          label: l.link_type,
          sublabel: l.url,
          deleted: false,
        }));
      }

      if (category === "certificates" && Array.isArray(data.certificates)) {
        chips = data.certificates.map((c: {
          certificate_id: number; certificate_title: string; certificate_type?: string;
          certificate_provided_by?: string; date?: string;
        }) => ({
          id: `cert-${c.certificate_id}`,
          label: c.certificate_title,
          sublabel: [c.certificate_type, c.certificate_provided_by, formatDate(c.date)]
            .filter(Boolean).join(" · "),
          deleted: false,
        }));
      }

      setChipStates((prev) => ({
        ...prev,
        [sessionId]: { chips, messageId: botMessageId },
      }));
    } catch (err) {
      console.error("Failed to fetch resume-data for chips", err);
    }
  };

  // ── Chip handlers ─────────────────────────────────────────────────────────

  const handleChipDelete = (id: string) => {
    if (!currentSessionId) return;
    setChipStates((prev) => {
      const s = prev[currentSessionId];
      if (!s) return prev;
      return {
        ...prev,
        [currentSessionId]: {
          ...s,
          chips: s.chips.map((c) => (c.id === id ? { ...c, deleted: true } : c)),
        },
      };
    });
  };

  const handleChipUndo = (id: string) => {
    if (!currentSessionId) return;
    setChipStates((prev) => {
      const s = prev[currentSessionId];
      if (!s) return prev;
      return {
        ...prev,
        [currentSessionId]: {
          ...s,
          chips: s.chips.map((c) => (c.id === id ? { ...c, deleted: false } : c)),
        },
      };
    });
  };

  // ── Append bot message, returns its id ───────────────────────────────────

  const appendBotMessage = async (
    sessionId: string,
    content: string,
    saveToApi = true
  ): Promise<string> => {
    const msgId = `msg-${Date.now()}-bot`;
    const botMsg: ChatMessage = {
      id: msgId,
      role: "assistant",
      content,
      createdAt: new Date().toISOString(),
    };
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...(Array.isArray(s.messages) ? s.messages : []), botMsg] }
          : s
      )
    );
    if (saveToApi) {
      try { await createChat(sessionId, content, "assistant", null, token); } catch { }
    }
    return msgId;
  };

  // ── Session handlers ──────────────────────────────────────────────────────

  const handleNewChat = async () => {
    try {
      const session = await createAiSession(mode, `Session ${getNextSessionNumber(chatSessions)}`, token);
      const enriched: ChatSession = {
        id: String(session.id), title: session.title, mode: session.mode,
        messages: [], started: false, createdAt: session.createdAt || new Date().toISOString(),
      };
      setChatSessions((prev) => [enriched, ...prev]);
      setCurrentSessionId(enriched.id);
      setSidebarOpen(false);
    } catch (err) { console.error("Failed to create session", err); }
  };

  const handleSelectSession = async (id: string) => {
    setCurrentSessionId(id);
    const session = chatSessions.find((s) => s.id === id);
    if (session) setMode(session.mode);
    setSidebarOpen(false);
    try {
      const chats = await getSessionChats(id, token);
      setChatSessions((prev) =>
        prev.map((s) => s.id === id ? { ...s, messages: chats, started: chats?.length > 0 } : s)
      );
    } catch (err) { console.error("Failed to fetch session chats", err); }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAiSession(sessionId, token);
      setChatSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);
        if (currentSessionId === sessionId && filtered.length > 0) setCurrentSessionId(filtered[0].id);
        return filtered;
      });
    } catch (err) { console.error("Failed to delete session", err); }
  };

  const handleModeChange = (newMode: "jd" | "non-jd") => {
    setMode(newMode);
    setChatSessions((prev) =>
      prev.map((s) => s.id === currentSessionId ? { ...s, mode: newMode } : s)
    );
  };

  // ── Start ─────────────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (!currentSessionId) return;
    try {
      await startAiSession(currentSessionId, token);
      const openingMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: "Hi, I need help to build my resume.",
        createdAt: new Date().toISOString(),
      };
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
              ...s,
              started: true,
              messages: [...(Array.isArray(s.messages) ? s.messages : []), openingMsg],
              title: "Hi, I need help to build my resume.",
            }
            : s
        )
      );
      await createChat(currentSessionId, openingMsg.content, "user", null, token);
      setQuestionIndex((prev) => ({ ...prev, [currentSessionId]: 0 }));
      await appendBotMessage(currentSessionId, getQuestion(0, null));
    } catch (err) { console.error("Failed to start session", err); }
  };

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!inputValue.trim() || !currentSession || isLoading) return;

    const sessionId = currentSessionId!;
    const currentQIndex = questionIndex[sessionId] ?? 0;
    const nextQIndex = currentQIndex + 1;

    // Snapshot chip state BEFORE clearing
    const snapshotChips = chipStates[sessionId]?.chips ?? [];

    const extractRetainedIds = (chips: DataChip[]): number[] =>
      chips
        .filter((c) => !c.deleted)
        .map((c) => {
          const num = parseInt(c.id.split("-")[1], 10);
          return isNaN(num) ? null : num;
        })
        .filter((n): n is number => n !== null);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      createdAt: new Date().toISOString(),
    };
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
            ...s,
            messages: [...(Array.isArray(s.messages) ? s.messages : []), userMsg],
            title:
              (Array.isArray(s.messages) ? s.messages.length : 0) === 0
                ? inputValue.slice(0, 35)
                : s.title,
          }
          : s
      )
    );
    setInputValue("");
    setIsLoading(true);

    // Clear chips once user has responded
    setChipStates((prev) => { const n = { ...prev }; delete n[sessionId]; return n; });

    try {
      await createChat(sessionId, inputValue.trim(), "user", null, token);

      // ── Store typed answer ──────────────────────────────────────────────
      const answerKeyMap: Record<number, keyof SessionAnswers> = {
        0: "about_yourself",
        1: "additional_projects",
        2: "additional_experience",
        3: "additional_education",
        4: "additional_skills",
        5: "additional_links",
        6: "additional_certificates",
      };
      const answerKey = answerKeyMap[currentQIndex];
      if (answerKey) {
        setChatAnswers((prev) => ({
          ...prev,
          [sessionId]: { ...(prev[sessionId] || {}), [answerKey]: inputValue.trim() },
        }));
      }

      // ── Store retained IDs for Q1–Q5 (not the last step Q6) ────────────
      const retainedKeyMap: Record<number, keyof SessionAnswers> = {
        1: "retained_project_ids",
        2: "retained_experience_ids",
        3: "retained_education_ids",
        4: "retained_skill_ids",
        5: "retained_link_ids",
      };
      const retainedKey = retainedKeyMap[currentQIndex];
      if (retainedKey) {
        const retainedIds = extractRetainedIds(snapshotChips);
        setChatAnswers((prev) => ({
          ...prev,
          [sessionId]: { ...(prev[sessionId] || {}), [retainedKey]: retainedIds },
        }));
      }

      await new Promise((r) => setTimeout(r, 600));

      const u = JSON.parse(localStorage.getItem("user") || "null");
      const authToken = u?.token;

      if (nextQIndex < QUESTION_COUNT) {
        // ── More questions remain ───────────────────────────────────────
        const botMsgId = await appendBotMessage(sessionId, getQuestion(nextQIndex, resumeDataCache));
        setQuestionIndex((prev) => ({ ...prev, [sessionId]: nextQIndex }));

        if (nextQIndex === 1) await fetchAndBuildChips(sessionId, "projects", botMsgId);
        else if (nextQIndex === 2) await fetchAndBuildChips(sessionId, "experience", botMsgId);
        else if (nextQIndex === 3) await fetchAndBuildChips(sessionId, "education", botMsgId);
        else if (nextQIndex === 4) await fetchAndBuildChips(sessionId, "skills", botMsgId);
        else if (nextQIndex === 5) await fetchAndBuildChips(sessionId, "links", botMsgId);
        else if (nextQIndex === 6) await fetchAndBuildChips(sessionId, "certificates", botMsgId);

      } else {
        // ── All 7 answers collected — build payload ─────────────────────

        // Q6 (certificates) is the last step — snapshot directly
        const currentStepRetainedIds = extractRetainedIds(snapshotChips);

        const accumulated: SessionAnswers = {
          ...(chatAnswers[sessionId] || {}),
          additional_certificates: inputValue.trim() || chatAnswers[sessionId]?.additional_certificates || "",
          retained_certificate_ids: currentStepRetainedIds,
        };

        const cleanChatAnswers = {
          about_yourself: accumulated.about_yourself ?? "",
          additional_projects: accumulated.additional_projects ?? "",
          additional_experience: accumulated.additional_experience ?? "",
          additional_education: accumulated.additional_education ?? "",
          additional_skills: accumulated.additional_skills ?? "",
          additional_links: accumulated.additional_links ?? "",
          additional_certificates: accumulated.additional_certificates ?? "",
        };

        const retained_project_ids = accumulated.retained_project_ids;
        const retained_experience_ids = accumulated.retained_experience_ids;
        const retained_education_ids = accumulated.retained_education_ids;
        const retained_skill_ids = accumulated.retained_skill_ids;
        const retained_link_ids = accumulated.retained_link_ids;
        const retained_certificate_ids = accumulated.retained_certificate_ids;

        const generateRes = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000"}/generate-resume`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({
              session_id: sessionId,
              chat_answers: cleanChatAnswers,
              ...(retained_project_ids !== undefined && { retained_project_ids }),
              ...(retained_experience_ids !== undefined && { retained_experience_ids }),
              ...(retained_education_ids !== undefined && { retained_education_ids }),
              ...(retained_skill_ids !== undefined && { retained_skill_ids }),
              ...(retained_link_ids !== undefined && { retained_link_ids }),
              ...(retained_certificate_ids !== undefined && { retained_certificate_ids }),
            }),
          }
        );

        if (generateRes.ok) {
          const generateData = await generateRes.json().catch(() => ({}));
          const infoJsonFromApi =
            generateData.data || generateData.infoJson || generateData.info_json || null;
          if (infoJsonFromApi) {
            setChatSessions((prev) =>
              prev.map((s) => s.id === sessionId ? { ...s, infoJson: infoJsonFromApi } : s)
            );
          }
          // ── NEW: mark this session as completed so the chatbox hides ──
          setCompletedSessions((prev) => ({ ...prev, [sessionId]: true }));
          await appendBotMessage(
            sessionId,
            "Great! I've gathered all your details and generated your resume content. Your resume is ready with an enhanced technical summary, project descriptions, and work experience highlights. You can now review and download it."
          );
        } else {
          await appendBotMessage(
            sessionId,
            "I encountered an issue while generating your resume. Please try again or contact support."
          );
        }
      }
    } catch (err) {
      console.error("Send message failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setInputValue(`[Uploaded: ${file.name}] `);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <DashNav heading="AI Resume Builder" />

      <div className="flex flex-1 overflow-hidden relative">
        <ChatList
          sessions={chatSessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onClose={() => setSidebarOpen(false)}
          isVisible={sidebarOpen}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800 truncate">
              {currentSession?.title || "AI Resume Builder"}
            </span>
          </div>

          {currentSession ? (
            <ChatBox
              session={currentSession}
              mode={mode}
              inputValue={inputValue}
              isLoading={isLoading}
              onModeChange={handleModeChange}
              onInputChange={setInputValue}
              onSend={handleSend}
              onFileUpload={handleFileUpload}
              onStart={handleStart}
              token={token}
              activeChips={activeChipState?.chips}
              onChipDelete={handleChipDelete}
              onChipUndo={handleChipUndo}
              chipMessageId={activeChipState?.messageId ?? null}
              // ── NEW: hide the input area once resume is generated ──────
              isCompleted={completedSessions[currentSession.id] ?? false}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 bg-white">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-md w-full text-center flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="w-20 h-20 bg-orange-50 rounded-[1.5rem] flex items-center justify-center shadow-sm border border-orange-100 mb-6"
                >
                  <Sparkles className="w-10 h-10 text-orange-500" />
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-800 mb-3 tracking-tight">
                  Your AI Career Assistant
                </h2>

                <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                  Build a professional, ATS-optimized resume effortlessly. Start a new session to let our intelligent assistant guide you step-by-step.
                </p>

                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNewChat}
                  className="px-8 py-3.5 bg-orange-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition-all flex items-center gap-2 group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Create New Resume
                </motion.button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}