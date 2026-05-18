import React from "react";
import DeveloperTemplate from "@/portfolio/templates/developer";
import type { PortfolioData } from "@/portfolio/templates/developer";
import DesignerTemplate from "@/portfolio/templates/designer";

interface PortfolioPreviewProps {
  portfolioId: string;
  portfolioType: string;
  customUrl: string;
  data: PortfolioData;
}

export default function PortfolioPreviewComponent({
  portfolioId,
  portfolioType,
  customUrl,
  data,
}: PortfolioPreviewProps) {
  return (
    <div className="flex flex-col h-full space-y-4">

      {/* Dynamic Live Preview Render as Mock Browser */}
      <div className="flex-1 min-h-0 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-2xl flex flex-col">
        {/* Browser Header / Address Bar */}


        {/* Scrollable Mock Browser Viewport */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {portfolioType === "developer" ? (
            <DeveloperTemplate data={data} />
          ) : (
            <DesignerTemplate data={data} />
          )}
        </div>
      </div>
    </div>
  );
}
