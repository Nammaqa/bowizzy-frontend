import { useState } from "react";
import DashNav from "@/components/dashnav/dashnav";
import { Trash2, ShieldAlert, X, AlertTriangle } from "lucide-react";
import { deleteAccount } from "@/services/accountService";
import { useNavigate } from "react-router-dom";

const gradientColor = "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)";

const Settings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (confirmText !== "delete my account") return;

    setIsDeleting(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = userData?.user_id;
      const token = userData?.token;

      if (userId && token) {
        await deleteAccount(userId, token);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        navigate("/login");
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConfirmText("");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden font-['Baloo_2']">
      <DashNav heading="Settings" />

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            {/* Page Title */}
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900">
              Account Settings
            </h2>

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

              <div className="p-5">
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
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2 rounded-lg text-white text-sm font-medium shadow-sm cursor-pointer hover:shadow-md transform transition hover:-translate-y-0.5 flex-shrink-0 self-start sm:self-center"
                    style={{
                      background:
                        "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)",
                    }}
                  >
                    Delete Account
                  </button>
                </div>
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
    </div>
  );
};

export default Settings;
