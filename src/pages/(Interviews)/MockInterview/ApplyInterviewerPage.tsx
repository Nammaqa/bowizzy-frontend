import DashNav from "@/components/dashnav/dashnav";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getInterviewerBankDetailsStatus,
  isVerifiedInterviewerResponse,
  submitInterviewerBankDetails,
  validateInterviewer,
} from "./mockInterviewService";

const accountTypes = ["Savings Account", "Current Account"];

const initialForm = {
  bank_name: "",
  account_holder_name: "",
  account_number: "",
  confirm_account_number: "",
  ifsc_code: "",
  account_type: "Savings Account",
  branch_name: "",
};

// Account numbers are digits only; IFSC is letters + digits only.
// Bank name, account holder name and branch name stay free text.
const digitsOnlyRegex = /^\d+$/;
const alphanumericRegex = /^[A-Za-z0-9]+$/;

const isPendingApplication = (value: any) => {
  const statusText = [
    value?.status,
    value?.interviewer_status,
    value?.user_status,
    value?.verification_status,
    value?.message,
    value?.error,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    statusText.includes("requesting") ||
    statusText.includes("pending") ||
    statusText.includes("already") ||
    statusText.includes("submitted") ||
    statusText.includes("approval")
  );
};

const ApplyInterviewerPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [applicationState, setApplicationState] = useState<"form" | "pending" | "verified">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const checkApplicationStatus = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;
        const token = user?.token;

        if (!userId || !token) return;

        const bankStatus = await getInterviewerBankDetailsStatus(userId, token);

        if (bankStatus?.submitted === true) {
          const verification = await validateInterviewer(userId, token).catch(() => null);

          if (isVerifiedInterviewerResponse(verification)) {
            setApplicationState("verified");
            return;
          }

          setApplicationState("pending");
          return;
        }

        const verification = await validateInterviewer(userId, token).catch(() => null);
        if (isVerifiedInterviewerResponse(verification)) {
          setApplicationState("verified");
          return;
        }
      } catch (error: any) {
        if (isPendingApplication(error?.response?.data)) {
          setApplicationState("pending");
        }
      } finally {
        setCheckingStatus(false);
      }
    };

    checkApplicationStatus();
  }, []);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    // Reject characters that aren't valid for the field as they're typed.
    if (
      (field === "account_number" || field === "confirm_account_number") &&
      !/^\d*$/.test(value)
    ) {
      return;
    }

    if (field === "ifsc_code" && !/^[A-Za-z0-9]*$/.test(value)) return;

    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setError("");
    setSuccess("");
  };

  const validateForm = () => {
    if (!form.bank_name.trim()) return "Bank name is required.";
    if (!form.account_holder_name.trim()) return "Account holder name is required.";

    if (!form.account_number.trim()) return "Account number is required.";
    if (!digitsOnlyRegex.test(form.account_number)) {
      return "Account number must contain digits only.";
    }

    if (!form.confirm_account_number.trim()) {
      return "Confirm account number is required.";
    }
    if (!digitsOnlyRegex.test(form.confirm_account_number)) {
      return "Confirm account number must contain digits only.";
    }
    if (form.account_number !== form.confirm_account_number) {
      return "Account numbers do not match.";
    }

    if (!form.ifsc_code.trim()) return "IFSC code is required.";
    if (!alphanumericRegex.test(form.ifsc_code)) {
      return "IFSC code must contain letters and numbers only.";
    }

    if (!form.account_type) return "Account type is required.";
    if (!form.branch_name.trim()) return "Branch name is required.";
    return "";
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?.user_id;
      const token = user?.token;
      if (!userId || !token) {
        setError("Please login again to apply as interviewer.");
        return;
      }

      setSubmitting(true);
      setError("");
      await submitInterviewerBankDetails(userId, token, {
        bank_name: form.bank_name.trim(),
        account_holder_name: form.account_holder_name.trim(),
        account_number: form.account_number,
        ifsc_code: form.ifsc_code,
        account_type: form.account_type,
        branch_name: form.branch_name.trim(),
      });
      setApplicationState("pending");
      setSuccess("Application submitted. Your interviewer status is now pending approval.");
    } catch (error: any) {
      if (isPendingApplication(error?.response?.data) || isPendingApplication(error)) {
        setApplicationState("pending");
        setError("");
        return;
      }

      setError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to submit interviewer application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-['Baloo_2']">
      <DashNav heading="Apply as Interviewer" />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/interviews/mock-interview")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#F26D3A]"
        >
          <ArrowLeft size={16} />
          Back to mock interview
        </button>

        {checkingStatus ? (
          <section className="rounded-3xl bg-white p-8 text-center text-[#777777] shadow-sm">
            Checking interviewer application status...
          </section>
        ) : applicationState === "pending" ? (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto inline-flex rounded-2xl bg-[#FFF0E3] p-4 text-[#F26D3A]">
              <Clock3 size={30} />
            </div>
            <h1 className="mt-5 text-3xl font-bold text-[#2F2F2F]">
              Applied as interviewer
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#666666]">
              Please wait until admin verifies your application. Once approved, your
              interviewer dashboard will be unlocked.
            </p>
            <button
              onClick={() => navigate("/interviews/mock-interview/dashboard")}
              className="mt-6 rounded-xl border border-[#F26D3A] px-5 py-3 text-sm font-bold text-[#F26D3A]"
            >
              Check dashboard access
            </button>
          </section>
        ) : applicationState === "verified" ? (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto inline-flex rounded-2xl bg-green-50 p-4 text-green-700">
              <CheckCircle2 size={30} />
            </div>
            <h1 className="mt-5 text-3xl font-bold text-[#2F2F2F]">
              You are already a verified interviewer
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#666666]">
              Your interviewer dashboard is ready.
            </p>
            <button
              onClick={() => navigate("/interviews/mock-interview/dashboard")}
              className="mt-6 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md"
              style={{ background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)" }}
            >
              Open interviewer dashboard
            </button>
          </section>
        ) : (
        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#2F2F2F]">Interviewer verification</h1>
            <p className="mt-2 text-sm leading-6 text-[#666666]">
              Submit your bank details for interviewer verification. Once submitted, your
              status moves to pending approval.
            </p>
            <p className="mt-3 text-sm font-medium text-[#F26D3A]">All fields are mandatory.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-[#3A3A3A]">Bank name <span className="text-red-500">*</span></label>
              <input
                value={form.bank_name}
                onChange={(event) => updateField("bank_name", event.target.value)}
                placeholder="ICICI Bank"
                className="mt-2 w-full rounded-xl border border-[#D9D9D9] px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#3A3A3A]">
                Account holder name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.account_holder_name}
                onChange={(event) => updateField("account_holder_name", event.target.value)}
                placeholder="John Doe"
                className="mt-2 w-full rounded-xl border border-[#D9D9D9] px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#3A3A3A]">Account number <span className="text-red-500">*</span></label>
              <input
                value={form.account_number}
                onChange={(event) =>
                  updateField("account_number", event.target.value)
                }
                placeholder="1234567890"
                inputMode="numeric"
                className="mt-2 w-full rounded-xl border border-[#D9D9D9] px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#3A3A3A]">
                Confirm account number <span className="text-red-500">*</span>
              </label>
              <input
                value={form.confirm_account_number}
                onChange={(event) =>
                  updateField(
                    "confirm_account_number",
                    event.target.value
                  )
                }
                placeholder="Re-enter account number"
                inputMode="numeric"
                className="mt-2 w-full rounded-xl border border-[#D9D9D9] px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#3A3A3A]">IFSC code <span className="text-red-500">*</span></label>
              <input
                value={form.ifsc_code}
                onChange={(event) => updateField("ifsc_code", event.target.value)}
                placeholder="ICIC0000001"
                className="mt-2 w-full rounded-xl border border-[#D9D9D9] px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#3A3A3A]">Account type <span className="text-red-500">*</span></label>
              <select
                value={form.account_type}
                onChange={(event) => updateField("account_type", event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#D9D9D9] bg-white px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
              >
                {accountTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-[#3A3A3A]">Branch name <span className="text-red-500">*</span></label>
              <input
                value={form.branch_name}
                onChange={(event) => updateField("branch_name", event.target.value)}
                placeholder="Mumbai Main"
                className="mt-2 w-full rounded-xl border border-[#D9D9D9] px-4 py-3 text-sm focus:border-[#F26D3A] focus:outline-none focus:ring-2 focus:ring-[#FFE0D0]"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
              {success}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => navigate("/interviews/mock-interview/dashboard")}
              className="rounded-xl border border-[#F26D3A] px-5 py-3 text-sm font-bold text-[#F26D3A]"
            >
              Check dashboard access
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:bg-[#CFCFCF]"
              style={
                submitting
                  ? undefined
                  : { background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)" }
              }
            >
              {submitting ? "Submitting..." : "Submit for verification"}
            </button>
          </div>
        </section>
        )}
      </div>
    </div>
  );
};

export default ApplyInterviewerPage;
