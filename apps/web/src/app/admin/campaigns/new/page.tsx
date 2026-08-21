"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function NewCampaignPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("attendance");
  const [templateId, setTemplateId] = useState("garbagudi_nirman_message");
  const [templateName, setTemplateName] = useState("garbagudi_nirman_message");

  const mutation = useMutation({
    mutationFn: () => api.createCampaign({ name, description, type, templateId, templateName }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      router.push("/admin/campaigns/" + res.data._id);
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Campaign</h1>

      <div className="bg-white rounded-lg border p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Garbha Gudi Attendance 2026"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="attendance">Attendance</option>
              <option value="fundraising">Fundraising</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gupshup Template ID</label>
            <input
              type="text"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="e.g. garbagudi_nirman_message"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name (for reference)</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. garbagudi_nirman_message"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {mutation.isError && (
          <div className="mt-4 text-red-600 text-sm">{(mutation.error as Error).message}</div>
        )}

        <div className="flex gap-2 mt-6">
          <button onClick={() => router.back()} className="px-4 py-2 border rounded text-sm">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name || mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}
