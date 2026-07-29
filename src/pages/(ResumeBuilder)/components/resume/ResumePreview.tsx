import React, { useRef, useEffect } from 'react';
import type { ResumeData } from '../../../../types/resume';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  data,
  currentPage = 1,
  totalPages = 2,
  onPageChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fullName = [data.personal.firstName, data.personal.middleName, data.personal.lastName]
    .filter(Boolean)
    .join(' ') || 'STEVE ROBERTS';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const scale = 2;
    canvas.width = 340 * scale;
    canvas.height = 480 * scale;
    ctx.scale(scale, scale);

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 340, 480);

    // Draw resume content
    drawResume(ctx, data);
  }, [data]);

  const drawResume = (ctx: CanvasRenderingContext2D, resumeData: ResumeData) => {
    const leftMargin = 20;
    const rightColumnX = 240;
    let y = 30;

    // Name
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(fullName.toUpperCase(), leftMargin, y);
    y += 18;

    // Title
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText('ARCHITECT', leftMargin, y);
    y += 25;

    // Profile Section
    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('PROFILE', leftMargin, y);
    y += 12;

    ctx.fillStyle = '#4a4a4a';
    ctx.font = '7px Arial, sans-serif';
    const profileText = resumeData.personal.aboutCareerObjective || 
      'The origins of the first constellations date back to prehistoric times. Their purpose was to tell stories of their beliefs, experiences, creation, or mythology.';
    wrapText(ctx, profileText, leftMargin, y, 200, 10);
    y += 50;

    // Education Section
    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('EDUCATION', leftMargin, y);
    y += 14;

    if (resumeData.education.higherEducation.length > 0) {
      resumeData.education.higherEducation.forEach((edu) => {
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 7px Arial, sans-serif';
        ctx.fillText(`${edu.degree} | ${edu.instituteName}`, leftMargin, y);
        y += 10;
        ctx.fillStyle = '#666666';
        ctx.font = '6px Arial, sans-serif';
        ctx.fillText(`${edu.startYear} - ${edu.endYear}`, leftMargin, y);
        y += 15;
      });
    } else {
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 7px Arial, sans-serif';
      ctx.fillText('Master of Architecture (M.Arch.) | Harvard University', leftMargin, y);
      y += 10;
      ctx.fillStyle = '#666666';
      ctx.font = '6px Arial, sans-serif';
      ctx.fillText('2018', leftMargin, y);
      y += 8;
      ctx.fillText('Thesis: Sustainable Urban Development and Smart Cities', leftMargin, y);
      y += 15;

      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 7px Arial, sans-serif';
      ctx.fillText('Bachelor of Architecture (B.Arch.) | Columbia University', leftMargin, y);
      y += 10;
      ctx.fillStyle = '#666666';
      ctx.font = '6px Arial, sans-serif';
      ctx.fillText('2011 - 2016', leftMargin, y);
      y += 8;
      ctx.fillText('Relevant Coursework: Sustainable Architecture, Urban Planning', leftMargin, y);
    }
    y += 20;

    // Experience Section
    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('EXPERIENCE', leftMargin, y);
    y += 14;

    if (resumeData.experience.workExperiences.length > 0 && resumeData.experience.workExperiences[0].companyName) {
      resumeData.experience.workExperiences.slice(0, 2).forEach((exp) => {
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 7px Arial, sans-serif';
        ctx.fillText(`${exp.jobTitle} | ${exp.companyName} | ${exp.location}`, leftMargin, y);
        y += 10;
        ctx.fillStyle = '#666666';
        ctx.font = '6px Arial, sans-serif';
        const dateText = exp.currentlyWorking ? `${formatDate(exp.startDate)} - Present` : `${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}`;
        ctx.fillText(dateText, leftMargin, y);
        y += 8;
        if (exp.description) {
          wrapText(ctx, exp.description.substring(0, 100), leftMargin, y, 200, 8);
        }
        y += 25;
      });
    } else {
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 7px Arial, sans-serif';
      ctx.fillText('Senior Architect | ABC Architecture Firm | New York, NY', leftMargin, y);
      y += 10;
      ctx.fillStyle = '#666666';
      ctx.font = '6px Arial, sans-serif';
      ctx.fillText('2019 - Present', leftMargin, y);
      y += 8;
      ctx.fillText('Incorporate sustainable design principles to enhance energy efficiency', leftMargin, y);
      y += 20;

      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 7px Arial, sans-serif';
      ctx.fillText('Junior Architect | XYZ Design Studio | New York, NY', leftMargin, y);
      y += 10;
      ctx.fillStyle = '#666666';
      ctx.font = '6px Arial, sans-serif';
      ctx.fillText('2016 - 2019', leftMargin, y);
    }

    // Right Column - Languages
    let rightY = 30;
    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 8px Arial, sans-serif';
    ctx.fillText('LANGUAGES', rightColumnX, rightY);
    rightY += 12;

    const languages = resumeData.personal.languagesKnown.length > 0 
      ? resumeData.personal.languagesKnown 
      : ['English (Fluent)', 'Indonesian (Fluent)', 'Spanish (Proficient)'];
    
    ctx.fillStyle = '#4a4a4a';
    ctx.font = '6px Arial, sans-serif';
    languages.slice(0, 3).forEach((lang) => {
      ctx.fillText(`• ${lang}`, rightColumnX, rightY);
      rightY += 10;
    });
    rightY += 10;

    // Skills
    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 8px Arial, sans-serif';
    ctx.fillText('SKILLS', rightColumnX, rightY);
    rightY += 12;

    const skills = resumeData.skillsLinks.skills
      .filter(s => s.skillName)
      .map(s => s.skillName);
    const displaySkills = skills.length > 0 
      ? skills 
      : ['Architectural Design', 'Green Building Design', '3D Modeling', 'BIM', 'Documentation'];

    ctx.fillStyle = '#4a4a4a';
    ctx.font = '6px Arial, sans-serif';
    displaySkills.slice(0, 6).forEach((skill) => {
      ctx.fillText(`• ${skill}`, rightColumnX, rightY);
      rightY += 10;
    });
    rightY += 10;

    // Contact
    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 8px Arial, sans-serif';
    ctx.fillText('CONTACT', rightColumnX, rightY);
    rightY += 12;

    ctx.fillStyle = '#4a4a4a';
    ctx.font = '6px Arial, sans-serif';
    ctx.fillText(resumeData.personal.mobileNumber || '+00 235 293 135', rightColumnX, rightY);
    rightY += 10;
    ctx.fillText(resumeData.personal.email || 'youremail@info.com', rightColumnX, rightY);
    rightY += 10;
    ctx.fillText(resumeData.skillsLinks.links.portfolioUrl || 'www.yourwebsite.com', rightColumnX, rightY);
    rightY += 15;

    // Licenses
    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 8px Arial, sans-serif';
    ctx.fillText('LICENSES', rightColumnX, rightY);
    rightY += 12;

    ctx.fillStyle = '#4a4a4a';
    ctx.font = '6px Arial, sans-serif';
    if (resumeData.certifications.length > 0 && resumeData.certifications[0].certificateTitle) {
      resumeData.certifications.slice(0, 2).forEach((cert) => {
        ctx.fillText(`• ${cert.certificateTitle}`, rightColumnX, rightY);
        rightY += 10;
      });
    } else {
      ctx.fillText('• Licensed Architect', rightColumnX, rightY);
      rightY += 10;
      ctx.fillText('• LEED Accredited', rightColumnX, rightY);
    }
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Navigation */}
      <div className="flex items-center justify-end gap-2 mb-3 px-2">
        <span className="text-sm text-gray-600">{currentPage}/{totalPages}</span>
        <button
          onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
          className="p-1 text-gray-400 hover:text-gray-600"
          disabled={currentPage === 1}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
          className="p-1 text-gray-400 hover:text-gray-600"
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Canvas Preview */}
      <div className="flex-1 flex items-start justify-center overflow-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <canvas
            ref={canvasRef}
            style={{ width: '340px', height: '480px' }}
            className="block"
          />
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;