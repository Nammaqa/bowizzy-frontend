
import { useEffect, useState } from "react";
import DashNav from "@/components/dashnav/dashnav";
import { Trash2, ShieldAlert, X, AlertTriangle } from "lucide-react";
import {
  activateAccount,
  deactivateAccountTemporarily,
  deleteAccount,
} from "@/services/accountService";
import {
  checkInterviewerBanStatus,
  getMockInterviewUserType,
  getAcceptedMockInterviews,
  isInterviewerUserResponse,
  isInterviewerBannedResponse,
} from "@/pages/(Interviews)/MockInterview/mockInterviewService";
import { useNavigate } from "react-router-dom";

type AccountReviewStatus = "active" | "under_review";

const normalizeReviewStatus = (value: unknown): AccountReviewStatus | null => {
  if (typeof value !== "string") return null;

  const normalizedStatus = value.toLowerCase().replace(/[-_\s]/g, "");

  if (normalizedStatus === "active") {
    return "active";
  }

  if (normalizedStatus === "underreview") {
    return "under_review";
  }

  return null;
};

const getReviewStatus = (response: unknown): AccountReviewStatus | null => {
  if (!response || typeof response !== "object") {
    return null;
  }

  const responseObject = response as Record<string, unknown>;
  const rawStatus =
    responseObject.review_status ??
    responseObject.reviewStatus ??
    responseObject.status;

  const directStatus = normalizeReviewStatus(rawStatus);
  if (directStatus) {
    return directStatus;
  }

  const nestedResponse = responseObject.data ?? responseObject.result;
  return nestedResponse ? getReviewStatus(nestedResponse) : null;
};

const getAcceptedInterviews = (response: unknown): unknown[] => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  const responseObject = response as Record<string, unknown>;
  const nestedResponse = responseObject.data ?? responseObject.result;

  if (Array.isArray(responseObject.interviews)) return responseObject.interviews;
  if (Array.isArray(responseObject.accepted_interviews)) {
    return responseObject.accepted_interviews;
  }
  return getAcceptedInterviews(nestedResponse);
};

const hasIncompleteAcceptedInterview = (interviews: unknown[]): boolean =>
  interviews.some((interview) => {
    if (!interview || typeof interview !== "object") return true;

    const interviewObject = interview as Record<string, unknown>;
    const status = String(
      interviewObject.interview_status ?? interviewObject.status ?? ""
    )
      .trim()
      .toLowerCase();

    return status !== "confirmed" && status !== "completed";
  });

const updateStoredReviewStatus = (
  response: unknown,
  fallbackStatus: AccountReviewStatus
): AccountReviewStatus => {
  let userData = {};

  try {
    userData = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    console.error("Failed to parse localStorage user data:", error);
  }

  const nextStatus = getReviewStatus(response) || fallbackStatus;

  localStorage.setItem(
    "user",
    JSON.stringify({ ...userData, review_status: nextStatus })
  );

  return nextStatus;
};

const Settings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isLoadingAccountStatus, setIsLoadingAccountStatus] = useState(true);
  const [accountReviewStatus , setAccountReviewStatus] = useState<AccountReviewStatus>("active");
  const [isAdminReview, setIsAdminReview] = useState(false);
  const [isInterviewerBanned, setIsInterviewerBanned] = useState(false);
  const [isInterviewer, setIsInterviewer] = useState(false);
  const [acceptedInterviews, setAcceptedInterviews] = useState<unknown[]>([]);
  const navigate = useNavigate();

  const isAccountUnderReview = accountReviewStatus === "under_review";
  const hasAcceptedInterview = hasIncompleteAcceptedInterview(acceptedInterviews);
  const disableReviewAction =
    isAdminReview || hasAcceptedInterview || isInterviewerBanned;

  useEffect(() => {
    let userData: Record<string, any> = {};

    try {
      userData = JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      console.error("Failed to parse localStorage user data:", error);
    }

    const loadAccountReviewDetails = async () => {
      const nextStatus = getReviewStatus(userData) ?? "active";
      setAccountReviewStatus(nextStatus);

      const userId = userData?.user_id;
      const token = userData?.token;
      if (!userId || !token) {
        setIsLoadingAccountStatus(false);
        return;
      }

      try {
        const [statusResponse, acceptedResponse, interviewerResponse] = await Promise.all([
          checkInterviewerBanStatus(userId, token),
          getAcceptedMockInterviews(userId, token),
          getMockInterviewUserType(userId, token),
        ]);
        setIsAdminReview(
          statusResponse?.review_status === "under_review" &&
            statusResponse?.admin_review === true
        );
        setIsInterviewerBanned(isInterviewerBannedResponse(statusResponse));
        setAccountReviewStatus(getReviewStatus(statusResponse) ?? nextStatus);
        setAcceptedInterviews(getAcceptedInterviews(acceptedResponse));
        setIsInterviewer(isInterviewerUserResponse(interviewerResponse));
      } catch (error) {
        console.error("Failed to load account review details:", error);
      } finally {
        setIsLoadingAccountStatus(false);
      }
    };

    loadAccountReviewDetails();
  }, []);

  const handleDeleteAccount = async () => {
    if (confirmText !== "delete my account") return;
    if (hasAcceptedInterview) {
      alert("Please complete or cancel the active interview before deleting your account.");
      return;
    }

    setIsDeleting(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = userData?.user_id;
      const token = userData?.token;

      if (userId && token) {
        await deleteAccount(userId, token);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.replace("/login");
      } else {
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again later.");
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
      setConfirmText("");
    }
  };

  const handleDeactivateAccountTemporarily = async () => {
    const expectedConfirmation = isAccountUnderReview
      ? "activate my account"
      : "deactivate my account";

    if (deactivateConfirmText !== expectedConfirmation) return;

    setIsDeactivating(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = userData?.user_id;
      const token = userData?.token;

      if (userId && token) {
        if (disableReviewAction) {
          return;
        }

        if (isAccountUnderReview) {
          const response = await activateAccount(userId, token);
          setAccountReviewStatus(updateStoredReviewStatus(response, "active"));
          alert("Your account has been activated successfully.");
        } else {
          const response = await deactivateAccountTemporarily(userId, token);
          setAccountReviewStatus(
            updateStoredReviewStatus(response, "under_review")
          );
          alert(
            "Your account has been temporarily deactivated ."
          );
        }
      } else {
        navigate("/login", { replace: true });
      }
    } catch (error: any) {
      console.error("Error updating account review status:", error);
      if (error?.response?.status === 403) {
        alert("Your account is under admin review. Only an admin can activate it.");
      } else if (error?.response?.status === 409) {
        alert("Please complete the active interview first.");
      } else {
        alert(
          isAccountUnderReview
            ? "Failed to activate account. Please try again later."
            : "Failed to deactivate account temporarily. Please try again later."
        );
      }
    } finally {
      setIsDeactivating(false);
      setIsDeactivateModalOpen(false);
      setDeactivateConfirmText("");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConfirmText("");
  };

  const handleCloseDeactivateModal = () => {
    setIsDeactivateModalOpen(false);
    setDeactivateConfirmText("");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden font-['Baloo_2']">
      <DashNav heading="Settings" />

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            {/* Page Title with Status */}
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                Account Settings
              </h2>
              <span className={`text-xs font-bold rounded-full px-3 py-1 ${
                accountReviewStatus === "under_review"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-green-50 text-green-600"
              }`}>
                Active
              </span>
            </div>

            {/* Info Banner */}
            <div className="bg-white border rounded-xl p-4 sm:p-5 mb-6 shadow-sm text-gray-700 leading-relaxed text-sm sm:text-base">
              Manage your account preferences and settings here. Be careful with
              actions in the danger zone — they are permanent and cannot be
              undone.
            </div>

            {/* Danger Zone Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center"
                  style={{
                    background: "#fff",
                    border: "2px solid #FF8251",
                    boxShadow: "0 6px 18px rgba(255,130,81,0.06)",
                  }}
                >
                  <ShieldAlert className="w-4 h-4 text-[#FF8251]" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                    Danger Zone
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Actions here are permanent and cannot be undone
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-dashed border-red-200 rounded-xl p-4 bg-red-50/40">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Delete My Account
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 max-w-sm leading-relaxed">
                        Permanently delete your account and all of your data
                        including resumes, profiles, and interview history.
                      </p>
                      {hasAcceptedInterview && (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          You have an  interview. Please complete it before changing your account status.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isLoadingAccountStatus || hasAcceptedInterview}
                    className="px-5 py-2 rounded-lg text-white text-sm font-medium shadow-sm cursor-pointer hover:shadow-md transform transition hover:-translate-y-0.5 flex-shrink-0 self-start sm:self-center disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background:
                        "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)",
                    }}
                  >
                    Delete Account
                  </button>
                </div>

                {isInterviewer && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-dashed border-amber-200 rounded-xl p-4 bg-amber-50/40">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {isAccountUnderReview
                          ? "Activate My Account"
                          : "Temporarily Deactivate My Account"}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 max-w-sm leading-relaxed">
                        {isAccountUnderReview
                          ? "Your account is currently under review and temporarily inactive. Activate it when you are ready to resume access."
                          : "Temporarily deactivate your account while you are away. Your account will be paused and can be activated again when you are available or whenever you want."}
                      </p>
                      {isAdminReview && (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          Your account is under admin review. Only an admin can activate it.
                        </p>
                      )}
                      {hasAcceptedInterview && (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          You have an  interview. Please complete it before changing your account status.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDeactivateModalOpen(true)}
                    disabled={isLoadingAccountStatus || disableReviewAction}
                    className="px-5 py-2 rounded-lg text-white text-sm font-medium shadow-sm cursor-pointer hover:shadow-md transform transition hover:-translate-y-0.5 flex-shrink-0 self-start sm:self-center disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: isAccountUnderReview
                        ? "linear-gradient(180deg, #10b981 0%, #059669 100%)"
                        : "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)",
                    }}
                  >
                    {isLoadingAccountStatus
                      ? "Loading..."
                      : isAccountUnderReview
                        ? "Activate Account"
                        : "Deactivate Account"}
                  </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal — matches Dashboard cancel modal pattern */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white w-[420px] max-w-[90vw] rounded-2xl shadow-xl p-10 relative text-center">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Warning Icon — same style as Dashboard modal */}
            <div
              className="mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center shadow-inner relative"
              style={{
                background: "radial-gradient(circle, #FFF 45%, #FFCFCF 75%)",
                border: "4px solid #ef4444",
                boxShadow:
                  "0 4px 12px rgba(239, 68, 68, 0.3), inset 0 0 12px rgba(239, 68, 68, 0.15)",
              }}
            >
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              This will permanently delete your account and remove all your data
              from our servers. Type{" "}
              <span className="font-bold text-gray-900">delete my account</span>{" "}
              below to confirm.
            </p>

            <input
              type="text"
              placeholder="delete my account"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#FF8251] focus:ring-2 focus:ring-orange-100 outline-none transition-all mb-6 font-mono"
            />

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-[#FF8351] text-[#FF8351] font-semibold rounded-xl hover:bg-orange-50 transition cursor-pointer hover:shadow-sm text-sm"
              >
                Go Back
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== "delete my account" || isDeleting}
                className={`px-6 py-2 text-white font-semibold rounded-xl text-sm ${
                  confirmText === "delete my account" && !isDeleting
                    ? "cursor-pointer hover:shadow-lg transform transition hover:-translate-y-0.5"
                    : "opacity-40 cursor-not-allowed"
                }`}
                style={{
                  background:
                    confirmText === "delete my account" && !isDeleting
                      ? "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)"
                      : "#9ca3af",
                }}
                aria-busy={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeactivateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white w-[420px] max-w-[90vw] rounded-2xl shadow-xl p-10 relative text-center">
            <button
              onClick={handleCloseDeactivateModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div
              className="mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center shadow-inner relative"
              style={{
                background: "radial-gradient(circle, #FFF 45%, #FDE68A 75%)",
                border: "4px solid #f59e0b",
                boxShadow:
                  "0 4px 12px rgba(245, 158, 11, 0.25), inset 0 0 12px rgba(245, 158, 11, 0.15)",
              }}
            >
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isAccountUnderReview ? "Activate your account?" : "Temporarily deactivate your account?"}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              {isAccountUnderReview
                ? "This will set your account back to active and restore access. Type "
                : "This will pause your account temporarily . You can reactivate it later whenever you are available.  "}
              <br />
              Type 
              <span className="font-bold text-gray-900">
                {isAccountUnderReview ? "activate my account" : "deactivate my account"}
              </span>{" "}
              below to confirm.
            </p>

            <input
              type="text"
              placeholder={isAccountUnderReview ? "activate my account" : "deactivate my account"}
              value={deactivateConfirmText}
              onChange={(e) => setDeactivateConfirmText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#FF8251] focus:ring-2 focus:ring-orange-100 outline-none transition-all mb-6 font-mono"
            />

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleCloseDeactivateModal}
                className="px-6 py-2 border border-[#FF8351] text-[#FF8351] font-semibold rounded-xl hover:bg-orange-50 transition cursor-pointer hover:shadow-sm text-sm"
              >
                Go Back
              </button>

              <button
                onClick={handleDeactivateAccountTemporarily}
                disabled={
                  deactivateConfirmText !== (isAccountUnderReview ? "activate my account" : "deactivate my account") ||
                  isDeactivating
                }
                className={`px-6 py-2 text-white font-semibold rounded-xl text-sm ${
                  deactivateConfirmText === (isAccountUnderReview ? "activate my account" : "deactivate my account") && !isDeactivating
                    ? "cursor-pointer hover:shadow-lg transform transition hover:-translate-y-0.5"
                    : "opacity-40 cursor-not-allowed"
                }`}
                style={{
                  background:
                    deactivateConfirmText === (isAccountUnderReview ? "activate my account" : "deactivate my account") && !isDeactivating
                      ? isAccountUnderReview
                        ? "linear-gradient(180deg, #10b981 0%, #059669 100%)"
                        : "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)"
                      : "#9ca3af",
                }}
                aria-busy={isDeactivating}
              >
                {isDeactivating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    {isAccountUnderReview ? "Activating..." : "Deactivating..."}
                  </>
                ) : isAccountUnderReview ? (
                  "Activate Account"
                ) : (
                  "Deactivate Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;