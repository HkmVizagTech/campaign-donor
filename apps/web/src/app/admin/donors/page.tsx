"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const BRICK_LABELS: Record<string, string> = {
  not_required: "N/A",
  pending: "Pending",
  confirmed: "Confirmed",
  prepared: "Prepared",
  handed_over: "Handed Over",
};

const BRICK_COLORS: Record<string, string> = {
  not_required: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  prepared: "bg-purple-100 text-purple-700",
  handed_over: "bg-green-100 text-green-700",
};

type BrickFilter = "" | "pending" | "confirmed" | "prepared" | "handed_over";

export default function DonorsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [brickFilter, setBrickFilter] = useState<BrickFilter>("");

  const { data, isLoading } = useQuery({
    queryKey: ["donors", page, debouncedSearch, brickFilter],
    queryFn: () =>
      api.donors({
        page: String(page), limit: "20", search: debouncedSearch,
        ...(brickFilter ? { brickStatus: brickFilter } : {}),
      }),
  });

  const donors = (data?.data || []) as any[];
  const pagination = (data as any)?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setDebouncedSearch(search);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Donors</h1>
        <Link
          href="/admin/donors/import"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Import Donors
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or donor ID..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-200">
          Search
        </button>
      </form>

      <div className="flex gap-1 mb-4">
        <span className="text-xs text-gray-500 self-center mr-1">Brick:</span>
        {(["", "pending", "confirmed", "prepared", "handed_over"] as BrickFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => { setBrickFilter(f); setPage(1); }}
            className={`px-3 py-1 rounded text-sm ${
              brickFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f === "" ? "All" : BRICK_LABELS[f]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Donor ID</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Seva Category</th>
                  <th className="text-left px-4 py-3 font-medium">Brick No</th>
                  <th className="text-left px-4 py-3 font-medium">Brick Status</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {donors.map((d: any) => (
                  <tr
                    key={d._id}
                    onClick={() => router.push("/admin/donors/" + d._id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-500">{d.donorId || "-"}</td>
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3">{d.phone}</td>
                    <td className="px-4 py-3">{d.sevaCategory || "-"}</td>
                    <td className="px-4 py-3">{d.brickName || "-"}</td>
                    <td className="px-4 py-3">
                      {d.brickStatus ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${BRICK_COLORS[d.brickStatus] || ""}`}>
                          {BRICK_LABELS[d.brickStatus] || d.brickStatus}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3">{d.donationAmount ? "Rs. " + d.donationAmount.toLocaleString() : "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{d.source || "-"}</td>
                  </tr>
                ))}
                {donors.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No donors found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} donors)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
