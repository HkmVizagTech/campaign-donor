"use client";

import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Download } from "lucide-react";

export default function CampaignExportPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const download = (response?: string, format = "xlsx") => {
    const url = api.exportUrl(campaignId, response, format);
    window.open(url, "_blank");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Export Campaign Data</h1>

      <div className="grid md:grid-cols-2 gap-4 max-w-xl">
        <ExportCard
          title="YES Donors"
          description="Export donors who responded YES"
          onExportXlsx={() => download("yes", "xlsx")}
          onExportCsv={() => download("yes", "csv")}
          color="green"
        />
        <ExportCard
          title="NO Donors"
          description="Export donors who responded NO"
          onExportXlsx={() => download("no", "xlsx")}
          onExportCsv={() => download("no", "csv")}
          color="red"
        />
        <ExportCard
          title="Pending Donors"
          description="Export donors who haven't responded"
          onExportXlsx={() => download("pending", "xlsx")}
          onExportCsv={() => download("pending", "csv")}
          color="yellow"
        />
        <ExportCard
          title="All Donors"
          description="Export all campaign recipients"
          onExportXlsx={() => download(undefined, "xlsx")}
          onExportCsv={() => download(undefined, "csv")}
          color="blue"
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
}: {
  title: string;
  description: string;
  onExportXlsx: () => void;
  onExportCsv: () => void;
  color: string;
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
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          <Download size={14} /> Excel
        </button>
        <button
          onClick={onExportCsv}
          className="flex items-center gap-1 px-3 py-1 border rounded text-sm hover:bg-gray-50"
        >
          <Download size={14} /> CSV
        </button>
      </div>
    </div>
  );
}
