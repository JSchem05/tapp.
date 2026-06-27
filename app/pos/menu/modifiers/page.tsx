import { redirect } from "next/navigation";

export default function ModifiersRedirect() {
  redirect("/pos/menu?tab=modifiers");
}
