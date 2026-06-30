"use server";

import { getAuthedMerchant } from "@/lib/auth";
import { calculateReceiptTotals, roundMoney } from "@/lib/money";
import type { PosOrderItem, Staff } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type CompleteOrderInput = {
  tagId: string;
  items: PosOrderItem[];
  paymentMethod: "card" | "cash";
  status?: "open" | "completed";
  staffPinCode?: string | null;
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

export async function completePosOrder(input: CompleteOrderInput) {
  const { supabase, merchant } = await getAuthedMerchant();
  const items = normalizeOrderItems(input.items);
  const status = input.status ?? "completed";
  const pinCode = String(input.staffPinCode ?? "").trim();

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
  let staffId: string | null = null;
  if (pinCode) {
    if (!/^\d{4}$/.test(pinCode)) {
      throw new Error("Staff PIN must be 4 digits.");
    }
    const { data: staff } = await supabase
      .from("staff")
      .select("*")
      .eq("merchant_id", merchant.id)
      .eq("pin_code", pinCode)
      .maybeSingle<Staff>();
    if (!staff) {
      throw new Error("Staff PIN not found.");
    }
    staffId = staff.id;
  }

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
  revalidatePath("/dashboard");
  return { status: "completed" as const, receiptId: receipt.id };
}

export async function loadSampleMenu() {
  const { supabase, merchant } = await getAuthedMerchant();
  const samples: { name: string; items: [string, number][] }[] = [
    {
      name: "Coffee",
      items: [
        ["Espresso", 2.4],
        ["Flat White", 3.2],
        ["Cappuccino", 3.1]
      ]
    },
    {
      name: "Snacks",
      items: [
        ["Toastie", 5.8],
        ["Granola Bowl", 6.5],
        ["Fruit Cup", 4.4]
      ]
    },
    {
      name: "Pastries",
      items: [
        ["Croissant", 2.9],
        ["Pain au Chocolat", 3.3],
        ["Cinnamon Roll", 3.7]
      ]
    }
  ];

  for (let index = 0; index < samples.length; index += 1) {
    const category = samples[index];
    const { data } = await supabase
      .from("categories")
      .insert({
        merchant_id: merchant.id,
        name: category.name,
        sort_order: index
      })
      .select("id")
      .single<{ id: string }>();

    if (data) {
      await supabase.from("menu_items").insert(
        category.items.map(([name, price], itemIndex) => ({
          merchant_id: merchant.id,
          category_id: data.id,
          name,
          price,
          description: null,
          image_url: null,
          is_available: true,
          sort_order: itemIndex
        }))
      );
    }
  }

  revalidatePath("/pos");
  revalidatePath("/pos/menu");
  redirect("/pos");
}

export async function createCategory(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) redirect("/pos/menu?error=Category%20name%20is%20required");

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchant.id);

  const { error } = await supabase.from("categories").insert({
    merchant_id: merchant.id,
    name,
    sort_order: count ?? 0
  });

  if (error) redirect(`/pos/menu?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/pos/menu");
  redirect("/pos/menu?tab=categories");
}

export async function updateCategory(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!id || !name) redirect("/pos/menu?tab=categories&error=Missing%20category");

  await supabase
    .from("categories")
    .update({ name })
    .eq("id", id)
    .eq("merchant_id", merchant.id);

  revalidatePath("/pos/menu");
  redirect("/pos/menu?tab=categories");
}

export async function deleteCategory(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const id = String(formData.get("id") ?? "");
  await supabase.from("categories").delete().eq("id", id).eq("merchant_id", merchant.id);
  revalidatePath("/pos/menu");
  redirect("/pos/menu?tab=categories");
}

export async function updateCategoryOrder(ids: string[]) {
  const { supabase, merchant } = await getAuthedMerchant();
  await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("categories")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("merchant_id", merchant.id)
    )
  );
  revalidatePath("/pos/menu");
}

export async function saveMenuItem(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const description = String(formData.get("description") ?? "").trim() || null;
  const groupIds = formData.getAll("modifier_group_ids").map(String);
  const image = formData.get("image");

  if (!name || !categoryId || price < 0) {
    redirect("/pos/menu?tab=items&error=Add%20a%20name,%20category,%20and%20price");
  }

  let imageUrl = String(formData.get("existing_image_url") ?? "") || null;
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      redirect("/pos/menu?tab=items&error=Image%20must%20be%20an%20image");
    }
    const extension = image.name.split(".").pop()?.toLowerCase() ?? "png";
    const imagePath = `${merchant.id}/item-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(imagePath, image, {
        contentType: image.type,
        upsert: true
      });
    if (uploadError) redirect(`/pos/menu?tab=items&error=${encodeURIComponent(uploadError.message)}`);
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
    if (error) redirect(`/pos/menu?tab=items&error=${encodeURIComponent(error.message)}`);
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
    if (error || !data) redirect(`/pos/menu?tab=items&error=${encodeURIComponent(error?.message ?? "Item could not be saved")}`);
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
  revalidatePath("/pos/menu");
  redirect("/pos/menu?tab=items");
}

export async function toggleMenuItemAvailability(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const id = String(formData.get("id") ?? "");
  const isAvailable = String(formData.get("is_available")) === "true";
  await supabase
    .from("menu_items")
    .update({ is_available: !isAvailable })
    .eq("id", id)
    .eq("merchant_id", merchant.id);
  revalidatePath("/pos/menu");
  redirect("/pos/menu?tab=items");
}

export async function deleteMenuItem(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const id = String(formData.get("id") ?? "");
  await supabase.from("menu_items").delete().eq("id", id).eq("merchant_id", merchant.id);
  revalidatePath("/pos/menu");
  redirect("/pos/menu?tab=items");
}

export async function saveModifierGroup(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const payload = {
    merchant_id: merchant.id,
    name,
    required: formData.get("required") === "on",
    multi_select: formData.get("multi_select") === "on"
  };

  if (!name) redirect("/pos/menu?tab=modifiers&error=Group%20name%20required");

  if (id) {
    await supabase
      .from("modifier_groups")
      .update(payload)
      .eq("id", id)
      .eq("merchant_id", merchant.id);
  } else {
    await supabase.from("modifier_groups").insert(payload);
  }

  revalidatePath("/pos/menu");
  redirect("/pos/menu?tab=modifiers");
}

export async function deleteModifierGroup(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
  const id = String(formData.get("id") ?? "");
  await supabase
    .from("modifier_groups")
    .delete()
    .eq("id", id)
    .eq("merchant_id", merchant.id);
  revalidatePath("/pos/menu");
  redirect("/pos/menu?tab=modifiers");
}

export async function saveModifier(formData: FormData) {
  const { supabase, merchant } = await getAuthedMerchant();
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

  if (!group || !name) redirect("/pos/menu?tab=modifiers&error=Modifier%20is%20invalid");

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

  revalidatePath("/pos/menu");
  redirect("/pos/menu?tab=modifiers");
}

export async function deleteModifier(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const groupId = String(formData.get("group_id") ?? "");
  const { supabase } = await getAuthedMerchant();
  await supabase.from("modifiers").delete().eq("id", id).eq("group_id", groupId);
  revalidatePath("/pos/menu");
  redirect("/pos/menu?tab=modifiers");
}
