import { cn } from "@/lib/utils";

// Filtros calibrados pixel a pixel contra os tokens de cor — ver
// lib/calculo-custos.ts pra origem dos ícones. Reutilize este componente em
// qualquer tela que mostre tipo de caminhão (histórico, resumo etc.) pra
// manter o mesmo tratamento.
// Ativo: tinge de --accent (#2F6FED). Inativo: escurece o cinza nativo (que
// ficava quase invisível sobre --surface-muted) até perto de --ink-secondary
// no preenchimento e --ink no contorno.
const ACCENT_TINT_FILTER = "grayscale(1) brightness(0.44) sepia(1) hue-rotate(172deg) saturate(4.6)";
const INACTIVE_DARK_FILTER = "brightness(0.5)";

interface TruckTypeIconProps {
  src: string;
  alt?: string;
  active?: boolean;
  className?: string;
}

export function TruckTypeIcon({ src, alt = "", active = false, className }: TruckTypeIconProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-7 w-7 object-contain", className)}
      style={{ filter: active ? ACCENT_TINT_FILTER : INACTIVE_DARK_FILTER }}
    />
  );
}
