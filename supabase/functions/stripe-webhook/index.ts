// Recebe eventos do Stripe (assinatura paga / cancelada / renovação falhou)
// e atualiza usuarios.plano de acordo. Diferente do cakto-webhook, casa o
// evento com o usuário pelo client_reference_id (id do usuário no Supabase,
// mandado direto no checkout por criar-checkout-stripe) — não precisa
// comparar telefone.
//
// Configuração:
// 1. Stripe Dashboard > Developers > Webhooks > Add endpoint > cole a URL
//    dessa function > selecione os eventos:
//      checkout.session.completed
//      customer.subscription.updated
//      customer.subscription.deleted
// 2. O Stripe mostra um "Signing secret" (começa com "whsec_...") — copie
//    pro secret STRIPE_WEBHOOK_SECRET (Dashboard > Edge Functions > Secrets).
// 3. Também precisa do secret STRIPE_SECRET_KEY (mesma chave da function
//    criar-checkout-stripe).
// 4. Deploy com "Verify JWT" DESLIGADO — quem chama aqui é o Stripe, não um
//    usuário logado no app.

import { createClient } from "jsr:@supabase/supabase-js@2";

const EVENTOS_PARA_PLANO: Record<string, "ativo" | "cancelado"> = {
  active: "ativo",
  trialing: "ativo",
  canceled: "cancelado",
  unpaid: "cancelado",
  past_due: "cancelado",
  incomplete_expired: "cancelado",
};

async function verificarAssinaturaStripe(corpoCru: string, header: string, segredo: string): Promise<boolean> {
  const partes = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const timestamp = partes["t"];
  const assinaturaEsperada = partes["v1"];
  if (!timestamp || !assinaturaEsperada) return false;

  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const conteudoAssinado = `${timestamp}.${corpoCru}`;
  const assinaturaBuffer = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(conteudoAssinado));
  const assinaturaCalculada = Array.from(new Uint8Array(assinaturaBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return assinaturaCalculada === assinaturaEsperada;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const corpoCru = await req.text();
  const assinaturaHeader = req.headers.get("stripe-signature");
  const segredo = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!segredo || !assinaturaHeader || !(await verificarAssinaturaStripe(corpoCru, assinaturaHeader, segredo))) {
    console.error("[stripe-webhook] assinatura inválida");
    return new Response("Assinatura inválida", { status: 401 });
  }

  const evento = JSON.parse(corpoCru);
  console.log("[stripe-webhook] evento recebido:", evento.type);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (evento.type === "checkout.session.completed") {
    const session = evento.data.object;
    const usuarioId = session.client_reference_id;
    if (!usuarioId) {
      console.error("[stripe-webhook] checkout.session.completed sem client_reference_id");
      return new Response("ok (sem referência)", { status: 200 });
    }

    const { error } = await supabase
      .from("usuarios")
      .update({
        plano: "ativo",
        stripe_customer_id: session.customer ?? null,
        stripe_subscription_id: session.subscription ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", usuarioId);

    if (error) {
      console.error("[stripe-webhook] erro ao ativar usuário:", error);
      return new Response("Erro ao atualizar", { status: 500 });
    }
    return new Response("ok", { status: 200 });
  }

  if (evento.type === "customer.subscription.updated" || evento.type === "customer.subscription.deleted") {
    const subscription = evento.data.object;
    const novoPlano =
      evento.type === "customer.subscription.deleted" ? "cancelado" : EVENTOS_PARA_PLANO[subscription.status];

    if (!novoPlano) {
      console.log("[stripe-webhook] status de assinatura não mapeado, ignorando:", subscription.status);
      return new Response("ok (status ignorado)", { status: 200 });
    }

    const { error } = await supabase
      .from("usuarios")
      .update({ plano: novoPlano, updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("[stripe-webhook] erro ao atualizar assinatura:", error);
      return new Response("Erro ao atualizar", { status: 500 });
    }
    return new Response("ok", { status: 200 });
  }

  console.log("[stripe-webhook] evento não tratado, ignorando:", evento.type);
  return new Response("ok (evento ignorado)", { status: 200 });
});
