import { redirect } from "next/navigation";

export default function DashboardReceiptsPage() {
  redirect("/pos?view=receipts");
}
