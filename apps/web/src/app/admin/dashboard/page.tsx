"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Megaphone, Users, CheckCircle, XCircle, Clock, Send } from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.dashboard(),
  });

  const stats = data?.data as any;

  if (isLoading) return <div className="text-gray-500">Loading dashboard...</div>;

  const c = stats?.campaign;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Donors" value={stats?.totalDonors || 0} icon={Users} color="blue" />
        <StatCard label="Active Campaigns" value={stats?.activeCampaigns || 0} icon={Megaphone} color="purple" />
        {c && (
          <>
            <StatCard label="Total Recipients" value={c.totalRecipients} icon={Users} color="indigo" />
            <StatCard label="Messages Sent" value={c.totalSent} icon={Send} color="cyan" />
          </>
        )}
      </div>

      {c && (
        <>
          <h2 className="text-lg font-semibold mb-4">{c.name} — Response Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="YES" value={c.totalYes} icon={CheckCircle} color="green" />
            <StatCard label="NO" value={c.totalNo} icon={XCircle} color="red" />
            <StatCard label="Pending" value={c.totalPending} icon={Clock} color="yellow" />
            <StatCard label="Delivered" value={c.totalDelivered} icon={CheckCircle} color="green" />
            <StatCard label="Failed" value={c.totalFailed} icon={XCircle} color="red" />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    cyan: "bg-cyan-50 text-cyan-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.blue}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}
