import React, { useState } from "react";
import { Menu, Sparkles, Wand2, Brain, Rocket, Plus } from "lucide-react";
import { motion } from "framer-motion";
import DashNav from "@/components/dashnav/dashnav";
import ChatList from "./Chatlist";
import ChatBox from "./Chatbox";
import ModeInfoModal from "./ModeInfoModal";
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

// ── Question queue ────────────────────────────────────────────────────────────

const HARDCODED_QUESTIONS = [
  "Can you give me a brief about yourself?",
  "Are these your projects? Feel free to remove any that don't apply or mention additional projects you'd like to add.",
  "Are these your work experiences? Feel free to remove any that don't apply or mention additional experiences you'd like to add.",
  "Are these your education details? Feel free to remove any that don't apply or mention additional education you'd like to add.",
  "Are these your skills? Feel free to remove any that don't apply or mention additional skills you'd like to add.",
  "Are these your links? Remove any you don't want included or mention any additional links.",
  "Are these your certificates? Remove any you don't want included or mention any additional certificates.",
];

type ChipCategory =
  | "projects"
  | "experience"
  | "education"
  | "skills"
  | "links"
  | "certificates";

/** Which profile section each question reviews. Question 0 reviews nothing. */
const QUESTION_CATEGORIES: Record<number, ChipCategory> = {
  1: "projects",
  2: "experience",
  3: "education",
  4: "skills",
  5: "links",
  6: "certificates",
};

/**
 * Asked instead of the "Are these your …?" question when the profile has
 * nothing saved for that section — there is nothing to confirm, so we prompt
 * the user to supply it instead.
 */
const EMPTY_SECTION_QUESTIONS: Record<ChipCategory, string> = {
  projects:
    "You haven't added any projects to your profile yet. Please add it here so that this section can be generated for your resume.",
  experience:
    "You haven't added any work experience to your profile yet. Please add it here so that this section can be generated for your resume.",
  education:
    "You haven't added any education details to your profile yet. Please add it here so that this section can be generated for your resume.",
  skills:
    "You haven't added any skills to your profile yet. Please add it here so that this section can be generated for your resume.",
  links:
    "You haven't added any links to your profile yet. Please add it here so that this section can be generated for your resume.",
  certificates:
    "You haven't added any certificates to your profile yet. Please add it here so that this section can be generated for your resume.",
};

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
  } catch {}

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<"jd" | "non-jd">("non-jd");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState<Record<string, number>>({});
  const [chatAnswers, setChatAnswers] = useState<Record<string, SessionAnswers>>({});
  const [chipStates, setChipStates] = useState<Record<string, ChipState>>({});
  const [paidJdSessions, setPaidJdSessions] = useState<Record<string, boolean>>({});
  // Guidelines pop-up — shown on entry, on every new chat, and on mode switch
  const [infoModalMode, setInfoModalMode] = useState<"jd" | "non-jd" | null>("non-jd");

  // ── Fetch sessions ────────────────────────────────────────────────────────

  React.useEffect(() => {
    async function fetchSessions() {
      try {
        const sessions = await getAiSessions(token);
        const newPaidSessions: Record<string, boolean> = {};
        
        setChatSessions(
          sessions.map((s) => {
            if (s.is_paid) {
              newPaidSessions[String(s.id)] = true;
            }
            return {
              ...s,
              id: String(s.id),
              messages: s.messages || [],
              started: s.started || (s.mode === "jd" && !!s.infoJson),
              is_paid: s.is_paid ?? false,
              createdAt: s.createdAt,
              infoJson: s.infoJson || null,
              jd_text: s.jd_text || "",
            };
          })
        );
        setPaidJdSessions(newPaidSessions);
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

  // The mode belongs to the session, so the toggle must follow whichever
  // session is active. Sessions get selected automatically in two places (on
  // load, and after deleting the active one) and neither sets the mode — so
  // remounting the page (navigating to the profile and back) would leave a JD
  // session running at the "non-jd" default until the user clicked another
  // chat, which made JD mode behave like AI mode.
  React.useEffect(() => {
    if (currentSession?.mode) setMode(currentSession.mode);
  }, [currentSession?.id, currentSession?.mode]);

  // ── Fetch /resume-data and build chips ───────────────────────────────────

  /**
   * Fetches the profile and maps one section into chips.
   * Returns [] when the section is genuinely empty, and null when the data
   * couldn't be fetched — the caller must not treat a failure as "empty".
   */
  const fetchCategoryChips = async (
    category: ChipCategory
  ): Promise<DataChip[] | null> => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    const authToken = u?.token;
    const base = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000";

    try {
      const res = await fetch(`${base}/resume-data`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return null;
      const json = await res.json();
      const data = json.data || json;

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

      return chips;
    } catch (err) {
      console.error("Failed to fetch resume-data for chips", err);
      return null;
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
      try { await createChat(sessionId, content, "assistant", null, token); } catch {}
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
      setInfoModalMode(mode);
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
        prev.map((s) => s.id === id ? { ...s, messages: chats, started: chats?.length > 0 || (s.mode === "jd" && !!s.infoJson) } : s)
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
    if (currentSessionId && paidJdSessions[currentSessionId]) {
      return;
    }
    setMode(newMode);
    if (newMode !== mode) setInfoModalMode(newMode);
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
      await appendBotMessage(currentSessionId, HARDCODED_QUESTIONS[0]);
    } catch (err) { console.error("Failed to start session", err); }
  };

  // ── JD mode completion — bypasses the interview Q&A entirely ──────────────

  const handleJdComplete = async (data: Record<string, unknown>) => {
    if (!currentSessionId) return;
    const sessionId = currentSessionId;
    try {
      await startAiSession(sessionId, token);
    } catch (err) { console.error("Failed to mark JD session as started", err); }
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, started: true, infoJson: data } : s
      )
    );
    // setCompletedSessions((prev) => ({ ...prev, [sessionId]: true }));
    await appendBotMessage(
      sessionId,
      "Great! I've tailored your resume content to match the job description you provided. You can now choose a template and download your resume."
    );
  };

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!inputValue.trim() || !currentSession || isLoading) return;

    const sessionId     = currentSessionId!;
    const currentQIndex = questionIndex[sessionId] ?? 0;
    const nextQIndex    = currentQIndex + 1;

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

      if (nextQIndex < HARDCODED_QUESTIONS.length) {
        // ── More questions remain ───────────────────────────────────────
        // Load the section first: with nothing saved there is nothing to
        // confirm, so we ask the user to add it instead of listing chips.
        const category = QUESTION_CATEGORIES[nextQIndex];
        const chips = category ? await fetchCategoryChips(category) : null;
        const sectionIsEmpty = !!category && Array.isArray(chips) && chips.length === 0;

        const botMsgId = await appendBotMessage(
          sessionId,
          sectionIsEmpty && category
            ? EMPTY_SECTION_QUESTIONS[category]
            : HARDCODED_QUESTIONS[nextQIndex]
        );
        setQuestionIndex((prev) => ({ ...prev, [sessionId]: nextQIndex }));

        if (chips && chips.length > 0) {
          setChipStates((prev) => ({
            ...prev,
            [sessionId]: { chips, messageId: botMsgId },
          }));
        }

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
          about_yourself:          accumulated.about_yourself          ?? "",
          additional_projects:     accumulated.additional_projects     ?? "",
          additional_experience:   accumulated.additional_experience   ?? "",
          additional_education:    accumulated.additional_education    ?? "",
          additional_skills:       accumulated.additional_skills       ?? "",
          additional_links:        accumulated.additional_links        ?? "",
          additional_certificates: accumulated.additional_certificates ?? "",
        };

        const retained_project_ids     = accumulated.retained_project_ids;
        const retained_experience_ids  = accumulated.retained_experience_ids;
        const retained_education_ids   = accumulated.retained_education_ids;
        const retained_skill_ids       = accumulated.retained_skill_ids;
        const retained_link_ids        = accumulated.retained_link_ids;
        const retained_certificate_ids = accumulated.retained_certificate_ids;

        const generateRes = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000"}/generate-resume`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({
              session_id:   sessionId,
              chat_answers: cleanChatAnswers,
              ...(retained_project_ids     !== undefined && { retained_project_ids }),
              ...(retained_experience_ids  !== undefined && { retained_experience_ids }),
              ...(retained_education_ids   !== undefined && { retained_education_ids }),
              ...(retained_skill_ids       !== undefined && { retained_skill_ids }),
              ...(retained_link_ids        !== undefined && { retained_link_ids }),
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

      <ModeInfoModal mode={infoModalMode} onClose={() => setInfoModalMode(null)} />

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
              onJdComplete={handleJdComplete}
              token={token}
              activeChips={activeChipState?.chips}
              onChipDelete={handleChipDelete}
              onChipUndo={handleChipUndo}
              chipMessageId={activeChipState?.messageId ?? null}
              onShowGuide={() => setInfoModalMode(mode)}
              isJdPaid={!!paidJdSessions[currentSession.id]}
              onJdPaymentSuccess={() => setPaidJdSessions(prev => ({ ...prev, [currentSession.id]: true }))}
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