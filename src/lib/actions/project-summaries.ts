"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import { calculateInvoiceTotals } from "@/lib/invoice-calculations";
import type { DiscountType, ProductCategory } from "@/types";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

export interface ProjectSummary {
  itemCount: number;
  grandTotal: number;
  totalCost: number;
  profit: number;
  totalPaid: number;
}

/* ────────────────────────────────────────────────
   Batch fetch — 2 queries for all projects
   ──────────────────────────────────────────────── */

export async function getProjectSummaries(
  projects: {
    id: string;
    tax_percent: number;
    discount_percent: number;
    discount_type: DiscountType;
    discount_amount: number;
    additional_discount: number;
  }[]
): Promise<Record<string, ProjectSummary>> {
  if (projects.length === 0) return {};

  const supabase = await createSupabaseServer();
  const projectIds = projects.map((p) => p.id);

  // 1) Fetch all items for all projects in one query
  const { data: allItems } = await supabase
    .from("items")
    .select("project_id, category, retail_price, retail_shipping, my_cost, my_shipping, price_sold_for, quantity")
    .in("project_id", projectIds);

  // 2) Fetch all succeeded payments for all projects in one query
  const { data: allPayments } = await supabase
    .from("payments")
    .select("project_id, amount, status")
    .in("project_id", projectIds)
    .eq("status", "succeeded");

  // Build lookup maps
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Group items by project
  const itemsByProject = new Map<string, typeof allItems>();
  for (const item of allItems ?? []) {
    const list = itemsByProject.get(item.project_id) ?? [];
    list.push(item);
    itemsByProject.set(item.project_id, list);
  }

  // Group payments by project
  const paymentsByProject = new Map<string, number>();
  for (const payment of allPayments ?? []) {
    const current = paymentsByProject.get(payment.project_id) ?? 0;
    paymentsByProject.set(payment.project_id, current + payment.amount);
  }

  // Compute summaries
  const result: Record<string, ProjectSummary> = {};

  for (const pid of projectIds) {
    const proj = projectMap.get(pid)!;
    const items = itemsByProject.get(pid) ?? [];

    // Products → itemsTotal, Services → part of deliveryTotal
    let productsTotal = 0;
    let servicesTotal = 0;
    let shippingTotal = 0;
    let totalCost = 0;

    for (const item of items) {
      const cat = (item.category as ProductCategory) ?? "product";
      const price = Number(item.price_sold_for ?? item.retail_price) || 0;
      const qty = item.quantity ?? 1;
      const shipping = Number(item.retail_shipping) || 0;
      const cost = Number(item.my_cost) || 0;
      const costShipping = Number(item.my_shipping) || 0;

      if (cat === "service") {
        servicesTotal += price * qty;
      } else {
        productsTotal += price * qty;
      }
      shippingTotal += shipping * qty;
      totalCost += (cost + costShipping) * qty;
    }

    const deliveryTotal = servicesTotal + shippingTotal;

    const totals = calculateInvoiceTotals({
      itemsTotal: productsTotal,
      deliveryTotal,
      discountType: proj.discount_type,
      discountPercent: proj.discount_percent,
      discountValue: proj.discount_amount,
      taxPercent: proj.tax_percent,
      additionalDiscount: proj.additional_discount,
    });

    const totalPaidCents = paymentsByProject.get(pid) ?? 0;
    const totalPaid = totalPaidCents / 100;

    result[pid] = {
      itemCount: items.length,
      grandTotal: totals.grandTotal,
      totalCost,
      profit: totals.grandTotal - totalCost,
      totalPaid,
    };
  }

  return result;
}
