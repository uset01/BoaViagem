"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { BottomNav } from "@/components/ui/BottomNav";
import { IconCircle } from "@/components/ui/IconCircle";
import { FuelIcon, TollIcon, WrenchIcon, FoodIcon } from "@/components/icons";
import { TruckTypeIcon } from "@/components/TruckTypeIcon";
import { NAV_ITEMS } from "@/components/nav-items";
import { CIDADES, calcularDistanciaKm, encontrarCidadePorNome } from "@/lib/cidades";
import {
  CUSTO_LABELS,
  TRUCK_TYPES,
  VALORES_MEDIOS_PADRAO,
  calcularCustosPadrao,
  getTruckType,
  type CustoKey,
  type TruckTypeId,
  type ValoresMedios,
} from "@/lib/calculo-custos";
import { formatBRLAprox, parseMoney, toMoneyString } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MoneyField } from "./_components/MoneyField";
import { ResultadoCard, type ResultadoCalculo, type SaveState } from "@/components/ResultadoCard";

const CUSTO_ICONS: Record<CustoKey, React.ReactNode> = {
  diesel: <FuelIcon />,
  pedagio: <TollIcon />,
  manutencao: <WrenchIcon />,
  alimentacao: <FoodIcon />,
};

const CUSTO_ORDEM: CustoKey[] = ["diesel", "pedagio", "manutencao", "alimentacao"];

const MODO_OPTIONS = [
  { label: "Digitar km", value: "km" },
  { label: "Cidades", value: "cidades" },
];

const CIDADE_SUGESTOES = CIDADES.map((c) => `${c.nome} - ${c.uf}`);

const PREVIEW_DEBOUNCE_MS = 300;

function somarCustos(custos: Record<CustoKey, string>): number {
  return CUSTO_ORDEM.reduce((soma, key) => soma + parseMoney(custos[key]), 0);
}

export default function CalcularPage() {
  const [modo, setModo] = useState<"cidades" | "km">("km");
  const [origemTexto, setOrigemTexto] = useState("");
  const [destinoTexto, setDestinoTexto] = useState("");
  const [kmCidades, setKmCidades] = useState("");
  const ultimoParAutoPreenchidoRef = useRef<string | null>(null);
  const [kmManual, setKmManual] = useState("");
  const [freteValor, setFreteValor] = useState("");
  const [truckType, setTruckType] = useState<TruckTypeId>("truck");

  const [custos, setCustos] = useState<Record<CustoKey, string>>({
    diesel: "0,00",
    pedagio: "0,00",
    manutencao: "0,00",
    alimentacao: "0,00",
  });
  const [touchedFields, setTouchedFields] = useState<Set<CustoKey>>(new Set());
  const [valoresMedios, setValoresMedios] = useState<ValoresMedios>(VALORES_MEDIOS_PADRAO);

  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const resultadoRef = useRef<HTMLDivElement>(null);

  // Rola até o card de resultado assim que ele aparece (ou é atualizado por
  // um recálculo), pra garantir que o usuário perceba que algo aconteceu.
  useEffect(() => {
    if (resultado) {
      resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [resultado]);

  // Busca as médias do usuário no Supabase; se não houver sessão/tabela ainda
  // (ambiente sem projeto real configurado), mantém o padrão global.
  useEffect(() => {
    let cancelado = false;
    async function carregarValoresMedios() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from("valores_medios")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!cancelado && !error && data) {
          setValoresMedios({
            precoDiesel: data.preco_diesel ?? VALORES_MEDIOS_PADRAO.precoDiesel,
            pedagioPorKmPorEixo: data.pedagio_por_km_por_eixo ?? VALORES_MEDIOS_PADRAO.pedagioPorKmPorEixo,
            manutencaoPorKm: data.manutencao_por_km ?? VALORES_MEDIOS_PADRAO.manutencaoPorKm,
            alimentacaoPorDia: data.alimentacao_por_dia ?? VALORES_MEDIOS_PADRAO.alimentacaoPorDia,
            kmPorDia: data.km_por_dia ?? VALORES_MEDIOS_PADRAO.kmPorDia,
          });
        }
      } catch {
        // sem conexão real ao Supabase — segue com o padrão global
      }
    }
    carregarValoresMedios();
    return () => {
      cancelado = true;
    };
  }, []);

  // Origem/Destino são texto livre — isso só tenta casar com uma cidade
  // conhecida pra poder sugerir o km automaticamente, nunca trava o usuário
  // a digitar algo que não está na base.
  const origemCidade = useMemo(() => encontrarCidadePorNome(origemTexto), [origemTexto]);
  const destinoCidade = useMemo(() => encontrarCidadePorNome(destinoTexto), [destinoTexto]);

  // Preenche "Km aproximado" automaticamente quando o par origem+destino
  // muda pra um par de cidades conhecidas — mas só nessa hora. Editar o
  // campo manualmente depois não é sobrescrito, a menos que o par mude de
  // novo (troca de cidade = nova sugestão; edição no mesmo par = respeitada).
  useEffect(() => {
    if (modo !== "cidades" || !origemCidade || !destinoCidade) return;
    const parKey = `${origemCidade.id}::${destinoCidade.id}`;
    if (ultimoParAutoPreenchidoRef.current === parKey) return;
    ultimoParAutoPreenchidoRef.current = parKey;
    const distancia = calcularDistanciaKm(origemCidade, destinoCidade);
    setKmCidades(distancia > 0 ? String(distancia) : "");
  }, [modo, origemCidade, destinoCidade]);

  const km = useMemo(() => {
    const bruto = modo === "km" ? kmManual : kmCidades;
    const n = parseMoney(bruto);
    return n > 0 ? Math.round(n) : 0;
  }, [modo, kmManual, kmCidades]);

  // Recalcula os custos padrão quando km/caminhão/médias mudam, mas nunca
  // sobrescreve um campo que o usuário já editou manualmente.
  useEffect(() => {
    const padrao = calcularCustosPadrao(km, truckType, valoresMedios);
    setCustos((prev) => {
      const next = { ...prev };
      CUSTO_ORDEM.forEach((key) => {
        if (!touchedFields.has(key)) {
          next[key] = toMoneyString(padrao[key]);
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [km, truckType, valoresMedios]);

  function handleCustoChange(key: CustoKey, value: string) {
    setCustos((prev) => ({ ...prev, [key]: value }));
    setTouchedFields((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  const freteNumero = parseMoney(freteValor);
  const canCalcular =
    (modo === "cidades" ? Boolean(origemTexto.trim() && destinoTexto.trim()) : true) &&
    km > 0 &&
    freteNumero > 0;

  // Prévia "ao vivo" do lucro, com debounce pra não recalcular a cada tecla —
  // some assim que faltar algum dado e nunca abre o sheet formal sozinha.
  const [previewLucro, setPreviewLucro] = useState<number | null>(null);

  useEffect(() => {
    if (!canCalcular) {
      setPreviewLucro(null);
      return;
    }
    const timeout = setTimeout(() => {
      setPreviewLucro(freteNumero - somarCustos(custos));
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [canCalcular, freteNumero, custos]);

  function handleCalcular() {
    if (!canCalcular) return;

    const custosNumericos = CUSTO_ORDEM.reduce(
      (acc, key) => {
        acc[key] = parseMoney(custos[key]);
        return acc;
      },
      {} as Record<CustoKey, number>
    );
    const custoTotal = somarCustos(custos);

    const trecho =
      modo === "cidades" && origemTexto.trim() && destinoTexto.trim()
        ? `${origemTexto.trim()} → ${destinoTexto.trim()}`
        : `Viagem de ${km} km`;

    setResultado({
      trecho,
      distanciaKm: km,
      truckLabel: getTruckType(truckType).label,
      eixos: getTruckType(truckType).eixos,
      frete: freteNumero,
      custos: custosNumericos,
      custoTotal,
      lucro: freteNumero - custoTotal,
    });
    setSaveState("idle");
  }

  async function handleSalvarViagem() {
    if (!resultado) return;
    setSaveState("saving");
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("viagens").insert({
        user_id: userData?.user?.id ?? null,
        origem: modo === "cidades" ? origemTexto.trim() || null : null,
        destino: modo === "cidades" ? destinoTexto.trim() || null : null,
        distancia_km: resultado.distanciaKm,
        tipo_caminhao: truckType,
        valor_frete: resultado.frete,
        custo_diesel: resultado.custos.diesel,
        custo_pedagio: resultado.custos.pedagio,
        custo_manutencao: resultado.custos.manutencao,
        custo_alimentacao: resultado.custos.alimentacao,
        custo_total: resultado.custoTotal,
        lucro: resultado.lucro,
      });
      if (error) throw error;
      setSaveState("success");
    } catch {
      setSaveState("error");
    }
  }

  const freteCard = (
    <Card padding="p-4" className="space-y-2">
      <p className="text-sm font-medium text-ink-secondary">Valor do frete</p>
      <MoneyField value={freteValor} onChange={setFreteValor} large aria-label="Valor do frete oferecido" />
    </Card>
  );

  return (
    <ScreenShell showNav heroTitle="Calcular lucro">
      <div className="space-y-6 px-5 pb-10 pt-6">
        <SegmentedControl
          options={MODO_OPTIONS}
          value={modo}
          onChange={(v) => setModo(v as "cidades" | "km")}
          className="w-full"
        />

        {modo === "cidades" ? (
          <>
            <Card padding="p-4" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <AutocompleteInput
                  label="Origem"
                  value={origemTexto}
                  onChange={setOrigemTexto}
                  suggestions={CIDADE_SUGESTOES}
                  placeholder="Cidade de origem"
                  aria-label="Cidade de origem"
                />
                <AutocompleteInput
                  label="Destino"
                  value={destinoTexto}
                  onChange={setDestinoTexto}
                  suggestions={CIDADE_SUGESTOES}
                  placeholder="Cidade de destino"
                  aria-label="Cidade de destino"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-secondary">Km aproximado</label>
                <div className="flex items-center gap-2 rounded-2xl border border-divider bg-surface px-4 py-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={kmCidades}
                    onChange={(e) => setKmCidades(e.target.value)}
                    placeholder="Ex: 450"
                    aria-label="Km aproximado da viagem"
                    className="w-full min-w-0 bg-transparent text-lg font-bold text-ink outline-none placeholder:text-ink-tertiary"
                  />
                  <span className="shrink-0 text-sm font-semibold text-ink-tertiary">km</span>
                </div>
                {origemTexto.trim() && destinoTexto.trim() && (!origemCidade || !destinoCidade) ? (
                  <p className="text-xs text-ink-tertiary">
                    Cidade fora da nossa base — digite o km que você já sabe da rota.
                  </p>
                ) : origemCidade && destinoCidade ? (
                  <p className="text-xs text-ink-tertiary">
                    Km estimado automaticamente — ajuste se souber o valor exato.
                  </p>
                ) : null}
              </div>
            </Card>

            {freteCard}
          </>
        ) : (
          <div className="grid grid-cols-2 items-start gap-3">
            <Card padding="p-4" className="space-y-2">
              <label className="block text-sm font-medium text-ink-secondary">Distância</label>
              <div className="flex items-center gap-2 rounded-2xl border border-divider bg-surface px-4 py-4">
                <input
                  type="text"
                  inputMode="decimal"
                  value={kmManual}
                  onChange={(e) => setKmManual(e.target.value)}
                  placeholder="0"
                  className="w-full min-w-0 bg-transparent text-2xl font-extrabold text-ink outline-none placeholder:text-ink-tertiary"
                />
                <span className="shrink-0 text-2xl font-bold text-ink-tertiary">km</span>
              </div>
            </Card>

            {freteCard}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">Seu caminhão</h2>
          <div className="grid grid-cols-2 gap-3">
            {TRUCK_TYPES.map((t) => {
              const active = t.id === truckType;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTruckType(t.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-[20px] border bg-surface px-4 py-3.5 text-left shadow-card transition-colors",
                    active ? "border-accent" : "border-transparent"
                  )}
                >
                  <IconCircle icon={<TruckTypeIcon src={t.iconSrc} active={active} />} active={active} />
                  <div>
                    <p className={cn("text-sm font-semibold", active ? "text-ink" : "text-ink-secondary")}>
                      {t.label}
                    </p>
                    <p className="text-xs text-ink-tertiary">{t.eixos} eixos</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <Card className="space-y-1" padding="p-5">
          <p className="pb-2 text-sm font-bold text-ink">Custos da viagem</p>
          {CUSTO_ORDEM.map((key) => (
            <div key={key} className="flex items-center gap-3 py-2">
              <IconCircle icon={CUSTO_ICONS[key]} />
              <span className="flex-1 text-sm text-ink">{CUSTO_LABELS[key]}</span>
              <MoneyField
                value={custos[key]}
                onChange={(v) => handleCustoChange(key, v)}
                className="w-36"
                aria-label={CUSTO_LABELS[key]}
              />
            </div>
          ))}
        </Card>

        {previewLucro !== null && (
          <p className="text-center text-sm text-ink-secondary">
            {previewLucro >= 0
              ? `≈ ${formatBRLAprox(previewLucro)} de lucro estimado`
              : `≈ ${formatBRLAprox(Math.abs(previewLucro))} de prejuízo estimado`}
          </p>
        )}

        <button
          type="button"
          onClick={handleCalcular}
          disabled={!canCalcular}
          className="w-full rounded-full bg-accent py-4 text-[15px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:bg-divider disabled:text-ink-tertiary"
        >
          {resultado ? "Recalcular" : "Ver se compensa"}
        </button>

        {resultado && (
          <ResultadoCard
            ref={resultadoRef}
            resultado={resultado}
            saveState={saveState}
            onSalvar={handleSalvarViagem}
          />
        )}
      </div>

      <BottomNav items={NAV_ITEMS} active="calcular" />
    </ScreenShell>
  );
}
