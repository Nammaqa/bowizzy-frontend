import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/api";
import DeveloperTemplate from "@/portfolio/templates/developer";
import DesignerTemplate from "@/portfolio/templates/designer";
import { Loader2 } from "lucide-react";
import { getPortfolioSubdomain } from "@/lib/portfolioDomain";
import {
  EMPTY_DATA,
  mapToPreviewData,
  type PortfolioRecord,
} from "./PublicPortfolioPreview";

// Loads a portfolio by its custom domain instead of its numeric ID.
// Renders when a visitor hits <subdomain>.bowizzy.com directly, or via the
// /portfolio-preview/domain/:domain route for local testing.
export default function DomainPortfolioPreview() {
  const { domain: domainParam } = useParams<{ domain?: string }>();
  const domain = (domainParam || getPortfolioSubdomain() || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioType, setPortfolioType] = useState("developer");
  const [data, setData] = useState(EMPTY_DATA);

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!domain) {
        setError("Invalid portfolio domain.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const resp = await api.get(`/public-portfolio/domain/${domain}`);
        const body = resp.data;
        const direct = body?.portfolio || body?.data || body;
        let found: PortfolioRecord | null = null;

        if (direct && !Array.isArray(direct) && (direct.portfolio_id || direct.portfolio_json || direct.config)) {
          found = direct;
        } else {
          const list = body?.portfolios ?? (Array.isArray(body) ? body : []);
          if (Array.isArray(list)) {
            found = list.find((p: any) => String(p?.domain).toLowerCase() === domain) || null;
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
  }, [domain]);

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
