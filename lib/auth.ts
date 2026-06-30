import { getOwnerContext } from "@/lib/merchant-context";

export async function getAuthedMerchant() {
  return getOwnerContext();
}
