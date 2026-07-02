"use server";

import { getMerchantAccessContext } from "@/lib/merchant-context";
import {
  normalizeCategoryDisplayName,
  normalizeCategoryName
} from "@/lib/menu-categories";
import { calculateReceiptTotals, roundMoney } from "@/lib/money";
import type { PosOrderItem } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { menuBuilderPath } from "@/lib/pos/view-routes";

type CompleteOrderInput = {
  tagId: string;
  staffId?: string | null;
  tableId?: string | null;
  orderId?: string | null;
  items: PosOrderItem[];
  paymentMethod: "card" | "cash";
  status?: "open" | "completed";
};

async function setTableStatus(
  supabase: Awaited<ReturnType<typeof getMerchantAccessContext>>["supabase"],
  merchantId: string,
  tableId: string | null | undefined,
  status: "free" | "occupied"
) {
  if (!tableId) return;

  await supabase
    .from("tables")
    .update({ status })
    .eq("id", tableId)
    .eq("merchant_id", merchantId);
}

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
  return menuBuilderPath(staff, suffix);
}

function revalidateMenuPaths() {
  revalidatePath("/pos");
  revalidatePath("/staff");
}

export async function completePosOrder(input: CompleteOrderInput) {
  const { supabase, merchant } = await getMerchantAccessContext();
  const items = normalizeOrderItems(input.items);
  const status = input.status ?? "completed";
  let staffId: string | null = input.staffId ?? null;

  if (staffId) {
    const { data: selectedStaff } = await supabase
      .from("staff")
      .select("id")
      .eq("id", staffId)
      .eq("merchant_id", merchant.id)
      .maybeSingle<{ id: string }>();

    if (!selectedStaff) {
      throw new Error("Selected staff member was not found.");
    }
  }

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

  const orderPayload: Record<string, unknown> = {
    merchant_id: merchant.id,
    tag_id: tag.id,
    staff_id: staffId,
    items,
    subtotal: totals.subtotal,
    vat: totals.vat,
    total: totals.total,
    payment_method: input.paymentMethod,
    status
  };

  // Backwards compatible: only send table_id when it's used.
  // (Avoids failing inserts on environments where the column hasn't been migrated yet.)
  if (input.tableId) {
    orderPayload.table_id = input.tableId;
  }

  if (input.orderId) {
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update(orderPayload)
      .eq("id", input.orderId)
      .eq("merchant_id", merchant.id);

    if (updateOrderError) {
      throw new Error(updateOrderError.message);
    }
  } else {
    const { error: orderError } = await supabase.from("orders").insert(orderPayload);

    if (orderError) {
      throw new Error(orderError.message);
    }
  }

  if (status === "open") {
    await setTableStatus(supabase, merchant.id, input.tableId, "occupied");
    revalidatePath("/pos");
    revalidatePath("/staff");
    return { status: "open" as const };
  }

  if (input.tableId) {
    await setTableStatus(supabase, merchant.id, input.tableId, "free");
  }

  const receiptItems = items.map((item) => {
    const modifierTotal = item.modifiers.reduce(
      (sum, mod) => sum + mod.price_delta,
      0
    );
    return {
      name: item.name,
      qty: item.qty,
      price: roundMoney(item.price + modifierTotal),
      modifiers: item.modifiers,
      comment: item.comment || undefined
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
  revalidatePath("/pos");
  return { status: "completed" as const, receiptId: receipt.id };
}

export async function createRestaurantTable(name: string) {
  const { supabase, merchant } = await getMerchantAccessContext();
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Table name is required.");
  }

  const { data, error } = await supabase
    .from("tables")
    .insert({
      merchant_id: merchant.id,
      name: trimmed,
      status: "free"
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Table could not be created.");
  }

  revalidatePath("/pos");
  revalidatePath("/staff");
  return data;
}

export async function toggleRestaurantTableStatus(tableId: string) {
  const { supabase, merchant } = await getMerchantAccessContext();

  const { data: table, error } = await supabase
    .from("tables")
    .select("id, status")
    .eq("id", tableId)
    .eq("merchant_id", merchant.id)
    .single<{ id: string; status: "free" | "occupied" }>();

  if (error || !table) {
    throw new Error("Table was not found.");
  }

  const nextStatus = table.status === "free" ? "occupied" : "free";

  await supabase
    .from("tables")
    .update({ status: nextStatus })
    .eq("id", tableId)
    .eq("merchant_id", merchant.id);

  if (nextStatus === "free") {
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("merchant_id", merchant.id)
      .eq("table_id", tableId)
      .eq("status", "open");
  }

  revalidatePath("/pos");
  revalidatePath("/staff");
  return { status: nextStatus };
}

export async function refreshPosWorkspace() {
  revalidatePath("/pos");
  revalidatePath("/staff");
}

export async function createCategory(formData: FormData) {
  const { supabase, merchant, staff } = await getMerchantAccessContext();
  const name = normalizeCategoryDisplayName(String(formData.get("name") ?? ""));

  if (!name) redirect(menuPath(staff, "?error=Category%20name%20is%20required"));
  if (await categoryNameExists(supabase, merchant.id, name)) {
    redirect(menuPath(staff, "?error=Category%20name%20already%20exists"));
  }

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
  const name = normalizeCategoryDisplayName(String(formData.get("name") ?? ""));

  if (!id || !name) redirect(menuPath(staff, "?tab=categories&error=Missing%20category"));
  if (await categoryNameExists(supabase, merchant.id, name, id)) {
    redirect(menuPath(staff, "?tab=categories&error=Category%20name%20already%20exists"));
  }

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
  const id = String(formData.get("id") ?? "").trim();
  const name = normalizeCategoryDisplayName(String(formData.get("name") ?? ""));
  const categoryId = String(formData.get("category_id") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const description = String(formData.get("description") ?? "").trim() || null;
  const groupIds = Array.from(new Set(formData.getAll("modifier_group_ids").map(String)));
  const image = formData.get("image");

  if (!name || !categoryId || Number.isNaN(price) || price < 0) {
    redirect(menuPath(staff, "?tab=items&error=Add%20a%20name,%20category,%20and%20price"));
  }

  if (await menuItemNameExists(supabase, merchant.id, categoryId, name, id || undefined)) {
    redirect(menuPath(staff, "?tab=items&error=Item%20already%20exists%20in%20this%20category"));
  }

  let imageUrl = String(formData.get("existing_image_url") ?? "") || null;
  if (image instanceof File && image.size > 0) {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedImageTypes.includes(image.type)) {
      redirect(menuPath(staff, "?tab=items&error=Upload%20a%20JPG,%20PNG,%20WebP,%20or%20GIF%20image"));
    }
    if (image.size > 5 * 1024 * 1024) {
      redirect(menuPath(staff, "?tab=items&error=Image%20must%20be%205MB%20or%20smaller"));
    }
    const extension = image.name.split(".").pop()?.toLowerCase() ?? "png";
    const imagePath = `${merchant.id}/item-${Date.now()}.${extension}`;
    const { error: uploadError } = await withServerTimeout(
      supabase.storage.from("menu-images").upload(imagePath, image, {
        contentType: image.type,
        upsert: true
      }),
      8000,
      "Image upload timed out. Try again."
    );
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
    const { data, error } = await withServerTimeout(
      supabase
        .from("menu_items")
        .update(payload)
        .eq("id", id)
        .eq("merchant_id", merchant.id)
        .select("id")
        .single<{ id: string }>(),
      8000,
      "Item save timed out. Try again."
    );
    if (error || !data) {
      redirect(
        menuPath(
          staff,
          `?tab=items&error=${encodeURIComponent(error?.message ?? "Item could not be updated")}`
        )
      );
    }
  } else {
    const { data, error } = await withServerTimeout(
      supabase
        .from("menu_items")
        .insert({ ...payload, sort_order: Math.floor(Date.now() / 1000) })
        .select("id")
        .single<{ id: string }>(),
      8000,
      "Item save timed out. Try again."
    );
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

  const newGroupId = await maybeCreateInlineModifierGroup(formData);
  const linkedGroupIds = Array.from(new Set([...groupIds, ...(newGroupId ? [newGroupId] : [])]));

  const { error: linkDeleteError } = await withServerTimeout(
    supabase.from("item_modifier_groups").delete().eq("item_id", itemId),
    8000,
    "Modifier links timed out. Try again."
  );
  if (linkDeleteError) {
    redirect(menuPath(staff, `?tab=items&error=${encodeURIComponent(linkDeleteError.message)}`));
  }

  if (linkedGroupIds.length > 0) {
    const { error: linkInsertError } = await withServerTimeout(
      supabase.from("item_modifier_groups").insert(
        linkedGroupIds.map((groupId) => ({
          item_id: itemId,
          group_id: groupId
        }))
      ),
      8000,
      "Modifier links timed out. Try again."
    );
    if (linkInsertError) {
      redirect(menuPath(staff, `?tab=items&error=${encodeURIComponent(linkInsertError.message)}`));
    }
  }

  revalidatePath("/pos");
  revalidatePath("/staff");
  revalidateMenuPaths();
  redirect(menuPath(staff, "?tab=items"));

  async function maybeCreateInlineModifierGroup(source: FormData) {
    if (source.get("new_modifier_group_enabled") !== "true") return null;

    const groupName = normalizeCategoryDisplayName(
      String(source.get("new_modifier_group_name") ?? "")
    );
    if (!groupName) return null;

    const { data: group, error: groupError } = await supabase
      .from("modifier_groups")
      .insert({
        merchant_id: merchant.id,
        name: groupName,
        required: source.get("new_modifier_group_required") === "on",
        multi_select: source.get("new_modifier_group_multi_select") === "on"
      })
      .select("id")
      .single<{ id: string }>();

    if (groupError || !group) {
      redirect(
        menuPath(
          staff,
          `?tab=items&error=${encodeURIComponent(groupError?.message ?? "Modifier group could not be created")}`
        )
      );
    }

    const optionNames = source.getAll("new_modifier_option_names").map((value) =>
      normalizeCategoryDisplayName(String(value))
    );
    const optionPrices = source.getAll("new_modifier_option_prices").map((value) =>
      Number(value ?? 0)
    );
    const options = optionNames
      .map((optionName, index) => ({
        group_id: group.id,
        name: optionName,
        price_delta: Number.isNaN(optionPrices[index]) ? 0 : optionPrices[index]
      }))
      .filter((option) => option.name);

    if (options.length > 0) {
      const { error: optionError } = await supabase.from("modifiers").insert(options);
      if (optionError) {
        redirect(menuPath(staff, `?tab=items&error=${encodeURIComponent(optionError.message)}`));
      }
    }

    return group.id;
  }
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

  const { count, error: countError } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchant.id);

  if (countError) {
    redirect(menuPath(staff, `?error=${encodeURIComponent(countError.message)}`));
  }

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

async function categoryNameExists(
  supabase: Awaited<ReturnType<typeof getMerchantAccessContext>>["supabase"],
  merchantId: string,
  name: string,
  exceptId?: string
) {
  const { data } = await supabase
    .from("categories")
    .select("id,name")
    .eq("merchant_id", merchantId)
    .returns<Array<{ id: string; name: string }>>();
  const normalized = normalizeCategoryName(name);

  return (data ?? []).some(
    (category) =>
      category.id !== exceptId && normalizeCategoryName(category.name) === normalized
  );
}

async function menuItemNameExists(
  supabase: Awaited<ReturnType<typeof getMerchantAccessContext>>["supabase"],
  merchantId: string,
  categoryId: string,
  name: string,
  exceptId?: string
) {
  const { data } = await supabase
    .from("menu_items")
    .select("id,name")
    .eq("merchant_id", merchantId)
    .eq("category_id", categoryId)
    .returns<Array<{ id: string; name: string }>>();
  const normalized = normalizeCategoryName(name);

  return (data ?? []).some(
    (item) => item.id !== exceptId && normalizeCategoryName(item.name) === normalized
  );
}

async function withServerTimeout<T extends { error: { message: string } | null }>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  message: string
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(
          () => resolve({ error: new Error(message) } as unknown as T),
          timeoutMs
        );
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
