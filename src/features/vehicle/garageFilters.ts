import { useSyncExternalStore } from "react";
import type { Database } from "@/types/database.types";
import type { VehicleWithSummary } from "./useVehicles";

type VehicleStatus = Database["public"]["Enums"]["vehicle_status"];

/** Abas da coleção (ADR-096): todos + os quatro status reais, no plural. */
export const STATUS_TABS: { value: "all" | VehicleStatus; label: string; empty: string }[] = [
  { value: "all", label: "Todos", empty: "Nenhum veículo" },
  { value: "active", label: "Ativos", empty: "Nenhum veículo ativo" },
  { value: "project", label: "Projetos", empty: "Nenhum veículo em projeto" },
  { value: "stored", label: "Guardados", empty: "Nenhum veículo guardado" },
  { value: "sold", label: "Vendidos", empty: "Nenhum veículo vendido" },
];
export type StatusFilter = (typeof STATUS_TABS)[number]["value"];

export const SORT_OPTIONS = [
  { value: "recent", label: "Mais recente" },
  { value: "oldest", label: "Mais antigo" },
  { value: "name", label: "Nome (A–Z)" },
  { value: "invested", label: "Maior investimento" },
  { value: "odometer", label: "Maior quilometragem" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/** Caixa e acento não importam ("opala" acha "Opala"; "edicao" acha "Edição"). */
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Busca da garagem: marca, modelo, versão, ano e placa. Cada palavra da busca
 * precisa aparecer em algum desses campos ("civic 2008" acha o Civic 2008).
 * Na placa, hífen e espaço não contam ("frt-2e45" acha "FRT2E45").
 */
export function matchesSearch(vehicle: VehicleWithSummary, query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalize(
    [vehicle.make, vehicle.model, vehicle.trim, vehicle.model_year, vehicle.plate]
      .filter((part) => part != null && part !== "")
      .join(" "),
  );
  const plate = vehicle.plate ? normalize(vehicle.plate).replace(/[\s-]/g, "") : "";
  return words.every((word) => haystack.includes(word) || (plate && plate.includes(word.replace(/-/g, ""))));
}

/** Nulo vai para o fim em qualquer ordenação numérica (sem odômetro não é "0 km"). */
function byNumberDesc(a: number | null | undefined, b: number | null | undefined) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

export function sortVehicles(vehicles: VehicleWithSummary[], sort: SortOption) {
  const list = [...vehicles];
  switch (sort) {
    case "recent":
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case "oldest":
      return list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case "name":
      return list.sort((a, b) =>
        `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`, "pt-BR", { sensitivity: "base" }),
      );
    case "invested":
      return list.sort((a, b) =>
        byNumberDesc(a.financialSummary?.total_invested, b.financialSummary?.total_invested),
      );
    case "odometer":
      return list.sort((a, b) => byNumberDesc(a.current_odometer_km, b.current_odometer_km));
  }
}

let searchText = "";
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSearch = () => searchText;
const setSearch = (value: string) => {
  if (value === searchText) return;
  searchText = value;
  listeners.forEach((listener) => listener());
};

/**
 * Texto da busca da garagem, compartilhado entre o campo do cabeçalho
 * (desktop) e o da barra da coleção (celular) — os dois são o mesmo filtro.
 * Estado em memória, síncrono: guardar na URL perdia letras quando se
 * digitava rápido (o campo controlado relia a URL, que atualiza com atraso).
 * Vale enquanto o app está aberto; recarregar zera.
 */
export function useGarageSearch() {
  const query = useSyncExternalStore(subscribe, getSearch, getSearch);
  return [query, setSearch] as const;
}
