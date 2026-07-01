import { redirect } from "next/navigation";

export default function ModifiersRedirect() {
  redirect("/pos?view=menu&tab=modifiers");
}
