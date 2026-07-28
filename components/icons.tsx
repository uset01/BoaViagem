import {
  Home,
  Truck,
  Wallet,
  User,
  Fuel,
  Milestone,
  Wrench,
  UtensilsCrossed,
  History,
  ChartColumn,
  Trash2,
  Route,
  TriangleAlert,
} from "lucide-react";

// Wrappers finos sobre lucide-react — mantêm o mesmo nome/significado dos
// ícones originais, só padronizando fonte, espessura de traço (2) e tamanho
// por contexto: 20px dentro de <IconCircle>, 24px na BottomNav.
// Cor segue currentColor (herda de --ink-secondary / --accent do elemento pai).

export function HomeIcon() {
  return <Home size={24} strokeWidth={2} />;
}

export function TruckIcon() {
  return <Truck size={24} strokeWidth={2} />;
}

export function WalletIcon() {
  return <Wallet size={24} strokeWidth={2} />;
}

export function UserIcon() {
  return <User size={24} strokeWidth={2} />;
}

export function HistoryIcon() {
  return <History size={24} strokeWidth={2} />;
}

export function SummaryIcon() {
  return <ChartColumn size={24} strokeWidth={2} />;
}

export function FuelIcon() {
  return <Fuel size={20} strokeWidth={2} />;
}

// Pedágio: lucide não tem um ícone literal de "cabine de pedágio", Milestone
// (marco de estrada) é o mais próximo pro conceito de ponto de cobrança na via.
export function TollIcon() {
  return <Milestone size={20} strokeWidth={2} />;
}

export function WrenchIcon() {
  return <Wrench size={20} strokeWidth={2} />;
}

export function FoodIcon() {
  return <UtensilsCrossed size={20} strokeWidth={2} />;
}

export function RouteIcon() {
  return <Route size={20} strokeWidth={2} />;
}

export function TrashIcon() {
  return <Trash2 size={18} strokeWidth={2} />;
}

export function AlertTriangleIcon() {
  return <TriangleAlert size={18} strokeWidth={2} />;
}
