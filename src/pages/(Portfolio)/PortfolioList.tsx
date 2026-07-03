import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashNav from "@/components/dashnav/dashnav";
import {
  Plus,
  Globe,
  ExternalLink,
  Eye,
  Edit3,
  Trash2,
  Loader2,
  LayoutTemplate,
  Clock,
  X,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import api from "@/api";

interface Portfolio {
  portfolio_id: number | string;
  portfolio_name: string;
  description: string;
  portfolio_type: string;
  created_at: string;
  status: string;
  domain?: string;
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center mb-5">
        <LayoutTemplate className="w-9 h-9 text-violet-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">No portfolios yet</h2>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-7">
        Create your first portfolio to showcase your work with a professional
        public page recruiters will love.
      </p>
      <button
        id="portfolio-empty-create-btn"
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm hover:from-violet-700 hover:to-violet-600 transition shadow-md shadow-violet-200 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Create My Portfolio
      </button>
    </div>
  );
}

function PortfolioCard({ 
  portfolio, 
  onDelete, 
  onClick,
  onManage,
  onPreview
}: { 
  portfolio: Portfolio; 
  onDelete: (id: number | string) => void; 
  onClick: () => void;
  onManage: (p: Portfolio) => void;
  onPreview: (p: Portfolio) => void;
}) {
  const displayType = portfolio.portfolio_type ? portfolio.portfolio_type.charAt(0).toUpperCase() + portfolio.portfolio_type.slice(1) : "";

  return (
    <div
      onClick={onClick}
      className="h-full min-h-[205px] bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group relative cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 leading-snug">{portfolio.portfolio_name}</h3>
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 bg-violet-50 text-violet-600 uppercase tracking-wider">
              {displayType}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(portfolio.portfolio_id);
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer shrink-0 relative z-10"
          title="Delete Portfolio"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <p className="min-h-[54px] text-xs text-gray-500 leading-relaxed line-clamp-3 mt-1">
        {portfolio.description || ""}
      </p>

      {/* Buttons: Manage & Preview */}
      <div className="mt-auto pt-4 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onManage(portfolio); }}
          className="flex-1 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200 transition"
        >
          Manage
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(portfolio); }}
          className="flex-1 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold border border-violet-100 transition flex items-center justify-center gap-1.5 relative"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Preview
          {!portfolio.domain && (
            <div className="absolute -top-1.5 -right-1.5" title="Custom domain needs to be added for live preview">
              <AlertCircle className="w-4 h-4 text-orange-500 bg-white rounded-full border border-white" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default function PortfolioList() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Subdomain modal state
  const [managePortfolio, setManagePortfolio] = useState<Portfolio | null>(null);
  const [subdomain, setSubdomain] = useState("");
  const [savingDomain, setSavingDomain] = useState(false);
  const [domainError, setDomainError] = useState("");

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "null");
        if (!userData || !userData.token) {
          setLoading(false);
          return;
        }
        const resp = await api.get("/portfolio", {
          headers: { Authorization: `Bearer ${userData.token}` },
        });
        console.log("portfolio list response:", resp.data);
        const data = resp.data?.portfolios ?? (Array.isArray(resp.data) ? resp.data : []);
        setPortfolios(data);
      } catch (err) {
        console.error("Failed to fetch portfolios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, []);

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this portfolio?")) return;
    const userData = JSON.parse(localStorage.getItem("user") || "null");

    if (!userData || !userData.token) {
      alert("User not authenticated.");
      return;
    }

    try {
      setDeleting(String(id));
      await api.delete(`/portfolio/${id}`, {
        headers: { Authorization: `Bearer ${userData.token}` },
      });

      setPortfolios((prev) => prev.filter((p) => String(p.portfolio_id) !== String(id)));
    } catch (err: any) {
      console.error("Failed to delete portfolio:", err);
      alert(err.response?.data?.message || "Failed to delete portfolio. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleManage = (p: Portfolio) => {
    setManagePortfolio(p);
    setSubdomain(p.domain || "");
    setDomainError("");
  };

  const handlePreview = (p: Portfolio) => {
    if (p.domain) {
      window.open(`https://${p.domain}.bowizzy.com`, "_blank");
    } else {
      window.open(`/portfolio-preview/${p.portfolio_id}`, "_blank");
    }
  };

  const handleSaveDomain = async () => {
    if (!managePortfolio) return;
    const sub = subdomain.trim().toLowerCase();

    if (sub.length < 3 || sub.length > 63) {
      setDomainError("Subdomain must be between 3 and 63 characters.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(sub)) {
      setDomainError("Only lowercase letters, numbers, and hyphens are allowed.");
      return;
    }
    if (sub.startsWith("-") || sub.endsWith("-")) {
      setDomainError("Subdomain cannot start or end with a hyphen.");
      return;
    }
    if (sub.includes("--")) {
      setDomainError("Subdomain cannot contain consecutive hyphens.");
      return;
    }
    
    const reservedWords = [
      "admin", "administrator", "api", "app", "apps", "auth", "account", "accounts", 
      "billing", "blog", "beta", "bowizzy", 
      "cdn", "checkout", "community", "dashboard", "demo", "dev", "docs", "documentation", 
      "email", "ftp", "forum", "help", "host", "info", "images", "img", "imap", 
      "login", "local", "localhost", "mail", "media", "my", 
      "ns1", "ns2", "ns3", "ns4", "news",
      "owner", "pay", "payments", "pop", "portal", "prod", "production", "press", 
      "qa", "root", "register", "secure", "shop", "signup", "smtp", "ssh", "staging", 
      "static", "status", "store", "superuser", "support", "sysadmin",
      "test", "uat", "video", "videos", "web", "webmail", "www"
    ];
    if (reservedWords.includes(sub)) {
      setDomainError("This subdomain is reserved and cannot be used.");
      return;
    }

    try {
      setSavingDomain(true);
      const userData = JSON.parse(localStorage.getItem("user") || "null");
      
      // 1. Validate if domain already exists
      const validateResp = await api.post(
        "/portfolio/validate-domain",
        { domain: sub },
        { headers: { Authorization: `Bearer ${userData.token}` } }
      );

      if (validateResp.data && (validateResp.data.available === false || validateResp.data.valid === false)) {
        setDomainError("This subdomain is already taken or invalid.");
        setSavingDomain(false);
        return;
      }

      // 2. Save domain (preserve existing fields like portfolio_json)
      await api.put(
        `/portfolio/${managePortfolio.portfolio_id}`,
        { ...managePortfolio, domain: sub },
        { headers: { Authorization: `Bearer ${userData.token}` } }
      );
      
      setPortfolios(prev => 
        prev.map(p => String(p.portfolio_id) === String(managePortfolio.portfolio_id) ? { ...p, domain: sub } : p)
      );
      setManagePortfolio(null);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 409 || err.response?.data?.message?.includes('taken') || err.response?.data?.message?.includes('exists')) {
         setDomainError("This subdomain is already taken.");
      } else {
         setDomainError(err.response?.data?.message || "Failed to save subdomain. Please try again.");
      }
    } finally {
      setSavingDomain(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DashNav heading="My Portfolios" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/portfolio")}
          className="inline-flex items-center gap-2 mb-5 text-sm font-semibold text-gray-600 hover:text-violet-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio Page
        </button>

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Portfolios</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? "Loading…"
                : portfolios.length === 0
                ? "No portfolios yet"
                : `${portfolios.length} portfolio${portfolios.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {!loading && portfolios.length > 0 && (
            <button
              id="portfolio-create-new-btn"
              onClick={() => navigate("/portfolio/create")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm hover:from-violet-700 hover:to-violet-600 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Portfolio
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            <p className="text-sm text-gray-400">Loading your portfolios…</p>
          </div>
        ) : portfolios.length === 0 ? (
          <EmptyState onCreateClick={() => navigate("/portfolio/create")} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((p) => (
              <div key={p.portfolio_id} className={`h-full ${deleting === String(p.portfolio_id) ? "opacity-50 pointer-events-none" : ""}`}>
                <PortfolioCard
                  portfolio={p}
                  onDelete={handleDelete}
                  onClick={() => navigate(`/portfolio/editor/${p.portfolio_id}`)}
                  onManage={handleManage}
                  onPreview={handlePreview}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Subdomain Management Modal */}
      {managePortfolio && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setManagePortfolio(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Manage Domain</h2>
            <p className="text-sm text-gray-500 mb-5">
              Choose a custom subdomain for <strong>{managePortfolio.portfolio_name}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block uppercase tracking-wide">
                  Subdomain Name
                </label>
                <div className="flex items-stretch shadow-sm rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-violet-400/20 focus-within:border-violet-500 transition">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => {
                      setSubdomain(e.target.value);
                      setDomainError("");
                    }}
                    placeholder="my-portfolio"
                    min={3}
                    max={63}
                    className="flex-1 min-w-0 text-sm px-4 py-2.5 outline-none text-gray-800"
                  />
                  <div className="bg-gray-50 border-l border-gray-200 px-4 py-2.5 text-sm text-gray-500 font-medium flex items-center">
                    .bowizzy.com
                  </div>
                </div>
                {domainError && (
                  <p className="text-xs text-red-500 mt-2 font-medium">{domainError}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Allowed: lowercase letters, numbers, and hyphens (3-63 chars).
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setManagePortfolio(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDomain}
                  disabled={savingDomain}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Domain"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
