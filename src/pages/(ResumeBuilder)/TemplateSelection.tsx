import DashNav from "@/components/dashnav/dashnav";
import { useNavigate } from "react-router-dom";
import { getAllTemplates, getTemplateById } from "@/templates/templateRegistry";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Check, Heart, Eye, Info } from "lucide-react";
import * as subscriptionService from "@/services/subscriptionService";
import { Lock, Crown } from "lucide-react";
import Credits from "@/pages/Credits";
import { getSubscriptionByUserId } from "@/services/subscriptionService";

// Import preview images for templates 12-20
import template11Img from "@/templates/preview/imgs/template11.jpg";
import template12Img from "@/templates/preview/imgs/template12.png";
import template13Img from "@/templates/preview/imgs/template13.png";
import template14Img from "@/templates/preview/imgs/template14.png";
import template15Img from "@/templates/preview/imgs/template15.png";
import template16Img from "@/templates/preview/imgs/template16.png";
import template17Img from "@/templates/preview/imgs/template17.png";
import template18Img from "@/templates/preview/imgs/template18.png";
import template19Img from "@/templates/preview/imgs/template19.png";
import template20Img from "@/templates/preview/imgs/template20.png";



// Preview Images for templates 12-20
const PREVIEW_IMAGES: Record<number, string> = {
  11: template11Img,
  12: template12Img,
  13: template13Img,
  14: template14Img,
  15: template15Img,
  16: template16Img,
  17: template17Img,
  18: template18Img,
  19: template19Img,
  20: template20Img,
};

// Template metadata — name, sections included, and free/paid status.
// NOTE: mapping assumes template11..template20 correspond to the list order given
// (11 = Vijaynagara ... 20 = Maratha). Adjust the keys below if the actual
// template IDs differ from this assumption.
type TemplateSectionInfo = {
  name: string;
  sections: string[];
  free: boolean;
};

const TEMPLATE_INFO: Record<string, TemplateSectionInfo> = {
  template11: {
    name: "Vijaynagara",
    sections: ["Career Objective", "Experience", "Education", "Project"],
    free: true,
  },
  template12: {
    name: "Hoysala",
    sections: [
      "Career Objective",
      "Experience",
      "Projects",
      "Education",
      "Links",
      "Skills",
      "Certification",
    ],
    free: false,
  },
  template13: {
    name: "Chalukya",
    sections: [
      "About / Career Objective",
      "Experience",
      "Projects",
      "Education",
      "Skills",
      "Certification",
    ],
    free: false,
  },
  template14: {
    name: "Rashtrakuta",
    sections: ["Experience", "Project", "Education", "Skills", "Certification"],
    free: false,
  },
  template15: {
    name: "Kadamba",
    sections: [
      "Career Objective",
      "Education",
      "Skills",
      "Certification",
      "Experience",
      "Projects",
    ],
    free: false,
  },
  template16: {
    name: "Wodeyar",
    sections: [
      "Career Objective",
      "Experience",
      "Project",
      "Education",
      "Skills",
      "Language",
      "Certification",
    ],
    free: false,
  },
  template17: {
    name: "Ganga",
    sections: [
      "Career Objective",
      "Skill",
      "Experience",
      "Education",
      "Certification",
      "Project",
    ],
    free: false,
  },
  template18: {
    name: "Maurya",
    sections: ["Career Objective", "Experience", "Education", "Skills", "Certification"],
    free: false,
  },
  template19: {
    name: "Satvahna",
    sections: [
      "Career Objective",
      "Skills",
      "Experience",
      "Education",
      "Language",
      "Certification",
      "Project",
    ],
    free: false,
  },
  template20: {
    name: "Maratha",
    sections: ["Experience", "Education", "Certificate"],
    free: false,
  },
};

export default function TemplateSelection() {
  const navigate = useNavigate();
  const templates = getAllTemplates();
  const [loadingSub, setLoadingSub] = useState(true);
  const [planType, setPlanType] = useState<string>("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const location = useLocation();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [savingSelection, setSavingSelection] = useState(false);
  const [ignoredFromBackend, setIgnoredFromBackend] = useState<string[]>([]);
  const [preSelectedTemplates, setPreSelectedTemplates] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [hoveredInfoId, setHoveredInfoId] = useState<string | null>(null);

  const PAID_EXTRA_TEMPLATE_IDS = ["template9", "template10"];
  const EXTRA_PRICE = 100;
  const DEFAULT_TEMPLATES = [
    "template1", "template2", "template3", "template4", "template5",
    "template6", "template7", "template8", "template9", "template10",
    "template11", "template12", "template13", "template14", "template15",
    "template16", "template17", "template18", "template19", "template20",
  ];

  const handleTemplateSelect = (templateId: string, locked: boolean) => {
    if (selectionMode) {
      toggleSelect(templateId);
      return;
    }
    if (locked) return;
    setSelectedTemplate(templateId);
  };

  const handlePreview = (template: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const toggleSelect = (templateId: string) => {
    if (PAID_EXTRA_TEMPLATE_IDS.includes(templateId)) {
      const plan = (planType || "").toLowerCase();
      if (!(plan === "premium" || plan === "premium_plus" || plan === "premium-plus")) {
        alert("You need a Premium plan to add paid templates.");
        return;
      }
    }
    if (DEFAULT_TEMPLATES.includes(templateId)) {
      alert("Template 1, 2 and 3 are included by default and cannot be removed.");
      return;
    }

    setSelectedTemplates((prev) => {
      const exists = prev.includes(templateId);
      let next = exists ? prev.filter((t) => t !== templateId) : [...prev, templateId];

      const paidCount = next.filter((t) => PAID_EXTRA_TEMPLATE_IDS.includes(t)).length;
      if (paidCount > 2) {
        alert("You can only add up to 2 paid templates (₹100 each).");
        return prev;
      }

      return next;
    });
  };

  const handleSaveSelection = async (overrideNumericPayload?: number[]) => {
    try {
      setSavingSelection(true);
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Not logged in");
      const parsed = JSON.parse(userStr);
      const userId = parsed.user_id || parsed.id || parsed.userId;
      const token = parsed.token || localStorage.getItem("token");
      if (!userId || !token) throw new Error("Missing auth");

      const normalizedToSend = selectedTemplates
        .map((s) => {
          if (/^[0-9]+$/.test(s)) return `template${s}`;
          return s;
        })
        .filter((s) => !!getTemplateById(s));

      const finalTemplates = Array.from(new Set([...normalizedToSend, ...DEFAULT_TEMPLATES]));

      const numericPayload = overrideNumericPayload ?? finalTemplates
        .map((s) => {
          const m = String(s).match(/template(\d+)/);
          return m ? Number(m[1]) : null;
        })
        .filter((n): n is number => typeof n === "number" && !Number.isNaN(n));

      const hasSubscription = !!subscription;
      const hasPaidExtras = numericPayload.some((n) => [9, 10].includes(n));
      const plan = (planType || "").toLowerCase();

      if (!hasSubscription || (hasPaidExtras && !(plan === "premium" || plan === "premium_plus" || plan === "premium-plus"))) {
        alert("Please choose a plan to save these selected templates.");
        const q = new URLSearchParams();
        q.set("pendingTemplates", JSON.stringify(numericPayload));
        q.set("from", "template-selection");
        navigate(`/credits?${q.toString()}`);
        return;
      }

      const paramsNow = new URLSearchParams(location.search);
      const planFromUrl = paramsNow.get("plan");
      const planToSend = planType || (planFromUrl ? String(planFromUrl) : undefined);

      const updated = await subscriptionService.updateSubscriptionTemplates(
        userId, numericPayload, token, subscription?.id, planToSend
      );
      setSubscription(updated || null);

      let serverList: number[] | undefined = undefined;
      if (updated && Array.isArray(updated.selected_templates)) {
        serverList = updated.selected_templates.map(Number).filter((n) => !Number.isNaN(n));
      }

      const toUse = serverList ?? numericPayload;
      const normalizedFromServer = toUse.map((n) => `template${n}`).filter((s) => !!getTemplateById(s));
      setPreSelectedTemplates(normalizedFromServer);
      setSelectedTemplates(Array.from(new Set([...DEFAULT_TEMPLATES, ...normalizedFromServer])));
      alert("Templates saved successfully.");
      setSelectionMode(false);

      const paramsAfter = new URLSearchParams(location.search);
      const cameFromPlan = paramsAfter.get("plan");
      if (cameFromPlan) {
        const q = new URLSearchParams();
        q.set("plan", cameFromPlan);
        q.set("saved", "true");
        navigate(`/credits?${q.toString()}`);
        return;
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to save templates");
    } finally {
      setSavingSelection(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setPlanType("");
      setLoadingSub(false);
      return;
    }

    try {
      const parsed = JSON.parse(userStr);
      const userId = parsed.user_id || parsed.id || parsed.userId;
      const token = parsed.token || localStorage.getItem("token");
      if (!userId || !token) {
        setPlanType("");
        setLoadingSub(false);
        return;
      }

      (async () => {
        setLoadingSub(true);
        const sub = await getSubscriptionByUserId(userId, token);
        if (sub && sub.plan_type && sub.status === "active") {
          setPlanType(String(sub.plan_type).toLowerCase());
        } else if (sub && sub.plan_type) {
          setPlanType(String(sub.plan_type).toLowerCase());
        } else {
          setPlanType("");
        }

        if (sub) {
          setSubscription(sub);

          if (Array.isArray(sub.selected_templates)) {
            const raw: string[] = sub.selected_templates.map(String);
            const normalized: string[] = [];
            const ignored: string[] = [];

            for (const item of raw) {
              let candidate = item;
              if (/^[0-9]+$/.test(item)) {
                candidate = `template${item}`;
              }

              if (getTemplateById(candidate)) {
                if (!normalized.includes(candidate)) normalized.push(candidate);
              } else {
                ignored.push(item);
              }
            }

            const withDefaults = Array.from(new Set([...DEFAULT_TEMPLATES, ...normalized]));
            setSelectedTemplates(withDefaults);
            setPreSelectedTemplates(withDefaults);
            setIgnoredFromBackend(ignored);

            const params = new URLSearchParams(location.search);
            const pending = params.get("pendingTemplates");
            if (pending) {
              try {
                const parsedPending: number[] = JSON.parse(pending);
                if (Array.isArray(parsedPending) && parsedPending.length > 0) {
                  const merged = Array.from(
                    new Set([
                      ...(parsedPending || []),
                      ...DEFAULT_TEMPLATES.map((d) => Number(d.replace("template", ""))),
                    ])
                  );
                  await handleSaveSelection(merged);
                  const q = new URLSearchParams();
                  q.set("selectTemplates", "true");
                  if (planType) q.set("plan", String(planType));
                  navigate(`/template-selection?${q.toString()}`, { replace: true });
                }
              } catch (e) {
                // ignore parse errors
              }
            }
          } else {
            setSelectedTemplates([...DEFAULT_TEMPLATES]);
          }
        }

        setLoadingSub(false);
      })();
    } catch (err) {
      setPlanType("");
      setLoadingSub(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("selectTemplates") === "true") {
      setSelectionMode(true);
    }
  }, [location.search]);

  // Renders the price tag + info icon (with hover tooltip) shared by both
  // locked and unlocked cards.
  const renderInfoBadge = (templateId: string) => {
    const info = TEMPLATE_INFO[templateId];
    if (!info) return null;

    return (
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        {/* Price tag */}
        {info.free ? (
          <span
            className="relative flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold text-white shadow-lg animate-pulse"
            style={{
              background: "linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.6), 0 4px 10px rgba(16,185,129,0.5)",
            }}
          >
            <span className="text-[12px] leading-none">✨</span>
            FREE
          </span>
        ) : (
          <span
            className="relative flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, #fb923c 0%, #f97316 45%, #ea580c 100%)",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.6), 0 4px 10px rgba(249,115,22,0.55)",
            }}
          >
            <span className="text-[12px] leading-none">👑</span>
            PREMIUM
          </span>
        )}

        {/* Info icon + hover tooltip */}
        <div
          className="relative"
          onMouseEnter={(e) => {
            e.stopPropagation();
            setHoveredInfoId(templateId);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            setHoveredInfoId(null);
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/95 text-[#1A1A43] shadow hover:bg-orange-500 hover:text-white transition-colors"
            title="Template info"
          >
            <Info size={14} />
          </button>

          {hoveredInfoId === templateId && (
            <div
              className="absolute top-9 left-0 z-40 w-60 bg-white rounded-lg shadow-xl border border-gray-100 p-3 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#1A1A43]">{info.name}</span>
                <span
                  className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white shadow-sm"
                  style={{
                    background: info.free
                      ? "linear-gradient(135deg, #34d399 0%, #059669 100%)"
                      : "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
                  }}
                >
                  {info.free ? "✨ FREE" : "👑 PREMIUM"}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mb-1.5 font-medium">
                Sections included:
              </div>
              <ul className="space-y-1">
                {info.sections.map((sec) => (
                  <li key={sec} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <Check size={12} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>{sec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-['Baloo_2']">
      <DashNav heading="Resume Builder" />

      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="bg-white rounded-lg m-3 md:m-5 w-full max-w-[1210px] mx-auto">

          <div className="flex items-center justify-between px-4 md:px-5 pt-5 mb-5">
            <div className="flex flex-col gap-1">
              <span className="text-[#1A1A43] text-base font-semibold">
                Select a Template to continue
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[#7F7F7F] text-sm">
                  Choose a template that best fits your professional style
                </span>
              </div>
            </div>

            {selectionMode && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700">
                  Selected: <strong>{selectedTemplates.length}</strong>
                </div>
                <div className="text-sm text-gray-700">
                  Extras:{" "}
                  <strong>
                    {selectedTemplates.filter((t) => PAID_EXTRA_TEMPLATE_IDS.includes(t)).length}
                  </strong>{" "}
                  (₹
                  {selectedTemplates.filter((t) => PAID_EXTRA_TEMPLATE_IDS.includes(t)).length *
                    EXTRA_PRICE}
                  )
                </div>
                <button
                  onClick={() => handleSaveSelection()}
                  disabled={savingSelection}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-semibold"
                >
                  {savingSelection ? "Saving..." : `Save templates`}
                </button>
                <button
                  onClick={() => setSelectionMode(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            {selectionMode && !subscription && (
              <div className="mt-3 p-3 bg-yellow-50 text-sm rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Note:</strong> You don't have an active subscription yet. Save will only
                    work after subscribing.
                  </div>
                  <div>
                    <button
                      onClick={() => navigate("/credits")}
                      className="px-3 py-2 bg-orange-500 text-white rounded-md text-sm"
                    >
                      Choose Plan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {ignoredFromBackend.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 text-sm rounded-md text-red-700">
                <strong>Note:</strong> Some previously saved templates were not found and were
                ignored: {ignoredFromBackend.join(", ")}
              </div>
            )}
          </div>

          {templates.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-gray-600">No templates available</p>
              <p className="text-sm text-gray-400 mt-2">Please check back later</p>
            </div>
          )}

          <div className="px-4 md:px-5 mb-10">
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 p-4 overflow-auto"
              style={{ paddingBottom: 12 }}
            >
              {templates.map((template) => {
                const freeList = [...DEFAULT_TEMPLATES];
                const premiumList = [
                  ...DEFAULT_TEMPLATES,
                  "template4",
                  "template5",
                  "template6",
                ];
                let allowedTemplates: string[] = freeList;
                const plan = (planType || "").toLowerCase();

                if (plan === "premium_plus" || plan === "premium-plus") {
                  allowedTemplates = templates.map((t) => t.id);
                } else if (plan === "premium") {
                  allowedTemplates = premiumList;
                } else if (plan === "free") {
                  allowedTemplates = freeList;
                } else {
                  allowedTemplates = freeList;
                }

                const isPaidExtra = PAID_EXTRA_TEMPLATE_IDS.includes(template.id);
                const allowPaidAsPurchase = plan === "premium";
                const locked =
                  !allowedTemplates.includes(template.id) &&
                  !(isPaidExtra && allowPaidAsPurchase);

                // ── LOCKED CARD ──
                if (locked && !selectionMode) {
                  return (
                    <div
                      key={template.id}
                      className="relative w-full rounded-lg border-0 transition-all overflow-hidden group opacity-70"
                      style={{ boxShadow: "0px 0px 1px #00000040" }}
                    >
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-[250px] md:h-[320px] lg:h-[439px] object-contain"
                      />

                      {/* Lock overlay */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                        <div className="flex flex-col items-center text-white gap-4">
                          <Lock size={36} />
                          <div className="text-center">
                            <span className="block text-sm font-semibold">Premium Template</span>
                            <span className="block text-xs text-gray-200 mt-1">
                              Unlock with Premium plan
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setShowCreditsModal(true);
                            }}
                            className="px-5 py-2 bg-white text-[#1A1A43] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            Upgrade to use
                          </button>
                        </div>
                      </div>

                      {/* Info + price badge — sits above the lock overlay */}
                      {renderInfoBadge(template.id)}

                      {/* Crown — top right */}
                      <div className="absolute top-3 right-3 z-10">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500 text-white shadow-md">
                          <Crown size={16} />
                        </div>
                      </div>

                      {/* Premium tag — absolute bottom-left */}
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="flex items-center gap-1 bg-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow">
                          <Crown size={10} />
                          {template.label ? template.label : "Label"}
                        </span>
                      </div>
                    </div>
                  );
                }

                // ── UNLOCKED CARD ──
                const isSelected =
                  (selectionMode && selectedTemplates.includes(template.id)) ||
                  (!selectionMode && selectedTemplate === template.id);

                // Show premium tag for non-default / paid-extra templates
                const isPremiumTemplate = !DEFAULT_TEMPLATES.includes(template.id) || isPaidExtra;

                return (
                  <div
                    key={template.id}
                    className={`relative w-full rounded-lg transition-all overflow-hidden group hover:shadow-xl hover:scale-[1.02] cursor-pointer ${isSelected ? "border-2 border-orange-500" : "border-0"
                      }`}
                    style={{ boxShadow: "0px 0px 1px #00000040" }}
                    onClick={() => handleTemplateSelect(template.id, locked)}
                  >
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-[250px] md:h-[320px] lg:h-[439px] object-contain"
                    />

                    {/* Info + price badge — top-left */}
                    {renderInfoBadge(template.id)}

                    {/* Preview icon — top-center, appears on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
                      <button
                        onClick={(e) => handlePreview(template, e)}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-800 hover:bg-orange-500 hover:text-white transition-all shadow-lg"
                        title="Preview template"
                      >
                        <Eye size={24} />
                      </button>
                    </div>

                    {/* Selection checkbox — top-left, selection mode only */}
                    { //selectionMode && (
                      // <div className="absolute top-3 left-3 z-20">
                      //   {DEFAULT_TEMPLATES.includes(template.id) ? (
                      //     <div
                      //       className="w-9 h-9 rounded-full flex items-center justify-center border-2 bg-orange-500 border-orange-500 text-white"
                      //       title="Included in all plans"
                      //     >
                      //       <Check size={16} />
                      //     </div>
                      //   ) : (
                      //     !locked && (
                      //       preSelectedTemplates.includes(template.id) ? (
                      //         <div
                      //           className="w-9 h-9 rounded-full flex items-center justify-center border-2 bg-gray-200 border-gray-200 text-gray-700"
                      //           title="Saved"
                      //         >
                      //           <Check size={16} />
                      //         </div>
                      //       ) : (
                      //         <div
                      //           onClick={(e) => {
                      //             e.stopPropagation();
                      //             toggleSelect(template.id);
                      //           }}
                      //           className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                      //             selectedTemplates.includes(template.id)
                      //               ? "bg-orange-500 border-orange-500 text-white"
                      //               : "bg-white border-gray-200 text-gray-600"
                      //           }`}
                      //         >
                      //           {selectedTemplates.includes(template.id) ? (
                      //             <Check size={16} />
                      //           ) : (
                      //             <div className="w-2 h-2 rounded-full" />
                      //           )}
                      //         </div>
                      //       )
                      //     )
                      //   )}
                      // </div>
                      //)
                    }

                    {/* Paid extra price badge — top-right */}
                    {isPaidExtra && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="px-3 py-1 rounded-full bg-white text-sm font-semibold shadow">
                          ₹{EXTRA_PRICE}
                        </div>
                      </div>
                    )}

                    {/* ── BOTTOM-LEFT: Premium tag — absolute ── */}

                    <div className={`absolute bottom-3 ${isSelected ? "left-0" : "left-0"} z-10`}>
                      <span className="flex items-center gap-1 bg-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-r-md  shadow">
                        <Heart size={10} />
                        {template.label ? template.label : "Label"}
                      </span>
                    </div>


                    {/* ── BOTTOM-RIGHT: "Use This Template" button — absolute ── */}
                    {!selectionMode && (
                      <div className="absolute bottom-3 right-3 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/resume-editor?templateId=${template.id}`);
                          }}
                          className={`
                            px-4 py-2 rounded-lg font-semibold text-sm shadow-md transition-all duration-200
                            ${isSelected
                              ? "bg-orange-500 text-white hover:bg-orange-600"
                              : "bg-white text-[#1A1A43] border border-gray-200 hover:bg-orange-500 hover:text-white hover:border-orange-500"
                            }
                          `}
                        >
                          Use This Template
                        </button>
                      </div>
                    )}

                    {/* Selection mode — template name label */}
                    {selectionMode && (
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="text-[#1A1A43] text-sm font-medium">{template.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Credits Modal */}
          {showCreditsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setShowCreditsModal(false)}
              />
              <div className="relative z-10 p-4 w-full max-w-4xl">
                <Credits modal onClose={() => setShowCreditsModal(false)} />
              </div>
            </div>
          )}

          {/* Preview Modal */}
          {showPreviewModal && previewTemplate && (() => {
            const templateNum = parseInt(previewTemplate.id?.replace("template", "") || "0", 10);
            const pdfUrl = PREVIEW_IMAGES[templateNum];

            return (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/60"
                  onClick={() => setShowPreviewModal(false)}
                />
                <div className="relative z-[10001] p-4 w-full max-w-2xl">
                  <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {previewTemplate.label || previewTemplate.name}
                      </h2>
                      <button
                        onClick={() => setShowPreviewModal(false)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="max-h-[80vh] overflow-auto flex flex-col items-center justify-start bg-gray-50 pb-10">
                      {PREVIEW_IMAGES[templateNum] ? (
                        <img
                          src={PREVIEW_IMAGES[templateNum]}
                          alt={previewTemplate.name}
                          className="w-full h-auto object-contain"
                        />
                      ) : (
                        <iframe
                          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          title={`Preview ${previewTemplate.label || previewTemplate.name}`}
                          className="w-full border-0"
                          style={{ height: "80vh" }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}