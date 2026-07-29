import DashNav from "@/components/dashnav/dashnav";
import { ArrowRight, BadgeCheck, CalendarCheck, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMockInterviewUserType, isInterviewerUserResponse } from "./mockInterviewService";

const highlights = [
  {
    icon: <MessageCircle size={18} />,
    title: "Real interview practice",
    description: "Practice with realistic questions, role-based scenarios, and a structured flow.",
  },
  {
    icon: <BadgeCheck size={18} />,
    title: "Actionable feedback",
    description: "Understand what worked, what needs polish, and how to improve your answers.",
  },
  {
    icon: <CalendarCheck size={18} />,
    title: "Flexible sessions",
    description: "Choose a mode that fits your schedule and prepare with confidence.",
  },
];

const MockInterviewLanding = () => {
  const navigate = useNavigate();
  const [checkingUserType, setCheckingUserType] = useState(true);
  const [isInterviewer, setIsInterviewer] = useState(false);

  useEffect(() => {
    const loadUserType = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;
        const token = user?.token;

        if (!userId || !token) return;

        const response = await getMockInterviewUserType(userId, token);
        setIsInterviewer(isInterviewerUserResponse(response));
      } catch {
        setIsInterviewer(false);
      } finally {
        setCheckingUserType(false);
      }
    };

    loadUserType();
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-['Baloo_2']">
      <DashNav heading="Mock Interview" />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[#FFE8C8] blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#FFD8C8] blur-3xl" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FFF3EA] px-4 py-2 text-sm font-semibold text-[#FF8251]">
                <Sparkles size={16} />
                Interview confidence, rehearsed before it counts
              </div>

              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-[#2F2F2F] sm:text-5xl">
                Prepare for your next opportunity with a guided mock interview.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#5C5C5C] sm:text-lg">
                Simulate a real interview experience, sharpen your responses, and receive
                practical feedback that helps you walk into interviews with clarity and
                confidence.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {!checkingUserType && !isInterviewer && (
                  <button
                    onClick={() => navigate("/interviews/mock-interview/take")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)",
                    }}
                  >
                    Book mock interview
                    <ArrowRight size={18} />
                  </button>
                )}
                {!checkingUserType && isInterviewer && (
                  <div className="rounded-xl bg-[#FFF3EA] px-4 py-3 text-sm font-semibold text-[#FF8251]">
                    Interviewer accounts cannot book candidate mock interviews.
                  </div>
                )}
                {!checkingUserType && !isInterviewer && (
                  <button
                    onClick={() => navigate("/interviews/mock-interview/bookings")}
                    className="inline-flex items-center justify-center rounded-xl border border-[#FF8251] bg-white px-6 py-3 text-base font-semibold text-[#FF8251] transition hover:bg-[#FFF3EA]"
                  >
                    Your bookings
                  </button>
                )}
                {!isInterviewer && (
                  <button
                    onClick={() => navigate("/interviews/mock-interview/apply-interviewer")}
                    className="inline-flex items-center justify-center rounded-xl border border-[#3A3A3A] bg-white px-6 py-3 text-base font-semibold text-[#3A3A3A] transition hover:bg-[#FAFAFA]"
                  >
                    Apply as interviewer
                  </button>)}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-[#FFE1D2] bg-[#FFF8F3] p-5">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#FF8251]">Session preview</p>
                      <h2 className="text-2xl font-bold text-[#2F2F2F]">Mock Interview</h2>
                    </div>
                    <div className="rounded-full bg-[#FFF3EA] p-3 text-[#FF8251]">
                      <MessageCircle size={22} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {["Role and experience setup", "Online or offline practice", "Feedback-focused interview"].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl bg-[#FAFAFA] p-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FF8251]" />
                        <span className="text-sm font-medium text-[#4B4B4B]">{item}</span>
                      </div>
                    ))}
                  </div>
                  {!checkingUserType && isInterviewer && (
                    <button
                      onClick={() => navigate("/interviews/mock-interview/dashboard")}
                      className="mt-5 w-full rounded-xl bg-[#2F2F2F] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1F1F1F]"
                    >
                      Open interviewer dashboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 grid max-w-7xl gap-4 md:grid-cols-3">
          {highlights.map((highlight) => (
            <div key={highlight.title} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-[#FFF3EA] p-3 text-[#FF8251]">
                {highlight.icon}
              </div>
              <h3 className="text-lg font-bold text-[#2F2F2F]">{highlight.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#666666]">{highlight.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default MockInterviewLanding;
