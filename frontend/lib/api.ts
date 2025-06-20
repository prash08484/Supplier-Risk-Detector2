// api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Types for better type safety
export interface SupplierAnalysisRequest {
  url: string;
  include_links?: boolean;
  max_depth?: number;
}

export interface SupplierAnalysisResponse {
  success: boolean;
  data?: {
    company_name: string;
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
    };
  };
  error?: string;
  message?: string;
}

export interface ApiErrorData {
  message: string;
  status: number;
  details?: any;
}

// Enhanced analyze supplier function
export const analyzeSupplier = async (
  url: string,
  options: { include_links?: boolean; max_depth?: number } = {}
): Promise<SupplierAnalysisResponse> => {
  try {
    const requestBody: SupplierAnalysisRequest = {
      url,
      include_links: options.include_links ?? true,
      max_depth: options.max_depth ?? 2,
    };

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${getAuthToken()}`, // Add JWT token if authentication is enabled
      },
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
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors, parsing errors, etc.
    throw new ApiError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      0,
      error
    );
  }
};

// Get analysis status (for long-running operations)
export const getAnalysisStatus = async (jobId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/status/${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(
        errorData.message || "Failed to get analysis status",
        response.status,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to get analysis status",
      0,
      error
    );
  }
};

// Get analysis history
export const getAnalysisHistory = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/history`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(
        errorData.message || "Failed to get analysis history",
        response.status,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to get analysis history",
      0,
      error
    );
  }
};

// Validate URL before sending to backend
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Custom error class for API errors
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Utility function to get auth token (implement based on your auth system)
const getAuthToken = (): string | null => {
  // Implement your token retrieval logic here
  // For example, from localStorage, cookies, or a state management library
  return localStorage.getItem('authToken');
};

// Health check endpoint
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Export the ApiError class for use in components
export { ApiError };