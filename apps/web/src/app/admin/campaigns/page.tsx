"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api.campaigns(),
  });

  const campaigns = (data?.data || []) as any[];
  const router = useRouter();
  const [deleting, setDeleting] = useState<any>(null);
  const [confirmText, setConfirmText] = useState("");

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCampaign(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      setDeleting(null);
      const { recipientsDeleted, donorsDeleted } = res.data;
      if (donorsDeleted > 0) {
        alert(`Campaign deleted. Also removed ${donorsDeleted} donor(s) who only belonged to this campaign (${recipientsDeleted} recipient records total).`);
      }
    },
  });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    ready: "bg-blue-100 text-blue-700",
    sending: "bg-purple-100 text-purple-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link
          href="/admin/campaigns/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> New Campaign
        </Link>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          No campaigns yet. Create your first campaign.
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <div
              key={c._id}
              onClick={() => router.push("/admin/campaigns/" + c._id)}
              className="bg-white rounded-lg border p-4 cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-sm text-gray-500">{c.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[c.status] || ""}`}>
                    {c.status}
                  </span>
                  <span className="text-sm text-gray-500">{c.totalRecipients} recipients</span>
                  {c.status !== "sending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmText("");
                        setDeleting(c);
                      }}
                      title="Delete campaign"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setDeleting(null)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-red-700 mb-2">Delete Campaign</h3>
            <p className="text-sm text-gray-600 mb-4">
              This permanently deletes <strong>{deleting.name}</strong> and all {deleting.totalRecipients} recipient
              records and response history for it. Donors who <em>only</em> belong to this campaign will also be
              deleted; donors who are part of another campaign too are kept. This cannot be undone.
              Type the campaign name to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={deleting.name}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
            />
            {deleteMutation.isError && (
              <div className="text-red-600 text-sm mb-4">{(deleteMutation.error as Error).message}</div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleting(null)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deleting._id)}
                disabled={confirmText !== deleting.name || deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
