"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle, XCircle, Clock, Users, Send } from "lucide-react";
import Link from "next/link";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [addingDonors, setAddingDonors] = useState(false);
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api.campaign(id),
    // Live updates arrive instantly over SSE (see useLiveUpdates in the admin
    // layout) — this poll is just a safety net if that connection drops.
    refetchInterval: 60000,
  });

  const campaign = (data?.data || {}) as any;

  const addAllMutation = useMutation({
    mutationFn: () => api.addRecipients(id, { addAll: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      setAddingDonors(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => api.sendCampaign(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      setSending(false);
      alert(`Sending started for ${res.data.totalRecipients} recipients. Stats will update as messages go out.`);
    },
    onError: (err: Error) => {
      setSending(false);
      alert("Send failed: " + err.message);
    },
  });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    ready: "bg-blue-100 text-blue-700",
    sending: "bg-purple-100 text-purple-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    active: "bg-blue-100 text-blue-700",
  };

  if (isLoading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-blue-600 text-sm mb-1">&larr; Back</button>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[campaign.status] || ""}`}>
              {campaign.status}
            </span>
            <span className="text-sm text-gray-500">Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
          </div>
          {campaign.description && <p className="text-gray-600 mt-2">{campaign.description}</p>}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/campaigns/${id}/responses`}
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
          >
            View Responses
          </Link>
          <Link
            href={`/admin/campaigns/${id}/export`}
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
          >
            Export
          </Link>
          {campaign.status === "draft" && (
            <button
              onClick={() => setAddingDonors(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Add Donors
            </button>
          )}
          {(campaign.status === "draft" || campaign.status === "ready") && campaign.totalRecipients > 0 && (
            <button
              onClick={() => {
                if (confirm(`Send WhatsApp messages to ${campaign.totalRecipients} recipients?`)) {
                  setSending(true);
                  sendMutation.mutate();
                }
              }}
              disabled={sending || sendMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Messages"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Recipients" value={campaign.totalRecipients} />
        <StatCard label="Sent" value={campaign.totalSent} icon={<Send size={16} />} />
        <StatCard label="Delivered" value={campaign.totalDelivered} icon={<CheckCircle size={16} className="text-green-500" />} />
        <StatCard label="Failed" value={campaign.totalFailed} icon={<XCircle size={16} className="text-red-500" />} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="YES" value={campaign.totalYes} accent="green" />
        <StatCard label="NO" value={campaign.totalNo} accent="red" />
        <StatCard label="Pending" value={campaign.totalPending} accent="yellow" />
      </div>

      {/* Add Donors Modal */}
      {addingDonors && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Donors to Campaign</h3>
            <p className="text-sm text-gray-600 mb-6">
              Add all donors from the database to this campaign. Each donor will receive a pending status.
            </p>
            {addAllMutation.isError && (
              <div className="text-red-600 text-sm mb-4">{(addAllMutation.error as Error).message}</div>
            )}
            {addAllMutation.isSuccess && (
              <div className="text-green-600 text-sm mb-4">
                Added {(addAllMutation.data as any)?.data?.inserted || 0} recipients
                {(addAllMutation.data as any)?.data?.duplicatePhonesSkipped > 0 &&
                  ` (skipped ${(addAllMutation.data as any).data.duplicatePhonesSkipped} duplicate phone numbers)`}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddingDonors(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              <button
                onClick={() => addAllMutation.mutate()}
                disabled={addAllMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {addAllMutation.isPending ? "Adding..." : "Add All Donors"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon?: React.ReactNode; accent?: string }) {
  const accentColors: Record<string, string> = {
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50",
    yellow: "text-yellow-600 bg-yellow-50",
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className={`text-2xl font-bold ${accent ? accentColors[accent]?.split(" ")[0] : ""}`}>{value.toLocaleString()}</span>
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}
