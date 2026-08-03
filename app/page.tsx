import Link from "next/link";
import {
  Calculator,
  ChevronRight,
  Smartphone,
  ShieldCheck,
  Scale,
  CircleCheck,
} from "lucide-react";

// Foto de caminhão específica pra landing (diferente da foto de estrada
// usada em /calcular e nas outras telas do app).
const HERO_IMAGE_SRC = "/ChatGPT Image 2 de ago. de 2026, 14_42_57.png";

const PASSOS = [
  {
    numero: 1,
    titulo: "Digite o frete",
    descricao: "A distância e quanto estão te pagando pela viagem.",
  },
  {
    numero: 2,
    titulo: "Confira os custos",
    descricao: "Diesel, pedágio e manutenção já vêm calculados — você só ajusta se quiser.",
  },
  {
    numero: 3,
    titulo: "Veja se compensa",
    descricao: "Em segundos, o lucro real aparece antes de você aceitar o frete, já comparado com o piso da ANTT.",
  },
];

// Sinais de confiança reais (não são depoimentos ou números de uso —
// evita alegar algo que ainda não é verdade sobre a base de clientes).
const CONFIANCA = [
  { icone: ShieldCheck, texto: "Dados protegidos" },
  { icone: Scale, texto: "Baseado na tabela ANTT" },
  { icone: CircleCheck, texto: "Sem fidelidade" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Hero próprio da landing, com a foto do caminhão específica pra essa
      tela (diferente da foto de estrada do resto do app) — composição
      própria (badge, título de duas cores, subtítulo e CTA dentro da foto). */}
      <div className="relative overflow-hidden" style={{ height: 400 }}>
        <img
          src={encodeURI(HERO_IMAGE_SRC)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "75% center" }}
        />
        {/* Degradê horizontal: escuro à esquerda (onde fica o texto),
        mais leve à direita (onde aparece o caminhão). */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,12,18,0.92) 0%, rgba(10,12,18,0.75) 45%, rgba(10,12,18,0.35) 100%)",
          }}
        />
        {/* Degradê vertical leve na base, só pro corte com a sheet branca. */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, transparent 0%, transparent 80%, rgba(10,12,18,0.3) 100%)",
          }}
        />

        <div
          className="relative z-10 flex h-full flex-col px-5"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          {/* 1. Cabeçalho: logo (marca + wordmark em um só arquivo) */}
          <div className="pt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-header.png" alt="BoaViagem" className="h-6 w-auto" />
          </div>

          <div className="flex flex-1 flex-col items-start justify-center gap-4 pb-8 text-left">
            {/* Título e subtítulo ficam limitados a ~68% da largura pra
            nunca atravessar por cima do caminhão, à direita. */}
            <div className="max-w-[68%] space-y-4">
              {/* 3. Título com destaque de cor */}
              <h1 className="text-[23px] font-extrabold leading-tight text-surface">
                Não aceite frete
                <br />
                no <span className="text-accent">prejuízo.</span>
              </h1>

              {/* 4. Subtítulo */}
              <p className="text-[15px] leading-relaxed text-surface/80">
                Descubra em segundos quanto sobra no seu bolso depois de diesel, pedágio e manutenção.
              </p>
            </div>

            {/* 5. CTA com ícone */}
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-center text-base font-bold text-white shadow-card"
            >
              <Calculator size={18} strokeWidth={2} />
              Calcular meu lucro agora
            </Link>

            {/* 6. Texto de apoio — ajustado pro fluxo real (exige login) */}
            <div className="flex w-full items-center justify-center gap-1.5 text-xs text-surface/60">
              <Smartphone size={13} strokeWidth={2} className="shrink-0" />
              <span>Login rápido por celular</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-7 flex flex-1 flex-col rounded-t-[28px] bg-bg shadow-sheet">
        <div className="space-y-8 px-5 pb-12 pt-6">
          <div className="flex items-center justify-center gap-4">
            {CONFIANCA.map(({ icone: Icone, texto }) => (
              <div key={texto} className="flex items-center gap-1.5">
                <Icone size={14} strokeWidth={2} className="shrink-0 text-ink-tertiary" />
                <span className="text-xs text-ink-tertiary">{texto}</span>
              </div>
            ))}
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-extrabold text-ink">Como funciona</h2>
            <div className="space-y-4">
              {PASSOS.map((passo) => (
                <div key={passo.numero} className="flex items-center gap-3">
                  <span className="w-7 shrink-0 text-2xl font-extrabold text-ink">{passo.numero}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink">{passo.titulo}</p>
                    <p className="text-sm text-ink-secondary">{passo.descricao}</p>
                  </div>
                  <ChevronRight size={18} strokeWidth={2} className="shrink-0 text-ink-tertiary" />
                </div>
              ))}
            </div>
          </section>

          {/* TODO: seção de prova social, ANTES do card de preço — pedida
          mas a mensagem cortou no meio ("Faz parte de um grupo com...").
          Não renderizar até ter o texto real (nada de número/afirmação
          inventada sobre usuários). Estrutura pronta pra usar assim que
          tiver a frase:
          <Card padding="p-4" className="flex items-center gap-3">
            <IconCircle icon={<Users size={18} strokeWidth={2} />} />
            <p className="text-sm font-semibold text-ink">{FRASE_REAL_AQUI}</p>
          </Card> */}

          <div className="space-y-4 rounded-xl border border-zinc-200 bg-surface px-6 py-5 text-center">
            <div>
              <p className="text-sm font-semibold text-ink-secondary">Plano BoaViagem</p>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs font-bold text-danger">-29%</span>
                <span className="text-sm font-medium text-ink-tertiary line-through">R$ 34,99</span>
              </div>
              <p className="mt-1 text-5xl font-extrabold text-ink">
                R$ 24,99<span className="text-sm font-medium text-ink-secondary">/mês</span>
              </p>
              <p className="mt-1 text-sm text-ink-secondary">Cancele quando quiser.</p>

              <p className="mt-3 text-xs font-medium text-warning-text">
                Essa condição de lançamento pode acabar a qualquer momento.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full rounded-full bg-accent py-3.5 text-center text-sm font-bold text-white"
            >
              Assinar e calcular agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
