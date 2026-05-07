import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <DashNav heading="Privacy Policy" /> */}
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Bowizzy</h1>
            <h2 className="text-2xl font-semibold text-gray-700">Privacy Policy</h2>
            <p className="text-sm text-gray-500 mt-4">Last Updated: May 6, 2026</p>
          </div>

          {/* Introduction */}
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              This Privacy Policy ("Policy") describes how Bowizzy ("we," "our," or "us") collects, uses, stores, processes, shares, and protects your personal information when you access or use our AI-powered career technology platform ("Platform"). This Policy applies to all users of the Platform globally, regardless of access method or location.
            </p>
            <p>
              We are committed to protecting your privacy and handling your personal data with transparency, integrity, and in compliance with applicable data protection regulations. By accessing or using the Platform, you consent to the data practices described in this Policy. If you do not agree with these practices, please discontinue use of the Platform.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">1. Categories of Information We Collect</h3>
            <p className="text-gray-700 leading-relaxed">
              We collect various types of information in order to provide, improve, and personalize our services. The categories of data we may collect include:
            </p>

            <div className="space-y-3 ml-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">a. Personal Identification Information</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Full name and preferred display name</li>
                  <li>Email address and contact information</li>
                  <li>Date of birth or age verification data (where required for eligibility)</li>
                  <li>Account login credentials (stored in encrypted form)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">b. Professional and Career Information</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Resume content including work history, educational background, skills, certifications, and achievements</li>
                  <li>Job preferences, target roles, and career objectives</li>
                  <li>Industry, seniority level, and employment status</li>
                  <li>Portfolio links, professional website URLs, and LinkedIn profiles provided voluntarily</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">c. Uploaded and Generated Content</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Resumes, cover letters, and other documents uploaded by you for AI processing</li>
                  <li>Job descriptions submitted for keyword analysis and ATS matching</li>
                  <li>AI-generated documents and content produced using Platform tools</li>
                  <li>Interview scripts, practice answers, and preparation materials</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">d. Audio and Video Data</h4>
                <p className="text-gray-700 mb-2">When interview simulation or voice-enabled features are used with your consent, we may collect:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Voice recordings and speech patterns captured during mock interview sessions</li>
                  <li>Video recordings of simulated interview sessions, where camera access is granted</li>
                  <li>Facial expression data and non-verbal behavioral indicators analyzed for interview coaching purposes</li>
                  <li>Transcripts generated from speech-to-text processing of interview audio</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">e. Technical and Device Data</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Device type, operating system, and browser type and version</li>
                  <li>IP address, approximate geographic location, and time zone</li>
                  <li>Session logs, timestamps, and usage interaction data</li>
                  <li>Cookies, local storage identifiers, and tracking pixel data (where applicable)</li>
                  <li>Referral URLs and how you accessed the Platform</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">2. How We Use Your Information</h3>
            <p className="text-gray-700 leading-relaxed">
              We use the information we collect for the following purposes:
            </p>

            <div className="space-y-3 ml-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Platform Service Delivery</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Processing and analyzing your resume to generate ATS compatibility scores and enhancement recommendations</li>
                  <li>Providing AI-powered content generation for resumes, cover letters, and professional summaries</li>
                  <li>Conducting mock interview simulations and delivering personalized feedback</li>
                  <li>Matching your profile and skills against job description requirements</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Product Improvement and AI Training</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Improving the accuracy, quality, and relevance of AI-generated outputs</li>
                  <li>Training and refining our machine learning models using aggregated and processed data</li>
                  <li>Conducting internal research and analytical studies to enhance Platform features</li>
                  <li>Testing new tools, algorithms, and features in controlled environments</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">User Experience and Communication</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Personalizing your Platform experience based on your preferences and behavior</li>
                  <li>Sending transactional emails, account notifications, and important service updates</li>
                  <li>Responding to support inquiries, feedback, and account-related requests</li>
                  <li>Sending promotional communications where you have provided consent</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Legal and Compliance</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Meeting regulatory, contractual, and legal obligations</li>
                  <li>Investigating suspected fraud, misuse, or security incidents</li>
                  <li>Enforcing our Terms and Conditions and other policies</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">3. Data Sharing for Recruitment Purposes</h3>
            <p className="text-gray-700 leading-relaxed">
              Where you opt into recruitment-enabled features of the Platform, you expressly authorize the Platform to share relevant information with third parties for employment and talent acquisition purposes. This data sharing is conditional on your active opt-in and may be withdrawn at any time.
            </p>

            <div className="space-y-3 ml-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Information that may be shared with recruitment partners includes:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Your resume, professional summary, and skills profile</li>
                  <li>AI-generated candidate assessments and ATS compatibility scores</li>
                  <li>Interview recordings, transcripts, and behavioral assessment data (where consented)</li>
                  <li>Job preferences, target roles, and career objectives</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Such information may be shared with:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Prospective employers and their internal HR systems</li>
                  <li>External recruiters and talent acquisition agencies</li>
                  <li>Hiring platform partners and integrated job boards</li>
                  <li>Affiliated organizations providing supplementary career services</li>
                </ul>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed">
              The Platform will make reasonable efforts to share data only with vetted recruitment partners. However, once data is transmitted to third-party organizations, their handling of your information is governed by their own privacy policies, for which the Platform accepts no liability.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">4. Marketing and Promotional Data Use</h3>
            <p className="text-gray-700 leading-relaxed">
              Certain non-personally-identifiable usage data and engagement analytics may be used for internal marketing analysis and promotional activities. Specific uses may include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Measuring Platform feature adoption and user engagement trends</li>
              <li>Generating anonymized performance statistics for investor communications and product reporting</li>
              <li>Using voluntarily submitted testimonials and success stories for brand marketing with explicit user consent</li>
              <li>Conducting A/B testing and user experience research using anonymized behavioral data</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Data may be shared with parent companies, subsidiary brands, or affiliated business entities for operational and analytical purposes. You may opt out of non-essential marketing activities at any time by contacting us or adjusting your account notification settings.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">5. Audio and Video Data Processing</h3>
            <p className="text-gray-700 leading-relaxed">
              The Platform handles audio and video data with heightened sensitivity. By enabling microphone and camera permissions and participating in interview simulation features, you consent to the following processing activities:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Capturing and securely transmitting audio and video input to Platform servers for AI analysis</li>
              <li>Processing speech patterns, verbal clarity, pacing, tone, and vocabulary for interview feedback generation</li>
              <li>Analyzing video content including non-verbal cues, eye contact, and visual presentation where consented</li>
              <li>Retaining recordings in encrypted storage for quality assurance and AI model improvement, subject to applicable retention limits</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Audio and video recordings used for AI training will be anonymized or pseudonymized where technically feasible. Users may request deletion of their audio/video recordings at any time through account settings or by contacting us directly.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">6. AI Processing Disclaimer</h3>
            <p className="text-gray-700 leading-relaxed">
              Our Platform relies on machine learning models and AI algorithms to generate career-related recommendations and assessments. In the context of data processing, you acknowledge and accept the following:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>AI systems process your uploaded information to generate personalized recommendations, which may vary between sessions</li>
              <li>AI-generated assessments are probabilistic estimates and are not guaranteed to be accurate, complete, or error-free</li>
              <li>Outputs generated by AI systems do not constitute professional career, legal, or HR advice</li>
              <li>You remain solely responsible for reviewing and validating all AI-generated content prior to professional use</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              The Platform continuously works to improve AI output quality and fairness. Users who believe AI-generated content is significantly inaccurate or potentially biased are encouraged to report such instances through the Platform's feedback mechanisms.
            </p>
          </div>

          {/* Section 7 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">7. Data Retention</h3>
            <p className="text-gray-700 leading-relaxed">
              We retain user data for as long as is necessary to fulfill the purposes described in this Policy, unless a longer retention period is required by law. Retention periods vary by data type:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Account information and professional profile data: Retained for the duration of your account and up to 24 months following account deletion</li>
              <li>Uploaded resumes and documents: Retained for the duration of your active use, with deletion available on demand or automatically upon account closure</li>
              <li>Audio and video recordings: Retained for up to 12 months for quality assurance purposes, unless you request earlier deletion</li>
              <li>Session logs and technical data: Typically retained for 90 days for security and analytics purposes</li>
              <li>AI training data: Anonymized or aggregated data may be retained indefinitely for model improvement purposes</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You may request deletion of specific categories of your data at any time, subject to applicable legal retention obligations, by contacting us at support@bowizzy.com.
            </p>
          </div>

          {/* Section 8 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">8. Data Security</h3>
            <p className="text-gray-700 leading-relaxed">
              We implement a comprehensive set of administrative, technical, and physical security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Industry-standard encryption for data in transit (TLS/SSL) and at rest (AES-256 or equivalent)</li>
              <li>Role-based access controls ensuring only authorized personnel can access sensitive user data</li>
              <li>Regular security audits, vulnerability assessments, and penetration testing</li>
              <li>Multi-factor authentication requirements for Platform administrative systems</li>
              <li>Incident response protocols for prompt identification and resolution of potential data breaches</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Despite these measures, no digital system can be guaranteed to be fully secure. Data transmission over the internet carries inherent risks, and the Platform cannot guarantee absolute security of information transmitted to or from the Platform. Users acknowledge these inherent risks and agree to promptly notify the Platform of any suspected unauthorized activity affecting their accounts.
            </p>
          </div>

          {/* Section 9 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">9. Third-Party Services and Integrations</h3>
            <p className="text-gray-700 leading-relaxed">
              The Platform may integrate with or rely upon third-party service providers to deliver certain features and functionalities. These may include payment processors, cloud infrastructure providers, analytics platforms, AI API providers, and recruitment technology partners.
            </p>
            <p className="text-gray-700 leading-relaxed">
              These third-party service providers are granted access to your data only to the extent necessary to perform their designated functions and are contractually obligated to handle your data in compliance with applicable data protection laws. The Platform is not responsible for the independent privacy practices or data handling of third-party organizations, and encourages users to review the privacy policies of any third-party services they interact with.
            </p>
          </div>

          {/* Section 10 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">10. User Rights and Data Control</h3>
            <p className="text-gray-700 leading-relaxed">
              Depending on your jurisdiction, you may have certain rights with respect to your personal data, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li><span className="font-semibold">Right of Access:</span> The right to request a copy of the personal data we hold about you</li>
              <li><span className="font-semibold">Right to Rectification:</span> The right to request correction of inaccurate or incomplete personal information</li>
              <li><span className="font-semibold">Right to Erasure:</span> The right to request deletion of your personal data, subject to applicable legal retention obligations</li>
              <li><span className="font-semibold">Right to Portability:</span> The right to receive your personal data in a structured, machine-readable format</li>
              <li><span className="font-semibold">Right to Restriction:</span> The right to request that we limit the processing of your data in certain circumstances</li>
              <li><span className="font-semibold">Right to Object:</span> The right to object to certain processing activities, including direct marketing</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise any of these rights, please contact us at support@bowizzy.com. We will respond to verified requests within the timeframe required by applicable law, typically within 30 days. In some cases, we may need to verify your identity before processing your request.
            </p>
          </div>

          {/* Section 11 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">11. No Guarantee of Employment Outcomes</h3>
            <p className="text-gray-700 leading-relaxed">
              The Platform does not guarantee, represent, or warrant that use of its services will result in any specific employment outcome, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Receiving responses from recruiters or employers following resume submission</li>
              <li>Being shortlisted, interviewed, or offered a position</li>
              <li>Successfully passing ATS filters at any specific organization</li>
              <li>Advancing in your career or obtaining a promotion as a result of Platform use</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Career outcomes are influenced by numerous factors outside the Platform's control, including but not limited to economic conditions, industry competition, individual qualifications, employer-specific hiring practices, and geographic considerations.
            </p>
          </div>

          {/* Section 12 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">12. Updates to This Privacy Policy</h3>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to update this Privacy Policy at any time to reflect changes in our data practices, legal obligations, or Platform features. When material changes are made, we will notify users through:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Email notification to the registered account address</li>
              <li>In-app notification prominently displayed on the Platform</li>
              <li>Update of the 'Last Updated' date at the top of this document</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Continued use of the Platform following the effective date of any revised Privacy Policy constitutes acceptance of the updated Policy. We encourage users to periodically review this Policy to stay informed about how we handle their data.
            </p>
          </div>

          {/* Section 13 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">13. Contact Information</h3>
            <p className="text-gray-700 leading-relaxed">
              For any questions, concerns, requests, or complaints regarding this Privacy Policy or our data handling practices:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <p className="text-gray-700">
                <span className="font-semibold">Email:</span> support@bowizzy.com
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              For data protection inquiries, please include "Privacy Request" in your email subject line. We are committed to addressing all legitimate privacy concerns in a timely and transparent manner.
            </p>
          </div>

          {/* Final Disclaimer */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Final Disclaimer</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Bowizzy is an AI-powered technology platform designed to assist users in their career development and job search activities. The Platform is not a staffing agency, recruiter, HR consultancy, legal advisor, or employment services provider.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              By using the Platform, you confirm that you:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Have read and understood both the Terms and Conditions and this Privacy Policy in their entirety</li>
              <li>Consent to the collection, processing, and use of your data as described herein</li>
              <li>Understand the probabilistic nature of AI-generated content and accept responsibility for reviewing all outputs</li>
              <li>Acknowledge that use of the Platform does not guarantee any specific employment outcome</li>
              <li>Are of legal age and have the capacity to enter into a binding agreement under applicable law</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              These Terms and Conditions and Privacy Policy together constitute the entire agreement between you and Bowizzy with respect to your use of the Platform and supersede all prior agreements, representations, and understandings.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-12 pt-8 border-t border-gray-200">
            <p>© 2026 Bowizzy. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
