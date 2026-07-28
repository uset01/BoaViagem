import type { BottomNavItem } from "@/components/ui/BottomNav";
import { HistoryIcon, SummaryIcon, TruckIcon } from "@/components/icons";

export const NAV_ITEMS: BottomNavItem[] = [
  { key: "calcular", label: "Calcular", icon: <TruckIcon />, href: "/calcular" },
  { key: "historico", label: "Histórico", icon: <HistoryIcon />, href: "/historico" },
  { key: "resumo", label: "Resumo", icon: <SummaryIcon />, href: "/resumo" },
];
