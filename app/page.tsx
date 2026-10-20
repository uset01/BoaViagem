import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Calculator,
  Check,
  CircleDollarSign,
  CircleX,
  Fuel,
  MapPinned,
  Scale,
  ShieldCheck,
  Smartphone,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { BENEFICIOS_PLANO } from "@/lib/plano";
import { cn } from "@/lib/utils";

// Foto de caminhão específica pra landing (diferente da foto de estrada
// usada em /calcular e nas outras telas do app).
const HERO_IMAGE_SRC = "/ChatGPT Image 2 de ago. de 2026, 14_42_57.png";

const PASSOS = [
  {
    numero: 1,
    icone: MapPinned,
    titulo: "Digite o frete",
    descricao: "A distância e quanto estão te pagando pela viagem.",
  },
  {
    numero: 2,
    icone: Fuel,
    titulo: "Confira os custos",
    descricao: "Coloque diesel, pedágio e manutenção e ajuste como quiser.",
  },
  {
    numero: 3,
    icone: CircleDollarSign,
    titulo: "Veja se compensa",
    descricao: "Em segundos, o lucro real aparece antes de você aceitar o frete, já comparado com o piso da ANTT.",
  },
];

// ATENÇÃO: depoimentos de EXEMPLO, só pra visualizar o layout. Troque por
// depoimentos reais de clientes e mude DEPOIMENTOS_SAO_EXEMPLOS pra false —
// enquanto for true, a seção só aparece em `npm run dev` e nunca no site no
// ar (depoimento inventado é propaganda enganosa).
const DEPOIMENTOS_SAO_EXEMPLOS = true;

// Fotos inteiras (caminhão atrás): x/y = posição do rosto na foto (% da
// largura/altura), zoom = largura da foto em relação ao círculo do avatar.
type FotoDepoimento = { src: string; x: number; y: number; zoom: number };

const DEPOIMENTOS: { nome: string; detalhe: string; texto: string; foto?: FotoDepoimento }[] = [
  {
    nome: "Carlos",
    foto: { src: "/Gemini_Generated_Image_2thg672thg672thg.jpg", x: 52, y: 40, zoom: 2.2 },
    detalhe: "Carreta 5 eixos · MT",
    texto: "Antes eu aceitava frete no olho. Agora confiro o lucro antes e já recusei viagem que ia me dar prejuízo.",
  },
  {
    nome: "Rogério",
    foto: { src: "/Gemini_Generated_Image_fneu1gfneu1gfneu.jpg", x: 57.5, y: 31, zoom: 6 },
    detalhe: "Truck · MG",
    texto: "Coloco o diesel e o pedágio da rota e em um minuto sei se vale a pena. Uso antes de fechar qualquer frete.",
  },
  {
    nome: "Marcos",
    foto: { src: "/download.jpg", x: 39, y: 37, zoom: 3.5 },
    detalhe: "Bitrem · PR",
    texto: "Comparar com o piso da ANTT me ajudou a negociar melhor com a transportadora.",
  },
];

// Sinais de confiança reais (não são depoimentos ou números de uso —
// evita alegar algo que ainda não é verdade sobre a base de clientes).
const CONFIANCA = [
  { icone: ShieldCheck, titulo: "Dados protegidos", descricao: "Seus dados em segurança" },
  { icone: Scale, titulo: "Baseado na tabela ANTT", descricao: "Compara com o piso mínimo" },
  { icone: CircleX, titulo: "Sem fidelidade", descricao: "Cancele quando quiser" },
];

// Rótulo azul com traço, acima do título de cada seção.
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
      {children}
      <span className="h-px w-10 bg-accent" />
    </p>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Hero com a foto do caminhão à direita e o texto à esquerda. */}
      <header className="relative overflow-hidden bg-navy">
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
              "linear-gradient(90deg, rgba(10,18,32,0.94) 0%, rgba(10,18,32,0.78) 45%, rgba(10,18,32,0.3) 100%)",
          }}
        />

        <div
          className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-5 pb-14 md:min-h-[600px] md:px-8 md:pb-24"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex items-center justify-between pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-boaviagem.png" alt="BoaViagem" className="h-6 w-auto md:h-7" />
            <Link
              href="/login"
              className="rounded-full border border-white/25 px-4 py-1.5 text-sm font-semibold text-white"
            >
              Entrar
            </Link>
          </div>

          <div className="flex flex-1 flex-col items-start justify-center gap-5 pt-10 md:pt-12">
            <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-tight text-white md:text-6xl">
              Não aceite frete
              <br />
              no <span className="text-accent">prejuízo.</span>
            </h1>

            {/* Limitado em largura pra não atravessar por cima do caminhão. */}
            <p className="max-w-[18rem] text-[15px] leading-relaxed text-white/80 md:max-w-md md:text-lg">
              Descubra em segundos quanto sobra no seu bolso depois de diesel, pedágio e manutenção.
            </p>

            <Link
              href="/login"
              className="mt-1 inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(47,111,237,0.35)]"
            >
              <Calculator size={18} strokeWidth={2} />
              Ver meu lucro agora
              <ArrowRight size={18} strokeWidth={2} />
            </Link>

            {/* Texto de apoio — ajustado pro fluxo real (exige login) */}
            <div className="flex items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <Smartphone size={14} strokeWidth={2} className="shrink-0" />
                Login rápido por celular
              </span>
              <span className="h-4 w-px bg-white/25" />
              <span className="flex items-center gap-1.5">
                <Zap size={14} strokeWidth={2} className="shrink-0" />
                Sem complicação
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-7 flex-1 overflow-hidden rounded-t-[28px] bg-bg shadow-sheet md:-mt-10 md:rounded-t-[40px]">
        {/* Sinais de confiança */}
        <section className="mx-auto max-w-5xl px-5 pb-8 pt-7 md:px-8 md:py-10">
          <div className="grid grid-cols-3 divide-x divide-divider">
            {CONFIANCA.map(({ icone: Icone, titulo, descricao }) => (
              <div key={titulo} className="flex flex-col items-center px-2 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-ink shadow-card">
                  <Icone size={22} strokeWidth={1.75} />
                </span>
                <p className="mt-3 text-sm font-bold leading-snug text-ink">{titulo}</p>
                <p className="mt-1 text-xs leading-snug text-ink-secondary">{descricao}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section className="bg-surface">
          <div className="mx-auto max-w-5xl px-5 py-10 md:grid md:grid-cols-2 md:items-start md:gap-12 md:px-8 md:py-16">
            <div>
              <Eyebrow>Como funciona</Eyebrow>
              <h2 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
                Simples, rápido e seguro.
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-secondary">
                Em poucos cliques, você descobre se o frete realmente vale a pena.
              </p>
            </div>

            <ol className="mt-6 md:mt-0">
              {PASSOS.map(({ numero, icone: Icone, titulo, descricao }) => (
                <li key={numero} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-base font-extrabold text-accent">
                    {numero}
                  </span>
                  <div
                    className={cn(
                      "flex flex-1 items-center gap-4 py-5",
                      numero > 1 && "border-t border-divider"
                    )}
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-bg text-ink">
                      <Icone size={24} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="text-[15px] font-bold text-ink">{titulo}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-secondary">{descricao}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mx-auto max-w-5xl px-5 pb-10 md:px-8 md:pb-16">
            <div className="relative overflow-hidden rounded-2xl bg-navy">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={encodeURI(HERO_IMAGE_SRC)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30"
                style={{ objectPosition: "center 85%" }}
              />
              <div className="relative flex items-center gap-4 px-5 py-5 md:px-8">
                <Truck size={28} strokeWidth={1.5} className="shrink-0 text-white/70" />
                <span className="h-9 w-0.5 shrink-0 rounded-full bg-accent" />
                <p className="text-sm leading-snug text-white/75">
                  <span className="block font-bold text-white">Mais controle hoje.</span>
                  Mais lucro amanhã.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-boaviagem.png" alt="" className="ml-auto h-4 w-auto opacity-80 md:h-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Prova social, ANTES da oferta. */}
        {!(DEPOIMENTOS_SAO_EXEMPLOS && process.env.NODE_ENV === "production") && (
          <section className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-16">
            <Eyebrow>Depoimentos</Eyebrow>
            <h2 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
              Quem usa, aprova
            </h2>
            <div className="mt-6 grid gap-3 md:mt-8 md:grid-cols-3 md:gap-4">
              {DEPOIMENTOS.map((depoimento) => (
                <figure
                  key={depoimento.nome}
                  className="flex flex-col rounded-2xl border border-divider bg-surface p-5"
                >
                  <div className="flex gap-0.5" aria-label="5 de 5 estrelas">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={14} strokeWidth={0} className="fill-amber-400" />
                    ))}
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink">
                    “{depoimento.texto}”
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-sm font-bold text-ink-secondary">
                      {depoimento.foto ? (
                        // Centraliza o rosto (x/y) no círculo, com a foto ampliada `zoom` vezes.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={depoimento.foto.src}
                          alt=""
                          className="absolute left-1/2 top-1/2 max-w-none"
                          style={{
                            width: `${depoimento.foto.zoom * 100}%`,
                            transform: `translate(-${depoimento.foto.x}%, -${depoimento.foto.y}%)`,
                          }}
                        />
                      ) : (
                        depoimento.nome[0]
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">{depoimento.nome}</p>
                      <p className="text-xs text-ink-secondary">{depoimento.detalhe}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Oferta. Preço e teste batem com /assinatura e com o checkout do
        Stripe (trial_period_days: 7); cancelar durante o teste encerra a
        assinatura na hora, sem cobrança. */}
        <section className="bg-surface">
          <div className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-16">
            <div className="md:text-center">
              <div className="md:flex md:justify-center">
                <Eyebrow>Assinatura</Eyebrow>
              </div>
              <h2 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
                Teste antes de pagar.
              </h2>
            </div>

            <div className="mx-auto mt-6 max-w-md rounded-3xl border border-divider bg-surface p-6 text-center shadow-card md:mt-8 md:p-8">
              <p className="text-sm font-semibold text-ink-secondary">Plano BoaViagem</p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight text-ink">7 dias grátis</p>
              <p className="mt-3 text-sm text-ink-secondary">
                Depois, <span className="text-xl font-extrabold text-ink">R$ 24,99</span>/mês
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-divider pt-5 text-left">
                {BENEFICIOS_PLANO.map((beneficio) => (
                  <li key={beneficio} className="flex items-center gap-2.5 text-sm text-ink">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {beneficio}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(47,111,237,0.25)]"
              >
                Testar grátis por 7 dias
                <ArrowRight size={18} strokeWidth={2} />
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-ink-secondary">
                Nenhuma cobrança nos 7 primeiros dias. Cancele quando quiser pelo app, sem fidelidade.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
