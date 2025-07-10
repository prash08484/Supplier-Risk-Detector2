const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "https://supplier-risk-detector2.onrender.com/api/v1";
//const API_BASE_URL = "https://supplier-risk-detector2.onrender.com/api/v1";

import { normalizeUrl } from "./normalizeUrl"; // ✅ import helper

interface SupplierIdentifier {
  url?: string;
  name?: string;
}

export interface SupplierAnalysisRequest {
  url: string;
  include_links?: boolean;
  max_depth?: number;
  limit?: number; // ✅ Added limit support
}

export interface SupplierAnalysisResponse {
  success: boolean;
  data?: {
    company_name: string;
    normalized_url?: string;
    analysis: {
      sustainability_score: number;
      risk_level: string;
      key_findings: string[];
      recommendations: string[];
    };
    content_summary: string;
    metadata: {
      pages_analyzed: number;
      last_updated: string;
      url?: string;
    };
  };
  error?: string;
  message?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources: string[];
  error?: string;
}

export interface VoiceResponse {
  success: boolean;
  text?: string;
  audio_url?: string;
  error?: string;
}

export interface ApiErrorData {
  message: string;
  status: number;
  details?: any;
}

export const analyzeSupplier = async (
  rawUrl: string,
  options: { include_links?: boolean; max_depth?: number; limit?: number } = {}
): Promise<SupplierAnalysisResponse> => {
  try {
    const url = normalizeUrl(rawUrl);
    if (!url) throw new ApiError("Invalid URL", 400);

    const requestBody: SupplierAnalysisRequest = {
      url,
      include_links: options.include_links ?? true,
      max_depth: options.max_depth ?? 2,
      limit: options.limit ?? 3, // ✅ Add limit to request
    };

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || "Failed to analyze supplier",
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      0,
      error
    );
  }
};

export const chatWithSupplier = async (
  identifier: SupplierIdentifier,
  question: string,
  chatHistory: ChatMessage[] = []
): Promise<ChatResponse> => {
  try {
    const payload = {
      question,
      chat_history: chatHistory,
      ...(identifier.url
        ? { url: normalizeUrl(identifier.url) }
        : {}),
      ...(identifier.name && !identifier.url ? { supplier_name: identifier.name } : {}),
    };

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || "Chat failed",
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : "Chat failed",
      0,
      error
    );
  }
};

export const transcribeVoice = async (audioFile: File): Promise<VoiceResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", audioFile);

    const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || "Transcription failed",
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : "Transcription failed",
      0,
      error
    );
  }
};

export const synthesizeSpeech = async (text: string): Promise<VoiceResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/voice/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || "Speech synthesis failed",
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : "Speech synthesis failed",
      0,
      error
    );
  }
};

export const voiceChatWithSupplier = async (
  identifier: SupplierIdentifier,
  audioFile: File,
  chatHistory: ChatMessage[] = []
): Promise<ChatResponse & { audio_url?: string }> => {
  try {
    const formData = new FormData();
    formData.append("file", audioFile);

    if (identifier.url) {
      const normalizedUrl = normalizeUrl(identifier.url);
      if (normalizedUrl) {
        formData.append("url", normalizedUrl);
      } else {
        throw new ApiError("Invalid URL", 400);
      }
    } else if (identifier.name) {
      formData.append("supplier_name", identifier.name);
    }

    formData.append("chat_history", JSON.stringify(chatHistory));

    const response = await fetch(`${API_BASE_URL}/voice/chat`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || "Voice chat failed",
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : "Voice chat failed",
      0,
      error
    );
  }
};

export const getChatHistory = async (
  identifier: string,
  limit: number = 20
): Promise<ChatMessage[]> => {
  try {
    const normalizedIdentifier = normalizeUrl(identifier);

    if (!normalizedIdentifier) {
      throw new ApiError("Invalid identifier for chat history", 400);
    }

    const response = await fetch(
      `${API_BASE_URL}/chat/history/${encodeURIComponent(normalizedIdentifier)}?limit=${limit}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || "Failed to get chat history",
        response.status,
        data
      );
    }

    return data.chats || [];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to get chat history",
      0,
      error
    );
  }
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
};
