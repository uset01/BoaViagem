// Recebe o webhook da Cakto (assinatura confirmada / cancelada / pagamento
// falho) e atualiza usuarios.plano de acordo.
//
// Contrato confirmado contra um evento real de teste (27/07/2026) e contra
// GET https://api.cakto.com.br/public_api/webhook/ (API oficial da Cakto,
// autenticada via OAuth2 client_credentials em
// https://api.cakto.com.br/public_api/token/) — os nomes de evento abaixo
// são os `custom_id` reais retornados pela API pro webhook "Boa Viagem":
//   pix_gerado, purchase_approved, subscription_canceled,
//   subscription_renewed, subscription_created, subscription_renewal_refused
//   {
//     "secret": "<gerado pela Cakto>",
//     "event": "subscription_created",
//     "data": {
//       "customer": { "phone": "34999999999", ... },  // sem "55" na frente
//       "subscription": { "id": "...", "status": "active", ... },
//       "status": "paid",
//       ...
//     }
//   }
//
// Não existe nenhum campo de "referência externa" nesse payload — a Cakto
// não dá um jeito de anexar o auth.users.id do Supabase ao checkout (pelo
// menos não nesse formato). Por enquanto, telefone é o único jeito de casar
// o webhook com o usuário certo.
//
// Pagamento sem conta prévia no app: quando o telefone não bate com
// nenhuma linha em usuarios E o evento é de ativação (pagamento aprovado),
// a conta é criada aqui mesmo via Admin API (supabase.auth.admin.createUser)
// e já nasce com plano "ativo" — assim, quando essa pessoa fizer login por
// SMS depois com o mesmo número, cai direto na conta já paga, sem precisar
// ter aberto o app antes de pagar.
//
// Deploy: cole esse arquivo no editor da function no Dashboard
// (Edge Functions > cakto-webhook), com "Verify JWT" DESLIGADO — quem chama
// aqui é a Cakto, não um usuário logado no app.
//
// Segredo: a Cakto GERA o valor dela mesma (campo "Chave secreta do
// webhook" nas configurações do webhook, no painel deles) — não é pra
// inventar um valor. Copie o valor de lá pro secret CAKTO_WEBHOOK_SECRET
// (Dashboard > Edge Functions > Secrets).

import { createClient } from "jsr:@supabase/supabase-js@2";

const CAMPO_SEGREDO = "secret";
const CAMPO_EVENTO = "event";
const CAMPO_TELEFONE_CLIENTE = "data.customer.phone";
const CAMPO_SUBSCRIPTION_ID = "data.subscription.id";

// Confirmado via API (GET /public_api/webhook/) — esses são os `custom_id`
// reais dos eventos habilitados no webhook "Boa Viagem". "pix_gerado" fica
// de fora de propósito: gerar um QR code não é pagamento confirmado, não
// deve liberar acesso.
const EVENTOS_PARA_PLANO: Record<string, "ativo" | "cancelado"> = {
  purchase_approved: "ativo",
  subscription_created: "ativo",
  subscription_renewed: "ativo",
  subscription_canceled: "cancelado",
  subscription_renewal_refused: "cancelado",
};

function pegarCampo(payload: unknown, caminho: string): string | undefined {
  const valor = caminho
    .split(".")
    .reduce<unknown>(
      (atual, chave) => (atual && typeof atual === "object" ? (atual as Record<string, unknown>)[chave] : undefined),
      payload
    );
  return typeof valor === "string" ? valor : undefined;
}

// A Cakto manda o telefone sem código do país ("34999999999"), mas o
// Supabase guarda com ele ("5534999999999"). Normaliza pros últimos 11
// dígitos (DDD + número) pra poder comparar os dois formatos possíveis.
function ultimosDigitos(telefone: string): string {
  return telefone.replace(/\D/g, "").slice(-11);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload) return new Response("Payload inválido", { status: 400 });

  console.log("[cakto-webhook] payload recebido:", JSON.stringify(payload));

  const segredoEsperado = Deno.env.get("CAKTO_WEBHOOK_SECRET");
  const segredoRecebido = pegarCampo(payload, CAMPO_SEGREDO);
  if (segredoEsperado && segredoRecebido !== segredoEsperado) {
    console.error("[cakto-webhook] segredo inválido");
    return new Response("Assinatura inválida", { status: 401 });
  }

  const evento = pegarCampo(payload, CAMPO_EVENTO);
  const novoPlano = evento ? EVENTOS_PARA_PLANO[evento] : undefined;
  if (!novoPlano) {
    console.log("[cakto-webhook] evento não mapeado, ignorando:", evento);
    return new Response("ok (evento ignorado)", { status: 200 });
  }

  const telefoneCliente = pegarCampo(payload, CAMPO_TELEFONE_CLIENTE);
  const subscriptionId = pegarCampo(payload, CAMPO_SUBSCRIPTION_ID);

  if (!telefoneCliente) {
    console.error("[cakto-webhook] payload sem telefone do cliente, não dá pra identificar o usuário");
    return new Response("Telefone do cliente ausente", { status: 400 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const digitos = ultimosDigitos(telefoneCliente);
  const semCodigoPais = digitos;
  const comCodigoPais = `55${digitos}`;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id")
    .or(`telefone.eq.${semCodigoPais},telefone.eq.${comCodigoPais}`)
    .maybeSingle();

  let usuarioId = usuario?.id;

  if (!usuarioId) {
    // Sem conta ainda: só faz sentido criar uma pra evento de ATIVAÇÃO
    // (pagamento de verdade). Pra evento de cancelamento sem conta
    // correspondente não há o que fazer — só loga e ignora.
    if (novoPlano !== "ativo") {
      console.log(
        "[cakto-webhook] evento de cancelamento sem conta correspondente, ignorando:",
        telefoneCliente
      );
      return new Response("ok (sem conta pra cancelar)", { status: 200 });
    }

    const { data: criado, error: erroCriar } = await supabase.auth.admin.createUser({
      phone: comCodigoPais,
      phone_confirm: true,
    });

    if (erroCriar || !criado?.user) {
      console.error("[cakto-webhook] falha ao criar conta pro telefone", comCodigoPais, ":", erroCriar);
      return new Response("Erro ao criar usuário", { status: 500 });
    }

    console.log("[cakto-webhook] conta criada automaticamente pro telefone:", comCodigoPais);
    usuarioId = criado.user.id;
  }

  // Upsert (não update): se a trigger handle_new_user já inseriu a linha
  // (conta recém-criada acima) ou se ela já existia, os dois casos viram
  // uma atualização; só falha esse insert se a trigger não existir/rodar.
  const { error } = await supabase.from("usuarios").upsert(
    {
      id: usuarioId,
      telefone: comCodigoPais,
      plano: novoPlano,
      ...(subscriptionId ? { cakto_subscription_id: subscriptionId } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("[cakto-webhook] erro ao atualizar usuário:", error);
    return new Response("Erro ao atualizar", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
