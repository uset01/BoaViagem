"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { BottomNav } from "@/components/ui/BottomNav";
import { IconCircle } from "@/components/ui/IconCircle";
import { FuelIcon, TollIcon, WrenchIcon, FoodIcon } from "@/components/icons";
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
import {
  TABELAS_ANTT,
  TIPOS_CARGA_ANTT,
  eixosAnttMaisProximo,
  type TabelaAntt,
  type TipoCargaAntt,
} from "@/lib/antt-tabela-oficial";
import { formatBRLAprox, parseMoney, toMoneyString } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { MoneyField } from "./_components/MoneyField";
import { ResultadoCard, type ResultadoCalculo, type SaveState } from "@/components/ResultadoCard";

const OPCOES_TABELA_ANTT = (Object.keys(TABELAS_ANTT) as TabelaAntt[]).map((id) => ({
  label: TABELAS_ANTT[id].label,
  value: id,
}));

// O seletor "Número de Eixos" (em "Seu caminhão") mostra os tipos de
// caminhão já com a contagem de eixos no rótulo — um só seletor cobre tanto
// a estimativa de consumo (por tipo) quanto os eixos usados no piso ANTT.
const OPCOES_CAMINHAO = TRUCK_TYPES.map((t) => ({
  label: `${t.label} — ${t.eixos} eixos`,
  value: t.id,
}));

const OPCOES_TIPO_CARGA = TIPOS_CARGA_ANTT.map((t) => ({ label: t.label, value: t.id }));

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
  const [tabelaAntt, setTabelaAntt] = useState<TabelaAntt>("A");
  const [tipoCarga, setTipoCarga] = useState<TipoCargaAntt>("carga_geral");

  // Começa vazio (não "0,00") — o placeholder "—" indica "será calculado"
  // até a distância ser preenchida.
  const [custos, setCustos] = useState<Record<CustoKey, string>>({
    diesel: "",
    pedagio: "",
    manutencao: "",
    alimentacao: "",
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
  // sobrescreve um campo que o usuário já editou manualmente. Sem km ainda,
  // deixa vazio (mostra "será calculado") em vez de forçar "0,00".
  useEffect(() => {
    const padrao = calcularCustosPadrao(km, truckType, valoresMedios);
    setCustos((prev) => {
      const next = { ...prev };
      CUSTO_ORDEM.forEach((key) => {
        if (!touchedFields.has(key)) {
          next[key] = km > 0 ? toMoneyString(padrao[key]) : "";
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [km, truckType, valoresMedios]);

  // Preenche um exemplo pronto pra quem quer só ver como funciona antes de
  // digitar os próprios números.
  function handlePreencherExemplo() {
    setModo("km");
    setKmManual("1100");
    setFreteValor(toMoneyString(7000));
    setTruckType("truck");
    setTabelaAntt("A");
    setTipoCarga("carga_geral");
    setTouchedFields(new Set());
  }

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
      eixosAntt: eixosAnttMaisProximo(getTruckType(truckType).eixos),
      tabelaAntt,
      tipoCarga,
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
    <Card padding="p-4" className="space-y-2 border border-accent/25">
      <p className="text-sm font-medium text-ink-secondary">Valor do frete</p>
      <MoneyField
        value={freteValor}
        onChange={setFreteValor}
        placeholder="Ex: 7000"
        large
        aria-label="Valor do frete oferecido"
      />
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

        {!resultado && !canCalcular && (
          <div className="space-y-1.5 text-center">
            <p className="text-sm text-ink-secondary">
              Preencha a distância e o valor do frete para ver se a viagem compensa
            </p>
            <button
              type="button"
              onClick={handlePreencherExemplo}
              className="text-xs font-semibold text-accent"
            >
              Ver exemplo
            </button>
          </div>
        )}

        {modo === "cidades" ? (
          <>
            <Card padding="p-4" className="space-y-3 border border-accent/25">
              <div className="space-y-3">
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
          <div className="space-y-3">
            <Card padding="p-4" className="space-y-2 border border-accent/25">
              <label className="block text-sm font-medium text-ink-secondary">Distância</label>
              <div className="flex items-center gap-2 rounded-2xl border border-divider bg-surface px-4 py-4">
                <input
                  type="text"
                  inputMode="decimal"
                  value={kmManual}
                  onChange={(e) => setKmManual(e.target.value)}
                  placeholder="Ex: 1100"
                  className="w-full min-w-0 bg-transparent text-2xl font-extrabold text-ink outline-none placeholder:text-sm placeholder:font-semibold placeholder:text-ink-tertiary"
                />
                <span className="shrink-0 text-2xl font-bold text-ink-tertiary">km</span>
              </div>
            </Card>

            {freteCard}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">Seu caminhão</h2>
          <Card padding="p-4">
            <InlineSelect
              label="Número de Eixos"
              options={OPCOES_CAMINHAO}
              value={truckType}
              onChange={(v) => setTruckType(v as TruckTypeId)}
              placeholder="Selecione o número de eixos"
            />
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">Piso mínimo ANTT</h2>
          <Card padding="p-4" className="space-y-3">
            <div>
              <InlineSelect
                label="Tipo de frete"
                options={OPCOES_TABELA_ANTT}
                value={tabelaAntt}
                onChange={(v) => setTabelaAntt(v as TabelaAntt)}
                placeholder="Selecione o tipo de frete"
              />
              <p className="mt-1.5 text-xs text-ink-tertiary">{TABELAS_ANTT[tabelaAntt].descricao}</p>
            </div>
            <InlineSelect
              label="Tipo de carga"
              options={OPCOES_TIPO_CARGA}
              value={tipoCarga}
              onChange={(v) => setTipoCarga(v as TipoCargaAntt)}
              placeholder="Selecione o tipo de carga"
              searchable
            />
          </Card>
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
                placeholder={km > 0 ? "0,00" : "—"}
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
          {!canCalcular ? "Preencha os dados para calcular" : resultado ? "Recalcular" : "Ver se compensa"}
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
