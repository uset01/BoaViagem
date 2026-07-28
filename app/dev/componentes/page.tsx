"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BottomSheetSelect } from "@/components/ui/BottomSheetSelect";
import { BottomNav } from "@/components/ui/BottomNav";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { IconCircle } from "@/components/ui/IconCircle";
import { FuelIcon, HomeIcon, TruckIcon, UserIcon, WalletIcon } from "@/components/icons";

const PERIOD_OPTIONS = [
  { label: "Dia", value: "day" },
  { label: "Semana", value: "week" },
  { label: "Mês", value: "month" },
];

const TYPE_OPTIONS = [
  { label: "Receita", value: "income" },
  { label: "Despesa", value: "expense" },
];

const VEHICLE_OPTIONS = [
  { label: "Fiorino 2019", value: "fiorino-2019" },
  { label: "HB20 2021", value: "hb20-2021" },
  { label: "Onix 2020", value: "onix-2020" },
  { label: "Saveiro 2018", value: "saveiro-2018" },
  { label: "Strada 2022", value: "strada-2022" },
  { label: "Voyage 2017", value: "voyage-2017" },
];

const CATEGORY_OPTIONS = [
  { label: "Combustível", value: "fuel" },
  { label: "Manutenção", value: "maintenance" },
  { label: "Alimentação", value: "food" },
  { label: "Pedágio", value: "toll" },
];

const NAV_ITEMS = [
  { key: "home", label: "Início", icon: <HomeIcon /> },
  { key: "trips", label: "Viagens", icon: <TruckIcon /> },
  { key: "wallet", label: "Carteira", icon: <WalletIcon /> },
  { key: "profile", label: "Perfil", icon: <UserIcon /> },
];

export default function ComponentesPage() {
  const [period, setPeriod] = useState("week");
  const [type, setType] = useState("income");
  const [vehicle, setVehicle] = useState("hb20-2021");
  const [category, setCategory] = useState("");
  const [navActive, setNavActive] = useState("home");

  return (
    <ScreenShell showNav>
      <div className="space-y-8 px-5 pb-10 pt-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            /dev/componentes
          </p>
          <h1 className="text-xl font-extrabold text-ink">Biblioteca de UI</h1>
          <p className="text-sm text-ink-secondary">
            Vitrine visual dos componentes reutilizáveis antes de construir as telas.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">Card</h2>
          <Card>
            <p className="text-sm font-medium text-ink-secondary">Saldo do dia</p>
            <p className="mt-1 text-3xl font-extrabold text-ink">R$ 284,50</p>
          </Card>
          <Card padding="p-4" className="flex items-center gap-3">
            <IconCircle icon={<FuelIcon />} active />
            <div>
              <p className="text-sm font-semibold text-ink">Combustível</p>
              <p className="text-xs text-ink-tertiary">Padding customizado (p-4)</p>
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">SegmentedControl</h2>
          <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={type}
            onChange={setType}
            variant="accent"
            className="w-full"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">BottomSheetSelect</h2>
          <BottomSheetSelect
            label="Veículo"
            options={VEHICLE_OPTIONS}
            value={vehicle}
            onChange={setVehicle}
            searchable
          />
          <BottomSheetSelect
            label="Categoria"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={setCategory}
            placeholder="Selecione uma categoria"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">IconCircle</h2>
          <div className="flex items-center gap-3">
            <IconCircle icon={<TruckIcon />} />
            <IconCircle icon={<TruckIcon />} active />
            <IconCircle icon={<WalletIcon />} />
            <IconCircle icon={<WalletIcon />} active />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">BottomNav</h2>
          <p className="text-sm text-ink-secondary">
            Fixo na base da tela (item ativo: <span className="font-semibold text-ink">{navActive}</span>)
          </p>
        </section>
      </div>

      <BottomNav items={NAV_ITEMS} active={navActive} onChange={setNavActive} />
    </ScreenShell>
  );
}
