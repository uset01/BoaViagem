// Cancela a assinatura do usuário logado no Stripe e marca o plano como
// "cancelado" no Supabase. Chamado pelo botão "Cancelar assinatura" em
// /perfil via supabase.functions.invoke() — isso já manda o JWT do usuário
// logado no header Authorization automaticamente.
//
// Diferente dos webhooks: essa function é chamada pelo NOSSO app, por
// um usuário logado — "Verify JWT" deve ficar LIGADO no deploy (padrão).
//
// Cancela IMEDIATAMENTE (não espera o fim do período já pago) — mesmo
// comportamento que tinha com a Cakto. Se preferir deixar o acesso até o
// fim do período pago, trocar o DELETE abaixo por um update com
// cancel_at_period_end=true.
//
// Precisa do secret STRIPE_SECRET_KEY (mesmo das outras functions Stripe).

import { createClient } from "jsr:@supabase/supabase-js@2";

// Chamado pelo navegador (supabase.functions.invoke) — precisa responder o
// preflight CORS (OPTIONS) antes do POST de verdade, senão o navegador nunca
// chega a mandar o POST. Sem isso, toda chamada falha silenciosamente.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respostaJson(corpo: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
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
    .select("stripe_subscription_id, plano, is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();

  // Conta admin: simula o botão funcionando (pra testar o fluxo/UI quantas
  // vezes quiser) sem chamar o Stripe de verdade e sem alterar o `plano` —
  // is_admin já libera o acesso independente disso, então não há nada real
  // pra "desfazer" depois.
  if (usuario?.is_admin) {
    return respostaJson({ status: "cancelado" }, 200);
  }

  if (!usuario?.stripe_subscription_id) {
    return respostaJson({ error: "Nenhuma assinatura encontrada pra cancelar." }, 400);
  }
  if (usuario.plano === "cancelado") {
    return respostaJson({ error: "Assinatura já está cancelada." }, 400);
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const resposta = await fetch(
      `https://api.stripe.com/v1/subscriptions/${usuario.stripe_subscription_id}`,
      { method: "DELETE", headers: { Authorization: `Basic ${btoa(`${stripeSecretKey}:`)}` } }
    );

    if (!resposta.ok) {
      const corpo = await resposta.text();
      console.error("[cancelar-assinatura] erro do Stripe:", resposta.status, corpo);
      return respostaJson({ error: "Não foi possível cancelar no Stripe. Tente novamente." }, 502);
    }
  } catch (erro) {
    console.error("[cancelar-assinatura] erro:", erro);
    return respostaJson({ error: "Erro ao conectar com o Stripe." }, 500);
  }

  // Atualiza otimisticamente — o webhook customer.subscription.deleted
  // também vai confirmar isso depois, mas não faz sentido esperar ele pra
  // dar feedback pro usuário. Precisa do service_role porque o usuário não
  // pode mais alterar o próprio `plano` diretamente (RLS só permite leitura).
  const supabaseServico = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error: updateError } = await supabaseServico
    .from("usuarios")
    .update({ plano: "cancelado", updated_at: new Date().toISOString() })
    .eq("id", userData.user.id);

  if (updateError) {
    console.error("[cancelar-assinatura] cancelado no Stripe mas erro ao atualizar Supabase:", updateError);
  }

  return respostaJson({ status: "cancelado" }, 200);
});
