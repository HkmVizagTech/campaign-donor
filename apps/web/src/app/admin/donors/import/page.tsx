"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Upload, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

type Step = "upload" | "map" | "preview" | "result";

export default function ImportDonorsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({
    donorId: "",
    name: "",
    phone: "",
    sevaCategory: "",
    brickName: "",
  });
  const [result, setResult] = useState<any>(null);

  const previewMutation = useMutation({
    mutationFn: (formData: FormData) => api.previewImport(formData),
    onSuccess: (res) => {
      const d = res.data!;
      setHeaders(d.headers);
      setRows(d.rows.slice(0, 5));
      setTotalRows(d.totalRows);
      setStep("map");
    },
  });

  const importMutation = useMutation({
    mutationFn: (formData: FormData) => api.importDonors(formData),
    onSuccess: (res) => {
      setResult(res.data);
      setStep("result");
      queryClient.invalidateQueries({ queryKey: ["donors"] });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const formData = new FormData();
    formData.append("file", f);
    previewMutation.mutate(formData);
  };

  const handleImport = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));
    importMutation.mutate(formData);
  };

  const requiredFields = ["name", "phone"];
  const fieldLabels: Record<string, string> = {
    donorId: "Donor ID",
    name: "Name",
    phone: "Phone",
    sevaCategory: "Seva Category",
    brickName: "Brick No",
  };

  const downloadSampleTemplate = () => {
    const sampleHeaders = ["donorId", "name", "phone", "sevaCategory", "brickName"];
    const sampleRow = ["DONOR-A1B2C3D4", "Rajesh Kumar", "9876543210", "Annadanam Seva", "B12"];
    const escape = (v: string) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
    const csv = [sampleHeaders.join(","), sampleRow.map(escape).join(",")].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donor-import-sample.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Import Donors</h1>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {(["upload", "map", "result"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? "bg-blue-600 text-white" : i < ["upload", "map", "result"].indexOf(step) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {i < ["upload", "map", "result"].indexOf(step) ? "✓" : i + 1}
            </div>
            <span className="text-sm capitalize hidden sm:inline">{s === "map" ? "Map Columns" : s}</span>
            {i < 2 && <ArrowRight size={16} className="text-gray-400" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Upload your Excel or CSV file with donor data</p>
          <p className="text-xs text-gray-400 mb-4">Supported: .xlsx, .xls, .csv</p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="block mx-auto text-sm"
          />
          {previewMutation.isError && (
            <div className="mt-4 text-red-600 text-sm">{(previewMutation.error as Error).message}</div>
          )}
          <button
            onClick={downloadSampleTemplate}
            className="mt-6 text-sm text-blue-600 hover:underline"
          >
            Download sample template (CSV)
          </button>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === "map" && (
        <div>
          <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4 text-sm">
            File has {totalRows} rows. Map your columns to donor fields. Name and Phone are required.
          </div>

          <div className="bg-white rounded-lg border p-6 mb-4">
            <h2 className="font-semibold mb-4">Column Mapping</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.keys(mapping).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {fieldLabels[field] || field} {requiredFields.includes(field) && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={mapping[field]}
                    onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">-- Not mapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg border overflow-hidden mb-4">
            <div className="px-4 py-2 border-b bg-gray-50 text-sm font-medium">Preview (first 5 rows)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 whitespace-nowrap">{String(row[h] || "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep("upload")} className="px-4 py-2 border rounded text-sm">Back</button>
            <button
              onClick={handleImport}
              disabled={!mapping.name || !mapping.phone || importMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {importMutation.isPending ? "Importing..." : "Import Donors"}
            </button>
          </div>

          {importMutation.isError && (
            <div className="mt-4 text-red-600 text-sm">{(importMutation.error as Error).message}</div>
          )}
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && result && (
        <div className="bg-white rounded-lg border p-6">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-lg font-semibold text-center mb-4">Import Complete</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">{result.summary.totalRows}</div>
              <div className="text-sm text-gray-500">Total Rows</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-700">{result.summary.inserted}</div>
              <div className="text-sm text-gray-500">Imported</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-700">{result.summary.duplicates}</div>
              <div className="text-sm text-gray-500">Duplicates</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-700">{result.summary.failed}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <button onClick={() => router.push("/admin/donors")} className="px-4 py-2 border rounded text-sm">
              View Donors
            </button>
            <button onClick={() => { setStep("upload"); setFile(null); setResult(null); }} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
