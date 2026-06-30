-- Wipe merchant operational data for a clean slate.
-- Auth users remain in auth.users; recreate merchants via signup trigger or manual insert.

truncate table
  public.item_modifier_groups,
  public.modifiers,
  public.modifier_groups,
  public.menu_items,
  public.categories,
  public.receipts,
  public.orders,
  public.tags,
  public.staff,
  public.pos_connections,
  public.loyalty_cards,
  public.customers,
  public.merchants
restart identity cascade;
