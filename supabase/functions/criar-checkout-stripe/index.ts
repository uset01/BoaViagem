// Cria uma Stripe Checkout Session (assinatura) pro usuário logado e devolve
// a URL pra redirecionar. Chamado pelo botão "Assinar agora" em /assinatura
// (e "Assinar novamente" em /perfil) via supabase.functions.invoke() — isso
// já manda o JWT do usuário logado no header Authorization automaticamente.
//
// "Verify JWT" deve ficar LIGADO no deploy (só usuário logado pode chamar).
//
// Secrets necessários (Dashboard > Edge Functions > Secrets):
//   STRIPE_SECRET_KEY — a Secret Key do Stripe (sk_test_... em teste,
//   sk_live_... em produção).
//
// Vantagem sobre a Cakto: dá pra mandar client_reference_id = id do usuário
// no Supabase direto no checkout, então o webhook casa o pagamento com a
// conta certa sem precisar comparar telefone.

import { createClient } from "jsr:@supabase/supabase-js@2";

const STRIPE_PRICE_ID = "price_1U1wMGFTJ0HEhGNUFeMyLR5Y"; // Plano BoaViagem, R$24,99/mês (modo live)

// O checkout precisa voltar pro MESMO domínio de onde saiu: o cookie de sessão
// vale por origem, então devolver quem entrou por boaviagem.app no domínio da
// Vercel derruba a sessão e joga a pessoa na tela de login depois de pagar.
// Allowlist em vez do Origin cru pra ninguém usar essa function pra mandar o
// usuário pro site dele depois do checkout.
const ORIGENS_PERMITIDAS = ["https://boaviagem.app", "https://boa-viagem.vercel.app"];
const APP_URL_PADRAO = "https://boaviagem.app";

function urlDoApp(req: Request): string {
  const origem = req.headers.get("Origin");
  return origem && ORIGENS_PERMITIDAS.includes(origem) ? origem : APP_URL_PADRAO;
}

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

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
  const appUrl = urlDoApp(req);

  const corpo = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": STRIPE_PRICE_ID,
    "line_items[0][quantity]": "1",
    "subscription_data[trial_period_days]": "7",
    client_reference_id: userData.user.id,
    success_url: `${appUrl}/assinatura?retorno=stripe`,
    cancel_url: `${appUrl}/assinatura`,
  });
  if (userData.user.email) corpo.set("customer_email", userData.user.email);

  const resposta = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${stripeSecretKey}:`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: corpo,
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    console.error("[criar-checkout-stripe] erro do Stripe:", JSON.stringify(dados));
    return respostaJson({ error: "Não foi possível iniciar o checkout. Tente novamente." }, 502);
  }

  return respostaJson({ url: dados.url }, 200);
});
