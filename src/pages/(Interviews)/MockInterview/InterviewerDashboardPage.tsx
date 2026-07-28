import DashNav from "@/components/dashnav/dashnav";
import { getExperienceByUserId } from "@/services/experienceService";
import { getSkillsByUserId } from "@/services/skillsLinksService";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  acceptMockInterviewBooking,
  cancelMockInterviewBooking,
  fetchAvailableMockInterviews,
  getAcceptedMockInterviews,
  isPaymentPendingBooking,
  isVerifiedInterviewerResponse,
  validateInterviewer,
} from "./mockInterviewService";

const normalizeAvailableInterviews = (response: any) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.interviews)) return response.interviews;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.bookings)) return response.bookings;
  return [];
};

const monthDiff = (startDate?: string, endDate?: string | null) => {
  if (!startDate) return 0;

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  return Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
};

const calculateWorkingMonths = (experiences: any[]) =>
  experiences.reduce((total, experience) => {
    return (
      total +
      monthDiff(
        experience?.start_date,
        experience?.currently_working_here ? null : experience?.end_date
      )
    );
  }, 0);

const formatIndianDateTime = (value?: string) => {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getInterviewId = (interview: any) =>
  interview?.mock_interview_id ||
  interview?.mockInterviewId ||
  interview?.booking_id ||
  interview?.id;

const getCandidateId = (interview: any) =>
  interview?.candidate_id ||
  interview?.candidateId ||
  interview?.candidate_user_id ||
  interview?.candidateUserId ||
  interview?.user_id ||
  interview?.userId ||
  interview?.candidate?.user_id ||
  interview?.candidate?.userId ||
  interview?.candidate?.candidate_id ||
  interview?.candidate?.id ||
  interview?.user?.user_id ||
  interview?.user?.id;

const getInterviewerId = (interview: any) =>
  interview?.interviewer_id ||
  interview?.interviewerId ||
  interview?.interviewer_user_id ||
  interview?.interviewerUserId ||
  interview?.assigned_interviewer_id ||
  interview?.assignedInterviewerId ||
  interview?.assigned_to ||
  interview?.assignedTo ||
  interview?.interviewer?.user_id ||
  interview?.interviewer?.userId ||
  interview?.interviewer?.interviewer_id ||
  interview?.interviewer?.id ||
  interview?.interviewer?.user?.user_id ||
  interview?.interviewer?.user?.id;

const normalizeSkills = (skillsValue: any) => {
  if (Array.isArray(skillsValue)) {
    return skillsValue
      .map((skill) =>
        typeof skill === "string" ? skill : skill?.skill_name || skill?.name
      )
      .filter(Boolean);
  }

  if (typeof skillsValue === "string") {
    return skillsValue
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

const hasAssignedInterviewer = (interview: any) =>
  interview?.interviewer_id !== null && interview?.interviewer_id !== undefined;

const getMeetingLink = (interview: any) =>
  interview?.meeting_link ||
  interview?.meetingLink ||
  interview?.online_meeting_link ||
  interview?.meeting?.link;

const getInterviewMode = (interview: any) =>
  interview?.interview_type ||
  interview?.interviewType ||
  interview?.interview_mode ||
  interview?.interviewMode ||
  interview?.mode ||
  "mock interview";

const isOnlineInterview = (interview: any) =>
  String(getInterviewMode(interview)).toLowerCase() === "online";

const getInterviewEndDate = (interview: any) => {
  const dateValue =
    interview?.end_time_utc ||
    interview?.start_time_utc ||
    interview?.scheduled_time;
  const date = dateValue ? new Date(dateValue) : null;

  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const getInterviewStartDate = (interview: any) => {
  const dateValue =
    interview?.start_time_utc ||
    interview?.startTimeUtc ||
    interview?.start_time ||
    interview?.startTime ||
    interview?.scheduled_time;
  const date = dateValue ? new Date(dateValue) : null;

  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const isAvailableInterviewActive = (interview: any, currentDate: Date) => {
  const status = String(interview?.interview_status || interview?.status || "").toLowerCase();
  const startDate = getInterviewStartDate(interview);

  // An unpaid booking is never offered to interviewers.
  if (isPaymentPendingBooking(interview)) return false;
  if (status === "expired") return false;
  return startDate ? startDate > currentDate : true;
};

const isPastInterview = (interview: any, currentDate: Date) => {
  const endDate = getInterviewEndDate(interview);
  return endDate ? endDate < currentDate : false;
};

const canCancelAcceptedInterview = (
  interview: any,
  currentDate: Date,
  currentUserId?: string | number
) => {
  const startDate = getInterviewStartDate(interview);
  const interviewerId = getInterviewerId(interview);

  if (
    !startDate ||
    interviewerId === undefined ||
    interviewerId === null ||
    currentUserId === undefined ||
    currentUserId === null ||
    String(interviewerId) !== String(currentUserId)
  ) {
    return false;
  }

  const oneHourBeforeStart = new Date(startDate.getTime() - 60 * 60 * 1000);
  return currentDate < oneHourBeforeStart;
};

const isCandidateFeedbackGiven = (interview: any) =>
  interview?.candidate_feedback_given === true ||
  interview?.candidateFeedbackGiven === true ||
  String(interview?.candidate_feedback_given).toLowerCase() === "true" ||
  String(interview?.candidateFeedbackGiven).toLowerCase() === "true";

const InterviewerDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [jobRole, setJobRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [workingMonths, setWorkingMonths] = useState(0);
  const [availableInterviews, setAvailableInterviews] = useState<any[]>([]);
  const [acceptedInterviews, setAcceptedInterviews] = useState<any[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [acceptedInterviewIds, setAcceptedInterviewIds] = useState<(string | number)[]>([]);
  const [acceptingInterviewId, setAcceptingInterviewId] = useState<string | number | null>(
    null
  );
  const [cancellingInterviewId, setCancellingInterviewId] = useState<
    string | number | null
  >(null);
  const [interviewToCancel, setInterviewToCancel] = useState<any>(null);
  const [cancelStatus, setCancelStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [interviewsError, setInterviewsError] = useState("");
  const [acceptError, setAcceptError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser?.user_id;

  useEffect(() => {
    const checkInterviewer = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;
        const token = user?.token;
        if (!userId || !token) {
          setError("Please login again to view interviewer dashboard.");
          return;
        }

        setLoading(true);
        const response = await validateInterviewer(userId, token);
        setValidation(response);

        if (isVerifiedInterviewerResponse(response)) {
          setLoadingInterviews(true);
          const [experienceResponse, skillsResponse] = await Promise.all([
            getExperienceByUserId(userId, token),
            getSkillsByUserId(userId, token),
          ]);

          const experiences = Array.isArray(experienceResponse?.experiences)
            ? experienceResponse.experiences
            : [];
          const skillNames = Array.isArray(skillsResponse)
            ? skillsResponse
              .map((skill: any) => skill?.skill_name)
              .filter(Boolean)
            : [];
          const months = calculateWorkingMonths(experiences);
          const role = experienceResponse?.job_role || "";

          setJobRole(role);
          setSkills(skillNames);
          setWorkingMonths(months);

          try {
            const [interviewsResponse, acceptedResponse] = await Promise.all([
              fetchAvailableMockInterviews(userId, token, {
                job_role: role,
                experience_months: months,
                skills: skillNames.join(","),
              }),
              getAcceptedMockInterviews(userId, token),
            ]);
            const currentDate = new Date();
            setAvailableInterviews(
              normalizeAvailableInterviews(interviewsResponse).filter((interview) =>
                isAvailableInterviewActive(interview, currentDate)
              )
            );
            setAcceptedInterviews(normalizeAvailableInterviews(acceptedResponse));
          } catch (error: any) {
            setInterviewsError(
              error?.response?.data?.message ||
              error?.message ||
              "Unable to fetch interviews."
            );
          } finally {
            setLoadingInterviews(false);
          }
        }
      } catch (error: any) {
        setLoadingInterviews(false);
        setError(
          error?.response?.data?.message ||
          error?.message ||
          "Unable to validate interviewer status."
        );
      } finally {
        setLoading(false);
      }
    };

    checkInterviewer();
  }, []);

  const isVerified = isVerifiedInterviewerResponse(validation);

  const handleAcceptInterview = async (interview: any) => {
    const interviewId = getInterviewId(interview);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.user_id;
    const token = user?.token;

    if (!interviewId || !userId || !token) {
      setAcceptError("Unable to accept this interview. Please login again.");
      return;
    }

    // Prevent accepting another interview at the same start date/time
    try {
      const newStart = getInterviewStartDate(interview);
      if (newStart) {
        const conflict = acceptedInterviews.some((ai) => {
          const aiStart = getInterviewStartDate(ai);
          return aiStart && aiStart.getTime() === newStart.getTime() && getInterviewId(ai) !== interviewId;
        });
        if (conflict) {
          setAcceptError("You already have an accepted interview at this date/time. Please choose a different slot.");
          return;
        }
      }
    } catch (err) {
      // if anything goes wrong with conflict check, continue and let API handle server-side validation
      console.warn("Conflict check failed:", err);
    }

    try {
      setAcceptError("");
      setAcceptingInterviewId(interviewId);
      const payload = { interviewer_id: userId };
      const response = await acceptMockInterviewBooking(
        userId,
        token,
        interviewId,
        payload
      );
      const updatedInterview = {
        ...interview,
        ...(response?.booking || response?.data || response || {}),
        interviewer_id: userId,
        interview_status:
          response?.booking?.interview_status ||
          response?.data?.interview_status ||
          response?.interview_status ||
          "accepted",
      };

      setAcceptedInterviewIds((currentIds) =>
        currentIds.includes(interviewId) ? currentIds : [...currentIds, interviewId]
      );
      setAvailableInterviews((currentInterviews) =>
        currentInterviews.filter(
          (currentInterview) => getInterviewId(currentInterview) !== interviewId
        )
      );
      setAcceptedInterviews((currentInterviews) => {
        const alreadyExists = currentInterviews.some(
          (currentInterview) => getInterviewId(currentInterview) === interviewId
        );

        return alreadyExists
          ? currentInterviews.map((currentInterview) =>
            getInterviewId(currentInterview) === interviewId
              ? updatedInterview
              : currentInterview
          )
          : [updatedInterview, ...currentInterviews];
      });
      setSelectedInterview(null);
    } catch (error: any) {
      setAcceptError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to accept interview right now."
      );
    } finally {
      setAcceptingInterviewId(null);
    }
  };

  const handleCancelInterview = async (interview: any) => {
    const interviewId = getInterviewId(interview);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.user_id;
    const token = user?.token;

    if (!interviewId || !userId || !token) {
      setAcceptError("Unable to cancel this interview. Please login again.");
      setCancelStatus({
        type: "error",
        message: "Unable to cancel this interview. Please login again.",
      });
      return;
    }

    try {
      setAcceptError("");
      setCancellingInterviewId(interviewId);
      await cancelMockInterviewBooking(userId, token, interviewId);
      setAcceptedInterviews((currentInterviews) =>
        currentInterviews.filter(
          (currentInterview) => getInterviewId(currentInterview) !== interviewId
        )
      );
      setAcceptedInterviewIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== interviewId)
      );
      setSelectedInterview((currentInterview: any) =>
        getInterviewId(currentInterview) === interviewId ? null : currentInterview
      );
      setCancelStatus({
        type: "success",
        message: "The interview has been cancelled and removed from your schedule.",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to cancel interview right now.";
      setAcceptError(message);
      setCancelStatus({ type: "error", message });
    } finally {
      setCancellingInterviewId(null);
    }
  };

  const selectedInterviewId = getInterviewId(selectedInterview);
  const selectedInterviewInterviewerId = getInterviewerId(selectedInterview);
  const selectedInterviewCandidateId = getCandidateId(selectedInterview);
  const selectedInterviewAssigned = hasAssignedInterviewer(selectedInterview);
  const selectedInterviewOwnedByCurrentUser =
    String(selectedInterviewInterviewerId) === String(currentUserId) ||
    String(selectedInterviewCandidateId) === String(currentUserId);
  const selectedInterviewAccepted =
    selectedInterview &&
    (selectedInterviewAssigned ||
      acceptedInterviewIds.includes(selectedInterviewId));
  const canAcceptSelectedInterview =
    selectedInterview &&
    !selectedInterviewAssigned &&
    !acceptedInterviewIds.includes(selectedInterviewId);
  const canUnlockSelectedInterview =
    selectedInterviewOwnedByCurrentUser || acceptedInterviewIds.includes(selectedInterviewId);
  const selectedInterviewSkills = normalizeSkills(selectedInterview?.skills);
  const selectedInterviewMeetingLink = getMeetingLink(selectedInterview);
  const currentDate = new Date();
  const activeAvailableInterviews = availableInterviews.filter((interview) =>
    isAvailableInterviewActive(interview, currentDate)
  );
  const pastAcceptedInterviews = acceptedInterviews.filter((interview) =>
    isPastInterview(interview, currentDate)
  );
  const upcomingAcceptedInterviews = acceptedInterviews.filter(
    (interview) => !isPastInterview(interview, currentDate)
  );

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-['Baloo_2']">
      <DashNav heading="Interviewer Dashboard" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/interviews/mock-interview")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#F26D3A]"
        >
          <ArrowLeft size={16} />
          Back to mock interview
        </button>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center text-[#777777] shadow-sm">
            Validating interviewer status...
          </div>
        ) : isVerified ? (
          <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-2xl bg-green-50 p-3 text-green-700">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#2F2F2F]">
                  Interviewer dashboard
                </h1>
                <p className="text-sm text-[#666666]">
                  Manage accepted and available mock interviews.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#EFEFEF] bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-[#2F2F2F]">
                        Accepted interviews
                      </h2>
                      <p className="text-xs text-[#777777]">
                        Confirmed bookings where you are the candidate or interviewer.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="rounded-full bg-[#F2F2F2] px-3 py-1 text-xs font-bold text-[#666666]">
                        {upcomingAcceptedInterviews.length}
                      </span>
                      {loadingInterviews && (
                        <span className="text-sm font-semibold text-[#F26D3A]">
                          Loading...
                        </span>
                      )}
                    </div>
                  </div>

                  {!loadingInterviews && upcomingAcceptedInterviews.length === 0 && (
                    <p className="mt-3 rounded-xl bg-[#FAFAFA] p-3 text-sm text-[#777777]">
                      No upcoming accepted interviews found yet.
                    </p>
                  )}

                  {upcomingAcceptedInterviews.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {upcomingAcceptedInterviews.map((interview, index) => {
                        const meetingLink = getMeetingLink(interview);
                        const interviewId = getInterviewId(interview);
                        const canCancel = canCancelAcceptedInterview(
                          interview,
                          currentDate,
                          currentUserId
                        );

                        return (
                          <div
                            key={interviewId || index}
                            className="rounded-2xl border border-green-100 bg-green-50/50 p-3"
                          >
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="font-bold text-[#2F2F2F]">
                                  {interview?.job_role ||
                                    interview?.title ||
                                    `Accepted interview ${index + 1}`}
                                </p>
                                <p className="text-sm text-[#777777]">
                                  {formatIndianDateTime(
                                    interview?.start_time_utc || interview?.scheduled_time
                                  )}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold capitalize text-green-700">
                                  {interview?.interview_status || "confirmed"}
                                </span>
                                {interview?.resume_url && (
                                  <a
                                    href={interview.resume_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full bg-[#EAF7EF] px-3 py-1.5 text-xs font-bold text-green-700 ring-1 ring-green-200 transition hover:bg-green-100"
                                  >
                                    <FileText size={13} />
                                    Resume
                                  </a>
                                )}
                                {isOnlineInterview(interview) && meetingLink && (
                                  <a
                                    href={meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100"
                                  >
                                    <Video size={13} />
                                    Meeting link
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAcceptError("");
                                    setSelectedInterview(interview);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#FFF0E3] px-3 py-1.5 text-xs font-bold text-[#F26D3A] ring-1 ring-orange-200 transition hover:bg-[#FFE1D2]"
                                >
                                  <Eye size={13} />
                                  View details
                                </button>
                                {canCancel && (
                                  <button
                                    type="button"
                                    onClick={() => setInterviewToCancel(interview)}
                                    disabled={cancellingInterviewId === interviewId}
                                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 ring-1 ring-red-200 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    <X size={13} />
                                    {cancellingInterviewId === interviewId
                                      ? "Cancelling..."
                                      : "Cancel"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>



                <div className="rounded-2xl border border-[#EFEFEF] bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-[#2F2F2F]">
                        Available interviews
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="rounded-full bg-[#F2F2F2] px-3 py-1 text-xs font-bold text-[#666666]">
                        {activeAvailableInterviews.length}
                      </span>
                      {loadingInterviews && (
                        <span className="text-sm font-semibold text-[#F26D3A]">
                          Loading...
                        </span>
                      )}
                    </div>
                  </div>

                  {interviewsError && (
                    <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                      {interviewsError}
                    </p>
                  )}

                  {!loadingInterviews && !interviewsError && activeAvailableInterviews.length === 0 && (
                    <p className="mt-3 rounded-xl bg-[#FAFAFA] p-3 text-sm text-[#777777]">
                      No available interviews returned yet.
                    </p>
                  )}

                  {activeAvailableInterviews.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {activeAvailableInterviews.map((interview, index) => (
                        <div
                          key={interview?.mock_interview_id || interview?.id || index}
                          className="rounded-2xl border border-[#E8E8E8] p-3 transition hover:border-[#F26D3A]/40 hover:shadow-sm"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-bold text-[#2F2F2F]">
                                {interview?.job_role ||
                                  interview?.title ||
                                  `Interview ${index + 1}`}
                              </p>
                              <p className="text-sm text-[#777777]">
                                {formatIndianDateTime(
                                  interview?.start_time_utc || interview?.scheduled_time
                                )}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[#FFF0E3] px-3 py-1 text-xs font-bold capitalize text-[#F26D3A]">
                                {getInterviewMode(interview)}
                              </span>
                              <button
                                onClick={() => {
                                  setAcceptError("");
                                  setSelectedInterview(interview);
                                }}
                                className="inline-flex items-center gap-1 rounded-full bg-[#FFF0E3] px-3 py-1.5 text-xs font-bold text-[#F26D3A] ring-1 ring-orange-200 transition hover:bg-[#FFE1D2]"
                              >
                                <Eye size={13} />
                                View details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-[#EFEFEF] bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-[#2F2F2F]">
                        Past interviews
                      </h2>
                      <p className="text-xs text-[#777777]">
                        Completed interviews based on current system date and time.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#F2F2F2] px-3 py-1 text-xs font-bold text-[#666666]">
                      {pastAcceptedInterviews.length}
                    </span>
                  </div>

                  {!loadingInterviews && pastAcceptedInterviews.length === 0 && (
                    <p className="mt-3 rounded-xl bg-[#FAFAFA] p-3 text-sm text-[#777777]">
                      No past interviews yet.
                    </p>
                  )}

                  {pastAcceptedInterviews.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {pastAcceptedInterviews.map((interview, index) => (
                        <div
                          key={getInterviewId(interview) || index}
                          className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-3"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-bold text-[#2F2F2F]">
                                {interview?.job_role ||
                                  interview?.title ||
                                  `Past interview ${index + 1}`}
                              </p>
                              <p className="text-sm text-[#777777]">
                                {formatIndianDateTime(
                                  interview?.end_time_utc ||
                                  interview?.start_time_utc ||
                                  interview?.scheduled_time
                                )}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold capitalize text-[#666666] ring-1 ring-[#E8E8E8]">
                                {getInterviewMode(interview)}
                              </span>
                              {interview?.resume_url ? (
                                <a
                                  href={interview.resume_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full bg-[#EAF7EF] px-3 py-1.5 text-xs font-bold text-green-700 ring-1 ring-green-200 transition hover:bg-green-100"
                                >
                                  <FileText size={13} />
                                  Candidate resume
                                </a>
                              ) : (
                                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#777777] ring-1 ring-[#E8E8E8]">
                                  Resume not shared
                                </span>
                              )}
                              {isCandidateFeedbackGiven(interview) ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 ring-1 ring-green-200">
                                  <MessageSquareText size={13} />
                                  Candidate feedback provided already
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/interviews/mock-interview/candidate-reviews/${getInterviewId(interview)}`,
                                      {
                                        state: {
                                          interview,
                                          candidate_id: getCandidateId(interview),
                                          interviewer_id: getInterviewerId(interview),
                                        },
                                      }
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100"
                                >
                                  <MessageSquareText size={13} />
                                  Give feedback
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="h-fit rounded-2xl border border-[#FFE1D2] bg-[#FFF8F3] p-4 lg:sticky lg:top-4">
                <h2 className="text-lg font-bold text-[#2F2F2F]">My profile</h2>
                <p className="mt-1 text-xs leading-5 text-[#777777]">
                  These values are sent to fetch available mock interviews.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase text-[#777777]">
                      Job role
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#2F2F2F]">
                      {jobRole || "Not set"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase text-[#777777]">
                      Working months
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#2F2F2F]">
                      {workingMonths}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase text-[#777777]">
                      Skills
                    </p>
                    <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[#FFF0E3] px-2 py-1 text-[11px] font-semibold text-[#F26D3A]"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#777777]">No skills found</span>
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto inline-flex rounded-2xl bg-[#FFF0E3] p-4 text-[#F26D3A]">
              <Clock3 size={30} />
            </div>
            <h1 className="mt-5 text-3xl font-bold text-[#2F2F2F]">
              Interviewer approval pending
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#666666]">
              {error ||
                validation?.message ||
                "Apply as an interviewer and wait for approval to access the dashboard."}
            </p>
            <button
              onClick={() => navigate("/interviews/mock-interview/apply-interviewer")}
              className="mt-6 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md"
              style={{ background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)" }}
            >
              Apply as interviewer
            </button>
          </section>
        )}
      </div>

      {selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-[#FFF7F0] via-white to-[#FFE1D2] p-4">
              <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full bg-[#F26D3A]/20" />
              <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[#FFB36B]/20" />
              <button
                type="button"
                onClick={() => setSelectedInterview(null)}
                className="absolute right-4 top-4 z-20 rounded-full bg-white p-2 text-[#2F2F2F] shadow-sm transition hover:bg-[#FFF0E3]"
                aria-label="Close candidate details"
              >
                <X size={18} />
              </button>
              <div className="relative">
                <div className="inline-flex rounded-2xl bg-[#F26D3A] p-3 text-white shadow-lg shadow-orange-200">
                  <Briefcase size={26} />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#F26D3A]">
                  Mock interview request
                </p>
                <h2 className="mt-1 pr-10 text-2xl font-bold text-[#2F2F2F]">
                  {selectedInterview?.job_role ||
                    selectedInterview?.title ||
                    "Job role not provided"}
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#777777]">
                  {selectedInterviewAccepted
                    ? selectedInterviewOwnedByCurrentUser ||
                      acceptedInterviewIds.includes(selectedInterviewId)
                      ? "Interview accepted by you"
                      : "Interview accepted"
                    : "Review skills and experience before accepting"}
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-4">
                  <p className="text-xs font-semibold uppercase text-[#777777]">
                    Job role
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#2F2F2F]">
                    {selectedInterview?.job_role ||
                      selectedInterview?.title ||
                      "Not provided"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-4">
                  <p className="text-xs font-semibold uppercase text-[#777777]">
                    Experience
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#2F2F2F]">
                    {selectedInterview?.experience_months ?? 0} months
                  </p>
                </div>
                <div className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase text-[#777777]">
                    Mode
                  </p>
                  <p className="mt-2 text-xl font-bold capitalize text-[#2F2F2F]">
                    {getInterviewMode(selectedInterview)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#EFEFEF] p-4">
                <p className="text-xs font-semibold uppercase text-[#777777]">Skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedInterviewSkills.length > 0 ? (
                    selectedInterviewSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#FFF0E3] px-3 py-1.5 text-sm font-bold text-[#F26D3A]"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#777777]">No skills shared</span>
                  )}
                </div>
              </div>

              {canUnlockSelectedInterview && (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-bold text-green-700">
                    Interview accepted — candidate resources unlocked
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {selectedInterview?.resume_url && (
                      <a
                        href={selectedInterview.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-green-700 shadow-sm transition hover:bg-green-100"
                      >
                        View resume
                      </a>
                    )}
                    {isOnlineInterview(selectedInterview) && selectedInterviewMeetingLink && (
                      <a
                        href={selectedInterviewMeetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-green-700 shadow-sm transition hover:bg-green-100"
                      >
                        Join meeting
                      </a>
                    )}
                  </div>
                  {!selectedInterview?.resume_url &&
                    (!isOnlineInterview(selectedInterview) || !selectedInterviewMeetingLink) && (
                      <p className="mt-3 text-sm text-green-700">
                        No resume or online meeting link has been shared yet.
                      </p>
                    )}
                </div>
              )}

              {!canUnlockSelectedInterview && selectedInterviewAccepted && (
                <div className="rounded-2xl border border-[#FFE1D2] bg-[#FFF8F3] p-4">
                  <p className="text-sm font-bold text-[#F26D3A]">
                    This interview has already been accepted.
                  </p>
                  <p className="mt-1 text-sm text-[#777777]">
                    Resume and meeting links are only visible to the assigned interviewer.
                  </p>
                </div>
              )}

              {!selectedInterviewAccepted && (
                <div className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-4">
                  <p className="text-sm font-semibold text-[#777777]">
                    Resume and online meeting link unlock after you accept this interview.
                  </p>
                </div>
              )}

              {acceptError && (
                <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                  {acceptError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#EFEFEF] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#777777]">
                {canAcceptSelectedInterview
                  ? "Accept to unlock the candidate resume and online meeting link."
                  : "This request is no longer open for acceptance."}
              </p>
              {canAcceptSelectedInterview ? (
                <button
                  onClick={() => handleAcceptInterview(selectedInterview)}
                  disabled={acceptingInterviewId === selectedInterviewId}
                  className="rounded-xl bg-[#F26D3A] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#e35f2f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {acceptingInterviewId === selectedInterviewId
                    ? "Accepting..."
                    : "Accept interview"}
                </button>
              ) : (
                <span className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-md">
                  Interview accepted
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {interviewToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
            <h3 className="text-lg font-bold text-[#2F2F2F] mb-2">Cancel Interview?</h3>
            <p className="text-sm text-[#666666] mb-6">Are you sure you want to cancel this interview?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setInterviewToCancel(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                No, keep it
              </button>
              <button
                onClick={() => {
                  handleCancelInterview(interviewToCancel);
                  setInterviewToCancel(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition cursor-pointer"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation result popup */}
      {cancelStatus && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setCancelStatus(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`mx-auto inline-flex rounded-full p-3 ${cancelStatus.type === "success"
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
                }`}
            >
              {cancelStatus.type === "success" ? (
                <CheckCircle2 size={32} />
              ) : (
                <AlertCircle size={32} />
              )}
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#2F2F2F]">
              {cancelStatus.type === "success"
                ? "Interview cancelled"
                : "Cancellation failed"}
            </h3>
            <p className="mt-2 text-sm text-[#666666]">{cancelStatus.message}</p>
            <button
              onClick={() => setCancelStatus(null)}
              className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition cursor-pointer ${cancelStatus.type === "success"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
                }`}
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default InterviewerDashboardPage;
