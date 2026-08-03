import type { ReactNode } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_HEIGHT } from "./BottomNav";

// Troque esse caminho pra atualizar a foto em toda tela.
// Exportada pra também ser reaproveitada na landing pública (app/page.tsx).
export const TOP_BAND_IMAGE_SRC = "/ChatGPT Image 2 de ago. de 2026, 14_42_57.png";
const TOP_BAND_IMAGE_POSITION = "center 32%";
const TOP_BAND_HEIGHT = 130;
const TOP_BAND_FADE_HEIGHT = 46;

const HERO_IMAGE_POSITION = "center 60%";
const HERO_HEIGHT = 260;
const HERO_SHEET_OFFSET = 130;
const HERO_TITLE_BLOCK_HEIGHT = 100;

// Nome de marca mostrado no topo de toda tela com hero — fica só aqui pra
// não duplicar esse texto em cada página; troque nesse único lugar.
const APP_BRAND_NAME = "BoaViagem";

interface ScreenShellProps {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
  /** Quando informado, troca a faixa decorativa pequena por um hero grande
   * (foto + gradiente escuro) com esse texto sobreposto e a sheet subindo
   * por cima da parte de baixo da foto. */
  heroTitle?: string;
  heroEyebrow?: string;
  /** Mostra o nome do app no topo do hero. Só tem efeito com heroTitle. */
  showBrand?: boolean;
  /** Mostra a faixa decorativa com a foto no modo sem hero. Default true. */
  showTopBand?: boolean;
  /** Mostra o atalho pra /perfil no canto do hero. Só tem efeito com heroTitle. */
  showProfileLink?: boolean;
  /** Espaço extra (px) entre a marca e o bloco do título, empurrando o
   * título pra baixo dentro da foto. Só tem efeito com heroTitle. Default 0
   * (mesmo respiro já calibrado em /calcular). */
  heroTitleTopOffset?: number;
}

export function ScreenShell({
  children,
  showNav = false,
  className,
  heroTitle,
  heroEyebrow,
  showBrand = true,
  showTopBand = true,
  showProfileLink = true,
  heroTitleTopOffset = 0,
}: ScreenShellProps) {
  const contentArea = (
    <div
      className={cn("flex-1", className)}
      style={
        showNav
          ? { paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))` }
          : undefined
      }
    >
      {children}
    </div>
  );

  if (heroTitle) {
    return (
      <div className="relative flex min-h-screen flex-col bg-bg">
        <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: HERO_HEIGHT }}>
          <img
            src={encodeURI(TOP_BAND_IMAGE_SRC)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: HERO_IMAGE_POSITION }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.55) 100%)",
            }}
          />
          {/* Camada extra bem sutil (máx. 5% de preto) por cima de toda a
          foto — só pra integrar um pouco mais com o resto da UI, sem afetar
          a legibilidade que o gradiente acima já garante. */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 100%)",
            }}
          />
          {showBrand && (
            <div
              className="absolute inset-x-0 top-0 z-10 flex justify-center px-5"
              style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
              <span className="pt-3 text-base font-semibold text-white">{APP_BRAND_NAME}</span>
            </div>
          )}

          {showProfileLink && (
            <div
              className="absolute inset-x-0 top-0 z-20 flex justify-end px-5"
              style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
              <Link
                href="/perfil"
                aria-label="Conta e assinatura"
                className="mt-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/35"
              >
                <Settings size={17} strokeWidth={2} />
              </Link>
            </div>
          )}

          <div
            className="absolute inset-x-0 z-10 flex flex-col items-center justify-end px-5 pb-3 text-center"
            style={{
              top: heroTitleTopOffset,
              height: HERO_TITLE_BLOCK_HEIGHT,
              paddingTop: heroTitleTopOffset === 0 ? "env(safe-area-inset-top)" : undefined,
            }}
          >
            {heroEyebrow && (
              <span className="mb-1.5 inline-block w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {heroEyebrow}
              </span>
            )}
            <h1 className="text-2xl font-extrabold leading-tight text-white">{heroTitle}</h1>
          </div>
        </div>

        <div
          className="relative z-10 flex flex-1 flex-col rounded-t-[28px] bg-bg shadow-sheet"
          style={{ marginTop: HERO_SHEET_OFFSET }}
        >
          {contentArea}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg pt-[env(safe-area-inset-top)]">
      {showTopBand && (
        <div className="relative shrink-0 overflow-hidden" style={{ height: TOP_BAND_HEIGHT }}>
          <img
            src={encodeURI(TOP_BAND_IMAGE_SRC)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: TOP_BAND_IMAGE_POSITION }}
          />
          <div className="absolute inset-0" style={{ background: "rgba(15, 30, 60, 0.38)" }} />
          <div
            className="absolute inset-x-0 bottom-0 bg-band-bottom-fade"
            style={{ height: TOP_BAND_FADE_HEIGHT }}
          />
        </div>
      )}

      {contentArea}
    </div>
  );
}
