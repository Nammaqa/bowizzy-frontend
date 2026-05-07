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

interface Portfolio {
  id: string;
  name: string;
  status: "live" | "draft";
  url?: string;
  created_at: string;
  views?: number;
  template?: string;
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

function PortfolioCard({ portfolio, onDelete }: { portfolio: Portfolio; onDelete: (id: string) => void }) {
  const isLive = portfolio.status === "live";
  const formattedDate = new Date(portfolio.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{portfolio.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            isLive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLive ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          {isLive ? "Live" : "Draft"}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">
            {portfolio.views ?? 0} views
          </span>
        </div>
        {portfolio.template && (
          <div className="flex items-center gap-1.5">
            <LayoutTemplate className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">{portfolio.template}</span>
          </div>
        )}
      </div>

      {/* URL */}
      {portfolio.url && (
        <a
          href={portfolio.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 truncate transition"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{portfolio.url}</span>
        </a>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-gray-50">
        {portfolio.url && (
          <a
            href={portfolio.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </a>
        )}
        <button
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => onDelete(portfolio.id)}
          className="flex items-center justify-center p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
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

  useEffect(() => {
    // TODO: Replace with actual API call
    // const userData = JSON.parse(localStorage.getItem("user") || "null");
    // fetch portfolios from API using userData.token
    const timer = setTimeout(() => {
      // Simulating empty state for now – swap with real API data
      setPortfolios([]);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this portfolio?")) return;
    setDeleting(id);
    // TODO: call DELETE API
    setTimeout(() => {
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
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
              <div key={p.id} className={deleting === p.id ? "opacity-50 pointer-events-none" : ""}>
                <PortfolioCard portfolio={p} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
