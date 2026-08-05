import React, { useState } from 'react';
import ResumePreviewModal from '@/pages/(ResumeBuilder)/components/ui/ResumePreviewModal';
import { initialResumeData, type ResumeData } from '@/types/resume';

const mock: ResumeData = {
  ...initialResumeData,
  personal: {
    ...initialResumeData.personal,
    firstName: 'Jordan', middleName: '', lastName: 'Rivera',
    email: 'jordan.rivera@example.com', mobileNumber: '9876543210',
    address: '221B Baker Street, Bengaluru', country: 'India',
    aboutCareerObjective: 'Results-driven software engineer.',
  },
  experience: {
    jobRole: 'Senior Software Engineer',
    workExperiences: [
      { id: '1', companyName: 'Acme Corp', jobTitle: 'Senior Software Engineer', employmentType: '', location: '', workMode: '', startDate: '2021-01-01', endDate: '', currentlyWorking: true, description: '<ul><li>Led migration of monolith to microservices.</li></ul>', enabled: true },
    ],
  },
};

export default function PreviewModalTest() {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open</button>
      <ResumePreviewModal
        isOpen={open}
        onClose={() => setOpen(false)}
        resumeData={mock}
        templateId="template11"
        autoGeneratePreview={true}
        autoShowPdfPreview={true}
      />
    </div>
  );
}
