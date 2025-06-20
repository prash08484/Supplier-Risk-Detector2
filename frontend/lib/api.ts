
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const analyzeSupplier = async (url: string) => {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`, // Add JWT token if authentication is enabled
    },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    throw new Error("Failed to analyze supplier");
  }
  return response.json();
};

