import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/services/login";
import Bowizzy from "../assets/bowizzy.png";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const data = await loginUser(email, password);
      if (data?.user_type && String(data.user_type).toLowerCase() === "admin") {
        setError("Access denied. Please log in using the Admin portal.");
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          user_id: data.user_id,
          email: data.email,
          token: data.token,
        })
      );

      // Hard redirect: replaceState changes the browser's current history
      // entry to /dashboard, then reload() forces a full page refresh so
      // React Router re-initialises with a completely empty in-memory stack.
      // This mirrors navigation.reset() — no old session pages survive.
      window.history.replaceState(null, "", "/dashboard");
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Login error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-['Baloo_2']">
      {/* LEFT ORANGE PANEL */}
      <div className="hidden md:flex flex-col justify-between bg-[#FFE9D6] p-12">
        <div>
          <img src={Bowizzy} alt="Logo" className="w-32" />
        </div>

        <h1 className="text-4xl md:text-5xl font-semibold text-orange-700 leading-snug">
          Prep for interviews. <br /> Grow your career.
        </h1>

        <p className="text-sm text-gray-600">
          Ready to get started? Sign up for free.
        </p>
      </div>

      {/* RIGHT LOGIN FORM */}
      <div className="flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-8">
            <img src={Bowizzy} alt="Logo" className="w-32" />
          </div>

          <h2 className="text-3xl font-semibold text-gray-900 text-center mb-8">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailPattern.test(e.target.value)) {
                    setError("Invalid email format");
                  } else {
                    setError("");
                  }
                }}
                required
                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                  placeholder="Enter your password"
                />

                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600 text-xl"
                >
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <p className="text-center text-xs text-gray-500">
              By clicking Login, you agree to our{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 font-semibold hover:underline"
              >
                Terms and Conditions
              </a>
              {" "}and{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 font-semibold hover:underline"
              >
                Privacy Policy
              </a>
              .
            </p>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-medium cursor-pointer flex items-center justify-center ${loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              style={{
                background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)",
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Login"
              )}
            </button>

            <div className="text-right text-sm">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-orange-500 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 cursor-pointer">
              Don’t have an account?{" "}
              <span
                onClick={() => navigate("/signup")}
                className="text-orange-500 font-medium hover:underline cursor-pointer"
              >
                Sign Up
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
