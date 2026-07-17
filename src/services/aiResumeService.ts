
import type { ChatSession, ChatMessage } from "@/pages/(AIResumeBuilder)/types";
import api from "@/api";

export async function getAiSessions(token: string): Promise<Pick<ChatSession, "id" | "title" | "mode" | "started" | "createdAt" | "messages" | "infoJson">[]> {
    const res = await api.get("/user/sessions", {
        headers: { Authorization: `Bearer ${token}` },
    });
    // Map API response to required fields
    return (res.data || []).map((item: any) => {
        const chats = (item.chats || []).map((chat: any) => ({
            id: chat.id?.toString() ?? "",
            role: chat.type || chat.role || "user",
            content: chat.text || chat.content || chat.message || "",
            createdAt: chat.created_at || new Date().toISOString(),
        }));
        return {
            id: item.id?.toString() ?? item.session_id?.toString() ?? "",
            title: item.session_name,
            mode: item.mode,
            started: item.started ?? false,
            createdAt: item.created_at,
            messages: chats,
            infoJson: item.infoJson || item.info_json || null,
        };
    });
}

export async function createAiSession(mode: "jd" | "non-jd", sessionName: string, token: string): Promise<ChatSession> {
    const res = await api.post(
        "/sessions",
        { session_name: sessionName, mode },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = res.data.data || res.data;
    return {
        id: data.id || data.session_id,
        title: data.session_name || sessionName,
        messages: [],
        mode: data.mode || mode,
        createdAt: data.created_at || new Date().toISOString(),
        started: false,
    };
}

export async function deleteAiSession(sessionId: string, token: string): Promise<void> {
    await api.delete(`/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function startAiSession(sessionId: string, token: string): Promise<void> {
    await api.post(
        `/sessions/${sessionId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
    );
}

export async function getSessionChats(sessionId: string, token: string): Promise<ChatMessage[]> {
    const res = await api.get(`/sessions/${sessionId}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const chats = res.data.data || res.data || [];
    return chats.map((chat: any) => ({
        id: chat.id?.toString() ?? "",
        role: chat.type || chat.role || "user",
        content: chat.text || chat.content || chat.message || "",
        createdAt: chat.created_at || new Date().toISOString(),
    }));
}

export interface JdSkillItem {
    skill_name: string;
    skill_level: string;
}

export interface JdProjectItem {
    project_id?: number;
    project_title: string;
    start_date?: string | null;
    end_date?: string | null;
    currently_working?: boolean;
    enhanced_description: string[];
    roles_responsibilities?: string[];
}

export interface JdExperienceItem {
    experience_id?: number;
    job_title: string;
    company_name: string;
    employment_type?: string;
    location?: string;
    work_mode?: string;
    start_date?: string | null;
    end_date?: string | null;
    currently_working_here?: boolean;
    enhanced_description: string[];
}

export interface JdEducationItem {
    education_id?: number;
    education_type: string;
    institution_name: string;
    degree?: string | null;
    field_of_study?: string | null;
    university_name?: string | null;
    start_year?: string | null;
    end_year?: string | null;
    currently_pursuing?: boolean;
    result_format?: string;
    result?: string;
}

export interface JdCertificateItem {
    certificate_id?: number;
    certificate_title: string;
    certificate_type?: string;
    certificate_provided_by?: string;
    domain?: string;
    date?: string;
}

export interface JdLinkItem {
    link_id?: number;
    link_type: string;
    url: string;
}

export interface JdResumeData {
    personal_details?: Record<string, any>;
    technical_summary_generated?: string;
    projects?: JdProjectItem[];
    work_experience?: { experiences: JdExperienceItem[] };
    education?: JdEducationItem[];
    skills?: JdSkillItem[];
    ai_skills?: JdSkillItem[];
    certificates?: JdCertificateItem[];
    links?: JdLinkItem[];
    [key: string]: any;
}

export async function analyzeJobDescription(
    sessionId: string,
    jdText: string,
    token: string
): Promise<JdResumeData> {
    const res = await api.post(
        "/resume-data/jd",
        { session_id: Number(sessionId), jd_text: jdText },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.data || res.data;
}

export async function saveJdResumeData(
    sessionId: string,
    data: JdResumeData,
    token: string
): Promise<void> {
    await api.post(
        "/resume-data/jd/save",
        { session_id: Number(sessionId), data },
        { headers: { Authorization: `Bearer ${token}` } }
    );
}

export async function createChat(
    sessionId: string,
    text: string,
    type: "user" | "assistant",
    fileLink: string | null,
    token: string
): Promise<ChatMessage> {
    const res = await api.post(
        "/chats",
        {
            session_id: sessionId,
            text,
            file_link: fileLink,
            type,
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = res.data.data || res.data;
    return {
        id: data.id?.toString() ?? "",
        role: data.type || type,
        content: data.text || text,
        createdAt: data.created_at || new Date().toISOString(),
    };
}
