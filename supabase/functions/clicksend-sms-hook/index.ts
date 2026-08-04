// "Send SMS Hook" do Supabase Auth — chamado toda vez que o GoTrue precisa
// mandar um código de OTP por telefone (login em /login). Em vez de usar um
// dos provedores nativos do Supabase (Twilio, Twilio Verify, MessageBird,
// Vonage), essa função manda o SMS de verdade via API do ClickSend.
//
// ATENÇÃO — contrato do hook não confirmado contra um payload real ainda:
// o formato abaixo (`user.phone` + `sms.otp`, verificação de assinatura via
// Standard Webhooks) é a estrutura documentada pelo Supabase pra Auth Hooks
// HTTP, mas nesse projeto tanto o payload da Cakto quanto o do Twilio só
// bateram certo depois de ver um evento real chegando — é bem possível que
// essa função precise do mesmo ajuste. O `console.log` do payload cru fica
// de propósito pra facilitar isso.
//
// Configuração necessária:
// 1. Supabase Dashboard > Authentication > Hooks > "Send SMS hook" >
//    escolher "HTTPS" e colar a URL dessa function. O Supabase gera um
//    Signing Secret nessa tela (começa com "v1,whsec_...") — copiar só a
//    parte "whsec_..." pro secret SEND_SMS_HOOK_SECRET.
// 2. Secrets da function (Dashboard > Edge Functions > Secrets):
//    - SEND_SMS_HOOK_SECRET: o signing secret do passo 1.
//    - CLICKSEND_USERNAME: usuário da API do ClickSend.
//    - CLICKSEND_API_KEY: API Key do ClickSend.
// 3. Deploy com "Verify JWT" DESLIGADO — quem chama aqui é o próprio
//    Supabase Auth via o hook, não um usuário logado com JWT normal (a
//    autenticação é a assinatura Standard Webhooks verificada abaixo).

const CLICKSEND_URL = "https://rest.clicksend.com/v3/sms/send";

async function verificarAssinatura(req: Request, corpoCru: string): Promise<boolean> {
  const segredo = Deno.env.get("SEND_SMS_HOOK_SECRET");
  if (!segredo) {
    console.error("[clicksend-sms-hook] SEND_SMS_HOOK_SECRET não configurado — recusando por segurança");
    return false;
  }

  const id = req.headers.get("webhook-id");
  const timestamp = req.headers.get("webhook-timestamp");
  const assinaturaHeader = req.headers.get("webhook-signature");
  if (!id || !timestamp || !assinaturaHeader) {
    console.error("[clicksend-sms-hook] faltando headers de assinatura (webhook-id/timestamp/signature)");
    return false;
  }

  const segredoBase64 = segredo.startsWith("whsec_") ? segredo.slice("whsec_".length) : segredo;
  const chaveBytes = Uint8Array.from(atob(segredoBase64), (c) => c.charCodeAt(0));
  const chave = await crypto.subtle.importKey("raw", chaveBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  const conteudoAssinado = `${id}.${timestamp}.${corpoCru}`;
  const assinaturaBuffer = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(conteudoAssinado));
  const assinaturaCalculada = btoa(String.fromCharCode(...new Uint8Array(assinaturaBuffer)));

  // O header pode trazer mais de uma assinatura separada por espaço
  // ("v1,assinaturaA v1,assinaturaB") — basta uma bater.
  return assinaturaHeader
    .split(" ")
    .some((parte) => parte.split(",")[1] === assinaturaCalculada);
}

function pegarCampo(payload: unknown, caminho: string): string | undefined {
  const valor = caminho
    .split(".")
    .reduce<unknown>(
      (atual, chave) => (atual && typeof atual === "object" ? (atual as Record<string, unknown>)[chave] : undefined),
      payload
    );
  return typeof valor === "string" ? valor : undefined;
}

function paraE164(telefone: string): string {
  return telefone.startsWith("+") ? telefone : `+${telefone.replace(/\D/g, "")}`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const corpoCru = await req.text();
  console.log("[clicksend-sms-hook] payload recebido:", corpoCru);

  const assinaturaOk = await verificarAssinatura(req, corpoCru);
  if (!assinaturaOk) {
    return new Response(JSON.stringify({ error: { http_code: 401, message: "Assinatura inválida" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = JSON.parse(corpoCru);
  const telefone = pegarCampo(payload, "user.phone");
  const codigo = pegarCampo(payload, "sms.otp");

  if (!telefone || !codigo) {
    console.error("[clicksend-sms-hook] payload sem telefone ou código — verificar formato real no log acima");
    return new Response(
      JSON.stringify({ error: { http_code: 400, message: "Payload sem telefone ou código" } }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const username = Deno.env.get("CLICKSEND_USERNAME")!;
  const apiKey = Deno.env.get("CLICKSEND_API_KEY")!;
  const autenticacao = btoa(`${username}:${apiKey}`);

  const respostaClickSend = await fetch(CLICKSEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${autenticacao}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          source: "boa-viagem-app",
          body: `Seu código BoaViagem: ${codigo}`,
          to: paraE164(telefone),
        },
      ],
    }),
  });

  const resultado = await respostaClickSend.json().catch(() => null);
  console.log("[clicksend-sms-hook] resposta do ClickSend:", JSON.stringify(resultado));

  const mensagemEnviada = resultado?.data?.messages?.[0];
  const sucesso = respostaClickSend.ok && mensagemEnviada?.status !== "FAILED";

  if (!sucesso) {
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: mensagemEnviada?.status ?? "Falha ao enviar SMS pelo ClickSend",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
});
