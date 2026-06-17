import DashNav from "@/components/dashnav/dashnav";
import { ArrowLeft, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getMockInterviewBookingById,
  getMockInterviewBookings,
  submitInterviewerReview,
} from "./mockInterviewService";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const feedbackSections = [
  {
    title: "1. Professionalism & Conduct",
    description:
      "Evaluate the interviewer's professional behavior, respectful communication, and overall conduct during the interview.",
    ratingKey: "professionalism_conduct",
    commentKey: "professionalism_conduct",
  },
  {
    title: "2. Clarity of Questions",
    description:
      "Assess how clearly and concisely the interviewer framed questions, and whether they were relevant to the role.",
    ratingKey: "clarity_of_questions",
    commentKey: "clarity_of_questions",
  },
  {
    title: "3. Knowledge of Role",
    description:
      "Evaluate the interviewer's depth of knowledge about the job role, required skills, and the technical domain.",
    ratingKey: "knowledge_of_role",
    commentKey: "knowledge_of_role",
  },
  {
    title: "4. Engagement During Interview",
    description:
      "Assess how engaged and attentive the interviewer was throughout the session — including active listening and follow-up questions.",
    ratingKey: "engagement_during_interview",
    commentKey: "engagement_during_interview",
  },
  {
    title: "5. Timeliness & Organization",
    description:
      "Evaluate whether the interview started on time, was well-structured, and concluded within the scheduled duration.",
    ratingKey: "timeliness_organization",
    commentKey: "timeliness_organization",
  },
  {
    title: "6. Overall Experience",
    description:
      "Provide your overall assessment of the interview experience from a candidate's perspective.",
    ratingKey: "overall_experience",
    commentKey: "overall_experience",
  },
];

const initialRatings: Record<string, number> = {
  professionalism_conduct: 0,
  clarity_of_questions: 0,
  knowledge_of_role: 0,
  engagement_during_interview: 0,
  timeliness_organization: 0,
  overall_experience: 0,
};

const initialComments: Record<string, string> = {
  professionalism_conduct: "",
  clarity_of_questions: "",
  knowledge_of_role: "",
  engagement_during_interview: "",
  timeliness_organization: "",
  overall_experience: "",
  final: "",
};

// ---------------------------------------------------------------------------
// Normalisation helpers — resolve once, store cleanly
// ---------------------------------------------------------------------------

/** Unwrap various API envelope shapes and return the raw booking object. */
const normalizeInterview = (response: any): any =>
  response?.booking || response?.data || response?.interview || response;

/** Unwrap various API envelope shapes and return a flat array of bookings. */
const normalizeBookings = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.bookings)) return response.bookings;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

/** Return a string/number interview ID from whichever key the API uses. */
const getInterviewId = (interview: any, fallback?: string): string | number | undefined =>
  interview?.interview_schedule_id ??
  interview?.mock_interview_id ??
  interview?.mockInterviewId ??
  interview?.booking_id ??
  interview?.id ??
  fallback;

/** Return a string/number candidate ID from whichever key the API uses. */
const getCandidateId = (interview: any): string | number | undefined =>
  interview?.candidate_id ??
  interview?.candidateId ??
  interview?.candidate_user_id ??
  interview?.candidateUserId ??
  interview?.user_id ??
  interview?.userId ??
  interview?.candidate?.user_id ??
  interview?.candidate?.userId ??
  interview?.candidate?.candidate_id ??
  interview?.candidate?.id ??
  interview?.user?.user_id ??
  interview?.user?.id;

/** Return a string/number interviewer ID from whichever key the API uses. */
const getInterviewerId = (interview: any): string | number | undefined =>
  interview?.interviewer_id ??
  interview?.interviewerId ??
  interview?.interviewer_user_id ??
  interview?.interviewerUserId ??
  interview?.assigned_interviewer_id ??
  interview?.assignedInterviewerId ??
  interview?.assigned_to ??
  interview?.assignedTo ??
  interview?.interviewer?.user_id ??
  interview?.interviewer?.userId ??
  interview?.interviewer?.interviewer_id ??
  interview?.interviewer?.id ??
  interview?.interviewer?.user?.user_id ??
  interview?.interviewer?.user?.id;

/**
 * Merge raw API shapes into a single normalised interview object that always
 * has `candidate_id` and `interviewer_id` at the top level.
 */
const buildNormalisedInterview = (
  primary: any,
  secondary?: any,
  overrideCandidateId?: string | number,
  overrideInterviewerId?: string | number
): any => ({
  ...primary,
  ...(secondary ?? {}),
  candidate_id:
    overrideCandidateId ??
    getCandidateId(primary) ??
    getCandidateId(secondary),
  interviewer_id:
    overrideInterviewerId ??
    getInterviewerId(primary) ??
    getInterviewerId(secondary),
});

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const formatIndianDateTime = (value?: string): string => {
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const InterviewerReviewsPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // IDs passed explicitly from the bookings list page via route state
  const routeState = (location.state as any) ?? {};
  const routeBooking: any | undefined = routeState?.booking;
  const routeCandidateId: string | number | undefined = routeState?.candidate_id;
  const routeInterviewerId: string | number | undefined = routeState?.interviewer_id;

  const currentUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const currentUserId: string | number | undefined = currentUser?.user_id;
  const token: string | undefined = currentUser?.token;

  // If we already have both IDs from route state, skip the fetch entirely.
  // candidateId always has a fallback (currentUserId), so we only require
  // routeInterviewerId to skip the fetch.
  const alreadyHasIds =
    Boolean(routeCandidateId ?? currentUserId) && Boolean(routeInterviewerId);

  const [interview, setInterview] = useState<any>(
    routeBooking
      ? buildNormalisedInterview(
          routeBooking,
          undefined,
          // Always supply currentUserId as candidate fallback — the logged-in
          // user is always the candidate on this page.
          routeCandidateId ?? currentUserId,
          routeInterviewerId
        )
      : null
  );
  const [ratings, setRatings] = useState<Record<string, number>>(initialRatings);
  const [comments, setComments] = useState<Record<string, string>>(initialComments);
  const [loading, setLoading] = useState(!routeBooking && !alreadyHasIds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hasFetched = useRef(false);

  // -------------------------------------------------------------------------
  // Fetch interview if we don't already have it
  // -------------------------------------------------------------------------

  useEffect(() => {
    // Skip if we already loaded from route state or have already fetched
    if (!id || alreadyHasIds || hasFetched.current) return;

    // If route gave us a booking and we can already extract both IDs, use it
    if (routeBooking && getCandidateId(routeBooking) && getInterviewerId(routeBooking)) {
      setInterview(buildNormalisedInterview(routeBooking));
      setLoading(false);
      return;
    }

    hasFetched.current = true;

    const fetchInterview = async () => {
      if (!currentUserId || !token) {
        setError("Please log in again to load this interview.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Primary fetch — single booking by ID
        const primaryResponse = await getMockInterviewBookingById(currentUserId, token, id);
        const primaryBooking = normalizeInterview(primaryResponse);

        const candidateId = getCandidateId(primaryBooking);
        const interviewerId = getInterviewerId(primaryBooking);

        if (candidateId && interviewerId) {
          // Happy path — single fetch was enough
          setInterview(buildNormalisedInterview(primaryBooking));
          return;
        }

        // Fallback — search the full bookings list for the matching entry and
        // merge it with the primary result to fill in the missing IDs.
        const bookingsResponse = await getMockInterviewBookings(currentUserId, token);
        const matchingBooking = normalizeBookings(bookingsResponse).find(
          (item: any) => String(getInterviewId(item)) === String(id)
        );

        setInterview(
          buildNormalisedInterview(primaryBooking, matchingBooking)
        );
      } catch (err: any) {
        setError(
          err?.response?.data?.message ??
            err?.message ??
            "Unable to load interview details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id, token, currentUserId, alreadyHasIds, routeBooking]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleRatingChange = (category: string, value: number) =>
    setRatings((prev) => ({ ...prev, [category]: value }));

  const handleCommentChange = (category: string, value: string) =>
    setComments((prev) => ({ ...prev, [category]: value }));

  const handleSubmit = async () => {
    setError("");

    const interviewId = Number(getInterviewId(interview, id));

    // Resolve candidate and interviewer IDs — route state takes precedence,
    // then normalised interview object, then fall back to current user for
    // candidate only (the logged-in user is always the candidate here).
    const rawCandidateId =
      routeCandidateId ??
      interview?.candidate_id ??
      currentUserId;
    const rawInterviewerId =
      routeInterviewerId ??
      interview?.interviewer_id;

    const candidateId = rawCandidateId ? Number(rawCandidateId) : NaN;
    const interviewerId = rawInterviewerId ? Number(rawInterviewerId) : NaN;

    // Guard: interview ID
    if (!interviewId || Number.isNaN(interviewId)) {
      setError("Unable to find this interview. Please go back and try again.");
      return;
    }

    // Guard: auth
    if (!currentUserId || !token) {
      setError("Please log in again to submit feedback.");
      return;
    }

    // Guard: candidate + interviewer IDs
    if (!candidateId || Number.isNaN(candidateId)) {
      setError(
        "Could not identify the candidate for this session. " +
          "Please go back to your bookings and open the feedback form from there."
      );
      return;
    }
    if (!interviewerId || Number.isNaN(interviewerId)) {
      setError(
        "Could not identify the interviewer for this session. " +
          "Please go back to your bookings and open the feedback form from there."
      );
      return;
    }

    // Guard: all ratings filled
    if (!Object.values(ratings).every((r) => r > 0)) {
      setError("Please rate all six categories before submitting.");
      return;
    }

    // Guard: all comments filled
    if (!Object.values(comments).every((c) => c.trim() !== "")) {
      setError("Please fill in all comment fields before submitting.");
      return;
    }

    const payload = {
      interview_schedule_id: interviewId,
      mock_interview_id: interviewId,
      candidate_id: candidateId,
      interviewer_id: interviewerId,
      professionalism_conduct: comments.professionalism_conduct,
      clarity_of_questions: comments.clarity_of_questions,
      knowledge_of_role: comments.knowledge_of_role,
      engagement_during_interview: comments.engagement_during_interview,
      timeliness_organization: comments.timeliness_organization,
      overall_experience: comments.overall_experience,
      final_comments: comments.final,
      professionalism_conduct_rating: ratings.professionalism_conduct,
      clarity_of_questions_rating: ratings.clarity_of_questions,
      knowledge_of_role_rating: ratings.knowledge_of_role,
      engagement_during_interview_rating: ratings.engagement_during_interview,
      timeliness_organization_rating: ratings.timeliness_organization,
      overall_experience_rating: ratings.overall_experience,
    };

    try {
      setSubmitting(true);
      await submitInterviewerReview(currentUserId, token, payload);
      navigate("/interviews/mock-interview/bookings", {
        replace: true,
        state: { interviewerFeedbackSubmitted: true },
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Unable to submit feedback. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Derived display values
  // -------------------------------------------------------------------------

  const displayInterviewId = getInterviewId(interview, id) ?? "N/A";
  const displayCandidateId = routeCandidateId ?? interview?.candidate_id ?? currentUserId ?? "N/A";
  const displayInterviewerId = routeInterviewerId ?? interview?.interviewer_id ?? "N/A";

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-['Baloo_2']">
      <DashNav heading="Interviewer Feedback" />

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#666666] shadow-sm transition hover:bg-[#FFF0E3] hover:text-[#F26D3A]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-[#EFEFEF] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F26D3A]">
                Interviewer feedback
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#2F2F2F]">
                {interview?.job_role || interview?.title || "Mock interview"}
              </h1>
              <p className="mt-1 text-sm text-[#777777]">
                {loading
                  ? "Loading interview…"
                  : formatIndianDateTime(
                      interview?.end_time_utc ??
                        interview?.start_time_utc ??
                        interview?.scheduled_time
                    )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#FFF0E3] px-3 py-1 text-xs font-bold text-[#F26D3A]">
                Interview #{displayInterviewId}
              </span>
              <span className="rounded-full bg-[#FAFAFA] px-3 py-1 text-xs font-bold text-[#666666]">
                Candidate #{displayCandidateId}
              </span>
              <span className="rounded-full bg-[#FAFAFA] px-3 py-1 text-xs font-bold text-[#666666]">
                Interviewer #{displayInterviewerId}
              </span>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          {/* Feedback sections */}
          <div className="mt-4 space-y-3">
            {feedbackSections.map((section) => (
              <div
                key={section.ratingKey}
                className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="font-bold text-[#2F2F2F]">{section.title}</h2>
                    <p className="mt-1 text-sm leading-5 text-[#777777]">
                      {section.description}
                    </p>
                  </div>

                  {/* Star rating buttons */}
                  <div className="flex shrink-0 gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingChange(section.ratingKey, rating)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold transition ${
                          ratings[section.ratingKey] === rating
                            ? "border-[#F26D3A] bg-[#FFF0E3] text-[#F26D3A]"
                            : "border-[#D9D9D9] bg-white text-[#777777] hover:border-[#F26D3A]"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={comments[section.commentKey] ?? ""}
                  onChange={(e) => handleCommentChange(section.commentKey, e.target.value)}
                  placeholder="Type your comments here"
                  className="mt-3 h-20 w-full resize-none rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#2F2F2F] outline-none transition focus:border-[#F26D3A]"
                />
              </div>
            ))}

            {/* Final comments */}
            <div className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-4">
              <h2 className="font-bold text-[#2F2F2F]">Final comments</h2>
              <p className="mt-1 text-sm text-[#777777]">
                Provide any additional comments about the interview experience.
              </p>
              <textarea
                value={comments.final ?? ""}
                onChange={(e) => handleCommentChange("final", e.target.value)}
                placeholder="Type final comments here"
                className="mt-3 h-20 w-full resize-none rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#2F2F2F] outline-none transition focus:border-[#F26D3A]"
              />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 mt-4 flex flex-col gap-3 border-t border-[#EFEFEF] bg-white py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#777777]">
              All ratings and comments are required.
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F26D3A] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#e35f2f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Star size={16} />
              {submitting ? "Submitting…" : "Submit feedback"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InterviewerReviewsPage;