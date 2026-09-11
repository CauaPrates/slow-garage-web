import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { useExpenses } from "@/features/expense/useExpenses";
import { CreateExpenseDialog } from "@/features/expense/CreateExpenseDialog";
import { ExpenseListItem } from "@/features/expense/ExpenseListItem";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { PERIODS, PERIOD_LABELS, periodRange, type Period } from "@/lib/period";
import { ROUTES } from "@/lib/routes";

export function ModificationsPage() {
  const { vehicleId = "" } = useParams<{ vehicleId: string }>();
  // Changing vehicles remounts the workspace, including its filters and dialogs.
  return <ModificationWorkspace key={vehicleId} vehicleId={vehicleId} />;
}

function ModificationWorkspace({ vehicleId }: { vehicleId: string }) {
  const [params, setParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const open = dialogOpen || params.get("novo") === "1";
  function setOpen(value: boolean) {
    setDialogOpen(value);
    if (!value && params.has("novo")) {
      const next = new URLSearchParams(params);
      next.delete("novo");
      setParams(next, { replace: true });
    }
  }
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [order, setOrder] = useState("recent");
  const vehicleQuery = useVehicle(vehicleId);
  const categoriesQuery = useExpenseCategories();
  const category = categoriesQuery.data?.find((item) => item.slug === "upgrade" && item.user_id === null);
  const expensesQuery = useExpenses(vehicleId, { categoryId: category?.id ?? "all", period: "all" }, !!category);

  if (vehicleQuery.isLoading || categoriesQuery.isLoading) {
    return <div role="status" className="p-6 text-text-secondary">Carregando modificações…</div>;
  }
  if (vehicleQuery.isError || categoriesQuery.isError) {
    return <div role="alert" className="space-y-4 p-6"><p>Não foi possível carregar as modificações.</p><Button onClick={() => { void vehicleQuery.refetch(); void categoriesQuery.refetch(); }}>Tentar de novo</Button></div>;
  }
  if (!vehicleQuery.vehicle) {
    return <div className="space-y-4 p-6"><p>Veículo não encontrado.</p><Link to={ROUTES.home} className="text-accent underline">Voltar para a garagem</Link></div>;
  }
  if (!category) {
    return <div role="alert" className="space-y-4 p-6"><p>A categoria de upgrades não está disponível.</p><Button onClick={() => void categoriesQuery.refetch()}>Tentar de novo</Button></div>;
  }

  const upgrades = expensesQuery.data ?? [];
  const total = upgrades.reduce((sum, item) => sum + item.amount, 0);
  const range = periodRange(period);
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const visible = upgrades.filter((item) => {
    if (range.gte && (!item.occurred_on || item.occurred_on < range.gte)) return false;
    if (range.lte && (!item.occurred_on || item.occurred_on > range.lte)) return false;
    return [item.description, item.vendor, item.notes].some((value) => (value ?? "").toLocaleLowerCase("pt-BR").includes(term));
  }).sort((a, b) => order === "value" ? b.amount - a.amount : order === "oldest" ? a.occurred_on.localeCompare(b.occurred_on) : b.occurred_on.localeCompare(a.occurred_on));
  const dated = upgrades.filter((item) => item.occurred_on).sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));
  const months = new Map<string, number>();
  for (const item of dated) {
    const month = item.occurred_on.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + item.amount);
  }
  const monthly = [...months].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  const max = Math.max(1, ...monthly.map(([, value]) => value));

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Breadcrumb items={[{ label: "Modificações" }]} />
      <header className="flex flex-col gap-4 rounded-lg border border-accent/30 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2"><p className="flex items-center gap-2 text-sm text-accent"><Sparkles className="h-4 w-4" aria-hidden="true" /> A evolução do seu carro</p><h1 className="text-2xl font-semibold text-text-primary">Modificações</h1><p className="max-w-xl text-sm text-text-secondary">Peças, acertos e upgrades que deixam o carro do seu jeito. Registre cada mudança e acompanhe seu investimento.</p></div>
        <Button onClick={() => setOpen(true)}>Registrar upgrade</Button>
      </header>
      {expensesQuery.isLoading ? <p role="status">Carregando upgrades…</p> : expensesQuery.isError ? (
        <div role="alert" className="space-y-3"><p>Não foi possível carregar os upgrades.</p><Button onClick={() => void expensesQuery.refetch()}>Tentar de novo</Button></div>
      ) : <>
        <dl className="grid gap-3 sm:grid-cols-3">
          {[["Investimento em upgrades", formatMoney(total)], ["Upgrades registrados", String(upgrades.length)], ["Último registro datado", dated[0] ? formatDateOnly(dated[0].occurred_on) : "—"]].map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-surface p-4"><dt className="text-sm text-text-secondary">{label}</dt><dd className="mt-2 break-words text-xl font-semibold text-text-primary">{value}</dd></div>)}
        </dl>
        <p className="text-sm text-text-secondary">Estes valores já fazem parte dos gastos do veículo. Upgrades anteriores aparecem aqui automaticamente.</p>
        {monthly.length > 0 && <section className="rounded-lg border border-border bg-surface p-4" aria-label="Investimento por mês"><h2 className="font-medium text-text-primary">Investimento por mês</h2><p className="mb-4 text-xs text-text-secondary">Últimos seis meses com registros datados</p><div className="space-y-3">{monthly.map(([month, value]) => <div key={month} className="grid grid-cols-[4rem_1fr] items-center gap-3 sm:grid-cols-[4rem_1fr_8rem]"><span className="text-xs text-text-secondary">{month.slice(5)}/{month.slice(0, 4)}</span><div className="h-2 overflow-hidden rounded bg-bg" aria-hidden="true"><div className="h-full rounded bg-accent" style={{ width: `${value / max * 100}%` }} /></div><span className="col-start-2 text-sm text-text-primary sm:col-start-auto sm:text-right">{formatMoney(value)}</span></div>)}</div></section>}
        <section className="space-y-4" aria-labelledby="upgrade-history">
          <h2 id="upgrade-history" className="text-lg font-medium">Histórico de upgrades</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="space-y-1.5"><Label htmlFor="upgrade-search">Buscar modificação</Label><Input id="upgrade-search" placeholder="Peça, oficina ou anotação" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="upgrade-period">Período</Label><Select id="upgrade-period" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>{PERIODS.map((value) => <option key={value} value={value}>{PERIOD_LABELS[value]}</option>)}</Select></div>
            <div className="space-y-1.5"><Label htmlFor="upgrade-order">Ordenar</Label><Select id="upgrade-order" value={order} onChange={(event) => setOrder(event.target.value)}><option value="recent">Mais recentes</option><option value="oldest">Mais antigos</option><option value="value">Maior valor</option></Select></div>
          </div>
          <p aria-live="polite" className="text-sm text-text-secondary">{visible.length} registros · {formatMoney(visible.reduce((sum, item) => sum + item.amount, 0))} nesta seleção</p>
          {visible.length === 0 ? <div className="space-y-4 rounded-lg border border-dashed border-border p-8 text-center"><p>{upgrades.length ? "Nenhum upgrade encontrado com esses filtros." : "Seu próximo upgrade começa aqui."}</p><Button variant="ghost" onClick={() => { if (upgrades.length) { setSearch(""); setPeriod("all"); } else setOpen(true); }}>{upgrades.length ? "Limpar filtros" : "Registrar primeiro upgrade"}</Button></div> : visible.map((expense) => <ExpenseListItem key={expense.id} vehicleId={vehicleId} expense={expense} categories={categoriesQuery.data ?? []} upgradeCategoryId={category.id} />)}
        </section>
      </>}
      <CreateExpenseDialog vehicleId={vehicleId} categories={categoriesQuery.data ?? []} upgradeCategoryId={category.id} defaultOdometerKm={vehicleQuery.vehicle.current_odometer_km ?? undefined} open={open} onOpenChange={setOpen} />
    </div>
  );
}
