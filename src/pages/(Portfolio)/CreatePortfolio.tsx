import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashNav from "@/components/dashnav/dashnav";
import {
  CreditCard,
  Coins,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Sparkles,
  Lock,
  AlertCircle,
  X,
} from "lucide-react";

const MIN_CREDITS = 1;
const MAX_CREDITS = 10;
const CREDIT_TO_INR = 0.5; // 1 credit = ₹0.5

type PaymentMethod = "razorpay" | "credits";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function SuccessModal({ portfolioName, onClose }: { portfolioName: string; onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-orange-400" />
        <div className="p-7 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Portfolio Created! 🎉</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            <strong className="text-gray-800">{portfolioName}</strong> is being set up. You can now edit and publish it.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/portfolio/list")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm hover:from-violet-700 hover:to-violet-600 transition cursor-pointer"
            >
              View My Portfolios
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
            >
              Stay Here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePortfolio() {
  const navigate = useNavigate();
  const [portfolioName, setPortfolioName] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [userCredits, setUserCredits] = useState<number>(0);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nameError, setNameError] = useState("");
  const [selectedCredits, setSelectedCredits] = useState(10);

  // Dynamic values based on slider
  const portfolioCreditsCost = selectedCredits;
  const portfolioPriceINR = selectedCredits * CREDIT_TO_INR;
  const portfolioPricePaise = portfolioPriceINR * 100;
  const sliderPercent = ((selectedCredits - MIN_CREDITS) / (MAX_CREDITS - MIN_CREDITS)) * 100;

  // Load user credits
  useEffect(() => {
    const load = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "null");
        const token = userData?.token;
        if (!token) return;

        // TODO: Replace with real API call to get current credits
        // const resp = await api.get('/personal-details/profile-data', { headers: { Authorization: `Bearer ${token}` } });
        // setUserCredits(resp.data?.credits ?? 0);
        setUserCredits(5); // Simulated — replace with API
      } catch {
        setUserCredits(0);
      } finally {
        setCreditsLoading(false);
      }
    };
    load();
  }, []);

  const validate = () => {
    if (!portfolioName.trim()) {
      setNameError("Portfolio name is required.");
      return false;
    }
    if (portfolioName.trim().length < 3) {
      setNameError("Name must be at least 3 characters.");
      return false;
    }
    setNameError("");
    return true;
  };

  const createPortfolioProject = async (paymentId?: string) => {
    // TODO: Call backend API to create the portfolio project
    // const userData = JSON.parse(localStorage.getItem("user") || "null");
    // await api.post('/portfolio/create', {
    //   name: portfolioName,
    //   description: portfolioDescription,
    //   payment_id: paymentId,
    //   payment_method: paymentMethod,
    //   credits_used: portfolioCreditsCost,
    // }, { headers: { Authorization: `Bearer ${userData.token}` } });
    return true; // Simulated success
  };

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    setError(null);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Failed to load payment gateway. Please check your internet connection.");
      setProcessing(false);
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem("user") || "null");

      // TODO: Replace with backend order creation call
      // const orderResp = await api.post('/portfolio/create-order', { amount: portfolioPricePaise }, { headers: { Authorization: `Bearer ${userData.token}` } });
      // const { order_id } = orderResp.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_HERE",
        amount: portfolioPricePaise,
        currency: "INR",
        name: "Bowizzy Portfolio",
        description: `Create portfolio: ${portfolioName}`,
        // order_id: order_id,   // Uncomment when using backend order
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
          contact: userData?.phone || "",
        },
        theme: {
          color: "#7C3AED",
        },
        handler: async (response: any) => {
          try {
            await createPortfolioProject(response.razorpay_payment_id);
            setSuccess(true);
          } catch {
            setError("Payment succeeded but portfolio creation failed. Please contact support.");
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setError("Payment was cancelled.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  const hasEnoughCredits = userCredits >= portfolioCreditsCost;

  const handleCreditsPayment = async () => {
    if (!hasEnoughCredits) {
      setError(`Insufficient credits. You need ${portfolioCreditsCost} credits but have ${userCredits}.`);
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      // TODO: Call API to deduct credits and create portfolio
      // await api.post('/portfolio/create-with-credits', { credits_used: portfolioCreditsCost, ... });
      await createPortfolioProject();
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to process credits payment.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (paymentMethod === "razorpay") {
      await handleRazorpayPayment();
    } else {
      await handleCreditsPayment();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DashNav heading="Create Portfolio" />

      {success && (
        <SuccessModal
          portfolioName={portfolioName}
          onClose={() => setSuccess(false)}
        />
      )}

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10">

        {/* Back */}
        <button
          onClick={() => navigate("/portfolio/list")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolios
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-violet-500">New Portfolio</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Create Your Portfolio</h1>
          <p className="text-sm text-gray-500 mt-1">
            One-time payment of <strong className="text-gray-700">₹{portfolioPriceINR}</strong> — or use your credits to unlock your portfolio.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Portfolio Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Portfolio Details</p>

            <div className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label htmlFor="portfolio-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Portfolio Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="portfolio-name"
                  type="text"
                  value={portfolioName}
                  onChange={(e) => { setPortfolioName(e.target.value); setNameError(""); }}
                  placeholder="e.g. John Doe — UX Designer"
                  maxLength={80}
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-violet-300 ${nameError ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 focus:bg-white"
                    }`}
                />
                {nameError && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {nameError}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="portfolio-description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Short Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="portfolio-description"
                  value={portfolioDescription}
                  onChange={(e) => setPortfolioDescription(e.target.value)}
                  placeholder="A brief intro about yourself or what this portfolio showcases…"
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-300 transition resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{portfolioDescription.length}/300</p>
              </div>
            </div>
          </div>

          {/* Credit Slider */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Credits to Use</p>
              <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full px-3 py-1">
                <Coins className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-sm font-extrabold text-violet-700">{selectedCredits}</span>
                <span className="text-xs text-violet-400 font-medium">credits</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Select how many credits to apply — min <strong className="text-gray-600">1</strong>, max <strong className="text-gray-600">10</strong>.
            </p>

            {/* Slider */}
            <div className="relative px-1">
              <style>{`
                #credit-slider {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 100%;
                  height: 6px;
                  border-radius: 999px;
                  outline: none;
                  cursor: pointer;
                  background: linear-gradient(
                    to right,
                    #7c3aed 0%,
                    #7c3aed ${sliderPercent}%,
                    #e5e7eb ${sliderPercent}%,
                    #e5e7eb 100%
                  );
                  transition: background 0.1s;
                }
                #credit-slider::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 22px;
                  height: 22px;
                  border-radius: 50%;
                  background: #7c3aed;
                  border: 3px solid #fff;
                  box-shadow: 0 2px 8px rgba(124,58,237,0.35);
                  cursor: pointer;
                  transition: box-shadow 0.2s, transform 0.1s;
                }
                #credit-slider::-webkit-slider-thumb:hover {
                  box-shadow: 0 2px 16px rgba(124,58,237,0.5);
                  transform: scale(1.15);
                }
                #credit-slider::-moz-range-thumb {
                  width: 22px;
                  height: 22px;
                  border-radius: 50%;
                  background: #7c3aed;
                  border: 3px solid #fff;
                  box-shadow: 0 2px 8px rgba(124,58,237,0.35);
                  cursor: pointer;
                }
              `}</style>
              <input
                id="credit-slider"
                type="range"
                min={MIN_CREDITS}
                max={MAX_CREDITS}
                step={1}
                value={selectedCredits}
                onChange={(e) => setSelectedCredits(Number(e.target.value))}
              />
              {/* Tick labels */}
              <div className="flex justify-between mt-2">
                {Array.from({ length: MAX_CREDITS }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSelectedCredits(n)}
                    className={`text-xs font-semibold transition cursor-pointer ${n === selectedCredits ? "text-violet-600" : "text-gray-300 hover:text-gray-500"
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Equivalent INR */}
            <div className="mt-4 flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
              <p className="text-sm text-violet-700">
                <strong>{selectedCredits} credit{selectedCredits > 1 ? "s" : ""}</strong> = equivalent to{" "}
                <strong>₹{portfolioPriceINR}</strong> portfolio creation fee
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Payment Method</p>

            <div className="flex flex-col gap-3">

              {/* Razorpay option */}
              <button
                type="button"
                id="payment-method-razorpay"
                onClick={() => setPaymentMethod("razorpay")}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition cursor-pointer ${paymentMethod === "razorpay"
                  ? "border-violet-500 bg-violet-50"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === "razorpay" ? "bg-violet-100" : "bg-white border border-gray-200"
                  }`}>
                  <CreditCard className={`w-5 h-5 ${paymentMethod === "razorpay" ? "text-violet-600" : "text-gray-400"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Pay with Razorpay</p>
                  <p className="text-xs text-gray-500 mt-0.5">UPI, debit/credit card, net banking & more</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold shrink-0 ${paymentMethod === "razorpay" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                  ₹{portfolioPriceINR}
                </div>
              </button>

              {/* Credits option */}
              <button
                type="button"
                id="payment-method-credits"
                onClick={() => setPaymentMethod("credits")}
                disabled={creditsLoading}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition cursor-pointer disabled:opacity-60 ${paymentMethod === "credits"
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === "credits" ? "bg-orange-100" : "bg-white border border-gray-200"
                  }`}>
                  <Coins className={`w-5 h-5 ${paymentMethod === "credits" ? "text-orange-500" : "text-gray-400"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Use Credits</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {creditsLoading
                      ? "Loading credits…"
                      : hasEnoughCredits
                        ? `You have ${userCredits} credits — ${portfolioCreditsCost} will be deducted`
                        : `You need ${portfolioCreditsCost} credits (you have ${userCredits})`}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${hasEnoughCredits
                  ? paymentMethod === "credits" ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-600"
                  : "bg-red-100 text-red-500"
                  }`}>
                  {portfolioCreditsCost} credits
                </div>
              </button>

            </div>

            {/* Insufficient credits warning */}
            {paymentMethod === "credits" && !creditsLoading && !hasEnoughCredits && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 leading-relaxed">
                  You don't have enough credits. Please switch to Razorpay or earn more credits first.
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-100 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 flex-1">{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-red-300 hover:text-red-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Order summary */}
          <div className="bg-gradient-to-br from-violet-50 to-orange-50 rounded-xl border border-violet-100 px-5 py-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Portfolio creation</span>
              <span className="font-bold text-gray-900">
                {paymentMethod === "razorpay" ? `₹${portfolioPriceINR}` : `${portfolioCreditsCost} credits`}
              </span>
            </div>
            <div className="border-t border-violet-100 mt-2.5 pt-2.5 flex items-center justify-between text-sm">
              <span className="text-gray-500">One-time payment — no subscription</span>
              <Lock className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="portfolio-pay-submit-btn"
            disabled={processing || (paymentMethod === "credits" && !hasEnoughCredits)}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-sm hover:from-violet-700 hover:to-violet-600 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-violet-200 cursor-pointer"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                {paymentMethod === "razorpay" ? (
                  <CreditCard className="w-4 h-4" />
                ) : (
                  <Coins className="w-4 h-4" />
                )}
                {paymentMethod === "razorpay"
                  ? `Pay ₹${portfolioPriceINR} & Create Portfolio`
                  : `Use ${portfolioCreditsCost} Credits & Create Portfolio`}
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Secured by Razorpay · 256-bit encryption
          </p>
        </form>
      </main>
    </div>
  );
}
