import DashNav from "@/components/dashnav/dashnav";
import { useEffect, useState } from "react";
import { getProfileProgress } from "@/services/dashboardServices";
import {
  getInterviewSlotsByUserId,
  getNextInterviewsByUserId,
  getInterviewScheduleById,
  getInterviewSlotById,
  updateInterviewSlot,
} from "@/services/interviewPrepService";
import {
  Users,
  Video,
  FileText,
  File,
  Briefcase,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { getResumeTemplates } from '@/services/resumeServices';
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [profileProgress, setProfileProgress] = useState({
    percentage: 0,
    message: "",
  });
  const gradientColor = "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)";
  const navigate = useNavigate();
  const [upcomingInterview, setUpcomingInterview] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [noSchedule, setNoSchedule] = useState(false);
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));

    const userId = userData?.user_id;
    const token = userData?.token;

    // console.log("User ID:", userId);
    // console.log("Token:", token);
    getProfileProgress(userId, token)
      .then((res) => {
        setProfileProgress({
          percentage: res.percentage,
          message: res.pendingSectionsList.join(", "),
        });
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          // Clear user data and logout
          localStorage.removeItem("user");
          navigate("/login");
        }
      });

    // fetch user's interview slots and pick the nearest upcoming (or most recent)
    const parseSlotDate = (slot) => {
      if (!slot) return null;
      // prefer explicit UTC start_time if provided by API
      const candidates = [
        slot.start_time_utc,
        slot.start_time,
        slot.start,
        slot.scheduled_at,
        slot.scheduled_for,
        slot.slot_time,
        slot.date,
        slot.start_datetime,
        slot.time,
        slot.slot_date,
        slot.slotDate,
      ];

      for (const v of candidates) {
        if (!v) continue;
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d;
      }

      return null;
    };

    if (userId && token) {
      const ordinal = (n) => {
        const v = n % 100;
        if (v >= 11 && v <= 13) return n + "th";
        switch (n % 10) {
          case 1:
            return n + "st";
          case 2:
            return n + "nd";
          case 3:
            return n + "rd";
          default:
            return n + "th";
        }
      };

      const formatSlotDate = (slot) => {
        if (!slot) return null;
        const parse = (v) => {
          if (!v) return null;
          const d = new Date(v);
          return isNaN(d.getTime()) ? null : d;
        };

        const start = parse(slot.start_time_utc ?? slot.start ?? slot.scheduled_at ?? slot.scheduled_for ?? slot.slot_time ?? slot.__date);
        const end = parse(slot.end_time_utc ?? slot.end ?? slot.slot_end ?? null);

        if (start && end) {
          const month = start.toLocaleString(undefined, { month: "long" });
          const day = ordinal(start.getDate());
          const year = start.getFullYear();
          const startTime = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          const endTime = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          return `${month} ${day} ${year}, ${startTime} - ${endTime}`;
        }

        if (start) return start.toLocaleString();
        return null;
      };

      const processResponse = (res) => {
        // If API explicitly reports no schedule, mark that state so UI hides action buttons
        if (res && typeof res === "object" && typeof res.message === "string") {
          const msg = res.message.toLowerCase();
          if (msg.includes("interview schedule not found") || msg.includes("not found")) {
            setNoSchedule(true);
            setUpcomingInterview(null);
            return;
          }
        }
        // Normalise response into an array of slots. The API may return:
        // - an array (res)
        // - an object with `data` containing the array (res.data)
        // - a single slot object (res)
        let slots = [];
        if (Array.isArray(res)) {
          slots = res;
        } else if (Array.isArray(res?.data)) {
          slots = res.data;
        } else if (res && typeof res === "object") {
          // if it's a single slot object (contains expected keys), wrap it
          const hasSlotKeys = !!(
            res.start_time_utc ||
            res.interview_schedule_id ||
            res.interview_slot_id ||
            res.scheduled_at ||
            res.slot_time
          );
          if (hasSlotKeys) slots = [res];
        }
        // Attach parsed date and filter out cancelled / ended / expired slots
        const withDates = (slots || [])
          .map((s) => ({ ...s, __date: parseSlotDate(s) }))
          .filter((s) => {
            if (!s.__date) return false;
            const status = (s.interview_status || s.status || "").toString().toLowerCase();
            if (!status) return true;
            if (status.includes("cancel")) return false;
            if (status.includes("end") || status.includes("complete") || status.includes("expired")) return false;
            return true;
          });

        const now = new Date();
        // Only consider future slots as upcoming. Do not show past/expired/cancelled slots.
        const future = withDates.filter((s) => s.__date > now);

        let chosen = null;
        if (future.length) {
          future.sort((a, b) => a.__date - b.__date);
          chosen = future[0];
        } else {
          // no future valid slots — don't pick a past one
          chosen = null;
        }

        if (chosen) {
          setNoSchedule(false);
          const formatted = formatSlotDate(chosen) ||
            (chosen.__date ? chosen.__date.toLocaleString() : null) ||
            chosen.date ||
            chosen.scheduled_at ||
            chosen.scheduled_for ||
            chosen.slot_time || null;

          const normalized = {
            ...chosen,
            title:
              chosen.title ??
              chosen.slot_title ??
              chosen.interview_title ??
              chosen.subject ??
              chosen.name ??
              "Mock Interview",
            image:
              chosen.image ??
              chosen.slot_image ??
              chosen.interviewer?.avatar ??
              chosen.interviewer?.image ??
              null,
            date: formatted,
          };

          setUpcomingInterview(normalized);
        }
      };

      // prefer the newer, richer endpoint; fallback to older if it fails
      getNextInterviewsByUserId(userId, token)
        .then(processResponse)
        .catch(() => {
          getInterviewSlotsByUserId(userId, token)
            .then(processResponse)
            .catch(() => {
              /* ignore failures silently for dashboard */
            });
        });
    }
  }, []);

  const handleCancel = async () => {
    if (!upcomingInterview) return;
    const slotId = upcomingInterview?.interview_slot_id;
    if (!slotId) {
      setShowCancelModal(false);
      return;
    }

    setCancelling(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?.user_id;
      const token = user?.token;
      if (userId && token) {
        await updateInterviewSlot(userId, token, slotId, { interview_status: "cancelled" });
      }

      // remove upcoming interview from dashboard
      setUpcomingInterview(null);
      setShowCancelModal(false);
    } catch (err) {
      console.error("Failed to cancel interview", err);
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  const dashboardData = {
    upcomingInterview: {
      title: "Coming soon",
      date: "",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
    },
    prepSmarter: [
      {
        icon: Users,
        label: "Mock Sessions",
        color: "bg-purple-100",
        iconColor: "text-purple-600",
      },
      {
        icon: Video,
        label: "Video Practice",
        color: "bg-red-100",
        iconColor: "text-red-600",
      },
      {
        icon: FileText,
        label: "Transcript",
        color: "bg-blue-100",
        iconColor: "text-blue-600",
      },
      {
        icon: File,
        label: "Resume",
        color: "bg-green-100",
        iconColor: "text-green-600",
      },
      {
        icon: Briefcase,
        label: "Job Role",
        color: "bg-orange-100",
        iconColor: "text-orange-600",
      },
    ],
    linkedInScore: 45,
    resumes: [],
  };

  const [resumes, setResumes] = useState<any[]>([]);

  useEffect(() => {
    const loadResumes = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        const userId = userData?.user_id;
        const token = userData?.token;
        if (!userId || !token) return;
        const list = await getResumeTemplates(userId, token);
        setResumes(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Failed to load resume templates', err);
        setResumes([]);
      }
    };

    loadResumes();
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <DashNav heading={"Welcome to BoWizzy"} />

      {showCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white w-[420px] rounded-2xl shadow-xl p-10 relative text-center">

            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition"
              aria-label="Close modal"
            >
              X
            </button>

            <div className="mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center shadow-inner relative"
              style={{
                background: "radial-gradient(circle, #FFF 45%, #FFEFB8 75%)",
                border: "4px solid #F5CC46",
                boxShadow: "0 4px 12px rgba(255, 200, 0, 0.4), inset 0 0 12px rgba(255, 220, 0, 0.6)"
              }}
            >
              <span className="text-4xl text-[#555] font-bold">!</span>
            </div>

            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              Are you sure you want to cancel this Mock Interview?
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-6 py-2 border border-[#FF8351] text-[#FF8351] font-semibold rounded-xl hover:bg-orange-50 transition cursor-pointer hover:shadow-sm"
              >
                Go Back
              </button>

              <button
                onClick={handleCancel}
                disabled={cancelling}
                className={`px-6 py-2 text-white font-semibold rounded-xl ${cancelling ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg transform transition hover:-translate-y-0.5'}`}
                style={{ background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)" }}
                aria-busy={cancelling}
              >
                {cancelling ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Interview'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide">
                Profile Progress
              </h2>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#f3f4f6"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 *
                        Math.PI *
                        56 *
                        (1 - profileProgress.percentage / 100)
                        }`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#FF9D48" />
                        <stop offset="100%" stopColor="#FF8251" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: "#FF8251" }}
                    >
                      {profileProgress.percentage}%
                    </span>
                    <span className="text-xs text-gray-500 uppercase">
                      Complete
                    </span>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-600 mt-3">
                  {
                    profileProgress.percentage ?
                      `${profileProgress.percentage}% Complete` :
                      "Complete your profile to improve score"
                  }
                </p>
                {profileProgress.percentage < 100 && (
                  <button
                    type="button"
                    onClick={() => navigate("/profile/form")}
                    className="mt-3 px-4 py-1.5 rounded-lg text-white text-sm font-medium shadow-sm cursor-pointer"
                    style={{ background: gradientColor }}
                  >
                    Complete Profile
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide">
                    Upcoming Interview
                  </h2>
                  <button
                    onClick={() => navigate("#")}
                    className="text-xs cursor-pointer hover:underline"
                    style={{ color: "#FF8251" }}
                  >
                    View All
                  </button>
                </div>
                <div className="flex gap-3">
                  <img
                    src={
                      upcomingInterview?.image ||
                      dashboardData.upcomingInterview.image
                    }
                    alt="Interview"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">
                      {upcomingInterview?.title || dashboardData.upcomingInterview.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {(() => {
                        const displayDate = upcomingInterview?.date || dashboardData.upcomingInterview.date;
                        return displayDate && displayDate !== "" ? displayDate : "Coming soon";
                      })()}
                    </p>
                    {upcomingInterview && !noSchedule && (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            // Call the interview-slot API (to ensure backend hit) then navigate to details
                            try {
                              const slotId = upcomingInterview?.interview_slot_id;
                              const scheduleId = upcomingInterview?.interview_schedule_id;
                              const user = JSON.parse(localStorage.getItem("user") || "{}");
                              const userId = user?.user_id;
                              const token = user?.token;

                              if (slotId && userId && token) {
                                // call the slot endpoint as requested (e.g. /users/81/mock-interview/interview-slot/59)
                                await getInterviewSlotById(userId, token, slotId);
                                navigate(`/interview-prep/interview-details/${slotId}`);
                                return;
                              }

                              if (scheduleId && userId && token) {
                                const resp = await getInterviewScheduleById(userId, token, scheduleId);
                                const resolvedSlotId = resp?.interview_slot_id ?? resp?.interview_slot?.id;
                                if (resolvedSlotId) {
                                  // ensure the slot endpoint is called
                                  await getInterviewSlotById(userId, token, resolvedSlotId);
                                  navigate(`/interview-prep/interview-details/${resolvedSlotId}`);
                                  return;
                                }
                              }

                              // Fallback: if we have a slot id in the object, navigate
                              if (upcomingInterview?.interview_slot_id) {
                                navigate(`/interview-prep/interview-details/${upcomingInterview.interview_slot_id}`);
                                return;
                              }

                              // Final fallback: go to the listing page
                              navigate("/interview-prep");
                            } catch (err) {
                              console.error('Failed to load interview details', err);
                              navigate('/interview-prep');
                            }
                          }}
                          className="px-3 py-1 rounded text-xs text-white font-medium cursor-pointer hover:shadow-md transform transition hover:-translate-y-0.5"
                          style={{ background: gradientColor }}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="px-3 py-1 rounded text-xs border border-gray-300 cursor-pointer hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide">
                  Prep Smarter(Coming Soon)
                </h2>
                <div className="grid grid-cols-5 gap-2">
                  {dashboardData.prepSmarter.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}
                        >
                          <Icon className={`w-5 h-5 ${item.iconColor}`} />
                        </div>
                        <span className="text-xs text-center text-gray-700">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide">
                Career Insights
              </h2>
              <div className="flex flex-col items-center justify-center h-40">
                <p className="text-center text-sm text-gray-700 mb-3">
                  Get expert tips, growth strategies, and domain guidance
                  tailored to your career path.
                </p>
                <button
                  className="px-4 py-1.5 rounded-lg text-sm font-medium border"
                  style={{ color: "#FF8251", borderColor: "#FF8251" }}
                >
                  Coming soon
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide">
                Boost Your LinkedIn Presence
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#f3f4f6"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="url(#gradient2)"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 *
                        Math.PI *
                        32 *
                        (1 - dashboardData.linkedInScore / 100)
                        }`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="gradient2"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#FF9D48" />
                        <stop offset="100%" stopColor="#FF8251" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-xl font-bold"
                      style={{ color: "#FF8251" }}
                    >
                      {dashboardData.linkedInScore}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-1">
                    Your score: {dashboardData.linkedInScore}/100.
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    Optimize to attract recruiters.
                  </p>
                  <button
                    className="px-4 py-1.5 rounded-lg text-white text-sm font-medium"
                    style={{ background: gradientColor }}
                  >
                    Coming soon
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div>
                <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center"
                      style={{
                        background: "#fff",
                        border: "2px solid #F5CC46",
                        boxShadow: "0 6px 18px rgba(245,204,70,0.06)",
                      }}
                    >
                      <FileText className="w-4 h-4 text-[#FF8251]" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                          BUILD A WINNING RESUME
                        </p>
                      </div>

                      <p className="text-sm text-gray-600 mt-3">
                        Generate a professional, ATS-friendly resume tailored to your job role in minutes.
                      </p>

                      <div className="mt-4">
                        <button
                          onClick={() => navigate("/ResumeBuilder")}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold shadow-sm"
                          style={{ background: gradientColor }}
                        >
                          Build Resume
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide">
                Connect & Grow
              </h2>
              <p className="text-sm text-gray-700 mb-3">
                Join NammaQA's community and upcoming NConnect event. Network,
                learn, and grow.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open('https://nammaqa.com', '_blank', 'noopener,noreferrer')}
                  aria-label="Join NammaQA Community (opens in new tab)"
                  className="px-4 py-1.5 rounded-lg text-white text-sm font-medium"
                  style={{ background: gradientColor }}
                >
                  Join Community
                </button>
                <button
                  onClick={() => window.open('https://nammaqa.com/meetups/', '_blank')}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium border border-gray-300">
                  View Event
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-200">
              <div className="flex items-center justify-center h-full gap-2 text-gray-400">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Other Features coming soon...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
