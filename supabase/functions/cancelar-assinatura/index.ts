// Cancela a assinatura do usuário logado no Stripe e EXCLUI a conta
// inteira no Supabase (auth.users — cascateia pra usuarios, viagens e
// valores_medios via "on delete cascade" no schema). Chamado pelo botão
// "Cancelar assinatura" em /perfil via supabase.functions.invoke() — isso
// já manda o JWT do usuário logado no header Authorization automaticamente.
//
// Irreversível: perde todo o histórico de viagens junto com a assinatura.
// O sheet de confirmação em /perfil avisa isso antes de chamar aqui.
//
// Diferente dos webhooks: essa function é chamada pelo NOSSO app, por
// um usuário logado — "Verify JWT" deve ficar LIGADO no deploy (padrão).
//
// Cancela IMEDIATAMENTE no Stripe (não espera o fim do período já pago).
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
  // vezes quiser) sem chamar o Stripe de verdade e SEM excluir a conta —
  // senão toda conta usada pra testar esse botão se apagaria sozinha.
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

  // Exclui a conta inteira (precisa do service_role pra isso — Admin API).
  // A exclusão de auth.users cascateia pra usuarios, viagens e
  // valores_medios sozinha, via "on delete cascade" no schema.sql.
  const supabaseServico = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error: deleteError } = await supabaseServico.auth.admin.deleteUser(userData.user.id);

  if (deleteError) {
    console.error("[cancelar-assinatura] cancelado no Stripe mas erro ao excluir a conta:", deleteError);
    return respostaJson(
      { error: "Assinatura cancelada, mas houve um erro ao excluir sua conta. Fale com o suporte." },
      500
    );
  }

  return respostaJson({ status: "cancelado" }, 200);
});
