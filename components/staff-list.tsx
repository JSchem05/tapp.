import { deleteStaffMember } from "@/app/dashboard/actions";
import { CopyButton } from "@/components/copy-button";
import type { Staff } from "@/lib/types";

export function StaffList({ staff }: { staff: Staff[] }) {
  if (staff.length === 0) {
    return <p className="text-sm text-muted">No staff added yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-line">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => {
            const code = String(member.code ?? "").trim();
            return (
              <tr key={member.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-semibold text-ink">{member.name}</td>
                <td className="px-4 py-3">
                  {code ? (
                    <span
                      className="inline-block rounded-[8px] border border-line bg-[#F3F4F6] px-3 py-1.5 font-mono text-base font-bold tracking-[0.18em] text-ink"
                      aria-label={`Staff code ${code}`}
                    >
                      {code}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-red-600">
                      Missing — remove and re-add
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {code ? <CopyButton value={code} /> : null}
                    <form action={deleteStaffMember}>
                      <input type="hidden" name="staff_id" value={member.id} />
                      <button className="rounded-[8px] border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-[#FAFAFA]">
                        Remove
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-line bg-[#FAFAFA] px-4 py-2 text-xs text-muted">
        Staff sign in at <span className="font-semibold text-ink">/device</span> with their code.
      </p>
    </div>
  );
}
