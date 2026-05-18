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
} from "lucide-react";

import api from "@/api";

interface Portfolio {
  portfolio_id: number | string;
  portfolio_name: string;
  description: string;
  portfolio_type: string;
  created_at: string;
  status: string;
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

function PortfolioCard({ portfolio, onDelete, onClick }: { portfolio: Portfolio; onDelete: (id: number | string) => void; onClick: () => void }) {
  const displayType = portfolio.portfolio_type ? portfolio.portfolio_type.charAt(0).toUpperCase() + portfolio.portfolio_type.slice(1) : "";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group relative cursor-pointer"
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

      {portfolio.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mt-1">
          {portfolio.description}
        </p>
      )}
    </div>
  );
}

export default function PortfolioList() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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
    setDeleting(String(id));
    // TODO: call DELETE API
    setTimeout(() => {
      setPortfolios((prev) => prev.filter((p) => String(p.portfolio_id) !== String(id)));
      setDeleting(null);
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DashNav heading="My Portfolios" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">

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
              <div key={p.portfolio_id} className={deleting === String(p.portfolio_id) ? "opacity-50 pointer-events-none" : ""}>
                <PortfolioCard
                  portfolio={p}
                  onDelete={handleDelete}
                  onClick={() => navigate(`/portfolio/editor/${p.portfolio_id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
