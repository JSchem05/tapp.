import { redirect } from "next/navigation";

export default function StaffReceiptsPage() {
  redirect("/staff?view=receipts");
}
