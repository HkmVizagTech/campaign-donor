"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

type ResponseFilter = "" | "yes" | "no" | "pending";

export default function ResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignId = params.id as string;

  const [page, setPage] = useState(1);
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["recipients", campaignId, page, responseFilter, debouncedSearch],
    queryFn: () => {
      const params: Record<string, string> = { page: String(page), limit: "20" };
      if (responseFilter) params.response = responseFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      return api.campaignRecipients(campaignId, params);
    },
    // Live updates arrive instantly over SSE (see useLiveUpdates in the admin
    // layout) — this poll is just a safety net if that connection drops.
    refetchInterval: 60000,
  });

  const recipients = (data?.data || []) as any[];
  const pagination = (data as any)?.pagination;

  const updateResponseMutation = useMutation({
    mutationFn: ({ recipientId, response }: { recipientId: string; response: string }) =>
      api.updateResponse(campaignId, recipientId, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
    },
  });

  const updateBrickMutation = useMutation({
    mutationFn: ({ recipientId, brickStatus }: { recipientId: string; brickStatus: string }) =>
      api.updateBrickStatus(campaignId, recipientId, brickStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients", campaignId] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setDebouncedSearch(search);
  };

  const responseBadge = (r: string) => {
    const colors: Record<string, string> = {
      yes: "bg-green-100 text-green-700",
      no: "bg-gray-100 text-gray-700",
      pending: "bg-yellow-100 text-yellow-700",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[r] || ""}`}>
        {r === "yes" ? "YES" : r === "no" ? "NO" : "PENDING"}
      </span>
    );
  };

  const brickBadge = (s: string) => {
    const labels: Record<string, string> = {
      not_required: "N/A",
      pending: "Pending",
      confirmed: "Confirmed",
      prepared: "Prepared",
      handed_over: "Handed Over",
    };
    const colors: Record<string, string> = {
      not_required: "bg-gray-100 text-gray-600",
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-blue-100 text-blue-700",
      prepared: "bg-purple-100 text-purple-700",
      handed_over: "bg-green-100 text-green-700",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[s] || ""}`}>
        {labels[s] || s}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-blue-600 text-sm mb-1">&larr; Back</button>
          <h1 className="text-2xl font-bold">Campaign Responses</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1">
          {(["", "yes", "no", "pending"] as ResponseFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setResponseFilter(f); setPage(1); }}
              className={`px-3 py-1 rounded text-sm ${
                responseFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "" ? "All" : f.toUpperCase()}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, donor ID..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
          />
          <button type="submit" className="px-3 py-1 border rounded text-sm">Search</button>
        </form>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Donor ID</th>
                  <th className="text-left px-4 py-3 font-medium">Response</th>
                  <th className="text-left px-4 py-3 font-medium">Brick</th>
                  <th className="text-left px-4 py-3 font-medium">Response Date</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recipients.map((r: any) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.donor?.name || "-"}</td>
                    <td className="px-4 py-3">{r.phone}</td>
                    <td className="px-4 py-3 text-gray-500">{r.donor?.donorId || "-"}</td>
                    <td className="px-4 py-3">{responseBadge(r.response)}</td>
                    <td className="px-4 py-3">{brickBadge(r.brickStatus)}</td>
                    <td className="px-4 py-3 text-gray-500">{r.responseAt ? new Date(r.responseAt).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {r.response !== "yes" && (
                          <button
                            onClick={() => updateResponseMutation.mutate({ recipientId: r._id, response: "yes" })}
                            className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100"
                          >
                            Set YES
                          </button>
                        )}
                        {r.response !== "no" && (
                          <button
                            onClick={() => updateResponseMutation.mutate({ recipientId: r._id, response: "no" })}
                            className="px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs hover:bg-gray-100"
                          >
                            Set NO
                          </button>
                        )}
                        <select
                          value={r.brickStatus}
                          onChange={(e) => updateBrickMutation.mutate({ recipientId: r._id, brickStatus: e.target.value })}
                          className="border rounded text-xs px-1 py-0.5"
                        >
                          <option value="not_required">N/A</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="prepared">Prepared</option>
                          <option value="handed_over">Handed Over</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {recipients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No recipients found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} recipients)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
