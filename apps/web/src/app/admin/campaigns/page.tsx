"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function CampaignsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api.campaigns(),
  });

  const campaigns = (data?.data || []) as any[];
  const router = useRouter();

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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
