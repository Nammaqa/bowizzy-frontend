import DashNav from "@/components/dashnav/dashnav";
import { getResumeTemplates } from "@/services/resumeServices";
import { getPdfThumbnail } from "@/utils/getPdfThumbnail";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, FileText, IndianRupee, Plus, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { fallbackSkills, jobRoleGroups } from "./mockInterviewOptions";
import {
  createMockInterviewBooking,
  getMockInterviewBookingSlots,
  getMockInterviewUserType,
  isInterviewerUserResponse,
  verifyMockInterviewPayment,
  confirmMockInterviewCreditBooking
} from "./mockInterviewService";

type InterviewMode = "Online" | "Offline";

type InterviewDate = {
  label: string;
  value: string;
  displayDate: string;
};

type SavedResume = Record<string, any>;

type SelectedResume =
  | {
      type: "saved";
      id: string | number;
      name: string;
      url: string;
    }
  | {
      type: "uploaded";
      id: string;
      name: string;
      url: string;
    }
  | null;

const timeSlots = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
];

const experienceYears = Array.from({ length: 21 }, (_, index) => index);
const experienceMonths = Array.from({ length: 12 }, (_, index) => index);

const getProfileSkills = () => {
  const possibleKeys = ["profileData", "resumeData", "user"];

  for (const key of possibleKeys) {
    try {
      const value = localStorage.getItem(key);
      if (!value) continue;

      const parsed = JSON.parse(value);
      const candidates = [
        parsed?.skills,
        parsed?.skillsLinks?.skills,
        parsed?.profile?.skills,
        parsed?.data?.skills,
      ];

      for (const candidate of candidates) {
        if (!Array.isArray(candidate)) continue;

        const skills = candidate
          .map((skill) =>
            typeof skill === "string"
              ? skill
              : skill?.skillName || skill?.skill_name || skill?.name
          )
          .filter(Boolean);

        if (skills.length > 0) return Array.from(new Set(skills));
      }
    } catch {
      continue;
    }
  }

  return fallbackSkills;
};

const getWeekdayDates = (): InterviewDate[] => {
  const dates: InterviewDate[] = [];
  const cursor = new Date();

  while (dates.length < 7) {
    const day = cursor.getDay();

    if (day !== 0 && day !== 6) {
      dates.push({
        label: cursor.toLocaleDateString("en-IN", { weekday: "short" }),
        displayDate: cursor.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        value: cursor.toISOString().split("T")[0],
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const resolveResumeId = (resume: SavedResume, index: number) => {
  return (
    resume?.resume_template_id ??
    resume?.template_id ??
    resume?.id ??
    resume?.templateId ??
    resume?.resumeTemplateId ??
    resume?.template?.id ??
    index
  );
};

const resolveResumeName = (resume: SavedResume, index: number) => {
  return (
    resume?.template_name ??
    resume?.title ??
    resume?.name ??
    resume?.template?.template_name ??
    `Resume ${index + 1}`
  );
};

const resolveResumeUrl = (resume: SavedResume) => {
  return (
    resume?.template_file_url ??
    resume?.template_file ??
    resume?.url ??
    resume?.file_url ??
    resume?.download_url ??
    resume?.template_url ??
    resume?.template?.template_file_url ??
    resume?.template?.url ??
    ""
  );
};

const parseSlotDate = (dateValue: string, time: string) => {
  const [timeValue, period] = time.split(" ");
  const [rawHour, minute] = timeValue.split(":").map(Number);
  let hour = rawHour;

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const slotDate = new Date(`${dateValue}T00:00:00`);
  slotDate.setHours(hour, minute, 0, 0);
  return slotDate;
};

const isAlphabetRole = (value: string) => /^[A-Za-z ]*$/.test(value);

const normalizeBookings = (response: any) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.bookings)) return response.bookings;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.slots)) return response.slots;
  if (Array.isArray(response?.booking)) return response.booking;
  if (response?.booking) return [response.booking];
  if (response?.data) return [response.data];
  return [];
};

const getBookingStart = (booking: any) =>
  booking?.start_time_utc || booking?.startTimeUtc || booking?.start_time || booking?.startTime;

const getBookingEnd = (booking: any) =>
  booking?.end_time_utc || booking?.endTimeUtc || booking?.end_time || booking?.endTime;

const isBookingActive = (booking: any) => {
  const cancelledBy = String(booking?.cancelled_by || "").toLowerCase().trim();
  const cancelledByCandidate =
    cancelledBy === "candidate" ||
    cancelledBy.includes("candidate");

  return !cancelledByCandidate;
};

const isSlotBooked = (bookings: any[], dateValue: string, slot: string) => {
  const slotStart = parseSlotDate(dateValue, slot);
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(slotEnd.getHours() + 1);

  return bookings.some((booking) => {
    if (!isBookingActive(booking)) return false;

    const bookingStartValue = getBookingStart(booking);
    const bookingEndValue = getBookingEnd(booking);
    const bookingStart = bookingStartValue ? new Date(bookingStartValue) : null;
    const bookingEnd = bookingEndValue ? new Date(bookingEndValue) : null;

    if (
      !bookingStart ||
      !bookingEnd ||
      Number.isNaN(bookingStart.getTime()) ||
      Number.isNaN(bookingEnd.getTime())
    ) {
      return false;
    }

    return slotStart < bookingEnd && slotEnd > bookingStart;
  });
};

const TakeMockInterviewPage = () => {
  const navigate = useNavigate();
  const dates = useMemo(() => getWeekdayDates(), []);
  const initialSkills = useMemo(() => getProfileSkills(), []);
  const price = Number(import.meta.env.VITE_MOCK_INTERVIEW_PRICE || 299);

  const [mode, setMode] = useState<InterviewMode>("Online");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [experienceYearsValue, setExperienceYearsValue] = useState(0);
  const [experienceMonthsValue, setExperienceMonthsValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.value || "");
  const [selectedTime, setSelectedTime] = useState("");
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialSkills.slice(0, 5));
  const [newSkill, setNewSkill] = useState("");
  const [skillError, setSkillError] = useState("");
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [uploadedResume, setUploadedResume] = useState<SelectedResume>(null);
  const [selectedResume, setSelectedResume] = useState<SelectedResume>(null);
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [checkingUserType, setCheckingUserType] = useState(true);
  const [isInterviewer, setIsInterviewer] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [loadingBookedSlots, setLoadingBookedSlots] = useState(false);
  const [bookedSlotsError, setBookedSlotsError] = useState("");
  const [purchasedCredits, setPurchasedCredits] = useState<number>(0);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [usePurchasedCredits, setUsePurchasedCredits] = useState(true);

  const selectedRole = role === "Other" ? customRole.trim() : role;
  const experiencePayload = {
    years: experienceYearsValue,
    months: experienceMonthsValue,
    totalMonths: experienceYearsValue * 12 + experienceMonthsValue,
  };
  const shouldUsePurchasedCredits = purchasedCredits > 0 && usePurchasedCredits;
  const purchasedCreditsToUse = shouldUsePurchasedCredits
    ? Math.min(purchasedCredits, price)
    : 0;
  const finalPriceINR = Math.max(0, price - purchasedCreditsToUse);

  const minimumBookableTime = useMemo(() => {
    const date = new Date();
    date.setHours(date.getHours() + 5);
    return date;
  }, []);

  const availableSlots = useMemo(
    () =>
      timeSlots.map((slot) => {
        const blockedByTime = parseSlotDate(selectedDate, slot) < minimumBookableTime;
        const blockedByBooking = isSlotBooked(bookedSlots, selectedDate, slot);

        return {
          slot,
          disabled: blockedByTime || blockedByBooking,
          reason: blockedByBooking
            ? "Already booked"
            : blockedByTime
              ? "Available 5 hours later"
              : "",
        };
      }),
    [bookedSlots, minimumBookableTime, selectedDate]
  );

  const canConfirm =
    mode &&
    selectedRole &&
    selectedDate &&
    selectedTime &&
    selectedResume &&
    selectedSkills.length > 0 &&
    (role !== "Other" || (customRole.length <= 60 && isAlphabetRole(customRole)));

  const getAuthUser = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      user,
      userId: user?.user_id,
      token: user?.token,
    };
  };

  const getBookingDateTime = () => {
    const startDate = parseSlotDate(selectedDate, selectedTime);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    return {
      start_time_utc: startDate.toISOString(),
      end_time_utc: endDate.toISOString(),
    };
  };

  const loadRazorpayScript = () =>
    new Promise<void>((resolve, reject) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve();
        return;
      }

      const existingScript = document.getElementById("razorpay-sdk");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", () =>
          reject(new Error("Razorpay SDK failed to load"))
        );
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
      document.body.appendChild(script);
    });

  useEffect(() => {
    const guardInterviewerAccess = async () => {
      try {
        const { userId, token } = getAuthUser();
        if (!userId || !token) return;

        const response = await getMockInterviewUserType(userId, token);
        const interviewer = isInterviewerUserResponse(response);
        setIsInterviewer(interviewer);

        if (interviewer) {
          navigate("/interviews/mock-interview", { replace: true });
        }
      } catch {
        setIsInterviewer(false);
      } finally {
        setCheckingUserType(false);
      }
    };

    guardInterviewerAccess();
  }, [navigate]);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const { userId, token } = getAuthUser();
        if (!userId || !token) {
          setPurchasedCredits(0);
          return;
        }

        const resp = await api.get("/personal-details/profile-data", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = resp?.data?.data ?? resp?.data ?? {};
        const purchased = Number(
          profileData?.purchased_credits ??
          profileData?.purchasedCredits ??
          resp?.data?.purchased_credits ??
          resp?.data?.purchasedCredits ??
          0
        );
        setPurchasedCredits(Number.isFinite(purchased) && purchased > 0 ? Math.floor(purchased) : 0);
      } catch {
        setPurchasedCredits(0);
      } finally {
        setCreditsLoading(false);
      }
    };
    loadCredits();
  }, []);

  useEffect(() => {
    const loadSavedResumes = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;
        const token = user?.token;

        if (!userId || !token) return;

        setLoadingResumes(true);
        setResumeError("");
        const resumes = await getResumeTemplates(userId, token);
        setSavedResumes(Array.isArray(resumes) ? resumes : []);
      } catch {
        setResumeError("Unable to import saved resumes right now.");
      } finally {
        setLoadingResumes(false);
      }
    };

    loadSavedResumes();
  }, []);

  useEffect(() => {
    const loadBookedSlots = async () => {
      try {
        const { userId, token } = getAuthUser();
        if (!userId || !token) return;

        setLoadingBookedSlots(true);
        setBookedSlotsError("");
        const response = await getMockInterviewBookingSlots(userId, token);
        setBookedSlots(normalizeBookings(response));
      } catch (error: any) {
        setBookedSlotsError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to check booked slots right now."
        );
      } finally {
        setLoadingBookedSlots(false);
      }
    };

    loadBookedSlots();
  }, []);

  useEffect(() => {
    const selectedSlot = availableSlots.find((item) => item.slot === selectedTime);
    if (selectedSlot?.disabled) {
      setSelectedTime("");
    }
  }, [availableSlots, selectedTime]);

  useEffect(() => {
    return () => {
      if (uploadedResume?.type === "uploaded" && uploadedResume.url.startsWith("blob:")) {
        URL.revokeObjectURL(uploadedResume.url);
      }
    };
  }, [uploadedResume]);

  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (!trimmedSkill) {
      return;
    }
    if (skills.includes(trimmedSkill)) {
      setSkillError("This skill is already present.");
      return;
    }

    setSkillError("");
    setSkills((currentSkills) => [...currentSkills, trimmedSkill]);
    setSelectedSkills((currentSkills) => [...currentSkills, trimmedSkill]);
    setNewSkill("");
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((currentSkills) =>
      currentSkills.includes(skill)
        ? currentSkills.filter((item) => item !== skill)
        : [...currentSkills, skill]
    );
  };

  const selectSavedResume = (resume: SavedResume, index: number) => {
    const id = resolveResumeId(resume, index);
    setSelectedResume({
      type: "saved",
      id,
      name: resolveResumeName(resume, index),
      url: resolveResumeUrl(resume),
    });
  };

  const handleResumeUpload = async (file?: File) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setResumeError("Please upload a PDF, DOC, or DOCX resume.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError("Resume file size must be less than 5MB.");
      return;
    }

    setResumeError("");
    setUploadingResume(true);

    try {
      const uploadResult = await uploadToCloudinary(file);
      const uploadedUrl = uploadResult?.url || URL.createObjectURL(file);
      const resume = {
        type: "uploaded",
        id: `${file.name}-${file.lastModified}`,
        name: file.name,
        url: uploadedUrl,
      } as SelectedResume;

      setUploadedResume((currentResume) => {
        if (currentResume?.type === "uploaded" && currentResume.url.startsWith("blob:")) {
          URL.revokeObjectURL(currentResume.url);
        }
        return resume;
      });
      setSelectedResume(resume);
    } catch (error: any) {
      setResumeError(error?.message || "Failed to upload resume. Please try again.");
    } finally {
      setUploadingResume(false);
    }
  };

 const handlePayAndConfirm = async () => {
    if (!canConfirm || paying) return;

    try {
      setPaying(true);
      setPaymentError("");
      setConfirmed(false);

      const { user, userId, token } = getAuthUser();
      if (!userId || !token) {
        setPaymentError("Please login again to continue payment.");
        setPaying(false);
        return;
      }

      const { start_time_utc, end_time_utc } = getBookingDateTime();
      const payload = {
        start_time_utc,
        end_time_utc,
        interview_type: mode.toLowerCase() as "online" | "offline",
        amount: finalPriceINR,
        skills: selectedSkills.join(", "),
        resume_url: selectedResume?.url || undefined,
        experience_months: experiencePayload.totalMonths,
        job_role: selectedRole,
        purchased_credits_used: purchasedCreditsToUse,
      };

      const bookingResponse = await createMockInterviewBooking(userId, token, payload);
      const booking = bookingResponse?.booking || bookingResponse?.data || bookingResponse;
      const mockInterviewId =
        booking?.mock_interview_id ||
        booking?.id ||
        bookingResponse?.mock_interview_id ||
        bookingResponse?.mockInterviewId;

      if (!mockInterviewId) {
        throw new Error("Booking created, but booking ID was missing.");
      }

      // Credit-only booking: no Razorpay order was created because credits
      // fully covered the price. This needs an explicit confirmation call
      // to actually deduct the credits and lock in the booking.
      const paymentStatus = booking?.payment_status || booking?.paymentStatus;
      const orderData = bookingResponse?.order || bookingResponse?.razorpay_order || bookingResponse?.razorpayOrder;

      if (!orderData && (paymentStatus === "pending_credit_confirmation" || finalPriceINR <= 0)) {
        await confirmMockInterviewCreditBooking(userId, token, { mock_interview_id: mockInterviewId });
        window.dispatchEvent(new CustomEvent("credits:refresh"));
        setConfirmed(true);
        navigate("/interviews/mock-interview/bookings");
        return;
      }

      // Otherwise, proceed to Razorpay as before.
      const orderId =
        orderData?.id ||
        orderData?.order_id ||
        orderData?.orderId ||
        orderData?.razorpay_order_id ||
        booking?.razorpay_order_id;
      const orderAmount = Number(orderData?.amount || Math.round(finalPriceINR * 100));
      const razorKey =
        orderData?.key || orderData?.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || "";

      if (!orderId) {
        throw new Error("Booking created, but payment order details were missing.");
      }

      await loadRazorpayScript();

      const options = {
        key: razorKey,
        amount: orderAmount < 1000 ? Math.round(finalPriceINR * 100) : orderAmount,
        currency: "INR",
        name: "Bowizzy",
        description: "Mock Interview Booking",
        order_id: orderId,
        modal: { ondismiss: () => setPaying(false) },
        handler: async (response: any) => {
          try {
            await verifyMockInterviewPayment(userId, token, {
              mock_interview_id: mockInterviewId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setConfirmed(true);
            navigate("/interviews/mock-interview/bookings");
          } catch (error: any) {
            setPaymentError(
              error?.response?.data?.message ||
                error?.message ||
                "Payment verification failed. Please contact support."
            );
            setPaying(false);
          }
        },
        prefill: {
          name: user?.name || user?.full_name || "",
          email: user?.email || "",
        },
        notes: {
          mock_interview_id: String(mockInterviewId),
          experience_months: String(experiencePayload.totalMonths),
          interview_type: mode.toLowerCase(),
        },
        theme: { color: "#FF8251" },
      };

      const razorpay = new (window as any).Razorpay(options);
      if (typeof razorpay.on === "function") {
        razorpay.on("payment.failed", () => {
          setPaymentError("Payment failed or was cancelled.");
          setPaying(false);
        });
      }
      razorpay.open();
    } catch (error: any) {
      setPaymentError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to create booking. Please try again."
      );
      setPaying(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#F0F0F0] font-['Baloo_2']">
      <DashNav heading="Take Mock Interview" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {checkingUserType ? (
          <div className="rounded-3xl bg-white p-8 text-center text-[#777777] shadow-sm">
            Checking booking access...
          </div>
        ) : isInterviewer ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-[#2F2F2F]">Booking unavailable</h1>
            <p className="mt-2 text-sm text-[#777777]">
              Interviewer accounts cannot book candidate mock interviews.
            </p>
          </div>
        ) : (
          <>
        <button
          onClick={() => navigate("/interviews/mock-interview")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#F26D3A]"
        >
          <ArrowLeft size={16} />
          Back to mock interview
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          <div className="space-y-5 min-w-0">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-[#2F2F2F]">Book your mock interview</h1>
              <p className="mt-2 text-sm leading-6 text-[#666666]">
                Choose your interview mode, job role, weekday slot, and skills
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {(["Online", "Offline"] as InterviewMode[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setMode(item)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      mode === item
                        ? "border-[#F26D3A] bg-[#FFF0E3]"
                        : "border-[#E5E5E5] bg-white hover:border-[#F26D3A]"
                    }`}
                  >
                    <span className="text-sm font-bold text-[#2F2F2F]">{item}</span>
                    <p className="mt-1 text-xs text-[#777777]">
                      {item === "Online" ? "Attend from anywhere." : "Practice face-to-face."}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#2F2F2F]">1. Select job role</h2>

              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setCustomRole("");
                }}
                className="mt-4 w-full rounded-xl border border-[#D9D9D9] bg-white px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
              >
                <option value="">Select Job Role</option>
                {jobRoleGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.roles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="Other">Other</option>
              </select>

              {role === "Other" && (
                <div className="mt-3">
                  <input
                    value={customRole}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value.length <= 60 && isAlphabetRole(value)) setCustomRole(value);
                    }}
                    placeholder="Type job role"
                    maxLength={60}
                    className="w-full rounded-xl border border-[#D9D9D9] px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
                  />
                  <p className="mt-1 text-xs text-[#777777]">
                    Alphabets and spaces only. {customRole.length}/60
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#2F2F2F]">2. Experience</h2>
              <p className="mt-1 text-sm text-[#777777]">
                Select the experience that will be included in the booking payload.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[#3A3A3A]">
                    Years
                  </label>
                  <select
                    value={experienceYearsValue}
                    onChange={(event) => setExperienceYearsValue(Number(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-[#D9D9D9] bg-white px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
                  >
                    {experienceYears.map((year) => (
                      <option key={year} value={year}>
                        {year} {year === 1 ? "year" : "years"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3A3A3A]">
                    Months
                  </label>
                  <select
                    value={experienceMonthsValue}
                    onChange={(event) => setExperienceMonthsValue(Number(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-[#D9D9D9] bg-white px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
                  >
                    {experienceMonths.map((month) => (
                      <option key={month} value={month}>
                        {month} {month === 1 ? "month" : "months"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#2F2F2F]">3. Select day and time</h2>
              <p className="mt-1 text-sm text-[#777777]">
                Showing the next 7 available weekdays. Weekends are excluded.
              </p>
              {loadingBookedSlots && (
                <p className="mt-2 text-xs font-semibold text-[#F26D3A]">
                  Checking your existing bookings...
                </p>
              )}
              {bookedSlotsError && (
                <p className="mt-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                  {bookedSlotsError}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {dates.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => {
                      setSelectedDate(date.value);
                      setSelectedTime("");
                    }}
                    className={`rounded-2xl border p-3 text-center transition ${
                      selectedDate === date.value
                        ? "border-[#F26D3A] bg-[#FFF0E3]"
                        : "border-[#E5E5E5] bg-white hover:border-[#F26D3A]"
                    }`}
                  >
                    <span className="block text-xs font-semibold text-[#777777]">{date.label}</span>
                    <span className="mt-1 block text-sm font-bold text-[#2F2F2F]">
                      {date.displayDate}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {availableSlots.map(({ slot, disabled, reason }) => (
                  <button
                    key={slot}
                    disabled={disabled}
                    title={reason}
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-[#E5E5E5] disabled:bg-[#F5F5F5] disabled:text-[#AAAAAA] ${
                      selectedTime === slot
                        ? "border-[#F26D3A] bg-[#FFF0E3] text-[#F26D3A]"
                        : "border-[#D9D9D9] bg-white text-[#3A3A3A] hover:border-[#F26D3A]"
                    }`}
                  >
                    <span className="block">{slot}</span>
                    {reason === "Already booked" && (
                      <span className="block text-[10px] font-semibold">Booked</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#2F2F2F]">4. Skills</h2>
              <p className="mt-1 text-sm text-[#777777]">
                Skills are prefilled locally from profile-like browser data when available, and
                you can add more.
              </p>

              <div className="mt-4 flex gap-2">
                <input
                  value={newSkill}
                  onChange={(event) => {
                    setNewSkill(event.target.value);
                    if (skillError) setSkillError("");
                  }}
                  placeholder="Add a skill"
                  className="flex-1 rounded-xl border border-[#D9D9D9] px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
                />
                <button
                  onClick={addSkill}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F26D3A] px-4 py-3 text-sm font-semibold text-white"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              {skillError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {skillError}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium ${
                      selectedSkills.includes(skill)
                        ? "border-[#F26D3A] bg-[#FFF0E3] text-[#F26D3A]"
                        : "border-[#D9D9D9] bg-white text-[#3A3A3A]"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#2F2F2F]">5. Resume</h2>
                  <p className="mt-1 text-sm text-[#777777]">
                    Select a saved resume from My Resumes, or upload a new resume.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#F26D3A] px-4 py-3 text-sm font-semibold text-[#F26D3A] transition hover:bg-[#FFF0E3]">
                  <Upload size={16} />
                  {uploadingResume ? "Uploading..." : "Upload new resume"}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    disabled={uploadingResume}
                    onChange={(event) => handleResumeUpload(event.target.files?.[0])}
                  />
                </label>
              </div>

              {resumeError && (
                <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                  {resumeError}
                </p>
              )}

              <div className="mt-5">
                {uploadedResume && (
                  <button
                    onClick={() => setSelectedResume(uploadedResume)}
                    className={`mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                      selectedResume?.type === "uploaded"
                        ? "border-[#F26D3A] bg-[#FFF0E3]"
                        : "border-[#E5E5E5] bg-[#FAFAFA]"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <FileText className="flex-shrink-0 text-[#F26D3A]" size={22} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#2F2F2F]">
                          {uploadedResume.name}
                        </span>
                        <span className="text-xs text-[#777777]">
                          Uploaded resume is preserved while you browse saved resumes
                        </span>
                      </span>
                    </span>
                    {selectedResume?.type === "uploaded" && (
                      <CheckCircle2 className="flex-shrink-0 text-[#F26D3A]" size={18} />
                    )}
                  </button>
                )}

                {loadingResumes ? (
                  <p className="text-sm text-[#777777]">Importing saved resumes...</p>
                ) : savedResumes.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {savedResumes.map((resume, index) => {
                      const id = resolveResumeId(resume, index);
                      const name = resolveResumeName(resume, index);
                      const url = resolveResumeUrl(resume);
                      const isSelected =
                        selectedResume?.type === "saved" && selectedResume.id === id;

                      return (
                        <button
                          key={id}
                          onClick={() => selectSavedResume(resume, index)}
                          className={`relative h-56 w-40 flex-shrink-0 overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${
                            isSelected ? "border-[#F26D3A] ring-2 ring-[#FFE0D0]" : "border-[#E5E5E5]"
                          }`}
                        >
                          {url ? (
                            <img
                              src={getPdfThumbnail(url)}
                              alt={name}
                              className="h-full w-full object-cover opacity-90"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-[#FAFAFA] text-[#B0B0B0]">
                              <FileText size={42} />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 text-xs font-semibold text-[#3A3A3A]">
                            {name}
                          </div>
                          {isSelected && (
                            <span className="absolute right-2 top-2 rounded-full bg-[#F26D3A] p-1 text-white">
                              <CheckCircle2 size={16} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#FAFAFA] p-4 text-sm text-[#777777]">
                    No saved resumes found. You can upload a new resume instead.
                  </p>
                )}
              </div>

              {selectedResume && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="flex-shrink-0 text-[#F26D3A]" size={22} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#2F2F2F]">
                        {selectedResume.name}
                      </p>
                      <p className="text-xs capitalize text-[#777777]">
                        {selectedResume.type} resume selected
                      </p>
                    </div>
                  </div>
                  {selectedResume.url && (
                    <a
                      href={selectedResume.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 text-xs font-semibold text-[#2563EB] underline"
                    >
                      View
                    </a>
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-xl font-bold text-[#2F2F2F]">Booking summary</h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-[#F26D3A]" size={18} />
                <span className="text-[#666666]">Mode:</span>
                <strong className="ml-auto text-[#2F2F2F]">{mode}</strong>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="text-[#F26D3A]" size={18} />
                <span className="text-[#666666]">Date:</span>
                <strong className="ml-auto text-[#2F2F2F]">
                  {dates.find((date) => date.value === selectedDate)?.displayDate || "-"}
                </strong>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-[#F26D3A]" size={18} />
                <span className="text-[#666666]">Time:</span>
                <strong className="ml-auto text-[#2F2F2F]">{selectedTime || "-"}</strong>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#FAFAFA] p-4">
              <p className="text-xs font-semibold uppercase text-[#777777]">Job role</p>
              <p className="mt-1 font-bold text-[#2F2F2F]">{selectedRole || "Not selected"}</p>
            </div>

            <div className="mt-4 rounded-2xl bg-[#FAFAFA] p-4">
              <p className="text-xs font-semibold uppercase text-[#777777]">Experience</p>
              <p className="mt-1 font-bold text-[#2F2F2F]">
                {experiencePayload.years} {experiencePayload.years === 1 ? "year" : "years"}{" "}
                {experiencePayload.months} {experiencePayload.months === 1 ? "month" : "months"}
              </p>
              <p className="mt-1 text-xs text-[#777777]">
               {experiencePayload.totalMonths} total months
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-[#777777]">Skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSkills.length > 0 ? (
                  selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-[#FFF0E3] px-3 py-1 text-xs font-semibold text-[#F26D3A]"
                    >
                      {skill}
                      {/* <X size={12} /> */}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#777777]">No skills selected</span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#FAFAFA] p-4">
              <p className="text-xs font-semibold uppercase text-[#777777]">Resume</p>
              <p className="mt-1 truncate font-bold text-[#2F2F2F]">
                {selectedResume?.name || "Not selected"}
              </p>
            </div>

            <div className="my-6 h-px bg-[#E8E8E8]" />

            <div className="rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Use purchased credits</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {creditsLoading
                      ? "Loading credits…"
                      : purchasedCredits > 0
                      ? `You have ${purchasedCredits} purchased credit${
                          purchasedCredits !== 1 ? "s" : ""
                        } remaining. Apply them first.`
                      : "You don't have any purchased credits left."}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={purchasedCredits > 0 ? usePurchasedCredits : false}
                    onChange={(e) => setUsePurchasedCredits(e.target.checked)}
                    disabled={creditsLoading || purchasedCredits === 0}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#F26D3A] transition-colors" />
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${usePurchasedCredits && purchasedCredits > 0 ? "translate-x-5" : "translate-x-0"}`} />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-[#3A3A3A]">Amount</span>
              <div className="flex items-center gap-2">
                {shouldUsePurchasedCredits && purchasedCreditsToUse > 0 && (
                  <span className="text-sm font-bold text-gray-400 line-through">₹{price}</span>
                )}
                <span className="inline-flex items-center text-2xl font-bold text-[#2F2F2F]">
                  <IndianRupee size={20} />
                  {finalPriceINR}
                </span>
              </div>
            </div>

            {shouldUsePurchasedCredits && purchasedCreditsToUse > 0 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-emerald-600">Credit Discount</span>
                <span className="text-sm font-bold text-emerald-600">- ₹{purchasedCreditsToUse}</span>
              </div>
            )}

            <button
              disabled={!canConfirm}
              onClick={handlePayAndConfirm}
              className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg disabled:cursor-not-allowed disabled:bg-[#CFCFCF]"
              style={
                canConfirm
                  ? { background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)" }
                  : undefined
              }
            >
              {paying ? "Processing..." : "Pay to confirm"}
            </button>

            {paymentError && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                {paymentError}
              </p>
            )}

            {confirmed && (
              <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
                Booking confirmed successfully.
              </p>
            )}
          </aside>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TakeMockInterviewPage;
