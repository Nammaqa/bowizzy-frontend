import DashNav from "@/components/dashnav/dashnav";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  MessageSquareText,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  cancelMockInterviewBooking,
  getMockInterviewBookings,
} from "./mockInterviewService";

type MockInterviewBooking = Record<string, any>;
type Tab = "upcoming" | "past" | "cancelled";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalizeBookings = (response: any): MockInterviewBooking[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.bookings)) return response.bookings;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const getBookingId = (b: MockInterviewBooking) =>
  b?.mock_interview_id || b?.id || b?.booking_id;

const getCandidateId = (b: MockInterviewBooking) =>
  b?.candidate_id || b?.candidateId || b?.candidate_user_id ||
  b?.candidateUserId || b?.user_id || b?.userId ||
  b?.candidate?.user_id || b?.candidate?.userId ||
  b?.candidate?.candidate_id || b?.candidate?.id ||
  b?.user?.user_id || b?.user?.id;

const getInterviewerId = (b: MockInterviewBooking) =>
  b?.interviewer_id || b?.interviewerId || b?.interviewer_user_id ||
  b?.interviewerUserId || b?.assigned_interviewer_id ||
  b?.assignedInterviewerId || b?.assigned_to || b?.assignedTo ||
  b?.interviewer?.user_id || b?.interviewer?.userId ||
  b?.interviewer?.interviewer_id || b?.interviewer?.id ||
  b?.interviewer?.user?.user_id || b?.interviewer?.user?.id;

const formatDateTime = (value?: string) => {
  if (!value) return { date: "—", time: "—" };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "—" };
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
};

const getBookingEndDate = (b: MockInterviewBooking) => {
  const v = b?.end_time_utc || b?.endTimeUtc || b?.end_time || b?.start_time_utc || b?.scheduled_time;
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const isPastBooking = (b: MockInterviewBooking, now: Date) => {
  const end = getBookingEndDate(b);
  return end ? end < now : false;
};

const isInterviewerFeedbackGiven = (b: MockInterviewBooking) =>
  b?.interviewer_feedback_given === true ||
  b?.interviewerFeedbackGiven === true ||
  String(b?.interviewer_feedback_given).toLowerCase() === "true" ||
  String(b?.interviewerFeedbackGiven).toLowerCase() === "true";

/** True for ANY cancelled booking — used to strip them from Upcoming & Past. */
const isCancelledBooking = (b: MockInterviewBooking) =>
  String(b?.interview_status || "").toLowerCase().includes("cancel");

/**
 * True only when the CANDIDATE (user) was the one who cancelled.
 * Matches common API values: "candidate", "user", "self", or the user's own ID.
 * Only these appear in the user-facing "Cancelled" tab.
 */
const isCancelledByUser = (b: MockInterviewBooking, userId?: string | number): boolean => {
  if (!isCancelledBooking(b)) return false;
  const cancelledBy = String(b?.cancelled_by || "").toLowerCase().trim();
  if (!cancelledBy) return false;
  const userMarkers = ["candidate", "user", "self"];
  if (userMarkers.some((m) => cancelledBy.includes(m))) return true;
  // Also match if cancelled_by is the user's own ID
  if (userId && String(userId) === cancelledBy) return true;
  return false;
};

// ---------------------------------------------------------------------------
// Status config — drives badge colour + left-border accent
// ---------------------------------------------------------------------------
const getStatusConfig = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("cancel"))  return { badge: "bg-red-50 text-red-600",           border: "border-l-red-400"     };
  if (s.includes("expired")) return { badge: "bg-slate-100 text-slate-600",      border: "border-l-slate-400"   };
  if (s.includes("complete"))return { badge: "bg-emerald-50 text-emerald-700",   border: "border-l-emerald-400" };
  if (s.includes("waiting")) return { badge: "bg-sky-50 text-sky-600",           border: "border-l-sky-400"     };
  if (s.includes("pending")) return { badge: "bg-amber-50 text-amber-700",       border: "border-l-amber-400"   };
  return                            { badge: "bg-orange-50 text-[#F26D3A]",      border: "border-l-[#F26D3A]"   };
};

const getPaymentConfig = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("paid") || s.includes("complete")) return "bg-emerald-50 text-emerald-700";
  if (s.includes("cancel"))  return "bg-red-50 text-red-500";
  if (s.includes("pending")) return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-500";
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const MockInterviewBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings]     = useState<MockInterviewBooking[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [cancellingId, setCancellingId] = useState<string | number | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>("upcoming");
  const [cancelConfirmationBooking, setCancelConfirmationBooking] = useState<MockInterviewBooking | null>(null);

  const getAuthUser = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return { userId: user?.user_id, token: user?.token };
  };

  const loadBookings = async () => {
    try {
      const { userId, token } = getAuthUser();
      if (!userId || !token) { setError("Please login again to view your bookings."); return; }
      setLoading(true);
      setError("");
      const response = await getMockInterviewBookings(userId, token);
      setBookings(normalizeBookings(response));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  const openCancelConfirmation = (booking: MockInterviewBooking) => {
    setCancelConfirmationBooking(booking);
  };

  const handleCancel = async (booking: MockInterviewBooking) => {
    const id = getBookingId(booking);
    if (!id) return;
    setCancelConfirmationBooking(booking);
  };

  const closeCancelConfirmation = () => {
    setCancelConfirmationBooking(null);
  };

  const confirmCancellation = async () => {
    if (!cancelConfirmationBooking) return;
    const booking = cancelConfirmationBooking;
    setCancelConfirmationBooking(null);

    const id = getBookingId(booking);
    if (!id) return;

    try {
      const { userId, token } = getAuthUser();
      if (!userId || !token) {
        setError("Please login again to cancel bookings.");
        return;
      }
      setCancellingId(id);
      await cancelMockInterviewBooking(userId, token, id);
      await loadBookings();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const navigateToInterviewerFeedback = (booking: MockInterviewBooking) => {
    const id = getBookingId(booking);
    if (!id) return;
    const { userId: currentUserId } = getAuthUser();
    const candidateId   = getCandidateId(booking) ?? currentUserId;
    const interviewerId = getInterviewerId(booking);
    navigate(`/interviews/mock-interview/interviewer-reviews/${id}`, {
      state: {
        booking:      { ...booking, candidate_id: candidateId, interviewer_id: interviewerId },
        candidate_id:   candidateId,
        interviewer_id: interviewerId,
      },
    });
  };

  const now              = new Date();
  const { userId: currentUserId } = getAuthUser();
  // Exclude ALL cancelled bookings from Upcoming & Past tabs.
  const activeBookings   = bookings.filter((b) => !isCancelledBooking(b));
  // Cancelled tab: only show bookings the current user (candidate) cancelled.
  const cancelledBookings = bookings.filter((b) => isCancelledByUser(b, currentUserId));
  const pastBookings     = activeBookings.filter((b) => isPastBooking(b, now));
  const upcomingBookings = activeBookings.filter((b) => !isPastBooking(b, now));
  const visibleBookings =
    activeTab === "upcoming"
      ? upcomingBookings
      : activeTab === "past"
        ? pastBookings
        : cancelledBookings;

  // ---------------------------------------------------------------------------
  // Card
  // ---------------------------------------------------------------------------
  const renderCard = (booking: MockInterviewBooking, index: number, tab: Tab) => {
    const id           = getBookingId(booking) || index;
    const start        = formatDateTime(booking.start_time_utc);
    const end          = formatDateTime(booking.end_time_utc);
    const rawStatus    = booking.interview_status || "scheduled";
    const isCancelled  = isCancelledBooking(booking);
    const displayStatus =
      !isCancelled && tab === "past" && booking.interviewer_id == null
        ? "Expired"
        : !isCancelled && booking.interviewer_id == null
          ? "Waiting to be accepted"
          : rawStatus;
    const paymentStatus = booking.payment_status || "pending";
    const feedbackGiven = isInterviewerFeedbackGiven(booking);
    const { badge: statusBadge, border } = getStatusConfig(displayStatus);
    const payBadge     = getPaymentConfig(paymentStatus);

    return (
      <div
        key={id}
        className={`relative flex flex-col gap-0 overflow-hidden rounded-2xl bg-white shadow-sm
                    border border-gray-100 border-l-4 ${border}
                    sm:flex-row sm:items-stretch`}
      >
        {/* ── Left: main info ─────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-center gap-2.5 px-5 py-4">

          {/* Row 1: role name + status badges */}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-[#1f1f1f]">
              {booking.job_role || "Mock Interview"}
            </h2>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusBadge}`}>
              {displayStatus}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${payBadge}`}>
              Payment: {paymentStatus}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-gray-500">
              {booking.interview_type || "online"}
            </span>
          </div>

          {/* Row 2: date · time · exp · amount */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={13} className="text-[#F26D3A]" />
              <span className="font-medium text-gray-700">{start.date}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#F26D3A]" />
              <span className="font-medium text-gray-700">
                {start.time}{end.time !== "—" ? ` – ${end.time}` : ""}
              </span>
            </span>
            <span>
              Exp: <span className="font-medium text-gray-700">{booking.experience_months ?? 0} mo</span>
            </span>
            <span>
              Amount: <span className="font-medium text-gray-700">₹{booking.amount ?? "—"}</span>
            </span>
          </div>
        </div>

        {/* ── Right: actions ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3
                        sm:flex-col sm:flex-nowrap sm:items-end sm:justify-center sm:border-t-0 sm:border-l sm:px-4 sm:py-4 sm:min-w-[140px]">
          {booking.resume_url && (
            <a
              href={booking.resume_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:border-gray-300 hover:shadow transition"
            >
              <FileText size={13} />
              Resume
            </a>
          )}

          {tab === "cancelled" ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-100">
              <XCircle size={13} />
              {booking.cancelled_by ? `Cancelled by ${booking.cancelled_by}` : "Cancelled"}
            </span>
          ) : tab === "past" ? (
            feedbackGiven ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
                <CheckCircle2 size={13} />
                Feedback given
              </span>
            ) : (
              <button
                onClick={() => navigateToInterviewerFeedback(booking)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <MessageSquareText size={13} />
                Give feedback
              </button>
            )
          ) : (
            <>
              {booking.meeting_link && (
                <a
                  href={booking.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:border-gray-300 hover:shadow transition"
                >
                  <ExternalLink size={13} />
                  Join meeting
                </a>
              )}
              {!isCancelled && (
                <button
                  onClick={() => openCancelConfirmation(booking)}
                  disabled={cancellingId === id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 shadow-sm hover:bg-red-50 transition disabled:opacity-50"
                >
                  <XCircle size={13} />
                  {cancellingId === id ? "Cancelling…" : "Cancel"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F0F0F0] font-['Baloo_2']">
      <DashNav heading="Mock Interview Bookings" />

      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm border border-gray-100">
          <div>
            <h1 className="text-base font-bold text-[#1f1f1f]">Your Bookings</h1>
            <p className="mt-0.5 text-xs text-gray-400">Track status, timing, resume &amp; meeting links</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadBookings}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#F26D3A] px-3.5 py-2 text-xs font-semibold text-[#F26D3A] hover:bg-orange-50 transition disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => navigate("/interviews/mock-interview/take")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F26D3A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#e35f2f] shadow-sm transition"
            >
              <Plus size={13} />
              Book new
            </button>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        {!loading && bookings.length > 0 && (
          <div className="mb-4 flex gap-1.5 rounded-xl bg-white p-1 shadow-sm border border-gray-100">
            {(["upcoming", "past", "cancelled"] as Tab[]).map((tab) => {
              const count =
                tab === "upcoming"
                  ? upcomingBookings.length
                  : tab === "past"
                    ? pastBookings.length
                    : cancelledBookings.length;
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all
                    ${active
                      ? "bg-[#F26D3A] text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-700"
                    }`}
                >
                  {tab === "upcoming"
                    ? "Upcoming"
                    : tab === "past"
                      ? "Past"
                      : "Cancelled"}
                  <span className={`rounded-full min-w-[20px] px-1.5 py-0.5 text-center text-[10px] font-bold
                    ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Booking list ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center shadow-sm border border-gray-100">
            <RefreshCw size={22} className="mx-auto mb-3 animate-spin text-[#F26D3A]" />
            <p className="text-sm font-medium text-gray-400">Loading your bookings…</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm border border-gray-100">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
              <CalendarDays size={22} className="text-[#F26D3A]" />
            </div>
            <p className="text-sm font-bold text-[#1f1f1f]">No bookings yet</p>
            <p className="mt-1 text-xs text-gray-400">Book your first mock interview to see it here.</p>
            <button
              onClick={() => navigate("/interviews/mock-interview/take")}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#F26D3A] px-4 py-2 text-xs font-bold text-white hover:bg-[#e35f2f] shadow-sm transition"
            >
              <Plus size={13} /> Book now
            </button>
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-sm border border-gray-100">
            <p className="text-sm text-gray-400">
              No {activeTab === "upcoming"
                ? "upcoming"
                : activeTab === "past"
                  ? "past"
                  : "cancelled"} interviews.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleBookings.map((booking, index) =>
              renderCard(booking, index, activeTab)
            )}
          </div>
        )}
      </div>

      {cancelConfirmationBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeCancelConfirmation}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              ✕
            </button>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                <XCircle size={28} />
              </div>
              <h2 className="mt-5 text-xl font-bold text-[#1f1f1f]">Confirm cancellation</h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Are you sure you want to cancel this interview? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelConfirmation}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Keep interview
              </button>
              <button
                type="button"
                onClick={confirmCancellation}
                disabled={cancellingId !== null}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancellingId ? "Cancelling…" : "Yes, cancel it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterviewBookingsPage;
