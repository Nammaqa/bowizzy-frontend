export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode: "jd" | "non-jd";
  createdAt: string;
  started?: boolean;
  is_paid?: boolean;
  infoJson?: any;
  jd_text?: string;
}