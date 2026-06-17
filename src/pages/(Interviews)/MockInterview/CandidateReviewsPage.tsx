import DashNav from "@/components/dashnav/dashnav";
import { ArrowLeft, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getMockInterviewBookingById,
  getMockInterviewBookings,
  submitCandidateReview,
} from "./mockInterviewService";

const feedbackSections = [
  {
    title: "1. Communication Skills",
    description:
      "Ability to clearly articulate thoughts, listening skills and response relevance, confidence in communication",
    ratingKey: "communication",
    commentKey: "communication",
  },
  {
    title: "2. Technical Knowledge",
    description:
      "Understanding of key technical concepts related to the role, depth of knowledge in relevant technologies, ability to discuss technical topics",
    ratingKey: "technicalKnowledge",
    commentKey: "technicalKnowledge",
  },
  {
    title: "3. Problem-Solving and Analytical Skills",
    description:
      "Ability to break down problems and apply logical thinking, quality of solutions or suggestions provided, approach to handling challenging questions",
    ratingKey: "problemSolving",
    commentKey: "problemSolving",
  },
  {
    title: "4. Relevant Experience and Skills",
    description:
      "Fit based on previous experience in similar roles, technical skills match the role requirements, breadth of knowledge in relevant areas",
    ratingKey: "relevantExperience",
    commentKey: "relevantExperience",
  },
  {
    title: "5. Adaptability and Learning Ability",
    description:
      "Willingness to learn and improve, ability to quickly grasp new ideas or concepts, adaptability to changes or new challenges",
    ratingKey: "adaptability",
    commentKey: "adaptability",
  },
  {
    title: "6. Cultural and Team Fit",
    description:
      "Alignment with company values and culture, collaboration and teamwork potential, attitude, enthusiasm, and professionalism",
    ratingKey: "culturalFit",
    commentKey: "culturalFit",
  },
  {
    title: "7. Overall Impression",
    description:
      "General ability to succeed in this role, confidence in the candidate's fit for the company, overall performance during the interview",
    ratingKey: "overall",
    commentKey: "overall",
  },
];

const initialRatings: Record<string, number> = {
  communication: 0,
  technicalKnowledge: 0,
  problemSolving: 0,
  relevantExperience: 0,
  adaptability: 0,
  culturalFit: 0,
  overall: 0,
};

const initialComments: Record<string, string> = {
  communication: "",
  technicalKnowledge: "",
  problemSolving: "",
  relevantExperience: "",
  adaptability: "",
  culturalFit: "",
  overall: "",
  final: "",
};

const normalizeInterview = (response: any) =>
  response?.booking || response?.data || response?.interview || response;

const getInterviewId = (interview: any, fallback?: string) =>
  interview?.interview_schedule_id ||
  interview?.mock_interview_id ||
  interview?.mockInterviewId ||
  interview?.booking_id ||
  interview?.id ||
  fallback;

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

const normalizeBookings = (response: any) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.bookings)) return response.bookings;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

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

const CandidateReviewsPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state as any) || {};
  const [interview, setInterview] = useState<any>(routeState?.interview || null);
  const [ratings, setRatings] = useState<Record<string, number>>(initialRatings);
  const [comments, setComments] = useState<Record<string, string>>(initialComments);
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(!((location.state as any)?.interview));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser?.user_id;
  const routeCandidateId = routeState?.candidate_id;
  const routeInterviewerId = routeState?.interviewer_id;

  useEffect(() => {
    const fetchInterview = async () => {
      if (interview || !id) return;

      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;
        const token = user?.token;

        if (!userId || !token) {
          setError("Please login again to load this interview.");
          return;
        }

        const response = await getMockInterviewBookingById(userId, token, id);
        const booking = normalizeInterview(response);

        if (getCandidateId(booking) && getInterviewerId(booking)) {
          setInterview(booking);
          return;
        }

        const bookingsResponse = await getMockInterviewBookings(userId, token);
        const matchingBooking = normalizeBookings(bookingsResponse).find(
          (item: any) => String(getInterviewId(item)) === String(id)
        );

        setInterview({
          ...booking,
          ...(matchingBooking || {}),
          candidate_id: getCandidateId(booking) || getCandidateId(matchingBooking),
          interviewer_id: getInterviewerId(booking) || getInterviewerId(matchingBooking),
        });
      } catch (error: any) {
        setError(
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load interview details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id, interview]);

  const handleRatingChange = (category: string, value: number) => {
    setRatings((currentRatings) => ({
      ...currentRatings,
      [category]: value,
    }));
  };

  const handleCommentChange = (category: string, value: string) => {
    setComments((currentComments) => ({
      ...currentComments,
      [category]: value,
    }));
  };

  const handleSubmit = async () => {
    const interviewId = Number(getInterviewId(interview, id));
    const userId = currentUserId;
    const token = currentUser?.token;
    const candidateId = Number(routeCandidateId || getCandidateId(interview));
    const interviewerId = Number(routeInterviewerId || getInterviewerId(interview) || userId);

    setError("");
    setSuccess("");

    if (!interviewId || Number.isNaN(interviewId)) {
      setError("Unable to find this interview id.");
      return;
    }

    if (!userId || !token) {
      setError("Please login again to submit feedback.");
      return;
    }

    if (Number.isNaN(candidateId) || Number.isNaN(interviewerId)) {
      setError(
        "Candidate ID and interviewer ID are required to submit feedback. Please go back to dashboard and open feedback again."
      );
      return;
    }

    if (!Object.values(ratings).every((rating) => rating > 0)) {
      setError("All rating fields are mandatory. Please rate all categories.");
      return;
    }

    if (!Object.values(comments).every((comment) => comment.trim() !== "")) {
      setError("All comment fields are mandatory. Please fill all sections.");
      return;
    }

    if (!recommendation) {
      setError("Final recommendation is mandatory. Please select one.");
      return;
    }

    const payload = {
      interview_schedule_id: interviewId,
      mock_interview_id: interviewId,
      candidate_id: candidateId,
      interviewer_id: interviewerId,
      communication_skills: comments.communication,
      technical_knowledge: comments.technicalKnowledge,
      problem_solving_analytical_skills: comments.problemSolving,
      relevant_experience_skills: comments.relevantExperience,
      adaptability_learning_ability: comments.adaptability,
      cultural_team_fit: comments.culturalFit,
      overall_impression: comments.overall,
      final_comments: comments.final,
      final_recommendation: recommendation,
      communication_skills_rating: ratings.communication,
      technical_knowledge_rating: ratings.technicalKnowledge,
      problem_solving_analytical_skills_rating: ratings.problemSolving,
      relevant_experience_skills_rating: ratings.relevantExperience,
      adaptability_learning_ability_rating: ratings.adaptability,
      cultural_team_fit_rating: ratings.culturalFit,
      overall_impression_rating: ratings.overall,
    };

    try {
      setSubmitting(true);
      await submitCandidateReview(userId, token, payload);
      setSuccess("Candidate feedback submitted successfully.");
      navigate("/interviews/mock-interview/dashboard", {
        replace: true,
        state: { feedbackSubmitted: true },
      });
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to submit candidate feedback."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const displayedCandidateId = getCandidateId(interview);
  const displayedInterviewerId = getInterviewerId(interview) || currentUserId;

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-['Baloo_2']">
      <DashNav heading="Candidate Reviews" />

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#666666] shadow-sm transition hover:bg-[#FFF0E3] hover:text-[#F26D3A]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 border-b border-[#EFEFEF] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F26D3A]">
                Candidate feedback
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#2F2F2F]">
                {interview?.job_role || interview?.title || "Mock interview"}
              </h1>
              <p className="mt-1 text-sm text-[#777777]">
                {loading
                  ? "Loading interview..."
                  : formatIndianDateTime(
                    interview?.end_time_utc ||
                    interview?.start_time_utc ||
                    interview?.scheduled_time
                  )}
              </p>
            </div>
            <span className="rounded-full bg-[#FFF0E3] px-3 py-1 text-xs font-bold text-[#F26D3A]">
              Interview #{getInterviewId(interview, id) || "N/A"}
            </span>
          </div>



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
                  <div className="flex shrink-0 gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingChange(section.ratingKey, rating)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold transition ${ratings[section.ratingKey] === rating
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
                  value={comments[section.commentKey] || ""}
                  onChange={(event) =>
                    handleCommentChange(section.commentKey, event.target.value)
                  }
                  placeholder="Type your comments here"
                  className="mt-3 h-20 w-full resize-none rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#2F2F2F] outline-none transition focus:border-[#F26D3A]"
                />
              </div>
            ))}

            <div className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-4">
              <h2 className="font-bold text-[#2F2F2F]">Final comments</h2>
              <p className="mt-1 text-sm text-[#777777]">
                Add any extra feedback or suggestions about the candidate.
              </p>
              <textarea
                value={comments.final || ""}
                onChange={(event) => handleCommentChange("final", event.target.value)}
                placeholder="Type final comments here"
                className="mt-3 h-20 w-full resize-none rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#2F2F2F] outline-none transition focus:border-[#F26D3A]"
              />
            </div>

            <div className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-4">
              <h2 className="font-bold text-[#2F2F2F]">
                Final recommendation for job role
              </h2>
              <p className="mt-1 text-sm text-[#777777]">
                This will not be shown to the candidate.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { value: "highly_recommend", label: "Highly Recommend" },
                  { value: "recommend", label: "Recommend" },
                  { value: "neutral", label: "Neutral" },
                  { value: "not_recommend", label: "Not Recommend" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRecommendation(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${recommendation === option.value
                        ? "bg-[#FFF0E3] text-[#F26D3A] ring-1 ring-[#F26D3A]"
                        : "bg-white text-[#666666] ring-1 ring-[#D9D9D9] hover:ring-[#F26D3A]"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && (
            <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 rounded-2xl bg-green-50 p-3 text-sm font-semibold text-green-700">
              {success}
            </p>
          )}
          <div className="sticky bottom-0 mt-4 flex flex-col gap-3 border-t border-[#EFEFEF] bg-white py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#777777]">
              All ratings, comments, and final recommendation are required.
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F26D3A] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#e35f2f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Star size={16} />
              {submitting ? "Submitting..." : "Submit feedback"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CandidateReviewsPage;
