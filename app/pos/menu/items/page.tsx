import { redirect } from "next/navigation";

export default function ItemsRedirect() {
  redirect("/pos?view=menu&tab=items");
}
