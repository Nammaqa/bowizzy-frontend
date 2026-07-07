import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Bowizzy from "../assets/bowizzy.png";
import {
  changeForgotPassword,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
} from "@/services/login";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#])[A-Za-z\d@$!%*?&_#]{8,}$/;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "error">("");
  const [loadingAction, setLoadingAction] = useState<"" | "send" | "verify" | "change">("");

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required";
    if (value.length > 150) return "Email must be 150 characters or less";
    if (!emailPattern.test(value)) return "Enter a valid email address";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (!passwordPattern.test(value)) {
      return "Min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol";
    }
    return "";
  };

  const resetOtpState = () => {
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    setOtpError("");
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  const handleEmailChange = (value: string) => {
    const nextEmail = value.slice(0, 150);
    setEmail(nextEmail);
    setEmailError(nextEmail ? validateEmail(nextEmail) : "");
    setMessage("");
    setMessageType("");
    resetOtpState();
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const nextError = validateEmail(email);

    setEmailError(nextError);
    setMessage("");
    setMessageType("");

    if (nextError) return;

    try {
      setLoadingAction("send");
      await sendForgotPasswordOtp(email);
      setOtpSent(true);
      setOtpVerified(false);
      setOtp("");
      setMessageType("success");
      setMessage("OTP sent to your email.");
    } catch (err: any) {
      setOtpSent(false);
      setMessageType("error");
      setMessage(err?.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoadingAction("");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit OTP");
      return;
    }

    try {
      setLoadingAction("verify");
      await verifyForgotPasswordOtp(email, otp);
      setOtpVerified(true);
      setOtpError("");
      setMessageType("success");
      setMessage("OTP verified. Create your new password.");
    } catch (err: any) {
      setOtpVerified(false);
      setMessageType("error");
      setMessage(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoadingAction("");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextPasswordError = validatePassword(password);
    const nextConfirmError =
      password && confirmPassword && password === confirmPassword
        ? ""
        : "Passwords do not match";

    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmError);
    setMessage("");
    setMessageType("");

    if (nextPasswordError || nextConfirmError) return;

    try {
      setLoadingAction("change");
      await changeForgotPassword(email, otp, password);
      setMessageType("success");
      setMessage("Password changed successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      setMessageType("error");
      setMessage(err?.response?.data?.message || "Failed to change password. Please try again.");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-['Baloo_2']">
      <div className="hidden md:flex flex-col justify-between bg-[#FFE9D6] p-12">
        <img src={Bowizzy} alt="Logo" className="w-32" />

        <h1 className="text-4xl md:text-5xl font-semibold text-orange-700 leading-snug">
          Reset access. <br /> Keep moving.
        </h1>

        <p className="text-sm text-gray-600">
          We will verify your email before updating your password.
        </p>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md">
          <div className="md:hidden flex justify-center mb-8">
            <img src={Bowizzy} alt="Logo" className="w-32" />
          </div>

          <h2 className="text-3xl font-semibold text-gray-900 text-center mb-3">
            Forgot Password
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Enter your email to receive a verification OTP.
          </p>

          <div className="space-y-6">
            <form onSubmit={handleSendOtp} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  maxLength={150}
                  disabled={otpVerified}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none ${
                    otpVerified ? "border-green-500 bg-green-50 text-gray-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your email"
                />
                <button
                  type="submit"
                  disabled={loadingAction === "send" || otpVerified}
                  className={`sm:w-32 px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center ${
                    loadingAction === "send" || otpVerified ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {loadingAction === "send" ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : otpSent ? (
                    "Resend"
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </div>
              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
            </form>

            {otpSent && !otpVerified && (
              <form onSubmit={handleVerifyOtp} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  OTP
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setOtpError("");
                    }}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none tracking-widest text-center text-lg font-semibold"
                    placeholder="123456"
                  />
                  <button
                    type="submit"
                    disabled={loadingAction === "verify" || otp.length !== 6}
                    className={`sm:w-32 px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center ${
                      loadingAction === "verify" || otp.length !== 6 ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {loadingAction === "verify" ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
                {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
              </form>
            )}

            {otpVerified && (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPassword(value);
                        setPasswordError(validatePassword(value));
                        if (confirmPassword) {
                          setConfirmPasswordError(value === confirmPassword ? "" : "Passwords do not match");
                        }
                      }}
                      required
                      className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none pr-11"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-xl"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                    </button>
                  </div>
                  {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        setConfirmPassword(value);
                        setConfirmPasswordError(password === value ? "" : "Passwords do not match");
                      }}
                      required
                      className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none pr-11"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-xl"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                    </button>
                  </div>
                  {confirmPasswordError && <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loadingAction === "change"}
                  className={`w-full py-3 rounded-lg text-white font-medium flex items-center justify-center ${
                    loadingAction === "change" ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  style={{
                    background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)",
                  }}
                >
                  {loadingAction === "change" ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Change Password"
                  )}
                </button>
              </form>
            )}

            {message && (
              <p
                className={`text-sm text-center ${
                  messageType === "success" ? "text-green-600" : "text-red-500"
                }`}
              >
                {message}
              </p>
            )}

            <p className="text-center text-sm text-gray-600">
              Remember your password?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-orange-500 font-medium hover:underline cursor-pointer"
              >
                Login
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
