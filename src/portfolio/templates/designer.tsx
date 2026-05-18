import React from "react";
import { Twitter, Linkedin } from "lucide-react";
import type { PortfolioData } from "./developer";

export default function DesignerTemplate({ data }: { data: PortfolioData }) {
  return (
    <div className="bg-white text-gray-800 p-8 space-y-8 min-h-[480px] font-sans">
      <style>{`
        .rich-text-preview ul {
          list-style-type: disc !important;
          padding-left: 1rem !important;
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }
        .rich-text-preview ol {
          list-style-type: decimal !important;
          padding-left: 1rem !important;
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }
        .rich-text-preview a {
          color: #7c3aed !important;
          text-decoration: underline !important;
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-6 border-b border-gray-100">
        <div>
          <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Designer Portfolio
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
            {data.portfolioName || "Creative Mind"}
          </h1>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-sm">
            {data.portfolioDescription || "Passionate UI/UX designer blending aesthetics and user flows."}
          </p>
        </div>
        <div className="flex gap-2">
          {data.twitterUrl && (
            <a
              href={data.twitterUrl}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sky-500"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>
          )}
          {data.linkedinUrl && (
            <a
              href={data.linkedinUrl}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-blue-600"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Skill chips */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">My Toolkit</span>
        <div className="flex flex-wrap gap-1.5">
          {data.skills.length === 0 ? (
            <span className="text-xs text-gray-400">Toolkit empty.</span>
          ) : (
            data.skills.map((s, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-lg uppercase tracking-wider"
              >
                {s}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Projects grid */}
      <div className="space-y-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visual Gallery</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.projects.length === 0 ? (
            <div className="col-span-2 text-center py-6 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
              No showcase item built.
            </div>
          ) : (
            data.projects.map((p, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-violet-50/50 to-orange-50/30 border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition"
              >
                <h4 className="text-xs font-bold text-gray-900">{p.title || "Project Name"}</h4>
                <div className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2 rich-text-preview" dangerouslySetInnerHTML={{ __html: p.description || "Project summary description." }} />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-150/40">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                    {p.tech || "Figma"}
                  </span>
                  {p.link && (
                    <span className="text-[9px] text-violet-600 font-bold hover:underline">Link →</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Experience */}
      <div className="space-y-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Journey</span>
        <div className="space-y-4">
          {data.experiences.length === 0 ? (
            <p className="text-xs text-gray-400">No career cards configured.</p>
          ) : (
            data.experiences.map((exp, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-600 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-gray-900">{exp.role || "Lead Designer"}</h4>
                    <span className="text-[9px] text-gray-400 font-semibold">{exp.duration}</span>
                  </div>
                  <p className="text-[9px] font-semibold text-violet-600">{exp.company || "Bowizzy Studio"}</p>
                  <div className="text-[10px] text-gray-500 mt-1 leading-relaxed rich-text-preview" dangerouslySetInnerHTML={{ __html: exp.details || "Experience details..." }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
