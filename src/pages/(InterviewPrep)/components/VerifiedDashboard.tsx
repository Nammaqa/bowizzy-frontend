import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import InterviewCard from "./InterviewCard";
import SavedInterviewCard from "./SavedInterviewCard";
import InterviewDetailsView from "./InterviewDetailsView";
import VerifiedDashboardHeader from "./VerifiedDashboardHeader";
import {
  saveInterviewSlot,
  getSavedInterviewSlots,
  removeSavedInterviewSlot,
} from "@/services/interviewPrepService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Interview {
  id: string;
  job_role?: string;
  title: string;
  experience: string;
  date: string;
  time: string;
  credits?: number;
  priority?: string;
  interview_slot_id?: string;
  interview_schedule_id?: string;
  start_time_utc?: string;
  end_time_utc?: string;
  skills?: string[];
  resume_url?: string;
  interview_code?: string;
  interview_mode?: string;
  candidate_id?: string | number;
  is_payment_done?: boolean;
  saved_slot_id?: string | number;
  interview_status?: string;
  meeting_link?: string;
  candidate_name?: string;
  candidate_review?: {
    candidate_review_id?: number;
    interview_schedule_id?: number;
    communication_skills?: string;
    technical_knowledge?: string;
    problem_solving_analytical_skills?: string;
    relevant_experience_skills?: string;
    adaptability_learning_ability?: string;
    cultural_team_fit?: string;
    overall_impression?: string;
    final_comments?: string;
    final_recommendation?: string;
    communication_skills_rating?: string;
    technical_knowledge_rating?: string;
    problem_solving_analytical_skills_rating?: string;
    relevant_experience_skills_rating?: string;
    adaptability_learning_ability_rating?: string;
    cultural_team_fit_rating?: string;
    overall_impression_rating?: string;
  } | null;
  interviewer_review?: {
    professionalism_conduct?: string;
    clarity_of_questions?: string;
    knowledge_of_role?: string;
    engagement_during_interview?: string;
    timeliness_organization?: string;
    overall_experience?: string;
    final_comments?: string;
    professionalism_conduct_rating?: string;
    clarity_of_questions_rating?: string;
    knowledge_of_role_rating?: string;
    engagement_during_interview_rating?: string;
    timeliness_organization_rating?: string;
    overall_experience_rating?: string;
  } | null;
  candidateFeedbackProvided?: boolean;
  interviewerFeedbackProvided?: boolean;
}

interface VerifiedDashboardProps {
  onViewDetails?: (
    interview: Interview,
    type: "scheduled" | "available" | "saved"
  ) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuth() {
  const parsed = JSON.parse(localStorage.getItem("user") || "{}");
  return {
    token: parsed?.token || localStorage.getItem("token") || "",
    userId:
      parsed?.user_id ||
      parsed?.userId ||
      parsed?.id ||
      localStorage.getItem("user_id") ||
      "",
  };
}

function normalizeSlot(raw: Record<string, unknown>): Interview {
  const get = (k: string) => raw[k];

  const startRaw =
    get("start_time_utc") ?? get("start_time") ?? get("startTime") ?? null;
  const endRaw =
    get("end_time_utc") ?? get("end_time") ?? get("endTime") ?? null;

  const fmtDate = (v: unknown) =>
    v
      ? new Date(v as string).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "";

  const fmtTime = (v: unknown) =>
    v
      ? new Date(v as string).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      : "";

  return {
    id: String(
      get("interview_schedule_id") ??
      get("id") ??
      get("_id") ??
      get("interview_slot_id") ??
      get("slotId") ??
      Math.random()
    ),
    interview_slot_id: String(
      get("interview_slot_id") ??
      get("interviewSlotId") ??
      get("slotId") ??
      get("slot_id") ??
      get("id") ??
      ""
    ),
    interview_schedule_id: String(
      get("interview_schedule_id") ??
      get("interviewScheduleId") ??
      get("scheduleId") ??
      ""
    ),
    job_role: (get("job_role") ?? get("title") ?? get("role")) as
      | string
      | undefined,
    title: String(
      get("job_role") ?? get("title") ?? get("role") ?? "Interview"
    ),
    experience: String(get("experience") ?? get("experienceLevel") ?? ""),
    date: startRaw ? fmtDate(startRaw) : String(get("date") ?? ""),
    time: startRaw
      ? `${fmtTime(startRaw)}${endRaw ? " - " + fmtTime(endRaw) : ""}`
      : String(get("time") ?? ""),
    start_time_utc: (startRaw ?? undefined) as string | undefined,
    end_time_utc: (endRaw ?? undefined) as string | undefined,
    skills: (get("skills") ?? []) as string[],
    resume_url: (get("resume_url") ?? get("resumeUrl")) as string | undefined,
    interview_code: (get("interview_code") ?? get("code")) as
      | string
      | undefined,
    interview_mode: (get("interview_mode") ?? get("mode")) as
      | string
      | undefined,
    candidate_id: (get("candidate_id") ?? get("candidateId")) as
      | string
      | number
      | undefined,
    is_payment_done: (get("is_payment_done") ?? get("isPaymentDone")) as
      | boolean
      | undefined,
    credits: (get("credits") ?? get("credit")) as number | undefined,
    priority: get("priority") as string | undefined,
    interview_status: (get("interview_status") ?? get("status")) as
      | string
      | undefined,
    meeting_link: (get("meeting_link") ?? get("meetingLink")) as
      | string
      | undefined,
    candidate_name: (get("candidate_name") ?? get("candidateName")) as
      | string
      | undefined,
    candidate_review: (get("candidate_review") ?? get("candidateReview") ?? null) as any,
    interviewer_review: (get("interviewer_review") ?? get("interviewerReview") ?? null) as any,
    candidateFeedbackProvided: (get("candidateFeedbackProvided") ??
      get("candidate_feedback_provided")) as boolean | undefined,
    interviewerFeedbackProvided: (get("interviewerFeedbackProvided") ??
      get("interviewer_feedback_provided")) as boolean | undefined,
  };
}

function normalizeSavedItem(item: Record<string, unknown>): Interview {
  const slot = (item.interview_slot as Record<string, unknown>) ?? item;
  const base = normalizeSlot(slot);
  return {
    ...base,
    saved_slot_id: (item.saved_slot_id ?? item.id ?? slot.saved_slot_id) as
      | string
      | number
      | undefined,
  };
}

function sortByStartDateAsc(interviews: Interview[]): Interview[] {
  return [...interviews].sort((a, b) => {
    const timeA = a.start_time_utc ? new Date(a.start_time_utc).getTime() : 0;
    const timeB = b.start_time_utc ? new Date(b.start_time_utc).getTime() : 0;
    return timeA - timeB;
  });
}

function sortByStartDateDesc(interviews: Interview[]): Interview[] {
  return [...interviews].sort((a, b) => {
    const timeA = a.start_time_utc ? new Date(a.start_time_utc).getTime() : 0;
    const timeB = b.start_time_utc ? new Date(b.start_time_utc).getTime() : 0;
    return timeB - timeA;
  });
}

function filterFuture(interviews: Interview[]): Interview[] {
  const now = Date.now();
  return interviews.filter((i) => {
    const ref = i.end_time_utc ?? i.start_time_utc;
    return ref ? new Date(ref).getTime() >= now : true;
  });
}

function isInterviewExpired(interview: Interview): boolean {
  if (!interview.start_time_utc) return false;
  return new Date(interview.start_time_utc).getTime() <= Date.now();
}
function isInterviewEnded(interview: Interview): boolean {
  if (!interview.end_time_utc) return false;
  return new Date(interview.end_time_utc).getTime() <= Date.now();
}

function isInterviewOlderThan12Hours(interview: Interview): boolean {
  if (!interview.start_time_utc) return false;
  return (
    Date.now() - new Date(interview.start_time_utc).getTime() >
    12 * 60 * 60 * 1000
  );
}

function filterAvailableByAge(interviews: Interview[]): Interview[] {
  return interviews.filter((i) => !isInterviewOlderThan12Hours(i));
}

function extractPastInterviews(interviews: Interview[]): Interview[] {
  const now = Date.now();
  return interviews.filter(
    (i) =>
      i.interview_status === "confirmed" &&
      i.end_time_utc != null &&
      new Date(i.end_time_utc).getTime() < now
  );
}

async function fetchList(
  path: string,
  token: string,
  extractArray: (data: unknown) => unknown[]
): Promise<Interview[]> {
  const res = await api.get(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const arr = extractArray(res?.data ?? []);
  return filterFuture(
    arr.map((item) => normalizeSlot(item as Record<string, unknown>))
  );
}

async function fetchListAll(
  path: string,
  token: string,
  extractArray: (data: unknown) => unknown[]
): Promise<Interview[]> {
  const res = await api.get(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const arr = extractArray(res?.data ?? []);
  return arr.map((item) => normalizeSlot(item as Record<string, unknown>));
}

// ─── Component ────────────────────────────────────────────────────────────────

const VerifiedDashboard = ({
  onViewDetails: externalOnViewDetails,
}: VerifiedDashboardProps) => {
  const navigate = useNavigate();
  // ── Detail-view state ─────────────────────────────────────────────────────
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );
  const [viewType, setViewType] = useState<
    "scheduled" | "available" | "saved" | null
  >(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // ── Data state ────────────────────────────────────────────────────────────
  const [scheduledInterviews, setScheduledInterviews] = useState<Interview[]>(
    []
  );
  const [isScheduledLoading, setIsScheduledLoading] = useState(false);
  const [scheduledError, setScheduledError] = useState<string | null>(null);

  const [availableInterviews, setAvailableInterviews] = useState<Interview[]>(
    []
  );
  const [isAvailableLoading, setIsAvailableLoading] = useState(false);
  const [availableError, setAvailableError] = useState<string | null>(null);

  const [savedInterviews, setSavedInterviews] = useState<Interview[]>([]);
  const [isSavedLoading, setIsSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  const [pastInterviews, setPastInterviews] = useState<Interview[]>([]);
  const [cancelledInterviews, setCancelledInterviews] = useState<Interview[]>([]);

  // ── Shared array extractor ────────────────────────────────────────────────
  const extractScheduleArray = (data: unknown): unknown[] =>
    Array.isArray(data)
      ? data
      : Array.isArray((data as any).schedules)
        ? (data as any).schedules
        : Array.isArray((data as any).slots)
          ? (data as any).slots
          : [];

  // ── Load scheduled + past ─────────────────────────────────────────────────
  const loadScheduled = async () => {
    setIsScheduledLoading(true);
    setScheduledError(null);
    try {
      const { token, userId } = getAuth();
      const path = `/users/${userId || 2}/mock-interview/interview-schedule`;
      const all = await fetchListAll(path, token, extractScheduleArray);
      setScheduledInterviews(sortByStartDateAsc(filterFuture(all).filter(i => i.interview_status !== "cancelled")));
      setPastInterviews(sortByStartDateDesc(extractPastInterviews(all)));
      setCancelledInterviews(sortByStartDateAsc(all.filter(i => i.interview_status === "cancelled")));
    } catch (err) {
      setScheduledError(
        (err as Error)?.message ?? "Failed to load scheduled interviews"
      );
    } finally {
      setIsScheduledLoading(false);
    }
  };

  // ── API 1: Available interview slots ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsAvailableLoading(true);
      setAvailableError(null);
      try {
        const { token } = getAuth();
        const interviews = await fetchList(
          "/users/mock-interview/interview-slots",
          token,
          (data) =>
            Array.isArray(data)
              ? data
              : Array.isArray((data as any).slots)
                ? (data as any).slots
                : []
        );
        const filtered = filterAvailableByAge(interviews).filter((i) => {
          if (isInterviewExpired(i)) return false;
          if (
            i.interview_status === "cancelled" &&
            i.end_time_utc &&
            new Date(i.end_time_utc).getTime() <= Date.now()
          )
            return false;
          return true;
        });
        if (mounted) setAvailableInterviews(sortByStartDateAsc(filtered));
      } catch (err) {
        if (mounted)
          setAvailableError(
            (err as Error)?.message ?? "Failed to load available interviews"
          );
      } finally {
        if (mounted) setIsAvailableLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // ── API 2: Saved interview slots ──────────────────────────────────────────
  const loadSaved = async () => {
    setIsSavedLoading(true);
    setSavedError(null);
    try {
      const { token, userId } = getAuth();
      if (!userId || !token) {
        setSavedInterviews([]);
        return;
      }
      const data = await getSavedInterviewSlots(userId, token);
      const items: unknown[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.saved_interview_slots)
          ? data.saved_interview_slots
          : [];
      setSavedInterviews(
        filterFuture(
          items.map((i) =>
            normalizeSavedItem(i as Record<string, unknown>)
          )
        )
      );
    } catch (err) {
      setSavedError(
        (err as Error)?.message ?? "Failed to load saved interviews"
      );
    } finally {
      setIsSavedLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  // ── API 3: Scheduled + past interviews ────────────────────────────────────
  useEffect(() => {
    loadScheduled();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleViewDetails = async (
    interview: Interview,
    type: "scheduled" | "available" | "saved"
  ) => {
    if (type === "available" && isInterviewExpired(interview)) return;

    if (type === "saved" || type === "scheduled") {
      setSelectedInterview(interview);
      setViewType(type);
      externalOnViewDetails?.(interview, type);
      return;
    }

    setDetailsError(null);
    setIsDetailsLoading(true);
    setViewType(type);

    try {
      const { token } = getAuth();
      const slotId = interview.interview_slot_id || interview.id;

      const path = `/mock-interview/interview-slot/${slotId}`;

      const res = await api.get(path, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const raw = res?.data ?? res;
      const slot = Array.isArray(raw) ? raw[0] : raw;
      const detailed = normalizeSlot(slot as Record<string, unknown>);

      setSelectedInterview(detailed);
      externalOnViewDetails?.(detailed, type);
    } catch (err) {
      setDetailsError(
        (err as Error)?.message ?? "Failed to load interview details"
      );
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedInterview(null);
    setViewType(null);
    setDetailsError(null);
  };

  const handleBookInterview = () => {
    setSelectedInterview(null);
    setViewType(null);
  };

  const handleToggleSaveInterview = async (interview: Interview) => {
    const alreadySaved = savedInterviews.some(
      (s) =>
        s.interview_slot_id === (interview.interview_slot_id ?? interview.id) ||
        s.id === interview.id
    );

    if (alreadySaved) {
      setSavedInterviews((prev) =>
        prev.filter(
          (s) =>
            !(
              s.interview_slot_id ===
              (interview.interview_slot_id ?? interview.id) ||
              s.id === interview.id
            )
        )
      );
      return;
    }

    const { token, userId } = getAuth();
    const slotId = interview.interview_slot_id ?? interview.id;

    if (userId && token) {
      try {
        await saveInterviewSlot(userId, token, {
          interview_slot_id: Number(slotId),
          interview_priority: interview.priority ?? "normal",
        });
        await loadSaved();
      } catch (err) {
        console.error("Failed to save interview slot:", err);
        setSavedInterviews((prev) => [...prev, interview]);
      }
    } else {
      setSavedInterviews((prev) => [...prev, interview]);
    }
  };

  const handleRemoveSaved = async (interview: Interview, index: number) => {
    const { token, userId } = getAuth();
    const resolvedSavedSlotId =
      (savedInterviews[index] as any)?.saved_slot_id ??
      interview.saved_slot_id ??
      interview.id;

    try {
      if (userId && token && resolvedSavedSlotId) {
        await removeSavedInterviewSlot(userId, token, resolvedSavedSlotId);
      }
    } catch (err) {
      console.error("Failed to remove saved slot:", err);
    } finally {
      await loadSaved();
    }
  };

  const isInterviewSaved = (id: string) =>
    savedInterviews.some((s) => s.id === id);

  const handleCancelInterviewSuccess = () => loadScheduled();

  const handleGiveFeedback = (interview: Interview) => {
    const scheduleId = interview.interview_schedule_id || interview.id;
    navigate(`/interview-prep/candidate-evaluation/${scheduleId}`, {
      state: { interview },
    });
  };

  // ── Render: loading / error / detail view ─────────────────────────────────

  if (isDetailsLoading && viewType) {
    return (
      <div className="space-y-6">
        <VerifiedDashboardHeader onBack={handleBack} title="Take Mock Interview" />
        <div className="p-6">
          <p className="text-sm text-gray-500">Loading interview details…</p>
        </div>
      </div>
    );
  }

  if (detailsError && viewType) {
    return (
      <div className="space-y-6">
        <VerifiedDashboardHeader onBack={handleBack} title="Take Mock Interview" />
        <div className="p-6">
          <p className="text-sm text-red-500">{detailsError}</p>
        </div>
      </div>
    );
  }

  if (selectedInterview && viewType) {
    return (
      <div className="space-y-6">
        <VerifiedDashboardHeader onBack={handleBack} title="Take Mock Interview" />
        <InterviewDetailsView
          interview={selectedInterview}
          viewType={viewType}
          onBack={handleBack}
          savedInterviews={savedInterviews}
          showAllSaved={true}
          onToggleSaved={() => { }}
          onViewDetails={handleViewDetails}
          onBook={handleBookInterview}
          onToggleSaveInterview={handleToggleSaveInterview}
          isInterviewSaved={isInterviewSaved(selectedInterview.id)}
        />
      </div>
    );
  }

  // ── Sub-components ────────────────────────────────────────────────────────

  const SectionBody = ({
    isLoading,
    error,
    empty,
    children,
  }: {
    isLoading: boolean;
    error: string | null;
    empty: boolean;
    children: React.ReactNode;
  }) => {
    if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
    if (error) return <p className="text-sm text-red-500">{error}</p>;
    if (empty)
      return <p className="text-sm text-gray-500">No interviews found</p>;
    return <>{children}</>;
  };

  // ── Render: main dashboard ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF5F0] text-[#FF8351] hover:bg-[#FF8351] hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Take Mock Interview
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-md px-4 py-3 text-sm text-gray-700">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="font-medium">You are verified as Interviewer</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main column */}
        <div className="flex-1 space-y-6">

          {/* Scheduled Interviews */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-[#FF8351]">
                Scheduled Interview(s)
                {scheduledInterviews.length > 0 && (
                  <span className="ml-2 text-sm text-gray-400 font-normal">
                    ({scheduledInterviews.length})
                  </span>
                )}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <SectionBody
                isLoading={isScheduledLoading}
                error={scheduledError}
                empty={scheduledInterviews.length === 0}
              >
                {scheduledInterviews.map((interview, i) => {
                  const { userId, token } = getAuth();
                  const expired = isInterviewExpired(interview);
                  return (
                    <InterviewCard
                      key={interview.id ?? i}
                      interview={interview}
                      isScheduled
                      isPast={expired}
                      userId={userId}
                      token={token}
                      onViewDetails={() =>
                        handleViewDetails(interview, "scheduled")
                      }
                      onCancelSuccess={expired ? undefined : handleCancelInterviewSuccess}
                      onGiveFeedback={undefined}
                    />
                  );
                })}
              </SectionBody>
            </div>
          </div>

          {/* Available Interviews */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-[#FF8351]">
                Available Interview(s)
                {availableInterviews.length > 0 && (
                  <span className="ml-2 text-sm text-gray-400 font-normal">
                    ({availableInterviews.length})
                  </span>
                )}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <SectionBody
                isLoading={isAvailableLoading}
                error={availableError}
                empty={availableInterviews.length === 0}
              >
                {availableInterviews.map((interview, i) => {
                  const expired = isInterviewExpired(interview);
                  return (
                    <div
                      key={interview.id ?? i}
                      className={expired ? "opacity-60" : ""}
                    >
                      <InterviewCard
                        interview={interview}
                        isScheduled={false}
                        isExpired={expired}
                        onViewDetails={
                          expired
                            ? undefined
                            : () => handleViewDetails(interview, "available")
                        }
                      />
                    </div>
                  );
                })}
              </SectionBody>
            </div>
          </div>

          {/* Past Interviews */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-[#FF8351]">
                Past Interview(s)
                {pastInterviews.length > 0 && (
                  <span className="ml-2 text-sm text-gray-400 font-normal">
                    ({pastInterviews.length})
                  </span>
                )}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <SectionBody
                isLoading={isScheduledLoading}
                error={scheduledError}
                empty={pastInterviews.length === 0}
              >
                {[...pastInterviews]
                  .sort((a, b) => {
                    const aTime = a.end_time_utc
                      ? new Date(a.end_time_utc).getTime()
                      : 0;
                    const bTime = b.end_time_utc
                      ? new Date(b.end_time_utc).getTime()
                      : 0;
                    return bTime - aTime; // latest first
                  })
                  .map((interview, i) => {
                    const { userId, token } = getAuth();
                    const expired = isInterviewEnded(interview);
                    return (
                      <InterviewCard
                        key={interview.id ?? i}
                        interview={interview}
                        isScheduled
                        isPast
                        userId={userId}
                        token={token}
                        onViewDetails={() =>
                          handleViewDetails(interview, "scheduled")
                        }
                        onGiveFeedback={expired ? () => handleGiveFeedback(interview) : undefined}
                      />
                    );
                  })}
              </SectionBody>
            </div>
          </div>
          {/* Cancelled Interviews */}
          {cancelledInterviews.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-500">
                  Cancelled Interview(s)
                  <span className="ml-2 text-sm text-gray-400 font-normal">
                    ({cancelledInterviews.length})
                  </span>
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {cancelledInterviews.map((interview, i) => {
                  const { userId, token } = getAuth();
                  return (
                    <InterviewCard
                      key={interview.id ?? i}
                      interview={interview}
                      isScheduled
                      isPast
                      userId={userId}
                      token={token}
                      onViewDetails={() =>
                        handleViewDetails(interview, "scheduled")
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-4">

          {/* Saved Interviews */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-base font-medium text-[#FF8351]">
                Saved Interview(s)
                {savedInterviews.length > 0 && (
                  <span className="ml-2 text-sm text-gray-400 font-normal">
                    ({savedInterviews.length})
                  </span>
                )}
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <SectionBody
                isLoading={isSavedLoading}
                error={savedError}
                empty={savedInterviews.length === 0}
              >
                {savedInterviews.map((interview, i) => (
                  <SavedInterviewCard
                    key={interview.id ?? i}
                    interview={interview}
                    onViewDetails={() =>
                      handleViewDetails(interview, "saved")
                    }
                    onRemove={(payload) =>
                      handleRemoveSaved(payload as unknown as Interview, i)
                    }
                  />
                ))}
              </SectionBody>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifiedDashboard;