import { redirect } from "next/navigation";

export default function CategoriesRedirect() {
  redirect("/pos/menu?tab=categories");
}
