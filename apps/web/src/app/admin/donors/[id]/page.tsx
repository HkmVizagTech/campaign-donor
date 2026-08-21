"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function DonorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["donor", id],
    queryFn: () => api.donor(id),
  });

  const donor = (data?.data || {}) as any;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: (data: unknown) => api.updateDonor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donor", id] });
      setEditing(false);
    },
  });

  const startEdit = () => {
    setForm({
      name: donor.name || "",
      phone: donor.phone || "",
      email: donor.email || "",
      address: donor.address || "",
      sevaCategory: donor.sevaCategory || "",
      brickName: donor.brickName || "",
      donationAmount: donor.donationAmount?.toString() || "",
      donationReference: donor.donationReference || "",
      notes: donor.notes || "",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    const payload: any = { ...form };
    if (payload.donationAmount) payload.donationAmount = Number(payload.donationAmount);
    updateMutation.mutate(payload);
  };

  if (isLoading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-blue-600 text-sm mb-1">&larr; Back</button>
          <h1 className="text-2xl font-bold">{donor.name}</h1>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                Save
              </button>
            </>
          ) : (
            <button onClick={startEdit} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">
              Edit Donor
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Personal Information</h2>
          <div className="space-y-3 text-sm">
            <Field label="Donor ID" value={donor.donorId || "-"} />
            <Field label="Name" value={editing ? form.name : donor.name} editing={editing} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Phone" value={editing ? form.phone : donor.phone} editing={editing} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Seva Category" value={editing ? form.sevaCategory : donor.sevaCategory || "-"} editing={editing} onChange={(v) => setForm({ ...form, sevaCategory: v })} />
            <Field label="Email" value={editing ? form.email : donor.email || "-"} editing={editing} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Address" value={editing ? form.address : donor.address || "-"} editing={editing} onChange={(v) => setForm({ ...form, address: v })} />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Donation Information</h2>
          <div className="space-y-3 text-sm">
            <Field label="Brick No" value={editing ? form.brickName : donor.brickName || "-"} editing={editing} onChange={(v) => setForm({ ...form, brickName: v })} />
            <Field label="Donation Amount" value={editing ? form.donationAmount : donor.donationAmount ? "Rs. " + donor.donationAmount.toLocaleString() : "-"} editing={editing} onChange={(v) => setForm({ ...form, donationAmount: v })} />
            <Field label="Donation Reference" value={editing ? form.donationReference : donor.donationReference || "-"} editing={editing} onChange={(v) => setForm({ ...form, donationReference: v })} />
            <Field label="Notes" value={editing ? form.notes : donor.notes || "-"} editing={editing} onChange={(v) => setForm({ ...form, notes: v })} />
            <div className="pt-2">
              <span className="text-gray-500">Source: </span>
              <span>{donor.source || "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, editing, onChange }: { label: string; value: string; editing?: boolean; onChange?: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 w-32 shrink-0">{label}:</span>
      {editing && onChange !== undefined ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}
