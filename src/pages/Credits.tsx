import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashNav from "@/components/dashnav/dashnav";
import { X, Coins, Zap, ArrowRight, Check } from "lucide-react";
import api from "@/api";

// Razorpay type declaration
declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface CreditPack {
  amount: number;
  base: number;
  bonusPct: number;
  popular?: boolean;
}

// Credit packs configuration
const CREDIT_PACKS: CreditPack[] = [
  { amount: 50, base: 50, bonusPct: 10, popular: false },
  { amount: 100, base: 100, bonusPct: 10, popular: true },
  { amount: 250, base: 250, bonusPct: 10, popular: false },
];

const calculateBonusCredits = (pack: CreditPack) => Math.round((pack.amount * pack.bonusPct) / 100);
const calculateTotalCredits = (pack: CreditPack) => pack.base + calculateBonusCredits(pack);

const CONFETTI_COLORS = ["#F97316", "#F59E0B", "#10B981", "#38BDF8", "#EC4899"];

type ConfettiPiece = {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
  shape: "rect" | "circle";
};

function generateConfetti(count = 70): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.4,
    duration: 2.2 + Math.random() * 1.6,
    rotate: Math.random() * 360,
    size: 6 + Math.random() * 6,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));
}

type CreditsProps = {
  modal?: boolean;
  onClose?: () => void;
};

export default function Credits({ modal = false, onClose }: CreditsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState<number>(100);
  const [userInfo, setUserInfo] = useState<any>(null);

  // ── success celebration state ───────────────────────────────────────────
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchasedPack, setPurchasedPack] = useState<CreditPack | null>(null);
  const confetti = useMemo(() => (showSuccess ? generateConfetti() : []), [showSuccess]);

  // Get pack from URL params and set as default selected
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const packParam = params.get("pack");
    if (packParam) {
      const packAmount = parseInt(packParam, 10);
      if (!isNaN(packAmount) && CREDIT_PACKS.some(p => p.amount === packAmount)) {
        setSelectedPack(packAmount);
      }
    }
  }, [location.search]);

  // Get user info
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUserInfo(parsed);
      } catch {
        setUserInfo(null);
      }
    }
  }, []);

  // Load Razorpay script
  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
      document.body.appendChild(script);
    });

  const handleBuyCredits = async () => {
    if (!userInfo) {
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const userId = userInfo.user_id || userInfo.id || userInfo.userId;
      const token = userInfo.token || localStorage.getItem("token");

      if (!userId || !token) {
        navigate("/login");
        return;
      }

      // Load Razorpay
      await loadRazorpayScript();

      // Call the create-order API
      const response = await api.post(`/credits/${userId}/create-order`, {
        amount: selectedPack,
        currency: "INR"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const orderData = response?.data ?? response;
      const orderId = orderData?.order?.id || orderData?.id || orderData?.order_id || orderData?.orderId || orderData?.razorpay_order_id;
      const razorKey = orderData?.key || orderData?.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || '';

      // Amount in paise (₹100 = 10000 paise)
      const amountInPaise = Number(orderData?.amount ?? selectedPack) * 100;
      const packAtPurchase = CREDIT_PACKS.find(p => p.amount === selectedPack) ?? null;

      const options = {
        key: razorKey,
        amount: amountInPaise,
        currency: 'INR',
        name: 'Bowizzy',
        description: 'Buy Credits',
        order_id: orderId,
        notes: {
          credit_pack: selectedPack,
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async function (response: any) {
          try {
            const verifyResp: any = await api.post(
              `/credits/${userId}/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: selectedPack,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (
              verifyResp?.data?.message === 'Credit purchase verified successfully' ||
              verifyResp?.message === 'Credit purchase verified successfully'
            ) {
              setPurchasedPack(packAtPurchase);
              setLoading(false);
              setShowSuccess(true);
            } else {
              alert('Payment verification failed. Please contact support.');
              setLoading(false);
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            alert('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        prefill: {
          name: userInfo ? `${userInfo.name?.first_name || ''} ${userInfo.name?.last_name || ''}`.trim() : '',
          email: userInfo?.email || '',
        },
        theme: { color: '#F97316' },
      };

      const rzp = new window.Razorpay(options);
      if (typeof rzp.on === 'function') {
        rzp.on('payment.failed', () => {
          setLoading(false);
          alert('Payment failed or was cancelled.');
        });
      }
      rzp.open();
    } catch (error: any) {
      console.error("Credits purchase error:", error);
      alert(error.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessDismiss = () => {
    setShowSuccess(false);
    if (modal && onClose) {
      onClose();
    }
    window.location.reload();
  };

  const content = (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Buy Credits</h1>
        <p className="text-gray-600 text-sm">Select a credit pack to continue using our services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {CREDIT_PACKS.map((pack) => {
          const bonus = calculateBonusCredits(pack);
          const total = calculateTotalCredits(pack);
          const isSelected = selectedPack === pack.amount;

          return (
            <div
              key={pack.amount}
              className={`relative rounded-xl overflow-hidden transition-all cursor-pointer ${
                isSelected ? "ring-2 ring-orange-500" : "hover:ring-2 hover:ring-orange-300"
              } bg-white shadow-lg`}
              onClick={() => setSelectedPack(pack.amount)}
            >
              {pack.popular && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 text-xs font-bold rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins size={20} className="text-orange-500" />
                    <span className="text-sm font-semibold text-gray-600">Credit Pack</span>
                  </div>

                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-2xl md:text-3xl font-bold text-gray-900">₹{pack.amount}</span>
                    <span className="text-sm text-gray-600">pack</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-500">{pack.base} credits</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Zap size={12} className="fill-emerald-600" />
                      +{bonus} bonus
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    Total: <span className="font-semibold">{total} credits</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleBuyCredits}
          disabled={loading}
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition disabled:opacity-50 mx-auto"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><ArrowRight size={16} /> Buy Credits</>
          )}
        </button>
        <p className="text-gray-400 text-xs mt-3">Secure checkout · Credits are added to your account instantly</p>
      </div>
    </div>
  );

  const successBonus = purchasedPack ? calculateBonusCredits(purchasedPack) : 0;
  const successTotal = purchasedPack ? calculateTotalCredits(purchasedPack) : 0;

  const successOverlay = showSuccess && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(105vh) rotate(540deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          top: -10vh;
          animation-name: confetti-fall;
          animation-timing-function: ease-in;
          animation-fill-mode: forwards;
        }
        @keyframes success-pop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .success-pop { animation: success-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes check-draw {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="absolute inset-0 bg-black/50" style={{ backdropFilter: 'blur(6px)' }} />

      {/* confetti layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="confetti-piece"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.shape === "rect" ? c.size * 0.4 : c.size,
              backgroundColor: c.color,
              borderRadius: c.shape === "circle" ? "9999px" : "2px",
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <div className="success-pop relative bg-white rounded-[28px] shadow-2xl w-full max-w-sm p-7 text-center z-10">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check size={24} className="text-white" strokeWidth={3} />
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-1">Credits purchased!</h3>
        <p className="text-sm text-gray-500 mb-5">
          {purchasedPack ? (
            <>
              <span className="font-semibold text-gray-700">{purchasedPack.base} credits</span> + a{' '}
              <span className="font-semibold text-emerald-600">{successBonus} bonus</span> — {successTotal} credits are in your account.
            </>
          ) : (
            'Your credits have been added to your account.'
          )}
        </p>

        <button
          onClick={handleSuccessDismiss}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm transition shadow-lg shadow-orange-500/25"
        >
          Continue
        </button>
      </div>
    </div>
  );

  if (modal) {
    return (
      <div className="relative">
        <button onClick={() => onClose && onClose()} className="absolute top-2 right-2 p-2 rounded-full bg-white text-gray-700 z-50">
          <X size={18} />
        </button>
        <div className="bg-white rounded-lg p-6 shadow-2xl">{content}</div>
        {successOverlay}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden font-['Baloo_2']">
      <DashNav heading="Buy Credits" />
      <div className="flex-1 bg-gray-50 overflow-auto flex items-center justify-center p-4 md:p-8">{content}</div>
      {successOverlay}
    </div>
  );
}