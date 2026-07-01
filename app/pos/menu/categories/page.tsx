import { redirect } from "next/navigation";

export default function CategoriesRedirect() {
  redirect("/pos?view=menu&tab=categories");
}
