export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

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

  // A proxy, rate limiter, or host-level error page can return plain
  // text/HTML instead of JSON — parse defensively so that surfaces as a
  // normal error instead of an uncaught "not valid JSON" crash.
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(res.ok ? "Unexpected response from server" : `Request failed (HTTP ${res.status})`);
  }

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

// Fetches a file with the auth header attached (a plain <a href> or
// window.open can't send Authorization) and triggers a browser download.
async function downloadAuthed(url: string, fallbackFilename: string) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    let message = "Download failed";
    try {
      const json = await res.json();
      message = json.message || message;
    } catch {
      // response wasn't JSON (e.g. the file itself) — keep default message
    }
    throw new Error(message);
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] || fallbackFilename;

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
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
  createDonor: (data: unknown) =>
    request<ApiResponse<unknown>>("/donors", { method: "POST", body: JSON.stringify(data) }),
  updateDonor: (id: string, data: unknown) =>
    request<ApiResponse<unknown>>("/donors/" + id, { method: "PUT", body: JSON.stringify(data) }),
  issueBrick: (donorId: string, data: { type: "free" | "paid"; referenceNumber: string; amount?: number }) =>
    request<ApiResponse<unknown>>("/donors/" + donorId + "/bricks", { method: "POST", body: JSON.stringify(data) }),
  brickIssuances: (donorId: string) => request<ApiResponse<unknown[]>>("/donors/" + donorId + "/bricks"),

  importDonors: (formData: FormData) =>
    request<ApiResponse<{ batch: unknown; summary: unknown }>>("/import-batches/import", {
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
  templateInfo: (templateId?: string) => {
    const qs = templateId ? "?" + new URLSearchParams({ templateId }).toString() : "";
    return request<ApiResponse<{
      id: string; elementName: string; body: string; headerType: string;
      needsHeaderMedia: boolean; variableCount: number;
    }>>("/campaigns/template-info" + qs);
  },
  searchRecipients: (q?: string, brickStatus?: string, checkedIn?: boolean) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (brickStatus) params.set("brickStatus", brickStatus);
    if (typeof checkedIn === "boolean") params.set("checkedIn", String(checkedIn));
    const qs = params.toString();
    return request<ApiResponse<unknown[]>>("/campaigns/recipients/search" + (qs ? "?" + qs : ""));
  },
  checkInRecipient: (campaignId: string, recipientId: string, checkedIn = true) =>
    request<ApiResponse<unknown>>("/campaigns/" + campaignId + "/recipients/" + recipientId + "/checkin", {
      method: "PUT",
      body: JSON.stringify({ checkedIn }),
    }),
  recipientStats: () =>
    request<ApiResponse<{
      total: number; checkedIn: number; notCheckedIn: number;
      brick: Record<string, number>;
    }>>("/campaigns/recipients/stats"),
  brickHandoverStatsByDate: () =>
    request<ApiResponse<{ date: string; count: number }[]>>("/campaigns/recipients/brick-stats-by-date"),
  createCampaign: (data: unknown) =>
    request<ApiResponse<unknown>>("/campaigns", { method: "POST", body: JSON.stringify(data) }),
  campaign: (id: string) => request<ApiResponse<unknown>>("/campaigns/" + id),
  updateCampaign: (id: string, data: unknown) =>
    request<ApiResponse<unknown>>("/campaigns/" + id, { method: "PUT", body: JSON.stringify(data) }),
  deleteCampaign: (id: string) =>
    request<ApiResponse<{ name: string; recipientsDeleted: number; responseHistoryDeleted: number; donorsDeleted: number }>>(
      "/campaigns/" + id,
      { method: "DELETE" }
    ),
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
  sendCampaign: (id: string, variables?: unknown) =>
    request<ApiResponse<{ started: boolean; totalRecipients: number }>>("/campaigns/" + id + "/send", {
      method: "POST",
      body: JSON.stringify(variables || {}),
    }),

  downloadExport: async (campaignId: string, response?: string, format = "xlsx") => {
    let url = API_URL + "/reports/" + campaignId + "/export?format=" + format;
    if (response) url += "&response=" + response;
    await downloadAuthed(url, `export.${format}`);
  },

  downloadDonorsExport: async (search?: string, brickStatus?: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (brickStatus) params.set("brickStatus", brickStatus);
    const qs = params.toString();
    await downloadAuthed(API_URL + "/donors/export" + (qs ? "?" + qs : ""), "donors.xlsx");
  },

  resetAllData: (confirm: string) =>
    request<ApiResponse<Record<string, number>>>("/admin/reset-data", {
      method: "POST",
      body: JSON.stringify({ confirm }),
    }),
};
