"use client";

import { createRestaurantTable, toggleRestaurantTableStatus } from "@/app/pos/actions";
import type { OpenTableOrder, RestaurantTable } from "@/lib/types";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export function PosTablesView({
  tables,
  openOrders,
  staffById,
  onOpenTableOrder
}: {
  tables: RestaurantTable[];
  openOrders: OpenTableOrder[];
  staffById: Record<string, string>;
  onOpenTableOrder: (order: OpenTableOrder) => void;
}) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [tableName, setTableName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const openOrderByTableId = useMemo(
    () => new Map(openOrders.map((order) => [order.table_id, order])),
    [openOrders]
  );

  function handleToggle(table: RestaurantTable) {
    const openOrder = openOrderByTableId.get(table.id);
    if (openOrder) {
      onOpenTableOrder(openOrder);
      return;
    }

    startTransition(async () => {
      try {
        setError("");
        await toggleRestaurantTableStatus(table.id);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update table.");
      }
    });
  }

  function handleAddTable() {
    startTransition(async () => {
      try {
        setError("");
        await createRestaurantTable(tableName);
        setTableName("");
        setShowAddForm(false);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not add table.");
      }
    });
  }

  return (
    <div className="h-full overflow-y-auto bg-cream px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-[20px] font-semibold text-ink">Tables</h1>
        <button
          type="button"
          onClick={() => setShowAddForm((open) => !open)}
          className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-ink px-4 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          Add table
        </button>
      </div>

      {showAddForm ? (
        <div className="mb-6 flex items-center gap-2 rounded-[12px] border border-line bg-white p-4">
          <input
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
            placeholder="Table name"
            className="h-10 min-w-0 flex-1 rounded-[10px] border border-line px-3 text-sm outline-none focus:border-blue"
          />
          <button
            type="button"
            disabled={isPending || !tableName.trim()}
            onClick={handleAddTable}
            className="h-10 rounded-[10px] bg-blue px-4 text-sm font-bold text-white disabled:opacity-40"
          >
            Add
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-[10px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        {tables.map((table) => {
          const openOrder = openOrderByTableId.get(table.id);
          const occupied = table.status === "occupied" || Boolean(openOrder);
          const elapsed = openOrder ? formatElapsed(openOrder.created_at) : null;
          const staffName = openOrder?.staff_id
            ? staffById[openOrder.staff_id] ?? "Staff"
            : null;

          return (
            <button
              key={table.id}
              type="button"
              disabled={isPending}
              onClick={() => handleToggle(table)}
              className="rounded-[12px] border border-line bg-white p-4 text-left transition hover:shadow-soft"
            >
              <p className="text-[15px] font-semibold text-ink">{table.name}</p>
              {occupied ? (
                <>
                  <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                    Occupied
                  </span>
                  {staffName && elapsed ? (
                    <p className="mt-2 text-xs text-muted">
                      {formatStaffShortName(staffName)} · {elapsed}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-2 text-xs font-semibold text-muted">Free</p>
              )}
            </button>
          );
        })}
      </div>

      {tables.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">
          No tables yet. Add your first table to start tracking.
        </p>
      ) : null}
    </div>
  );
}

function formatElapsed(createdAt: string) {
  const minutes = Math.max(1, Math.round((Date.now() - Date.parse(createdAt)) / 60000));
  return `${minutes} min`;
}

function formatStaffShortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Staff";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
