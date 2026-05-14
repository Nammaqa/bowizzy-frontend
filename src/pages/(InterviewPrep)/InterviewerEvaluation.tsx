import React, { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import DashNav from "@/components/dashnav/dashnav";
import api from "@/api";

const SkillBadge = ({ skill }: { skill: string }) => (
  <div className="flex flex-col items-center bg-white w-[140px] pb-[1px] rounded-lg">
    <span className="text-[#3A3A3A] text-base">{skill}</span>
  </div>
);

const RatingSection = React.memo(
  ({
    title,
    description,
    category,
    ratings,
    comments,
    handleRatingChange,
    handleCommentChange,
  }: {
    title: string;
    description: string;
    category: string;
    ratings: Record<string, number>;
    comments: Record<string, string>;
    handleRatingChange: (category: string, value: number) => void;
    handleCommentChange: (category: string, value: string) => void;
  }) => (
    <div className="flex flex-col items-start self-stretch bg-white py-5 mb-6 rounded-lg border border-solid border-[#CACACA]">
      <div className="flex flex-col items-start mb-3 ml-5">
        <span className="text-[#3A3A3A] text-lg font-medium">{title}</span>
      </div>
      <div className="flex flex-col items-start mb-4 ml-5">
        <span className="text-[#7F7F7F] text-sm leading-relaxed">{description}</span>
      </div>
      <div className="flex items-center self-stretch mb-4 mx-5">
        <div className="flex flex-col items-center mr-4">
          <span className="text-[#3A3A3A] text-sm font-medium">RATE:</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => handleRatingChange(category, value)}
              className={`flex items-center justify-center w-8 h-8 rounded border border-solid transition-all ${
                ratings[category] === value
                  ? "bg-[#FFF0E3] border-[#F26D3A] text-[#F26D3A]"
                  : "bg-white border-[#CACACA] text-[#3A3A3A]"
              }`}
            >
              <span className="text-sm font-medium">{value}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-start self-stretch mx-5">
        <span className="text-[#3A3A3A] text-sm font-medium mb-2">Comments</span>
        <textarea
          value={comments[category] || ""}
          onChange={(e) => handleCommentChange(category, e.target.value)}
          placeholder="Type your comments here!!"
          className="w-full h-20 pt-2 px-3 rounded border border-solid border-[#CACACA] text-[#3A3A3A] text-sm resize-none focus:outline-none focus:border-[#F26D3A]"
        />
      </div>
    </div>
  )
);

const InterviewerEvaluation = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Schedule object passed from InterviewPrep via navigate state
  // Structure matches getCandidateSchedules response
  const schedule = (location.state as any)?.schedule;
  const slot = schedule?.interview_slot || {};
  const interviewer = schedule?.interviewer || {};

  const formatTime = (utc: string) => {
    if (!utc) return "N/A";
    return new Date(utc).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const formatDate = (utc: string) => {
    if (!utc) return "N/A";
    return new Date(utc)
      .toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
      .replace(",", "");
  };

  const interviewDate = formatDate(schedule?.start_time_utc);
  const interviewTime = `${formatTime(schedule?.start_time_utc)} - ${formatTime(schedule?.end_time_utc)}`;
  const interviewerName = interviewer.first_name
    ? `${interviewer.first_name} ${interviewer.last_name || ""}`.trim()
    : "Unknown Interviewer";
  const jobRole = slot.job_role || "N/A";
  const experience = slot.experience || "N/A";
  const skills: string[] = slot.skills || [];
  const displayId = scheduleId ? `#${scheduleId}` : `#${schedule?.interview_schedule_id || ""}`;


  const [ratings, setRatings] = useState({
    professionalism_conduct: 0,
    clarity_of_questions: 0,
    knowledge_of_role: 0,
    engagement_during_interview: 0,
    timeliness_organization: 0,
    overall_experience: 0,
  });

  const [comments, setComments] = useState({
    professionalism_conduct: "",
    clarity_of_questions: "",
    knowledge_of_role: "",
    engagement_during_interview: "",
    timeliness_organization: "",
    overall_experience: "",
    final: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (category: string, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleCommentChange = (category: string, value: string) => {
    setComments((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async () => {
    setValidationError(null);

    const allRatingsFilled = Object.values(ratings).every((r) => r > 0);
    if (!allRatingsFilled) {
      setValidationError("All rating fields are mandatory. Please rate all categories.");
      return;
    }

    const allCommentsFilled =
      comments.professionalism_conduct.trim() !== "" &&
      comments.clarity_of_questions.trim() !== "" &&
      comments.knowledge_of_role.trim() !== "" &&
      comments.engagement_during_interview.trim() !== "" &&
      comments.timeliness_organization.trim() !== "" &&
      comments.overall_experience.trim() !== "" &&
      comments.final.trim() !== "";
    if (!allCommentsFilled) {
      setValidationError("All comment fields are mandatory. Please fill in all sections.");
      return;
    }

    const payload = {
      interview_schedule_id: schedule?.interview_schedule_id || parseInt(scheduleId || "0"),
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

    setIsSubmitting(true);
    try {
      const parsed = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = parsed?.user_id || parsed?.userId || parsed?.id;
      const token = parsed?.token || "";

      if (!userId) {
        setValidationError("User ID not found. Please login again.");
        return;
      }

      await api.post(
        `/users/${userId}/mock-interview/interviewer-review`,
        payload,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      alert("Evaluation submitted successfully!");
      navigate(-1);
      setRatings({
        professionalism_conduct: 0,
        clarity_of_questions: 0,
        knowledge_of_role: 0,
        engagement_during_interview: 0,
        timeliness_organization: 0,
        overall_experience: 0,
      });
      setComments({
        professionalism_conduct: "",
        clarity_of_questions: "",
        knowledge_of_role: "",
        engagement_during_interview: "",
        timeliness_organization: "",
        overall_experience: "",
        final: "",
      });
    } catch (err: any) {
      setValidationError(
        err?.response?.data?.message || err?.message || "Failed to submit evaluation. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
      setRatings({
        professionalism_conduct: 0,
        clarity_of_questions: 0,
        knowledge_of_role: 0,
        engagement_during_interview: 0,
        timeliness_organization: 0,
        overall_experience: 0,
      });
      setComments({
        professionalism_conduct: "",
        clarity_of_questions: "",
        knowledge_of_role: "",
        engagement_during_interview: "",
        timeliness_organization: "",
        overall_experience: "",
        final: "",
      });
      setValidationError(null);
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col h-screen font-['Baloo_2'] overflow-hidden">
      <DashNav heading="Give Mock Interview" />
      <div className="flex-1 overflow-auto bg-[#F5F5F5] p-4 lg:p-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="bg-white rounded-[20px] mb-6 shadow-sm">
            <div className="pt-5 pb-8">
              <div className="flex flex-col items-start mb-5 ml-5">
                <span className="text-[#F26D3A] text-xl font-semibold">
                  Interview ID: {displayId}
                </span>
              </div>
              <div className="border-t border-[#DEDEDE] mx-5 mb-5"></div>
              <div className="flex flex-wrap items-center mb-5 gap-3 ml-7">
                <span className="text-black text-xl">Interviewer:</span>
                <span className="text-black text-xl font-semibold">
                  {interviewerName}
                </span>
              </div>
              <div className="flex flex-wrap justify-between mb-5 mx-7">
                <div className="flex items-center gap-2">
                  <span className="text-black text-lg">Job Role:</span>
                  <span className="text-black text-lg font-semibold">
                    {jobRole}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-black text-lg">Experience:</span>
                  <span className="text-black text-lg font-semibold">
                    {experience}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap justify-between items-center mb-5 mx-7 gap-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
                      stroke="#3A3A3A"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-black text-base">{interviewDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="#3A3A3A"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 6V12L16 14"
                      stroke="#3A3A3A"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-black text-base">{interviewTime}</span>
                </div>
              </div>
              <div className="border-t border-[#DEDEDE] mx-5 mb-5"></div>
              <div className="px-5">
                <div className="mb-5">
                  <span className="block text-black text-base mb-3">Skills</span>
                  <div className="flex flex-wrap gap-3">
                    {skills.length > 0 ? (
                      skills.map((skill, i) => (
                        <SkillBadge key={i} skill={skill} />
                      ))
                    ) : (
                      <span className="text-[#7F7F7F] text-sm">No skills listed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] shadow-sm p-5">
            <span className="text-[#3A3A3A] text-lg font-medium mb-5 block">
              INTERVIEWER EVALUATION
            </span>
            <RatingSection
              title="1. Professionalism & Conduct"
              description="Evaluate the interviewer's professional behavior, respectful communication, and overall conduct during the interview."
              category="professionalism_conduct"
              ratings={ratings}
              comments={comments}
              handleRatingChange={handleRatingChange}
              handleCommentChange={handleCommentChange}
            />
            <RatingSection
              title="2. Clarity of Questions"
              description="Assess how clearly and concisely the interviewer framed questions, and whether they were relevant to the role."
              category="clarity_of_questions"
              ratings={ratings}
              comments={comments}
              handleRatingChange={handleRatingChange}
              handleCommentChange={handleCommentChange}
            />
            <RatingSection
              title="3. Knowledge of Role"
              description="Evaluate the interviewer's depth of knowledge about the job role, required skills, and the technical domain."
              category="knowledge_of_role"
              ratings={ratings}
              comments={comments}
              handleRatingChange={handleRatingChange}
              handleCommentChange={handleCommentChange}
            />
            <RatingSection
              title="4. Engagement During Interview"
              description="Assess how engaged and attentive the interviewer was throughout the session — including active listening and follow-up questions."
              category="engagement_during_interview"
              ratings={ratings}
              comments={comments}
              handleRatingChange={handleRatingChange}
              handleCommentChange={handleCommentChange}
            />
            <RatingSection
              title="5. Timeliness & Organization"
              description="Evaluate whether the interview started on time, was well-structured, and concluded within the scheduled duration."
              category="timeliness_organization"
              ratings={ratings}
              comments={comments}
              handleRatingChange={handleRatingChange}
              handleCommentChange={handleCommentChange}
            />
            <RatingSection
              title="6. Overall Experience"
              description="Provide your overall assessment of the interview experience from a candidate's perspective."
              category="overall_experience"
              ratings={ratings}
              comments={comments}
              handleRatingChange={handleRatingChange}
              handleCommentChange={handleCommentChange}
            />
            <div className="flex flex-col bg-white py-5 mb-6 rounded-lg border border-solid border-[#CACACA]">
              <div className="ml-5 mb-3">
                <span className="text-[#3A3A3A] text-lg font-medium">FINAL COMMENTS</span>
              </div>
              <div className="mx-5">
                <span className="text-[#7F7F7F] text-sm block mb-2">
                  Provide any additional comments or observations about the candidate that weren't covered in the previous sections.
                </span>
                <textarea
                  value={comments.final || ""}
                  onChange={(e) => handleCommentChange("final", e.target.value)}
                  placeholder="Type your comments here!!"
                  className="w-full h-20 pt-2 px-3 rounded border border-solid border-[#CACACA] text-[#3A3A3A] text-sm resize-none focus:outline-none focus:border-[#F26D3A]"
                />
              </div>
            </div>
            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {validationError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-8 py-2 border border-solid border-[#CACACA] text-[#3A3A3A] rounded text-base font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-2 bg-[#F26D3A] text-white rounded text-base font-medium hover:bg-[#E05C29] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerEvaluation;
