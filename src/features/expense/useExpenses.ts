import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, startOfYear, subMonths } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import type { PERIODS } from "./schemas";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];
type AttachmentRow = Database["public"]["Tables"]["attachments"]["Row"];

export type Period = (typeof PERIODS)[number];

export type ExpenseFilters = {
  categoryId: string | "all";
  period: Period;
};

export type ExpenseWithAttachment = ExpenseRow & {
  attachment: AttachmentRow | null;
};

const toDateOnly = (date: Date) => format(date, "yyyy-MM-dd");

function periodRange(period: Period): { gte?: string; lte?: string } {
  const now = new Date();
  switch (period) {
    case "this-month":
      return { gte: toDateOnly(startOfMonth(now)) };
    case "last-month": {
      const lastMonth = subMonths(now, 1);
      return { gte: toDateOnly(startOfMonth(lastMonth)), lte: toDateOnly(endOfMonth(lastMonth)) };
    }
    case "this-year":
      return { gte: toDateOnly(startOfYear(now)) };
    default:
      return {};
  }
}

async function fetchExpenses(
  vehicleId: string,
  filters: ExpenseFilters,
): Promise<ExpenseWithAttachment[]> {
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.categoryId !== "all") {
    query = query.eq("category_id", filters.categoryId);
  }
  const range = periodRange(filters.period);
  if (range.gte) query = query.gte("occurred_on", range.gte);
  if (range.lte) query = query.lte("occurred_on", range.lte);

  const { data: expenses, error } = await query;
  if (error) throw error;
  if (!expenses.length) return [];

  const { data: attachments, error: attachmentsError } = await supabase
    .from("attachments")
    .select("*")
    .eq("entity_type", "expense")
    .in(
      "entity_id",
      expenses.map((e) => e.id),
    );
  if (attachmentsError) throw attachmentsError;

  const attachmentByExpenseId = new Map(
    (attachments ?? []).map((a) => [a.entity_id, a]),
  );

  return expenses.map((expense) => ({
    ...expense,
    attachment: attachmentByExpenseId.get(expense.id) ?? null,
  }));
}

export function useExpenses(vehicleId: string, filters: ExpenseFilters) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "expenses", filters],
    queryFn: () => fetchExpenses(vehicleId, filters),
  });
}

/** Toda mutação de gasto invalida por prefixo `['vehicles']` — cobre a lista (Fase 2), o resumo do header (Fase 3) e a própria lista de gastos, sem precisar enumerar cada key. */
function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

export function useCreateExpense(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: Omit<ExpenseInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useUpdateExpense(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: ExpenseUpdate & { id: string }) => {
      const { error } = await supabase
        .from("expenses")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

/**
 * RN-2: apaga o anexo (arquivo + linha) antes do gasto — se a limpeza do
 * anexo falhar, o gasto não é apagado, para nunca deixar arquivo/linha
 * órfã no Storage (lição da Fase 3). Busca o anexo direto do servidor no
 * momento da exclusão, em vez de confiar no `expense.attachment` já
 * carregado — a lista pode estar com cache desatualizado se o usuário
 * anexou um arquivo e apagou o gasto em seguida antes do refetch
 * terminar, e um anexo assim ficaria órfão silenciosamente.
 */
export function useDeleteExpense(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (expense: ExpenseWithAttachment) => {
      const { data: currentAttachment, error: lookupError } = await supabase
        .from("attachments")
        .select("*")
        .eq("entity_type", "expense")
        .eq("entity_id", expense.id)
        .maybeSingle();
      if (lookupError) throw lookupError;

      if (currentAttachment) {
        const { error: storageError } = await supabase.storage
          .from("vehicle-documents")
          .remove([currentAttachment.storage_path]);
        if (storageError) throw storageError;

        const { error: attachmentError } = await supabase
          .from("attachments")
          .delete()
          .eq("id", currentAttachment.id);
        if (attachmentError) throw attachmentError;
      }

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expense.id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
