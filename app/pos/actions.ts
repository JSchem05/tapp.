"use server";

import { getMerchantAccessContext } from "@/lib/merchant-context";
import { calculateReceiptTotals, roundMoney } from "@/lib/money";
import type { PosOrderItem } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type CompleteOrderInput = {
  tagId: string;
  items: PosOrderItem[];
  paymentMethod: "card" | "cash";
  status?: "open" | "completed";
};

function normalizeOrderItems(items: PosOrderItem[]) {
  return items
    .map((item) => ({
      item_id: String(item.item_id),
      name: String(item.name).trim(),
      qty: Number(item.qty),
      price: roundMoney(Number(item.price)),
      modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
      comment: String(item.comment ?? "").trim()
    }))
    .filter((item) => item.item_id && item.name && item.qty > 0 && item.price >= 0);
}

function totalsForOrder(items: PosOrderItem[]) {
  const receiptItems = items.map((item) => ({
    name: item.name,
    qty: item.qty,
    price: item.price + item.modifiers.reduce((sum, mod) => sum + mod.price_delta, 0)
  }));
  return calculateReceiptTotals(receiptItems);
}

function menuPath(staff: { id: string } | null, suffix = "") {
  return `${staff ? "/staff/menu" : "/pos/menu"}${suffix}`;
}

function revalidateMenuPaths() {
  revalidatePath("/pos/menu");
  revalidatePath("/staff/menu");
}

export async function completePosOrder(input: CompleteOrderInput) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const items = normalizeOrderItems(input.items);
  const status = input.status ?? "completed";
  const staffId = staff?.id ?? null;

  if (!input.tagId) {
    throw new Error("Select a counter before completing the order.");
  }

  if (items.length === 0) {
    throw new Error("Add at least one item to the order.");
  }

  const { data: tag } = await supabase
    .from("tags")
    .select("id")
    .eq("id", input.tagId)
    .eq("merchant_id", merchant.id)
    .single<{ id: string }>();

  if (!tag) {
    throw new Error("Selected counter was not found.");
  }

  const totals = totalsForOrder(items);

  const { error: orderError } = await supabase.from("orders").insert({
    merchant_id: merchant.id,
    tag_id: tag.id,
    staff_id: staffId,
    items,
    subtotal: totals.subtotal,
    vat: totals.vat,
    total: totals.total,
    payment_method: input.paymentMethod,
    status
  });

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (status === "open") {
    revalidatePath("/pos");
    return { status: "open" as const };
  }

  const receiptItems = items.map((item) => {
    const modifierTotal = item.modifiers.reduce(
      (sum, mod) => sum + mod.price_delta,
      0
    );
    const modifierNames = item.modifiers.map((mod) => mod.name).join(", ");
    return {
      name: modifierNames ? `${item.name} (${modifierNames})` : item.name,
      qty: item.qty,
      price: roundMoney(item.price + modifierTotal)
    };
  });

  const { error: updateError } = await supabase
    .from("receipts")
    .update({ is_latest: false })
    .eq("merchant_id", merchant.id)
    .eq("tag_id", tag.id)
    .eq("is_latest", true);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .insert({
      merchant_id: merchant.id,
      tag_id: tag.id,
      staff_id: staffId,
      items: receiptItems,
      subtotal: totals.subtotal,
      vat: totals.vat,
      total: totals.total,
      payment_method: input.paymentMethod === "card" ? "Card" : "Cash",
      awaiting_items: false,
      is_latest: true
    })
    .select("id")
    .single<{ id: string }>();

  if (receiptError || !receipt) {
    throw new Error(receiptError?.message ?? "Receipt could not be created.");
  }

  revalidatePath("/pos");
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  return { status: "completed" as const, receiptId: receipt.id };
}

export async function createCategory(formData: FormData) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) redirect(menuPath(staff, "?error=Category%20name%20is%20required"));

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchant.id);

  const { error } = await supabase.from("categories").insert({
    merchant_id: merchant.id,
    name,
    sort_order: count ?? 0
  });

  if (error) redirect(menuPath(staff, `?error=${encodeURIComponent(error.message)}`));
  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=categories"));
}

export async function updateCategory(formData: FormData) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!id || !name) redirect(menuPath(staff, "?tab=categories&error=Missing%20category"));

  await supabase
    .from("categories")
    .update({ name })
    .eq("id", id)
    .eq("merchant_id", merchant.id);

  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=categories"));
}

export async function deleteCategory(formData: FormData) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const id = String(formData.get("id") ?? "");
  await supabase.from("categories").delete().eq("id", id).eq("merchant_id", merchant.id);
  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=categories"));
}

export async function updateCategoryOrder(ids: string[]) {
  const { supabase, merchant } = await getMerchantAccessContext();
  await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("categories")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("merchant_id", merchant.id)
    )
  );
  revalidateMenuPaths();
}

export async function saveMenuItem(formData: FormData) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const description = String(formData.get("description") ?? "").trim() || null;
  const groupIds = formData.getAll("modifier_group_ids").map(String);
  const image = formData.get("image");

  if (!name || !categoryId || price < 0) {
    redirect(menuPath(staff, "?tab=items&error=Add%20a%20name,%20category,%20and%20price"));
  }

  let imageUrl = String(formData.get("existing_image_url") ?? "") || null;
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      redirect(menuPath(staff, "?tab=items&error=Image%20must%20be%20an%20image"));
    }
    const extension = image.name.split(".").pop()?.toLowerCase() ?? "png";
    const imagePath = `${merchant.id}/item-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(imagePath, image, {
        contentType: image.type,
        upsert: true
      });
    if (uploadError) {
      redirect(menuPath(staff, `?tab=items&error=${encodeURIComponent(uploadError.message)}`));
    }
    imageUrl = supabase.storage.from("menu-images").getPublicUrl(imagePath).data.publicUrl;
  }

  const payload = {
    merchant_id: merchant.id,
    category_id: categoryId,
    name,
    price,
    description,
    image_url: imageUrl,
    is_available: formData.get("is_available") !== "false"
  };

  let itemId = id;
  if (id) {
    const { error } = await supabase
      .from("menu_items")
      .update(payload)
      .eq("id", id)
      .eq("merchant_id", merchant.id);
    if (error) redirect(menuPath(staff, `?tab=items&error=${encodeURIComponent(error.message)}`));
  } else {
    const { count } = await supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("merchant_id", merchant.id)
      .eq("category_id", categoryId);
    const { data, error } = await supabase
      .from("menu_items")
      .insert({ ...payload, sort_order: count ?? 0 })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) {
      redirect(
        menuPath(
          staff,
          `?tab=items&error=${encodeURIComponent(error?.message ?? "Item could not be saved")}`
        )
      );
    }
    itemId = data.id;
  }

  await supabase.from("item_modifier_groups").delete().eq("item_id", itemId);
  if (groupIds.length > 0) {
    await supabase.from("item_modifier_groups").insert(
      groupIds.map((groupId) => ({
        item_id: itemId,
        group_id: groupId
      }))
    );
  }

  revalidatePath("/pos");
  revalidatePath("/staff");
  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=items"));
}

export async function toggleMenuItemAvailability(formData: FormData) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const id = String(formData.get("id") ?? "");
  const isAvailable = String(formData.get("is_available")) === "true";
  await supabase
    .from("menu_items")
    .update({ is_available: !isAvailable })
    .eq("id", id)
    .eq("merchant_id", merchant.id);
  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=items"));
}

export async function deleteMenuItem(formData: FormData) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const id = String(formData.get("id") ?? "");
  await supabase.from("menu_items").delete().eq("id", id).eq("merchant_id", merchant.id);
  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=items"));
}

export async function saveModifierGroup(formData: FormData) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const payload = {
    merchant_id: merchant.id,
    name,
    required: formData.get("required") === "on",
    multi_select: formData.get("multi_select") === "on"
  };

  if (!name) redirect(menuPath(staff, "?tab=modifiers&error=Group%20name%20required"));

  if (id) {
    await supabase
      .from("modifier_groups")
      .update(payload)
      .eq("id", id)
      .eq("merchant_id", merchant.id);
  } else {
    await supabase.from("modifier_groups").insert(payload);
  }

  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=modifiers"));
}

export async function deleteModifierGroup(formData: FormData) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const id = String(formData.get("id") ?? "");
  await supabase
    .from("modifier_groups")
    .delete()
    .eq("id", id)
    .eq("merchant_id", merchant.id);
  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=modifiers"));
}

export async function saveModifier(formData: FormData) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const id = String(formData.get("id") ?? "");
  const groupId = String(formData.get("group_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceDelta = Number(formData.get("price_delta") ?? 0);

  const { data: group } = await supabase
    .from("modifier_groups")
    .select("id")
    .eq("id", groupId)
    .eq("merchant_id", merchant.id)
    .single<{ id: string }>();

  if (!group || !name) redirect(menuPath(staff, "?tab=modifiers&error=Modifier%20is%20invalid"));

  if (id) {
    await supabase
      .from("modifiers")
      .update({ name, price_delta: priceDelta })
      .eq("id", id)
      .eq("group_id", group.id);
  } else {
    await supabase.from("modifiers").insert({
      group_id: group.id,
      name,
      price_delta: priceDelta
    });
  }

  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=modifiers"));
}

export async function deleteModifier(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const groupId = String(formData.get("group_id") ?? "");
  const { supabase, staff } = await getMerchantAccessContext();
  await supabase.from("modifiers").delete().eq("id", id).eq("group_id", groupId);
  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=modifiers"));
}

export async function loadSampleMenu() {
  const { supabase, merchant, staff } = await getMerchantAccessContext();

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchant.id);

  if ((count ?? 0) > 0) {
    redirect(menuPath(staff, "?error=Sample%20menu%20can%20only%20load%20before%20categories%20exist"));
  }

  const sampleCategories = ["Coffee", "Snacks", "Pastries"];
  const { data: createdCategories, error: categoryError } = await supabase
    .from("categories")
    .insert(
      sampleCategories.map((name, index) => ({
        merchant_id: merchant.id,
        name,
        sort_order: index
      }))
    )
    .select("id,name")
    .returns<Array<{ id: string; name: string }>>();

  if (categoryError || !createdCategories) {
    redirect(
      menuPath(
        staff,
        `?error=${encodeURIComponent(categoryError?.message ?? "Sample categories could not be created")}`
      )
    );
  }

  const categoryIdByName = new Map(
    createdCategories.map((category) => [category.name, category.id])
  );
  const sampleItems = [
    { category: "Coffee", name: "Espresso", price: 2.2, sort_order: 0 },
    { category: "Coffee", name: "Cappuccino", price: 3.4, sort_order: 1 },
    { category: "Coffee", name: "Iced Latte", price: 3.8, sort_order: 2 },
    { category: "Snacks", name: "Toastie", price: 5.5, sort_order: 0 },
    { category: "Snacks", name: "Granola Bowl", price: 6.2, sort_order: 1 },
    { category: "Pastries", name: "Croissant", price: 2.9, sort_order: 0 },
    { category: "Pastries", name: "Cinnamon Roll", price: 3.6, sort_order: 1 }
  ];

  const { error: itemError } = await supabase.from("menu_items").insert(
    sampleItems.map((item) => ({
      merchant_id: merchant.id,
      category_id: categoryIdByName.get(item.category) ?? createdCategories[0].id,
      name: item.name,
      price: item.price,
      sort_order: item.sort_order,
      is_available: true
    }))
  );

  if (itemError) {
    redirect(menuPath(staff, `?error=${encodeURIComponent(itemError.message)}`));
  }

  revalidatePath("/pos");
  revalidatePath("/staff");
  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=items"));
}
