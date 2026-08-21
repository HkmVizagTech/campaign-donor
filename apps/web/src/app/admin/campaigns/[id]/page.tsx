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
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendVars, setSendVars] = useState({ headerImageUrl: "", eventDate: "", eventTime: "", programItem: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api.campaign(id),
    // Live updates arrive instantly over SSE (see useLiveUpdates in the admin
    // layout) — this poll is just a safety net if that connection drops.
    refetchInterval: 60000,
  });

  const campaign = (data?.data || {}) as any;

  const sendMutation = useMutation({
    mutationFn: () => api.sendCampaign(id, sendVars),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      setSendModalOpen(false);
      alert(`Sending started for ${res.data.totalRecipients} recipients. Stats will update as messages go out.`);
    },
  });

  const openSendModal = () => {
    setSendVars({
      headerImageUrl: campaign.headerImageUrl || "",
      eventDate: campaign.eventDate || "",
      eventTime: campaign.eventTime || "",
      programItem: campaign.programItem || "",
    });
    setSendModalOpen(true);
  };

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
          {campaign.status === "draft" && campaign.totalRecipients === 0 && (
            <Link
              href="/admin/donors/import"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Import Donors
            </Link>
          )}
          {(campaign.status === "draft" || campaign.status === "ready") && campaign.totalRecipients > 0 && (
            <button
              onClick={openSendModal}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Send Messages
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

      {/* Send Messages Modal */}
      {sendModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-1">Send Messages</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sending to {campaign.totalRecipients} recipients. Fill in the message details below.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header Image URL</label>
                <input
                  type="text"
                  value={sendVars.headerImageUrl}
                  onChange={(e) => setSendVars({ ...sendVars, headerImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <input
                  type="text"
                  value={sendVars.eventDate}
                  onChange={(e) => setSendVars({ ...sendVars, eventDate: e.target.value })}
                  placeholder="e.g. 24th August 2026"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                <input
                  type="text"
                  value={sendVars.eventTime}
                  onChange={(e) => setSendVars({ ...sendVars, eventTime: e.target.value })}
                  placeholder="e.g. 5:00 PM"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Item</label>
                <input
                  type="text"
                  value={sendVars.programItem}
                  onChange={(e) => setSendVars({ ...sendVars, programItem: e.target.value })}
                  placeholder="e.g. Bhoomi Puja & Shilanyas"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            {sendMutation.isError && (
              <div className="text-red-600 text-sm mt-4">{(sendMutation.error as Error).message}</div>
            )}

            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setSendModalOpen(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              <button
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {sendMutation.isPending ? "Starting..." : `Send to ${campaign.totalRecipients}`}
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
