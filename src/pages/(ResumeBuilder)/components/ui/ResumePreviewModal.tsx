// Razorpay type declaration for TypeScript
declare global {
  interface Window {
    Razorpay?: any;
  }
}
import React, { useState, useRef, useEffect } from "react";
// Get resume amount from Vite env
const RESUME_AMOUNT = Number(import.meta.env.VITE_BASE_RESUME_PRICE) || 24.6;
const MAX_CREDITS_APPLICABLE = 10;
const CREDIT_VALUE = 0.5; // 1 credit = ₹0.5
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;

import { Lock, Tag, Sparkles, ChevronDown, ChevronUp, Info } from "lucide-react";
import { X, Download, Eye } from "lucide-react";
import type { ResumeData } from "@/types/resume";
import { getTemplateById } from "@/templates/templateRegistry";
import { pdf } from "@react-pdf/renderer";
import { usePageMarkers } from "@/hooks/usePageMarkers";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import api from "@/api";
import { getExperienceSummary } from "@/services/experienceSummaryService";

interface UserProfileData {
  name: { first_name: string; middle_name: string; last_name: string };
  image: string;
  isWelcomeBonusRedeemed: boolean;
  credits: number;
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
  finalPrice: number;
}

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  templateId: string | null;
  editorPaginatePreview?: boolean;
  autoGeneratePreview?: boolean;
  autoShowPdfPreview?: boolean;
  onPreviewComplete?: () => void;
  onSaveAndExit?: () => Promise<void>;
  onSaveAndDownloadComplete?: () => void;
  userId?: string;
  token?: string;
  resumeTemplateId?: string | null;
  username?: string;
  experienceSummary?: string;
  jobRole?: string;
  primaryColor?: string;
  fontFamily?: string;
}

// ─── Price Breakdown Calculator ───────────────────────────────────────────────
function calculatePriceBreakdown(basePrice: number, creditsApplied: number): PriceBreakdown {
  const creditDiscount = creditsApplied * CREDIT_VALUE;
  const priceAfterCredits = Math.max(0, basePrice - creditDiscount);
  const cgst = parseFloat((priceAfterCredits * CGST_RATE).toFixed(2));
  const sgst = parseFloat((priceAfterCredits * SGST_RATE).toFixed(2));
  const totalTax = cgst + sgst;
  const finalPrice = parseFloat((priceAfterCredits + totalTax).toFixed(2));
  return { basePrice, creditsApplied, creditDiscount, priceAfterCredits, cgst, sgst, totalTax, finalPrice };
}

// ─── Payment Breakdown Modal ──────────────────────────────────────────────────
interface PaymentBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  templateId: string | null;
  userId?: string;
  token?: string;
  resumeName: string;
}

const PaymentBreakdownModal: React.FC<PaymentBreakdownModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  templateId,
  userId,
  token,
  resumeName,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [creditsToApply, setCreditsToApply] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId || !token) return;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const resp = await api.get('/personal-details/profile-data', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = resp?.data ?? resp;
        setUserProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile data', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [isOpen, userId, token]);

  // Reset credits when toggling
  useEffect(() => {
    if (!useCredits) {
      setCreditsToApply(0);
    } else {
      const maxApplicable = Math.min(userProfile?.credits ?? 0, MAX_CREDITS_APPLICABLE);
      setCreditsToApply(maxApplicable);
    }
  }, [useCredits, userProfile]);

  const availableCredits = userProfile?.credits ?? 0;
  const maxApplicable = Math.min(availableCredits, MAX_CREDITS_APPLICABLE);
  const breakdown = calculatePriceBreakdown(RESUME_AMOUNT, creditsToApply);

  const handlePay = async () => {
    setPayLoading(true);
    try {
      const loadRazorpayScript = () =>
        new Promise((resolve, reject) => {
          if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
          document.body.appendChild(script);
        });

      await loadRazorpayScript();

      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const authToken = token || userData?.token;

      // Ensure creditsToApply respects the maximum (10 or available, whichever is less)
      const finalCreditsToApply = useCredits ? Math.min(creditsToApply, Math.min(availableCredits, MAX_CREDITS_APPLICABLE)) : 0;

      const createResp = await api.post(
        '/payment/create-order',
        {
          amount: breakdown.finalPrice,
          credits_applied: finalCreditsToApply,
          base_price: breakdown.basePrice,
          credit_discount: breakdown.creditDiscount,
          cgst: breakdown.cgst,
          sgst: breakdown.sgst,
          plan_type: 'RESUME_NON_AI',
          template_id: templateId,
          resume_name: resumeName,
        },
        authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
      );

      const orderData = createResp?.data ?? createResp;
      const orderId = orderData?.id || orderData?.order_id || orderData?.orderId || orderData?.razorpay_order_id;
      const razorKey = orderData?.key || orderData?.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || '';
      // Amount in paise
      const amountInPaise = Math.round(breakdown.finalPrice * 100);

      const options = {
        key: razorKey,
        amount: amountInPaise,
        currency: 'INR',
        name: 'Bowizzy',
        description: 'Premium Resume Unlock',
        order_id: orderId,
        notes: {
          credits_applied: finalCreditsToApply,
          base_price: breakdown.basePrice,
          credit_discount: breakdown.creditDiscount,
          price_after_credits: breakdown.priceAfterCredits,
          cgst: breakdown.cgst,
          sgst: breakdown.sgst,
          template_id: templateId ?? '',
          resume_name: resumeName,
        },
        modal: {
          ondismiss: () => setPayLoading(false),
        },
        handler: async function (response: any) {
          try {
            const verifyResp: any = await api.post(
              '/payment/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                credits_applied: useCredits ? creditsToApply : 0,
              },
              authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
            );

            if (verifyResp?.data?.message === "Payment successful" || verifyResp?.message === "Payment successful") {
              onPaymentSuccess();
              onClose();
            } else {
              alert('Payment verification failed. Please contact support.');
              setPayLoading(false);
            }
          } catch (err) {
            console.error('Payment verification error:', err);
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
        rzp.on('payment.failed', () => {
          setPayLoading(false);
          alert('Payment failed or was cancelled.');
        });
      }
      rzp.open();
    } catch (err) {
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
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base leading-tight">Unlock Premium Resume</h2>
                <p className="text-white/50 text-xs leading-tight">Instant download</p>
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
                      onClick={() => setUseCredits(v => !v)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${useCredits ? 'bg-orange-500' : 'bg-gray-300'}`}
                      style={{
                        boxShadow: useCredits ? 'inset 0 2px 4px rgba(0,0,0,0.15)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',
                      }}
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
                          background: `linear-gradient(to right, #F97316 0%, #F97316 ${(creditsToApply / maxApplicable) * 100}%, #e5e7eb ${(creditsToApply / maxApplicable) * 100}%, #e5e7eb 100%)`,
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
                  {/* Divider */}
                  <div className="border-t border-gray-100 mb-3" />

                  {/* Row helper */}
                  {[
                    {
                      label: 'Base Price',
                      value: `₹${breakdown.basePrice.toFixed(2)}`,
                      sub: null,
                      highlight: false,
                      strike: false,
                    },
                    ...(breakdown.creditsApplied > 0
                      ? [{
                        label: `Credits Applied (${breakdown.creditsApplied} × ₹${CREDIT_VALUE})`,
                        value: `−₹${breakdown.creditDiscount.toFixed(2)}`,
                        sub: null,
                        highlight: true,
                        strike: false,
                      }]
                      : []),
                    {
                      label: 'Price after Credits',
                      value: `₹${breakdown.priceAfterCredits.toFixed(2)}`,
                      sub: null,
                      highlight: false,
                      strike: false,
                      bold: true,
                    },
                    {
                      label: 'CGST (9%)',
                      value: `₹${breakdown.cgst.toFixed(2)}`,
                      sub: null,
                      highlight: false,
                      strike: false,
                      muted: true,
                    },
                    {
                      label: 'SGST (9%)',
                      value: `₹${breakdown.sgst.toFixed(2)}`,
                      sub: null,
                      highlight: false,
                      strike: false,
                      muted: true,
                    },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5">
                      <span
                        className={`text-sm ${row.highlight
                          ? 'text-green-600 font-medium'
                          : row.muted
                            ? 'text-gray-400'
                            : row.bold
                              ? 'text-gray-700 font-semibold'
                              : 'text-gray-600'
                          }`}
                      >
                        {row.label}
                      </span>
                      <span
                        className={`text-sm font-semibold ${row.highlight ? 'text-green-600' : row.muted ? 'text-gray-400' : 'text-gray-800'
                          }`}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}

                  {/* Total Row */}
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
                background: payLoading
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #F97316 0%, #ea580c 100%)',
                boxShadow: payLoading ? 'none' : '0 8px 24px rgba(249,115,22,0.35)',
              }}
            >
              {payLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Initiating Payment...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay ₹{breakdown.finalPrice} & Unlock
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Secured by Razorpay · GST inclusive pricing
            </p>
          </div>
        </div>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #F97316;
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.2);
          border: 2px solid white;
        }
        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #F97316;
          cursor: pointer;
          border: 2px solid white;
        }
      `}</style>
    </>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  templateId,
  editorPaginatePreview,
  autoGeneratePreview = false,
  autoShowPdfPreview = false,
  onPreviewComplete,
  onSaveAndExit,
  onSaveAndDownloadComplete,
  userId,
  token,
  resumeTemplateId,
  username,
  experienceSummary = '',
  jobRole = '',
  primaryColor = '#111827',
  fontFamily = 'Times New Roman, serif',
}) => {
  const [resumeUnlocked, setResumeUnlocked] = React.useState(false);
  const [showPaymentBreakdown, setShowPaymentBreakdown] = React.useState(false);
  const pendingSaveAfterPaymentRef = useRef(false);

  const generateDefaultResumeName = (): string => {
    const fn = (resumeData?.personal?.firstName || '').trim().replace(/\s+/g, '').replace(/[^a-zA-Z0-9-_]/g, '');
    const ln = (resumeData?.personal?.lastName || '').trim().replace(/\s+/g, '').replace(/[^a-zA-Z0-9-_]/g, '');
    const jobPart = (jobRole || apiJobRole || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');
    const parts = [fn, ln, jobPart].filter(Boolean);
    return parts.join('_').replace(/_+/g, '_') || '';
  };

  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [resumeName, setResumeName] = useState<string>('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (showNameDialog && !resumeName) {
      setResumeName(generateDefaultResumeName());
    }
  }, [showNameDialog]);

  const [apiExperienceSummary, setApiExperienceSummary] = useState<string>('');
  const [apiJobRole, setApiJobRole] = useState<string>('');

  useEffect(() => {
    const fetchExp = async () => {
      if (!userId || !token) return;
      try {
        const data = await getExperienceSummary(userId, token);
        if (data) {
          if (data.experience_summary) setApiExperienceSummary(String(data.experience_summary));
          if (data.job_role) setApiJobRole(String(data.job_role));
        }
      } catch (err) { }
    };
    if (isOpen) fetchExp();
  }, [isOpen, userId, token]);

  const previewContentRef = useRef<HTMLDivElement>(null);
  const [modalPaginatePageCount, setModalPaginatePageCount] = useState<number | null>(null);
  const [modalPaginateCurrentPage, setModalPaginateCurrentPage] = useState<number>(1);
  const modalPaginatedRef = useRef<{ goTo: (i: number) => void; next: () => void; prev: () => void } | null>(null);
  const pdfPagesRef = useRef<HTMLDivElement>(null);
  const resumeDataRef = useRef(resumeData);
  useEffect(() => { resumeDataRef.current = resumeData; }, [resumeData]);
  const cachedBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cachedBlobRef.current = null;
      setPdfBlob(null);
      setPdfUrl(null);
    }
  }, [isOpen]);

  const template = templateId ? getTemplateById(templateId) : null;
  const DisplayComponent = template?.displayComponent || template?.component;
  const PDFComponent = template?.pdfComponent;

  const { totalPages } = usePageMarkers(previewContentRef, [resumeData]);

  // Check if template is locked (premium)
  const isTemplateLocked = (() => {
    const match = templateId && templateId.match(/^template(\d+)$/);
    const num = match ? parseInt(match[1], 10) : null;
    return num && num >= 12 && num <= 20;
  })();

  const uploadPdfToCloudinary = async (blob: Blob): Promise<string | null> => {
    try {
      const finalName = resumeName.trim() || generateDefaultResumeName() || 'resume';
      const file = new File([blob], `${finalName}.pdf`, { type: 'application/pdf' });
      const result = await uploadToCloudinary(file);
      return result?.url || null;
    } catch (error) {
      console.error('Cloudinary PDF upload error:', error);
      return null;
    }
  };

  const isMobilePreviewDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
  };

  const isSamsungPreviewBrowser = () => {
    if (typeof window === 'undefined') return false;
    return /SamsungBrowser/i.test(window.navigator.userAgent);
  };

  const getPreviewCanvasScale = () => (isMobilePreviewDevice() ? 1 : 2);

  const generatePdfFromPrintablePages = async (printable: NodeListOf<Element>) => {
    const pdfDoc = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdfDoc.internal.pageSize.getWidth();
    const pdfHeight = pdfDoc.internal.pageSize.getHeight();
    const canvasScale = getPreviewCanvasScale();

    for (let i = 0; i < printable.length; i++) {
      const canvas = await html2canvas(printable[i] as HTMLElement, {
        scale: canvasScale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      if (i > 0) pdfDoc.addPage();
      pdfDoc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    return pdfDoc.output('blob') as Blob;
  };

  const generatePdfFromReactPdf = async (dataForPdf: ResumeData) => {
    if (!PDFComponent) return null;
    const preparedData = await embedProfilePhoto(dataForPdf);
    const doc = <PDFComponent data={preparedData} primaryColor={primaryColor} fontFamily={fontFamily} />;
    const asPdf = pdf(doc);
    return await asPdf.toBlob();
  };

  const handleSetPdfUrl = async (blob: Blob) => {
    const localUrl = URL.createObjectURL(blob);
    setPdfUrl(localUrl);

    if (isSamsungPreviewBrowser()) return;

    if (isMobilePreviewDevice()) {
      const cUrl = await uploadPdfToCloudinary(blob);
      if (cUrl) {
        setPdfUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(cUrl)}&embedded=true`);
        return;
      }
    }
  };

  useEffect(() => {
    if (!isOpen || !autoGeneratePreview || !PDFComponent) return;

    const generatePreview = async () => {
      setIsDownloading(true);
      try {
        const waitForPages = async () => {
          for (let i = 0; i < 20; i++) {
            const container = pdfPagesRef.current;
            const printableNow = container ? container.querySelectorAll('.pdf-print-page') : document.querySelectorAll('.pdf-print-page');
            if (printableNow && printableNow.length > 0 && (modalPaginatePageCount === null || printableNow.length === modalPaginatePageCount)) {
              return printableNow;
            }
            await new Promise((r) => setTimeout(r, 100));
          }
          const container = pdfPagesRef.current;
          return container ? container.querySelectorAll('.pdf-print-page') : document.querySelectorAll('.pdf-print-page');
        };

        let generatedBlob: Blob | null = null;
        const printable = await waitForPages();

        if (printable && printable.length > 0) {
          try {
            generatedBlob = await generatePdfFromPrintablePages(printable);
          } catch (canvasError) {
            console.error('Canvas preview generation failed, falling back to PDF renderer:', canvasError);
            generatedBlob = await generatePdfFromReactPdf(resumeDataRef.current);
          }
        }
        if (!generatedBlob) generatedBlob = await generatePdfFromReactPdf(resumeDataRef.current);

        if (generatedBlob) {
          cachedBlobRef.current = generatedBlob;
          setPdfBlob(generatedBlob);
          await handleSetPdfUrl(generatedBlob);
          if (autoShowPdfPreview) {
            setShowDownloadDialog(true);
            onPreviewComplete?.();
          }
        }
      } catch (err) {
        console.error('PDF generation error:', err);
        onPreviewComplete?.();
      } finally {
        setIsDownloading(false);
      }
    };

    if (cachedBlobRef.current) {
      setPdfBlob(cachedBlobRef.current);
      void handleSetPdfUrl(cachedBlobRef.current);
      if (autoShowPdfPreview) {
        setShowDownloadDialog(true);
        onPreviewComplete?.();
      }
      return;
    }

    generatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoGeneratePreview, autoShowPdfPreview, PDFComponent]);

  if (!isOpen) return null;



  const getAuthForSave = () => {
    let resolvedUserId = userId;
    let resolvedToken = token;

    if ((!resolvedUserId || !resolvedToken) && typeof window !== 'undefined') {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        resolvedUserId = resolvedUserId || userData.user_id || userData.id || userData.userId || '';
        resolvedToken = resolvedToken || userData.token || localStorage.getItem('token') || '';
      } catch {
        resolvedToken = resolvedToken || localStorage.getItem('token') || '';
      }
    }

    if (!resolvedUserId || !resolvedToken) {
      throw new Error('Missing login details. Please log in again before saving your resume.');
    }

    return { resolvedUserId, resolvedToken };
  };

  const saveResumeTemplate = async (templateFileUrl: string) => {
    const { resolvedUserId, resolvedToken } = getAuthForSave();
    try {
      const templatePayload = {
        template_name: resumeName.trim(),
        template_id: templateId,
        template_file_url: templateFileUrl,
        thumbnail_url: 'IMAGE_URL_FOR_RESUME_THUMBNAIL',
      };
      const payload = { templates: [templatePayload] };
      const endpoint = resumeTemplateId
        ? `/users/${resolvedUserId}/resume-templates/${resumeTemplateId}`
        : `/users/${resolvedUserId}/resume-templates`;
      const method = resumeTemplateId ? 'put' : 'post';
      const response = await api[method](endpoint, payload, {
        headers: { Authorization: `Bearer ${resolvedToken}` },
      });
      return response.data ?? true;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  const openSaveAndDownloadDialog = () => {
    setShowDownloadDialog(false);
    if (pdfUrl && !pdfUrl.includes('docs.google.com')) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPdfBlob(null);
    setResumeName(generateDefaultResumeName());
    setShowNameDialog(true);
  };

  const embedProfilePhoto = async (d: ResumeData): Promise<ResumeData> => {
    const clone: ResumeData = JSON.parse(JSON.stringify(d));
    const url = clone?.personal?.profilePhotoUrl;
    if (!url) return clone;
    if (String(url).startsWith('data:')) return clone;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch image');
      const blob = await res.blob();
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onerror = () => reject(new Error('Failed to read image blob'));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
      });
      clone.personal.profilePhotoUrl = dataUrl;
      return clone;
    } catch {
      try {
        const initials = ((clone.personal?.firstName || '')[0] || '') + ((clone.personal?.lastName || '')[0] || '');
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='#f0f0f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='72' fill='#004b87' font-family='Helvetica, Arial, sans-serif' font-weight='bold'>${initials}</text></svg>`;
        const dataUrl = 'data:image/svg+xml;base64,' + btoa(svg);
        clone.personal.profilePhotoUrl = dataUrl;
      } catch { }
      return clone;
    }
  };

  const generatePdfBlob = async (): Promise<Blob | null> => {
    const waitForPages = async () => {
      for (let i = 0; i < 20; i++) {
        const container = pdfPagesRef.current;
        const printableNow = container ? container.querySelectorAll('.pdf-print-page') : document.querySelectorAll('.pdf-print-page');
        if (printableNow && printableNow.length > 0 && (modalPaginatePageCount === null || printableNow.length === modalPaginatePageCount)) {
          return printableNow;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      const container = pdfPagesRef.current;
      return container ? container.querySelectorAll('.pdf-print-page') : document.querySelectorAll('.pdf-print-page');
    };

    const printable = await waitForPages();
    if (printable && printable.length > 0) {
      try {
        return await generatePdfFromPrintablePages(printable);
      } catch (canvasError) {
        console.error('Canvas preview generation failed, falling back to PDF renderer:', canvasError);
      }
    }
    return await generatePdfFromReactPdf(resumeData);
  };

  const downloadPdfBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleSaveAndDownloadPdf = async (paymentAlreadyCompleted = false) => {
    const finalName = resumeName.trim();
    if (!finalName) return;

    if (isTemplateLocked && !resumeUnlocked && !paymentAlreadyCompleted) {
      pendingSaveAfterPaymentRef.current = true;
      setShowPaymentBreakdown(true);
      return;
    }

    setIsDownloadingPdf(true);
    try {
      const finalBlob = pdfBlob ?? cachedBlobRef.current ?? await generatePdfBlob();
      if (!finalBlob) {
        alert('Failed to generate PDF.');
        return;
      }

      await onSaveAndExit?.();

      const cloudinaryUrl = await uploadPdfToCloudinary(finalBlob);
      if (!cloudinaryUrl) {
        alert('Failed to upload PDF to Cloudinary');
        return;
      }

      const savedTemplate = await saveResumeTemplate(cloudinaryUrl);
      if (!savedTemplate) {
        alert('Failed to save resume before download.');
        return;
      }

      downloadPdfBlob(finalBlob, finalName);
      setShowNameDialog(false);
      setShowDownloadDialog(false);
      onSaveAndDownloadComplete?.();
      if (!onSaveAndDownloadComplete) {
        onClose();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to save and download PDF. See console for details.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <>
      {/* Payment Breakdown Modal */}
      <PaymentBreakdownModal
        isOpen={showPaymentBreakdown}
        onClose={() => {
          pendingSaveAfterPaymentRef.current = false;
          setShowPaymentBreakdown(false);
        }}
        onPaymentSuccess={() => {
          setResumeUnlocked(true);
          if (pendingSaveAfterPaymentRef.current) {
            pendingSaveAfterPaymentRef.current = false;
            setTimeout(() => {
              void handleSaveAndDownloadPdf(true);
            }, 0);
          }
        }}
        templateId={templateId}
        userId={userId}
        token={token}
        resumeName={resumeName || generateDefaultResumeName()}
      />

      {/* Modal Container */}
      {!autoShowPdfPreview && (
        <div className="fixed right-0 top-0 bottom-0 z-50 flex items-center">
          {/* Resume Preview */}
          <div
            className="h-[calc(100vh-160px)] overflow-auto scrollbar-hide"
            style={{ width: "calc(100vw - 320px)", maxWidth: "1100px" }}
          >
            <div className="p-8 flex justify-center">
              <div className="flex flex-col items-center">
                <div
                  className="shadow-lg w-full relative resume-preview-wrapper"
                  style={{ transform: "scale(1)", transformOrigin: "center", maxWidth: "100%" }}
                >
                  <div ref={previewContentRef} className="resume-preview-content relative">
                    {DisplayComponent && (
                      <div style={{ position: 'relative' }}>
                        {modalPaginatePageCount ? (
                          <div style={{ position: 'absolute', right: 12, top: 8, zIndex: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '6px 10px', borderRadius: 12, boxShadow: '0 6px 18px rgba(15,23,42,0.12)' }}>
                              <button onClick={() => modalPaginatedRef.current?.prev()} disabled={modalPaginateCurrentPage <= 1} style={{ padding: '6px 8px', borderRadius: 8 }}>&lsaquo;</button>
                              <span style={{ fontSize: 13 }}>{modalPaginateCurrentPage}/{modalPaginatePageCount} Pages</span>
                              <button onClick={() => modalPaginatedRef.current?.next()} disabled={modalPaginateCurrentPage >= (modalPaginatePageCount || 1)} style={{ padding: '6px 8px', borderRadius: 8 }}>&rsaquo;</button>
                            </div>
                          </div>
                        ) : null}

                        {editorPaginatePreview === false ? (
                          <DisplayComponent data={resumeData} supportsPhoto={template?.supportsPhoto ?? false} />
                        ) : (
                          <DisplayComponent
                            data={resumeData}
                            supportsPhoto={template?.supportsPhoto ?? false}
                            showPageBreaks={true}
                            onPageCountChange={(n: number) => setModalPaginatePageCount(n)}
                            onPageChange={(i: number) => setModalPaginateCurrentPage(i)}
                            pageControllerRef={modalPaginatedRef}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="print-version hidden">
                  {DisplayComponent && <DisplayComponent data={resumeData} supportsPhoto={template?.supportsPhoto ?? false} />}
                </div>

                <div style={{ position: 'absolute', left: '-9999px', top: 0 }} ref={pdfPagesRef} aria-hidden>
                  {DisplayComponent && (
                    <DisplayComponent
                      data={resumeData}
                      supportsPhoto={template?.supportsPhoto ?? false}
                      showPageBreaks={true}
                      onPageCountChange={(n: number) => setModalPaginatePageCount(n)}
                      onPageChange={(i: number) => setModalPaginateCurrentPage(i)}
                      pageControllerRef={modalPaginatedRef}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 ml-0 transform -translate-x-30">
            <button
              onClick={onClose}
              className="flex items-center bg-white text-left py-3 px-4 rounded-full border-0 hover:bg-gray-50 transition-colors shadow-md cursor-pointer"
            >
              <X className="w-5 h-5 mr-2" />
              <span className="text-black text-sm font-medium whitespace-nowrap">Back to Edit</span>
            </button>

            <button
              onClick={openSaveAndDownloadDialog}
              className="flex items-center bg-orange-500 text-left py-3 px-4 rounded-full border-0 hover:bg-orange-600 transition-colors shadow-md cursor-pointer"
            >
              <Download className="w-5 h-5 mr-2 text-white" />
              <span className="text-white text-sm font-medium whitespace-nowrap">Save & Download PDF</span>
            </button>

            {PDFComponent && (
              <button
                onClick={async () => {
                  setIsDownloading(true);
                  try {
                    const generatedBlob = await generatePdfBlob();
                    if (generatedBlob) {
                      setPdfBlob(generatedBlob);
                      await handleSetPdfUrl(generatedBlob);
                      setShowDownloadDialog(true);
                    }
                  } catch (_err) {
                    console.error('PDF generation error:', _err);
                    alert('Failed to generate PDF. See console for details.');
                  } finally {
                    setIsDownloading(false);
                  }
                }}
                disabled={isDownloading}
                className="flex items-center bg-blue-500 text-left py-3 px-4 rounded-full border-0 hover:bg-blue-600 transition-colors shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span className="text-white text-sm font-medium whitespace-nowrap">Processing...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2 text-white" />
                    <span className="text-white text-sm font-medium whitespace-nowrap">Preview</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resume Name Dialog */}
      {showNameDialog && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[60]" onClick={() => setShowNameDialog(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-md p-8 relative flex flex-col gap-6">
              <button
                onClick={() => setShowNameDialog(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <h3 className="text-2xl font-semibold text-gray-900 text-center">Resume Name</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter resume name</label>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && resumeName.trim()) {
                      void handleSaveAndDownloadPdf();
                    }
                  }}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="e.g., Software Engineer Resume"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNameDialog(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isDownloadingPdf}
                >
                  Cancel
                </button>
                <button
                  data-download-trigger
                  onClick={() => void handleSaveAndDownloadPdf()}
                  disabled={!resumeName.trim() || isDownloadingPdf}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isDownloadingPdf ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving & downloading...
                    </>
                  ) : (
                    'Save & Download PDF'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Download / Preview Dialog */}
      {showDownloadDialog && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[60]" onClick={() => setShowDownloadDialog(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-[95%] h-[95vh] max-w-7xl p-8 relative flex flex-col">
              {!pdfUrl ? (
                <div className="overflow-y-auto flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mt-2 mb-6 text-center">Your Resume</h3>
                  <p className="text-sm text-gray-600 mb-4 text-center">Pages: <strong>{modalPaginatePageCount ?? totalPages}</strong></p>
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-gray-600 mb-4">Click below to generate PDF preview</p>
                  </div>
                  {PDFComponent && (
                    <button
                      onClick={async () => {
                        setIsDownloading(true);
                        try {
                          const generatedBlob = await generatePdfBlob();
                          if (generatedBlob) {
                            setPdfBlob(generatedBlob);
                            await handleSetPdfUrl(generatedBlob);
                          }
                        } catch (err) {
                          console.error('PDF generation error:', err);
                          alert('Failed to generate PDF.');
                        } finally {
                          setIsDownloading(false);
                        }
                      }}
                      disabled={isDownloading}
                      className="flex-1 min-w-[120px] px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {isDownloading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing</>) : (<><Eye className="w-4 h-4" /> Preview</>)}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Bowizzy Preview</h3>
                    {pdfUrl && isMobilePreviewDevice() && (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-full"
                      >
                        Open Preview
                      </a>
                    )}
                  </div>

                  <div className="flex-1 overflow-auto bg-gray-100 rounded-lg mb-4">
                    {/* Premium badge for locked templates */}
                    {isTemplateLocked && (
                      <div className="flex flex-col items-center justify-center py-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-md">
                          <Lock className="w-4 h-4 text-white" />
                          <span className="text-sm font-bold text-white tracking-wide">Premium Resume</span>
                        </div>
                      </div>
                    )}
                    <div className="relative w-full h-full">
                      <iframe
                        src={pdfUrl ? (pdfUrl.includes('docs.google.com') ? pdfUrl : `${pdfUrl}#toolbar=0`) : ''}
                        className="w-full h-full border-none"
                        title="Resume PDF Preview"
                      />
                      {/* Overlay to hide Google Docs Viewer "open in new tab" toolbar on mobile */}
                      {pdfUrl && pdfUrl.includes('docs.google.com') && (
                        <div
                          className="absolute top-0 right-0 pointer-events-none"
                          style={{ width: '60px', height: '50px', background: '#f3f4f6', zIndex: 10 }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Locked template: Pay to unlock section */}
                  {isTemplateLocked && !resumeUnlocked && (
                    <div
                      className="mb-4 p-4 rounded-2xl border flex items-center gap-4"
                      style={{
                        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                        borderColor: 'rgba(249,115,22,0.3)',
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">This is a premium resume template</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Pay <span className="font-bold text-orange-600">₹{RESUME_AMOUNT}</span> to unlock & download
                          <span className="text-gray-400"> · Credits & GST applicable</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Unlocked success banner */}
                  {isTemplateLocked && resumeUnlocked && (
                    <div className="mb-4 p-3 rounded-2xl bg-green-50 border border-green-200 flex items-center gap-2">
                      <span className="text-green-600 text-lg">✓</span>
                      <p className="text-sm font-semibold text-green-700">Resume unlocked! You can now download it.</p>
                    </div>
                  )}

                  {/* Footer Buttons */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          onClose();
                          setShowDownloadDialog(false);
                          if (pdfUrl && !pdfUrl.includes('docs.google.com')) URL.revokeObjectURL(pdfUrl);
                          setPdfUrl(null);
                          setPdfBlob(null);
                        }}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Back to Edit
                      </button>
                    </div>
                    <button
                      onClick={openSaveAndDownloadDialog}
                      className={`px-6 py-2.5 text-sm font-medium rounded-full flex items-center gap-2 transition-colors ${isTemplateLocked && !resumeUnlocked
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'text-white bg-orange-500 hover:bg-orange-600'
                        }`}
                    >
                      {isTemplateLocked && !resumeUnlocked ? (
                        <>
                          <Download className="w-4 h-4 text-white" />
                          Pay, Save & Download PDF
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-white" />
                          Save & Download PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default ResumePreviewModal;
