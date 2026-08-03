import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/api";
import DeveloperTemplate, { type PortfolioData } from "@/portfolio/templates/developer";
import DesignerTemplate from "@/portfolio/templates/designer";
import { Loader2 } from "lucide-react";

export type PortfolioRecord = {
  portfolio_id?: string | number;
  portfolio_name?: string;
  description?: string;
  portfolio_type?: string;
  portfolio_json?: any;
  config?: any;
  domain?: string;
};

export const EMPTY_DATA: PortfolioData = {
  portfolioName: "",
  portfolioDescription: "",
  aboutTitle: "",
  aboutDescription: "",
  githubUrl: "",
  linkedinUrl: "",
  twitterUrl: "",
  customUrl: "",
  avatarUrl: "",
  cvUrl: "",
  email: "",
  phone: "",
  projects: [],
  experiences: [],
  skills: [],
  certifications: [],
  languages: [],
  achievements: [],
};

export function parseMaybeJson(value: any) {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

export function getDefaultTheme(type?: string) {
  return type === "designer"
    ? { themeColor: "#d84f2a", backgroundColor: "#f6f2ea" }
    : { themeColor: "#4f46e5", backgroundColor: "#0a0f1e" };
}

export function mapToPreviewData(found: PortfolioRecord): PortfolioData {
  const cfg = parseMaybeJson(found.portfolio_json) || parseMaybeJson(found.config) || {};
  const defaultTheme = getDefaultTheme(cfg.portfolio_type || found.portfolio_type);
  return {
    portfolioName: cfg.name || found.portfolio_name || "",
    portfolioDescription: cfg.description || found.description || "",
    aboutTitle: cfg.aboutTitle || "",
    aboutDescription: cfg.aboutDescription || "",
    githubUrl: cfg.github || "",
    linkedinUrl: cfg.linkedin || "",
    twitterUrl: cfg.twitter || "",
    customUrl: cfg.customUrl || "",
    avatarUrl: cfg.profileImageUrl || "",
    cvUrl: cfg.cvUrl || "",
    email: cfg.email || "",
    phone: cfg.phone || "",
    themeColor: cfg.themeColor || defaultTheme.themeColor,
    backgroundColor: cfg.backgroundColor || defaultTheme.backgroundColor,
    behanceUrl: cfg.behanceUrl || "",
    dribbbleUrl: cfg.dribbbleUrl || "",
    designProcess: Array.isArray(cfg.designProcess) ? cfg.designProcess : [],
    caseStudies: Array.isArray(cfg.caseStudies) ? cfg.caseStudies : [],
    projects: Array.isArray(cfg.projects) ? cfg.projects : [],
    experiences: Array.isArray(cfg.experiences) ? cfg.experiences : [],
    skills: Array.isArray(cfg.skills) ? cfg.skills : [],
    certifications: Array.isArray(cfg.certifications) ? cfg.certifications : [],
    languages: Array.isArray(cfg.languages) ? cfg.languages : [],
    achievements: Array.isArray(cfg.achievements) ? cfg.achievements : [],
  };
}

export default function PublicPortfolioPreview() {
  const { porfolioid, portfolioid } = useParams<{ porfolioid?: string; portfolioid?: string }>();
  const id = porfolioid || portfolioid || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioType, setPortfolioType] = useState("developer");
  const [data, setData] = useState<PortfolioData>(EMPTY_DATA);

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!id) {
        setError("Invalid portfolio ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const resp = await api.get(`/public-portfolio/${id}`);
        const body = resp.data;
        const direct = body?.portfolio || body?.data || body;
        let found: PortfolioRecord | null = null;

        if (direct && !Array.isArray(direct) && (direct.portfolio_id || direct.portfolio_json || direct.config)) {
          found = direct;
        } else {
          const list = body?.portfolios ?? (Array.isArray(body) ? body : []);
          if (Array.isArray(list)) {
            found = list.find((p: any) => String(p?.portfolio_id) === String(id)) || null;
          }
        }

        if (!found) {
          setError("Portfolio not found.");
          return;
        }

        setPortfolioType(found.portfolio_type || "developer");
        setData(mapToPreviewData(found));
      } catch {
        setError("Unable to load this portfolio preview.");
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [id]);

  const content = useMemo(() => {
    if (portfolioType === "designer") {
      return <DesignerTemplate data={data} />;
    }
    return <DeveloperTemplate data={data} />;
  }, [portfolioType, data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading portfolio preview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-4">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return <div className="min-h-screen bg-slate-950">{content}</div>;
}
