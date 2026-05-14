import React, { useState, useEffect, useRef } from "react";
import { updateInterviewSlot, createInterviewSchedule, saveInterviewSlot, getSavedInterviewSlots, removeSavedInterviewSlot, cancelInterviewSchedule } from "@/services/interviewPrepService";
import { X } from "lucide-react";
import SavedInterviewCard from "./SavedInterviewCard";
import VerifiedDashboardHeader from "./VerifiedDashboardHeader";

interface Interview {
  id: string | number;
  title: string;
  experience: string;
  date: string;
  time: string;
  credits?: number;
  priority?: string;
  start_time_utc?: string;
  end_time_utc?: string;
  status?: string;
  is_payment_done?: boolean;
  candidateDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    resumeUrl?: string;
    avatar?: string;
    title?: string;
  };
  job_role?: string;
  skills?: string[];
  resume_url?: string;
  interview_code?: string;
  saved_slot_id?: string | number;
  interview_slot?: any;
  candidate_id?: string | number;
  interview_schedule_id?: string | number;
  interview_slot_id?: string | number;
  meeting_link?: string;
  candidate_name?: string;
  interview_mode?: string;
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
  candidateFeedbackProvided?: boolean;
  interviewerFeedbackProvided?: boolean;
  interviewer_review?: {
    interviewer_review_id?: number;
    interviewer_id?: number;
    interview_schedule_id?: number;
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
}

interface InterviewDetailsViewProps {
  interview: Interview;
  onBack: () => void;
  viewType: "scheduled" | "available" | "saved";
  onBook?: () => void;
  onViewDetails?: (
    interview: Interview,
    type: "scheduled" | "available" | "saved"
  ) => void;
  savedInterviews?: Interview[];
  showAllSaved?: boolean;
  onToggleSaved?: () => void;
  onToggleSaveInterview?: (interview: Interview) => void;
  isInterviewSaved?: boolean;
}

const InterviewDetailsView: React.FC<InterviewDetailsViewProps> = ({
  interview,
  onBack,
  viewType,
  onBook,
  onViewDetails,
  savedInterviews = [],
  showAllSaved = false,
  onToggleSaved,
  onToggleSaveInterview,
  isInterviewSaved = false,
}) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [started, setStarted] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(isInterviewSaved);
  const [isCancelling, setIsCancelling] = useState(false);

  const [savedList, setSavedList] = useState<Interview[]>(savedInterviews || []);
  const [savedLoading, setSavedLoading] = useState<boolean>(false);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [currentSavedSlotId, setCurrentSavedSlotId] = useState<number | string | null>(null);

  const displayedSaved = showAllSaved ? savedList : savedList.slice(0, 2);

  const handleBookInterview = async () => {
    setBookingError(null);
    setBookingLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "null");
      const userId = userData?.user_id;
      const token = userData?.token;
      if (!userId || !token) {
        setBookingError("User not authenticated");
        setBookingLoading(false);
        return;
      }

      const slotId = interview.interview_slot_id || interview.id;
      if (!slotId) {
        setBookingError("Invalid slot id");
        setBookingLoading(false);
        return;
      }

      // Use schedule creation API: POST /users/:user_id/mock-interview/interview-schedule
      const payload = { interview_slot_id: Number(slotId) };
      await createInterviewSchedule(userId, token, payload);

      setShowBookingModal(true);
    } catch (err: any) {
      console.error("Booking failed:", err);
      const status = err?.response?.status ?? err?.status;
      if (status === 409) {
        setBookingError("You have already cancelled this interview. Please book another interview");
      } else {
        setBookingError("Failed to book interview.");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelInterview = async () => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData?.user_id;
    const token = userData?.token;

    if (!userId || !token) {
      alert("Unable to cancel: Missing user information");
      return;
    }

    const scheduleId = interview.interview_schedule_id || interview.id;

    if (!scheduleId) {
      alert("Unable to cancel: Missing interview schedule ID");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this interview?")) {
      return;
    }

    try {
      setIsCancelling(true);
      await cancelInterviewSchedule(userId, token, scheduleId);
      // Go back to the dashboard after successful cancellation
      onBack?.();
    } catch (err) {
      console.error("Failed to cancel interview:", err);
      alert("Failed to cancel interview. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStartTime = () => {
    if (interview.start_time_utc) return new Date(interview.start_time_utc);
    try {
      const parsed = new Date(`${interview.date} ${interview.time}`);
      if (!isNaN(parsed.getTime())) return parsed;
    } catch (e) { }
    return null;
  };

  const getEndTime = () => {
    if (interview.end_time_utc) return new Date(interview.end_time_utc);
    return null;
  };

  useEffect(() => {
    const startTime = getStartTime();
    if (!startTime) {
      setTimeRemaining("N/A");
      return;
    }

    const update = () => {
      const now = new Date();
      const diff = startTime.getTime() - now.getTime();
      if (diff <= 0) {
        setStarted(true);
        setTimeRemaining("00:00:00");
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };

    update();
    timerRef.current = window.setInterval(update, 1000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [interview.start_time_utc, interview.date, interview.time]);

  const handleSaveToggle = async () => {
    const slotId = interview.interview_slot_id ?? interview.id;
    const next = !saved;
    setSaved(next); // optimistic
    console.log('Save toggle clicked for', slotId, '->', next);
    if (onToggleSaveInterview) {
      try {
        // call parent handler (may be async)
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        onToggleSaveInterview(interview);
        // refresh saved list to reflect backend/parent changes
        try { await fetchSavedSlots(); } catch (e) { /* ignore */ }
        return;
      } catch (e) {
        console.error('Parent save handler failed:', e);
      }
    }

    // Fallback: call save or remove API directly if parent handler not provided
    (async () => {
      try {
        const parsed = JSON.parse(localStorage.getItem("user") || "{}");
        const token = parsed?.token || localStorage.getItem("token");
        const userId = parsed?.user_id || parsed?.userId || parsed?.id || localStorage.getItem("user_id");
        if (!userId || !token) {
          console.warn('No user/token available to call save/remove API');
          return;
        }
        if (next) {
          // save
          await saveInterviewSlot(userId, token, { interview_slot_id: Number(slotId), interview_priority: interview.priority ?? 'normal' });
          console.log('Saved interview slot via fallback API');
        } else {
          // remove: need saved_slot_id
          let savedSlotId = currentSavedSlotId;
          if (!savedSlotId) {
            const found = savedList.find(s => Number(s.interview_slot_id ?? s.id) === Number(slotId));
            savedSlotId = found ? (found.saved_slot_id ?? found.id) : null;
          }
          if (savedSlotId) {
            await removeSavedInterviewSlot(userId, token, savedSlotId);
            console.log('Removed saved interview slot via fallback API');
          } else {
            console.warn('No saved_slot_id found for removal');
          }
        }

        // refresh saved list so UI reflects the new saved state
        try { await fetchSavedSlots(); } catch (e) { console.warn('Refresh after save/remove failed', e); }
      } catch (err) {
        console.error('Fallback save/remove failed:', err);
      }
    })();
  };

  useEffect(() => {
    setSaved(isInterviewSaved);
  }, [isInterviewSaved]);

  // Fetch saved slots helper so we can call it after save/un-save actions
  const fetchSavedSlots = async () => {
    setSavedLoading(true);
    try {
      const parsed = JSON.parse(localStorage.getItem("user") || "{}");
      const token = parsed?.token || localStorage.getItem("token");
      const userId = parsed?.user_id || parsed?.userId || parsed?.id || localStorage.getItem("user_id");
      if (!userId || !token) {
        setSavedList(savedInterviews || []);
        return;
      }
      const data = await getSavedInterviewSlots(userId, token);
      const items: any[] = Array.isArray(data) ? data : (data?.saved_interview_slots ? data.saved_interview_slots : (data || []));
      const normalize = (item: any): Interview => {
        const slot = item.interview_slot || item;
        const get = (k: string) => slot[k];
        const start = get('start_time_utc') ?? get('start_time') ?? slot.date ?? null;
        const end = get('end_time_utc') ?? get('end_time') ?? null;
        return {
          id: String(slot.interview_slot_id ?? slot.id ?? item.saved_slot_id ?? Math.random()),
          saved_slot_id: item.saved_slot_id ?? item.id ?? slot.saved_slot_id ?? undefined,
          interview_slot_id: String(slot.interview_slot_id ?? slot.id ?? ''),
          interview_code: slot.interview_code ?? slot.code ?? undefined,
          job_role: slot.job_role ?? slot.title ?? undefined,
          title: slot.job_role ?? slot.title ?? 'Interview',
          experience: slot.experience ?? slot.experienceLevel ?? '',
          date: start ? new Date(start).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : (slot.date ?? ''),
          time: start ? `${new Date(start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}${end ? ' - ' + new Date(end).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}` : (slot.time ?? ''),
          start_time_utc: start ?? undefined,
          end_time_utc: end ?? undefined,
          skills: slot.skills ?? [],
          resume_url: slot.resume_url ?? slot.resumeUrl ?? undefined,
          interview_mode: slot.interview_mode ?? slot.mode ?? undefined,
          candidate_id: slot.candidate_id ?? slot.candidateId ?? undefined,
          is_payment_done: slot.is_payment_done ?? slot.isPaymentDone ?? undefined,
          priority: slot.priority ?? undefined,
        } as Interview;
      };

      const now = Date.now();
      const mapped = items.map(normalize).filter(i => {
        const end = i.end_time_utc ? new Date(i.end_time_utc) : (i.start_time_utc ? new Date(i.start_time_utc) : null);
        return !(end && end.getTime() < now);
      });
      setSavedList(mapped as Interview[]);
    } catch (err) {
      console.error("Fetching saved interviews failed:", err);
      setSavedError("Failed to load saved interviews");
      setSavedList(savedInterviews || []);
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    // call fetchSavedSlots; keep mounted flag for safety if you later add cancellation
    fetchSavedSlots();
    return () => { mounted = false; };
  }, [showAllSaved]);

  // keep `saved` boolean in sync with fetched saved list
  useEffect(() => {
    const slotId = interview.interview_slot_id ?? interview.id;
    const exists = savedList.some(s => Number(s.interview_slot_id ?? s.id) === Number(slotId));
    setSaved(Boolean(exists));
  }, [savedList, interview.interview_slot_id, interview.id]);

  // keep currentSavedSlotId in sync so we can call delete
  useEffect(() => {
    const slotId = interview.interview_slot_id ?? interview.id;
    const match = savedList.find(s => Number(s.interview_slot_id ?? s.id) === Number(slotId));
    setCurrentSavedSlotId(match ? (match.saved_slot_id ?? match.id ?? null) : null);
  }, [savedList, interview.interview_slot_id, interview.id]);

  const renderMainContent = () => {
    if (viewType === "scheduled") {
      const startTime = getStartTime();
      const endTime = getEndTime();
      const formatDate = (d: Date | null) => d ? d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '';
      const formatTime = (d: Date | null) => d ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
      const dateStr = formatDate(startTime) || interview.date || '';
      const timeStr = startTime ? `${formatTime(startTime)}${endTime ? ' - ' + formatTime(endTime) : ''}` : (interview.time || '');
      const diffMs = startTime ? startTime.getTime() - Date.now() : Infinity;
      const displayPriority = (diffMs > 0 && diffMs <= 3 * 3600 * 1000) ? 'HIGH' : (interview.priority || 'normal');

      // Show different view when interview has started
      if (started) {
        const isEnded = endTime ? endTime.getTime() <= Date.now() : false;
        return (
          <div className="space-y-6">
            {/* Top Section - Interview Header with Candidate Profile */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-4">
                <span className="text-sm text-[#FF8351] font-bold">
                  INTERVIEW ID: #{interview.interview_code ?? interview.interview_slot_id ?? interview.id}
                </span>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#FFF5F0] flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-[#FF8351]">
                    {(interview.candidate_name || interview.candidateDetails?.name || 'C').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {interview.candidate_name || interview.candidateDetails?.name || 'Candidate'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {interview.job_role || interview.title}
                  </p>
                </div>
              </div>

              <div className="bg-[#E8E8E8] h-[1px] mb-4"></div>

              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {interview.job_role || interview.title}
              </h2>
              <p className="text-gray-600 mb-6">Experience: {interview.experience}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-medium">{dateStr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="text-sm font-medium">{timeStr}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#E8E8E8] h-[1px] mb-4"></div>

              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-3">
                  SKILLS TO EVALUATE
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(interview.skills && interview.skills.length > 0 ? interview.skills : []).map((skill, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 rounded px-3 py-1 text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#E8E8E8] h-[1px] mb-4"></div>

              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-3">
                  RESUME
                </h3>
                {interview.resume_url ? (
                  <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    <iframe
                      src={`${interview.resume_url}#toolbar=0`}
                      className="w-full h-96 border-none"
                      title="Resume"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No resume available</p>
                )}
              </div>

              {interview.interview_mode && (
                <>
                  <div className="bg-[#E8E8E8] h-[1px] mb-4"></div>
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-3">
                      INTERVIEW MODE
                    </h3>
                    <span className="bg-blue-50 text-blue-700 rounded px-3 py-1 text-xs font-medium">
                      {interview.interview_mode}
                    </span>
                  </div>
                </>
              )}

              {interview.candidate_review && (
                <>
                  <div className="bg-[#E8E8E8] h-[1px] mb-4"></div>
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-3">
                      CANDIDATE REVIEW (Provided by you)
                    </h3>
                    <div className="space-y-4">
                      {/* Ratings */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Communication Skills', rating: interview.candidate_review.communication_skills_rating, comment: interview.candidate_review.communication_skills },
                          { label: 'Technical Knowledge', rating: interview.candidate_review.technical_knowledge_rating, comment: interview.candidate_review.technical_knowledge },
                          { label: 'Problem Solving', rating: interview.candidate_review.problem_solving_analytical_skills_rating, comment: interview.candidate_review.problem_solving_analytical_skills },
                          { label: 'Relevant Experience', rating: interview.candidate_review.relevant_experience_skills_rating, comment: interview.candidate_review.relevant_experience_skills },
                          { label: 'Adaptability', rating: interview.candidate_review.adaptability_learning_ability_rating, comment: interview.candidate_review.adaptability_learning_ability },
                          { label: 'Cultural & Team Fit', rating: interview.candidate_review.cultural_team_fit_rating, comment: interview.candidate_review.cultural_team_fit },
                          { label: 'Overall Impression', rating: interview.candidate_review.overall_impression_rating, comment: interview.candidate_review.overall_impression },
                        ].map((item, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-medium text-gray-700">{item.label}</p>
                              <span className="text-xs font-bold text-[#FF8351]">{item.rating}/5</span>
                            </div>
                            {item.comment && (
                              <p className="text-xs text-gray-500">{item.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Final Recommendation */}
                      {interview.candidate_review.final_recommendation && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Final Recommendation</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${interview.candidate_review.final_recommendation === 'recommend'
                            ? 'bg-green-100 text-green-700'
                            : interview.candidate_review.final_recommendation === 'not_recommend'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {interview.candidate_review.final_recommendation === 'recommend' ? 'Recommended' : interview.candidate_review.final_recommendation === 'not_recommend' ? 'Not Recommended' : interview.candidate_review.final_recommendation}
                          </span>
                        </div>
                      )}

                      {/* Final Comments */}
                      {interview.candidate_review.final_comments && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Final Comments</p>
                          <p className="text-xs text-gray-600">{interview.candidate_review.final_comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {interview.interviewer_review && (
                <>
                  <div className="bg-[#E8E8E8] h-[1px] mb-4"></div>
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-3">
                      YOUR FEEDBACK (GIVEN BY THE CANDIDATE)
                    </h3>
                    <div className="space-y-4">
                      {/* Ratings */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Professionalism & Conduct', rating: interview.interviewer_review.professionalism_conduct_rating, comment: interview.interviewer_review.professionalism_conduct },
                          { label: 'Clarity of Questions', rating: interview.interviewer_review.clarity_of_questions_rating, comment: interview.interviewer_review.clarity_of_questions },
                          { label: 'Knowledge of Role', rating: interview.interviewer_review.knowledge_of_role_rating, comment: interview.interviewer_review.knowledge_of_role },
                          { label: 'Engagement', rating: interview.interviewer_review.engagement_during_interview_rating, comment: interview.interviewer_review.engagement_during_interview },
                          { label: 'Timeliness & Organization', rating: interview.interviewer_review.timeliness_organization_rating, comment: interview.interviewer_review.timeliness_organization },
                          { label: 'Overall Experience', rating: interview.interviewer_review.overall_experience_rating, comment: interview.interviewer_review.overall_experience },
                        ].map((item, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-medium text-gray-700">{item.label}</p>
                              <span className="text-xs font-bold text-[#FF8351]">{item.rating}/5</span>
                            </div>
                            {item.comment && (
                              <p className="text-xs text-gray-500">{item.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Final Comments */}
                      {interview.interviewer_review.final_comments && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Final Comments</p>
                          <p className="text-xs text-gray-600">{interview.interviewer_review.final_comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* <div className="flex items-center justify-between pt-4 border-t border-gray-200 mb-6">
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">
                    {interview.credits} Credits
                  </p>
                </div>
              </div> */}

              {!isEnded && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!interview.meeting_link) {
                        alert('Meeting link not available');
                        return;
                      }
                      window.open(interview.meeting_link, '_blank');
                    }}
                    className="flex-1 px-6 py-3 rounded-md bg-[#4ADE80] text-white font-semibold transition-transform hover:bg-green-500 cursor-pointer text-sm"
                  >
                    Join Now
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }

      // Before interview starts
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-lg text-[#FF8351] font-bold">
                INTERVIEW ID: #{interview.interview_code ?? interview.interview_slot_id ?? interview.id}
              </span>
            </div>
          </div>
          <div className="bg-[#E8E8E8] h-[1px] mb-5"></div>

          {interview.candidate_name && (
            <div className="flex gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#FFF5F0] flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-[#FF8351]">
                  {interview.candidate_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800">
                  {interview.candidate_name}
                </h3>
                <p className="text-sm text-gray-500">Candidate</p>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {interview.job_role || interview.title}
          </h2>

          <p className="text-gray-600 mb-2">Experience: {interview.experience}</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium">{dateStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium">{timeStr}</p>
              </div>
            </div>
            {interview.interview_mode && (
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-blue-700 rounded px-3 py-1 text-xs font-medium">
                  {interview.interview_mode}
                </span>
              </div>
            )}
          </div>

          <div className="bg-[#E8E8E8] h-[1px] mb-5"></div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              SKILLS TO EVALUATE
            </h3>
            <div className="flex flex-wrap gap-3">
              {(interview.skills && interview.skills.length > 0 ? interview.skills : []).map((skill, idx) => (
                <div key={idx} className="bg-gray-50 rounded px-3 py-2 text-sm text-gray-700">
                  {skill}
                </div>
              ))}
            </div>
          </div>

          {interview.resume_url && (
            <>
              <div className="bg-[#E8E8E8] h-[1px] mb-5"></div>
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  RESUME
                </h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    src={`${interview.resume_url}#toolbar=0`}
                    className="w-full h-96 border-none"
                    title="Resume"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 mb-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800">
                {interview.credits} Credits
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-6">
            Note: Candidate details will unlock once the interview begins to
            ensure an unbiased evaluation.
          </p>

          <div className="flex gap-4">
            <button
              className="flex-1 px-6 py-3 rounded-md text-white font-semibold transition-transform cursor-default opacity-95"
              style={{
                background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)",
              }}
              disabled
            >
              Starts in {timeRemaining || 'N/A'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">

          <div>
            <span className="text-lg text-[#FF8351] font-bold">
              INTERVIEW ID: #{interview.interview_code ?? interview.interview_slot_id ?? interview.id}
            </span>
          </div>
          <button
            onClick={handleSaveToggle}
            aria-pressed={saved}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-shadow focus:outline-none bg-white border border-gray-200 ${saved ? 'shadow-sm' : 'hover:bg-gray-50'}`}
            title={saved ? 'Saved' : 'Save'}
          >
            {saved ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="#FF8351" d="M6 2a2 2 0 00-2 2v18l8-4 8 4V4a2 2 0 00-2-2H6z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 2h12a2 2 0 012 2v18l-8-4-8 4V4a2 2 0 012-2z" />
              </svg>
            )}
          </button>
        </div>

        <div className="bg-[#E8E8E8] h-[1px] mb-5"></div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {interview.job_role || interview.title}
        </h2>
        <p className="text-gray-600 mb-6">Experience: {interview.experience}</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm font-medium">{getStartTime() ? getStartTime()!.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : interview.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-xs text-gray-500">Time</p>
              <p className="text-sm font-medium">{getStartTime() ? `${getStartTime()!.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}${getEndTime() ? ' - ' + getEndTime()!.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}` : interview.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const st = getStartTime();
              const diff = st ? st.getTime() - Date.now() : Infinity;
              const dp = (diff > 0 && diff <= 3 * 3600 * 1000) ? 'HIGH' : (interview.priority || 'normal');
              return (
                <span className={`px-3 py-1 text-sm font-medium rounded ${dp === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  Priority: {dp}
                </span>
              );
            })()}
          </div>
        </div>

        <div className="bg-[#E8E8E8] h-[1px] mb-5"></div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">SKILLS TO EVALUATE</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {(interview.skills && interview.skills.length > 0 ? interview.skills : []).map((s, i) => (
              <div key={i} className="bg-gray-50 rounded px-3 py-2 text-sm text-gray-700">{s}</div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">
              {interview.credits} Credits
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Note: Candidate details will unlock once the interview begins to
          ensure an unbiased evaluation.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {bookingError && (
            <p className="text-red-500 text-sm">{bookingError}</p>
          )}
          <button
            onClick={handleBookInterview}
            className={`w-full px-6 py-3 rounded-md text-white font-semibold transition-transform ${bookingLoading ? 'opacity-80 cursor-wait' : 'hover:scale-102 cursor-pointer'}`}
            style={{
              background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)",
            }}
            disabled={bookingLoading}
          >
            {bookingLoading ? 'Booking...' : 'Book Mock Interview'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <VerifiedDashboardHeader
        onBack={onBack}
        title="Take Mock Interview"
      />
      <div className="p-3"></div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">{renderMainContent()}</div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Credits Card */}
          {/* <div className="bg-[#FFF9F0] rounded-lg p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              W
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                100 Credit(s) available
              </p>
              <a href="#" className="text-sm text-[#FF8351] font-medium">
                Redeem in store →
              </a>
            </div>
          </div> */}

          {/* Saved Interviews Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-medium text-[#FF8351]">
                Saved Interview(s)
              </h2>
              <button
                onClick={onToggleSaved}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showAllSaved ? "rotate-0" : "rotate-180"
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              {savedLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">Loading saved interviews...</p>
              ) : displayedSaved.length > 0 ? (
                displayedSaved.map((savedInterview, index) => {
                  const slot = savedInterview.interview_slot || savedInterview;
                  const start = slot.start_time_utc || slot.start_time || slot.date;
                  const end = slot.end_time_utc || slot.end_time || null;
                  const formatDate = (iso?: string) => {
                    if (!iso) return '';
                    try { return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return iso; }
                  };
                  const formatTime = (iso?: string) => {
                    if (!iso) return '';
                    try { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return iso; }
                  };
                  const cardInterview = {
                    id: slot.interview_slot_id ?? slot.id ?? savedInterview.saved_slot_id,
                    saved_slot_id: savedInterview.saved_slot_id ?? slot.saved_slot_id ?? undefined,
                    interview_slot_id: slot.interview_slot_id ?? slot.id,
                    interview_code: slot.interview_code,
                    title: slot.job_role || slot.title || '',
                    experience: slot.experience || '',
                    date: start ? formatDate(start) : (slot.date || ''),
                    time: start ? `${formatTime(start)}${end ? ' - ' + formatTime(end) : ''}` : (slot.time || ''),
                    raw: slot,
                  };

                  return (
                    <SavedInterviewCard
                      key={index}
                      interview={cardInterview}
                      onViewDetails={() =>
                        onViewDetails && onViewDetails(
                          {
                            ...slot,
                            credits: 15,
                            priority: slot.priority || 'normal',
                          },
                          'saved'
                        )
                      }
                      onRemove={async (payload) => {
                        const parsed = JSON.parse(localStorage.getItem("user") || "{}");
                        const token = parsed?.token || localStorage.getItem("token");
                        const userId = parsed?.user_id || parsed?.userId || parsed?.id || localStorage.getItem("user_id");
                        // Prefer the saved_slot_id attached to the savedInterview record first,
                        // then payload.saved_slot_id, then payload.id/interview_slot_id, then fallback.
                        const savedSlotId = (savedInterview as any).saved_slot_id ?? payload?.saved_slot_id ?? payload?.id ?? payload?.interview_slot_id ?? currentSavedSlotId;
                        console.debug('Removing saved slot - resolved ids:', { savedInterviewId: (savedInterview as any).saved_slot_id, payload }, 'resolvedSavedSlotId:', savedSlotId);
                        if (userId && token && savedSlotId) {
                          try {
                            await removeSavedInterviewSlot(userId, token, savedSlotId);
                            await fetchSavedSlots();
                          } catch (e) {
                            console.warn('Failed to remove saved slot', e);
                          }
                        }
                      }}
                    />
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No saved interviews</p>
              )}
              {savedError && <p className="text-xs text-red-500">{savedError}</p>}
            </div>
          </div>
        </div>
      </div>


      {/* Booking Success Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Interview ID #{interview.id} Booked
              </h3>

              <p className="text-gray-600 mb-6">
                {interview.date}, {interview.time} - 4:00 PM
              </p>

              <button
                onClick={() => {
                  setShowBookingModal(false);
                  onBack();
                }}
                className="px-6 py-2.5 rounded-md text-white font-semibold"
                style={{
                  background:
                    "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)",
                }}
              >
                Go to Interview Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InterviewDetailsView;
