"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Download } from "lucide-react";

export default function CampaignExportPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const download = async (response?: string, format = "xlsx") => {
    setError(null);
    setPending(true);
    try {
      await api.downloadExport(campaignId, response, format);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Export Campaign Data</h1>

      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">{error}</div>
      )}

      <div className="grid md:grid-cols-2 gap-4 max-w-xl">
        <ExportCard
          title="YES Donors"
          description="Export donors who responded YES"
          onExportXlsx={() => download("yes", "xlsx")}
          onExportCsv={() => download("yes", "csv")}
          color="green"
          disabled={pending}
        />
        <ExportCard
          title="NO Donors"
          description="Export donors who responded NO"
          onExportXlsx={() => download("no", "xlsx")}
          onExportCsv={() => download("no", "csv")}
          color="red"
          disabled={pending}
        />
        <ExportCard
          title="Pending Donors"
          description="Export donors who haven't responded"
          onExportXlsx={() => download("pending", "xlsx")}
          onExportCsv={() => download("pending", "csv")}
          color="yellow"
          disabled={pending}
        />
        <ExportCard
          title="All Donors"
          description="Export all campaign recipients"
          onExportXlsx={() => download(undefined, "xlsx")}
          onExportCsv={() => download(undefined, "csv")}
          color="blue"
          disabled={pending}
        />
      </div>
    </div>
  );
}

function ExportCard({
  title,
  description,
  onExportXlsx,
  onExportCsv,
  color,
  disabled,
}: {
  title: string;
  description: string;
  onExportXlsx: () => void;
  onExportCsv: () => void;
  color: string;
  disabled?: boolean;
}) {
  const borderColors: Record<string, string> = {
    green: "border-t-green-500",
    red: "border-t-red-500",
    yellow: "border-t-yellow-500",
    blue: "border-t-blue-500",
  };

  return (
    <div className={`bg-white rounded-lg border border-t-4 ${borderColors[color]} p-4`}>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <div className="flex gap-2">
        <button
          onClick={onExportXlsx}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          <Download size={14} /> Excel
        </button>
        <button
          onClick={onExportCsv}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <Download size={14} /> CSV
        </button>
      </div>
    </div>
  );
}
