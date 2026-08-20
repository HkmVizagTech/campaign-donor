const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return authToken;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = "Bearer " + token;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(API_URL + path, { ...options, headers });
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

export const api = {
  login: (email: string, password: string) =>
    request<ApiResponse<{ token: string; admin: unknown }>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<ApiResponse<{ id: string; name: string; email: string; role: string }>>("/auth/me"),

  dashboard: () => request<ApiResponse<{ totalDonors: number; activeCampaigns: number; campaign?: unknown }>>("/campaigns/dashboard"),

  donors: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<PaginatedResponse<unknown>>("/donors" + qs);
  },
  donor: (id: string) => request<ApiResponse<unknown>>("/donors/" + id),
  updateDonor: (id: string, data: unknown) =>
    request<ApiResponse<unknown>>("/donors/" + id, { method: "PUT", body: JSON.stringify(data) }),

  importDonors: (formData: FormData) =>
    request<ApiResponse<{ batch: unknown; summary: unknown }>>("/donors/import", {
      method: "POST",
      body: formData,
    }),
  previewImport: (formData: FormData) =>
    request<ApiResponse<{ headers: string[]; rows: unknown[]; totalRows: number }>>("/import-batches/preview", {
      method: "POST",
      body: formData,
    }),
  importBatches: () => request<ApiResponse<unknown[]>>("/import-batches"),
  importBatch: (id: string) => request<ApiResponse<unknown>>("/import-batches/" + id),

  campaigns: () => request<ApiResponse<unknown[]>>("/campaigns"),
  createCampaign: (data: unknown) =>
    request<ApiResponse<unknown>>("/campaigns", { method: "POST", body: JSON.stringify(data) }),
  campaign: (id: string) => request<ApiResponse<unknown>>("/campaigns/" + id),
  updateCampaign: (id: string, data: unknown) =>
    request<ApiResponse<unknown>>("/campaigns/" + id, { method: "PUT", body: JSON.stringify(data) }),
  addRecipients: (campaignId: string, data: unknown) =>
    request<ApiResponse<unknown>>("/campaigns/" + campaignId + "/recipients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  campaignRecipients: (campaignId: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<PaginatedResponse<unknown>>("/campaigns/" + campaignId + "/recipients" + qs);
  },
  updateResponse: (campaignId: string, recipientId: string, response: string) =>
    request<ApiResponse<unknown>>("/campaigns/" + campaignId + "/recipients/" + recipientId + "/response", {
      method: "PUT",
      body: JSON.stringify({ response }),
    }),
  updateBrickStatus: (campaignId: string, recipientId: string, brickStatus: string) =>
    request<ApiResponse<unknown>>("/campaigns/" + campaignId + "/recipients/" + recipientId + "/brick", {
      method: "PUT",
      body: JSON.stringify({ brickStatus }),
    }),
  campaignStats: (id: string) => request<ApiResponse<unknown>>("/campaigns/" + id + "/stats"),
  sendCampaign: (id: string) =>
    request<ApiResponse<{ sent: number; failed: number; total: number }>>("/campaigns/" + id + "/send", {
      method: "POST",
    }),

  exportUrl: (campaignId: string, response?: string, format = "xlsx") => {
    let url = API_URL + "/reports/" + campaignId + "/export?format=" + format;
    if (response) url += "&response=" + response;
    return url;
  },
};
