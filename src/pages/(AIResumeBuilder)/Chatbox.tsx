// Razorpay type declaration
declare global {
  interface Window { Razorpay?: any; }
}
import React, { useRef, useEffect, Suspense, useState, useMemo } from "react";
import { Send, Loader2, Bot, User, Download, Lock, Tag, Sparkles, ChevronDown, ChevronUp, Info, X, Unlock } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import type { ChatSession } from "./types";
import { aiTemplateRegistry } from './templates/aiTemplateRegistry';
import { mapInfoJsonToResumeData } from './mapInfoJsonToResumeData';
import DataChips, { type DataChip } from "./DataChips";
import JdResumeFlow from "./JdResumeFlow";
import api from "@/api";

// ── AI Resume Payment constants ────────────────────────────────────────────────
const AI_RESUME_BASE_PRICE = Number(import.meta.env.VITE_BASE_AI_RESUME_PRICE) || 49.2;
const MAX_CREDITS_APPLICABLE = 10;
const CREDIT_VALUE = 0.5; // 1 credit = ₹0.5
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;

interface UserProfileData {
  name: { first_name: string; middle_name: string; last_name: string };
  image: string;
  isWelcomeBonusRedeemed: boolean;
  credits: number;
  purchased_credits?: number | string;
  coupon_code: string;
}

interface PriceBreakdown {
  basePrice: number;
  creditsApplied: number;
  creditDiscount: number;
  priceAfterCredits: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  purchasedCreditsUsed: number;
  finalPrice: number;
}

function calculatePriceBreakdown(basePrice: number, creditsApplied: number, availablePurchasedCredits: number, usePurchasedCredits: boolean): PriceBreakdown {
  const creditDiscount = creditsApplied * CREDIT_VALUE;
  const priceAfterCredits = Math.max(0, basePrice - creditDiscount);
  const cgst = parseFloat((priceAfterCredits * CGST_RATE).toFixed(2));
  const sgst = parseFloat((priceAfterCredits * SGST_RATE).toFixed(2));
  const totalTax = cgst + sgst;
  const priceWithTax = parseFloat((priceAfterCredits + totalTax).toFixed(2));
  
  const purchasedCreditsToUse = (usePurchasedCredits && availablePurchasedCredits > 0)
    ? Math.min(availablePurchasedCredits, priceWithTax)
    : 0;

  const finalPrice = Math.max(0, parseFloat((priceWithTax - purchasedCreditsToUse).toFixed(2)));
  return { basePrice, creditsApplied, creditDiscount, priceAfterCredits, cgst, sgst, totalTax, purchasedCreditsUsed: purchasedCreditsToUse, finalPrice };
}

// ── AI Resume Payment Modal ────────────────────────────────────────────────────
interface AiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  token: string;
  sessionId?: string;
  mode?: "jd" | "non-jd";
}

const AiPaymentModal: React.FC<AiPaymentModalProps> = ({ isOpen, onClose, onPaymentSuccess, token, sessionId, mode }) => {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [creditsToApply, setCreditsToApply] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [usePurchasedCredits, setUsePurchasedCredits] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  useEffect(() => {
    if (!isOpen || !token) return;
    setLoadingProfile(true);
    api.get('/personal-details/profile-data', { headers: { Authorization: `Bearer ${token}` } })
      .then(resp => setUserProfile(resp?.data ?? resp))
      .catch(err => console.error('Failed to fetch profile data', err))
      .finally(() => setLoadingProfile(false));
  }, [isOpen, token]);

  useEffect(() => {
    if (!useCredits) {
      setCreditsToApply(0);
    } else {
      setCreditsToApply(Math.min(userProfile?.credits ?? 0, MAX_CREDITS_APPLICABLE));
    }
  }, [useCredits, userProfile]);

  const availableCredits = userProfile?.credits ?? 0;
  const maxApplicable = Math.min(availableCredits, MAX_CREDITS_APPLICABLE);

  const purchasedCreditsRaw = userProfile?.purchased_credits ?? 0;
  const availablePurchasedCredits = Number.isFinite(Number(purchasedCreditsRaw)) && Number(purchasedCreditsRaw) > 0 ? Math.floor(Number(purchasedCreditsRaw)) : 0;
  
  const breakdown = calculatePriceBreakdown(AI_RESUME_BASE_PRICE, creditsToApply, availablePurchasedCredits, usePurchasedCredits);
  const purchasedCreditsToUse = breakdown.purchasedCreditsUsed;

  const handlePay = async () => {
    setPayLoading(true);
    try {
      // Load Razorpay if not already loaded
      await new Promise<void>((resolve, reject) => {
        if (typeof window !== 'undefined' && window.Razorpay) return resolve();
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
        document.body.appendChild(script);
      });

      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const authToken = token || userData?.token;
      const finalCreditsToApply = useCredits ? Math.min(creditsToApply, Math.min(availableCredits, MAX_CREDITS_APPLICABLE)) : 0;

      const createResp = await api.post(
        '/payment/create-order',
        {
          amount: breakdown.finalPrice,
          credits_applied: finalCreditsToApply,
          purchased_credits_used: purchasedCreditsToUse,
          base_price: breakdown.basePrice,
          credit_discount: breakdown.creditDiscount,
          cgst: breakdown.cgst,
          sgst: breakdown.sgst,
          plan_type: mode === 'jd' ? 'jd' : 'non-jd',
          session_id: sessionId,
        },
        authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
      );

      const orderData = createResp?.data ?? createResp;

      if (breakdown.finalPrice <= 0 || orderData?.message === 'Payment successful' || (orderData?.success === true && !orderData?.id && !orderData?.order_id && !orderData?.razorpay_order_id)) {
        window.dispatchEvent(new CustomEvent("credits:refresh"));
        onPaymentSuccess();
        onClose();
        return;
      }

      const orderId = orderData?.id || orderData?.order_id || orderData?.orderId || orderData?.razorpay_order_id;
      const razorKey = orderData?.key || orderData?.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || '';
      const amountInPaise = Math.round(breakdown.finalPrice * 100);

      const options = {
        key: razorKey,
        amount: amountInPaise,
        currency: 'INR',
        name: 'Bowizzy',
        description: 'AI Resume Builder',
        order_id: orderId,
        notes: {
          credits_applied: finalCreditsToApply,
          base_price: breakdown.basePrice,
          credit_discount: breakdown.creditDiscount,
          price_after_credits: breakdown.priceAfterCredits,
          cgst: breakdown.cgst,
          sgst: breakdown.sgst,
        },
        modal: { ondismiss: () => setPayLoading(false) },
        handler: async function (response: any) {
          try {
            const verifyResp: any = await api.post(
              '/payment/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                credits_applied: finalCreditsToApply,
                purchased_credits_used: purchasedCreditsToUse,
                session_id: sessionId,
                plan_type: mode === 'jd' ? 'jd' : 'non-jd',
              },
              authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
            );
            if (verifyResp?.data?.message === 'Payment successful' || verifyResp?.message === 'Payment successful') {
              window.dispatchEvent(new CustomEvent("credits:refresh"));
              onPaymentSuccess();
              onClose();
            } else {
              alert('Payment verification failed. Please contact support.');
              setPayLoading(false);
            }
          } catch {
            alert('Payment verification failed. Please contact support.');
            setPayLoading(false);
          }
        },
        prefill: {
          name: userProfile
            ? `${userProfile.name.first_name} ${userProfile.name.last_name}`.trim()
            : userData?.name || '',
          email: userData?.email || '',
        },
        theme: { color: '#F97316' },
      };

      const rzp = new window.Razorpay(options);
      if (typeof rzp.on === 'function') {
        rzp.on('payment.failed', () => { setPayLoading(false); alert('Payment failed or was cancelled.'); });
      }
      rzp.open();
    } catch {
      setPayLoading(false);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[90] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #fff7f3 100%)',
            border: '1px solid rgba(249,115,22,0.15)',
          }}
        >
          {/* Header band */}
          <div
            className="px-5 pt-5 pb-3"
            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center">
                <Unlock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base leading-tight">Unlock AI Resume Builder</h2>
                <p className="text-white/50 text-xs leading-tight">One-time payment · Instant access</p>
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {/* Credits Section */}
            {loadingProfile ? (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-orange-600">Loading your credits...</span>
              </div>
            ) : availableCredits > 0 ? (
              <div
                className="rounded-2xl overflow-hidden border transition-all duration-200"
                style={{
                  borderColor: useCredits ? '#F97316' : '#e5e7eb',
                  background: useCredits ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' : '#fafafa',
                }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: useCredits ? '#F97316' : '#f3f4f6' }}
                      >
                        <Sparkles className={`w-4 h-4 ${useCredits ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          You have <span className="text-orange-500">{availableCredits} credits</span>
                        </p>
                        <p className="text-xs text-gray-500">1 credit = ₹{CREDIT_VALUE} · Max {MAX_CREDITS_APPLICABLE} applicable</p>
                      </div>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => {
                        const nextValue = !useCredits;
                        setUseCredits(nextValue);
                        if (nextValue) {
                          setUsePurchasedCredits(false);
                        }
                      }}
                      className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${useCredits ? 'bg-orange-500' : 'bg-gray-300'}`}
                      style={{ boxShadow: useCredits ? 'inset 0 2px 4px rgba(0,0,0,0.15)' : 'inset 0 1px 3px rgba(0,0,0,0.1)' }}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-250 pointer-events-none ${useCredits ? 'translate-x-6' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  {/* Credit slider */}
                  {useCredits && (
                    <div className="mt-4 pt-4 border-t border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Credits to apply</span>
                        <span className="text-sm font-bold text-orange-600">
                          {creditsToApply} credits → −₹{(creditsToApply * CREDIT_VALUE).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={maxApplicable}
                        value={creditsToApply}
                        onChange={e => setCreditsToApply(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #F97316 0%, #F97316 ${maxApplicable > 0 ? (creditsToApply / maxApplicable) * 100 : 0}%, #e5e7eb ${maxApplicable > 0 ? (creditsToApply / maxApplicable) * 100 : 0}%, #e5e7eb 100%)`,
                          accentColor: '#F97316',
                        }}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">0</span>
                        <span className="text-xs text-gray-400">{maxApplicable}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">You have no credits available.</span>
              </div>
            )}

            {/* Purchased Credits Toggle Section */}
            <div className="rounded-2xl border border-gray-100 p-4 shadow-sm" style={{ background: '#fafafa' }}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Use purchased credits</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {availablePurchasedCredits > 0 ? (
                      <>You have <span className="font-semibold text-orange-500">{availablePurchasedCredits}</span> purchased credit{availablePurchasedCredits !== 1 ? 's' : ''} available. 1 credit = ₹1.</>
                    ) : (
                      <>You don't have any purchased credits left.</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const nextValue = !usePurchasedCredits;
                    setUsePurchasedCredits(nextValue);
                    if (nextValue) {
                      setUseCredits(false);
                    }
                  }}
                  disabled={availablePurchasedCredits === 0}
                  className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${(usePurchasedCredits && availablePurchasedCredits > 0) ? 'bg-orange-500' : 'bg-gray-300'} ${availablePurchasedCredits === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ boxShadow: (usePurchasedCredits && availablePurchasedCredits > 0) ? 'inset 0 2px 4px rgba(0,0,0,0.15)' : 'inset 0 1px 3px rgba(0,0,0,0.1)' }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-250 pointer-events-none ${(usePurchasedCredits && availablePurchasedCredits > 0) ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden" style={{ background: '#fff' }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setShowBreakdown(v => !v)}
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Price Breakdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">₹{breakdown.finalPrice}</span>
                  {showBreakdown ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {showBreakdown && (
                <div className="px-4 pb-4 flex flex-col gap-0">
                  <div className="border-t border-gray-100 mb-3" />
                  {[
                    { label: 'Base Price', value: `₹${breakdown.basePrice.toFixed(2)}`, highlight: false, muted: false, bold: false },
                    ...(breakdown.creditsApplied > 0
                      ? [{ label: `Credits Applied (${breakdown.creditsApplied} × ₹${CREDIT_VALUE})`, value: `−₹${breakdown.creditDiscount.toFixed(2)}`, highlight: true, muted: false, bold: false }]
                      : []),
                    { label: 'Price after Credits', value: `₹${breakdown.priceAfterCredits.toFixed(2)}`, highlight: false, muted: false, bold: true },
                    { label: 'CGST (9%)', value: `₹${breakdown.cgst.toFixed(2)}`, highlight: false, muted: true, bold: false },
                    { label: 'SGST (9%)', value: `₹${breakdown.sgst.toFixed(2)}`, highlight: false, muted: true, bold: false },
                    ...(breakdown.purchasedCreditsUsed > 0
                      ? [{ label: `Purchased Credits Used`, value: `−₹${breakdown.purchasedCreditsUsed.toFixed(2)}`, highlight: true, muted: false, bold: false }]
                      : []),
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5">
                      <span className={`text-sm ${row.highlight ? 'text-green-600 font-medium' : row.muted ? 'text-gray-400' : row.bold ? 'text-gray-700 font-semibold' : 'text-gray-600'}`}>
                        {row.label}
                      </span>
                      <span className={`text-sm font-semibold ${row.highlight ? 'text-green-600' : row.muted ? 'text-gray-400' : 'text-gray-800'}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                  {/* Total */}
                  <div
                    className="flex items-center justify-between mt-2 pt-3 rounded-xl px-3 py-2.5"
                    style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }}
                  >
                    <span className="text-sm font-bold text-white/80">Total Payable</span>
                    <span className="text-lg font-extrabold text-orange-400">₹{breakdown.finalPrice}</span>
                  </div>
                  {breakdown.creditsApplied > 0 && (
                    <p className="text-xs text-green-600 text-center mt-2 font-medium">
                      🎉 You saved ₹{breakdown.creditDiscount.toFixed(2)} using credits!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={payLoading}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: payLoading ? '#9ca3af' : 'linear-gradient(135deg, #F97316 0%, #ea580c 100%)',
                boxShadow: payLoading ? 'none' : '0 8px 24px rgba(249,115,22,0.35)',
              }}
            >
              {payLoading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Initiating Payment...</>
              ) : (
                <><Lock className="w-4 h-4" />Pay ₹{breakdown.finalPrice} & Start</>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">Secured by Razorpay · GST inclusive pricing</p>
          </div>
        </div>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: #F97316; cursor: pointer;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.2); border: 2px solid white;
        }
        input[type='range']::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #F97316; cursor: pointer; border: 2px solid white;
        }
      `}</style>
    </>
  );
};

interface ChatBoxProps {
  session: ChatSession | undefined;
  mode: "jd" | "non-jd";
  inputValue: string;
  isLoading: boolean;
  onModeChange: (mode: "jd" | "non-jd") => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFileUpload: (file: File) => void;
  onStart: () => void;
  onJdComplete: (data: any) => void;
  token: string;
  // Chip props — only present when a chip-question is active
  activeChips?: DataChip[];
  onChipDelete?: (id: string) => void;
  onChipUndo?: (id: string) => void;
  // ID of the message that should render chips below it
  chipMessageId?: string | null;
  // Re-opens the mode guidelines pop-up
  onShowGuide?: () => void;
  isJdPaid?: boolean;
  onJdPaymentSuccess?: () => void;
  initialJdText?: string;
}

export default function ChatBox({
  session,
  mode,
  inputValue,
  isLoading,
  onModeChange,
  onInputChange,
  onSend,
  onFileUpload,
  onStart,
  onJdComplete,
  token,
  activeChips,
  onChipDelete,
  onChipUndo,
  chipMessageId,
  onShowGuide,
  isJdPaid,
  onJdPaymentSuccess,
  initialJdText,
}: ChatBoxProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, activeChips]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
    e.target.value = "";
  };

  const started = session?.started ?? false;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!started ? (
          <PreStartState
            key={session?.id || 'new-session'}
            mode={mode}
            onModeChange={onModeChange}
            onFileUpload={() => fileInputRef.current?.click()}
            onStart={onStart}
            onJdComplete={onJdComplete}
            token={token}
            sessionId={session?.id}
            onShowGuide={onShowGuide}
            isJdPaid={isJdPaid}
            onJdPaymentSuccess={onJdPaymentSuccess}
            initialJdText={initialJdText}
          />
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {session?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-orange-100" : "bg-gray-100"
                    }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-orange-600" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                    ? "bg-orange-500 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                    }`}
                >
                  {msg.content}

                  {/* ── Chips rendered inline inside this bot bubble ── */}
                  {msg.role === "assistant" &&
                    chipMessageId === msg.id &&
                    activeChips &&
                    activeChips.length > 0 &&
                    onChipDelete &&
                    onChipUndo && (
                      <DataChips
                        chips={activeChips}
                        onDelete={onChipDelete}
                        onUndo={onChipUndo}
                      />
                    )}
                </div>
              </div>
            ))}

            {/* Loading bubble */}
            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-gray-600" />
                </div>
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1.5 items-center">
                    {[0, 150, 300].map((d) => (
                      <div
                        key={d}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Inline resume template preview */}
            {session?.infoJson && !isLoading && (
              <InlineResumePreview infoJson={session.infoJson} />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
      />

      {/* Input bar — only visible after start */}
      {started && (
        <div className="bg-white border-t border-gray-200 px-4 pt-3 pb-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 min-w-0 text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white placeholder-gray-400 transition"
              />
              <button
                onClick={onSend}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pre-start onboarding screen ───────────────────────────────────────────────
function PreStartState({
  mode,
  onModeChange,
  onFileUpload,
  onStart,
  onJdComplete,
  token,
  sessionId,
  onShowGuide,
  isJdPaid,
  onJdPaymentSuccess,
  initialJdText,
}: {
  mode: "jd" | "non-jd";
  onModeChange: (m: "jd" | "non-jd") => void;
  onFileUpload: () => void;
  onStart: () => void;
  onJdComplete: (data: any) => void;
  token: string;
  sessionId?: string;
  onShowGuide?: () => void;
  isJdPaid?: boolean;
  onJdPaymentSuccess?: () => void;
  initialJdText?: string;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleStartClick = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    if (mode === "jd") {
      onJdPaymentSuccess?.();
    } else {
      onStart();
    }
  };

  return (
    <div
      className={`flex flex-col items-center h-full min-h-[60vh] text-center px-4 gap-6 ${mode === "jd" ? "justify-start pt-10 pb-16" : "justify-center py-16"
        }`}
    >
      {/* Icon + heading */}
      <div>
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 mx-auto">
          <Bot className="w-6 h-6 text-orange-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">
          Let's build your resume
        </h2>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          {mode === "jd"
            ? "Paste a job description below and we'll tailor your resume to match it."
            : "Choose a mode, then hit Start Payment to begin."}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">Mode</span>
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {(["non-jd", "jd"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { if (!isJdPaid) onModeChange(m); }}
              disabled={isJdPaid}
              className={`text-xs px-4 py-1.5 rounded-md font-medium transition ${mode === m
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                } ${isJdPaid ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {m === "jd" ? "JD Mode" : "AI Mode"}
            </button>
          ))}
        </div>
        {mode === "jd" && (
          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
            Tailored to job description
          </span>
        )}
        {onShowGuide && (
          <button
            onClick={onShowGuide}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition"
          >
            <Info className="w-3.5 h-3.5" />
            How {mode === "jd" ? "JD Mode" : "AI Mode"} works
          </button>
        )}
      </div>

      {/* Start Payment button / JD flow */}
      {
        !isJdPaid ? (
          <button
            onClick={handleStartClick}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 active:scale-95 transition"
          >
            <Lock className="w-4 h-4" />
            Start Payment
          </button>
        ) : mode === "jd" ? (
          sessionId ? (
            <JdResumeFlow sessionId={sessionId} token={token} onComplete={onJdComplete} initialJdText={initialJdText} />
          ) : (
            <p className="text-xs text-gray-400">Loading session...</p>
          )
        ) : (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 active:scale-95 transition"
          >
            Start Resume Builder
          </button>
        )
      }

      {/* Payment Modal */}
      <AiPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        token={token}
        sessionId={sessionId}
        mode={mode}
      />
    </div>
  );
}

// ── Inline resume template cards shown inside chat ────────────────────────────
function InlineResumePreview({ infoJson }: { infoJson: any }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const resumeData = useMemo(() => mapInfoJsonToResumeData(infoJson), [infoJson]);

  useEffect(() => {
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const selectedTemplate = selectedIndex !== null ? aiTemplateRegistry[selectedIndex] : null;
  const SelectedDisplay = selectedTemplate?.displayComponent ?? null;

  const handleDownload = async (index: number) => {
    setDownloading(true);
    const tmpl = aiTemplateRegistry[index];
    try {
      const PdfModule = await tmpl.importPdf();
      const PdfComp = PdfModule.default;
      const blob = await pdf(
        <PdfComp data={resumeData} primaryColor={tmpl.primaryColor} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personal.firstName || 'Resume'}_${resumeData.personal.lastName || ''}_${tmpl.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div ref={previewRef} className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Choose a template to preview and download:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {aiTemplateRegistry.map((tmpl, i) => {
            const CardDisplay = tmpl.displayComponent;
            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedIndex(i)}
                className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-orange-400 hover:shadow-md transition bg-white group"
              >
                <div className="overflow-hidden flex justify-center" style={{ height: 180 }}>
                  <div
                    style={{
                      transform: 'scale(0.25)',
                      transformOrigin: 'top center',
                      width: '210mm',
                      minHeight: '297mm',
                      pointerEvents: 'none',
                    }}
                  >
                    <Suspense fallback={<div className="h-full bg-gray-50" />}>
                      <CardDisplay data={resumeData} primaryColor={tmpl.primaryColor} />
                    </Suspense>
                  </div>
                </div>
                <div className="px-2 py-2 border-t border-gray-100 text-center">
                  <span className="text-xs font-medium text-gray-600 group-hover:text-orange-500 transition">
                    {tmpl.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedIndex !== null && selectedTemplate && SelectedDisplay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <span className="text-sm font-semibold text-gray-800">
                {selectedTemplate.name} Template
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(selectedIndex)}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => setSelectedIndex(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 flex justify-center p-4">
              <div
                style={{
                  transform: 'scale(0.85)',
                  transformOrigin: 'top center',
                  width: '210mm',
                  minHeight: '297mm',
                }}
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                      Loading template...
                    </div>
                  }
                >
                  <SelectedDisplay data={resumeData} primaryColor={selectedTemplate.primaryColor} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}