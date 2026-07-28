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
  Tag,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import api from "@/api";

const MIN_CREDITS = 1;
const MAX_CREDITS = 10;
const CREDIT_TO_INR = 0.5; // 1 credit = ₹0.5
const BASE_PRICE_INR = 10; // Base portfolio creation price in INR

const parseNumericBalance = (value: any): number => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return Math.floor(numericValue);
};

const parseProfileCreditBalances = (payload: any) => {
  const profileData = payload?.data ?? payload ?? {};

  return {
    bonusCredits: parseNumericBalance(
      profileData?.credits ??
        profileData?.credit ??
        payload?.credits ??
        payload?.credit ??
        0
    ),
    purchasedCredits: parseNumericBalance(
      profileData?.purchased_credits ??
        profileData?.purchasedCredits ??
        payload?.purchased_credits ??
        payload?.purchasedCredits ??
        0
    ),
  };
};

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

function SuccessModal({
  portfolioName,
  portfolioId,
  onClose,
}: {
  portfolioName: string;
  portfolioId: string | number | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-orange-400" />
        <div className="p-7 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Portfolio Created! 🎉
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            <strong className="text-gray-800">{portfolioName}</strong> is being
            set up. You can now edit and publish it.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (portfolioId) {
                  navigate(`/portfolio/editor/${portfolioId}`);
                } else {
                  navigate("/portfolio/list");
                }
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm hover:from-violet-700 hover:to-violet-600 transition cursor-pointer"
            >
              Go to Editor
            </button>
            <button
              onClick={() => navigate("/portfolio/list")}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
            >
              View My Portfolios
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
  const [bonusCredits, setBonusCredits] = useState<number>(0);
  const [purchasedCredits, setPurchasedCredits] = useState<number>(0);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdPortfolioId, setCreatedPortfolioId] = useState<string | number | null>(null);
  const [nameError, setNameError] = useState("");

  // Credit discount state
  const [useCredits, setUseCredits] = useState(false);
  const [usePurchasedCredits, setUsePurchasedCredits] = useState(true);
  const [selectedCredits, setSelectedCredits] = useState(MIN_CREDITS);
  const [portfolioType, setPortfolioType] = useState<string>("");

  // Derived values
  const shouldUsePurchasedCredits = purchasedCredits > 0 && usePurchasedCredits;
  const purchasedCreditsToUse = shouldUsePurchasedCredits
    ? Math.min(purchasedCredits, BASE_PRICE_INR)
    : 0;
  const amountToPay = Math.max(0, BASE_PRICE_INR - purchasedCreditsToUse);
  const creditDiscount = useCredits && !shouldUsePurchasedCredits ? selectedCredits * CREDIT_TO_INR : 0;
  const finalPriceINR = shouldUsePurchasedCredits
    ? amountToPay
    : Math.max(0, BASE_PRICE_INR - creditDiscount);
  const finalPricePaise = finalPriceINR * 100;
  const actualMaxCredits = Math.min(bonusCredits, MAX_CREDITS);
  const sliderPercent = actualMaxCredits > MIN_CREDITS
    ? ((selectedCredits - MIN_CREDITS) / (actualMaxCredits - MIN_CREDITS)) * 100
    : 0;
  const hasEnoughBonusCredits = bonusCredits >= selectedCredits;

  // Load user credits
  useEffect(() => {
    const load = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "null");
        const token = userData?.token;
        if (!token) {
          setBonusCredits(0);
          setPurchasedCredits(0);
          return;
        }

        const resp = await api.get("/personal-details/profile-data", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { bonusCredits: nextBonusCredits, purchasedCredits: nextPurchasedCredits } =
          parseProfileCreditBalances(resp?.data ?? resp);
        setBonusCredits(nextBonusCredits);
        setPurchasedCredits(nextPurchasedCredits);
      } catch {
        setBonusCredits(0);
        setPurchasedCredits(0);
      } finally {
        setCreditsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const refreshCredits = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "null");
        const token = userData?.token;
        if (!token) return;

        const resp = await api.get("/personal-details/profile-data", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { bonusCredits: nextBonusCredits, purchasedCredits: nextPurchasedCredits } =
          parseProfileCreditBalances(resp?.data ?? resp);
        setBonusCredits(nextBonusCredits);
        setPurchasedCredits(nextPurchasedCredits);
      } catch {
        setBonusCredits(0);
        setPurchasedCredits(0);
      }
    };

    const handleCreditsRefresh = () => {
      refreshCredits();
    };

    window.addEventListener("credits:refresh", handleCreditsRefresh);
    return () =>
      window.removeEventListener("credits:refresh", handleCreditsRefresh);
  }, []);

  useEffect(() => {
    if (purchasedCredits === 0) {
      setUsePurchasedCredits(false);
    }

    if (shouldUsePurchasedCredits) {
      setUseCredits(false);
      setSelectedCredits(MIN_CREDITS);
      return;
    }

    if (actualMaxCredits === 0) {
      if (useCredits) {
        setUseCredits(false);
      }
      setSelectedCredits(MIN_CREDITS);
      return;
    }

    if (selectedCredits > actualMaxCredits) {
      setSelectedCredits(actualMaxCredits);
    }
  }, [actualMaxCredits, selectedCredits, useCredits, shouldUsePurchasedCredits]);

  // Reset slider when credits toggled off
  const handleToggleCredits = (val: boolean) => {
    if (shouldUsePurchasedCredits) {
      setUseCredits(false);
      setError(null);
      return;
    }

    if (val && bonusCredits === 0) {
      setUseCredits(false);
      setError("You do not have any bonus credits available right now.");
      return;
    }

    setUseCredits(val);
    if (!val) setSelectedCredits(MIN_CREDITS);
    if (val) {
      setSelectedCredits((prev) =>
        Math.min(Math.max(prev, MIN_CREDITS), Math.min(bonusCredits, MAX_CREDITS))
      );
    }
    setError(null);
  };

  const validate = () => {
    setError(null);

    if (!portfolioName.trim()) {
      setNameError("Portfolio name is required.");
      setError("Portfolio name is required.");
      return false;
    }
    if (portfolioName.trim().length < 3) {
      setNameError("Name must be at least 3 characters.");
      setError("Name must be at least 3 characters.");
      return false;
    }
    setNameError("");
    if (!portfolioType) {
      setError("Please select a portfolio type.");
      return false;
    }
    return true;
  };

  const createPortfolioProject = async (orderId?: string, paymentId?: string, signature?: string) => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    const response = await api.post('/portfolio/create-portfolio', {
      name: portfolioName,
      portfolio_name: portfolioName,
      description: portfolioDescription,
      portfolio_type: portfolioType,
      order_id: orderId ?? null,
      razorpay_payment_id: paymentId ?? null,
      razorpay_signature: signature ?? null,
      credits_used: shouldUsePurchasedCredits ? purchasedCreditsToUse : useCredits ? selectedCredits : 0,
      purchased_credits_used: shouldUsePurchasedCredits ? purchasedCreditsToUse : 0,
      bonus_credits_used: shouldUsePurchasedCredits ? 0 : useCredits ? selectedCredits : 0,
    }, { headers: { Authorization: `Bearer ${userData.token}` } });
    return response.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (useCredits && !hasEnoughBonusCredits) {
      setError(
        `You need ${selectedCredits} bonus credits but only have ${bonusCredits}. Reduce the credit amount or disable the credit discount.`
      );
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (finalPriceINR <= 0) {
        const result = await createPortfolioProject();
        window.dispatchEvent(new CustomEvent("credits:refresh"));
        const pid = result?.portfolio_id || result?.id || result?.data?.portfolio_id || result?.portfolio?.portfolio_id || null;
        setCreatedPortfolioId(pid);
        setSuccess(true);
        setProcessing(false);
        return;
      }

      if (shouldUsePurchasedCredits && purchasedCreditsToUse >= BASE_PRICE_INR) {
        const result = await createPortfolioProject();
        window.dispatchEvent(new CustomEvent("credits:refresh"));
        const pid = result?.portfolio_id || result?.id || result?.data?.portfolio_id || result?.portfolio?.portfolio_id || null;
        setCreatedPortfolioId(pid);
        setSuccess(true);
        setProcessing(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError(
          "Failed to load payment gateway. Please check your internet connection."
        );
        setProcessing(false);
        return;
      }

      const userData = JSON.parse(localStorage.getItem("user") || "null");
      const orderResp = await api.post('/portfolio/create-order', {
        amount: finalPriceINR,
        credits_used: useCredits ? selectedCredits : 0,
        purchased_credits_used: shouldUsePurchasedCredits ? purchasedCreditsToUse : 0,
        bonus_credits_used: shouldUsePurchasedCredits ? 0 : useCredits ? selectedCredits : 0,
        portfolio_type: portfolioType,
      }, { headers: { Authorization: `Bearer ${userData.token}` } });
      const { order_id } = orderResp.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_HERE",
        amount: finalPricePaise,
        currency: "INR",
        name: portfolioName,
        description: `${portfolioDescription}`,
        order_id: order_id,
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
            const result = await createPortfolioProject(order_id, response.razorpay_payment_id, response.razorpay_signature);
            window.dispatchEvent(new CustomEvent("credits:refresh"));
            const pid = result?.portfolio_id || result?.id || result?.data?.portfolio_id || result?.portfolio?.portfolio_id || null;
            setCreatedPortfolioId(pid);
            setSuccess(true);
          } catch {
            setError(
              "Payment succeeded but portfolio creation failed. Please contact support."
            );
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
      setError(
        err?.response?.data?.message || "Something went wrong. Please try again."
      );
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DashNav heading="Create Portfolio" />

      {success && (
        <SuccessModal
          portfolioName={portfolioName}
          portfolioId={createdPortfolioId}
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
            <span className="text-xs font-bold uppercase tracking-widest text-violet-500">
              New Portfolio
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Create Your Portfolio
          </h1>

        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Choose Portfolio Type */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Choose Portfolio Type <span className="text-red-400">*</span>
            </p>
            <p className="text-xs text-gray-400 mb-5">
              Select the layout and style that fits your professional background.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Developer Card */}
              <button
                type="button"
                onClick={() => setPortfolioType("developer")}
                className={`flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer ${portfolioType === "developer"
                  ? "border-violet-500 bg-violet-50/30 shadow-md ring-2 ring-violet-200"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                  }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                  <img
                    src="/Bowizzy Logo (No Container).png"
                    alt="Developer Logo"
                    className="w-full h-full object-contain"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">Developer Portfolio</h3>
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  Tailored for Software Engineers, Tech Leads, and QA Professionals. Showcases repositories and tech stacks.
                </p>
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors flex items-center gap-1.5 cursor-pointer border border-violet-100"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview Template
                </a>
              </button>

              {/* Designer Card */}
              <button
                type="button"
                onClick={() => setPortfolioType("designer")}
                className={`flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer ${portfolioType === "designer"
                  ? "border-violet-500 bg-violet-50/30 shadow-md ring-2 ring-violet-200"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                  }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                  <img
                    src="/Bowizzy Logo (No Container).png"
                    alt="Designer Logo"
                    className="w-full h-full object-contain"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">Designer Portfolio</h3>
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  Ideal for UI/UX Designers, Product Managers, and Creatives. Focuses on visual case studies and galleries.
                </p>
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors flex items-center gap-1.5 cursor-pointer border border-violet-100"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview Template
                </a>
              </button>
            </div>
          </div>

          {/* Portfolio Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
              Portfolio Details
            </p>

            <div className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="portfolio-name"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Portfolio Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="portfolio-name"
                  type="text"
                  value={portfolioName}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, "");
                    setPortfolioName(sanitized);
                    setNameError("");
                  }}
                  placeholder="e.g. John Doe — UX Designer"
                  maxLength={50}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-violet-300 ${nameError
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-gray-50 focus:bg-white"
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
                <label
                  htmlFor="portfolio-description"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Short Description{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="portfolio-description"
                  value={portfolioDescription}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^a-zA-Z0-9\s.,!?'"-]/g, "");
                    setPortfolioDescription(sanitized);
                  }}
                  placeholder="A brief intro about yourself or what this portfolio showcases…"
                  rows={3}
                  maxLength={300}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-300 transition resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {portfolioDescription.length}/300
                </p>
              </div>
            </div>
          </div>

          {/* ── Credit Discount (collapsible toggle) ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">Use purchased credits</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {creditsLoading
                    ? "Loading credits…"
                    : purchasedCredits > 0
                    ? `You have ${purchasedCredits} purchased credit${
                        purchasedCredits !== 1 ? "s" : ""
                      } remaining.`
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
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${usePurchasedCredits ? "translate-x-5" : "translate-x-0"}`} />
              </label>
            </div>

            <div
              className={`mt-4 rounded-2xl border-2 p-5 transition-all ${useCredits ? "border-orange-300" : "border-gray-100"
                }`}
            >
            {!shouldUsePurchasedCredits ? (
              <>
                {/* Toggle row — native checkbox for reliable click handling */}
                <label className="flex items-center gap-3 cursor-pointer select-none w-full">
                  {/* Native checkbox hidden, custom track rendered via sibling */}
                  <div className="relative shrink-0 w-11 h-6">
                    <input
                      type="checkbox"
                      checked={useCredits}
                      onChange={(e) => handleToggleCredits(e.target.checked)}
                      className="sr-only"
                      disabled={creditsLoading || bonusCredits === 0}
                    />
                    <div
                      className={`absolute inset-0 rounded-full transition-colors duration-200 ${useCredits ? "bg-orange-400" : "bg-gray-200"
                        }`}
                    />
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${useCredits ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Coins
                        className={`w-4 h-4 shrink-0 ${useCredits ? "text-orange-500" : "text-gray-400"
                          }`}
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        Apply bonus credit discount
                      </span>
                      {useCredits && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                          −{selectedCredits} credit{selectedCredits > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 ml-6">
                      {creditsLoading
                        ? "Loading credits…"
                        : bonusCredits > 0
                          ? `You have ${bonusCredits} bonus credit${bonusCredits !== 1 ? "s" : ""} · Use 1-${Math.min(bonusCredits, MAX_CREDITS)} credits · 1 credit = ₹${CREDIT_TO_INR}`
                          : `You have 0 bonus credits · 1 credit = ₹${CREDIT_TO_INR}`}
                    </p>
                  </div>
                </label>

                {/* Expandable slider content */}
                {useCredits && (
              <div className="mt-5 border-t border-orange-100 pt-5">

                {/* Big credit number + saves label */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-orange-500 tabular-nums leading-none">
                      {selectedCredits}
                    </span>
                    <span className="text-sm text-gray-500">
                      credit{selectedCredits > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">saves you</p>
                    <p className="text-base font-bold text-orange-500">
                      ₹{creditDiscount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Slider */}
                <div className="px-1">
                  <style>{`
                    #credit-slider {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 100%;
                      height: 5px;
                      border-radius: 999px;
                      outline: none;
                      cursor: pointer;
                      background: linear-gradient(
                        to right,
                        #f97316 0%,
                        #f97316 ${sliderPercent}%,
                        #e5e7eb ${sliderPercent}%,
                        #e5e7eb 100%
                      );
                    }
                    #credit-slider::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: #f97316;
                      border: 2.5px solid #fff;
                      box-shadow: 0 0 0 1px #f97316, 0 2px 6px rgba(249,115,22,0.3);
                      cursor: pointer;
                      transition: transform 0.1s;
                    }
                    #credit-slider::-webkit-slider-thumb:active {
                      transform: scale(1.2);
                    }
                    #credit-slider::-moz-range-thumb {
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: #f97316;
                      border: 2.5px solid #fff;
                      box-shadow: 0 0 0 1px #f97316;
                      cursor: pointer;
                    }
                    #credit-slider:disabled { opacity: 0.4; cursor: not-allowed; }
                  `}</style>
                  <input
                    id="credit-slider"
                    type="range"
                    min={MIN_CREDITS}
                    max={actualMaxCredits}
                    step={1}
                    value={selectedCredits}
                    disabled={actualMaxCredits === 0}
                    onChange={(e) => setSelectedCredits(Number(e.target.value))}
                  />

                  {/* Clickable tick labels */}
                  <div className="flex justify-between mt-2 px-0.5">
                    {Array.from(
                      { length: actualMaxCredits },
                      (_, i) => i + 1
                    ).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSelectedCredits(n)}
                        className={`text-xs font-medium leading-none px-1 py-0.5 rounded transition-colors cursor-pointer ${n === selectedCredits
                          ? "text-orange-500 font-semibold"
                          : "text-gray-300 hover:text-gray-400"
                          }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3-column breakdown */}
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Base price</p>
                    <p className="text-sm font-semibold text-gray-700">₹{BASE_PRICE_INR.toFixed(2)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-xs text-orange-400 mb-1">Credit discount</p>
                    <p className="text-sm font-semibold text-orange-600">−₹{creditDiscount.toFixed(2)}</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3">
                    <p className="text-xs text-violet-400 mb-1">You pay</p>
                    <p className="text-sm font-semibold text-violet-700">₹{finalPriceINR.toFixed(2)}</p>
                  </div>
                </div>

                  {/* Warnings */}
                  {!creditsLoading && !hasEnoughBonusCredits && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 leading-relaxed">
                        You only have <strong>{bonusCredits} bonus credits</strong>. Reduce the slider to {bonusCredits} or fewer.
                      </p>
                    </div>
                  )}
                  {bonusCredits === 0 && !creditsLoading && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        You have no bonus credits. Full price of ₹{BASE_PRICE_INR} applies.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-sm text-orange-700">
                <p className="font-semibold">Purchased credits are available.</p>
                <p className="mt-1 text-xs text-orange-600">
                  If you use purchased credits to cover this portfolio. Bonus credits will not be applied.
                </p>
              </div>
            </>
            ) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">
                <p className="font-semibold">Purchased credits available</p>
                <p className="mt-1 text-xs text-emerald-600">
                  Your purchased credits will cover up to the portfolio price. Any remaining balance will be paid through Razorpay if needed.
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Payment method — always Razorpay, shown as info
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Payment Method
            </p>
            <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-violet-200 bg-violet-50">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  Razorpay
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  UPI, debit/credit card, net banking & more
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-bold shrink-0">
                Required
              </div>
            </div>
          </div> */}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-100 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 flex-1">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-violet-50 to-orange-50 rounded-xl border border-violet-100 px-5 py-4 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Order Summary
            </p>

            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Portfolio creation</span>
              <span className="font-semibold text-gray-800">₹{BASE_PRICE_INR}.00</span>
            </div>

            {shouldUsePurchasedCredits && (
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <Tag className="w-3.5 h-3.5" />
                  Purchased credits applied
                </span>
                <span className="font-semibold text-emerald-600">
                  −₹{purchasedCreditsToUse.toFixed(2)}
                </span>
              </div>
            )}

            {useCredits && selectedCredits > 0 && (
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-1.5 text-orange-600">
                  <Tag className="w-3.5 h-3.5" />
                  Bonus credit discount ({selectedCredits} credit
                  {selectedCredits > 1 ? "s" : ""})
                </span>
                <span className="font-semibold text-orange-600">
                  −₹{creditDiscount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="border-t border-violet-100 mt-2.5 pt-2.5 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Total</span>
              <span className="text-lg font-extrabold text-violet-700">
                ₹{finalPriceINR.toFixed(2)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>One-time · no subscription</span>
              <Lock className="w-3 h-3" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="portfolio-pay-submit-btn"
            disabled={processing}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-sm hover:from-violet-700 hover:to-violet-600 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-violet-200 cursor-pointer"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                {finalPriceINR <= 0 ? "Create Portfolio" : `Pay ₹${finalPriceINR.toFixed(2)} & Create Portfolio`}
                {useCredits && selectedCredits > 0 && (
                  <span className="ml-1 text-violet-200 font-normal text-xs">
                    ({selectedCredits} credit{selectedCredits > 1 ? "s" : ""} applied)
                  </span>
                )}
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
