// Cancela a assinatura do usuário logado na Cakto e marca o plano como
// "cancelado" no Supabase. Chamado pelo botão "Cancelar assinatura" em
// /perfil via supabase.functions.invoke() — isso já manda o JWT do usuário
// logado no header Authorization automaticamente.
//
// Diferente do cakto-webhook: essa function é chamada pelo NOSSO app, por
// um usuário logado — "Verify JWT" deve ficar LIGADO no deploy (padrão).
//
// Precisa de dois secrets novos (Dashboard > Edge Functions > Secrets):
//   CAKTO_CLIENT_ID
//   CAKTO_CLIENT_SECRET
// (as mesmas credenciais usadas pra consultar a API da Cakto)
//
// Endpoint da Cakto usado: POST /public_api/subscriptions/{id}/cancel/
// — cancelamento é definitivo, não existe endpoint de "descancelar".

import { createClient } from "jsr:@supabase/supabase-js@2";

const CAKTO_TOKEN_URL = "https://api.cakto.com.br/public_api/token/";

function respostaJson(corpo: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function obterTokenCakto(): Promise<string> {
  const clientId = Deno.env.get("CAKTO_CLIENT_ID")!;
  const clientSecret = Deno.env.get("CAKTO_CLIENT_SECRET")!;
  const resposta = await fetch(CAKTO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
  });
  if (!resposta.ok) throw new Error(`Falha ao autenticar na Cakto: ${resposta.status}`);
  const dados = await resposta.json();
  return dados.access_token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return respostaJson({ error: "Não autenticado." }, 401);

  // Cliente com a sessão do usuário logado (não service_role) — RLS
  // garante que ele só consegue ver/mexer na própria linha.
  const supabaseUsuario = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabaseUsuario.auth.getUser();
  if (userError || !userData?.user) {
    return respostaJson({ error: "Não autenticado." }, 401);
  }

  const { data: usuario } = await supabaseUsuario
    .from("usuarios")
    .select("cakto_subscription_id, plano, is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();

  // Conta admin: simula o botão funcionando (pra testar o fluxo/UI quantas
  // vezes quiser) sem chamar a Cakto de verdade e sem alterar o `plano" —
  // is_admin já libera o acesso independente disso, então não há nada real
  // pra "desfazer" depois.
  if (usuario?.is_admin) {
    return respostaJson({ status: "cancelado" }, 200);
  }

  if (!usuario?.cakto_subscription_id) {
    return respostaJson({ error: "Nenhuma assinatura encontrada pra cancelar." }, 400);
  }
  if (usuario.plano === "cancelado") {
    return respostaJson({ error: "Assinatura já está cancelada." }, 400);
  }

  try {
    const token = await obterTokenCakto();
    const resposta = await fetch(
      `https://api.cakto.com.br/public_api/subscriptions/${usuario.cakto_subscription_id}/cancel/`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );

    if (!resposta.ok) {
      const corpo = await resposta.text();
      console.error("[cancelar-assinatura] erro da Cakto:", resposta.status, corpo);
      return respostaJson({ error: "Não foi possível cancelar na Cakto. Tente novamente." }, 502);
    }
  } catch (erro) {
    console.error("[cancelar-assinatura] erro:", erro);
    return respostaJson({ error: "Erro ao conectar com a Cakto." }, 500);
  }

  // Atualiza otimisticamente — o webhook subscription_canceled também vai
  // confirmar isso depois, mas não faz sentido esperar ele pra dar feedback
  // pro usuário. Precisa do service_role porque o usuário não pode mais
  // alterar o próprio `plano` diretamente (RLS só permite leitura agora).
  const supabaseServico = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error: updateError } = await supabaseServico
    .from("usuarios")
    .update({ plano: "cancelado", updated_at: new Date().toISOString() })
    .eq("id", userData.user.id);

  if (updateError) {
    console.error("[cancelar-assinatura] cancelado na Cakto mas erro ao atualizar Supabase:", updateError);
  }

  return respostaJson({ status: "cancelado" }, 200);
});
