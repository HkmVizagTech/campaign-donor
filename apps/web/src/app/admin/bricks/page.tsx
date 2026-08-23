"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, CheckCircle } from "lucide-react";

const BRICK_LABELS: Record<string, string> = {
  not_required: "N/A",
  pending: "Pending",
  confirmed: "Confirmed",
  prepared: "Prepared",
  handed_over: "Handed Over",
};

const BRICK_COLORS: Record<string, string> = {
  not_required: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  prepared: "bg-purple-100 text-purple-700",
  handed_over: "bg-green-100 text-green-700",
};

export default function BrickCounterPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const searchMutation = useMutation({
    mutationFn: (q: string) => api.searchRecipients(q),
    onSuccess: (res: any) => {
      setResults(res.data || []);
      setSearched(true);
    },
  });

  const updateBrickMutation = useMutation({
    mutationFn: ({ campaignId, recipientId, brickStatus }: { campaignId: string; recipientId: string; brickStatus: string }) =>
      api.updateBrickStatus(campaignId, recipientId, brickStatus),
    onSuccess: (_res, variables) => {
      setResults((prev) =>
        prev.map((r) => (r._id === variables.recipientId ? { ...r, brickStatus: variables.brickStatus } : r))
      );
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) searchMutation.mutate(query.trim());
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Brick Counter</h1>
      <p className="text-gray-600 mb-6">
        Search by phone number, donor name, or donor ID to find a patron and mark their brick handed over.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-xl">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search phone, name, or donor ID..."
          className="flex-1 border border-gray-300 rounded-md px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!query.trim() || searchMutation.isPending}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Search size={18} />
          Search
        </button>
      </form>

      {searchMutation.isPending && <div className="text-gray-500">Searching...</div>}

      {searchMutation.isError && (
        <div className="text-red-600 text-sm">{(searchMutation.error as Error).message}</div>
      )}

      {searched && !searchMutation.isPending && results.length === 0 && (
        <div className="text-gray-500">No matching donor found.</div>
      )}

      <div className="space-y-3 max-w-2xl">
        {results.map((r) => (
          <div key={r._id} className="bg-white rounded-lg border p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-semibold text-lg">{r.donor?.name || "-"}</div>
              <div className="text-sm text-gray-500">
                {r.phone} &middot; {r.donor?.donorId || "-"}
                {r.donor?.brickName && <> &middot; Brick: {r.donor.brickName}</>}
              </div>
              <div className="text-xs text-gray-400 mt-1">Campaign: {r.campaign?.name || "-"}</div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2 py-1 rounded text-xs font-medium ${BRICK_COLORS[r.brickStatus] || ""}`}>
                {BRICK_LABELS[r.brickStatus] || r.brickStatus}
              </span>

              {r.brickStatus === "handed_over" ? (
                <span className="flex items-center gap-1 text-green-700 text-sm font-medium px-3 py-2">
                  <CheckCircle size={16} /> Handed Over
                </span>
              ) : (
                <button
                  onClick={() =>
                    updateBrickMutation.mutate({ campaignId: r.campaignId, recipientId: r._id, brickStatus: "handed_over" })
                  }
                  disabled={updateBrickMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Mark Handed Over
                </button>
              )}

              <select
                value={r.brickStatus}
                onChange={(e) =>
                  updateBrickMutation.mutate({ campaignId: r.campaignId, recipientId: r._id, brickStatus: e.target.value })
                }
                className="border rounded text-xs px-2 py-2"
              >
                <option value="not_required">N/A</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="prepared">Prepared</option>
                <option value="handed_over">Handed Over</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {updateBrickMutation.isError && (
        <div className="text-red-600 text-sm mt-4">{(updateBrickMutation.error as Error).message}</div>
      )}
    </div>
  );
}
