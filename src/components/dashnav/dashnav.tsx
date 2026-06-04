import { Menu, Plus, Ticket, Share2, CalendarDays, FileText, Copy, Check } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/api';
import { getResumeTemplates } from '@/services/resumeServices';
interface ProfileData {
    name: {
        first_name: string;
        middle_name?: string;
        last_name: string;
    };
    image?: string;
    isWelcomeBonusRedeemed?: boolean;
    credits?: number;
    coupon_code?: string;
}


export default function DashNav({ heading }: { heading: string }) {
    const { toggleSidebar } = useSidebar();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [imgError, setImgError] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // ── fetch profile (single source of truth for profile + credits) ───────────
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('user') || 'null');
                const token = userData?.token;
                if (!token) return;

                setProfileLoading(true);
                const resp = await api.get('/personal-details/profile-data', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = resp?.data ?? resp;
                if (data) setProfileData(data);
            } catch (err) {
                console.warn('Failed to load profile data', err);
            } finally {
                setProfileLoading(false);
            }
        };
        loadProfile();
    }, []);

    // ── close dropdown on outside click ───────────────────────────────────────
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!dropdownRef.current) return;
            if (dropdownRef.current.contains(e.target as Node)) return;
            setShowProfileDropdown(false);
        };
        if (showProfileDropdown) document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [showProfileDropdown]);

    // ── share modal ────────────────────────────────────────────────────────────
    const [showShareModal, setShowShareModal] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [couponCopied, setCouponCopied] = useState(false);

    const fetchTemplates = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || 'null');
            const userId = userData?.user_id;
            const token = userData?.token;
            if (!userId || !token) return;
            setTemplatesLoading(true);
            const list = await getResumeTemplates(userId, token);
            setTemplates(Array.isArray(list) ? list : []);
        } catch (err) {
            console.warn('Failed to load resume templates', err);
            setTemplates([]);
        } finally {
            setTemplatesLoading(false);
        }
    };

    // ── derived values ─────────────────────────────────────────────────────────
    const displayName = profileData
        ? [profileData.name.first_name, profileData.name.last_name].filter(Boolean).join(' ')
        : null;

    const hasValidImage = !!profileData?.image && !imgError;

    const formattedCredits =
        profileData?.credits != null
            ? Number(profileData.credits).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0.00';

    return (
        <>
            <nav className="relative z-[100] flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
                <div className="text-lg font-medium text-gray-700">{heading}</div>

                <div className="flex items-center gap-2">
                    {/* Profile pill + dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowProfileDropdown((s) => !s)}
                            className="flex items-center gap-2 pl-1 pr-3 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition"
                            aria-expanded={showProfileDropdown}
                            aria-haspopup="true"
                        >
                            <span className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                                {hasValidImage ? (
                                    <img
                                        src={profileData!.image}
                                        alt={displayName ?? 'Profile'}
                                        onError={() => setImgError(true)}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                    </svg>
                                )}
                            </span>

                            <span className="text-sm text-gray-700 hidden sm:block">
                                {profileLoading ? (
                                    <span className="inline-block w-24 h-3 bg-gray-200 rounded animate-pulse" />
                                ) : displayName ? (
                                    <>
                                        <span className="text-gray-400 font-normal">Hi, </span>
                                        <span className="font-medium">{displayName}</span>
                                    </>
                                ) : (
                                    'My Profile'
                                )}
                            </span>

                            <svg
                                className={`w-3 h-3 text-gray-400 ml-0.5 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}
                                viewBox="0 0 10 6"
                                fill="none"
                            >
                                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {showProfileDropdown && (
                            <div className="absolute right-0 mt-2 w-56 z-[110] animate-in fade-in slide-in-from-top-1 duration-150">
                                <div className="absolute right-5 -top-1.5 w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45 z-10" />

                                <div className="relative rounded-xl shadow-lg border border-gray-100 bg-white overflow-hidden">
                                    <div className="px-4 py-3 bg-gradient-to-br from-orange-50 to-orange-100 border-b border-orange-100 flex items-center gap-3">
                                        <span className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow">
                                            {hasValidImage ? (
                                                <img src={profileData!.image} alt={displayName ?? 'Profile'} className="w-full h-full object-cover" />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                                                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                                </svg>
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-800 truncate">{displayName ?? '—'}</div>
                                            <div className="text-xs text-gray-500">Your Profile</div>
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            onClick={() => { setShowProfileDropdown(false); setShowShareModal(true); fetchTemplates(); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition group"
                                        >
                                            <span className="w-7 h-7 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition">
                                                <Share2 size={14} className="text-blue-500" />
                                            </span>
                                            Share Resume
                                        </button>

                                        <button
                                            onClick={() => window.open('https://nammaqa.com/meetups/', '_blank')}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition group"
                                        >
                                            <span className="w-7 h-7 rounded-full bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition">
                                                <CalendarDays size={14} className="text-purple-500" />
                                            </span>
                                            View Events
                                        </button>

                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition group">
                                            <span className="w-7 h-7 rounded-full bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center transition">
                                                <Plus size={14} className="text-orange-500" />
                                            </span>
                                            <span className="flex items-center justify-between w-full">
                                                Credits
                                                <span className="ml-auto text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                                    {profileLoading ? '…' : formattedCredits}
                                                </span>
                                            </span>
                                        </button>

                                        <div className="px-4 py-2.5">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                                    <Ticket size={14} className="text-green-500" />
                                                </span>
                                                <span className="text-sm text-gray-700">Coupon</span>
                                            </div>
                                            {profileData?.coupon_code ? (
                                                <div className="ml-10 flex items-center gap-2">
                                                    <div className="flex-1 flex items-center gap-1.5 bg-green-50 border border-green-200 border-dashed rounded-lg px-2.5 py-1.5 min-w-0">
                                                        <span className="text-xs font-mono font-semibold text-green-700 tracking-widest truncate">
                                                            {profileData.coupon_code}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await navigator.clipboard.writeText(profileData.coupon_code!);
                                                                setCouponCopied(true);
                                                                setTimeout(() => setCouponCopied(false), 2000);
                                                            } catch { console.error('Failed to copy coupon'); }
                                                        }}
                                                        className={`flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                                                            couponCopied
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {couponCopied ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy</>}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="ml-10 text-xs text-gray-400">No coupon available</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => toggleSidebar()}
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-100 transition lg:hidden"
                    >
                        <Menu size={18} />
                    </button>
                </div>

                {/* Share Modal */}
                {showShareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40" style={{ backdropFilter: 'blur(4px)' }} onClick={() => setShowShareModal(false)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-4 z-20 overflow-hidden">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold">Share Resume</h3>
                                <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                            </div>
                            <div className="max-h-[70vh] overflow-auto">
                                {templatesLoading ? (
                                    <div className="text-sm text-gray-500">Loading templates…</div>
                                ) : templates.length === 0 ? (
                                    <div className="text-sm text-gray-500">No templates found.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 p-4">
                                        {templates.map((t) => {
                                            const templateId = t.resume_template_id || t.template_id;
                                            const isCopied = copiedId === templateId;
                                            return (
                                                <div key={templateId} className="flex flex-col md:flex-row items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition group">
                                                    <div className="flex items-center gap-3 w-full">
                                                        <span className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                                            <FileText size={20} className="text-red-500" />
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-semibold text-gray-800 truncate">{t.template_name}</div>
                                                            <div className="text-xs text-gray-500">Resume</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await navigator.clipboard.writeText(t.template_file_url);
                                                                setCopiedId(templateId);
                                                                setTimeout(() => setCopiedId(null), 2000);
                                                            } catch {
                                                                setCopyStatus('Copy failed');
                                                                setTimeout(() => setCopyStatus(null), 2000);
                                                            }
                                                        }}
                                                        className={`w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${isCopied ? 'bg-green-100 text-green-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                                                    >
                                                        {isCopied ? (
                                                            <><Check size={16} />Copied</>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-2"><Copy size={16} /><span>Share URL</span></div>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {copyStatus && <div className="mt-3 text-sm text-green-600">{copyStatus}</div>}
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}
