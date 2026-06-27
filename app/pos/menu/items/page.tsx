import { redirect } from "next/navigation";

export default function ItemsRedirect() {
  redirect("/pos/menu?tab=items");
}
