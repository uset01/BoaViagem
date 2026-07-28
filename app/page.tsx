import Link from "next/link";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";

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
    descricao: "Em segundos, o lucro real aparece antes de você aceitar o frete.",
  },
];

export default function LandingPage() {
  return (
    <ScreenShell
      heroTitle="Não aceite frete no prejuízo de novo."
      showProfileLink={false}
      heroTitleTopOffset={40}
    >
      <div className="space-y-8 px-5 pb-12 pt-6">
        <div className="space-y-5 text-center">
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            Antes de fechar a viagem, veja em segundos quanto você{" "}
            <strong className="font-bold text-ink">realmente</strong> ganha — já descontando diesel,
            pedágio e manutenção.
          </p>

          <Link
            href="/login"
            className="block w-full rounded-full bg-accent py-4 text-center text-base font-bold text-white shadow-card"
          >
            Calcular meu lucro agora
          </Link>
          <p className="text-xs text-ink-tertiary">Login rápido por celular</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-ink">Como funciona</h2>
          <div className="space-y-4">
            {PASSOS.map((passo) => (
              <div key={passo.numero} className="flex gap-3">
                <IconCircle
                  icon={<span className="text-sm font-bold">{passo.numero}</span>}
                  active
                />
                <div>
                  <p className="text-sm font-bold text-ink">{passo.titulo}</p>
                  <p className="text-sm text-ink-secondary">{passo.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Card padding="p-6" className="space-y-4 text-center">
          <div>
            <p className="text-sm font-semibold text-ink-secondary">Plano BoaViagem</p>
            <span className="mt-2 inline-block rounded-full bg-warning-bg px-3 py-1 text-xs font-bold text-warning-text">
              🔥 Oferta de lançamento
            </span>

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs font-bold text-danger">-29%</span>
              <span className="text-sm font-medium text-ink-tertiary line-through">R$ 34,99</span>
            </div>
            <p className="mt-1 text-4xl font-extrabold text-ink">
              R$ 24,99<span className="text-base font-medium text-ink-secondary">/mês</span>
            </p>
            <p className="mt-1 text-sm text-ink-secondary">Cancele quando quiser.</p>
            <p className="mt-2 text-xs font-semibold text-warning-text">
              Essa condição de lançamento pode acabar a qualquer momento.
            </p>
          </div>
          <Link
            href="/login"
            className="block w-full rounded-full bg-accent py-3.5 text-center text-sm font-bold text-white"
          >
            Começar agora
          </Link>
        </Card>
      </div>
    </ScreenShell>
  );
}
