
interface InterviewCardProps {
  interview: {
    id: string | number;
      job_role?: string;
    interview_slot_id?: string | number;
    interview_code?: string;
    title: string;
    experience: string;
    date?: string;
    time?: string;
    start_time_utc?: string;
    end_time_utc?: string;
    credits?: number;
    priority?: string;
    interview_status?: string;
    interview_schedule_id?: string | number;
    meeting_link?: string;
    candidateFeedbackProvided?: boolean;
    interviewerFeedbackProvided?: boolean;
  };
  isScheduled: boolean;
  isExpired?: boolean;
  isPast?: boolean;
  onViewDetails?: () => void;
  onGiveFeedback?: () => void;
  userId?: string | number;
  token?: string;
  onCancelSuccess?: () => void;
}

import { useState } from 'react';
import { cancelInterviewSchedule } from '@/services/interviewPrepService';

const formatDate = (iso?: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ""; }
};

const formatTime = (iso?: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ""; }
};

// status computation removed — priority badge (HIGH/normal) shown on top-right instead

const InterviewCard = ({ interview, isScheduled, isExpired = false, isPast = false, onViewDetails, onGiveFeedback, userId, token, onCancelSuccess }: InterviewCardProps) => {
  const [isCancelling, setIsCancelling] = useState(false);
  
  const start = interview.start_time_utc || interview.date;
  const end = interview.end_time_utc;
  const dateStr = formatDate(start) || interview.date || '';
  const timeStr = `${formatTime(start)}${end ? ' - ' + formatTime(end) : ''}`;
  const isStartingSoon = (() => {
    if (!start) return false;
    const s = new Date(start).getTime();
    const now = Date.now();
    const diffMs = s - now;
    return diffMs > 0 && diffMs <= 3 * 3600 * 1000; // within next 3 hours
  })();

  const isHigh = ((interview.priority || '').toLowerCase() === 'high') || isStartingSoon;
  const isCancelled = (interview.interview_status || '').toLowerCase() === 'cancelled';

  const handleCancelInterview = async () => {
    if (!userId || !token) {
      alert('Unable to cancel: Missing user information');
      return;
    }

    const scheduleId = interview.interview_schedule_id || interview.id;
    
    if (!scheduleId) {
      alert('Unable to cancel: Missing interview schedule ID');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this interview?')) {
      return;
    }

    try {
      setIsCancelling(true);
      await cancelInterviewSchedule(userId, token, scheduleId);
      onCancelSuccess?.();
    } catch (err) {
      console.error('Failed to cancel interview:', err);
      alert('Failed to cancel interview. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleJoinMeeting = () => {
    if (!interview.meeting_link) {
      alert('Meeting link not available');
      return;
    }
    // Open the meeting link in a new tab
    window.open(interview.meeting_link, '_blank');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-10 h-10" viewBox="0 0 80 80" fill="none">
            <path
              d="M30 50c-2.667-2.667-6.667-4-12-4s-9.333 1.333-12 4M50 30c2.667 2.667 6.667 4 12 4s9.333-1.333 12-4"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="18" cy="40" r="3" fill="white" />
            <circle cx="62" cy="40" r="3" fill="white" />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">
                INTERVIEW ID: {interview.interview_code ?? interview.interview_slot_id ?? interview.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCancelled ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                  Cancelled
                </span>
              ) : isPast ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-600">
                  Completed
                </span>
              ) : isExpired ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-600">
                  Expired
                </span>
              ) : (
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${isHigh ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {isHigh ? 'HIGH' : (interview.priority || 'normal')}
                </span>
              )}
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 mb-2">
            {(() => {
              const role = interview.job_role || interview.title || '';
              const exp = interview.experience ? ` - ${interview.experience}` : '';
              return `${role}${exp}`.trim();
            })()}
          </h3>

          <p className="text-sm text-gray-600 mb-3">
            {dateStr} • {timeStr}
          </p>

          <div className="flex items-center justify-between">
            {isCancelled ? (
              <div className="text-sm text-gray-500">
                This interview has been cancelled.
              </div>
            ) : isPast ? (
              <div className="flex gap-2">
                <button
                  onClick={onViewDetails}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  View Details
                </button>
                {!interview.candidateFeedbackProvided && onGiveFeedback && (
                  <button
                    onClick={onGiveFeedback}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-[#FF8351] rounded hover:bg-[#E67A45] transition-colors"
                  >
                    Give Feedback
                  </button>
                )}
              </div>
            ) : isScheduled ? (
              <div className="flex gap-2">
                <button className="px-4 py-1.5 text-sm font-medium text-white bg-green-500 rounded hover:bg-green-600 transition-colors" onClick={handleJoinMeeting}>
                  Join Now
                </button>
                <button
                  onClick={onViewDetails}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  View Details
                </button>
                <button 
                  className="px-4 py-1.5 text-sm font-medium text-red-500 bg-white border border-gray-200 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCancelInterview}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                onClick={onViewDetails}
                disabled={isExpired}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                  isExpired
                    ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default InterviewCard;