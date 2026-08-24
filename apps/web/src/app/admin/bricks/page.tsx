"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, CheckCircle, PlusCircle, LogIn } from "lucide-react";

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

type StatusFilter = "" | "pending" | "confirmed" | "prepared" | "handed_over";
type EntryFilter = "" | "true" | "false";

export default function BrickCounterPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [entryFilter, setEntryFilter] = useState<EntryFilter>("");
  const [issuingFor, setIssuingFor] = useState<any>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["brickSearch", searchTerm, statusFilter, entryFilter],
    queryFn: () =>
      api.searchRecipients(
        searchTerm || undefined,
        statusFilter || undefined,
        entryFilter === "" ? undefined : entryFilter === "true"
      ),
  });

  const results = (data?.data || []) as any[];

  const updateBrickMutation = useMutation({
    mutationFn: ({ campaignId, recipientId, brickStatus }: { campaignId: string; recipientId: string; brickStatus: string }) =>
      api.updateBrickStatus(campaignId, recipientId, brickStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brickSearch"] }),
  });

  const checkInMutation = useMutation({
    mutationFn: ({ campaignId, recipientId, checkedIn }: { campaignId: string; recipientId: string; checkedIn: boolean }) =>
      api.checkInRecipient(campaignId, recipientId, checkedIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brickSearch"] }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query.trim());
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Brick Counter</h1>
      <p className="text-gray-600 mb-6">
        Search by phone number, donor name, or donor ID to find a patron — give them entry and mark their
        brick handed over. Showing recently updated records by default.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4 max-w-xl">
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
          disabled={isFetching}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Search size={18} />
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1">
          <span className="text-xs text-gray-500 self-center mr-1">Entry:</span>
          {(["", "false", "true"] as EntryFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setEntryFilter(f)}
              className={`px-3 py-1 rounded text-sm ${
                entryFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "" ? "All" : f === "true" ? "Checked In" : "Not Checked In"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <span className="text-xs text-gray-500 self-center mr-1">Brick:</span>
          {(["", "pending", "confirmed", "prepared", "handed_over"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded text-sm ${
                statusFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "" ? "All" : BRICK_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="text-gray-500">Loading...</div>}

      {!isLoading && results.length === 0 && <div className="text-gray-500">No matching records found.</div>}

      <div className="space-y-3 max-w-2xl">
        {results.map((r) => (
          <div key={r._id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-lg">{r.donor?.name || "-"}</div>
                <div className="text-sm text-gray-500">
                  {r.phone} &middot; {r.donor?.donorId || "-"}
                  {r.donor?.brickName && <> &middot; Brick: {r.donor.brickName}</>}
                  {r.donor?.sevaCategory && <> &middot; {r.donor.sevaCategory}</>}
                </div>
                <div className="text-xs text-gray-400 mt-1">Campaign: {r.campaign?.name || "-"}</div>
              </div>

              <div className="shrink-0">
                {r.checkedIn ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-green-700 text-sm font-medium px-3 py-2 bg-green-50 rounded">
                      <CheckCircle size={16} /> Checked In
                      {r.checkedInAt && (
                        <span className="text-xs text-gray-400">
                          ({new Date(r.checkedInAt).toLocaleTimeString()})
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() =>
                        checkInMutation.mutate({ campaignId: r.campaignId, recipientId: r._id, checkedIn: false })
                      }
                      disabled={checkInMutation.isPending}
                      className="text-xs text-gray-400 hover:text-red-600 underline"
                    >
                      Undo
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      checkInMutation.mutate({ campaignId: r.campaignId, recipientId: r._id, checkedIn: true })
                    }
                    disabled={checkInMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    <LogIn size={16} /> Give Entry
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
              <span className={`px-2 py-1 rounded text-xs font-medium ${BRICK_COLORS[r.brickStatus] || ""}`}>
                {BRICK_LABELS[r.brickStatus] || r.brickStatus}
              </span>

              {r.brickStatus === "handed_over" ? (
                <span className="flex items-center gap-1 text-green-700 text-sm font-medium px-2">
                  <CheckCircle size={16} /> Handed Over
                </span>
              ) : (
                <button
                  onClick={() =>
                    updateBrickMutation.mutate({ campaignId: r.campaignId, recipientId: r._id, brickStatus: "handed_over" })
                  }
                  disabled={updateBrickMutation.isPending}
                  className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
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

              <button
                onClick={() => setIssuingFor(r)}
                title="Issue an additional brick"
                className="flex items-center gap-1 px-3 py-2 border rounded text-sm hover:bg-gray-50 whitespace-nowrap"
              >
                <PlusCircle size={14} /> Extra Brick
              </button>
            </div>
          </div>
        ))}
      </div>

      {updateBrickMutation.isError && (
        <div className="text-red-600 text-sm mt-4">{(updateBrickMutation.error as Error).message}</div>
      )}

      {checkInMutation.isError && (
        <div className="text-red-600 text-sm mt-4">{(checkInMutation.error as Error).message}</div>
      )}

      {issuingFor && (
        <IssueBrickModal recipient={issuingFor} onClose={() => setIssuingFor(null)} />
      )}
    </div>
  );
}

function IssueBrickModal({ recipient, onClose }: { recipient: any; onClose: () => void }) {
  const isPatron = (recipient.donor?.sevaCategory || "").toLowerCase().includes("patron");
  const [type, setType] = useState<"free" | "paid">(isPatron ? "free" : "paid");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amount, setAmount] = useState("");

  const issueMutation = useMutation({
    mutationFn: () =>
      api.issueBrick(recipient.donor._id, {
        type,
        referenceNumber,
        amount: type === "paid" && amount ? Number(amount) : undefined,
      }),
  });

  if (issueMutation.isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
          <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
          <p className="font-medium mb-4">Brick issued to {recipient.donor?.name}.</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-1">Issue Additional Brick</h3>
        <p className="text-sm text-gray-600 mb-4">{recipient.donor?.name} &middot; {recipient.phone}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType("free")}
                className={`flex-1 px-3 py-2 rounded text-sm border ${
                  type === "free" ? "bg-green-600 text-white border-green-600" : "hover:bg-gray-50"
                }`}
              >
                Free (Patron)
              </button>
              <button
                onClick={() => setType("paid")}
                className={`flex-1 px-3 py-2 rounded text-sm border ${
                  type === "paid" ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"
                }`}
              >
                Paid (Regular)
              </button>
            </div>
            {isPatron && (
              <p className="text-xs text-gray-400 mt-1">Defaulted to Free based on Seva Category ({recipient.donor?.sevaCategory}) — change if needed.</p>
            )}
          </div>

          {type === "paid" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (optional)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number *</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Receipt / payment reference"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        {issueMutation.isError && (
          <div className="text-red-600 text-sm mt-4">{(issueMutation.error as Error).message}</div>
        )}

        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded text-sm">Cancel</button>
          <button
            onClick={() => issueMutation.mutate()}
            disabled={!referenceNumber.trim() || issueMutation.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {issueMutation.isPending ? "Issuing..." : "Issue Brick"}
          </button>
        </div>
      </div>
    </div>
  );
}
