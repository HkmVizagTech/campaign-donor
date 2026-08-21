"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertTriangle } from "lucide-react";

const CONFIRMATION_PHRASE = "DELETE ALL DATA";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const resetMutation = useMutation({
    mutationFn: () => api.resetAllData(confirmText),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setConfirmText("");
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setConfirmText("");
    resetMutation.reset();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-lg border border-red-200 p-6 max-w-lg">
        <div className="flex items-center gap-2 mb-2 text-red-700">
          <AlertTriangle size={20} />
          <h2 className="font-semibold">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Permanently deletes all donors, campaigns, recipients, import batches, and
          response history. Your admin login is not affected. This cannot be undone.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Reset All Data
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            {!resetMutation.isSuccess ? (
              <>
                <h3 className="text-lg font-semibold text-red-700 mb-2">Reset All Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This deletes every donor, campaign, recipient, import batch, and response
                  history record permanently. Type <strong>{CONFIRMATION_PHRASE}</strong> below to confirm.
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRMATION_PHRASE}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
                />
                {resetMutation.isError && (
                  <div className="text-red-600 text-sm mb-4">{(resetMutation.error as Error).message}</div>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={closeModal} className="px-4 py-2 border rounded text-sm">Cancel</button>
                  <button
                    onClick={() => resetMutation.mutate()}
                    disabled={confirmText !== CONFIRMATION_PHRASE || resetMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {resetMutation.isPending ? "Deleting..." : "Permanently Delete Everything"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-green-700 mb-2">Data Reset Complete</h3>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>Donors deleted: {(resetMutation.data as any)?.data?.donorsDeleted ?? 0}</li>
                  <li>Campaigns deleted: {(resetMutation.data as any)?.data?.campaignsDeleted ?? 0}</li>
                  <li>Recipients deleted: {(resetMutation.data as any)?.data?.recipientsDeleted ?? 0}</li>
                  <li>Import batches deleted: {(resetMutation.data as any)?.data?.importBatchesDeleted ?? 0}</li>
                  <li>Response history deleted: {(resetMutation.data as any)?.data?.responseHistoryDeleted ?? 0}</li>
                </ul>
                <div className="flex justify-end">
                  <button onClick={closeModal} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
