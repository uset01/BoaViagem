// Cria uma sessão do Stripe Billing Portal (onde o usuário troca cartão, vê
// faturas, etc.) pro usuário logado e devolve a URL. Chamado pelo botão
// "Gerenciar assinatura" em /perfil via supabase.functions.invoke().
//
// "Verify JWT" deve ficar LIGADO no deploy (só usuário logado pode chamar).
//
// Secrets necessários: STRIPE_SECRET_KEY (mesma das outras functions).

import { createClient } from "jsr:@supabase/supabase-js@2";

const APP_URL = "https://boa-viagem.vercel.app";

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

  const supabaseUsuario = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabaseUsuario.auth.getUser();
  if (userError || !userData?.user) {
    return respostaJson({ error: "Não autenticado." }, 401);
  }

  const { data: usuario } = await supabaseUsuario
    .from("usuarios")
    .select("stripe_customer_id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!usuario?.stripe_customer_id) {
    return respostaJson({ error: "Nenhuma assinatura Stripe encontrada pra essa conta." }, 400);
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
  const resposta = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${stripeSecretKey}:`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      customer: usuario.stripe_customer_id,
      return_url: `${APP_URL}/perfil`,
    }),
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    console.error("[criar-portal-stripe] erro do Stripe:", JSON.stringify(dados));
    return respostaJson({ error: "Não foi possível abrir o portal. Tente novamente." }, 502);
  }

  return respostaJson({ url: dados.url }, 200);
});
